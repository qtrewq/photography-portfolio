import React, { useState, useEffect } from 'react';
import HiddenLogin from './HiddenLogin';
import './Footer.css';

const Footer = ({ text }) => {
  const [clickCount, setClickCount] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (clickCount >= 3) {
      setShowLogin(true);
      setClickCount(0);
    }
    
    // Reset click count after 3 seconds of inactivity
    const timer = setTimeout(() => setClickCount(0), 3000);
    return () => clearTimeout(timer);
  }, [clickCount]);

  const handleCopyrightClick = () => {
    setClickCount(prev => prev + 1);
  };

  return (
    <>
      <footer className="footer">
        <p 
          className="copyright" 
          onClick={handleCopyrightClick}
          title="© 2026 Photography Portfolio"
        >
          {text || `© ${new Date().getFullYear()} Photography Portfolio. All rights reserved.`}
        </p>
      </footer>
      
      {showLogin && <HiddenLogin onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default Footer;
