import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock } from 'lucide-react';
import './HiddenLogin.css';

const HiddenLogin = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (res.ok) {
        // Assume API sets an HTTP-only cookie or returns a token we save.
        // For local development mockup without backend:
        localStorage.setItem('adminToken', 'mock-token-for-dev');
        onClose();
        navigate('/admin');
      } else {
        // Just for local development without the real backend:
        if (password === 'admin') {
          localStorage.setItem('adminToken', 'mock-token-for-dev');
          onClose();
          navigate('/admin');
        } else {
            setError('Invalid credentials');
        }
      }
    } catch (err) {
       // Mock for development
       if (password === 'admin') {
         localStorage.setItem('adminToken', 'mock-token-for-dev');
         onClose();
         navigate('/admin');
       } else {
         setError('Connection failed. Try "admin" locally.');
       }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hidden-login-overlay fade-in" onClick={onClose}>
      <div className="hidden-login-modal glass" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><X size={24} /></button>
        
        <div className="login-header">
          <Lock size={32} className="login-icon" />
          <h2>Admin Access</h2>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <input 
            type="password" 
            placeholder="Enter password..." 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HiddenLogin;
