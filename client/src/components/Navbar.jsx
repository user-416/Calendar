import { useState, useContext } from 'react';
import CSS from './Navbar.module.css';
import { AuthContext } from '../contexts/AuthContext';
import LogButton from './LogButton';
const Navbar = () => {
    const {authStatus} = useContext(AuthContext);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSideBar = () => {
        setIsSidebarOpen(prev => !prev);
        console.log('clicked');
    }


    return (
        <div className={CSS.navbarContainer}>
            <a href="/" className={CSS.navbarTitle}>CalConnect</a>
                <div>
                    <div className={CSS.menuButton} onClick={toggleSideBar}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#5f6368">
                            <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
                        </svg>
                    </div>

                    <div className={CSS.links}>
                        <LogButton />
                    </div>

                    {isSidebarOpen && (
                        <div className={CSS.sidebar}>
                            <div className={CSS.sidebarLinks}>
                                <LogButton />
                            </div>                    
                        </div>
                    )}
                </div>
        </div>
    );
}
 
export default Navbar;
