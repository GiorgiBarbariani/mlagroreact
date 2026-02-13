import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../hooks/useAuth';
import './EmployeeManagementPage.scss';

interface Employee {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  joinDate: string;
  companyId: string;
}

interface EmployeeForm {
  name: string;
  surname: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  password: string;
}

const initialFormState: EmployeeForm = {
  name: '',
  surname: '',
  username: '',
  email: '',
  phone: '',
  role: '',
  password: ''
};

const EmployeeManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeForm>(initialFormState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Available roles
  const roles = [
    'ფერმის მენეჯერი',
    'ზედამხედველი',
    'აგრონომი',
    'ოპერატორი',
    'მუშა',
    'სხვა'
  ];

  // Load employees
  useEffect(() => {
    loadEmployees();
  }, []);

  // Filter employees when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
      setCurrentPage(1);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchTerm, employees]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/employees/my-company');
      if (response.data && response.data.employees) {
        setEmployees(response.data.employees);
        setFilteredEmployees(response.data.employees);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData(initialFormState);
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      surname: employee.surname,
      username: employee.username,
      email: employee.email,
      phone: employee.phone || '',
      role: employee.role || '',
      password: ''
    });
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData(initialFormState);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name || !formData.surname || !formData.username || !formData.email) {
      setError('გთხოვთ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }

    if (!editingEmployee && !formData.password) {
      setError('პაროლი სავალდებულოა ახალი თანამშრომლისთვის');
      return;
    }

    setSaving(true);
    try {
      if (editingEmployee) {
        // Update existing employee
        const updateData: any = {
          name: formData.name,
          surname: formData.surname,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          role: formData.role
        };

        await apiClient.put(`/employees/${editingEmployee.id}`, updateData);
      } else {
        // Create new employee
        await apiClient.post('/employees', {
          name: formData.name,
          surname: formData.surname,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          password: formData.password,
          companyId: user?.companyId
        });
      }

      await loadEmployees();
      closeModal();
    } catch (error: any) {
      console.error('Error saving employee:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.status === 409) {
        setError('მომხმარებელი ამ ელ-ფოსტით ან მომხმარებლის სახელით უკვე არსებობს');
      } else {
        setError('შეცდომა თანამშრომლის შენახვისას');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (!window.confirm(`დარწმუნებული ხართ, რომ გსურთ "${employee.name} ${employee.surname}" თანამშრომლის წაშლა?`)) {
      return;
    }

    try {
      await apiClient.delete(`/employees/${employee.id}`);
      await loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('შეცდომა თანამშრომლის წაშლისას');
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ka-GE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="employee-management-page">
      <div className="page-header">
        <h1>თანამშრომლების მართვა</h1>
      </div>

      <div className="page-content">
        {/* Add Button */}
        <div className="actions-bar">
          <button className="btn-add-employee" onClick={openAddModal}>
            <Plus size={18} />
            <span>თანამშრომლის დამატება</span>
          </button>
        </div>

        {/* Search */}
        <div className="search-section">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ძებნა სახელით"
              className="search-input"
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-state">იტვირთება...</div>
          ) : (
            <table className="employees-table">
              <thead>
                <tr>
                  <th>სახელი</th>
                  <th>გვარი</th>
                  <th>მომხმარებელი</th>
                  <th>ელ-ფოსტა</th>
                  <th>ტელეფონი</th>
                  <th>როლი</th>
                  <th>გაწევრიანების თარიღი</th>
                  <th>მოქმედებები</th>
                </tr>
              </thead>
              <tbody>
                {currentEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      თანამშრომლები არ მოიძებნა
                    </td>
                  </tr>
                ) : (
                  currentEmployees.map(employee => (
                    <tr key={employee.id}>
                      <td>
                        <div className="name-cell">
                          <User size={16} className="user-icon" />
                          <span>{employee.name}</span>
                        </div>
                      </td>
                      <td>{employee.surname}</td>
                      <td>{employee.username}</td>
                      <td>{employee.email}</td>
                      <td>{employee.phone || '-'}</td>
                      <td>{employee.role || '-'}</td>
                      <td>{formatDate(employee.joinDate)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-action btn-edit"
                            onClick={() => openEditModal(employee)}
                            title="რედაქტირება"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleDelete(employee)}
                            title="წაშლა"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredEmployees.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              ნაჩვენებია {startIndex + 1}-{Math.min(endIndex, filteredEmployees.length)} სულ {filteredEmployees.length} თანამშრომლიდან
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                title="პირველი გვერდი"
              >
                <ChevronsLeft size={18} />
              </button>
              <button
                className="pagination-btn"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                title="წინა გვერდი"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="page-number">{currentPage}</span>
              <button
                className="pagination-btn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="შემდეგი გვერდი"
              >
                <ChevronRight size={18} />
              </button>
              <button
                className="pagination-btn"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                title="ბოლო გვერდი"
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEmployee ? 'თანამშრომლის რედაქტირება' : 'ახალი თანამშრომელი'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="error-message">{error}</div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>სახელი *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="შეიყვანეთ სახელი"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>გვარი *</label>
                    <input
                      type="text"
                      name="surname"
                      value={formData.surname}
                      onChange={handleInputChange}
                      placeholder="შეიყვანეთ გვარი"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>მომხმარებლის სახელი *</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="შეიყვანეთ მომხმარებლის სახელი"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>ელ-ფოსტა *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="example@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>ტელეფონი</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="599123456"
                    />
                  </div>
                  <div className="form-group">
                    <label>როლი</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      <option value="">აირჩიეთ როლი</option>
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {!editingEmployee && (
                  <div className="form-group">
                    <label>პაროლი *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="შეიყვანეთ პაროლი"
                      required={!editingEmployee}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  გაუქმება
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'ინახება...' : (editingEmployee ? 'შენახვა' : 'დამატება')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagementPage;
