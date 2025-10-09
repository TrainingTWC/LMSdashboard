/**
 * Alternative Data Source Service
 * Provides multiple options for data loading:
 * 1. Google Sheets (primary)
 * 2. Public CSV URL (secondary)
 * 3. File upload with cloud sync (tertiary)
 */

export interface DataSource {
  id: string;
  name: string;
  type: 'googleSheets' | 'publicCSV' | 'cloudSync';
  url?: string;
  description: string;
  status: 'active' | 'configured' | 'unavailable';
}

export const availableDataSources: DataSource[] = [
  {
    id: 'googleSheets',
    name: 'Google Sheets',
    type: 'googleSheets',
    url: 'https://script.google.com/macros/s/AKfycbzDYkBlieLjOSZmboqphGkEh09gE6d8AC_ZQZqqgvIJ1vdOjwosWcgj_EskFzz0Owi1sw/exec',
    description: 'Real-time data from Google Sheets via Apps Script',
    status: 'active'
  },
  {
    id: 'publicCSV',
    name: 'Public CSV URL',
    type: 'publicCSV',
    description: 'Direct CSV file from a public URL (GitHub, CDN, etc.)',
    status: 'configured'
  },
  {
    id: 'cloudSync',
    name: 'Cloud Sync Upload',
    type: 'cloudSync',
    description: 'Upload file that syncs across all devices',
    status: 'configured'
  }
];

/**
 * Option 1: Enhanced Google Sheets with better error handling
 */
export async function fetchFromGoogleSheets(url: string): Promise<any[]> {
  console.log('🔄 Fetching from Google Sheets...');
  
  try {
    // Add random parameter to prevent caching
    const urlWithCache = `${url}?t=${Date.now()}`;
    
    const response = await fetch(urlWithCache, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      console.log(`✅ Google Sheets: ${data.data.length} records`);
      return data.data;
    } else {
      throw new Error(data.error || 'Invalid response format');
    }
    
  } catch (error) {
    console.error('❌ Google Sheets error:', error);
    throw error;
  }
}

/**
 * Option 2: Public CSV URL (GitHub, CDN, etc.)
 */
export async function fetchFromPublicCSV(url: string): Promise<any[]> {
  console.log('🔄 Fetching from Public CSV...');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv,text/plain,*/*',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const data = parseCSVToJSON(csvText);
    
    console.log(`✅ Public CSV: ${data.length} records`);
    return data;
    
  } catch (error) {
    console.error('❌ Public CSV error:', error);
    throw error;
  }
}

/**
 * Option 3: Cloud Sync Storage (uses Firebase/similar service)
 */
export async function fetchFromCloudSync(projectId: string): Promise<any[]> {
  console.log('🔄 Fetching from Cloud Sync...');
  
  try {
    // This would connect to Firebase/Supabase/similar
    // For now, using localStorage as fallback
    const stored = localStorage.getItem(`lms_cloud_sync_${projectId}`);
    
    if (!stored) {
      throw new Error('No cloud sync data available');
    }
    
    const data = JSON.parse(stored);
    console.log(`✅ Cloud Sync: ${data.length} records`);
    return data;
    
  } catch (error) {
    console.error('❌ Cloud Sync error:', error);
    throw error;
  }
}

/**
 * Master data fetching function with fallback options
 */
export async function fetchTrainingDataWithFallback(): Promise<{
  data: any[];
  source: string;
  timestamp: string;
}> {
  const timestamp = new Date().toISOString();
  
  // Try Google Sheets first
  for (const source of availableDataSources) {
    if (source.status !== 'active') continue;
    
    try {
      let data: any[] = [];
      
      switch (source.type) {
        case 'googleSheets':
          if (source.url) {
            data = await fetchFromGoogleSheets(source.url);
          }
          break;
          
        case 'publicCSV':
          if (source.url) {
            data = await fetchFromPublicCSV(source.url);
          }
          break;
          
        case 'cloudSync':
          data = await fetchFromCloudSync('lms-dashboard');
          break;
      }
      
      if (data && data.length > 0) {
        console.log(`✅ Successfully loaded data from ${source.name}`);
        return {
          data,
          source: source.name,
          timestamp
        };
      }
      
    } catch (error) {
      console.warn(`⚠️ ${source.name} failed:`, error);
      continue;
    }
  }
  
  // If all sources fail, try local storage as last resort
  try {
    const localData = localStorage.getItem('lms_training_data');
    if (localData) {
      const parsed = JSON.parse(localData);
      console.log('📱 Using local storage as fallback');
      return {
        data: parsed,
        source: 'Local Storage',
        timestamp
      };
    }
  } catch (error) {
    console.error('❌ Local storage fallback failed:', error);
  }
  
  throw new Error('All data sources failed to load');
}

/**
 * Simple CSV to JSON parser
 */
function parseCSVToJSON(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('Invalid CSV format');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const record: any = {};
    
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    data.push(record);
  }
  
  return data;
}

/**
 * Configuration management
 */
export function updateDataSourceConfig(sourceId: string, config: Partial<DataSource>): void {
  const index = availableDataSources.findIndex(s => s.id === sourceId);
  if (index >= 0) {
    availableDataSources[index] = { ...availableDataSources[index], ...config };
    
    // Save to localStorage
    localStorage.setItem('lms_data_sources', JSON.stringify(availableDataSources));
    
    console.log(`✅ Updated ${sourceId} configuration`);
  }
}

/**
 * Get current data source status
 */
export function getDataSourceStatus(): DataSource[] {
  try {
    const stored = localStorage.getItem('lms_data_sources');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load data source config from storage');
  }
  
  return availableDataSources;
}