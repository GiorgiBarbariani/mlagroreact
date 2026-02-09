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

interface RegisterData {
  email: string;
  password: string;
  name: string;
  companyName?: string;
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  }

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  async validateToken(token: string): Promise<LoginResponse['user']> {
    const response = await apiClient.get<LoginResponse['user']>('/auth/validate', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
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
}

export const authService = new AuthService();