// scripts/generate-insights.js
// This script runs in GitHub Actions to pre-generate AI insights

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateInsights() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    process.exit(1);
  }

  try {
    // Read your training data
    const dataPath = path.join(__dirname, '../public/data/training-data.json');
    
    if (!fs.existsSync(dataPath)) {
      console.log('⚠️ No training data found, skipping insights generation');
      return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // Generate summary (same logic as geminiService.ts)
    const summary = createSummary(data);
    
    const prompt = `
      As an expert data analyst specializing in Learning & Development, analyze the following employee training data summary.

      Data Summary:
      ${JSON.stringify(summary, null, 2)}

      Based on this summary, provide:
      1. **A brief, high-level overview** of the training program's health.
      2. **Key Insights & Observations:** Identify top-performing and lowest-performing groups.
      3. **Actionable Recommendations:** Suggest 2-3 specific, actionable steps to improve training completion rates.

      Format your response clearly with headings for each section. Be concise and professional. Use markdown formatting.
    `;

    console.log('🤖 Calling Gemini API...');
    
    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const insights = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No insights generated';

    // Save insights to public folder
    const outputPath = path.join(__dirname, '../public/insights.json');
    const outputDir = path.dirname(outputPath);
    
    // Create public directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created directory: ${outputDir}`);
    }
    
    fs.writeFileSync(outputPath, JSON.stringify({
      insights,
      generatedAt: new Date().toISOString(),
      summary
    }, null, 2));

    console.log('✅ Insights generated successfully!');
    console.log(`📁 Saved to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error generating insights:', error);
    process.exit(1);
  }
}

function createSummary(data) {
  const totalRecords = data.length;
  const completedCount = data.filter(d => d.course_completion_status === 'Completed').length;
  const completionRate = totalRecords > 0 ? (completedCount / totalRecords) * 100 : 0;

  const departments = [...new Set(data.map(d => d.department))].filter(Boolean);
  const departmentCompletion = departments.map(dept => {
    const deptRecords = data.filter(d => d.department === dept);
    const deptCompleted = deptRecords.filter(d => d.course_completion_status === 'Completed').length;
    const deptRate = deptRecords.length > 0 ? (deptCompleted / deptRecords.length) * 100 : 0;
    return { 
      department: dept, 
      completionRate: deptRate.toFixed(1) + '%', 
      total: deptRecords.length 
    };
  });

  return {
    totalEnrollments: totalRecords,
    overallCompletionRate: completionRate.toFixed(1) + '%',
    departmentPerformance: departmentCompletion.sort((a, b) => 
      parseFloat(b.completionRate) - parseFloat(a.completionRate)
    ),
    generatedAt: new Date().toISOString()
  };
}

// Run the script
generateInsights();
