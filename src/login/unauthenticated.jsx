import React from 'react';

import { MessageDialog } from './messageDialog';
import { setAuthToken } from './authService';
import '../app.css';

export function Unauthenticated(props) {
  const [userName, setUserName] = React.useState(props.userName);
  const [password, setPassword] = React.useState('');
  const [displayError, setDisplayError] = React.useState(null);

  async function loginUser() {
    loginOrCreate('/api/auth/login');
  }

  async function createUser() {
    loginOrCreate('/api/auth/register');
  }

  async function loginOrCreate(endpoint) {
    const response = await fetch(endpoint, {
      method: 'post',
      body: JSON.stringify({ email: userName, password: password }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      credentials: 'include',
    });
    if (response?.status === 200 || response?.status === 201) {
      const data = await response.json();
      console.log('Login/Register response:', data);
      // Store the token if it's in the response
      if (data.token) {
        console.log('Saving token:', data.token);
        setAuthToken(data.token);
      } else {
        console.log('No token in response!');
      }
      console.log('Calling onLogin with username:', userName);
      props.onLogin(userName);
    } else {
      const body = await response.json();
      setDisplayError(`⚠ Error: ${body.msg}`);
    }
  }

  return (
    <>
      <div>
        <div>
          <input className='standard' type='text' value={userName} onChange={(e) => setUserName(e.target.value)} placeholder='your@email.com' />
        </div>
        <div>
          <input className='standard' type='password' onChange={(e) => setPassword(e.target.value)} placeholder='password' />
        </div>
        <button onClick={() => loginUser()} disabled={!userName || !password}>
          Login
        </button>
        <button onClick={() => createUser()} disabled={!userName || !password}>
          Create
        </button>
      </div>

      <MessageDialog message={displayError} onHide={() => setDisplayError(null)} />
    </>
  );
}
