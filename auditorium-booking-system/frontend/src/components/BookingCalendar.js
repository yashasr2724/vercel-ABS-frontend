import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import { Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const BookingCalendar = ({ darkMode }) => {
  const [bookedDates, setBookedDates] = useState([]);
  const [timeSlotsMap, setTimeSlotsMap] = useState({});
  const [modalInfo, setModalInfo] = useState({ show: false, bookedSlots: [], date: null });
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const getDateKey = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const dateRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking/approved`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const timeSlotRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking/approved-times`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const uniqueDates = [];
        dateRes.data.forEach(b => {
          const d = new Date(b.date);
          const onlyDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          if (!uniqueDates.some(dt => dt.getTime() === onlyDate.getTime())) {
            uniqueDates.push(onlyDate);
          }
        });
        setBookedDates(uniqueDates);

        const slotMap = {};
        timeSlotRes.data.forEach(item => {
          if (!item.startTime) return;
          const key = getDateKey(item.startTime);
          if (!key) return;
          if (!slotMap[key]) slotMap[key] = [];
          slotMap[key].push({
            time: `${item.sTime} - ${item.eTime}`,
            department: item.department?.name || item.department || 'Unknown',
            eventName: item.eventName || 'Unknown'
          });
        });
        setTimeSlotsMap(slotMap);
      } catch (err) {
        console.error('Error loading calendar data', err);
      }
    };

    fetchData();
  }, []);

  const handleDateClick = (value) => {
    const key = getDateKey(value);
    const bookedSlots = timeSlotsMap[key] || [];
    setModalInfo({ show: true, bookedSlots, date: value });
    setSelectedDate(value);
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month' && bookedDates.some(d => isSameDay(d, date))) {
      return 'booked-date-border';
    }
    return null;
  };

  return (
    <div className={`calendar-container ${darkMode ? 'calendar-dark' : ''}`}>
      <Calendar
        onClickDay={(value) => {
          setSelectedDate(value);
          if (bookedDates.some(d => isSameDay(d, value))) {
            handleDateClick(value);
          }
        }}
        value={selectedDate}
        minDate={new Date()}
        tileClassName={tileClassName}
        className={darkMode ? 'react-calendar react-calendar-dark' : 'react-calendar'}
      />

      <Modal show={modalInfo.show} onHide={() => setModalInfo({ ...modalInfo, show: false })} centered>
        <Modal.Header closeButton className={darkMode ? 'bg-dark text-white' : ''}>
          <Modal.Title>Booked Time Slots</Modal.Title>
        </Modal.Header>
        <Modal.Body className={darkMode ? 'bg-dark text-white' : ''}>
          {modalInfo.date && (
            <p className="text-muted mb-2">
              Date: {modalInfo.date.toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          )}
          {modalInfo.bookedSlots.length > 0 ? (
            <ul>
              {modalInfo.bookedSlots.map((slot, i) => (
                <li key={i} style={{ marginBottom: '10px' }}>
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
        <Modal.Footer className={darkMode ? 'bg-dark text-white' : ''}>
          <Button variant="secondary" onClick={() => setModalInfo({ ...modalInfo, show: false })}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .booked-date-border {
          border: 2px solid red !important;
          border-radius: 8px;
        }

        .calendar-dark {
          background-color: #1e1e1e;
          color: white;
          padding: 1rem;
          border-radius: 10px;
        }

        .react-calendar-dark {
          background-color: #2a2a2a !important;
          color: white;
          border: none;
        }

        .react-calendar-dark .react-calendar__tile {
          background: #2a2a2a;
          color: white;
        }

        .react-calendar-dark .react-calendar__tile--active {
          background: #007bff !important;
          color: white !important;
        }

        .react-calendar__navigation button {
          color: inherit;
        }
      `}</style>
    </div>
  );
};

export default BookingCalendar;
