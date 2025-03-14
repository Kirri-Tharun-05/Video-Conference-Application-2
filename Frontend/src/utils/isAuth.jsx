import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const isAuth = (WrappedContent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();

        const isAuthenticated = () => {
            if (localStorage.getItem('googleMessage')) {
                return true;
            }
            return false;
        }
        useEffect(()=>{
            if(!isAuthenticated()){
                router('/login')
            }
        },[router]);
        return isAuthenticated()? <WrappedContent{...props}/> : null;
    }
    return AuthComponent;
};

export default isAuth;