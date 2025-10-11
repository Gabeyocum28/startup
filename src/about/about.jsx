import React from 'react';
import '../app.css';

export function About() {
    return (
        <nav>
            <main>
                <section>
                    <h2>Our Mission</h2>
                    <p>At polyrhythmd, our mission is to empower music enthusiasts to share their honest reviews and connect with like-minded individuals.
                        We believe that everyone has a unique perspective on music, and we want to provide a platform where those voices can be heard.</p>
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
        </nav>
    );
}

            