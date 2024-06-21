import React from 'react';

const Dropdown = ({ calendars }) => {
  return (
    <div className="dropdown">
      <button className="dropdown-toggle">Select Calendars</button>
      <div className="dropdown-menu">
        {calendars.map((calendar, index) => (
          <div key={index} className="dropdown-item">
            {calendar.summary}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dropdown;
