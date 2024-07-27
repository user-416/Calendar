import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Main from './components/Main';
import Meet from './components/Meet';
import Calendars from './components/Calendars';
import Navbar from './components/Navbar';
import Privacy from './components/Privacy';
const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/calendars" element={<Calendars />} />
        <Route path="/:id" element={<Meet />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </Router>
  );
};

export default App;
