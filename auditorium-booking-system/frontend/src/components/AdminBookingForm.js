import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useNavigate } from 'react-router-dom';

const AdminBookingForm = () => {
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: '',
    otherEventType: '',
    comments: ''
  });

  const [date, setDate] = useState(new Date());
  const [startHour, setStartHour] = useState('');
  const [endHour, setEndHour] = useState('');
  const [adminBookedDates, setAdminBookedDates] = useState([]);
  const [hodBookedDates, setHodBookedDates] = useState([]);
  const [timeSlotsMap, setTimeSlotsMap] = useState({});
  const [modalInfo, setModalInfo] = useState({ show: false, bookedSlots: [], date: null });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const getDateKey = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);

    const fetchBookedDates = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/booking', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const adminDates = [];
        const hodDates = [];

        response.data.forEach(b => {
          const d = new Date(b.date || b.startTime || b.sTime);
          if (isNaN(d.getTime())) return;
          const dayDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

          if (b.bookedByAdmin) {
            if (!adminDates.some(dt => dt.getTime() === dayDate.getTime())) {
              adminDates.push(dayDate);
            }
          } else {
            if (!hodDates.some(dt => dt.getTime() === dayDate.getTime())) {
              hodDates.push(dayDate);
            }
          }
        });

        setAdminBookedDates(adminDates);
        setHodBookedDates(hodDates);
      } catch (err) {
        console.error('Error fetching booked dates:', err);
      }
    };

    const fetchTimeSlotsOnly = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/booking', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const slotMap = {};

        response.data.forEach((item) => {
          if (!item.startTime && !item.sTime) return;
          const startDateStr = item.startTime || item.sTime;
          const endDateStr = item.endTime || item.eTime;
          const dateKey = getDateKey(startDateStr);
          if (!dateKey) return;
          if (!slotMap[dateKey]) slotMap[dateKey] = [];

          slotMap[dateKey].push({
            time: `${item.sTime || new Date(item.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${item.eTime || new Date(item.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
            department: item.department?.name || item.department || (item.bookedByAdmin ? 'Admin' : 'HOD'),
            eventName: item.eventName || 'Unknown',
            _id: item._id,
            bookedByAdmin: item.bookedByAdmin
          });
        });

        setTimeSlotsMap(slotMap);
      } catch (err) {
        console.error('❌ Error fetching time slots only:', err);
      }
    };

    fetchBookedDates();
    fetchTimeSlotsOnly();
  }, []);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const handleDateClick = (clickedDate) => {
    const key = getDateKey(clickedDate);
    const bookedSlots = timeSlotsMap[key] || [];

    setModalInfo({
      show: true,
      bookedSlots,
      date: clickedDate
    });
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;

    if (adminBookedDates.some(d => isSameDay(d, date))) {
      return 'admin-booked-date-border';
    }
    if (hodBookedDates.some(d => isSameDay(d, date))) {
      return 'hod-booked-date-border';
    }
    return null;
  };

  const formatDateTime = (date, timeStr) => {
    const [hour, minute] = timeStr.split(':');
    const newDate = new Date(date);
    newDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
    return newDate.toISOString();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const isTimeSlotAvailable = () => {
    const dayKey = getDateKey(date);
    const bookingsForDay = timeSlotsMap[dayKey] || [];

    const start = parseTimeToMinutes(startHour);
    const end = parseTimeToMinutes(endHour);
    if (start === null || end === null) return false;

    for (const slot of bookingsForDay) {
      const [slotStartStr, slotEndStr] = slot.time.split(' - ').map(t => t.trim());
      const slotStart = parseTimeToMinutes(slotStartStr);
      const slotEnd = parseTimeToMinutes(slotEndStr);

      if (!(end <= slotStart || start >= slotEnd)) {
        return false; // overlap found
      }
    }
    return true; // no overlap
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    if (!startHour || !endHour) {
      setError('Please select both start and end time.');
      setIsSubmitting(false);
      return;
    }

    const earliestTime = "09:00";
    const latestTime = "16:30";

    if (startHour < earliestTime || endHour > latestTime) {
      setError('Bookings can only be made between 9:00 AM and 4:30 PM.');
      setIsSubmitting(false);
      return;
    }

    if (startHour >= endHour) {
      setError('Start time must be before end time.');
      setIsSubmitting(false);
      return;
    }

    if (!isTimeSlotAvailable()) {
      setError('Selected time slot is already taken.');
      setIsSubmitting(false);
      return;
    }

    const startTime = formatDateTime(date, startHour);
    const endTime = formatDateTime(date, endHour);

    const fullForm = {
      ...formData,
      eventType: formData.eventType === 'Other' ? formData.otherEventType : formData.eventType,
      startTime,
      endTime,
      sTime: startHour,
      eTime: endHour,
      date: getDateKey(date),
      bookedByAdmin: true,
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/booking/admin-book', fullForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessage('🎉 Booking successfully created!');
      setFormData({
        eventName: '',
        eventType: '',
        otherEventType: '',
        comments: ''
      });
      setStartHour('');
      setEndHour('');
      setDate(new Date());

      await refreshBookingData();

    } catch (error) {
      const msg = error.response?.data?.message || 'Booking failed or time slot already taken.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshBookingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/booking', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const bookings = response.data;
      const adminDates = [];
      const hodDates = [];
      const slotMap = {};

      bookings.forEach(b => {
        const d = new Date(b.date || b.startTime || b.sTime);
        if (isNaN(d.getTime())) return;
        const dayDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        if (b.bookedByAdmin) {
          if (!adminDates.some(dt => dt.getTime() === dayDate.getTime())) {
            adminDates.push(dayDate);
          }
        } else {
          if (!hodDates.some(dt => dt.getTime() === dayDate.getTime())) {
            hodDates.push(dayDate);
          }
        }

        const dateKey = getDateKey(b.date || b.startTime || b.sTime);
        if (!slotMap[dateKey]) slotMap[dateKey] = [];

        slotMap[dateKey].push({
          time: `${b.sTime || new Date(b.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${b.eTime || new Date(b.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
          department: b.department?.name || b.department || (b.bookedByAdmin ? 'Admin' : 'HOD'),
          eventName: b.eventName || 'Unknown',
          _id: b._id,
          bookedByAdmin: b.bookedByAdmin
        });
      });

      setAdminBookedDates(adminDates);
      setHodBookedDates(hodDates);
      setTimeSlotsMap(slotMap);

    } catch (err) {
      console.error('Error refreshing booking data:', err);
    }
  };

  const handleCancel = async (bookingId) => {
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/booking/admin-cancel/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setMessage('✅ Booking cancelled successfully.');

      await refreshBookingData();

      setModalInfo({ show: false, bookedSlots: [], date: null });
    } catch (err) {
      setError('Failed to cancel booking.');
    }
  };

  return (
    <div className={`container mt-5 mb-5 ${darkMode ? 'dark-mode' : ''}`} style={{ maxWidth: 600 }}>
      <button onClick={() => navigate(-1)} className="btn btn-link text-purple mb-3">&larr; Back</button>

      <h2 className="text-center text-purple mb-4 fw-bold">🎯 Admin Auditorium Booking</h2>

      <form onSubmit={handleSubmit} className={`p-4 rounded shadow-sm ${darkMode ? 'bg-dark text-white' : 'bg-light'}`}>
        <div className="mb-3">
          <label htmlFor="eventName" className="form-label">Event Name</label>
          <input
            type="text"
            id="eventName"
            name="eventName"
            className="form-control"
            value={formData.eventName}
            onChange={handleChange}
            required
            placeholder="Enter event name"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="eventType" className="form-label">Event Type</label>
          <select
            id="eventType"
            name="eventType"
            className="form-select"
            value={formData.eventType}
            onChange={(e) => {
              const value = e.target.value;
              setFormData(prev => ({
                ...prev,
                eventType: value,
                otherEventType: value === 'Other' ? prev.otherEventType || '' : ''
              }))
            }}
            required
          >
            <option value="">-- Select Event Type --</option>
            <option value="Academic">Academic</option>
            <option value="Non-Academic">Non-Academic</option>
            <option value="Curriculum">Curriculum</option>
            <option value="Non-Curriculum">Non-Curriculum</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        {formData.eventType === 'Other' && (
          <div className="mb-3">
            <label htmlFor="otherEventType" className="form-label">Please specify</label>
            <textarea
              id="otherEventType"
              name="otherEventType"
              className="form-control"
              value={formData.otherEventType || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, otherEventType: e.target.value }))}
              required
              placeholder="the event type"
            />
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Select Date</label>
          <Calendar
            onClickDay={(value) => {
              setDate(value);
              if (adminBookedDates.some(d => isSameDay(d, value)) || hodBookedDates.some(d => isSameDay(d, value))) {
                handleDateClick(value);
              }
            }}
            value={date}
            minDate={new Date()}
            tileClassName={tileClassName}
          />
        </div>

        <div className="mb-3 d-flex gap-3">
          {['Start Time', 'End Time'].map((label, idx) => (
            <div className="flex-fill" key={label}>
              <label className="form-label">{label}</label>
              <input
                type="time"
                className="form-control"
                value={idx === 0 ? startHour : endHour}
                onChange={(e) => idx === 0 ? setStartHour(e.target.value) : setEndHour(e.target.value)}
                required
                min="09:00"
                max="16:30"
              />
            </div>
          ))}
        </div>

        <div className="mb-3">
          <label htmlFor="comments" className="form-label">Additional Comments</label>
          <textarea
            id="comments"
            name="comments"
            className="form-control"
            value={formData.comments}
            onChange={handleChange}
            placeholder="Any extra requirements or notes"
          />
        </div>

        <button
          type="submit"
          className="btn btn-purple w-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Booking...' : '🚀 Book Now'}
        </button>

        {message && <div className="alert alert-success mt-3">{message}</div>}
        {error && <div className="alert alert-danger mt-3">{error}</div>}
      </form>

      <ModalShow
        show={modalInfo.show}
        bookedSlots={modalInfo.bookedSlots}
        date={modalInfo.date}
        onClose={() => setModalInfo({ ...modalInfo, show: false })}
        onCancel={handleCancel}
      />

      <style>{`
        .text-purple { color: #6f42c1; }
        .btn-purple { background-color: #6f42c1; color: white; }
        .btn-purple:hover { background-color: #59309c; }
        .react-calendar { width: 100%; border: none; background-color: transparent; }
        .admin-booked-date-border { border: 2px solid #6f42c1 !important; border-radius: 8px; }
        .hod-booked-date-border { border: 2px solid red !important; border-radius: 8px; }
        .dark-mode { background-color: #121212; color: #f1f1f1; }
        .dark-mode .form-control, .dark-mode textarea {
          background-color: #1e1e1e;
          color: white;
          border: 1px solid #444;
        }
        .dark-mode .form-check-label { color: white; }
        .dark-mode .react-calendar { background-color: #1e1e1e; color: white; }
      `}</style>
    </div>
  );
};

const ModalShow = ({ show, bookedSlots, date, onClose, onCancel }) => {
  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" onClick={onClose} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Booked Time Slots</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {date && (
              <p className="text-muted mb-2">
                Date: {date.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
            {bookedSlots.length > 0 ? (
              <ul>
                {bookedSlots.map((slot, i) => (
                  <li key={slot._id || i} className="mb-2">
                    <strong>{slot.time}</strong><br />
                    <small>Dept: {slot.department}</small><br />
                    <small>Event: {slot.eventName}</small><br />
                    {slot.bookedByAdmin && (
                      <button
                        className="btn btn-sm btn-outline-danger mt-1"
                        onClick={() => onCancel(slot._id)}
                      >
                        ❌ Cancel Booking
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No bookings for this date.</p>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingForm;
