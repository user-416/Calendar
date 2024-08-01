import { createContext, useState } from "react";

export const AuthContext = createContext();

const AuthContextProvider = ({children}) => {
    const [authStatus, setAuthStatus] = useState({
        authenticated: false,
        user: null
    });
    return ( 
        <AuthContext.Provider value={{authStatus, setAuthStatus}}>
            {children}
        </AuthContext.Provider>
     );
}
 
export default AuthContextProvider;