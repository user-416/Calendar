import React, { useState, useEffect } from 'react';
import calendarService from '../services/calendar';

const Calendars = () => {
  const [calendars, setCalendars] = useState([]);

  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const data = await calendarService.getCalendar();
        setCalendars(data);
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
