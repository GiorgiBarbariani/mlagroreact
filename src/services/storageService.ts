import { apiClient } from '../api/apiClient';

export type StorageType = 'REFRIGERATOR' | 'WAREHOUSE';
export type StorageKind = 'DRY' | 'COLD' | 'MIXED';
export type StorageStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type StorageItemStatus = 'STORED' | 'DISPATCHED' | 'EXPIRED' | 'DAMAGED';
export type StorageLogAction = 'ENTRY' | 'EXIT' | 'TEMPERATURE_CHANGE' | 'INSPECTION';

export interface Storage {
  id: string;
  code: string | null;
  name: string;
  type: StorageType;
  storageKind: StorageKind;
  capacity: number;
  capacityUnit: string;
  currentLoad: number;
  temperatureMin: number | null;
  temperatureMax: number | null;
  currentTemperature: number | null;
  city: string | null;
  location: string | null;
  address: string | null;
  companyId: string;
  status: StorageStatus;
  managerName: string | null;
  managerPhone: string | null;
  managerEmail: string | null;
  workingHours: string | null;
  createdAt: string;
  updatedAt: string;
  items?: StorageItem[];
}

export interface StorageItem {
  id: string;
  storageId: string;
  productName: string;
  quantity: number;
  unit: string;
  entryDate: string;
  expiryDate: string | null;
  cropId: string | null;
  fieldId: string | null;
  status: StorageItemStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageLog {
  id: string;
  storageId: string;
  storageItemId: string | null;
  action: StorageLogAction;
  quantity: number | null;
  temperature: number | null;
  performedById: string;
  notes: string | null;
  createdAt: string;
}

export interface StorageStats {
  totalCapacity: number;
  currentLoad: number;
  utilizationPercent: number;
  storedItemsCount: number;
  expiredItemsCount: number;
  dispatchedItemsCount: number;
  totalItemsCount: number;
}

export interface CompanySummary {
  totalStorages: number;
  totalCapacity: number;
  totalCurrentLoad: number;
  utilizationPercent: number;
  refrigeratorCount: number;
  warehouseCount: number;
  expiredItemsCount: number;
  temperatureAlerts: number;
}

export interface CreateStorageDto {
  name: string;
  code?: string;
  type: StorageType;
  storageKind?: StorageKind;
  capacity: number;
  capacityUnit?: string;
  temperatureMin?: number | null;
  temperatureMax?: number | null;
  city?: string;
  location?: string;
  address?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  workingHours?: string;
}

export interface CreateStorageItemDto {
  productName: string;
  quantity: number;
  unit: string;
  entryDate?: string;
  expiryDate?: string;
  cropId?: string;
  fieldId?: string;
  notes?: string;
}

class StorageService {
  async getStorages(companyId?: string): Promise<Storage[]> {
    try {
      const params = companyId ? { companyId } : {};
      const response = await apiClient.get('/storage', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching storages:', error);
      return [];
    }
  }

  async getStorageById(id: string): Promise<Storage | null> {
    try {
      const response = await apiClient.get(`/storage/${id}`);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching storage:', error);
      return null;
    }
  }

  async createStorage(data: CreateStorageDto, companyId?: string): Promise<Storage | null> {
    try {
      const payload = companyId ? { ...data, companyId } : data;
      const response = await apiClient.post('/storage', payload);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error creating storage:', error);
      throw error;
    }
  }

  async updateStorage(id: string, data: Partial<CreateStorageDto & { status: StorageStatus }>): Promise<Storage | null> {
    try {
      const response = await apiClient.put(`/storage/${id}`, data);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error updating storage:', error);
      throw error;
    }
  }

  async deleteStorage(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/storage/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting storage:', error);
      return false;
    }
  }

