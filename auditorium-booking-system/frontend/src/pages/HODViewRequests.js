import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './HODViewRequests.css'; // Custom CSS file for styles

const HODViewRequests = () => {
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching your bookings:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="hod-view-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left"></i> Back
      </button>

      <h2 className="heading">My Auditorium Booking Requests</h2>

      {requests.length === 0 ? (
        <p className="no-requests">No requests submitted yet.</p>
      ) : (
        <div className="animated-popup">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
  {requests.map((req) => (
    <tr key={req._id}>
      <td data-label="Event">{req.eventName}</td>
      <td data-label="Type">{req.eventType}</td>
      <td data-label="Start">{new Date(req.startTime).toLocaleString()}</td>
      <td data-label="End">{new Date(req.endTime).toLocaleString()}</td>
      <td data-label="Status">{req.status}</td>
    </tr>
  ))}
</tbody>

          </table>
        </div>
      )}
    </div>
  );
};

export default HODViewRequests;
