import { useRef, useState, useEffect } from 'react';
import CSS from './TimezoneSelector.module.css';
import useOutsideClick from '../hooks/useOutsideClick';
const TimezoneSelector = ({timezone:selectedTimezone, setTimezone:setSelectedTimezone}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedTimezone, setHighlightedTimezone] = useState(selectedTimezone);
    const dropdownRef = useRef();
    useOutsideClick(dropdownRef, setIsOpen);
    
    const timezoneMap = {
        'UTC': 'UTC',
        'GMT': 'GMT',
        'EST': 'America/New_York', // Eastern Standard Time
        'PST': 'America/Los_Angeles', // Pacific Standard Time
        'CST': 'America/Chicago', // Central Standard Time
        'MST': 'America/Denver', // Mountain Standard Time
        'CET': 'Europe/Paris', // Central European Time
        'IST': 'Asia/Kolkata', // Indian Standard Time
        'AEST': 'Australia/Sydney', // Australian Eastern Standard Time
        'JST': 'Asia/Tokyo' // Japan Standard Time
    };

    const timezones = Object.entries(timezoneMap).map(([abbr, name]) => ({
        tzAbbr: abbr,
        tz: name
    }));

    const handleSelect = (tz) => {
        setSelectedTimezone(tz);
        setIsOpen(false);
    }

    const toggleDropdown = () => {
        if (!isOpen) {  
            setHighlightedTimezone(selectedTimezone); 
        }
        setIsOpen(!isOpen);
    }
    return ( 
        <div className={CSS.timezoneSelectorContainer}>
            <div className={CSS.dropdown} ref={dropdownRef}>
                <div className={`${CSS.dropdownToggle} ${isOpen ? CSS.open : ''}`} onClick={toggleDropdown}>
                    <span className={CSS.toggleText}>{Object.keys(timezoneMap).find(tz => timezoneMap[tz] === selectedTimezone)}</span>
                    <svg className={` ${CSS.dropdownArrow} ${isOpen ? CSS.open : ''}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>

                </div>
                {isOpen && (
                    <div className={CSS.dropdownContent}>
                        {timezones.map(({tzAbbr, tz}) => (
                            <div 
                                key={tzAbbr} 
                                className={`${CSS.dropdownItem} ${highlightedTimezone===tz ? CSS.highlighted : ''}`} 
                                onClick = {() => handleSelect(tz)}
                                onMouseEnter = {() => setHighlightedTimezone(tz)}
                            >
                                <span className={CSS.dropdownItemText}>{tzAbbr}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
 
export default TimezoneSelector;