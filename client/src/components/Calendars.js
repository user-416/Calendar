import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Calendars = () => {
  const [calendars, setCalendars] = useState([]);

  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const response = await axios.get('http://localhost:3000/calendars');
        setCalendars(response.data);
      } catch (error) {
        console.error('Error fetching calendars', error);
      }
    };

    fetchCalendars();
  }, []);

  return (
    <div>
      <h1>Calendars</h1>
      <ul>
        {calendars.map(calendar => (
          <li key={calendar.id}>{calendar.summary}</li>
        ))}
      </ul>
    </div>
  );
};

export default Calendars;
