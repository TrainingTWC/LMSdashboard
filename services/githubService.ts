 // Configuration for GitHub CSV file
const GITHUB_CONFIG = {
  // GitHub raw file URL for your repository's CSV data
  CSV_URL: 'https://raw.githubusercontent.com/TrainingTWC/LMSdashboard/master/public/data/lms-completion.csv',
  
  // Fallback: Local CSV file (for development)
  LOCAL_CSV_URL: '/data/lms-completion.csv',
  
  // Timeout for requests (in milliseconds)
  TIMEOUT: 30000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

export interface TrainingRecord {
  employee_code: string;
  employee_name: string;
  email: string;
  employee_status: string;
  gender: string;
  date_of_joining: string;
  department: string;
  designation: string;
  reporting_manager_code: string;
  reporting_manager_name: string;
  course_category: string;
  course_name: string;
  course_type: string;
  course_end_date: string;
  enrollment_status: string;
  course_completion_hours: string;
  course_enrolment_date: string;
  course_completion_date: string;
  course_progress: string;
  course_completion_status: string;
  refresher_requirement: string;
  recurrence_date: string;
  refresher_status: string;
  months_to_expire: string;
  course_role: string;
  'Store ID': string;
}

/**
 * Fetches CSV data from GitHub repository with local fallback
 * @returns Promise<TrainingRecord[]> Array of training records
 */
export async function fetchTrainingDataFromGitHub(): Promise<TrainingRecord[]> {
  let lastError: Error | null = null;
  
  // Try GitHub raw file first
  const dataSources = [
    { name: 'GitHub Repository', url: GITHUB_CONFIG.CSV_URL },
    { name: 'Local CSV', url: GITHUB_CONFIG.LOCAL_CSV_URL }
  ];
  
  for (const source of dataSources) {
    for (let attempt = 1; attempt <= GITHUB_CONFIG.MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempting to fetch data from ${source.name} (attempt ${attempt}/${GITHUB_CONFIG.MAX_RETRIES})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GITHUB_CONFIG.TIMEOUT);
        
        const response = await fetch(source.url, {
          method: 'GET',
          headers: {
            'Accept': 'text/csv,text/plain,*/*',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`${source.name} request failed: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        if (!csvText || csvText.trim().length === 0) {
          throw new Error(`Empty CSV data received from ${source.name}`);
        }
        
        console.log(`✅ Successfully fetched CSV data from ${source.name}`);
        console.log(`Data size: ${csvText.length} characters`);
        
        // Parse CSV data
        const data = parseCSVData(csvText);
        
        console.log(`✅ Parsed ${data.length} training records from ${source.name}`);
        
        return data;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ ${source.name} attempt ${attempt} failed:`, error);
        
        if (attempt < GITHUB_CONFIG.MAX_RETRIES) {
          console.log(`⏳ Retrying ${source.name} in ${GITHUB_CONFIG.RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, GITHUB_CONFIG.RETRY_DELAY));
        }
      }
    }
    console.log(`❌ ${source.name} failed after ${GITHUB_CONFIG.MAX_RETRIES} attempts, trying next source...`);
  }
  
  throw new Error(`Failed to fetch data from GitHub after ${GITHUB_CONFIG.MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
}

/**
 * Parses CSV text data into TrainingRecord objects
 */
function parseCSVData(csvText: string): TrainingRecord[] {
  const lines = csvText.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    throw new Error('No data found in CSV');
  }
  
  // Parse header row
  const headers = parseCSVRow(lines[0]);
  
  if (headers.length === 0) {
    throw new Error('No headers found in CSV');
  }
  
  console.log('CSV Headers:', headers);
  
  // Parse data rows
  const records: TrainingRecord[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVRow(lines[i]);
      
      if (values.length === 0) continue; // Skip empty rows
      
      const record: any = {};
      
      // Map values to headers
      headers.forEach((header, index) => {
        const value = values[index] || '';
        record[header.trim()] = value.trim();
      });
      
      // Validate required fields
      if (record.employee_code && record.employee_name) {
        records.push(record as TrainingRecord);
      }
      
    } catch (error) {
      console.warn(`Skipping row ${i + 1} due to parsing error:`, error);
    }
  }
  
  if (records.length === 0) {
    throw new Error('No valid training records found in CSV data');
  }
  
  return records;
}

/**
 * Parses a single CSV row, handling quoted fields and commas
 */
function parseCSVRow(row: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Handle escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add final field
  values.push(current);
  
  return values;
}

/**
 * Tests the GitHub connection
 */
export async function testGitHubConnection(): Promise<{ success: boolean; message: string; recordCount?: number }> {
  try {
    const data = await fetchTrainingDataFromGitHub();
    
    return {
      success: true,
      message: `Successfully connected to GitHub! Found ${data.length} training records.`,
      recordCount: data.length
    };
    
  } catch (error) {
    console.error('GitHub connection test failed:', error);
    
    return {
      success: false,
      message: `Failed to connect to GitHub: ${(error as Error).message}`
    };
  }
}