import React, {useEffect, useState, useMemo, useRef, useContext} from "react";
import calendarService from '../../services/calendar';
import TimeUtil from "../../utils/TimeUtil";
import DateUtil from "../../utils/DateUtil";
import GridTooltip from "./GridTooltip";
import CSS from "./Grid.module.css";
import moment from "moment-timezone";
import useCenterWithOffset from "../../hooks/useCenterWithOffset";
import { AuthContext } from "../../contexts/AuthContext";
const Grid = ({ id, meeting, selectedCalendars, timezone, refreshTrigger}) => {
    const [calendars, setCalendars] = useState(new Map());
    const [users, setUsers] = useState([]);
    const {authStatus, setAuthStatus} = useContext(AuthContext);
    const hourlyLabelsRef = useRef();
    const mainWrapperRef = useRef();
    const selectedCellRef = useRef();
    useCenterWithOffset(hourlyLabelsRef, mainWrapperRef, 'left', 'transform');

    console.log('calendars: ', calendars);
    const [selectedIntervalIdx, setSelectedIntervalIdx] = useState(0);
    let { name, startTime: earliestTimeUTC, endTime: latestTimeUTC, dates: datesUTC } = meeting;
    let earliestTime = TimeUtil.convertFromUTC(earliestTimeUTC, timezone);
    let latestTime = TimeUtil.convertFromUTC(latestTimeUTC, timezone);

    const formattedDatesUTC = datesUTC.map(date => new Date(date).toISOString().split("T")[0]);
    const formattedDates = formattedDatesUTC.map(date => DateUtil.convertFromUTC(`${date}T${earliestTimeUTC}`, timezone));

    const [selectedDateIdx, setSelectedDateIdx] = useState(0);
    
    const earliestMinUTC = TimeUtil.toMinutes(earliestTimeUTC);
    const latestMinUTC = TimeUtil.toMinutes(latestTimeUTC);
    const earliestMin = TimeUtil.toMinutes(earliestTime);
    let latestMin = TimeUtil.toMinutes(latestTime);
    let startLaterThanEnd = false;
    
    const [tooltipInfo, setTooltipInfo] = useState(null);
    const [maxViewDays, setMaxViewDays] = useState(window.innerWidth>1200 ? 7 : 5);
    const [dateStartIdx, setDateStartIdx] = useState(0);
    const [dateEndIdx, setDateEndIdx] = useState(Math.min(maxViewDays-1, formattedDates.length-1));
    useEffect(() => {
        const handleResize = () => {
            if(window.innerWidth>1200){
                setMaxViewDays(7);
                setDateStartIdx(0);
                setDateEndIdx(6);
            }else{
                setMaxViewDays(5);
                setDateStartIdx(0);
                setDateEndIdx(4);
            }
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    console.log(maxViewDays);

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
        if(!authStatus.authenticated)
            return new Map();
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
                for(let i=intervals.length-1; i>=0; i--){
                    const [start, end] = intervals[i];
                    const lowerBound = earliestMinUTC;
                    const upperBound = earliestMinUTC > latestMinUTC ? latestMinUTC+24*60 : latestMinUTC;
                    if(start<lowerBound && end<lowerBound || start>upperBound && end>upperBound){
                        intervals.splice(i, 1);
                        continue;
                    }

                    if(start > end){ 
                        let deleteInterval = false;
                        if(start < latestMinUTC)
                            intervals[i][1] = latestMinUTC; 
                        else
                            deleteInterval = true;
                        const nextDay = DateUtil.addDaysToDate(date, 1);
                        if(end > earliestMinUTC && formattedDates.includes(nextDay)){
                            if(!userIntervals.has(nextDay))
                                userIntervals.set(nextDay, []);
                            const nextDayInterval = [earliestMinUTC, end];
                            userIntervals.get(nextDay).unshift(nextDayInterval);
                        }
                        if(deleteInterval){
                            intervals.splice(i, 1);
                        }
                    }
                }
            }
        }
        return map;
    }, [calendars, authStatus]);
    console.log('busyIntervals', busyIntervals);

    const intervalMap = useMemo(() => {
        const map = new Map();
        for (let date of formattedDatesUTC) {
            const intervals = [];
            intervals.push(earliestMinUTC);
            for (let [user, userIntervals] of busyIntervals) {
                if (!userIntervals.has(date)) continue;
                for (let interval of userIntervals.get(date)) {
                    let [start, end] = interval;

                    start = Math.max(start, earliestMinUTC);
                    end = Math.min(end, latestMinUTC > earliestMinUTC ? latestMinUTC : latestMinUTC+24*60);
                    
                    intervals.push(start);
                    intervals.push(end);
                }
            }
            intervals.sort((a, b) => a - b);
            intervals.push(latestMinUTC);

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
        const res = DateUtil.convertIntervalMapFromUTC(map, timezone, earliestMinUTC);
        return res;
    }, [calendars, timezone, authStatus]);
    console.log('intervalMap', intervalMap);

    //console.log('selected', selectedIntervalIdx, selectedDateIdx);

    const fillTooltipInfo = (dateIdx, intervalIdx, event=null) => {
        const rect = event.target.getBoundingClientRect();
        const date = formattedDates[dateIdx];
        const [timeStart, timeEnd, availUsers] = intervalMap.get(date)[intervalIdx];
        const timeInterval = [timeStart, timeEnd].map(time => TimeUtil.minutesToAMPM(time));
        setTooltipInfo({
            pos: { 
                x: (rect.x + rect.width/2),
                y: event.clientY + window.scrollY,   
            },
            content: {
                timeInterval: timeInterval,
                date: DateUtil.toMonthNameD(date),
                availUsers:availUsers,
                allUsers: users,
            }
        });
    }

    const updateTooltipPosition = () => {
        if(!tooltipInfo)
            return;
        if (selectedCellRef.current) {
            const rect = selectedCellRef.current.getBoundingClientRect();
            setTooltipInfo({
                ...tooltipInfo,
                pos: {
                    ...tooltipInfo.pos,
                    x: (rect.x + rect.width/2),
                }
            });
        }
    }

    useEffect(() => {
        window.addEventListener('resize', updateTooltipPosition);
        return () => {
            window.removeEventListener('resize', updateTooltipPosition);
        };
    }, [tooltipInfo]);

    const handleIntervalClick = (dateIdx, intervalIdx, event) => {
        setSelectedDateIdx(dateIdx);
        setSelectedIntervalIdx(intervalIdx);

        fillTooltipInfo(dateIdx, intervalIdx, event);
    }

    const forwardDays = () => {
        setDateStartIdx(dateStartIdx + maxViewDays);
        setDateEndIdx(Math.min(formattedDates.length - 1, dateEndIdx + maxViewDays));

        setTooltipInfo(null);
    }

    const backDays = () => {
        setDateEndIdx(dateStartIdx-1);
        setDateStartIdx(Math.max(0, dateStartIdx - maxViewDays));

        setTooltipInfo(null);
    }

    useEffect(() => {
        const getUsers = async () => {
            if(!authStatus.authenticated)
                setUsers([]);
            try {
                const data = await calendarService.getPeople(id);
                setUsers(data.people);
            } catch (err){
                console.log(err);
            }
        }
        getUsers();
    }, [id, authStatus])
    console.log('users', users);

    useEffect(() => {
        const getCalendars = async () => {
            try {
                const calendarData = await calendarService.getAvailability(id);
                populateCalendarsUTC(calendarData);
            } catch (err) {
                console.log(err);
            }
        };
    
        getCalendars();
    }, [id, selectedCalendars, refreshTrigger, authStatus]);
    
    const populateCalendarsUTC = (calendarData) => {
        const formattedCalendars = new Map();
                
        calendarData.calendars.forEach(calendar => {
            const userCalendars = calendar.personCalendar.map(cal => {
                const formattedEvents = new Map();
                let over24HoursApart = false;
                cal.events.forEach(event => {
                    if(event.start){
                        let dates = [];
                        if(event.start.dateTime && DateUtil.hoursApart(event.start.dateTime, event.end.dateTime) <= 24){
                            dates.push(event.start.dateTime.split('T')[0]);
                        }else{
                            if(DateUtil.hoursApart(event.start.dateTime, event.end.dateTime) > 24)
                                over24HoursApart = true;
                            const start = event.start.date || event.start.dateTime.split('T')[0];
                            const end = event.end.date || event.end.dateTime.split('T')[0];
                            const curDate = moment(start), endDate = moment(end);
                            if(event.start.date)
                                endDate.add(-1, 'days');
                            while(curDate.isSameOrBefore(endDate)){
                                dates.push(curDate.format('YYYY-MM-DD'))
                                curDate.add(1, 'days');
                            }
                        }

                        let startTime = event.start.dateTime ? event.start.dateTime.split('T')[1].substring(0, 5) : '00:00';
                        let endTime = event.end.dateTime ? event.end.dateTime.split('T')[1].substring(0, 5) : '24:00';

                        //console.log(timezone, dates, startTime, endTime);
                        for(let i=0; i<dates.length; i++){
                            if (!formattedEvents.has(dates[i])) {
                                formattedEvents.set(dates[i], []);
                            }
                            let start, end;
                            if(over24HoursApart){
                                start = over24HoursApart && i==0 ? startTime : '00:00';
                                end = over24HoursApart && i==dates.length-1 ? endTime : '24:00';
                            }else{
                                start = startTime;
                                end = endTime;
                            }
                            formattedEvents.get(dates[i]).push(`${start}-${end}`);
                        }
                    }
                });
                //console.log('formattedEvents', formattedEvents);
                return formattedEvents;
            });
            formattedCalendars.set(calendar.personName, userCalendars);
        });
        //console.log(calendars, formattedCalendars);
        setCalendars(formattedCalendars);
    }
    //console.log(authStatus);
    //console.log(selectedDateIdx, selectedIntervalIdx);
    return (
        <div className={CSS.gridContainer}>
            <div className={`${CSS.allUsersWrapper} ${CSS.usersWrapper}`}>
                <div className={CSS.usersHeading}>People</div> 
                {users.map(user => (
                    <p key={user} className={CSS.userName}>{user}</p>
                ))}
            </div>
            <div className={CSS.gridVertical}>
                <div className={CSS.navigationArrows} style={{width: `calc(var(--cell-width) * ${maxViewDays})`}}>
                    <button onClick={backDays} disabled={dateStartIdx === 0}>&lt;</button>
                    <div className={CSS.eventName}>{name}</div>
                    <button onClick={forwardDays} disabled={dateEndIdx === meeting.dates.length - 1}>&gt;</button>
                </div>
                <div ref={mainWrapperRef} className={CSS.mainWrapper}>
                    <div ref={hourlyLabelsRef} className={CSS.hourlyLabels} style={{marginTop: ((60 - parseInt(earliestTime.substring(3)))%60)*1.405}}>
                            {hourlyLabels.map((time) => (
                                <div key={time} className={CSS.hourlyLabel}>{time}</div>
                            ))}
                    </div>
                    <div className={CSS.gridAndDatesWrapper}>
                        <div className={CSS.dateLabels}>
                                {formattedDates.slice(dateStartIdx, dateEndIdx+1).map((date, dateIdx) => (
                                    <div key={date} className={CSS.dateLabel}>
                                        <div>{DateUtil.toMD(date)}</div>
                                        <div>{DateUtil.getDayOfWeek(date)}</div>
                                    </div>
                                ))}
                        </div>
                        <div className={CSS.grid} style={{width: `calc(var(--cell-width)*${maxViewDays})`}}>
                            {formattedDates.slice(dateStartIdx, dateEndIdx + 1).map((date, dateIdx) => (
                                <div key={date} className={CSS.gridCol}>
                                    {intervalMap.get(date).map(([startMin, endMin, availUsers], intervalIdx) => {
                                        const availCnt = availUsers.length;
                                        const opacity = availCnt / calendars.size;
                                        if(endMin < startMin)
                                            endMin += 24*60;
                                        const intervalHeight = endMin - startMin;
                                        const dateRealIdx = dateStartIdx+dateIdx;
                                        const isSelected = dateRealIdx===selectedDateIdx && intervalIdx===selectedIntervalIdx;
                                        return (
                                            <div
                                                key={`${date}-${startMin}-${endMin}`}
                                                className={`${CSS.gridCell} ${isSelected ? CSS.selected : ''}`}
                                                ref={isSelected ? selectedCellRef : null}
                                                onClick={(e) => handleIntervalClick(dateRealIdx, intervalIdx,e)}
                                                style={{
                                                    height: intervalHeight*1.405,
                                                    backgroundColor: !authStatus.authenticated ?  'gray' : (isSelected ? `rgba(23, 51, 255, 1.0)` : `rgba(0, 128, 0, ${opacity})`),
                                                    borderTop: `${intervalIdx === 0 ? '2px' : '0'} solid black`,
                                                    borderBottom: `${intervalIdx === intervalMap.get(date).length-1 ? '2px' : '1.2px'} solid black`,
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
            </div>
            {selectedDateIdx!==-1 && (
                <div className= {`${CSS.availabilityWrapper} ${CSS.usersWrapper}`}>
                    <div className={CSS.usersHeading}>Available</div> 
                    <div className={CSS.timeInterval}>
                        {TimeUtil.minutesToAMPM(intervalMap.get(formattedDates[selectedDateIdx])[selectedIntervalIdx][0])} - {TimeUtil.minutesToAMPM(intervalMap.get(formattedDates[selectedDateIdx])[selectedIntervalIdx][1])}, {DateUtil.toMonthNameD(formattedDates[selectedDateIdx])}:
                    </div>
                    {intervalMap.get(formattedDates[selectedDateIdx])[selectedIntervalIdx][2].map(user => (
                        <p key={user} className={CSS.userName}>{user}</p>
                    ))}
                </div>

            )}

            {tooltipInfo && (
                <GridTooltip tooltipInfo={tooltipInfo} setTooltipInfo={setTooltipInfo}/>
            )}

        </div>
    );
};

export default Grid;
