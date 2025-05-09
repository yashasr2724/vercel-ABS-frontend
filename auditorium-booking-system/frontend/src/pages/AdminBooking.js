import React from 'react';
import AdminBookingForm from '../components/AdminBookingForm'; // ✅ Import the actual form

const AdminBooking = () => {
  return (
    <div>
      <AdminBookingForm /> {/* ✅ Use the centralized form component */}
    </div>
  );
};

export default AdminBooking;
