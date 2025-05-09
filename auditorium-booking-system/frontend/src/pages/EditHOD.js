import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './EditHOD.css'; // Custom styles for purple theme

const EditHOD = () => {
  const [hodList, setHodList] = useState([]);
  const [selectedHod, setSelectedHod] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHODs = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return setError('Token not found. Please login.');

        const res = await axios.get('http://localhost:5000/api/auth/hods', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHodList(res.data);
      } catch (err) {
        console.error("Error fetching HODs:", err);
        setError(err.response?.data?.message || 'Failed to load HOD list.');
      }
    };

    fetchHODs();
  }, []);

  const handleSelect = (id) => {
    const hod = hodList.find((h) => h._id === id);
    if (hod) {
      setSelectedHod(hod);
      setForm({
        name: hod.name,
        email: hod.email,
        username: hod.username,
        password: ''
      });
      setMessage('');
      setError('');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return setError('Token missing. Please login again.');

      await axios.put(
        `http://localhost:5000/api/auth/update-hod/${selectedHod._id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('HOD details updated successfully!');
      setError('');
    } catch (err) {
      console.error("Update error:", err);
      setMessage('');
      setError(err.response?.data?.message || 'Failed to update HOD');
    }
  };

  return (
    <div className="container py-4 edit-hod-wrapper">
      <h3 className="text-purple mb-4">✏️ Edit HOD Details</h3>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="mb-3">
        <select
          onChange={(e) => handleSelect(e.target.value)}
          className="form-select"
          defaultValue=""
        >
          <option value="" disabled>Select HOD</option>
          {hodList.map((hod) => (
            <option key={hod._id} value={hod._id}>
              {hod.name} ({hod.department})
            </option>
          ))}
        </select>
      </div>

      {selectedHod && (
        <div className="card p-4 shadow-sm">
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="form-control"
              placeholder="Full Name"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="form-control"
              placeholder="Email Address"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className="form-control"
              placeholder="Username"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">New Password (optional)</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="form-control"
              placeholder="New Password"
            />
          </div>

          <button onClick={handleUpdate} className="btn btn-purple w-100 mt-2">
            🔄 Update HOD
          </button>
        </div>
      )}
    </div>
  );
};

export default EditHOD;
