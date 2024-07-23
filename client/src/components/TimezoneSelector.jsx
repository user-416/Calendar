
const TimezoneSelector = ({timezone, setTimezone}) => {

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
        timezoneAbbr: abbr,
        timezone: name
    }));

    return ( 
        <div className={CSS.timezoneSelectorContainer}>
            <select className={CSS.timezoneDropdown} value={timezone} onChange={e => setTimezone(e.target.value)}>
                {timezones.map(({timezoneAbbr, timezone}) => (
                    <option key={timezone} value={timezone}>{timezoneAbbr}</option>
                ))}
            </select>
        </div>
    );
}
 
export default TimezoneSelector;