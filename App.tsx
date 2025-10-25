import React, { useState, useEffect } from 'react';
import { csvParse } from 'd3-dsv';
import type { EmployeeTrainingRecord, MergedData, StoreRecord } from './types';
import TabbedDashboard from './components/TabbedDashboard';
import EmployeeView from './components/EmployeeView';
import ManagerView from './components/ManagerView';
import TrainerView from './components/TrainerView';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import { Spinner } from './components/Spinner';
import { storeMappingData } from './data/storeMapping';
import ThemeToggle from './components/ThemeToggle';
import { dataPersistenceService } from './services/dataPersistenceService';
import { githubUploadService } from './services/githubUploadService';
import { getConfigurationStatus } from './services/dataService';


const App: React.FC = () => {
  const [data, setData] = useState<(EmployeeTrainingRecord | MergedData)[] | null>(null);
  const [isMerged, setIsMerged] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('Local CSV Data');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<'googleSheets' | 'none'>('none');
  const [userRole, setUserRole] = useState<'employee' | 'manager' | 'trainer' | 'admin' | 'not-found'>('admin');
  const [userId, setUserId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check localStorage for saved theme preference, default to light
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  // Apply theme changes without reloading data
  useEffect(() => {
    // Add transition class for smooth theme switching
    document.documentElement.style.transition = 'background-color 0.2s ease, color 0.2s ease';
    
    // Apply the theme to the document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save theme preference
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Role detection function - determines if ID is employee, manager, or trainer
  const detectRole = (id: string, dataToCheck: (EmployeeTrainingRecord | MergedData)[]): 'employee' | 'manager' | 'trainer' | null => {
    if (!id || !dataToCheck || dataToCheck.length === 0) return null;
    
    // Normalize ID to lowercase for case-insensitive comparison
    const normalizedId = id.toLowerCase();
    
    // Check if ID exists as an employee
    const isEmployee = dataToCheck.some(record => record.employee_code.toLowerCase() === normalizedId);
    
    // Check if ID has people reporting to them (manager)
    const isManager = dataToCheck.some(record => record.reporting_manager_code.toLowerCase() === normalizedId);
    
    // Check if ID exists in store mapping as trainer or leadership role
    const isTrainer = storeMappingData.some(store => 
      store.Trainer.toLowerCase() === normalizedId || 
      store['E-Learning Specialist'].toLowerCase() === normalizedId || 
      store['Training Head'].toLowerCase() === normalizedId || 
      store['HR Head'].toLowerCase() === normalizedId
    );
    
    // Priority: Manager > Employee > Trainer
    // If someone is a manager, show them the manager view (which includes their own completion)
    if (isManager) return 'manager';
    if (isEmployee) return 'employee';
    if (isTrainer) return 'trainer';
    
    return null;
  };

  // Initialize on component mount only - check admin session, URL params, and auto-load data
  useEffect(() => {
    // Check for single 'id' parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (id) {
      setUserId(id);
      // Role will be detected after data loads
    } else {
      setUserRole('admin');
      setUserId(null);
    }
    
    // Check admin session
    checkAdminSession();
    
    // Auto-load data with persistence service
    autoLoadData();
  }, []); // Empty dependency array means this runs only once on mount
  
  // Detect role when data or userId changes
  useEffect(() => {
    if (userId && data && data.length > 0) {
      const detectedRole = detectRole(userId, data);
      if (detectedRole) {
        setUserRole(detectedRole);
      } else {
        // ID not found in any role, show error state without admin dashboard
        setUserRole('not-found');
      }
    } else if (!userId) {
      setUserRole('admin');
    }
  }, [userId, data]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const autoLoadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize GitHub service with stored token
      const token = localStorage.getItem('github_token');
      if (token) {
        githubUploadService.setToken(token);
      }
      
      // Auto-load data from persistence service
      const result = await dataPersistenceService.autoLoadData();
      
      if (result.data && result.data.length > 0) {
        // Merge with store data if available
        const mergedData = mergeWithStoreData(result.data as EmployeeTrainingRecord[]);
        setData(mergedData);
        setIsMerged(true);
        setDataSource(result.source);
        setFileName(result.fileName || 'GitHub Repository CSV Data');
        setError(null);
      } else {
        // No data available
        setData(null);
        setDataSource('none');
        setFileName('No Data');
      }
    } catch (error) {
      console.error('Failed to auto-load data:', error);
      setError('Failed to load training data. Please upload a CSV file.');
      setData(null);
      setDataSource('none');
    } finally {
      setIsLoading(false);
    }
  };

  const mergeWithStoreData = (data: EmployeeTrainingRecord[]): MergedData[] => {
    const storeMap = new Map<string, Omit<StoreRecord, 'Store ID'>>(
      storeMappingData.map(s => [s['Store ID'], { location: s.location, Region: s.Region, AM: s.AM, Trainer: s.Trainer }])
    );

    return data.map(emp => {
      const storeInfo = emp['Store ID'] ? storeMap.get(emp['Store ID']) : undefined;
      return { ...emp, ...storeInfo };
    });
  };
  
  const checkAdminSession = () => {
    const adminSession = localStorage.getItem('adminSession');
    const sessionExpiry = localStorage.getItem('adminSessionExpiry');
    
    if (adminSession === 'authenticated' && sessionExpiry) {
      const expiryTime = parseInt(sessionExpiry);
      if (Date.now() < expiryTime) {
        setIsAdmin(true);
      } else {
        // Session expired
        localStorage.removeItem('adminSession');
        localStorage.removeItem('adminSessionExpiry');
        setIsAdmin(false);
      }
    }
  };
  
  const handleAdminLogin = (authenticated: boolean) => {
    setIsAdmin(authenticated);
  };
  
  const handleAdminLogout = () => {
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminSessionExpiry');
    setIsAdmin(false);
    setShowAdminPanel(false);
  };
  
  const handleAdminFileUpload = async (file: File) => {
    // Process the uploaded file and update the local CSV
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csvContent = event.target?.result as string;
        
        // Parse and update the data directly
        try {
          const parsedData = csvParse(csvContent, (d: any) => {
            const cleanKey = (key: string) => key.trim().replace(/\s+/g, ' ');
            const cleanedD: {[key: string]: any} = {};
            for (const key in d) {
              cleanedD[cleanKey(key)] = d[key];
            }

            return {
              ...cleanedD,
              course_completion_hours: cleanedD.course_completion_hours ? parseFloat(cleanedD.course_completion_hours) : 0,
              course_progress: cleanedD.course_progress ? parseFloat(String(cleanedD.course_progress).replace('%', '')) : 0,
              course_completion_status: cleanedD.course_completion_status === 'Completed' ? 'Completed' : 'Not Completed',
            } as EmployeeTrainingRecord;
          });

          const firstRecordKeys = parsedData.columns.map(key => key.trim().replace(/\s+/g, ' '));

          if (firstRecordKeys.includes('Store ID')) {
            const mergedData = mergeWithStoreData(parsedData);
            setData(mergedData);
            setIsMerged(true);
            
            // Save to persistence service
            dataPersistenceService.saveData(mergedData, file.name);
          } else {
            setData(parsedData);
            setIsMerged(false);
            
            // Save to persistence service
            dataPersistenceService.saveData(parsedData, file.name);
          }
          
          setFileName(`${file.name} (Admin Upload)`);
          setDataSource('googleSheets');
          setError(null);
          
        } catch (e) {
          throw new Error('Failed to parse the uploaded file');
        }
      };
      
      reader.readAsText(file);
    } catch (e) {
      console.error('File upload error:', e);
      throw e;
    }
  };  const loadCSVData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/data/lms-completion.csv');
      
      if (!response.ok) {
        throw new Error(`Failed to load CSV file: ${response.status} ${response.statusText}`);
      }
      
      const csvText = await response.text();
      
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('CSV file is empty or could not be read');
      }
      
      const parsedData = csvParse(csvText, (d: any) => {
        // A helper to clean up keys
        const cleanKey = (key: string) => key.trim().replace(/\s+/g, ' ');
        const cleanedD: {[key: string]: any} = {};
        for (const key in d) {
          cleanedD[cleanKey(key)] = d[key];
        }

        return {
          ...cleanedD,
          course_completion_hours: cleanedD.course_completion_hours ? parseFloat(cleanedD.course_completion_hours) : 0,
          course_progress: cleanedD.course_progress ? parseFloat(String(cleanedD.course_progress).replace('%', '')) : 0,
          course_completion_status: cleanedD.course_completion_status === 'Completed' ? 'Completed' : 'Not Completed',
        } as EmployeeTrainingRecord;
      });
      
      const firstRecordKeys = parsedData.columns.map(key => key.trim().replace(/\s+/g, ' '));

      if (firstRecordKeys.includes('Store ID')) {
        const storeMap = new Map<string, Omit<StoreRecord, 'Store ID'>>(
          storeMappingData.map(s => [s['Store ID'], { location: s.location, Region: s.Region, AM: s.AM, Trainer: s.Trainer }])
        );

        const mergedData: MergedData[] = parsedData.map(emp => {
          const storeInfo = emp['Store ID'] ? storeMap.get(emp['Store ID']) : undefined;
          return { ...emp, ...storeInfo };
        });
        setData(mergedData);
        setIsMerged(true);
      } else {
        setData(parsedData);
        setIsMerged(false);
      }
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load CSV data';
      setError(`Error loading data: ${errorMessage}`);
      console.error('CSV loading error:', e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReload = () => {
    autoLoadData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 lg:py-8 max-w-7xl">
        <header className="mb-4 sm:mb-6 lg:mb-8 flex flex-col gap-3 sm:gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-brand-primary via-teal-500 to-emerald-500 bg-clip-text text-transparent mb-1 sm:mb-2 leading-tight">LMS Completion Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm lg:text-base leading-relaxed">Comprehensive analytics for learning management completion tracking</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end">
            {/* Reload Data Button - Mobile Optimized */}
            <button
              onClick={handleReload}
              disabled={isLoading}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-slate-700 dark:text-slate-300 font-semibold py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-300 shadow-md border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg active:scale-95 disabled:active:scale-100 flex items-center gap-1.5 sm:gap-2 touch-manipulation"
              aria-label="Reload data"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden lg:inline text-sm">Loading...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden lg:inline text-sm">Reload</span>
                </>
              )}
            </button>

            {/* Admin Access Button - Mobile Optimized */}
            {!isAdmin && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-300 shadow-md border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg active:scale-95 group touch-manipulation"
                aria-label="Admin access"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </button>
            )}

            {/* Admin Panel Button - Mobile Optimized */}
            {isAdmin && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="bg-orange-500/90 hover:bg-orange-600 text-white font-semibold py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 flex items-center gap-1.5 sm:gap-2 touch-manipulation"
                aria-label="Admin panel"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden lg:inline text-sm">Admin</span>
              </button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </header>
        
        <main className="space-y-8">
          {/* Admin Panel Modal */}
          {showAdminPanel && !isAdmin && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full mx-4 shadow-2xl">
                <div className="p-6">
                  <AdminLogin 
                    onLogin={(authenticated) => {
                      handleAdminLogin(authenticated);
                      if (!authenticated) {
                        setShowAdminPanel(false);
                      }
                    }}
                    onClose={() => setShowAdminPanel(false)}
                    isModal={true}
                  />
                </div>
              </div>
            </div>
          )}
          
          {showAdminPanel && isAdmin && (
            <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50">
              <AdminPanel 
                onLogout={() => {
                  handleAdminLogout();
                }}
                onFileUpload={handleAdminFileUpload}
              />
            </div>
          )}
          
          {/* Regular Dashboard Content */}
          {!showAdminPanel && (
            <>
              {error && !isLoading && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center mb-4">
                    <span className="text-red-500 text-2xl mr-3">❌</span>
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Error Loading Data</h3>
                  </div>
                  <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    🔄 Try Again
                  </button>
                </div>
              )}
              
              {data && !isLoading && (
                userRole === 'employee' && userId ? (
                  <EmployeeView data={data} employeeCode={userId} isMerged={isMerged} />
                ) : userRole === 'manager' && userId ? (
                  <ManagerView data={data} managerCode={userId} isMerged={isMerged} />
                ) : userRole === 'trainer' && userId ? (
                  <TrainerView data={data} trainerCode={userId} />
                ) : userRole === 'not-found' && userId ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-2xl p-8 shadow-2xl text-center max-w-2xl mx-auto">
                    <div className="flex flex-col items-center">
                      <span className="text-6xl mb-4">🔍</span>
                      <h3 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-3">ID Not Found</h3>
                      <p className="text-yellow-700 dark:text-yellow-300 text-lg mb-6">
                        The ID "<strong className="font-mono bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">{userId}</strong>" was not found in the system.
                      </p>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-left w-full mb-6">
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                          <strong>Please verify:</strong>
                        </p>
                        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                          <li>The ID is correct and properly formatted</li>
                          <li>The ID exists in the current dataset</li>
                          <li>You have the correct access permissions</li>
                        </ul>
                      </div>
                      <button
                        onClick={() => window.location.href = window.location.pathname}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                      >
                        🏠 Return to Dashboard
                      </button>
                    </div>
                  </div>
                ) : (
                  <TabbedDashboard data={data} fileName={fileName} isMerged={isMerged} />
                )
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;