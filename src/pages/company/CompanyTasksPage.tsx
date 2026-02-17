import React, { useState, useEffect } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlagIcon from '@mui/icons-material/Flag';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import { taskService } from '../../services/taskService';
import type { Task, CreateTaskDto, UpdateTaskDto, Employee } from '../../services/taskService';
import './CompanyTasksPage.scss';

type TabType = 'all' | 'pending' | 'in_progress' | 'completed';

interface TaskForm {
  title: string;
  description: string;
  employeeId: string;
  dueDate: string;
  startDate: string;
  status: Task['status'];
  priority: Task['priority'];
}

const initialFormState: TaskForm = {
  title: '',
  description: '',
  employeeId: '',
  dueDate: '',
  startDate: '',
  status: 'pending',
  priority: 'medium'
};

const CompanyTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskForm>(initialFormState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Filter tasks when search, tab, or employee filter changes
  useEffect(() => {
    let filtered = tasks;

    // Filter by tab/status
    if (activeTab !== 'all') {
      filtered = filtered.filter(task => task.status === activeTab);
    }

    // Filter by employee
    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(task => task.employeeId === selectedEmployee);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        task.employeeName?.toLowerCase().includes(search)
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, activeTab, selectedEmployee]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, employeesData] = await Promise.all([
        taskService.getTasks(),
        taskService.getEmployees()
      ]);
      setTasks(tasksData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({
      ...initialFormState,
      startDate: new Date().toISOString().split('T')[0]
    });
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      employeeId: task.employeeId,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      startDate: task.startDate ? task.startDate.split('T')[0] : '',
      status: task.status,
      priority: task.priority
    });
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData(initialFormState);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.employeeId || !formData.dueDate) {
      setError('გთხოვთ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }

    setSaving(true);
    try {
      if (editingTask) {
        await taskService.updateTask(editingTask.id, formData as UpdateTaskDto);
      } else {
        await taskService.createTask(formData as CreateTaskDto);
      }
      await loadData();
      closeModal();
    } catch (error: any) {
      setError(error.response?.data?.error || 'შეცდომა დავალების შენახვისას');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    try {
      await taskService.updateTaskStatus(task.id, newStatus);
      await loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`დარწმუნებული ხართ, რომ გსურთ "${task.title}" დავალების წაშლა?`)) {
      return;
    }
    try {
      await taskService.deleteTask(task.id);
      await loadData();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return <PendingIcon />;
      case 'in_progress':
        return <AccessTimeIcon />;
      case 'completed':
        return <CheckCircleIcon />;
      case 'cancelled':
        return <CancelIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  const getTaskCounts = () => {
    return {
      all: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length
    };
  };

  const counts = getTaskCounts();

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div className="header-left">
          <h1>დავალებები</h1>
          <span className="task-count">{tasks.length} დავალება</span>
        </div>
        <button className="btn-add-task" onClick={openAddModal}>
          <AddIcon />
          <span>დავალების დამატება</span>
        </button>
      </div>

      <div className="page-content">
        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card all" onClick={() => setActiveTab('all')}>
            <div className="stat-icon">
              <AssignmentIcon />
            </div>
            <div className="stat-info">
              <span className="stat-value">{counts.all}</span>
              <span className="stat-label">სულ</span>
            </div>
          </div>
          <div className="stat-card pending" onClick={() => setActiveTab('pending')}>
            <div className="stat-icon">
              <PendingIcon />
            </div>
            <div className="stat-info">
              <span className="stat-value">{counts.pending}</span>
              <span className="stat-label">მოლოდინში</span>
            </div>
          </div>
          <div className="stat-card in-progress" onClick={() => setActiveTab('in_progress')}>
            <div className="stat-icon">
              <AccessTimeIcon />
            </div>
            <div className="stat-info">
              <span className="stat-value">{counts.in_progress}</span>
              <span className="stat-label">მიმდინარე</span>
            </div>
          </div>
          <div className="stat-card completed" onClick={() => setActiveTab('completed')}>
            <div className="stat-icon">
              <CheckCircleIcon />
            </div>
            <div className="stat-info">
              <span className="stat-value">{counts.completed}</span>
              <span className="stat-label">დასრულებული</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ძებნა დავალებით..."
            />
          </div>

          <div className="filter-group">
            <FilterListIcon className="filter-icon" />
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="filter-select"
            >
              <option value="all">ყველა თანამშრომელი</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.surname}
                </option>
              ))}
            </select>
          </div>

          <div className="tab-filters">
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              ყველა
            </button>
            <button
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              მოლოდინში
            </button>
            <button
              className={`tab-btn ${activeTab === 'in_progress' ? 'active' : ''}`}
              onClick={() => setActiveTab('in_progress')}
            >
              მიმდინარე
            </button>
            <button
              className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              დასრულებული
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="tasks-container">
          {loading ? (
            <div className="loading-state">იტვირთება...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <AssignmentIcon className="empty-icon" />
              <h3>დავალებები არ მოიძებნა</h3>
              <p>დაამატეთ ახალი დავალება ღილაკზე დაჭერით</p>
            </div>
          ) : (
            <div className="tasks-grid">
              {filteredTasks.map(task => {
                const statusInfo = taskService.getStatusInfo(task.status);
                const priorityInfo = taskService.getPriorityInfo(task.priority);
                const isOverdue = taskService.isOverdue(task);

                return (
                  <div
                    key={task.id}
                    className={`task-card ${task.status} ${isOverdue ? 'overdue' : ''}`}
                  >
                    <div className="task-header">
                      <div className="task-status-icon" style={{ color: statusInfo.color }}>
                        {getStatusIcon(task.status)}
                      </div>
                      <div className="task-actions">
                        <button
                          className="action-btn edit"
                          onClick={() => openEditModal(task)}
                          title="რედაქტირება"
                        >
                          <EditIcon fontSize="small" />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(task)}
                          title="წაშლა"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
                    </div>

                    <h3 className="task-title">{task.title}</h3>

                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}

                    <div className="task-meta">
                      <div className="meta-item">
                        <PersonIcon fontSize="small" />
                        <span>{task.employeeName || 'არ არის მინიჭებული'}</span>
                      </div>
                      <div className="meta-item">
                        <CalendarTodayIcon fontSize="small" />
                        <span className={isOverdue ? 'overdue-text' : ''}>
                          {taskService.formatDate(task.dueDate)}
                        </span>
                      </div>
                    </div>

                    <div className="task-footer">
                      <span
                        className="status-badge"
                        style={{ color: statusInfo.color, backgroundColor: statusInfo.bgColor }}
                      >
                        {statusInfo.label}
                      </span>
                      <span
                        className="priority-badge"
                        style={{ color: priorityInfo.color, backgroundColor: priorityInfo.bgColor }}
                      >
                        <FlagIcon fontSize="small" />
                        {priorityInfo.label}
                      </span>
                    </div>

                    {task.status !== 'completed' && task.status !== 'cancelled' && (
                      <div className="quick-actions">
                        {task.status === 'pending' && (
                          <button
                            className="quick-btn start"
                            onClick={() => handleStatusChange(task, 'in_progress')}
                          >
                            დაწყება
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button
                            className="quick-btn complete"
                            onClick={() => handleStatusChange(task, 'completed')}
                          >
                            დასრულება
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'დავალების რედაქტირება' : 'ახალი დავალება'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label>დასახელება *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="შეიყვანეთ დავალების დასახელება"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>აღწერა</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="შეიყვანეთ დავალების აღწერა"
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>თანამშრომელი *</label>
                    <select
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">აირჩიეთ თანამშრომელი</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} {emp.surname}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>პრიორიტეტი</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                    >
                      <option value="low">დაბალი</option>
                      <option value="medium">საშუალო</option>
                      <option value="high">მაღალი</option>
                      <option value="urgent">გადაუდებელი</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>დაწყების თარიღი</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>დასრულების თარიღი *</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {editingTask && (
                  <div className="form-group">
                    <label>სტატუსი</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="pending">მოლოდინში</option>
                      <option value="in_progress">მიმდინარე</option>
                      <option value="completed">დასრულებული</option>
                      <option value="cancelled">გაუქმებული</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  გაუქმება
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'ინახება...' : (editingTask ? 'შენახვა' : 'დამატება')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyTasksPage;
