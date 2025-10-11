import React from 'react';
import '../app.css';

export function Register() {
    return (
        <div>
            <main>
                <p className="dev">Data from here will be stored in DB four auth</p>
                <form>
                    <h1>Register</h1>
                    <div className="input-row">
                        <div>
                            <input id="firstname" name="firstname" type="text" className="standard" placeholder="First Name" required />
                        </div>
                        <div>
                            <input id="lastname" name="lastname" type="text" className="standard" placeholder="Last Name" required />
                        </div>
                    </div>
                    
                    <div className="input-row">
                        <div>
                            <label htmlFor="birthday">Birthday</label>
                            <input id="birthday" name="birthday" type="date" placeholder="Date of Birth" required />
                        </div>
                        <div>
                            <input id="phone" name="phone" className="standard" type="phone" placeholder="(555) 123-4567" required />
                        </div>
                    </div>
                    
                    <div>
                        <input id="email" name="email" type="email" className="standard" placeholder="Email" required />
                    </div>
                    <div>
                        <label htmlFor="genres">Favorite Music Genres</label>
                        <select id="genres" name="genres" multiple required>
                            <option value="rock">Rock</option>
                            <option value="pop">Pop</option>
                            <option value="hiphop">Hip-Hop</option>
                            <option value="jazz">Jazz</option>
                            <option value="classical">Classical</option>
                            <option value="country">Country</option>
                            <option value="electronic">Electronic</option>
                            <option value="blues">Blues</option>
                            <option value="reggae">Reggae</option>
                            <option value="metal">Metal</option>
                        </select>
                    </div>
                    <div>
                        <input id="username" name="username" className="standard" type="userName" placeholder="Username" required />
                    </div>
                    <div>
                        <input id="password" name="password" className="standard" type="password" placeholder="Password" required />
                    </div>
                    <div>
                        <input id="confirm_password" name="confirm_password" className="standard" type="confirm_password" placeholder="Confirm Password" required />
                    </div>
                    <div>
                        <button className="aura">Return</button>
                        <button className="aura">Register</button>
                    </div>
                </form>
            </main>
        </div>
    );
}   