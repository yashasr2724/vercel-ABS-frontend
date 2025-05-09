import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendarStyles.css';
import { format, isValid } from 'date-fns';

const AdminBookingForm = () => {
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: '',
    startTime: '',
    endTime: '',
    comments: ''
  });

  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const fetchBookings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/booking/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (err) {
      console.error('Booking Fetch Error:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    console.log('Bookings:', bookings);
  }, [bookings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      setError('Start time must be before end time.');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/booking/admin-book', {
        ...formData,
        sTime: formData.startTime,
        eTime: formData.endTime,
        bookedByAdmin: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('✅ Auditorium booked successfully!');
      setFormData({
        eventName: '',
        eventType: '',
        startTime: '',
        endTime: '',
        comments: ''
      });
      fetchBookings();
    } catch (err) {
      console.error('Booking Error:', err);
      setError(err.response?.data?.message || 'Booking failed.');
    }
  };

  const handleCancel = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/booking/admin-cancel/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ Booking cancelled.');
      fetchBookings();
    } catch (err) {
      setError('❌ Cancel failed.');
    }
  };

  const tileClassName = ({ date }) => {
    const formatted = format(date, 'yyyy-MM-dd');
    const todayBookings = bookings.filter(b => {
      const bDate = new Date(b.sTime);
      return isValid(bDate) && format(bDate, 'yyyy-MM-dd') === formatted;
    });

    const classes = [];
    if (todayBookings.some(b => b.bookedByAdmin)) {
      classes.push('admin-booked');
    }
    if (todayBookings.some(b => !b.bookedByAdmin)) {
      classes.push('hod-booked');
    }
    return classes;
  };

  const handleDateClick = (date) => {
    const selected = format(date, 'yyyy-MM-dd');
    const filtered = bookings.filter(b => {
      const bDate = new Date(b.sTime);
      return isValid(bDate) && format(bDate, 'yyyy-MM-dd') === selected;
    });

    setSelectedDate(date);
    setModalData(filtered);
  };

  const closeModal = () => {
    setSelectedDate(null);
    setModalData([]);
  };

  return (
    <div className="container mt-4">
      <style>
        {`
          .admin-booked {
            border: 2px solid red !important;
            border-radius: 5px;
          }
          .hod-booked {
            border: 2px solid orange !important;
            background-color: #FFB34733 !important;
            border-radius: 5px;
          }
        `}
      </style>

      <div className="card shadow">
        <div className="card-header bg-primary text-white text-center">
          <h4>Admin Auditorium Booking</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-6">
              <input
                name="eventName"
                placeholder="Event Name"
                value={formData.eventName}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <input
                name="eventType"
                placeholder="Event Type"
                value={formData.eventType}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-12">
              <textarea
                name="comments"
                placeholder="Comments (optional)"
                value={formData.comments}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="col-12 text-center">
              <button type="submit" className="btn btn-primary px-4">✅ Book</button>
            </div>
            {message && <p className="text-success text-center mt-2">{message}</p>}
            {error && <p className="text-danger text-center mt-2">{error}</p>}
          </form>
        </div>
      </div>

      <div className="mt-5">
        <h5 className="text-primary">📅 Booked Dates</h5>
        <Calendar
          onClickDay={handleDateClick}
          tileClassName={tileClassName}
        />
        <div className="mt-3 d-flex gap-3">
          <div className="d-flex align-items-center">
            <div style={{ width: 15, height: 15, backgroundColor: 'red', marginRight: 5 }}></div>
            <span>Admin</span>
          </div>
          <div className="d-flex align-items-center">
            <div style={{ width: 15, height: 15, backgroundColor: 'orange', marginRight: 5 }}></div>
            <span>HOD</span>
          </div>
        </div>
      </div>

      {selectedDate && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={closeModal}
        >
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Bookings on {format(selectedDate, 'PPP')}</h5>
                <button className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                {modalData.length === 0 ? (
                  <p>No bookings for this date.</p>
                ) : (
                  <ul className="list-group">
                    {modalData.map(b => (
                      <li key={b._id} className="list-group-item">
                        <strong>{b.eventName}</strong> ({b.eventType})<br />
                        <small>
                          {new Date(b.sTime).toLocaleString()} – {new Date(b.eTime).toLocaleString()}
                        </small><br />
                        {!b.bookedByAdmin && b.department && (
                          <small>Department: <strong>{b.department}</strong></small>
                        )}
                        {b.bookedByAdmin && (
                          <button
                            className="btn btn-sm btn-outline-danger mt-2"
                            onClick={() => handleCancel(b._id)}
                          >
                            ❌ Cancel
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingForm;
