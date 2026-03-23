import { apiClient } from '../api/apiClient';

export type DistributionStatus = 'PENDING' | 'LOADING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type DistributionType = 'DELIVERY' | 'PICKUP';
export type DistributionItemStatus = 'DI_PENDING' | 'LOADED' | 'DI_DELIVERED' | 'DI_RETURNED' | 'DI_DAMAGED';
export type DistributionLogAction = 'DL_CREATED' | 'LOADING_STARTED' | 'ITEM_LOADED' | 'DEPARTED' | 'ARRIVED' | 'DL_DELIVERED' | 'DL_CANCELLED' | 'DL_RETURNED' | 'NOTE_ADDED';

export interface DistributionCustomer {
  id: string;
  companyId: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Distribution {
  id: string;
  code: string | null;
  companyId: string;
  customerId: string | null;
  customer: DistributionCustomer | null;
  type: DistributionType;
  status: DistributionStatus;
  scheduledDate: string | null;
  departureDate: string | null;
  deliveryDate: string | null;
  sourceStorageId: string | null;
  destinationCity: string | null;
  destinationAddress: string | null;
  vehiclePlate: string | null;
  driverName: string | null;
  driverPhone: string | null;
  totalWeight: number;
  weightUnit: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: DistributionItem[];
}

export interface DistributionItem {
  id: string;
  distributionId: string;
  productName: string;
  quantity: number;
  unit: string;
  storageItemId: string | null;
  status: DistributionItemStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionLog {
  id: string;
  distributionId: string;
  action: DistributionLogAction;
  performedById: string;
  notes: string | null;
  createdAt: string;
}

export interface DistributionSummary {
  totalDistributions: number;
  pendingCount: number;
  inTransitCount: number;
  deliveredCount: number;
  cancelledCount: number;
  totalCustomers: number;
  totalWeightDelivered: number;
}

export interface CreateDistributionDto {
  code?: string;
  type: DistributionType;
  customerId?: string;
  scheduledDate?: string;
  sourceStorageId?: string;
  destinationCity?: string;
  destinationAddress?: string;
  vehiclePlate?: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
}

export interface CreateDistributionItemDto {
  productName: string;
  quantity: number;
  unit: string;
  storageItemId?: string;
  notes?: string;
}

export interface CreateCustomerDto {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  notes?: string;
}

class DistributionService {
  // ==================== Distributions ====================

  async getDistributions(companyId?: string): Promise<Distribution[]> {
    try {
      const params = companyId ? { companyId } : {};
      const response = await apiClient.get('/distribution', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching distributions:', error);
      return [];
    }
  }

  async getDistributionById(id: string): Promise<Distribution | null> {
    try {
      const response = await apiClient.get(`/distribution/${id}`);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching distribution:', error);
      return null;
    }
  }

  async createDistribution(data: CreateDistributionDto, companyId?: string): Promise<Distribution | null> {
    try {
      const payload = companyId ? { ...data, companyId } : data;
      const response = await apiClient.post('/distribution', payload);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error creating distribution:', error);
      throw error;
    }
  }

  async updateDistribution(id: string, data: Partial<CreateDistributionDto & { status: DistributionStatus }>): Promise<Distribution | null> {
    try {
      const response = await apiClient.put(`/distribution/${id}`, data);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error updating distribution:', error);
      throw error;
    }
  }

  async deleteDistribution(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/distribution/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting distribution:', error);
      return false;
    }
  }

  // ==================== Distribution Items ====================

