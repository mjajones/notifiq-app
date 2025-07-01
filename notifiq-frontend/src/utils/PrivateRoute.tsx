import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute: React.FC = () => {
    const { user } = useAuth();

    //Affects user logged in or redirect if not
    
    return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;