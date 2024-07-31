import { useState } from 'react';
import CSS from './Navbar.module.css';
const Navbar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSideBar = () => {
        setIsSidebarOpen(prev => !prev);
        console.log('clicked');
    }
    console.log(isSidebarOpen);
    return (
        <div className={CSS.navbarContainer}>
            <a href="/" className={CSS.navbarTitle}>CalConnect</a>
            <div className={CSS.menuButton} onClick={toggleSideBar}>
                <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#5f6368">
                    <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
                </svg>
            </div>

            <div className={CSS.links}>
                <div className={CSS.logout}>
                    Logout
                </div>
            </div>

            {isSidebarOpen && (
                <div className={CSS.sidebar}>
                    <div className={CSS.sidebarLinks}>
                        <div className={CSS.logout}>
                            Logout
                        </div>
                    </div>                    
                </div>
            )}
        </div>
    );
}
 
export default Navbar;
