import {useContext} from  'react';
import { AuthContext } from '../contexts/AuthContext';
import CSS from './Logout.module.css';
import authService from '../services/auth';

const Logout = () => {
    const {setAuthStatus} = useContext(AuthContext);
    
    const handleLogout = () => {
        authService.logout();
        setAuthStatus({ 
            authenticated: false, 
            user: null
        });
    }

    return ( 
        <div className={CSS.logout} onClick={handleLogout}>
            Logout
        </div>
    );
}
 
export default Logout;