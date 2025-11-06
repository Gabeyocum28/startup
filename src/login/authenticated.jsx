import React from 'react';
import { useNavigate } from 'react-router-dom';

import Button from 'react-bootstrap/Button';
import { clearAuthToken } from './authService';

import './authenticated.css';
import '../app.css';

export function Authenticated(props) {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Automatically redirect to feed after 1.5 seconds
    const timer = setTimeout(() => {
      navigate('/feed');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  function logout() {
    fetch('/api/auth/logout', {
      method: 'delete',
    })
      .catch(() => {
        // Logout failed. Assuming offline
      })
      .finally(() => {
        clearAuthToken();
        props.onLogout();
      });
  }

  return (
    <div>
      
    </div>
  );
}