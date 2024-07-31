import {useContext} from  'react';
import { AuthContext } from '../contexts/AuthContext';
import CSS from './Logout.module.css';
const Logout = () => {
    const {setAuthStatus} = useContext(AuthContext);
    
    const handleLogout = () => {
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