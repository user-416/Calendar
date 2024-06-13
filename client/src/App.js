import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Main from './components/Main';
import Meet from './components/Meet';
import Calendars from './components/Calendars';
import Events from './components/Events';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/calendars" element={<Calendars />} />
        <Route path="/:id" element={<Meet />} />
        <Route path="/events/:calendarId" element={<Events />} />
      </Routes>
    </Router>
  );
};

export default App;
