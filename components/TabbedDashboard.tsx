import React, { useState } from 'react';
import type { EmployeeTrainingRecord, MergedData } from '../types';
import Dashboard from './Dashboard';
import EmployeeDashboard from './EmployeeDashboard';

interface TabbedDashboardProps {
  data: (EmployeeTrainingRecord | MergedData)[];
  fileName: string;
  isMerged: boolean;
}

type TabType = 'overview' | 'employee';

const TabbedDashboard: React.FC<TabbedDashboardProps> = ({ data, fileName, isMerged }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    {
      id: 'overview' as TabType,
      name: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'Analytics & Charts'
    },
    {
      id: 'employee' as TabType,
      name: 'Emp. Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      description: 'Employee Details'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Compact Tab Navigation */}
        <div className="mb-8">
          <div className="flex items-center gap-1 p-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm inline-flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }
                `}
              >
                <span className="w-4 h-4">
                  {tab.icon}
                </span>
                <div className="flex flex-col items-start">
                  <span className="font-semibold leading-tight">{tab.name}</span>
                  <span className={`text-xs leading-tight ${
                    activeTab === tab.id ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {tab.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'overview' && (
            <div className="animate-in fade-in duration-400">
              <Dashboard data={data} fileName={fileName} isMerged={isMerged} />
            </div>
          )}
          
          {activeTab === 'employee' && (
            <div className="animate-in fade-in duration-400">
              <EmployeeDashboard data={data} fileName={fileName} isMerged={isMerged} />
            </div>
          )}
        </div>

        {/* Data Info Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-full border border-slate-200/50 dark:border-slate-700/50">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {fileName} • {data.length} records • {isMerged ? 'Enhanced with store data' : 'Basic training data'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabbedDashboard;