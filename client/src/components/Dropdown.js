import React, {useState} from 'react';
import './Dropdown.css'
const Dropdown = ({ calendars }) => {
  const [selectedCalendars, setSelectedCalendars] = useState(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const toggleCalendar = (calendar) => {
    const newSet = new Set(selectedCalendars);
    if(newSet.has(calendar.id))
      newSet.delete(calendar.id);
    else
      newSet.add(calendar.id);
    setSelectedCalendars(newSet);
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  }

  return (
    <div className="dropdown">
      <button className="dropdown-toggle" onClick={toggleDropdown}>Select Calendars</button>
      {isDropdownOpen && (
        <div className="dropdown-menu">
          {calendars.map((calendar, idx) => (
            <div key={idx} className="dropdown-item" onClick={()=>toggleCalendar(calendar)}>
              <input
                type = "checkbox"
                checked = {selectedCalendars.has(calendar.id)}
                onChange = {() => toggleCalendar(calendar)}
              />
              <span>{calendar.summary}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
