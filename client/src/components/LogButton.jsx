import {useContext} from  'react';
import { AuthContext } from '../contexts/AuthContext';
import CSS from './LogButton.module.css';
import authService from '../services/auth';

const LogButton = () => {
    const {authStatus, setAuthStatus} = useContext(AuthContext);
    

    const handleLogin = async () => {
        try {
            await authService.login();
            const data = await authService.getAuth();
            setAuthStatus({ 
                authenticated: data.authenticated, 
                user: data.user
            });
            console.log(authStatus);
          } catch (error) {
            console.error('Error fetching auth URL:', error);
          }
    }

    const handleLogout = async () => {
        try{
            await authService.logout();
            setAuthStatus({ 
                authenticated: false, 
                user: null
            });
            console.log(authStatus);
        }catch (error){
            console.log("Error logging out:", error)
        }
    }


    return ( 
        authStatus.authenticated
            ? <div className={CSS.logButton} onClick={handleLogout}>Logout</div>
            : <div className={CSS.logButton} onClick={handleLogin}>Login</div>
        )
}
 
export default LogButton;