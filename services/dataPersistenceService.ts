import { githubUploadService } from './githubUploadService';
import { fetchTrainingDataFromGitHub } from './githubService';

export interface DataPersistence {
  hasStoredData: boolean;
  lastUpdated: string | null;
  fileName: string | null;
}

export class DataPersistenceService {
  private static readonly STORAGE_KEY = 'lms_training_data';
  private static readonly METADATA_KEY = 'lms_data_metadata';

  /**
   * Save training data to localStorage
   */
  static saveData(data: any[], fileName: string): void {
    try {
      const metadata = {
        fileName,
        lastUpdated: new Date().toISOString(),
        recordCount: data.length
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }

  /**
   * Load training data from localStorage
   */
  static loadData(): { data: any[] | null; metadata: any | null } {
    try {
      const dataStr = localStorage.getItem(this.STORAGE_KEY);
      const metadataStr = localStorage.getItem(this.METADATA_KEY);

      const data = dataStr ? JSON.parse(dataStr) : null;
      const metadata = metadataStr ? JSON.parse(metadataStr) : null;

      return { data, metadata };
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      return { data: null, metadata: null };
    }
  }

  /**
   * Check if there's stored data available
   */
  static getDataPersistenceInfo(): DataPersistence {
    const { metadata } = this.loadData();
    
    return {
      hasStoredData: !!metadata,
      lastUpdated: metadata?.lastUpdated || null,
      fileName: metadata?.fileName || null
    };
  }

  /**
   * Clear stored data
   */
  static clearData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.METADATA_KEY);
  }

  /**
   * Check for updates from GitHub and load latest data
   */
  static async checkForUpdates(): Promise<{ hasUpdates: boolean; data?: any[] }> {
    try {
      // Check if GitHub is configured
      if (!githubUploadService.isConfigured()) {
        return { hasUpdates: false };
      }

      // Get list of CSV files from GitHub
      const files = await githubUploadService.listDataFiles();
      if (files.length === 0) {
        return { hasUpdates: false };
      }

      // Get the latest file (sorted by name which includes timestamp)
      const latestFile = files.sort((a, b) => b.name.localeCompare(a.name))[0];
      
      // Check if this is newer than our stored data
      const { metadata } = this.loadData();
      const storedFileName = metadata?.fileName;

      if (storedFileName === latestFile.name) {
        return { hasUpdates: false };
      }

      // Download and parse the latest file
      if (latestFile.download_url) {
        const response = await fetch(latestFile.download_url);
        const csvText = await response.text();
        
        // Parse CSV (simple implementation)
        const data = this.parseCSV(csvText);
        
        // Save to localStorage
        this.saveData(data, latestFile.name);
        
        return { hasUpdates: true, data };
      }

      return { hasUpdates: false };
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return { hasUpdates: false };
    }
  }

  /**
   * Simple CSV parser
   */
  private static parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  }

  /**
   * Auto-load data on app startup with fallback strategy:
   * 1. Check GitHub for uploaded files (if configured)
   * 2. Load from local CSV file (fallback)
   * 3. Load from localStorage (cached data)
   */
  static async autoLoadData(): Promise<{ data: any[] | null; source: 'localStorage' | 'github' | 'localCSV' | 'none'; fileName?: string }> {
    try {
      // First try GitHub updates if configured
      const updateResult = await this.checkForUpdates();
      
      if (updateResult.hasUpdates && updateResult.data) {
        return { 
          data: updateResult.data, 
          source: 'github',
          fileName: this.getDataPersistenceInfo().fileName || undefined
        };
      }

      // If no GitHub updates, try local CSV file as fallback
      try {
        console.log('📊 Attempting to load data from local CSV...');
        const localCSVData = await fetchTrainingDataFromGitHub(); // This now loads from local CSV
        
        if (localCSVData && localCSVData.length > 0) {
          // Save the local CSV data to localStorage for future offline access
          this.saveData(localCSVData, 'Local CSV Data');
          
          return { 
            data: localCSVData, 
            source: 'localCSV',
            fileName: 'Local CSV File'
          };
        }
      } catch (error) {
        console.warn('⚠️ Local CSV fallback failed:', error);
      }

      // Final fallback to localStorage
      const { data, metadata } = this.loadData();
      
      if (data && data.length > 0) {
        return { 
          data, 
          source: 'localStorage',
          fileName: metadata?.fileName
        };
      }

      return { data: null, source: 'none' };
    } catch (error) {
      console.error('❌ Auto-load failed:', error);
      
      // Emergency fallback to localStorage only
      const { data, metadata } = this.loadData();
      return { 
        data: data && data.length > 0 ? data : null, 
        source: data ? 'localStorage' : 'none',
        fileName: metadata?.fileName
      };
    }
  }
}

export const dataPersistenceService = DataPersistenceService;