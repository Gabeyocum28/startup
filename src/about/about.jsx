import React from 'react';
import '../app.css';

export function About() {
    return (
        <div>
            <main>
                <section>
                    <h2>Our Mission</h2>
                    <p>At polyrhythmd, our mission is to empower music enthusiasts to share their honest reviews and connect with like-minded individuals.
                        We believe that everyone has a unique perspective on music, and we want to provide a platform where those voices can be heard.</p>
                </section>
                <section>
                    <h2>What Our Users Say</h2>
                    <div style={{ marginBottom: '2rem' }}>
                        <blockquote style={{
                            borderLeft: '4px solid var(--primary-color, #ff6b6b)',
                            paddingLeft: '1rem',
                            marginBottom: '1rem',
                            fontStyle: 'italic'
                        }}>
                            "That’s epic gabe!!  Just reviewed an album"
                            <footer style={{ marginTop: '0.5rem', fontStyle: 'normal', color: 'var(--text-muted)' }}>
                                — @L
                            </footer>
                        </blockquote>
                        <blockquote style={{
                            borderLeft: '4px solid var(--primary-color, #ff6b6b)',
                            paddingLeft: '1rem',
                            marginBottom: '1rem',
                            fontStyle: 'italic'
                        }}>
                            "This is amazing and I selfishly hope no finds out about it except us and its just our mini social site"
                            <footer style={{ marginTop: '0.5rem', fontStyle: 'normal', color: 'var(--text-muted)' }}>
                                — @iamaaroncox@gmail.com
                            </footer>
                        </blockquote>
                        <blockquote style={{
                            borderLeft: '4px solid var(--primary-color, #ff6b6b)',
                            paddingLeft: '1rem',
                            marginBottom: '1rem',
                            fontStyle: 'italic'
                        }}>
                            "Who else linkin they polyrhythmd account in their Letterboxd bio?"
                            <footer style={{ marginTop: '0.5rem', fontStyle: 'normal', color: 'var(--text-muted)' }}>
                                — @meganegreen
                            </footer>
                        </blockquote>
                    </div>
                </section>
                <section>
                    <h2>Our Team</h2>
                    <img src="/images/gabriel_yocum_about_pfp.jpg" alt="Gabriel Yocum" style={{width: '200px', height: '200px'}} />
                    <h3>Gabriel Yocum - Founder & CEO</h3>
                    <p>Gabriel is a computer science student at Brigham Young University with a passion for music and technology. 
                        He founded polyrhythmd to create a space where music lovers can share their opinions and discover new tunes.</p>
                    <img src="/images/amur_bashirov_about_pfp.jpg" alt="Amur Bashirov" style={{width: '200px', height: '200px'}} />    
                    <h3>Amur Bashirov - TA & Chief Advisor</h3>
                    <p></p>
                </section>
                <section>
                    <h2>Contact Us</h2>
                    <p>If you have any questions, feedback, or suggestions, please feel free to reach out to us at </p>
                    <p><a href="mailto:polyrhythmd@gmail.com">polyrhythmd@gmail.com</a></p>
                </section>
            </main>
        </div>
    );
}

            