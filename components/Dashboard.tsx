import React, { useState, useMemo } from 'react';
import type { EmployeeTrainingRecord, MergedData } from '../types';
import { storeMappingData } from '../data/storeMapping';
import StatCard from './StatCard';
import CompletionRateCard from './CompletionRateCard';
import GeminiInsights from './GeminiInsights';
import RegionCompletionChart from './RegionCompletionChart';
import TrainerCompletionChart from './TrainerCompletionChart';
import AreaManagerCompletionChart from './AreaManagerCompletionChart';
import CourseCompletionChart from './CourseCompletionChart';
import StoreCompletionChart from './StoreCompletionChart';
import DesignationCompletionChart from './DesignationCompletionChart';
import TenureDistributionChart from './TenureDistributionChart';
import TenureCompletionChart from './TenureCompletionChart';
import MultiSelectFilter from './MultiSelectFilter';

interface DashboardProps {
  data: (EmployeeTrainingRecord | MergedData)[];
  fileName: string;
  isMerged: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ data, fileName, isMerged }) => {
  // Multi-select filter states
  const [selectedTenure, setSelectedTenure] = useState<string[]>([]);
  const [selectedStore, setSelectedStore] = useState<string[]>([]);
  const [selectedAreaManager, setSelectedAreaManager] = useState<string[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string[]>([]);
  const [selectedDesignation, setSelectedDesignation] = useState<string[]>([]);

  // Search states for filters
  const [storeSearch, setStoreSearch] = useState<string>('');
  const [areaManagerSearch, setAreaManagerSearch] = useState<string>('');
  const [trainerSearch, setTrainerSearch] = useState<string>('');
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [designationSearch, setDesignationSearch] = useState<string>('');

  // Modal states for clickable stat cards
  const [isStatModalOpen, setIsStatModalOpen] = useState<boolean>(false);
  const [selectedStatType, setSelectedStatType] = useState<'total' | 'high' | 'average' | 'needs-attention' | null>(null);

  // Tenure calculation function
  const calculateTenure = (dateOfJoining: string): string => {
    const joinDate = new Date(dateOfJoining);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 4) return '1-4 days';
    if (daysDiff <= 15) return '5-15 days';
    if (daysDiff <= 30) return '16-30 days';
    return 'over a month';
  };

  // Get unique values for filter options
  const uniqueStores = useMemo(() => {
    const stores = [...new Set(storeMappingData.map(store => store.location))].sort();
    return stores.filter(store => store.toLowerCase().includes(storeSearch.toLowerCase()));
  }, [storeSearch]);

  const uniqueAreaManagers = useMemo(() => {
    const managers = [...new Set(storeMappingData.map(store => store.AM).filter(am => am !== 'TBD'))].sort();
    return managers.filter(manager => manager.toLowerCase().includes(areaManagerSearch.toLowerCase()));
  }, [areaManagerSearch]);

  const uniqueTrainers = useMemo(() => {
    const trainers = [...new Set(storeMappingData.map(store => store.Trainer).filter(trainer => trainer !== 'TBD'))].sort();
    return trainers.filter(trainer => trainer.toLowerCase().includes(trainerSearch.toLowerCase()));
  }, [trainerSearch]);

  const uniqueCourses = useMemo(() => {
    const courses = [...new Set(data.map(item => item.course_name || 'Unknown').filter(Boolean))].sort();
    return courses.filter(course => (course as string).toLowerCase().includes(courseSearch.toLowerCase()));
  }, [data, courseSearch]);

  const uniqueDesignations = useMemo(() => {
    const designations = [...new Set(data.map(item => item.designation || 'Unknown').filter(Boolean))].sort();
    return designations.filter(designation => (designation as string).toLowerCase().includes(designationSearch.toLowerCase()));
  }, [data, designationSearch]);

  // Filter data based on all selected filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Tenure filter
      if (selectedTenure.length > 0) {
        const tenure = calculateTenure(item.date_of_joining);
        if (!selectedTenure.includes(tenure)) return false;
      }
      
      // Store filter
      if (selectedStore.length > 0) {
        const storeName = isMerged ? (item as MergedData).location : 'Unknown';
        if (!selectedStore.includes(storeName)) return false;
      }
      
      // Area Manager filter
      if (selectedAreaManager.length > 0) {
        const areaManager = isMerged ? (item as MergedData).AM : 'Unknown';
        if (!selectedAreaManager.includes(areaManager)) return false;
      }
      
      // Trainer filter
      if (selectedTrainer.length > 0) {
        const trainer = isMerged ? (item as MergedData).Trainer : 'Unknown';
        if (!selectedTrainer.includes(trainer)) return false;
      }
      
      // Course filter
      if (selectedCourse.length > 0 && !selectedCourse.includes(item.course_name || 'Unknown')) {
        return false;
      }
      
      // Designation filter
      if (selectedDesignation.length > 0 && !selectedDesignation.includes(item.designation || 'Unknown')) {
        return false;
      }
      
      return true;
    });
  }, [data, selectedTenure, selectedStore, selectedAreaManager, selectedTrainer, selectedCourse, selectedDesignation, isMerged]);

  // Calculate aggregate stats for filtered data
  const totalEmployees = new Set(filteredData.map(item => item.employee_code)).size;
  const totalEnrollments = filteredData.length;

  // Calculate completion rates for performance categorization
  const employeeCompletionRates = useMemo(() => {
    const employeeMap = new Map();
    
    filteredData.forEach(item => {
      const empCode = item.employee_code;
      if (!employeeMap.has(empCode)) {
        employeeMap.set(empCode, {
          employee_code: empCode,
          employee_name: item.employee_name,
          designation: item.designation,
          total_courses: 0,
          completed_courses: 0,
          completion_rate: 0,
          courses: []
        });
      }
      
      const emp = employeeMap.get(empCode);
      emp.total_courses++;
      emp.courses.push({
        course_name: item.course_name,
        completion_status: item.course_completion_status || item.completion_status,
        completion_date: item.completion_date,
        course_end_date: item.course_end_date
      });
      
      if ((item.course_completion_status || item.completion_status) === 'Completed') {
        emp.completed_courses++;
      }
      emp.completion_rate = Math.round((emp.completed_courses / emp.total_courses) * 100);
    });
    
    return Array.from(employeeMap.values());
  }, [filteredData]);

  const highPerformers = employeeCompletionRates.filter(emp => emp.completion_rate >= 80);
  const averagePerformers = employeeCompletionRates.filter(emp => emp.completion_rate >= 60 && emp.completion_rate < 80);
  const needsAttention = employeeCompletionRates.filter(emp => emp.completion_rate < 60);

  // Handle stat card clicks
  const handleStatCardClick = (statType: 'total' | 'high' | 'average' | 'needs-attention') => {
    setSelectedStatType(statType);
    setIsStatModalOpen(true);
  };

  const closeStatModal = () => {
    setIsStatModalOpen(false);
    setSelectedStatType(null);
  };

  // Helper function to safely calculate and format percentages
  const formatPercentage = (numerator: number, denominator: number): string => {
    if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) return '0';
    const percentage = Math.round((numerator / denominator) * 100);
    return isNaN(percentage) ? '0' : percentage.toString();
  };

  // Helper function to safely calculate average completion rate
  const getAverageCompletion = (employees: any[]): string => {
    if (employees.length === 0) return '0';
    const sum = employees.reduce((acc, emp) => acc + (emp.completion_rate || 0), 0);
    const average = Math.round(sum / employees.length);
    return isNaN(average) ? '0' : average.toString();
  };

  // Get active filter summary for display
  const getActiveFiltersText = () => {
    const activeFilters = [];
    if (selectedTenure.length > 0) {
      activeFilters.push(`Tenure: ${selectedTenure.length === 1 ? selectedTenure[0] : `${selectedTenure.length} selected`}`);
    }
    if (selectedStore.length > 0) {
      activeFilters.push(`Store: ${selectedStore.length === 1 ? selectedStore[0] : `${selectedStore.length} selected`}`);
    }
    if (selectedAreaManager.length > 0) {
      activeFilters.push(`Area Manager: ${selectedAreaManager.length === 1 ? selectedAreaManager[0] : `${selectedAreaManager.length} selected`}`);
    }
    if (selectedTrainer.length > 0) {
      activeFilters.push(`Trainer: ${selectedTrainer.length === 1 ? selectedTrainer[0] : `${selectedTrainer.length} selected`}`);
    }
    if (selectedCourse.length > 0) {
      activeFilters.push(`Course: ${selectedCourse.length === 1 ? selectedCourse[0] : `${selectedCourse.length} selected`}`);
    }
    if (selectedDesignation.length > 0) {
      activeFilters.push(`Designation: ${selectedDesignation.length === 1 ? selectedDesignation[0] : `${selectedDesignation.length} selected`}`);
    }
    
    if (activeFilters.length === 0) return 'All Data';
    if (activeFilters.length === 1) return activeFilters[0];
    return `${activeFilters.length} Filters Applied`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-4 lg:px-0">
      {/* Multi-Select Filter Bar - Mobile Optimized */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-slate-200/50 dark:border-slate-700/50 overflow-visible relative" style={{ zIndex: 1 }}>
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            Filters
          </h3>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {getActiveFiltersText()}
          </span>
        </div>

        {/* Filters Grid - Responsive Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {/* Tenure Filter */}
          <div className="w-full">
            <MultiSelectFilter
              title="Employee Tenure"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              options={['1-4 days', '5-15 days', '16-30 days', 'over a month']}
              selectedValues={selectedTenure}
              onSelectionChange={setSelectedTenure}
              searchValue=""
              onSearchChange={() => {}}
              placeholder="Search tenure..."
              showCount={true}
              data={data}
              filterKey="tenure"
            />
          </div>

          {/* Store Filter */}
          {isMerged && (
            <div className="w-full">
              <MultiSelectFilter
                title="Store"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
                options={uniqueStores}
                selectedValues={selectedStore}
                onSelectionChange={setSelectedStore}
                searchValue={storeSearch}
                onSearchChange={setStoreSearch}
                placeholder="Search stores..."
                showCount={true}
                data={data}
                filterKey="location"
                isMerged={isMerged}
              />
            </div>
          )}

          {/* Area Manager Filter */}
          {isMerged && (
            <div className="w-full">
              <MultiSelectFilter
                title="Area Manager"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                options={uniqueAreaManagers}
                selectedValues={selectedAreaManager}
                onSelectionChange={setSelectedAreaManager}
                searchValue={areaManagerSearch}
                onSearchChange={setAreaManagerSearch}
                placeholder="Search area managers..."
                showCount={true}
                data={data}
                filterKey="AM"
                isMerged={isMerged}
              />
            </div>
          )}

          {/* Trainer Filter */}
          {isMerged && (
            <div className="w-full">
              <MultiSelectFilter
                title="Trainer"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
                options={uniqueTrainers}
                selectedValues={selectedTrainer}
                onSelectionChange={setSelectedTrainer}
                searchValue={trainerSearch}
                onSearchChange={setTrainerSearch}
                placeholder="Search trainers..."
                showCount={true}
                data={data}
                filterKey="Trainer"
                isMerged={isMerged}
              />
            </div>
          )}

          {/* Course Filter */}
          <div className="w-full">
            <MultiSelectFilter
              title="Course"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              options={uniqueCourses}
              selectedValues={selectedCourse}
              onSelectionChange={setSelectedCourse}
              searchValue={courseSearch}
              onSearchChange={setCourseSearch}
              placeholder="Search courses..."
              showCount={true}
              data={data}
              filterKey="course_name"
              isMerged={isMerged}
            />
          </div>

          {/* Designation Filter */}
          <div className="w-full">
            <MultiSelectFilter
              title="Designation"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              options={uniqueDesignations}
              selectedValues={selectedDesignation}
              onSelectionChange={setSelectedDesignation}
              searchValue={designationSearch}
              onSearchChange={setDesignationSearch}
              placeholder="Search designations..."
              showCount={true}
              data={data}
              filterKey="designation"
              isMerged={isMerged}
            />
          </div>
        </div>

        {/* Clear All Filters Button */}
        {(selectedTenure.length > 0 || selectedStore.length > 0 || selectedAreaManager.length > 0 || selectedTrainer.length > 0 || selectedCourse.length > 0 || selectedDesignation.length > 0) && (
          <div className="flex justify-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setSelectedTenure([]);
                setSelectedStore([]);
                setSelectedAreaManager([]);
                setSelectedTrainer([]);
                setSelectedCourse([]);
                setSelectedDesignation([]);
                setStoreSearch('');
                setAreaManagerSearch('');
                setTrainerSearch('');
                setCourseSearch('');
                setDesignationSearch('');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* File Info Banner */}
      {!isMerged && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-6 rounded-lg shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Enhanced Analytics Available</h3>
              <p className="text-sm leading-relaxed">Include a 'Store ID' column in your CSV to access detailed regional analysis, trainer performance metrics, and area manager insights.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-0">
        {/* Total Employees Card */}
        <div 
          onClick={() => handleStatCardClick('total')}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-blue-200/50 dark:border-blue-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg sm:rounded-xl group-hover:from-blue-500/20 group-hover:to-indigo-500/20 transition-all duration-300">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{totalEmployees}</p>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Employees</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Tap for details</p>
          </div>
        </div>

        {/* High Performers Card */}
        <div 
          onClick={() => handleStatCardClick('high')}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-green-200/50 dark:border-green-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg sm:rounded-xl group-hover:from-green-500/20 group-hover:to-emerald-500/20 transition-all duration-300">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{highPerformers.length}</p>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center">High Performers<br className="sm:hidden" /><span className="hidden sm:inline"> </span>(≥80%)</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Tap for details</p>
          </div>
        </div>

        {/* Average Performers Card */}
        <div 
          onClick={() => handleStatCardClick('average')}
          className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-yellow-200/50 dark:border-yellow-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg sm:rounded-xl group-hover:from-yellow-500/20 group-hover:to-orange-500/20 transition-all duration-300">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{averagePerformers.length}</p>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center">Average Performers<br className="sm:hidden" /><span className="hidden sm:inline"> </span>(60-79%)</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Tap for details</p>
          </div>
        </div>

        {/* Needs Attention Card */}
        <div 
          onClick={() => handleStatCardClick('needs-attention')}
          className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-red-200/50 dark:border-red-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-lg sm:rounded-xl group-hover:from-red-500/20 group-hover:to-pink-500/20 transition-all duration-300">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{needsAttention.length}</p>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center">Needs Attention<br className="sm:hidden" /><span className="hidden sm:inline"> </span>(&lt;60%)</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Tap for details</p>
          </div>
        </div>
      </div>

      {/* Tenure Analysis Charts - Mobile Optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <TenureDistributionChart data={filteredData} />
        </div>
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <TenureCompletionChart data={filteredData} />
        </div>
      </div>

      {/* Secondary Charts for Merged Data - Mobile Optimized */}
      {isMerged && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <RegionCompletionChart data={filteredData as MergedData[]} />
          </div>
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <TrainerCompletionChart data={filteredData as MergedData[]} />
          </div>
          <div className="lg:col-span-2 xl:col-span-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <AreaManagerCompletionChart data={filteredData as MergedData[]} />
          </div>
        </div>
      )}

      {/* Course Analysis Charts - Mobile Optimized */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
        <CourseCompletionChart data={filteredData} />
      </div>
      
      {/* Designation Analysis Charts - Mobile Optimized */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
        <DesignationCompletionChart data={filteredData} />
      </div>
      
      {isMerged && (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <StoreCompletionChart data={filteredData as MergedData[]} />
        </div>
      )}
      
      {/* AI Insights Section - Mobile Optimized */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-indigo-200/50 dark:border-indigo-800/50">
        <GeminiInsights data={filteredData} isMerged={isMerged} />
      </div>

      {/* Stat Card Detail Modal - Mobile Optimized */}
      {isStatModalOpen && selectedStatType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header - Mobile Optimized */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    {selectedStatType === 'total' && 'All Employees'}
                    {selectedStatType === 'high' && 'High Performers (≥80% Completion)'}
                    {selectedStatType === 'average' && 'Average Performers (60-79% Completion)'}
                    {selectedStatType === 'needs-attention' && 'Needs Attention (<60% Completion)'}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                    {selectedStatType === 'total' && `${employeeCompletionRates.length} total employees`}
                    {selectedStatType === 'high' && `${highPerformers.length} high performing employees`}
                    {selectedStatType === 'average' && `${averagePerformers.length} average performing employees`}
                    {selectedStatType === 'needs-attention' && `${needsAttention.length} employees requiring attention`}
                  </p>
                </div>
                <button
                  onClick={closeStatModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-xl ${
                  selectedStatType === 'high' ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' :
                  selectedStatType === 'average' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20' :
                  selectedStatType === 'needs-attention' ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20' :
                  'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
                }`}>
                  <div className={`text-2xl font-bold ${
                    selectedStatType === 'high' ? 'text-green-600 dark:text-green-400' :
                    selectedStatType === 'average' ? 'text-yellow-600 dark:text-yellow-400' :
                    selectedStatType === 'needs-attention' ? 'text-red-600 dark:text-red-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {selectedStatType === 'total' && employeeCompletionRates.length}
                    {selectedStatType === 'high' && highPerformers.length}
                    {selectedStatType === 'average' && averagePerformers.length}
                    {selectedStatType === 'needs-attention' && needsAttention.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Count</div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {selectedStatType === 'total' && `${getAverageCompletion(employeeCompletionRates)}%`}
                    {selectedStatType === 'high' && `${getAverageCompletion(highPerformers)}%`}
                    {selectedStatType === 'average' && `${getAverageCompletion(averagePerformers)}%`}
                    {selectedStatType === 'needs-attention' && `${getAverageCompletion(needsAttention)}%`}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Average Completion</div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedStatType === 'total' && employeeCompletionRates.reduce((sum, emp) => sum + emp.total_courses, 0)}
                    {selectedStatType === 'high' && highPerformers.reduce((sum, emp) => sum + emp.total_courses, 0)}
                    {selectedStatType === 'average' && averagePerformers.reduce((sum, emp) => sum + emp.total_courses, 0)}
                    {selectedStatType === 'needs-attention' && needsAttention.reduce((sum, emp) => sum + emp.total_courses, 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Enrollments</div>
                </div>
              </div>

              {/* Employee List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(selectedStatType === 'total' ? employeeCompletionRates :
                  selectedStatType === 'high' ? highPerformers :
                  selectedStatType === 'average' ? averagePerformers :
                  needsAttention
                ).map((employee, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{employee.employee_name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {employee.employee_code} • {employee.designation}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                          employee.completion_rate >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          employee.completion_rate >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {employee.completion_rate}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Total Courses:</span>
                        <div className="text-gray-600 dark:text-gray-400">{employee.total_courses}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Completed:</span>
                        <div className="text-gray-600 dark:text-gray-400">{employee.completed_courses}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Progress:</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                employee.completion_rate >= 80 ? 'bg-green-500' :
                                employee.completion_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${employee.completion_rate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Course List Preview */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                          View Courses ({employee.courses.length})
                        </summary>
                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                          {employee.courses.map((course, courseIndex) => (
                            <div key={courseIndex} className="text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{course.course_name}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  course.completion_status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                }`}>
                                  {course.completion_status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
