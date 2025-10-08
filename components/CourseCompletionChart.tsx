
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import type { EmployeeTrainingRecord } from '../types';

interface ChartProps {
  data: EmployeeTrainingRecord[];
}

const CourseCompletionChart: React.FC<ChartProps> = ({ data }) => {
  const courseData = data.reduce((acc, record) => {
    const course = record.course_name || 'N/A';
    if (!acc[course]) {
      acc[course] = { total: 0, completed: 0 };
    }
    acc[course].total++;
    if (record.course_completion_status === 'Completed') {
      acc[course].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  const chartData = Object.keys(courseData).map(course => ({
    name: course,
    'Completion Rate': (courseData[course].completed / courseData[course].total) * 100,
  })).sort((a, b) => b['Completion Rate'] - a['Completion Rate']); // Sort from high to low

  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="p-2 bg-brand-primary/10 rounded-lg mr-3">
          <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Course Performance Analysis</h3>
      </div>
      <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-xl p-4" style={{ height: '450px', overflowY: 'auto', overflowX: 'hidden' }}>
        <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 45)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 60, left: 120, bottom: 5 }}
          >

            <XAxis type="number" stroke="#64748b" domain={[0, 100]} unit="%" fontSize={12} fontWeight={500} />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="#64748b" 
              width={150} 
              tick={{ fontSize: 11, fontWeight: 500 }} 
              interval={0} 
            />
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [`${value.toFixed(1)}% (${props.payload.completed}/${props.payload.total})`, 'Completion Rate']}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(10px)',
                borderColor: '#e2e8f0',
                borderRadius: '12px',
                color: '#1e293b'
              }}
              cursor={{fill: 'rgba(20, 184, 166, 0.1)'}}
            />
            <Bar dataKey="Completion Rate" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => {
                const rate = entry['Completion Rate'];
                let fillColor = '#ef4444'; // Red for low (default)
                if (rate >= 80) fillColor = '#10b981'; // Green for high
                else if (rate >= 60) fillColor = '#f59e0b'; // Amber for medium
                return <Cell key={`cell-${index}`} fill={fillColor} />;
              })}
              <LabelList 
                dataKey="Completion Rate" 
                position="right" 
                formatter={(value: number) => `${value.toFixed(1)}%`} 
                fontSize={11} 
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CourseCompletionChart;
