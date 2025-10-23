import React from 'react';
import { useNavigate } from 'react-router-dom';

import './authenticated.css';
import '../app.css';

export function Authenticated(props) {
  const navigate = useNavigate();

  React.useEffect(() => {
    const timer = setTimeout(() => {
        navigate('/feed');
        }, 1500); 

    
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