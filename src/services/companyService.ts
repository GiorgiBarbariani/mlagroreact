import { apiClient } from '../api/apiClient';

export interface Company {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName?: string;
  employeeCount: number;
  fieldCount: number;
  totalArea: number;
  subscriptionType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  role: string;
  companyId: string;
  userId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CompanyTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  assignedToName?: string;
  companyId: string;
  fieldId?: string;
  dueDate?: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

class CompanyService {
  // Company operations
  async getCompanyInfo(): Promise<Company> {
    const response = await apiClient.get<Company>('/company/info');
    return response.data;
  }

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    const response = await apiClient.put<Company>(`/company/${id}`, data);
    return response.data;
  }

  async createCompany(data: Partial<Company>): Promise<Company> {
    const response = await apiClient.post<Company>('/company', data);
    return response.data;
  }

  // Employee operations
  async getEmployees(companyId?: string): Promise<Employee[]> {
    const url = companyId ? `/company/${companyId}/employees` : '/company/employees';
    const response = await apiClient.get<Employee[]>(url);
    return response.data;
  }

  async getEmployee(employeeId: string): Promise<Employee> {
    const response = await apiClient.get<Employee>(`/company/employees/${employeeId}`);
    return response.data;
  }

  async addEmployee(data: Partial<Employee>): Promise<Employee> {
    const response = await apiClient.post<Employee>('/company/employees', data);
    return response.data;
  }

  async updateEmployee(employeeId: string, data: Partial<Employee>): Promise<Employee> {
    const response = await apiClient.put<Employee>(`/company/employees/${employeeId}`, data);
    return response.data;
  }

  async deleteEmployee(employeeId: string): Promise<void> {
    await apiClient.delete(`/company/employees/${employeeId}`);
  }

  // Task operations
  async getTasks(companyId?: string): Promise<CompanyTask[]> {
    const url = companyId ? `/company/${companyId}/tasks` : '/company/tasks';
    const response = await apiClient.get<CompanyTask[]>(url);
    return response.data;
  }

  async getTask(taskId: string): Promise<CompanyTask> {
    const response = await apiClient.get<CompanyTask>(`/company/tasks/${taskId}`);
    return response.data;
  }

  async createTask(data: Partial<CompanyTask>): Promise<CompanyTask> {
    const response = await apiClient.post<CompanyTask>('/company/tasks', data);
    return response.data;
  }

  async updateTask(taskId: string, data: Partial<CompanyTask>): Promise<CompanyTask> {
    const response = await apiClient.put<CompanyTask>(`/company/tasks/${taskId}`, data);
    return response.data;
  }

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/company/tasks/${taskId}`);
  }

  async completeTask(taskId: string): Promise<CompanyTask> {
    const response = await apiClient.put<CompanyTask>(`/company/tasks/${taskId}/complete`, {});
    return response.data;
  }

  // Statistics
  async getCompanyStats(): Promise<{
    totalEmployees: number;
    totalFields: number;
    totalArea: number;
    activeTasks: number;
    completedTasks: number;
  }> {
    const response = await apiClient.get('/company/stats');
    return response.data;
  }
}

export const companyService = new CompanyService();