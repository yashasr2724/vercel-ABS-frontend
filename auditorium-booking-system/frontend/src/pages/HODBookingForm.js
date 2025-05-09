import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './hodbookingform.css';

const HODBookingForm = () => {
  const [formData, setFormData] = useState({
    department: '',
    eventName: '',
    eventType: '',
    comments: '',
    requirements: []
  });

  const [date, setDate] = useState(new Date());
  const [startHour, setStartHour] = useState('');
  const [endHour, setEndHour] = useState('');
  const [bookedDates, setBookedDates] = useState([]);
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
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking/approved`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const bookings = response.data;
        const dates = [];

        bookings.forEach(b => {
          const d = new Date(b.date);
          const dayDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          if (!dates.some(dt => dt.getTime() === dayDate.getTime())) {
            dates.push(dayDate);
          }
        });

        setBookedDates(dates);
      } catch (err) {
        console.error('Error fetching booked dates:', err);
      }
    };

    const fetchTimeSlotsOnly = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking/approved-times`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const slotMap = {};

        response.data.forEach((item) => {
          if (!item.startTime) return;
          const dateKey = getDateKey(item.startTime);
          if (!dateKey) return;
          if (!slotMap[dateKey]) slotMap[dateKey] = [];

          slotMap[dateKey].push({
            time: `${item.sTime} - ${item.eTime}`,
            department: item.department?.name || item.department || 'Unknown',
            eventName: item.eventName || 'Unknown'
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
    if (view === 'month' && bookedDates.some(d => isSameDay(d, date))) {
      return 'booked-date-border';
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

  const handleRequirementChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      requirements: checked
        ? [...prev.requirements, value]
        : prev.requirements.filter(r => r !== value)
    }));
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

    const startTime = formatDateTime(date, startHour);
    const endTime = formatDateTime(date, endHour);

    if (new Date(startTime) >= new Date(endTime)) {
      setError('Start time must be before end time.');
      setIsSubmitting(false);
      return;
    }

    const fullForm = {
      ...formData,
      eventType: formData.eventType === 'Other' ? formData.customEventType : formData.eventType,
      startTime,
      endTime,
      sTime: startHour,
      eTime: endHour,
      date: getDateKey(date)
    };
    

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL}/api/booking`, fullForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessage('🎉 Booking request submitted successfully!');
      setFormData({
        department: '',
        eventName: '',
        eventType: '',
        comments: '',
        requirements: []
      });
      setStartHour('');
      setEndHour('');
      setDate(new Date());
    } catch (error) {
      const msg = error.response?.data?.message || 'Time slot already taken';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`container mt-5 mb-5 ${darkMode ? 'dark-mode' : ''}`}>
      <button onClick={() => navigate(-1)} className="btn btn-link text-purple mb-3">&larr; Back</button>

      <h2 className="text-center text-purple mb-4 fw-bold">📋 HOD Auditorium Booking Request</h2>
      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8">
          <form onSubmit={handleSubmit} className={`p-4 rounded shadow-sm ${darkMode ? 'bg-dark text-white' : 'bg-light'}`}>
            {/* Department Input */}
              <div className="mb-3">
                <label htmlFor="department" className="form-label">Department</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  className="form-control"
                  value={formData.department}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Event Name Input */}
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
                />
              </div>

              {/* Event Type Dropdown */}
              <div className="mb-3">
                <label htmlFor="eventType" className="form-label">Event Type</label>
                <select
                  id="eventType"
                  name="eventType"
                  className="form-select"
                  value={formData.eventType}
                  onChange={handleChange}
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

              {/* Optional Other Event Type Text Input */}
              {formData.eventType === 'Other' && (
                <div className="mb-3">
                  <label htmlFor="customEventType" className="form-label">Please specify</label>
                  <input
                    type="text"
                    id="customEventType"
                    className="form-control"
                    value={formData.customEventType || ''}
                    onChange={(e) => setFormData({ ...formData, customEventType: e.target.value })}
                    required
                  />
                </div>
              )}


            <div className="mb-3">
              <label className="form-label">Select Date</label>
              <Calendar
                onClickDay={(value) => {
                  setDate(value);
                  if (bookedDates.some(d => isSameDay(d, value))) {
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
              <label className="form-label">Requirements</label>
              {['mic', 'bottles', 'camera', 'speakers'].map(req => (
                <div className="form-check" key={req}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value={req}
                    id={req}
                    onChange={handleRequirementChange}
                    checked={formData.requirements.includes(req)}
                  />
                  <label className="form-check-label" htmlFor={req}>
                    {req.charAt(0).toUpperCase() + req.slice(1)}{' '}
                    {req === 'mic' && '🎤'}{req === 'bottles' && '🧴'}
                    {req === 'camera' && '📸'}{req === 'speakers' && '🔊'}
                  </label>
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
              {isSubmitting ? 'Submitting...' : '🚀 Submit Request'}
            </button>

            {message && <div className="alert alert-success mt-3">{message}</div>}
            {error && <div className="alert alert-danger mt-3">{error}</div>}
          </form>
        </div>
      </div>

      <Modal show={modalInfo.show} onHide={() => setModalInfo({ ...modalInfo, show: false })}>
        <Modal.Header closeButton>
          <Modal.Title>Booked Time Slots</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalInfo.date && (
            <p className="text-muted mb-2">
              Date: {modalInfo.date.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
          {modalInfo.bookedSlots.length > 0 ? (
            <ul>
              {modalInfo.bookedSlots.map((slot, i) => (
                <li key={i}>
                  <strong>{slot.time}</strong><br />
                  <small>Dept: {slot.department}</small><br />
                  <small>Event: {slot.eventName}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p>No bookings for this date.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalInfo({ ...modalInfo, show: false })}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .text-purple { color: #6f42c1; }
        .btn-purple { background-color: #6f42c1; color: white; }
        .btn-purple:hover { background-color: #59309c; }
        .react-calendar { width: 100%; border: none; background-color: transparent; }
        .booked-date-border { border: 2px solid red !important; border-radius: 8px; }
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

export default HODBookingForm;
