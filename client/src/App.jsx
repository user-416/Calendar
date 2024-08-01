import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Main from './pages/main/Main';
import Meet from './pages/meet/Meet';
import Navbar from './components/Navbar';
import Privacy from './pages/privacy/Privacy';
import Footer from './components/Footer';
import AuthContextProvider from './contexts/AuthContext';
const App = () => {
  return (
    <AuthContextProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/:id" element={<Meet />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
        <Footer/>
      </Router>
    </AuthContextProvider>
  );
};

export default App;
