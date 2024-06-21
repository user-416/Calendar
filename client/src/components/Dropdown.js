import React, { useState, useEffect, useRef } from 'react';
import './Dropdown.css'

const Dropdown = ({ calendars, selectedCalendars, toggleCalendar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  }

  return (
    <div className="dropdown" ref={dropdownRef}>
      <button className="dropdown-toggle" onClick={toggleDropdown}>Select Calendars</button>
      {isDropdownOpen && (
        <div className="dropdown-menu">
          {calendars.map((calendar, idx) => (
            <label key={idx} className="dropdown-item">
              <input
                type="checkbox"
                checked={selectedCalendars.has(calendar.id)}
                onChange={() => toggleCalendar(calendar)}
              />
              <span>{calendar.summary}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;