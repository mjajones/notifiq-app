import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ITStaffRoute: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" />;
    }

    // Check if the user is in the IT Staff group OR is a superuser
    const isAuthorized = user.groups?.includes('IT Staff') || user.is_superuser;

    return isAuthorized ? <Outlet /> : <Navigate to="/tickets" />;
};

export default ITStaffRoute;