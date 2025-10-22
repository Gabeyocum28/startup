import React from 'react';

import { MessageDialog } from './messageDialog';
import '../app.css';

export function Unauthenticated(props) {
    const [userName, setUserName] = React.useState(props.userName);
    const [password, setPassword] = React.useState('');
    const [displayError, setDisplayError] = React.useState(null);

    async function loginUser() {
        localStorage.setItem('userName', userName);
        props.onLogin(userName);
    }

    async function createUser() {
        localStorage.setItem('userName', userName);
        props.onLogin(userName);
    }

    return (
        <>
            <div>
                <div>
                    <input className='standard' type='text' value={userName} onChange={(e) => setUserName(e.target.value)} placeholder='username' />
                </div>
                <div >
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
