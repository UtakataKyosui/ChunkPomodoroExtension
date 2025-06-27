export interface StorageData {
  [key: string]: any;
}

export interface StorageCallbacks {
  onChanged?: (changes: { [key: string]: chrome.storage.StorageChange }) => void;
  onError?: (error: Error) => void;
}

export class StorageManager {
  private callbacks: StorageCallbacks;

  constructor(callbacks: StorageCallbacks = {}) {
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
          this.callbacks.onChanged?.(changes);
        }
      });
    }
  }

  async get<T = any>(key: string): Promise<T | null>;
  async get<T = any>(keys: string[]): Promise<{ [key: string]: T }>;
  async get<T = any>(keys: string | string[]): Promise<T | { [key: string]: T } | null> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.get(keys, (result) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              if (typeof keys === 'string') {
                resolve(result[keys] || null);
              } else {
                resolve(result);
              }
            }
          });
        });
      } else {
        // Fallback to localStorage
        if (typeof keys === 'string') {
          const value = localStorage.getItem(keys);
          return value ? JSON.parse(value) : null;
        } else {
          const result: { [key: string]: T } = {};
          for (const key of keys) {
            const value = localStorage.getItem(key);
            if (value) {
              result[key] = JSON.parse(value);
            }
          }
          return result;
        }
      }
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async set(key: string, value: any): Promise<void>;
  async set(data: StorageData): Promise<void>;
  async set(keyOrData: string | StorageData, value?: any): Promise<void> {
    try {
      const data = typeof keyOrData === 'string' ? { [keyOrData]: value } : keyOrData;

      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.set(data, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      } else {
        // Fallback to localStorage
        for (const [key, val] of Object.entries(data)) {
          localStorage.setItem(key, JSON.stringify(val));
        }
      }
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async remove(key: string): Promise<void>;
  async remove(keys: string[]): Promise<void>;
  async remove(keys: string | string[]): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.remove(keys, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      } else {
        // Fallback to localStorage
        const keysArray = typeof keys === 'string' ? [keys] : keys;
        for (const key of keysArray) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      } else {
        // Fallback to localStorage
        localStorage.clear();
      }
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async getBytesInUse(): Promise<number> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.getBytesInUse((bytes) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(bytes);
            }
          });
        });
      } else {
        // Estimate localStorage usage
        let totalSize = 0;
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length;
          }
        }
        return totalSize;
      }
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async getAll(): Promise<StorageData> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.get(null, (result) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
      } else {
        // Fallback to localStorage
        const result: StorageData = {};
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            try {
              result[key] = JSON.parse(localStorage[key]);
            } catch {
              result[key] = localStorage[key];
            }
          }
        }
        return result;
      }
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }
}

export class PomodoroStorage {
  private storage: StorageManager;
  private readonly KEYS = {
    SETTINGS: 'pomodoro_settings',
    SESSIONS: 'pomodoro_sessions',
    CURRENT_SESSION: 'pomodoro_current_session',
    CHUNKS: 'pomodoro_chunks',
    CURRENT_CHUNK: 'pomodoro_current_chunk',
    TASKS: 'pomodoro_tasks',
    STATISTICS: 'pomodoro_statistics'
  };

  constructor(callbacks?: StorageCallbacks) {
    this.storage = new StorageManager(callbacks);
  }

  async saveSettings(settings: any): Promise<void> {
    await this.storage.set(this.KEYS.SETTINGS, settings);
  }

  async getSettings(): Promise<any> {
    return await this.storage.get(this.KEYS.SETTINGS);
  }

  async saveSessions(sessions: any[]): Promise<void> {
    await this.storage.set(this.KEYS.SESSIONS, sessions);
  }

  async getSessions(): Promise<any[]> {
    const sessions = await this.storage.get(this.KEYS.SESSIONS);
    return sessions || [];
  }

  async saveCurrentSession(session: any): Promise<void> {
    await this.storage.set(this.KEYS.CURRENT_SESSION, session);
  }

  async getCurrentSession(): Promise<any | null> {
    return await this.storage.get(this.KEYS.CURRENT_SESSION);
  }

  async clearCurrentSession(): Promise<void> {
    await this.storage.remove(this.KEYS.CURRENT_SESSION);
  }

  async saveChunks(chunks: any[]): Promise<void> {
    await this.storage.set(this.KEYS.CHUNKS, chunks);
  }

  async getChunks(): Promise<any[]> {
    const chunks = await this.storage.get(this.KEYS.CHUNKS);
    return chunks || [];
  }

  async saveCurrentChunk(chunk: any): Promise<void> {
    await this.storage.set(this.KEYS.CURRENT_CHUNK, chunk);
  }

  async getCurrentChunk(): Promise<any | null> {
    return await this.storage.get(this.KEYS.CURRENT_CHUNK);
  }

  async clearCurrentChunk(): Promise<void> {
    await this.storage.remove(this.KEYS.CURRENT_CHUNK);
  }

  async saveTasks(tasks: any[]): Promise<void> {
    await this.storage.set(this.KEYS.TASKS, tasks);
  }

  async getTasks(): Promise<any[]> {
    const tasks = await this.storage.get(this.KEYS.TASKS);
    return tasks || [];
  }

  async saveStatistics(statistics: any): Promise<void> {
    await this.storage.set(this.KEYS.STATISTICS, statistics);
  }

  async getStatistics(): Promise<any> {
    return await this.storage.get(this.KEYS.STATISTICS);
  }

  async exportData(): Promise<string> {
    const allData = await this.storage.getAll();
    const exportData = Object.fromEntries(
      Object.entries(allData).filter(([key]) => 
        Object.values(this.KEYS).includes(key)
      )
    );
    return JSON.stringify(exportData, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      const validKeys = Object.values(this.KEYS);
      
      for (const [key, value] of Object.entries(data)) {
        if (validKeys.includes(key)) {
          await this.storage.set(key, value);
        }
      }
    } catch (error) {
      throw new Error('Invalid import data format');
    }
  }

  async clearAllData(): Promise<void> {
    const keys = Object.values(this.KEYS);
    await this.storage.remove(keys);
  }

  async getStorageUsage(): Promise<number> {
    return await this.storage.getBytesInUse();
  }
}

export function createStorageManager(callbacks?: StorageCallbacks): StorageManager {
  return new StorageManager(callbacks);
}

export function createPomodoroStorage(callbacks?: StorageCallbacks): PomodoroStorage {
  return new PomodoroStorage(callbacks);
}

export async function migrateStorageVersion(
  storage: PomodoroStorage,
  currentVersion: string,
  targetVersion: string
): Promise<void> {
  // Example migration logic
  if (currentVersion === '1.0.0' && targetVersion === '1.1.0') {
    // Add migration logic here
    console.log('Migrating from 1.0.0 to 1.1.0');
  }
}

export function validateStorageQuota(bytesUsed: number, maxBytes: number = 10485760): boolean {
  return bytesUsed < maxBytes * 0.9; // 90% of quota
}