import React, { useState, useEffect, useRef } from 'react';
import CSS from './Dropdown.module.css'

const Dropdown = ({ calendars, selectedCalendars, toggleCalendar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close out dropdown if user clicks outside it
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
    <div className={CSS.dropdown} ref={dropdownRef}>
      <button className={`${CSS.dropdownToggle} ${isDropdownOpen ? CSS.open : ''}`} onClick={toggleDropdown}>
        Select Calendars
        <svg viewBox="0 0 24 24" className={CSS.plusIcon}>
          <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
        </svg>
      </button>
      <div className={` ${CSS.dropdownMenu} ${isDropdownOpen ? CSS.open : ''}`}>
        {calendars.map((calendar, idx) => (
          <label key={idx} className={CSS.dropdownItem}>
            <input
              type="checkbox"
              checked={selectedCalendars.has(calendar.id)}
              onChange={() => toggleCalendar(calendar)}
            />
            <span>{calendar.summary}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default Dropdown;