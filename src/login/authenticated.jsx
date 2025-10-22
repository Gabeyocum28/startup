import React from 'react';
import { useNavigate } from 'react-router-dom';

import './authenticated.css';
import '../app.css';

export function Authenticated(props) {
  const navigate = useNavigate();

  React.useEffect(() => {
    const timer = setTimeout(() => {
        navigate('/feed');
        }, 3000); // 1000ms = 1 second

    
        return () => clearTimeout(timer);
    }, []);

  function logout() {
    localStorage.removeItem('userName');
    props.onLogout();
  }

  return (
    <div>
        <h2>{props.userName}!</h2>
    </div>
  );
}