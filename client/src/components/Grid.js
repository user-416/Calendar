import React, {useEffect, useState, useMemo} from "react";
import axios from 'axios';
import TimeUtil from "../utils/TimeUtil";
import DateUtil from "../utils/DateUtil";
import "./Grid.css";

const Grid = ({ id, event, selectedCalendars }) => {
    const [calendars, setCalendars] = useState(new Map());
    const users = Array.from(calendars.keys());
    const { name, startTime: earliestTime, endTime: latestTime, dates } = event;
    const earliestMin = TimeUtil.toMinutes(earliestTime), latestMin = TimeUtil.toMinutes(latestTime);
    const formattedDates = dates.map(date => new Date(date).toISOString().split("T")[0]);
    const totalUsers = calendars.size;
    const totalMin = TimeUtil.minutesBetween(earliestTime, latestTime);

    const getMergedIntervals = (intervals) => {
        intervals.sort((a, b) => a[0] - b[0]);

        const merged = [];
        for (let interval of intervals) {
            if (merged.length === 0 || interval[0] > merged[merged.length - 1][1]) 
                merged.push(interval);
            else 
                merged[merged.length - 1][1] = Math.max(interval[1], merged[merged.length - 1][1]);  
        }
        return merged;
    }
    
    const getAvailUsers = (intervalStart, intervalEnd, date) => {
        const availUsers = [];
        for(let [user, userIntervals] of busyIntervals.entries()){
            if(userIntervals.has(date) && !userIntervals.get(date).some(busyInterval => (busyInterval[0] <= intervalStart && intervalEnd <= busyInterval[1])))
                availUsers.push(user);
        }
        return availUsers;
    }

    const busyIntervals = useMemo(() => {
        const map = new Map();
        for(let [user, userIntervalsArr] of calendars.entries()){
            const userMap = new Map();
            for(let userIntervals of userIntervalsArr){
                for(let [date, intervals] of userIntervals){
                    for(let interval of intervals){
                        if(!userMap.has(date))
                            userMap.set(date, []);
                        //convert interval from HH:MM-HH:MM to [startMin, endMin]
                        userMap.get(date).push(interval.split('-').map(time => TimeUtil.toMinutes(time)));
                    }
                }
            }

            for(let [date, intervals] of userMap.entries()){
                userMap.set(date, getMergedIntervals(intervals));
            }
            map.set(user, userMap);
        }

         //check for end time going into next day
        for(let [user, userIntervals] of map.entries()){
            for(let [date, intervals] of userIntervals){
                const [start, end] = intervals[intervals.length-1];
                if(end >= 24*60){ 
                    intervals[intervals.length-1][1] = latestMin; 
                    const nextDay = DateUtil.addDaysToDate(date, 1);
                    const nextDayEnd = end-24*60;
                    if(nextDayEnd > earliestMin && formattedDates.includes(date)){
                        if(!userIntervals.has(nextDay))
                            userIntervals.set(nextDay, []);
                        const nextDayInterval = [earliestMin, nextDayEnd];
                        userIntervals.get(nextDay).unshift(nextDayInterval);
                    }
                }
            }
        }
        return map;
    }, [calendars]);

    const intervalMap = useMemo(() => {
        const map = new Map();
        for (let date of formattedDates) {
            const intervals = [];
            intervals.push(earliestMin);
            for (let [user, userIntervals] of busyIntervals) {
                if (!userIntervals.has(date)) continue;
                for (let interval of userIntervals.get(date)) {
                    let [start, end] = interval;
                    start = Math.max(start, earliestMin); 
                    end = Math.min(end, latestMin);
                    intervals.push(start);
                    intervals.push(end);
                }
            }

            intervals.sort((a, b) => a - b);
            intervals.push(latestMin);

            const intervalAvail = [];
            for (let i = 0; i < intervals.length - 1; i++) {
                if (intervals[i] === intervals[i + 1]) continue;
                const start = intervals[i], end = intervals[i + 1];
                const availUsers = getAvailUsers(start, end, date);
                const prev = intervalAvail[intervalAvail.length - 1];
                if (intervalAvail.length > 0 && JSON.stringify(availUsers) === JSON.stringify(prev[2])) {
                    prev[1] = end;
                } else {
                    intervalAvail.push([start, end, availUsers]);
                }
            }
            map.set(date, intervalAvail);
        }
        return map;
    }, [calendars]);

    const hourlyLabels = useMemo(() => {
        console.log("re-calculate hourly labels");
        /*let a = 0;
        while(a<1000000000)
            a++;*/
        const intervals = [];
        const start = parseInt(earliestTime.slice(0, 2));
        const end = parseInt(latestTime.slice(0, 2));
        for (let hour = start; hour <= end; hour++) {
            intervals.push(TimeUtil.toAMPM(TimeUtil.hoursToHHMM(hour)));
        }
        return intervals;
    }, []);

    const [selectedIntervalIdx, setSelectedIntervalIdx] = useState(0);
    const [selectedDate, setSelectedDate] = useState(formattedDates[0]);

    const handleIntervalClick = (date, idx) => {
        setSelectedDate(date);
        setSelectedIntervalIdx(idx);
    }

    const [dateStartIdx, setDateStartIdx] = useState(0);
    const [dateEndIdx, setDateEndIdx] = useState(Math.min(6, formattedDates.length-1));

    const forward7Days = () => {
        setDateStartIdx(dateStartIdx+7);
        setDateEndIdx(Math.min(formattedDates.length-1, dateEndIdx+7))
    }

    const back7Days = () => {
        setDateEndIdx(dateStartIdx-1);
        setDateStartIdx(Math.max(0, dateStartIdx-7));
    }

    useEffect(() => {
        const getCalendars = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/getAvail?meetingId=${id}`, {withCredentials: true});

                const formattedCalendars = new Map();
                response.data.calendars.forEach(calendar => {
                    const userCalendars = calendar.personCalendar.map(cal => {
                        const formattedEvents = new Map();
                        cal.events.forEach(event => {
                            // console.log("event: " + JSON.stringify(event));
                            const date = event.start.date || event.start.dateTime.split('T')[0];
                            if (!formattedEvents.has(date)) {
                                formattedEvents.set(date, []);
                            }
                            const startTime = event.start.dateTime ? event.start.dateTime.split('T')[1].substring(0, 5) : '00:00';
                            const endTime = event.end.dateTime ? event.end.dateTime.split('T')[1].substring(0, 5) : '23:59';
                            formattedEvents.get(date).push(`${startTime}-${endTime}`);
                        });
                        return formattedEvents;
                    });
                formattedCalendars.set(calendar.personName, userCalendars);
            });

            setCalendars(formattedCalendars);
            } catch (err) {
                console.log(err);
            }
        };
    
        getCalendars();
    }, [id, selectedCalendars]);

    return (
        <div className="component-container">
            <div className="all-users-wrapper users-wrapper">
                <div className="users-heading">People</div> 
                {users.map(user => (
                    <p key={user} className='user-name'>{user}</p>
                ))}
            </div>
            <div className="grid-wrapper">
                <div className="hourly-labels">
                    {hourlyLabels.map((time) => (
                        <div key={time} className="hourly-label">{time}</div>
                    ))}
                </div>
                <div className="grid-vertical">
                    <div className="navigation-arrows">
                        <button onClick={back7Days} disabled={dateStartIdx === 0}>&lt;</button>
                        <div className="event-name">{name}</div>
                        <button onClick={forward7Days} disabled={dateEndIdx == event.dates.length - 1}>&gt;</button>
                    </div>
                    <div className="date-labels" style={{ width: `calc((${dateEndIdx} - ${dateStartIdx} + 1) * 5.5vw + 2px)` }}>
                            {formattedDates.slice(dateStartIdx, dateEndIdx+1).map((date, dateIdx) => (
                                <div key={date} className="date-label">
                                    <div>{DateUtil.toMD(date)}</div>
                                    <div>{DateUtil.getDayOfWeek(date)}</div>
                                </div>
                            ))}
                    </div>
                    <div className="grid" style={{ width: `calc((${dateEndIdx} - ${dateStartIdx} + 1) * 5.5vw + 2px)` }}>
                        {formattedDates.slice(dateStartIdx, dateEndIdx + 1).map((date, dateIdx) => (
                            <div key={date} className="grid-col">
                                {intervalMap.get(date).map(([startMin, endMin, availUsers], intervalIdx) => {
                                    const availCnt = availUsers.length;
                                    const opacity = availCnt / totalUsers;
                                    const intervalHeight = endMin - startMin;
                                    const isSelected = date==selectedDate && intervalIdx==selectedIntervalIdx;
                                    return (
                                        <div
                                            key={`${date}-${startMin}-${endMin}`}
                                            className="grid-cell"
                                            onClick={() => handleIntervalClick(date, intervalIdx)}
                                            style={{
                                                height: `${intervalHeight*1.405}px`,  
                                                backgroundColor: isSelected ? `rgba(0, 100, 255, ${opacity+1/(2*totalUsers)})` : `rgba(0, 128, 0, ${opacity})`,
                                                borderBottom: `${intervalIdx === intervalMap.get(date).length - 1 ? '2px' : '1px'} solid black`
                                            }}
                                        >
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {selectedDate && (
            <div className="availability-wrapper users-wrapper">
                <div className="users-heading">Available</div> 
                <div className="time-interval">
                    {TimeUtil.minutesToAMPM(intervalMap.get(selectedDate)[selectedIntervalIdx][0])} - {TimeUtil.minutesToAMPM(intervalMap.get(selectedDate)[selectedIntervalIdx][1])}, {DateUtil.toMonthNameD(selectedDate)}:
                </div>
                {intervalMap.get(selectedDate)[selectedIntervalIdx][2].map(user => (
                    <p key={user} className='user-name'>{user}</p>
                ))}
            </div>
            )}
        </div>
    );
};

export default Grid;
