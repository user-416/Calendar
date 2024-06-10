import React, { useEffect } from 'react';
import axios from 'axios';

const Login = () => {
  useEffect(() => {
    const getAuthUrl = async () => {
      try {
        const response = await axios.get('http://localhost:3000/login');
        window.location.href = response.data.url;
      } catch (error) {
        console.error('Error fetching auth URL', error);
      }
    };

    getAuthUrl();
  }, []);

  return <div>Redirecting to Google login...</div>;
};

export default Login;
