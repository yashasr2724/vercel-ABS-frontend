import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const RegisterHOD = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState('');
  const [addingNewDept, setAddingNewDept] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/departments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDepartments(res.data);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');

    if (e.target.name === 'department') {
      if (e.target.value === 'add_new') {
        setAddingNewDept(true);
        setFormData({ ...formData, department: '' });
      } else {
        setAddingNewDept(false);
      }
    }
  };

  const handleNewDeptSubmit = async () => {
    if (!newDept.trim()) {
      setError('Please enter a valid department name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/departments',
        { name: newDept },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setDepartments((prev) => [...prev, res.data.department.name]);
      setFormData((prev) => ({ ...prev, department: res.data.department.name }));
      setNewDept('');
      setAddingNewDept(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add department');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, department, username, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await axios.post(
        'http://localhost:5000/api/auth/register-hod',
        { name, email, department, username, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('HOD registered successfully');
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg p-4" style={{ width: '100%', maxWidth: '500px', borderRadius: '12px' }}>
        <div className="text-center mb-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
            alt="logo"
            style={{ width: '60px' }}
          />
          <h3 className="mt-3 text-purple fw-bold">Register HOD</h3>
        </div>
        {error && <div className="alert alert-danger text-center">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <select
              name="department"
              className="form-select"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
              <option value="add_new">+ Add New Department</option>
            </select>
          </div>

          {addingNewDept && (
            <div className="mb-3 d-flex gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="New Department Name"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
              />
              <button type="button" className="btn btn-outline-primary" onClick={handleNewDeptSubmit}>
                Add
              </button>
            </div>
          )}

          <div className="mb-3">
            <input
              type="text"
              name="username"
              className="form-control"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn w-100 text-white fw-bold" style={{ backgroundColor: '#6f42c1' }}>
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterHOD;
