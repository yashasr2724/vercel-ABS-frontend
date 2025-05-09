import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', form);
      const { token, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      if (role === 'admin') navigate('/admin');
      else if (role === 'hod') navigate('/hod');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  useEffect(() => {
    const checkUserExists = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/user/exists');
        setShowRegister(!res.data.exists); // Show register only if no users exist
      } catch (err) {
        console.error('Error checking user existence:', err);
      }
    };
    checkUserExists();
  }, []);

  return (
    <div className="login-container d-flex align-items-center justify-content-center">
      <form
        onSubmit={handleSubmit}
        className="login-form shadow p-4 rounded text-center"
      >
        <img
          src="https://simsbangalore.com/wp-content/uploads/2023/02/SOUNDARYA-Logos-04-2048x831.png"
          alt="Soundarya Logo"
          className="img-fluid mb-3 logo-img"
        />
        <h2 className="text-purple mb-4">🎓 Login</h2>

        <div className="mb-3">
          <input
            name="username"
            className="form-control"
            placeholder="Username"
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <input
            name="password"
            className="form-control"
            placeholder="Password"
            type="password"
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-purple w-100">
          Login
        </button>

        <p
          className="mt-3 text-purple text-decoration-underline"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/forgot-password')}
        >
          Forgot Password?
        </p>

        {showRegister && (
          <div className="mt-3">
            <Link to="/register" className="text-decoration-none text-purple">
              🔐 Register as Admin
            </Link>
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;
