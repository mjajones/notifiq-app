import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

import { User, AuthTokens } from '../types';

export interface AuthContextType {
    user: User | null;
    authTokens: AuthTokens | null;
    loginUser: (username: string, password: string) => Promise<boolean>;
    logoutUser: () => void;
    loading?: boolean;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [authTokens, setAuthTokens] = useState<AuthTokens | null>(() => {
        const tokens = localStorage.getItem('authTokens');
        return tokens ? JSON.parse(tokens) : null;
    });
    const [user, setUser] = useState<User | null>(() => {
        const tokens = localStorage.getItem('authTokens');
        if (tokens) {
            const parsed = JSON.parse(tokens);
            return jwtDecode<User>(parsed.access);
        }
        return null;
    });
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const loginUser = async (username: string, password: string): Promise<boolean> => {
        const response = await fetch(`${API_URL}/api/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if(response.status === 200){
            setAuthTokens(data);
            setUser(jwtDecode<User>(data.access));
            localStorage.setItem('authTokens', JSON.stringify(data));
            navigate('/dashboard');
            return true;
        } else {
            return false;
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        navigate('/login');
    };

    const updateToken = async () => {
        if (!authTokens?.refresh) {
            logoutUser();
            return;
        }

        const response = await fetch(`${API_URL}/api/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'refresh': authTokens.refresh })
        });

        const data = await response.json();
        
        if (response.status === 200) {
            setAuthTokens(data);
            setUser(jwtDecode<User>(data.access));
            localStorage.setItem('authTokens', JSON.stringify(data));
        } else {
            logoutUser();
        }

        if (loading) {
            setLoading(false);
        }
    };

    const contextData: AuthContextType = {
        user,
        authTokens,
        loginUser,
        logoutUser,
        loading,
    };

    useEffect(() => {
        if (loading) {
            if (authTokens) {
                updateToken();
            } else {
                setLoading(false);
            }
        }
        
        const fourMinutes = 1000 * 60 * 4;
        const interval = setInterval(() => {
            if (authTokens) {
                updateToken();
            }
        }, fourMinutes);


        return () => clearInterval(interval);

    }, [authTokens, loading]);

    return(
        <AuthContext.Provider value={contextData} >
            {loading ? null : children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;