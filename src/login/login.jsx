import React from 'react';
import '../app.css';

export function Login() {
    return (
        <div>
            <main>
                <p className="dev">Data from here will be checked in DB for login</p>
                <form>
                    <h1>Login</h1>
                    <div>
                        <input id="username" name="username" className="standard" placeholder="Username" required />
                    </div>
                    <div>
                        <input id="password" name="password" className="standard" placeholder="Password" required />
                    </div>
                    <div>
                        <button className="aura">Log in</button>
                        <button className="aura">Register</button>
                    </div>
                </form>
            </main>
        </div>
    );
}