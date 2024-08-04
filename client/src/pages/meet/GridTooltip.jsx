import { useRef, useState, useEffect } from 'react';
import CSS from './GridTooltip.module.css'
const GridTooltip = ({tooltipInfo, setTooltipInfo}) => {
    const {pos, content} = tooltipInfo;
    let {timeInterval, date, availUsers, allUsers} = content;
    let unavailUsers = allUsers.filter(user => !availUsers.includes(user));


    const shorten = (userEmail) => {
        return userEmail.split('@')[0];
    }
    const containerRef = useRef(null);

    const [containerStyle, setContainerStyle] = useState({visibility: 'hidden'}); //prevent first one from being in wrong location

    useEffect(() => {
        if (containerRef.current) {
            const { height } = containerRef.current.getBoundingClientRect();
            setContainerStyle({
                left: `calc(${pos.x}px - 24px)`, //triangle length = 12px, triangle is 12px from left
                top: `calc(${pos.y - height - 12}px)`,
                visibility: 'visible',
            });
        }
    }, [pos]); 


    return ( 
        <div className={CSS.toolTipContainer} ref={containerRef} style={containerStyle}>
            <div className={CSS.content}>
                <svg className={CSS.closeButton} onClick={()=>setTooltipInfo(null)} xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50">
                    <path d="M 9.15625 6.3125 L 6.3125 9.15625 L 22.15625 25 L 6.21875 40.96875 L 9.03125 43.78125 L 25 27.84375 L 40.9375 43.78125 L 43.78125 40.9375 L 27.84375 25 L 43.6875 9.15625 L 40.84375 6.3125 L 25 22.15625 Z"></path>
                </svg>

                <div className={CSS.timeInfo}>{timeInterval[0]} - {timeInterval[1]}, {date}:</div>

                <div className={CSS.usersContainer}>
                    <span>Available ({availUsers.length}/{allUsers.length})</span>
                    <div className={CSS.availableContainer}>
                        <ul>
                            {availUsers.map(user => (
                                <li key={user}>{user}</li>
                            ))}
                        </ul>
                    </div>
                    {/*{<span>unAvailable {unavailUsers.length}/{allUsers.length}:</span>
                    <div className={CSS.unavailableContainer}>
                        <ul>
                            {unavailUsers.map(user => (
                                <li key={user}>{user}</li>
                            ))}
                        </ul>
                    </div>*/}
                </div>

            </div>
        </div>
    );
}
 
export default GridTooltip;