import React from 'react';
import { Link } from 'react-router-dom';
import './Main.css';

const Main = () => {
  return (
    <div>
      <div class="title">CalConnect</div>
      <p>Please log in to access your calendars and events.</p>
      <Link to="/login">Login</Link>
    </div>
  );
};

export default Main;
