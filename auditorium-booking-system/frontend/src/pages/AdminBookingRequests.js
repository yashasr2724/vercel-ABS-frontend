import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AdminBookingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      showToast('Session expired. Please login again.', true);
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    fetchRequests(token);
  }, []);

  const fetchRequests = async (token) => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/booking/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error("❌ Fetch error:", err.response || err.message);
      showToast('Failed to fetch requests', true);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      setActionLoadingId(id);
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/booking/${id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showToast(`Booking ${status} successfully!`);
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("❌ Action error:", err.response || err.message);
      showToast(err.response?.data?.message || 'Action failed', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const renderRequirementIcon = (req) => {
    switch (req) {
      case 'mic': return '🎤 Mic';
      case 'bottles': return '💧 Bottles';
      case 'camera': return '📷 Camera';
      case 'speakers': return '🔊 Speakers';
      default: return req;
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>🗂️ Pending Booking Requests</h2>

      {toast && (
        <div style={{ ...styles.toast, backgroundColor: toast.isError ? '#e63946' : '#7d6bf2' }}>
          {toast.msg}
        </div>
      )}

      {loading ? (
        <p style={styles.subText}>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p style={styles.subText}>No pending requests.</p>
      ) : (
        <div className="animated-popup" style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Event</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Start</th>
                <th style={styles.th}>End</th>
                <th style={styles.th}>Requirements</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id} style={styles.tr}>
                  <td style={styles.td}>{r.department?.name || r.department}</td>
                  <td style={styles.td}>{r.eventName}</td>
                  <td style={styles.td}>{r.eventType}</td>
                  <td style={styles.td}>{new Date(r.startTime).toLocaleString()}</td>
                  <td style={styles.td}>{new Date(r.endTime).toLocaleString()}</td>
                  <td style={styles.td}>
                    {r.requirements?.length > 0 ? (
                      r.requirements.map((item, idx) => (
                        <span key={idx} style={styles.badge}>
                          {renderRequirementIcon(item)}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#999' }}>None</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleAction(r._id, 'approved')}
                      style={styles.actionBtn('#6f42c1')}
                      disabled={actionLoadingId === r._id}
                    >
                      {actionLoadingId === r._id ? 'Approving...' : '✅ Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(r._id, 'rejected')}
                      style={styles.actionBtn('#b30000')}
                      disabled={actionLoadingId === r._id}
                    >
                      {actionLoadingId === r._id ? 'Rejecting...' : '❌ Reject'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .animated-popup {
          animation: fadeInUp 0.6s ease;
        }
        table tr:hover {
          background-color: #f3e8ff;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          table, thead, tbody, th, td, tr {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    padding: '2rem',
    background: 'linear-gradient(to right,rgb(202, 191, 220),rgb(167, 122, 200))',
    minHeight: '100vh',
    fontFamily: 'Segoe UI, sans-serif',
  },
  heading: {
    marginBottom: '1.5rem',
    color: '#4b0082',
    fontWeight: '600',
    textAlign: 'center',
  },
  subText: {
    fontSize: '1rem',
    color: '#555',
    textAlign: 'center',
  },
  toast: {
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '6px',
    marginBottom: '1rem',
    maxWidth: '400px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    fontSize: '1rem',
    textAlign: 'center',
    margin: '0 auto',
  },
  tableWrapper: {
    overflowX: 'auto',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '1rem',
    boxShadow: '0 0 10px rgba(0,0,0,0.08)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '700px',
  },
  thead: {
    backgroundColor: '#6f42c1',
    color: 'white',
  },
  th: {
    padding: '12px 15px',
    textAlign: 'left',
    fontWeight: 'bold',
  },
  td: {
    padding: '12px 15px',
    fontSize: '0.95rem',
    backgroundColor: 'white',
    verticalAlign: 'top',
  },
  tr: {
    borderBottom: '1px solid #eee',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#a66bbe',
    color: '#fff',
    borderRadius: '12px',
    padding: '4px 10px',
    fontSize: '0.85rem',
    marginRight: '6px',
    marginBottom: '4px',
  },
  actionBtn: (bgColor) => ({
    marginRight: '8px',
    backgroundColor: bgColor,
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    minWidth: '100px',
  }),
};

export default AdminBookingRequests;
