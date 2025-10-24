import React, { useState, useMemo } from 'react';
import type { EmployeeTrainingRecord, MergedData } from '../types';

interface ManagerViewProps {
  data: (EmployeeTrainingRecord | MergedData)[];
  managerCode: string;
  isMerged: boolean;
}

const ManagerView: React.FC<ManagerViewProps> = ({ data, managerCode, isMerged }) => {
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Build reporting hierarchy - find all employees reporting to this manager (direct and indirect)
  const teamData = useMemo(() => {
    const allReports = new Set<string>();
    const employeeMap = new Map<string, EmployeeTrainingRecord | MergedData>();
    
    // Create a map of all employees
    data.forEach(record => {
      employeeMap.set(record.employee_code, record);
    });

    // Recursive function to find all subordinates
    const findAllSubordinates = (managerId: string) => {
      data.forEach(record => {
        if (record.reporting_manager_code === managerId && !allReports.has(record.employee_code)) {
          allReports.add(record.employee_code);
          // Recursively find this employee's subordinates
          findAllSubordinates(record.employee_code);
        }
      });
    };

    // Start with direct reports
    findAllSubordinates(managerCode);

    // Filter data for all team members
    return data.filter(record => allReports.has(record.employee_code));
  }, [data, managerCode]);

  // Get manager info
  const managerInfo = useMemo(() => {
    return data.find(record => record.employee_code === managerCode);
  }, [data, managerCode]);

  // Group by employee and calculate stats
  const teamMembers = useMemo(() => {
    const employeeMap = new Map();
    
    teamData.forEach(record => {
      const empCode = record.employee_code;
      if (!employeeMap.has(empCode)) {
        employeeMap.set(empCode, {
          employee_code: empCode,
          employee_name: record.employee_name,
          email: record.email,
          designation: record.designation,
          department: record.department,
          reporting_manager_code: record.reporting_manager_code,
          reporting_manager_name: record.reporting_manager_name,
          location: isMerged ? (record as MergedData).location : undefined,
          total_courses: 0,
          completed_courses: 0,
          in_progress: 0,
          completion_rate: 0,
          total_hours: 0,
          courses: []
        });
      }
      
      const emp = employeeMap.get(empCode);
      emp.total_courses++;
      emp.total_hours += record.course_completion_hours || 0;
      emp.courses.push({
        course_name: record.course_name,
        course_category: record.course_category,
        course_type: record.course_type,
        completion_status: record.course_completion_status,
        progress: record.course_progress,
        hours: record.course_completion_hours,
        enrollment_date: record.course_enrolment_date,
        completion_date: record.course_completion_date,
        end_date: record.course_end_date
      });
      
      if (record.course_completion_status === 'Completed') {
        emp.completed_courses++;
      } else {
        emp.in_progress++;
      }
      
      emp.completion_rate = emp.total_courses > 0 
        ? Math.round((emp.completed_courses / emp.total_courses) * 100) 
        : 0;
    });
    
    return Array.from(employeeMap.values()).sort((a, b) => 
      b.completion_rate - a.completion_rate
    );
  }, [teamData, isMerged]);

  // Calculate team stats
  const teamStats = useMemo(() => {
    const totalMembers = teamMembers.length;
    const totalCourses = teamMembers.reduce((sum, emp) => sum + emp.total_courses, 0);
    const completedCourses = teamMembers.reduce((sum, emp) => sum + emp.completed_courses, 0);
    const totalHours = teamMembers.reduce((sum, emp) => sum + emp.total_hours, 0);
    const avgCompletionRate = totalMembers > 0
      ? Math.round(teamMembers.reduce((sum, emp) => sum + emp.completion_rate, 0) / totalMembers)
      : 0;
    
    const highPerformers = teamMembers.filter(emp => emp.completion_rate >= 80).length;
    const needsAttention = teamMembers.filter(emp => emp.completion_rate < 60).length;

    return {
      totalMembers,
      totalCourses,
      completedCourses,
      totalHours: totalHours.toFixed(1),
      avgCompletionRate,
      highPerformers,
      needsAttention
    };
  }, [teamMembers]);

  // Group team members by reporting level
  const teamLevels = useMemo(() => {
    const directReports = teamMembers.filter(emp => emp.reporting_manager_code === managerCode);
    const indirectReports = teamMembers.filter(emp => emp.reporting_manager_code !== managerCode);
    
    return { directReports, indirectReports };
  }, [teamMembers, managerCode]);

  if (teamData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6 text-center">
            <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">No Team Members Found</h2>
            <p className="text-yellow-700 dark:text-yellow-300">
              No employees reporting to manager code: <strong>{managerCode}</strong>
            </p>
            {managerInfo && (
              <p className="text-yellow-600 dark:text-yellow-400 mt-2">
                Manager: {managerInfo.employee_name}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-200 p-2 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Manager Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                Team Dashboard
              </h1>
              {managerInfo && (
                <div className="space-y-1 text-sm sm:text-base">
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">Manager:</span> {managerInfo.employee_name}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">Manager Code:</span> {managerInfo.employee_code}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">Department:</span> {managerInfo.department}
                  </p>
                </div>
              )}
            </div>
            <div className="ml-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                {managerInfo ? managerInfo.employee_name.charAt(0).toUpperCase() : 'M'}
              </div>
            </div>
          </div>
        </div>

        {/* Team Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Team Members</p>
            <p className="text-2xl sm:text-3xl font-bold text-brand-primary">{teamStats.totalMembers}</p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Total Courses</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-500">{teamStats.totalCourses}</p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Completed</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-500">{teamStats.completedCourses}</p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Avg. Rate</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-500">{teamStats.avgCompletionRate}%</p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Total Hours</p>
            <p className="text-2xl sm:text-3xl font-bold text-orange-500">{teamStats.totalHours}</p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">High Performers</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-500">{teamStats.highPerformers}</p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Needs Attention</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-500">{teamStats.needsAttention}</p>
          </div>
        </div>

        {/* Direct Reports Section */}
        {teamLevels.directReports.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Direct Reports ({teamLevels.directReports.length})
            </h2>
            
            <div className="space-y-3">
              {teamLevels.directReports.map((employee) => (
                <EmployeeCard
                  key={employee.employee_code}
                  employee={employee}
                  isExpanded={expandedEmployee === employee.employee_code}
                  onToggle={() => setExpandedEmployee(expandedEmployee === employee.employee_code ? null : employee.employee_code)}
                  selectedCourse={selectedCourse}
                  onCourseClick={setSelectedCourse}
                  isDirect={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Indirect Reports Section */}
        {teamLevels.indirectReports.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Indirect Reports ({teamLevels.indirectReports.length})
            </h2>
            
            <div className="space-y-3">
              {teamLevels.indirectReports.map((employee) => (
                <EmployeeCard
                  key={employee.employee_code}
                  employee={employee}
                  isExpanded={expandedEmployee === employee.employee_code}
                  onToggle={() => setExpandedEmployee(expandedEmployee === employee.employee_code ? null : employee.employee_code)}
                  selectedCourse={selectedCourse}
                  onCourseClick={setSelectedCourse}
                  isDirect={false}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Employee Card Component
interface EmployeeCardProps {
  employee: any;
  isExpanded: boolean;
  onToggle: () => void;
  selectedCourse: string | null;
  onCourseClick: (course: string | null) => void;
  isDirect: boolean;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
  employee, 
  isExpanded, 
  onToggle, 
  selectedCourse, 
  onCourseClick,
  isDirect 
}) => {
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div 
        className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isDirect ? 'bg-indigo-500' : 'bg-purple-500'}`}>
                {employee.employee_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{employee.employee_name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{employee.designation}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Reports to: <span className="font-medium">{employee.reporting_manager_name}</span>
              </span>
              {employee.location && (
                <span className="text-slate-600 dark:text-slate-400">
                  • Location: <span className="font-medium">{employee.location}</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-4">
            <div className="text-right">
              <div className={`text-2xl font-bold px-3 py-1 rounded-full ${getCompletionColor(employee.completion_rate)}`}>
                {employee.completion_rate}%
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {employee.completed_courses}/{employee.total_courses} completed
              </p>
            </div>
            
            <svg 
              className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Expanded Course Details */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-700/20">
          <div className="space-y-2">
            {employee.courses.map((course: any, idx: number) => (
              <div 
                key={idx}
                className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{course.course_name}</h4>
                      {course.completion_status === 'Completed' ? (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
                          ✓ Completed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs rounded-full">
                          {course.progress}% In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {course.course_category} • {course.course_type} • {course.hours}h
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerView;
