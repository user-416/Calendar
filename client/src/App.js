import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Main from './components/Main';
import Login from './components/Login';
import Calendars from './components/Calendars';
import Events from './components/Events';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="/calendars" element={<Calendars />} />
        <Route path="/events/:calendarId" element={<Events />} />
      </Routes>
    </Router>
  );
};

export default App;
