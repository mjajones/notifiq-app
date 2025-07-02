import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ITStaffRoute = () => {
    const { user } = useAuth();
    
    // Check if the user is logged in and is an IT staff member
    return user?.is_it_staff ? <Outlet /> : <Navigate to="/tickets" />;
};

export default ITStaffRoute;