import React from 'react';
import CSS from './Privacy.module.css';

const Privacy = () => {
  return (
    <div className={CSS.policyContainer}>
        <div className={CSS.policyHeader}>
            <h1>Privacy Policy</h1>
            <h3>Effective Date: 7/18/2024</h3>
        </div>
        
        <section>
            <h2>Introduction</h2>
            <p>
                We are committed to protecting the privacy of CalConnect users. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
            </p>
        </section>
      
        <section>
            <h2>What We Collect</h2>
            <p>We collect the following information when you use our application:</p>
            <ul>
                <li><strong>Email Address:</strong> When you log in using your Google account, we collect your email address.</li>
                <li><strong>Calendar Information:</strong> If you choose to add your Google Calendar to a meeting, we collect:
            <ul>
                <li>Calendar ID</li>
                <li>Event names</li>
                <li>Event IDs</li>
                <li>Event start times</li>
                <li>Event end times</li>
            </ul>
            </li>
            </ul>
            <p>This information is only collected for events within the date range of the CalConnect meeting you've logged in to.</p>
        </section>
      
        <section>
            <h2>How We Use Your Information</h2>
            <p>We use the collected information solely for the purpose of facilitating the scheduling of meetings through our application. Specifically:</p>
            <ul>
                <li>Your email address is used to identify you as a participant in a specific meeting.</li>
                <li>Your calendar information is used to display your availability to other meeting participants.</li>
            </ul>
        </section>
      
        <section>
            <h2>Data Storage and Security</h2>
            <p>We store your information in a secure database. We implement appropriate technical and organizational measures to protect your data against unauthorized or unlawful processing, accidental loss, destruction, or damage.</p>
        </section>
      
        <section>
            <h2>Data Sharing and Disclosure</h2>
            <p>We do not sell, trade, or otherwise transfer your personal information to outside parties. Your calendar information is only shared with other participants of the specific meeting you've joined.</p>
        </section>
      
        <section>
            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
                <li>Access the personal information we hold about you</li>
                <li>Request correction of your personal information</li>
                <li>Request deletion of your personal information</li>
                <li>Withdraw your consent at any time</li>
            </ul>
            <p>To exercise these rights, please contact us via email.</p>
        </section>
      
        <section>
            <h2>Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top.</p>
        </section>
      
        <section>
            <h2>Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at:
                <br/>
                <br/>
                <u>tgao124@gmail.com</u>
            </p>
        </section>
    </div>
  );
};

export default Privacy;