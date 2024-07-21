import React, {useEffect, useState, useMemo} from "react";
import calendarService from '../services/calendar';
import TimeUtil from "../utils/TimeUtil";
import DateUtil from "../utils/DateUtil";
import "./Grid.css";
import TimezoneSelector from "./TimezoneSelector";
import moment from "moment-timezone";

const Grid = ({ id, meeting, selectedCalendars }) => {
    const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [timezone, setTimezone] = useState(defaultTimezone);
    const [calendars, setCalendars] = useState(new Map());
    let calendarData;
    useEffect(() => {
        const getCalendars = async () => {
            try {
                calendarData = await calendarService.getAvailability(id);
                populateCalendarsUTC();
            } catch (err) {
                console.log(err);
            }
        };
    
        getCalendars();
    }, [id, selectedCalendars]);

    console.log('calendars: ', calendars);
    const [selectedIntervalIdx, setSelectedIntervalIdx] = useState(0);
    let { name, startTime: earliestTimeUTC, endTime: latestTimeUTC, dates: datesUTC } = meeting;
    let earliestTime = TimeUtil.convertFromUTC(earliestTimeUTC, timezone);
    let latestTime = TimeUtil.convertFromUTC(latestTimeUTC, timezone);
    const formattedDates = datesUTC.map(date => new Date(date).toISOString().split("T")[0])
                                .map(date => DateUtil.convertFromUTC(`${date}T${earliestTime}`, timezone));
    //const datesSet = new Set(formattedDates);
    const [selectedDateIdx, setSelectedDateIdx] = useState(0);

    const earliestMin = TimeUtil.toMinutes(earliestTime);
    let latestMin = TimeUtil.toMinutes(latestTime);
    let startLaterThanEnd = false;

    
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
            if(!userIntervals.has(date) || !userIntervals.get(date).some(busyInterval => (busyInterval[0] <= intervalStart && intervalEnd <= busyInterval[1])))
                availUsers.push(user);
        }
        return availUsers;
    }

    const busyIntervals = useMemo(() => {//Map<user, Map<date, intervals>>
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
                if(start > end){ 
                    intervals[intervals.length-1][1] = latestMin; 
                    const nextDay = DateUtil.addDaysToDate(date, 1);
                    const nextDayEnd = end;
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
    }, [calendars, timezone]);

    const intervalMap = useMemo(() => {
        if(earliestMin > latestMin){
            latestMin += 24*60;
            latestTime = TimeUtil.minutesToHHMM(latestMin);
            startLaterThanEnd = true;
        }
        DateUtil.convertBusyIntervalsFromUTC(busyIntervals, timezone);
        const map = new Map();
        for (let date of formattedDates) {
            const intervals = [];
            intervals.push(earliestMin);
            for (let [user, userIntervals] of busyIntervals) {
                if (!userIntervals.has(date)) continue;
                for (let interval of userIntervals.get(date)) {
                    for(let i=0; i<2; i++){
                        if(interval[i] < earliestMin)
                            interval[i] += 24*60;
                    }

                    let [start, end] = interval;
                    intervals.push(start);
                    intervals.push(end);
                }
            }
            if(date === '2024-07-26')
                console.log('intervals', intervals);
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
    }, [calendars, timezone]);
    console.log('intervalMap', intervalMap);
    
    const hourlyLabels = useMemo(() => {
        const intervals = [];
        let start = parseInt(earliestTime.slice(0, 2));
        if(parseInt(earliestTime.slice(3, 5)) > 0)
            start++;
        let end = parseInt(latestTime.slice(0, 2));
        if(startLaterThanEnd)
            end -= 24;
        let i = 0;
        for (let hour = start; true ; hour=(hour+1)%24) {
            intervals.push(TimeUtil.toAMPM(TimeUtil.hoursToHHMM(hour)));
            if(hour === end || i == 24)
                break;
            i++;
        }
        return intervals;
    }, [timezone, earliestTime]);

    const handleIntervalClick = (dateIdx, idx) => {
        setSelectedDateIdx(dateIdx);
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

    const populateCalendarsUTC = () => {
        const formattedCalendars = new Map();
                
        calendarData.calendars.forEach(calendar => {
            const userCalendars = calendar.personCalendar.map(cal => {
                const formattedEvents = new Map();
                cal.events.forEach(event => {
                    if(event.start){
                        let dates = [];
                        if(event.start.dateTime){
                            dates.push(event.start.dateTime.split('T')[0]);
                        }else{
                            const curDate = moment(event.start.date), endDate = moment(event.end.date);
                            while(curDate.isSameOrBefore(endDate)){
                                dates.push(curDate.format('YYYY-MM-DD'))
                                curDate.add(1, 'days');
                            }
                        }

                        let startTime = event.start.dateTime ? event.start.dateTime.split('T')[1].substring(0, 5) : earliestTimeUTC;
                        let endTime = event.end.dateTime ? event.end.dateTime.split('T')[1].substring(0, 5) : latestTimeUTC;
        

                        console.log(timezone, dates, startTime, endTime);
                        for(let date of dates){
                            if (!formattedEvents.has(date)) {
                                formattedEvents.set(date, []);
                            }
                            formattedEvents.get(date).push(`${startTime}-${endTime}`);
                        }
                    }
                });

                return formattedEvents;
            });
            formattedCalendars.set(calendar.personName, userCalendars);
        });
        //console.log(calendars, formattedCalendars);
        setCalendars(formattedCalendars);
    }
    const populateCalendars = () => {
        const formattedCalendars = new Map();
                
        calendarData.calendars.forEach(calendar => {
            const userCalendars = calendar.personCalendar.map(cal => {
                const formattedEvents = new Map();
                cal.events.forEach(event => {
                    if(event.start){
                        let dates = [];
                        if(event.start.dateTime){
                            dates.push(event.start.dateTime.split('T')[0]);
                        }else{
                            const curDate = moment(event.start.date), endDate = moment(event.end.date);
                            while(curDate.isSameOrBefore(endDate)){
                                dates.push(curDate.format('YYYY-MM-DD'))
                                curDate.add(1, 'days');
                            }
                        }

                        let startTime = event.start.dateTime ? event.start.dateTime.split('T')[1].substring(0, 5) : earliestTimeUTC;
                        let endTime = event.end.dateTime ? event.end.dateTime.split('T')[1].substring(0, 5) : latestTimeUTC;
        

                        //convert to timezone
                        for(let i=0; i<dates.length; i++)
                            dates[i] = DateUtil.convertFromUTC(`${dates[i]}-${startTime}`, timezone);
                        //console.log('dates', dates);
                        startTime = TimeUtil.convertFromUTC(startTime, timezone);
                        endTime = TimeUtil.convertFromUTC(endTime, timezone);
                        console.log(timezone, dates, startTime, endTime);
                        for(let date of dates){
                            if (!formattedEvents.has(date)) {
                                formattedEvents.set(date, []);
                            }
                            formattedEvents.get(date).push(`${startTime}-${endTime}`);
                        }
                    }
                });

                return formattedEvents;
            });
            formattedCalendars.set(calendar.personName, userCalendars);
        });
        //console.log(calendars, formattedCalendars);
        setCalendars(formattedCalendars);
    }
    return (
        <div className="component-container">
            <div className="all-users-wrapper users-wrapper">
                <div className="users-heading">People</div> 
                {Array.from(calendars.keys()).map(user => (
                    <p key={user} className='user-name'>{user}</p>
                ))}
            </div>
            <div className="grid-wrapper">
                <div className="hourly-labels" style={{marginTop: ((60 - parseInt(earliestTime.substring(3)))%60)*1.405}}>
                    {hourlyLabels.map((time) => (
                        <div key={time} className="hourly-label">{time}</div>
                    ))}
                </div>
                <div className="grid-vertical">
                    <TimezoneSelector timezone={timezone} setTimezone={setTimezone}/>
                    <div className="navigation-arrows">
                        <button onClick={back7Days} disabled={dateStartIdx === 0}>&lt;</button>
                        <div className="event-name">{name}</div>
                        <button onClick={forward7Days} disabled={dateEndIdx == meeting.dates.length - 1}>&gt;</button>
                    </div>
                    <div className="date-labels" style={{ width: `calc((${dateEndIdx} - ${dateStartIdx} + 1) * 5.5vw + 2px)`}}>
                            {formattedDates.slice(dateStartIdx, dateEndIdx+1).map((date, dateIdx) => (
                                <div key={date} className="date-label">
                                    <div>{DateUtil.toMD(date)}</div>
                                    <div>{DateUtil.getDayOfWeek(date)}</div>
                                </div>
                            ))}
                    </div>
                    <div className="grid" style={{ width: `calc((${dateEndIdx} - ${dateStartIdx} + 1) * 5.5vw + 2px)`}}>
                        {formattedDates.slice(dateStartIdx, dateEndIdx + 1).map((date, dateIdx) => (
                            <div key={date} className="grid-col">
                                {intervalMap.get(date).map(([startMin, endMin, availUsers], intervalIdx) => {
                                    const availCnt = availUsers.length;
                                    const opacity = availCnt / calendars.size;
                                    const intervalHeight = endMin - startMin;
                                    const dateRealIdx = dateStartIdx+dateIdx;
                                    const isSelected = dateRealIdx==selectedDateIdx && intervalIdx==selectedIntervalIdx;
                                    return (
                                        <div
                                            key={`${date}-${startMin}-${endMin}`}
                                            className="grid-cell"
                                            onClick={() => handleIntervalClick(dateRealIdx, intervalIdx)}
                                            style={{
                                                height: `${intervalHeight*1.405}px`,  
                                                backgroundColor: isSelected ? `rgba(0, 100, 255, ${opacity+1/(2*calendars.size)})` : `rgba(0, 128, 0, ${opacity})`,
                                                borderBottom: `${intervalIdx === intervalMap.get(date).length - 1 ? '2px' : '1.2px'} solid black`
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
            {selectedDateIdx!==-1 && (
            <div className="availability-wrapper users-wrapper">
                <div className="users-heading">Available</div> 
                <div className="time-interval">
                    {TimeUtil.minutesToAMPM(intervalMap.get(formattedDates[selectedDateIdx])[selectedIntervalIdx][0])} - {TimeUtil.minutesToAMPM(intervalMap.get(formattedDates[selectedDateIdx])[selectedIntervalIdx][1])}, {DateUtil.toMonthNameD(formattedDates[selectedDateIdx])}:
                </div>
                {intervalMap.get(formattedDates[selectedDateIdx])[selectedIntervalIdx][2].map(user => (
                    <p key={user} className='user-name'>{user}</p>
                ))}
            </div>
            )}
        </div>
    );
};

export default Grid;
