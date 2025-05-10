// AdminDashboard.js

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminDashboard.css';
import {
  FaBars, FaMoon, FaSun, FaSignOutAlt, FaUserEdit,
  FaPlus, FaEdit, FaInbox, FaHistory, FaCalendarAlt, FaDownload, FaBell
} from 'react-icons/fa';

// Constants
const BASE_URL = `${process.env.REACT_APP_API_URL}/api/booking`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [hodPasswordRequests, setHodPasswordRequests] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [darkMode, setDarkMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filter, setFilter] = useState('7');
  const [statusFilter, setStatusFilter] = useState('All');
  const [metrics, setMetrics] = useState({ totalUsers: 0, totalBookings: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const getUniqueDepartments = () => {
  const departments = recentBookings.map(b => b.requestedBy?.department || b.department || 'Unknown');
  return ['All', ...Array.from(new Set(departments))];
};


  const [profile, setProfile] = useState({
    username: '',
    email: '',
    password: '',
    profilePic: ''
  });

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), []);
  const toggleDropdown = useCallback(() => setShowDropdown(prev => !prev), []);
  const openEditModal = useCallback(() => {
    setShowEditModal(true);
    setShowDropdown(false);
  }, []);
  const closeEditModal = useCallback(() => setShowEditModal(false), []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const NotificationsDropdown = () => (
  <div className="notification-dropdown animate__animated animate__fadeIn">
    {pendingBookings.map((booking) => (
      <div key={booking._id} className="notification-item">
        📢 Booking request from <strong>{booking.requestedBy?.department || 'Unknown Dept'}</strong>
      </div>
    ))}

    {hodPasswordRequests.map((request) => (
      <div key={request._id} className="notification-item">
        🔐 Password reset request from <strong>{request.name} ({request.department})</strong>
      </div>
    ))}

    {pendingBookings.length === 0 && hodPasswordRequests.length === 0 && (
      <div className="notification-item text-muted">No new notifications.</div>
    )}
  </div>
);




  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile({
        username: data.username || '',
        email: data.email || '',
        password: '',
        profilePic: data.profilePic || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${BASE_URL}/pending-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${BASE_URL}/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const [year, month] = selectedMonth.split('-');
      const response = await axios.get(`${BASE_URL}/recent-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { year, month, days: filter === 'month' ? 30 : filter }
      });
      setRecentBookings(response.data);
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    }
  };
  const fetchPendingBookings = async () => {
    try {
            
      const token = localStorage.getItem('token');

      const res = await axios.get(`${BASE_URL}/pending`, {
        headers: { Authorization: `Bearer ${token}` }, // use your token logic
      });
      setPendingBookings(res.data);
    } catch (err) {
      console.error('Failed to fetch pending bookings:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchHodPasswordRequests = async () => {
  try {
    const token = localStorage.getItem('token');
    const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/hod-password-requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setHodPasswordRequests(data || []);
  } catch (error) {
    console.error('Failed to fetch HOD password requests:', error);
  }
};


  useEffect(() => {
    
    fetchProfile();
    fetchMetrics();
    fetchRecentBookings();
    fetchPendingCount();
    fetchPendingBookings();
     const interval = setInterval(() => {
    fetchPendingBookings();
    fetchHodPasswordRequests();
  }, 60000); // every 60 seconds

  return () => {clearInterval(interval);}
  }, [filter, statusFilter, selectedMonth]);

  const goTo = (path) => navigate(path);

  const handleProfileChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profilePic') {
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfile(prev => ({ ...prev, profilePic: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {};
      if (profile.username.trim()) payload.username = profile.username;
      if (profile.email.trim()) payload.email = profile.email;
      if (profile.password.trim()) payload.password = profile.password;
      if (profile.profilePic) payload.profilePic = profile.profilePic;

      await axios.put(`${process.env.REACT_APP_API_URL}/api/user/update-profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Profile updated successfully!');
      closeEditModal();
      fetchProfile();
    } catch (error) {
      alert('Failed to update profile');
      console.error(error);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

  const getDepartmentChartData = () => {
    const counts = {};
    recentBookings.forEach((b) => {
      const dept = b.requestedBy?.department || b.department || 'Unknown';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).map(([department, bookings]) => ({ department, bookings }));
  };

  const filteredBookings = recentBookings.filter((booking) => {
  const bookingStatus = booking.status ? booking.status.toLowerCase() : '';
  const dept = booking.requestedBy?.department || booking.department || 'Unknown';

  const matchesStatus = statusFilter === 'All' || bookingStatus === statusFilter.toLowerCase();
  const matchesDept = departmentFilter === 'All' || departmentFilter === dept;

  return matchesStatus && matchesDept;
});


  const downloadCSV = () => {
    const csvHeader = 'Event,Department,Start Time,End Time\n';
    const csvRows = filteredBookings.map(b => {
      const dept = b.requestedBy?.department || b.department || 'Unknown';
      return `"${b.eventName}","${dept}","${formatDate(b.startTime)}","${formatDate(b.endTime)}"`;
    });
    const csvData = csvHeader + csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recent_bookings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const ProfileDropdown = () => (
    <div className="profile-dropdown animate__animated animate__fadeIn">
      <button className="dropdown-item" onClick={openEditModal}>
        <FaUserEdit className="me-2" /> Edit Profile
      </button>
      <button className="dropdown-item" onClick={handleLogout}>
        <FaSignOutAlt className="me-2" /> Logout
      </button>
    </div>
  );

  const EditProfileModal = () => (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleProfileUpdate}>
            <div className="modal-header">
              <h5 className="modal-title">Edit Profile</h5>
              <button type="button" className="btn-close" onClick={closeEditModal}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3 text-center position-relative">
                <img
                  src={profile.profilePic || 'https://i.pravatar.cc/100'}
                  alt="Profile"
                  className="rounded-circle profile-preview"
                />
                <label htmlFor="profilePicInput" className="edit-icon-overlay">
                  <i className="fas fa-pencil-alt"></i>
                </label>
                <input
                  type="file"
                  id="profilePicInput"
                  name="profilePic"
                  accept="image/*"
                  onChange={handleProfileChange}
                  style={{ display: 'none' }}
                />
              </div>
              <input name="username" className="form-control mb-2" placeholder="Username" value={profile.username} onChange={handleProfileChange} />
              <input name="email" className="form-control mb-2" placeholder="Email" type="email" value={profile.email} onChange={handleProfileChange} />
              <input name="password" className="form-control mb-2" placeholder="New Password" type="password" value={profile.password} onChange={handleProfileChange} />
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary">Save Changes</button>
              <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );


  
  return (
    <div className={`admin-container ${darkMode ? 'dark-mode' : ''}`}>
      <nav className="navbar admin-navbar d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <button className="btn text-white d-md-none" onClick={toggleSidebar}>
            <FaBars size={22} />
          </button>
          <img src="https://simsbangalore.com/wp-content/uploads/2023/02/SOUNDARYA-Logos-04-2048x831.png" alt="Logo" className="logo-img" />
          <h4 className="mb-0 text-white ms-2">Admin Dashboard</h4>
        </div>
        <div className="d-flex align-items-center gap-3">
        <div className="position-relative" style={{ cursor: 'pointer' }}>
  <FaBell size={22} color="white" onClick={() => setShowNotifications(prev => !prev)} />
  {pendingBookings.length > 0 && (
    <span className="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle">
      {pendingBookings.length}
    </span>
  )}
  {showNotifications && <NotificationsDropdown />}
</div>


          <div className="position-relative" onClick={() => goTo('/booking-requests')} style={{ cursor: 'pointer' }}>
            <FaInbox size={22} color="white" />
            {pendingCount > 0 && (
              <span className="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle">
                {pendingCount}
              </span>
            )}
          </div>
          <button className="btn text-white" onClick={toggleDarkMode}>
            {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
          <div className="position-relative">
            <img
              src={profile.profilePic || 'https://i.pravatar.cc/100'}
              alt="Profile"
              className="rounded-circle profile-img"
              onClick={toggleDropdown}
              style={{ cursor: 'pointer' }}
            />
            {showDropdown && <ProfileDropdown />}
          </div>
        </div>
      </nav>

      <div className="admin-layout">
        <div className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
          <div className="d-flex flex-column gap-3">
            <button onClick={() => goTo('/register-hod')}><FaPlus /> {sidebarOpen && 'Register HOD'}</button>
            <button onClick={() => goTo('/edit-hod')}><FaEdit /> {sidebarOpen && 'Edit HOD'}</button>
            <button onClick={() => goTo('/booking-requests')}><FaInbox /> {sidebarOpen && 'Booking Requests'}</button>
            <button onClick={() => goTo('/admin/bookings/history')}><FaHistory /> {sidebarOpen && 'Booking History'}</button>
            <button onClick={() => goTo('/admin/book')}><FaCalendarAlt /> {sidebarOpen && 'Book Auditorium'}</button>
          </div>
        </div>

        <div className="main-section">
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <div className="card text-center shadow-sm">
                <div className="card-body">
                  <h5>Total Users</h5>
                  <h2>{metrics.totalUsers}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card text-center shadow-sm">
                <div className="card-body">
                  <h5>Auditorium Bookings</h5>
                  <h2>{metrics.totalBookings}</h2>
                </div>
              </div>
            </div>
          </div>

                    {!loading && (
            <div className="mb-3">
              <h4>Notifications</h4>
              {pendingBookings.length > 0 ? (
                <div className="notification-badge alert alert-warning">
                  🔔 {pendingBookings.length} new booking request(s)
                </div>
              ) : (
                <div className="text-muted">No new booking requests.</div>
              )}
            </div>
          )}


          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h4>Recent Bookings</h4>
            <div className="d-flex gap-2"> 
              <select
  value={departmentFilter}
  className="form-select w-auto"
  onChange={(e) => setDepartmentFilter(e.target.value)}
>
  {getUniqueDepartments().map((dept, idx) => (
    <option key={idx} value={dept}>{dept}</option>
  ))}
</select>

            <input
  type="month"
  className="form-control w-auto"
  value={selectedMonth}
  onChange={(e) => setSelectedMonth(e.target.value)}
/>


              <select value={filter} className="form-select w-auto" onChange={(e) => setFilter(e.target.value)}>
                <option value="7">Last 7 Days</option>
                <option value="15">Last 15 Days</option>
                <option value="month">This Month</option>
              </select>
              <select value={statusFilter} className="form-select w-auto" onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="table-responsive mb-2">
            <table className="table table-bordered table-striped">
              <thead className="table-secondary">
                <tr> <th>#</th><th>Event</th><th>Department</th><th>Start</th><th>End</th><th>Status</th> </tr>
              </thead>
              <tbody>
  {filteredBookings.length > 0 ? filteredBookings.map((booking, index) => (
    <tr key={booking._id}>
      <td>{index + 1}</td>
      <td>{booking.eventName}</td>
      <td>{booking.requestedBy?.department || booking.department}</td>
      <td>{formatDate(booking.startTime)}</td>
      <td>{formatDate(booking.endTime)}</td>
       <td>{booking.status || 'Unknown'}</td> 
    </tr>
  )) : (
    <tr>
      <td colSpan="5" className="text-center">No bookings found.</td>
    </tr>
  )}
</tbody>

            </table>
          </div>

          {/* Download Button */}
          <button className="btn btn-success mb-4" onClick={downloadCSV}>
            <FaDownload className="me-2" /> Download CSV
          </button>

          <h4 className="mb-3">Booking Trends by Department</h4>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={getDepartmentChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#6f42c1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {showEditModal && <EditProfileModal />}
    </div>
  );
};

export default AdminDashboard;