  async getStorageItems(storageId: string): Promise<StorageItem[]> {
    try {
      const response = await apiClient.get(`/storage/${storageId}/items`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching storage items:', error);
      return [];
    }
  }

  async addStorageItem(storageId: string, data: CreateStorageItemDto): Promise<StorageItem | null> {
    try {
      const response = await apiClient.post(`/storage/${storageId}/items`, data);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error adding storage item:', error);
      throw error;
    }
  }

  async updateStorageItem(itemId: string, data: Partial<{ status: StorageItemStatus; quantity: number; notes: string }>): Promise<StorageItem | null> {
    try {
      const response = await apiClient.put(`/storage/items/${itemId}`, data);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error updating storage item:', error);
      throw error;
    }
  }

  async deleteStorageItem(itemId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/storage/items/${itemId}`);
      return true;
    } catch (error) {
      console.error('Error deleting storage item:', error);
      return false;
    }
  }

  async getStorageStats(storageId: string): Promise<StorageStats | null> {
    try {
      const response = await apiClient.get(`/storage/${storageId}/stats`);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching storage stats:', error);
      return null;
    }
  }

  async getStorageLogs(storageId: string): Promise<StorageLog[]> {
    try {
      const response = await apiClient.get(`/storage/${storageId}/logs`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching storage logs:', error);
      return [];
    }
  }

  async generateCode(type: StorageType): Promise<string> {
    try {
      const response = await apiClient.get('/storage/generate-code', { params: { type } });
      return response.data?.data?.code || '';
    } catch (error) {
      console.error('Error generating code:', error);
      return '';
    }
  }

  async getCompanySummary(companyId?: string): Promise<CompanySummary | null> {
    try {
      const params = companyId ? { companyId } : {};
      const response = await apiClient.get('/storage/company/summary', { params });
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching company summary:', error);
      return null;
    }
  }

  // Helper methods
  getTypeInfo(type: StorageType): { label: string; icon: string; color: string } {
    switch (type) {
      case 'REFRIGERATOR':
        return { label: 'სამაცივრე', icon: '❄️', color: '#3b82f6' };
      case 'WAREHOUSE':
        return { label: 'საწყობი', icon: '🏭', color: '#f59e0b' };
    }
  }

  getKindInfo(kind: StorageKind): { label: string; color: string; bgColor: string } {
    switch (kind) {
      case 'DRY':
        return { label: 'მშრალი', color: '#f59e0b', bgColor: '#fef3c7' };
      case 'COLD':
        return { label: 'ცივი', color: '#3b82f6', bgColor: '#dbeafe' };
      case 'MIXED':
        return { label: 'შერეული', color: '#8b5cf6', bgColor: '#ede9fe' };
    }
  }

  getStatusInfo(status: StorageStatus): { label: string; color: string; bgColor: string } {
    switch (status) {
      case 'ACTIVE':
        return { label: 'აქტიური', color: '#10b981', bgColor: '#d1fae5' };
      case 'INACTIVE':
        return { label: 'არააქტიური', color: '#6b7280', bgColor: '#f3f4f6' };
      case 'MAINTENANCE':
        return { label: 'ტექ. მომსახურება', color: '#f59e0b', bgColor: '#fef3c7' };
    }
  }

  getItemStatusInfo(status: StorageItemStatus): { label: string; color: string; bgColor: string } {
    switch (status) {
      case 'STORED':
        return { label: 'შენახული', color: '#10b981', bgColor: '#d1fae5' };
      case 'DISPATCHED':
        return { label: 'გატანილი', color: '#3b82f6', bgColor: '#dbeafe' };
      case 'EXPIRED':
        return { label: 'ვადაგასული', color: '#ef4444', bgColor: '#fee2e2' };
      case 'DAMAGED':
        return { label: 'დაზიანებული', color: '#f59e0b', bgColor: '#fef3c7' };
    }
  }

  getLogActionInfo(action: StorageLogAction): { label: string; color: string } {
    switch (action) {
      case 'ENTRY':
        return { label: 'შეტანა', color: '#10b981' };
      case 'EXIT':
        return { label: 'გატანა', color: '#ef4444' };
      case 'TEMPERATURE_CHANGE':
        return { label: 'ტემპერატურის ცვლილება', color: '#3b82f6' };
      case 'INSPECTION':
        return { label: 'ინსპექცია', color: '#8b5cf6' };
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ka-GE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getUtilizationColor(percent: number): string {
    if (percent >= 90) return '#ef4444';
    if (percent >= 70) return '#f59e0b';
    return '#10b981';
  }
}

export const storageService = new StorageService();
export default storageService;
