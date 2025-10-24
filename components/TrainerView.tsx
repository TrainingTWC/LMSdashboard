import React, { useState, useMemo } from 'react';
import type { EmployeeTrainingRecord, MergedData } from '../types';
import { storeMappingData } from '../data/storeMapping';

interface TrainerViewProps {
  data: (EmployeeTrainingRecord | MergedData)[];
  trainerCode: string;
}

const TrainerView: React.FC<TrainerViewProps> = ({ data, trainerCode }) => {
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  // Get trainer info and their stores
  const trainerInfo = useMemo(() => {
    const stores = storeMappingData.filter(store => store.Trainer === trainerCode);
    const storeIds = stores.map(s => s['Store ID']);
    return { stores, storeIds };
  }, [trainerCode]);

  // Check if this is E-Learning Specialist, Training Head, or HR Head (access to all data)
  const hasFullAccess = useMemo(() => {
    const eLearningSpecialist = storeMappingData.find(s => s['E-Learning Specialist'] === trainerCode);
    const trainingHead = storeMappingData.find(s => s['Training Head'] === trainerCode);
    const hrHead = storeMappingData.find(s => s['HR Head'] === trainerCode);
    return !!(eLearningSpecialist || trainingHead || hrHead);
  }, [trainerCode]);

  // Get role name
  const roleName = useMemo(() => {
    if (storeMappingData.find(s => s['Training Head'] === trainerCode)) return 'Training Head';
    if (storeMappingData.find(s => s['HR Head'] === trainerCode)) return 'HR Head';
    if (storeMappingData.find(s => s['E-Learning Specialist'] === trainerCode)) return 'E-Learning Specialist';
    return 'Trainer';
  }, [trainerCode]);

  // Filter data by trainer's stores or show all if full access
  const filteredData = useMemo(() => {
    if (hasFullAccess) {
      return data; // Full access to all data
    }
    
    return data.filter(item => {
      const storeId = (item as MergedData)['Store ID'];
      return trainerInfo.storeIds.includes(storeId);
    });
  }, [data, hasFullAccess, trainerInfo.storeIds]);

  // Group data by employee
  const employeeData = useMemo(() => {
    const employeeMap = new Map<string, {
      employee_code: string;
      employee_name: string;
      employee_email: string;
      designation: string;
      department: string;
      location: string;
      store_id: string;
      total_courses: number;
      completed_courses: number;
      in_progress: number;
      completion_rate: number;
      total_hours: number;
      courses: Array<{
        course_name: string;
        course_category: string;
        completion_status: string;
        completion_date: string;
        course_end_date: string;
        course_progress: string;
        time_spent_hours: number;
      }>;
    }>();

    filteredData.forEach(item => {
      const empCode = item.employee_code;
      if (!employeeMap.has(empCode)) {
        employeeMap.set(empCode, {
          employee_code: empCode,
          employee_name: item.employee_name,
          employee_email: (item as any).employee_email || '',
          designation: item.designation,
          department: item.department || 'N/A',
          location: (item as MergedData).location || 'N/A',
          store_id: (item as MergedData)['Store ID'] || 'N/A',
          total_courses: 0,
          completed_courses: 0,
          in_progress: 0,
          completion_rate: 0,
          total_hours: 0,
          courses: []
        });
      }

      const emp = employeeMap.get(empCode)!;
      emp.total_courses++;
      
      const status = item.course_completion_status || (item as any).completion_status;
      if (status === 'Completed') {
        emp.completed_courses++;
      } else {
        emp.in_progress++;
      }

      emp.total_hours += parseFloat((item as any).time_spent_hours || '0');
      emp.courses.push({
        course_name: item.course_name,
        course_category: item.course_category || 'General',
        completion_status: status,
        completion_date: (item as any).completion_date || '',
        course_end_date: item.course_end_date || '',
        course_progress: String(item.course_progress || '0'),
        time_spent_hours: parseFloat((item as any).time_spent_hours || '0')
      });

      emp.completion_rate = Math.round((emp.completed_courses / emp.total_courses) * 100);
    });

    return Array.from(employeeMap.values()).sort((a, b) => 
      a.employee_name.localeCompare(b.employee_name)
    );
  }, [filteredData]);

  // Calculate aggregate stats
  const stats = useMemo(() => {
    const totalMembers = employeeData.length;
    const totalCourses = employeeData.reduce((sum, emp) => sum + emp.total_courses, 0);
    const completedCourses = employeeData.reduce((sum, emp) => sum + emp.completed_courses, 0);
    const totalHours = employeeData.reduce((sum, emp) => sum + emp.total_hours, 0);
    const avgCompletionRate = totalMembers > 0 
      ? Math.round(employeeData.reduce((sum, emp) => sum + emp.completion_rate, 0) / totalMembers)
      : 0;
    const highPerformers = employeeData.filter(emp => emp.completion_rate >= 80).length;
    const needsAttention = employeeData.filter(emp => emp.completion_rate < 60).length;

    return {
      totalMembers,
      totalCourses,
      completedCourses,
      avgCompletionRate,
      totalHours: Math.round(totalHours * 10) / 10,
      highPerformers,
      needsAttention
    };
  }, [employeeData]);

  if (employeeData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Data Available</h2>
            <p className="text-gray-600 dark:text-gray-400">
              No employee training data found for trainer code: <span className="font-mono font-semibold">{trainerCode}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-2 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-indigo-200/50 dark:border-indigo-800/50">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {roleName} Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                ID: <span className="font-mono font-semibold">{trainerCode}</span>
                {!hasFullAccess && (
                  <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                    {trainerInfo.stores.length} Store{trainerInfo.stores.length !== 1 ? 's' : ''}
                  </span>
                )}
                {hasFullAccess && (
                  <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                    Full Access
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Employees</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMembers}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 sm:p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Courses</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCourses}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.completedCourses}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-3 sm:p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Completion</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.avgCompletionRate}%</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">High Performers</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.highPerformers}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-3 sm:p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Needs Attention</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.needsAttention}</p>
            </div>
          </div>
        </div>

        {/* Employee List */}
        <div className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white px-2">
            Employees ({employeeData.length})
          </h2>
          
          {employeeData.map((employee) => (
            <div
              key={employee.employee_code}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-indigo-200/50 dark:border-indigo-700/50 overflow-hidden"
            >
              {/* Employee Header */}
              <button
                onClick={() => setExpandedEmployee(
                  expandedEmployee === employee.employee_code ? null : employee.employee_code
                )}
                className="w-full p-4 sm:p-6 text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                        {employee.employee_name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          employee.completion_rate >= 80
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : employee.completion_rate >= 60
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {employee.completion_rate}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <p className="truncate">
                        <span className="font-semibold">ID:</span> {employee.employee_code}
                      </p>
                      <p className="truncate">
                        <span className="font-semibold">Store:</span> {employee.location} ({employee.store_id})
                      </p>
                      <p className="truncate">
                        <span className="font-semibold">Designation:</span> {employee.designation}
                      </p>
                      <p className="truncate">
                        <span className="font-semibold">Email:</span> {employee.employee_email}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 text-xs sm:text-sm">
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Courses:</span>
                        <span className="text-gray-600 dark:text-gray-400">{employee.completed_courses}/{employee.total_courses}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">In Progress:</span>
                        <span className="text-gray-600 dark:text-gray-400">{employee.in_progress}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Hours:</span>
                        <span className="text-gray-600 dark:text-gray-400">{employee.total_hours.toFixed(1)}h</span>
                      </span>
                    </div>
                  </div>

                  <svg
                    className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 transition-transform flex-shrink-0 ${
                      expandedEmployee === employee.employee_code ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded Course Details */}
              {expandedEmployee === employee.employee_code && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-gray-50/50 dark:bg-slate-900/50">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
                    Course Details ({employee.courses.length})
                  </h4>
                  <div className="space-y-2">
                    {employee.courses.map((course, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h5 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base flex-1">
                            {course.course_name}
                          </h5>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              course.completion_status === 'Completed'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            }`}
                          >
                            {course.completion_status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <p>
                            <span className="font-semibold">Category:</span> {course.course_category}
                          </p>
                          <p>
                            <span className="font-semibold">Progress:</span> {course.course_progress}%
                          </p>
                          <p>
                            <span className="font-semibold">Time Spent:</span> {course.time_spent_hours.toFixed(1)}h
                          </p>
                          {course.completion_date && (
                            <p>
                              <span className="font-semibold">Completed:</span>{' '}
                              {new Date(course.completion_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainerView;
