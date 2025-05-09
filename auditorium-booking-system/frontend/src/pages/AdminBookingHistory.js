import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // ✅ Correct import

const AdminBookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookings(res.data);
      } catch (err) {
        console.error('Failed to fetch booking history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const downloadCSV = () => {
    const headers = [
      'Department',
      'Event Name',
      'Event Type',
      'Start Date & Time',
      'End Date & Time',
      'Status',
      'Requirements',
    ];

    const rows = bookings.map((b) => [
      b.department,
      b.eventName,
      b.eventType,
      new Date(b.startTime).toLocaleString(),
      new Date(b.endTime).toLocaleString(),
      b.status,
      b.requirements || 'N/A',
    ]);

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += headers.join(',') + '\n';
    rows.forEach((row) => {
      csvContent += row.map((field) => `"${(field || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'booking_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Booking History Report', 14, 20);

    const tableColumn = [
      'Department',
      'Event Name',
      'Event Type',
      'Start Time',
      'End Time',
      'Status',
      'Requirements',
    ];

    const tableRows = bookings.map((b) => [
      b.department,
      b.eventName,
      b.eventType,
      new Date(b.startTime).toLocaleString(),
      new Date(b.endTime).toLocaleString(),
      b.status,
      b.requirements || 'N/A',
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [111, 66, 193] }, // Purple header
    });

    doc.save('booking_history.pdf');
  };

  return (
    <div style={styles.page}>
      {/* Back Button */}
      <button onClick={() => navigate(-1)} style={styles.backButton}>
        <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>&larr;</span>
        Back
      </button>

      <h2 style={styles.heading}>📚 Booking History</h2>

      {!loading && (
        <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
          <button onClick={downloadCSV} style={styles.downloadButton}>
            ⬇️ Download CSV
          </button>
          <button onClick={downloadPDF} style={{ ...styles.downloadButton, marginLeft: '1rem' }}>
            🧾 Download PDF
          </button>
        </div>
      )}

      {loading ? (
        <p style={styles.loadingText}>Loading...</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Event</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Start</th>
                <th style={styles.th}>End</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td style={styles.td}>{b.department}</td>
                  <td style={styles.td}>{b.eventName}</td>
                  <td style={styles.td}>{b.eventType}</td>
                  <td style={styles.td}>{new Date(b.startTime).toLocaleString()}</td>
                  <td style={styles.td}>{new Date(b.endTime).toLocaleString()}</td>
                  <td style={{ ...styles.td, color: getStatusColor(b.status), fontWeight: 'bold' }}>
                    {b.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Responsive & hover styles */}
      <style>{`
        table tr:hover {
          background-color: #f3e8ff;
        }
        @media (max-width: 768px) {
          table, thead, tbody, th, td, tr {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    padding: '2rem',
    background: 'linear-gradient(to bottom right, #e0c3fc, #a66bbe)',
    minHeight: '100vh',
    fontFamily: 'Segoe UI, sans-serif',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#4b0082',
    fontSize: '1.1rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
  },
  heading: {
    color: '#4b0082',
    fontWeight: '600',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    color: '#333',
  },
  tableWrapper: {
    overflowX: 'auto',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '1rem',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '600px',
  },
  tableHeaderRow: {
    backgroundColor: '#6f42c1',
    color: 'white',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #ddd',
    backgroundColor: 'white',
  },
  downloadButton: {
    backgroundColor: '#6f42c1',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  },
};

const getStatusColor = (status) => {
  switch (status) {
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    case 'pending':
    default:
      return 'orange';
  }
};

export default AdminBookingHistory;
