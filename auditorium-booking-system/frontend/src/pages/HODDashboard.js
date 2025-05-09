import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  FaBars, FaMoon, FaSun, FaSignOutAlt, FaClipboardList, FaEdit, FaUserEdit
} from 'react-icons/fa';
import BookingCalendar from '../components/BookingCalendar';

const HODDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [profile, setProfile] = useState({
    username: '',
    email: '',
    password: '',
    profilePic: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const handleBookingClick = () => navigate('/hod/book');
  const handleViewRequests = () => navigate('/hod/requests');

  const openEditModal = () => {
    setShowEditModal(true);
    setDropdownOpen(false);
  };
  const closeEditModal = () => setShowEditModal(false);

  const handleProfileChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profilePic') {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profilePic: reader.result });
      };
      if (file) reader.readAsDataURL(file);
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.REACT_APP_API_URL}/api/user/update-profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profile updated successfully!');
      closeEditModal();
    } catch (error) {
      alert('Failed to update profile');
      console.error(error);
    }
  };

  return (
    <div className={`d-flex vh-100 ${darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}`}>
      {/* Sidebar */}
      <div className={`bg-purple d-flex flex-column p-3 ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`} style={{ transition: 'width 0.3s', width: sidebarOpen ? '230px' : '70px' }}>
        <h4 className={`text-white fw-bold mb-4 ${sidebarOpen ? 'd-block' : 'd-none'}`}>🎓 HOD</h4>
        <button className="btn btn-light mb-3 w-100 d-flex align-items-center" onClick={handleViewRequests}>
          <FaClipboardList className="me-2" /> {sidebarOpen && 'My Requests'}
        </button>
        <button className="btn btn-light mb-3 w-100 d-flex align-items-center" onClick={handleBookingClick}>
          <FaEdit className="me-2" /> {sidebarOpen && 'Request Auditorium'}
        </button>
        <button className="btn btn-danger mt-auto d-flex align-items-center" onClick={handleLogout}>
          <FaSignOutAlt className="me-2" /> {sidebarOpen && 'Logout'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 overflow-auto">
        {/* Navbar */}
        <nav className={`navbar ${darkMode ? 'navbar-dark bg-dark' : 'navbar-light bg-white'} px-3 d-flex justify-content-between align-items-center`}>
          <div>
            <button className="btn btn-outline-secondary me-2" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <span className="fw-bold fs-5">HOD Dashboard</span>
          </div>
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary me-2" onClick={toggleDarkMode}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <div className="position-relative">
              <img
                src={profile.profilePic}
                alt="profile"
                className="rounded-circle"
                style={{ width: '35px', height: '35px', cursor: 'pointer' }}
                onClick={toggleDropdown}
              />
              {dropdownOpen && (
                <div className={`dropdown-menu dropdown-menu-end show mt-2 ${darkMode ? 'bg-dark text-white' : ''}`} style={{ position: 'absolute', right: 0 }}>
                  <button className="dropdown-item" onClick={openEditModal}><FaUserEdit className="me-2" />Edit Profile</button>
                  <button className="dropdown-item" onClick={handleLogout}><FaSignOutAlt className="me-2" />Logout</button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Main Body */}
        <div className="p-4">
          <h2>Welcome, HOD!</h2>
          <p>Use the sidebar to manage your bookings and view requests.</p>

          <hr />

          <h4 className="text-primary fw-bold mb-3">📅 Auditorium Booking Calendar</h4>
          <BookingCalendar  darkMode={darkMode} />
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleProfileUpdate}>
                <div className="modal-header">
                  <h5 className="modal-title">Edit Profile</h5>
                  <button type="button" className="btn-close" onClick={closeEditModal}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3 text-center">
                    <img
                      src={profile.profilePic || 'https://i.pravatar.cc/100'}
                      alt="Profile Preview"
                      className="rounded-circle mb-2"
                      width="100"
                      height="100"
                    />
                    <input type="file" name="profilePic" accept="image/*" className="form-control" onChange={handleProfileChange} />
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
      )}
    </div>
  );
};

export default HODDashboard;
