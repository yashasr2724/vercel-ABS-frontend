import React, { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Username, 2: OTP, 3: New password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, { username });
      setMessage(res.data.message);

      // Only move to OTP step if it's an admin
      if (res.data.message.toLowerCase().includes('otp')) {
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/admin-reset-password`, {
        username,
        otp,
        newPassword,
      });
      setMessage(res.data.message);
      setStep(1);
      setUsername('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Forgot Password</h2>

      {step === 1 && (
        <form onSubmit={handleUsernameSubmit} className="mt-4">
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">Send OTP / Request Reset</button>
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newPassword !== confirmPassword) {
              setError('Passwords do not match');
            } else {
              handleOtpSubmit(e);
            }
          }}
          className="mt-4"
        >
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <input
            type="password"
            className="form-control mb-3"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="form-control mb-3"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-success">Reset Password</button>
        </form>
      )}

      {message && <div className="alert alert-success mt-3">{message}</div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </div>
  );
};

export default ForgotPassword;
