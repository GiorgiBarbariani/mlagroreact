import { apiClient } from '../api/apiClient';

export interface Task {
  id: string;
  title: string;
  description: string;
  employeeId: string;
  employeeName?: string;
  dueDate: string;
  startDate?: string;
  endDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  companyId: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  employeeId: string;
  dueDate: string;
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  employeeId?: string;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Employee {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  role?: string;
}

class TaskService {
  // Get all tasks for the company
  async getTasks(): Promise<Task[]> {
    try {
      const response = await apiClient.get('/task/list');
      return response.data?.tasks || response.data || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  // Get tasks for specific employee
  async getTasksByEmployee(employeeId: string): Promise<Task[]> {
    try {
      const response = await apiClient.get(`/task/employee/${employeeId}`);
      return response.data?.tasks || response.data || [];
    } catch (error) {
      console.error('Error fetching employee tasks:', error);
      return [];
    }
  }

  // Get single task by ID
  async getTask(id: string): Promise<Task | null> {
    try {
      const response = await apiClient.get(`/task/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    }
  }

  // Create new task
  async createTask(task: CreateTaskDto): Promise<Task | null> {
    try {
      const response = await apiClient.post('/task', task);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Update task
  async updateTask(id: string, task: UpdateTaskDto): Promise<Task | null> {
    try {
      const response = await apiClient.put(`/task/${id}`, task);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // Update task status only
  async updateTaskStatus(id: string, status: Task['status']): Promise<Task | null> {
    try {
      const response = await apiClient.patch(`/task/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // Delete task
  async deleteTask(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/task/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  // Get employees for task assignment
  async getEmployees(): Promise<Employee[]> {
    try {
      const response = await apiClient.get('/employees/my-company');
      return response.data?.employees || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  // Helper: Get status display info
  getStatusInfo(status: Task['status']): { label: string; color: string; bgColor: string } {
    switch (status) {
      case 'pending':
        return { label: 'მოლოდინში', color: '#f59e0b', bgColor: '#fef3c7' };
      case 'in_progress':
        return { label: 'მიმდინარე', color: '#3b82f6', bgColor: '#dbeafe' };
      case 'completed':
        return { label: 'დასრულებული', color: '#10b981', bgColor: '#d1fae5' };
      case 'cancelled':
        return { label: 'გაუქმებული', color: '#6b7280', bgColor: '#f3f4f6' };
      default:
        return { label: status, color: '#6b7280', bgColor: '#f3f4f6' };
    }
  }

  // Helper: Get priority display info
  getPriorityInfo(priority: Task['priority']): { label: string; color: string; bgColor: string } {
    switch (priority) {
      case 'low':
        return { label: 'დაბალი', color: '#6b7280', bgColor: '#f3f4f6' };
      case 'medium':
        return { label: 'საშუალო', color: '#3b82f6', bgColor: '#dbeafe' };
      case 'high':
        return { label: 'მაღალი', color: '#f59e0b', bgColor: '#fef3c7' };
      case 'urgent':
        return { label: 'გადაუდებელი', color: '#ef4444', bgColor: '#fee2e2' };
      default:
        return { label: priority, color: '#6b7280', bgColor: '#f3f4f6' };
    }
  }

  // Helper: Format date for display
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ka-GE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Helper: Check if task is overdue
  isOverdue(task: Task): boolean {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  }
}

export const taskService = new TaskService();
export default taskService;
