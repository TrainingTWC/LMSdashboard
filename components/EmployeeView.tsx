import React, { useState, useMemo } from 'react';
import type { EmployeeTrainingRecord, MergedData } from '../types';

interface EmployeeViewProps {
  data: (EmployeeTrainingRecord | MergedData)[];
  employeeCode: string;
  isMerged: boolean;
}

const EmployeeView: React.FC<EmployeeViewProps> = ({ data, employeeCode, isMerged }) => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Filter data for this specific employee
  const employeeData = useMemo(() => {
    return data.filter(record => record.employee_code === employeeCode);
  }, [data, employeeCode]);

  // Get employee info
  const employeeInfo = employeeData[0];

  // Calculate stats
  const stats = useMemo(() => {
    const totalCourses = employeeData.length;
    const completedCourses = employeeData.filter(d => d.course_completion_status === 'Completed').length;
    const completionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;
    const totalHours = employeeData.reduce((sum, d) => {
      const hours = parseFloat(String(d.course_completion_hours || 0));
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0);
    
    return {
      totalCourses,
      completedCourses,
      inProgress: totalCourses - completedCourses,
      completionRate: isNaN(completionRate) ? '0.0' : completionRate.toFixed(1),
      totalHours: isNaN(totalHours) ? '0.0' : totalHours.toFixed(1)
    };
  }, [employeeData]);

  // Group courses by category
  const coursesByCategory = useMemo(() => {
    const grouped = new Map<string, typeof employeeData>();
    employeeData.forEach(course => {
      const category = course.course_category || 'Uncategorized';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(course);
    });
    return grouped;
  }, [employeeData]);

  if (employeeData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6 text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">Employee Not Found</h2>
            <p className="text-red-700 dark:text-red-300">No training data found for employee code: <strong>{employeeCode}</strong></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-200 p-2 sm:p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Employee Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {employeeInfo.employee_name}
              </h1>
              <div className="space-y-1 text-sm sm:text-base">
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Employee Code:</span> {employeeInfo.employee_code}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Email:</span> {employeeInfo.email}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Department:</span> {employeeInfo.department}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Designation:</span> {employeeInfo.designation}
                </p>
                {isMerged && (employeeInfo as MergedData).location && (
                  <>
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">Location:</span> {(employeeInfo as MergedData).location}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">Region:</span> {(employeeInfo as MergedData).Region}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="ml-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-brand-primary to-teal-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                {employeeInfo.employee_name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Total Courses</p>
            <p className="text-2xl sm:text-3xl font-bold text-brand-primary">{stats.totalCourses}</p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Completed</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-500">{stats.completedCourses}</p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">In Progress</p>
            <p className="text-2xl sm:text-3xl font-bold text-orange-500">{stats.inProgress}</p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Completion Rate</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-500">{stats.completionRate}%</p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Total Hours</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-500">{stats.totalHours}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Overall Progress</h3>
            <span className="text-2xl font-bold text-brand-primary">{stats.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-brand-primary to-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        {/* Courses by Category */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">My Courses</h2>
          
          <div className="space-y-4">
            {Array.from(coursesByCategory.entries()).map(([category, courses]) => (
              <div key={category} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-700/50 px-4 py-3">
                  <h3 className="font-semibold text-lg">{category}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {courses.filter(c => c.course_completion_status === 'Completed').length} of {courses.length} completed
                  </p>
                </div>
                
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {courses.map((course, idx) => (
                    <div 
                      key={idx}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedCourse(selectedCourse === course.course_name ? null : course.course_name)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100">{course.course_name}</h4>
                            {course.course_completion_status === 'Completed' ? (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full font-medium">
                                ✓ Completed
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs rounded-full font-medium">
                                In Progress
                              </span>
                            )}
                          </div>
                          
                          {selectedCourse === course.course_name && (
                            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                              <p><span className="font-semibold">Type:</span> {course.course_type}</p>
                              <p><span className="font-semibold">Progress:</span> {course.course_progress}%</p>
                              <p><span className="font-semibold">Hours:</span> {course.course_completion_hours}</p>
                              {course.course_enrolment_date && (
                                <p><span className="font-semibold">Enrolled:</span> {new Date(course.course_enrolment_date).toLocaleDateString()}</p>
                              )}
                              {course.course_completion_date && (
                                <p><span className="font-semibold">Completed:</span> {new Date(course.course_completion_date).toLocaleDateString()}</p>
                              )}
                              {course.course_end_date && (
                                <p><span className="font-semibold">End Date:</span> {new Date(course.course_end_date).toLocaleDateString()}</p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          {course.course_completion_status === 'Completed' ? (
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
                              {course.course_progress}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeView;
