import { apiClient } from '../api/apiClient';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId?: string;
  };
  token: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  userId: string;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  }

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/register', {
      email: data.email,
      username: data.username,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'Company' // Always register as Company
    });
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  async validateToken(token: string): Promise<LoginResponse['user']> {
    const response = await apiClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    // The /auth/me endpoint returns { user: {...} }, so we need to extract the user
    return response.data?.user || response.data;
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  }

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  }

  async ensureCompany(): Promise<{ companyId: string; company: any }> {
    const token = localStorage.getItem('token');
    const response = await apiClient.post('/auth/ensure-company', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
}

export const authService = new AuthService();