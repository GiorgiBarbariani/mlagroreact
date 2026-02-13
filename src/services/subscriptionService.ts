import { apiClient } from '../api/apiClient';

export interface SubscriptionPlan {
  id: number;
  name: string;
  nameKa: string;
  description: string;
  descriptionKa: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxFields: number;
  maxWeatherRequests: number;
  hasAdvancedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasExportFeatures: boolean;
  isActive: boolean;
}

export interface UserSubscription {
  id: number;
  userId: string;
  subscriptionPlanId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
  paymentMethod: string;
  status: string;
  plan: SubscriptionPlan;
}

export interface UsageTracking {
  id: number;
  userId: string;
  weatherRequestsCount: number;
  fieldsCount: number;
  exportsCount: number;
  resetDate: string;
  lastUpdated: string;
}

export interface PaymentHistory {
  id: number;
  userId: string;
  subscriptionPlanId: number;
  amount: number;
  currency: string;
  transactionId: string;
  paymentMethod: string;
  status: string;
  paymentDate: string;
  subscriptionPlan: SubscriptionPlan;
}

export interface SubscribeRequest {
  planId: number;
  billingPeriod: 'monthly' | 'yearly';
  paymentMethod?: string;
  customAmount?: number;
  hectares?: number;
}

export interface PaymentResponse {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  redirectUrl?: string;
  detailsUrl?: string;
  message?: string;
}

// Default plans for when API doesn't return data
const defaultPlans: SubscriptionPlan[] = [
  {
    id: 1,
    name: 'Basic',
    nameKa: 'ბაზისური',
    description: 'Perfect for small farms',
    descriptionKa: 'იდეალურია მცირე ფერმებისთვის',
    priceMonthly: 29,
    priceYearly: 290,
    currency: 'GEL',
    maxFields: 5,
    maxWeatherRequests: 100,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    hasExportFeatures: true,
    isActive: true
  },
  {
    id: 2,
    name: 'Standard',
    nameKa: 'სტანდარტული',
    description: 'Best for growing farms',
    descriptionKa: 'საუკეთესო მზარდი ფერმებისთვის',
    priceMonthly: 59,
    priceYearly: 590,
    currency: 'GEL',
    maxFields: 20,
    maxWeatherRequests: 500,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: false,
    hasExportFeatures: true,
    isActive: true
  },
  {
    id: 3,
    name: 'Premium',
    nameKa: 'პრემიუმ',
    description: 'For large agricultural operations',
    descriptionKa: 'დიდი სასოფლო-სამეურნეო ოპერაციებისთვის',
    priceMonthly: 99,
    priceYearly: 990,
    currency: 'GEL',
    maxFields: -1,
    maxWeatherRequests: -1,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true,
    hasExportFeatures: true,
    isActive: true
  }
];

class SubscriptionService {
  // Get all available plans
  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await apiClient.get('/subscription/plans');
      return response.data?.plans || response.data || defaultPlans;
    } catch (error) {
      console.error('Error fetching plans:', error);
      return defaultPlans;
    }
  }

  // Get user's current subscription
  async getCurrentSubscription(): Promise<UserSubscription | null> {
    try {
      const response = await apiClient.get('/subscription/current');
      return response.data;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      return null;
    }
  }

  // Get user's usage tracking
  async getUsage(): Promise<UsageTracking | null> {
    try {
      const response = await apiClient.get('/subscription/usage');
      return response.data;
    } catch (error) {
      console.error('Error fetching usage:', error);
      return null;
    }
  }

  // Subscribe to a plan
  async subscribe(request: SubscribeRequest): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post('/subscription/subscribe', request);
      return response.data;
    } catch (error: any) {
      console.error('Error subscribing:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'შეცდომა გადახდისას'
      };
    }
  }

  // Check payment status
  async checkPaymentStatus(orderId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/subscription/status/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  }

  // Cancel subscription
  async cancelSubscription(): Promise<boolean> {
    try {
      await apiClient.post('/subscription/cancel');
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  // Get payment history
  async getPaymentHistory(): Promise<PaymentHistory[]> {
    try {
      const response = await apiClient.get('/subscription/payment-history');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }

  // Toggle auto-renewal
  async toggleAutoRenew(): Promise<boolean> {
    try {
      await apiClient.post('/subscription/toggle-auto-renew');
      return true;
    } catch (error) {
      console.error('Error toggling auto-renew:', error);
      return false;
    }
  }

  // Check feature access
  async checkAccess(feature: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/subscription/check-access/${feature}`);
      return response.data?.hasAccess || false;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }

  // Get user's fields for hectare calculation
  async getUserFields(companyId?: string): Promise<any[]> {
    try {
      const url = companyId ? `/fields?companyId=${companyId}` : '/fields';
      const response = await apiClient.get(url);
      return response.data?.data || response.data?.fields || response.data || [];
    } catch (error) {
      console.error('Error fetching fields:', error);
      return [];
    }
  }

  // Helper: Format price
  formatPrice(price: number, currency: string = 'GEL'): string {
    return `${price} ${currency}`;
  }

  // Helper: Calculate yearly savings percentage
  calculateSavings(monthly: number, yearly: number): number {
    const monthlyTotal = monthly * 12;
    const savings = ((monthlyTotal - yearly) / monthlyTotal) * 100;
    return Math.round(savings);
  }

  // Helper: Format limit display
  formatLimit(limit: number): string {
    return limit === -1 ? '∞' : limit.toString();
  }

  // Helper: Calculate hectare-based price (5 GEL per hectare)
  calculateHectarePrice(hectares: number, pricePerHectare: number = 5): number {
    return Math.round(hectares * pricePerHectare * 100) / 100;
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