  async getDistributionItems(distributionId: string): Promise<DistributionItem[]> {
    try {
      const response = await apiClient.get(`/distribution/${distributionId}/items`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching distribution items:', error);
      return [];
    }
  }

  async addDistributionItem(distributionId: string, data: CreateDistributionItemDto): Promise<DistributionItem | null> {
    try {
      const response = await apiClient.post(`/distribution/${distributionId}/items`, data);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error adding distribution item:', error);
      throw error;
    }
  }

  async updateDistributionItem(itemId: string, data: Partial<{ status: DistributionItemStatus; quantity: number; notes: string }>): Promise<DistributionItem | null> {
    try {
      const response = await apiClient.put(`/distribution/items/${itemId}`, data);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error updating distribution item:', error);
      throw error;
    }
  }

  async deleteDistributionItem(itemId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/distribution/items/${itemId}`);
      return true;
    } catch (error) {
      console.error('Error deleting distribution item:', error);
      return false;
    }
  }

  // ==================== Customers ====================

  async getCustomers(companyId?: string): Promise<DistributionCustomer[]> {
    try {
      const params = companyId ? { companyId } : {};
      const response = await apiClient.get('/distribution/customers', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  async getCustomerById(id: string): Promise<DistributionCustomer | null> {
    try {
      const response = await apiClient.get(`/distribution/customers/${id}`);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
  }

  async createCustomer(data: CreateCustomerDto, companyId?: string): Promise<DistributionCustomer | null> {
    try {
      const payload = companyId ? { ...data, companyId } : data;
      const response = await apiClient.post('/distribution/customers', payload);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, data: Partial<CreateCustomerDto>): Promise<DistributionCustomer | null> {
    try {
      const response = await apiClient.put(`/distribution/customers/${id}`, data);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/distribution/customers/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  // ==================== Logs ====================

  async getDistributionLogs(distributionId: string): Promise<DistributionLog[]> {
    try {
      const response = await apiClient.get(`/distribution/${distributionId}/logs`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching distribution logs:', error);
      return [];
    }
  }

  // ==================== Code & Summary ====================

  async generateCode(type: DistributionType): Promise<string> {
    try {
      const response = await apiClient.get('/distribution/generate-code', { params: { type } });
      return response.data?.data?.code || '';
    } catch (error) {
      console.error('Error generating code:', error);
      return '';
    }
  }

  async getCompanySummary(companyId?: string): Promise<DistributionSummary | null> {
    try {
      const params = companyId ? { companyId } : {};
      const response = await apiClient.get('/distribution/company/summary', { params });
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching company summary:', error);
      return null;
    }
  }

  async createFromStorage(data: {
    storageId: string;
    storageItemIds: string[];
    customerId?: string;
    scheduledDate?: string;
    vehiclePlate?: string;
    driverName?: string;
    driverPhone?: string;
    notes?: string;
  }, companyId?: string): Promise<Distribution | null> {
    try {
      const payload = companyId ? { ...data, companyId } : data;
      const response = await apiClient.post('/distribution/from-storage', payload);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error creating distribution from storage:', error);
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  getTypeInfo(type: DistributionType): { label: string; icon: string; color: string } {
    switch (type) {
      case 'DELIVERY':
        return { label: 'მიტანა', icon: '🚚', color: '#3b82f6' };
      case 'PICKUP':
        return { label: 'გატანა', icon: '📦', color: '#f59e0b' };
    }
  }

  getStatusInfo(status: DistributionStatus): { label: string; color: string; bgColor: string } {
    switch (status) {
      case 'PENDING':
        return { label: 'მოლოდინში', color: '#f59e0b', bgColor: '#fef3c7' };
      case 'LOADING':
        return { label: 'იტვირთება', color: '#8b5cf6', bgColor: '#ede9fe' };
      case 'IN_TRANSIT':
        return { label: 'გზაში', color: '#3b82f6', bgColor: '#dbeafe' };
      case 'DELIVERED':
        return { label: 'ჩაბარებული', color: '#10b981', bgColor: '#d1fae5' };
      case 'CANCELLED':
        return { label: 'გაუქმებული', color: '#6b7280', bgColor: '#f3f4f6' };
      case 'RETURNED':
        return { label: 'დაბრუნებული', color: '#ef4444', bgColor: '#fee2e2' };
    }
  }

  getItemStatusInfo(status: DistributionItemStatus): { label: string; color: string; bgColor: string } {
    switch (status) {
      case 'DI_PENDING':
        return { label: 'მოლოდინში', color: '#f59e0b', bgColor: '#fef3c7' };
      case 'LOADED':
        return { label: 'ჩატვირთული', color: '#8b5cf6', bgColor: '#ede9fe' };
      case 'DI_DELIVERED':
        return { label: 'ჩაბარებული', color: '#10b981', bgColor: '#d1fae5' };
      case 'DI_RETURNED':
        return { label: 'დაბრუნებული', color: '#ef4444', bgColor: '#fee2e2' };
      case 'DI_DAMAGED':
        return { label: 'დაზიანებული', color: '#f59e0b', bgColor: '#fef3c7' };
    }
  }

  getLogActionInfo(action: DistributionLogAction): { label: string; color: string } {
    switch (action) {
      case 'DL_CREATED':
        return { label: 'შეიქმნა', color: '#10b981' };
      case 'LOADING_STARTED':
        return { label: 'ჩატვირთვა დაიწყო', color: '#8b5cf6' };
      case 'ITEM_LOADED':
        return { label: 'ნივთი ჩაიტვირთა', color: '#3b82f6' };
      case 'DEPARTED':
        return { label: 'გაემგზავრა', color: '#3b82f6' };
      case 'ARRIVED':
        return { label: 'ჩავიდა', color: '#10b981' };
      case 'DL_DELIVERED':
        return { label: 'ჩაბარდა', color: '#10b981' };
      case 'DL_CANCELLED':
        return { label: 'გაუქმდა', color: '#6b7280' };
      case 'DL_RETURNED':
        return { label: 'დაბრუნდა', color: '#ef4444' };
      case 'NOTE_ADDED':
        return { label: 'შენიშვნა', color: '#6b7280' };
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

  getDeliveryProgressPercent(status: DistributionStatus): number {
    switch (status) {
      case 'PENDING': return 0;
      case 'LOADING': return 25;
      case 'IN_TRANSIT': return 50;
      case 'DELIVERED': return 100;
      case 'CANCELLED': return 0;
      case 'RETURNED': return 0;
    }
  }

  getProgressColor(status: DistributionStatus): string {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'LOADING': return '#8b5cf6';
      case 'IN_TRANSIT': return '#3b82f6';
      case 'DELIVERED': return '#10b981';
      case 'CANCELLED': return '#6b7280';
      case 'RETURNED': return '#ef4444';
    }
  }
}

export const distributionService = new DistributionService();
export default distributionService;
