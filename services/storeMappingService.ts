/**
 * Service for fetching and managing store mapping data from Google Sheets
 * This service replaces the hardcoded storeMapping.ts file with dynamic data from Google Sheets
 */

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbw6uRGfbz6nx8_8MHxAR8l-j72X-W-IDQYs1gAoZoo1BDlBM-RYoa4RM_VOo9UWaBl2rw/exec';

export interface GoogleSheetStoreRecord {
  'Store ID': string;
  'Store Name': string;
  'AM': string;
  'AM Name': string;
  'Region': string;
  'HRBP 1'?: string;
  'HRBP 1 Name'?: string;
  'HRBP 2'?: string;
  'HRBP 2 Name'?: string;
  'HRBP 3'?: string;
  'HRBP 3 Name'?: string;
  'Trainer 1'?: string;
  'Trainer 1 Name'?: string;
  'Trainer 2'?: string;
  'Trainer 2 Name'?: string;
  'Trainer 3'?: string;
  'Trainer 3 Name'?: string;
  'Regional Trainer'?: string;
  'Regional Trainer Name'?: string;
  'Regional HR'?: string;
  'Regional HR Name'?: string;
  'HR Head'?: string;
  'HR Head Name'?: string;
  'Store Format'?: string;
  'Menu Type'?: string;
  'Price Group'?: string;
  'HRBP'?: string;
  'HRBP Name'?: string;
}

export interface StoreRecord {
  'Store ID': string;
  location: string; // Maps to Store Name
  Region: string;
  AM: string; // Area Manager ID
  Trainer: string; // Primary Trainer (Trainer 1)
  // Additional fields to support multiple trainers
  'Trainer 1'?: string;
  'Trainer 2'?: string;
  'Trainer 3'?: string;
}

interface GoogleSheetsResponse {
  success: boolean;
  message: string;
  data: GoogleSheetStoreRecord[];
}

let cachedStoreData: StoreRecord[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Transforms Google Sheets data format to app's StoreRecord format
 */
function transformStoreData(googleData: GoogleSheetStoreRecord[]): StoreRecord[] {
  return googleData.map(store => ({
    'Store ID': store['Store ID'],
    location: store['Store Name'],
    Region: store['Region'],
    AM: store['AM'],
    Trainer: store['Trainer 1'] || '', // Primary trainer is Trainer 1
    'Trainer 1': store['Trainer 1'],
    'Trainer 2': store['Trainer 2'],
    'Trainer 3': store['Trainer 3'],
  }));
}

/**
 * Fetches store mapping data from Google Sheets
 * Uses caching to minimize API calls
 */
export async function fetchStoreMappingData(forceRefresh: boolean = false): Promise<StoreRecord[]> {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (!forceRefresh && cachedStoreData && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedStoreData;
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: GoogleSheetsResponse = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Failed to fetch store mapping data');
    }
    
    const transformedData = transformStoreData(data.data);
    cachedStoreData = transformedData;
    lastFetchTime = now;
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching store mapping data:', error);
    
    // If we have cached data, return it even if expired
    if (cachedStoreData) {
      console.warn('Using stale cached data due to fetch error');
      return cachedStoreData;
    }
    
    throw error;
  }
}

/**
 * Checks if a trainer ID has access to a specific store
 * A trainer has access if their ID appears in Trainer 1, Trainer 2, or Trainer 3 fields
 */
export function isTrainerForStore(trainerId: string, store: StoreRecord): boolean {
  const normalizedId = trainerId.toUpperCase();
  
  return (
    store['Trainer 1']?.toUpperCase() === normalizedId ||
    store['Trainer 2']?.toUpperCase() === normalizedId ||
    store['Trainer 3']?.toUpperCase() === normalizedId
  );
}

/**
 * Checks if an Area Manager ID has access to a specific store
 */
export function isAreaManagerForStore(amId: string, store: StoreRecord): boolean {
  return store.AM?.toUpperCase() === amId.toUpperCase();
}

/**
 * Gets all stores where the given ID is a Trainer
 */
export function getStoresForTrainer(trainerId: string, stores: StoreRecord[]): StoreRecord[] {
  return stores.filter(store => isTrainerForStore(trainerId, store));
}

/**
 * Gets all stores where the given ID is an Area Manager
 */
export function getStoresForAreaManager(amId: string, stores: StoreRecord[]): StoreRecord[] {
  return stores.filter(store => isAreaManagerForStore(amId, store));
}

/**
 * Gets all stores where the given ID is either a Trainer or Area Manager
 */
export function getStoresForTrainerOrAM(id: string, stores: StoreRecord[]): StoreRecord[] {
  return stores.filter(store => 
    isTrainerForStore(id, store) || isAreaManagerForStore(id, store)
  );
}

/**
 * Clears the cache (useful for testing or forcing a refresh)
 */
export function clearCache(): void {
  cachedStoreData = null;
  lastFetchTime = 0;
}
