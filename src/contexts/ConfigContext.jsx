import React, { createContext, useContext, useState, useEffect } from 'react';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [bobUrl, setBobUrl] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [devMode, setDevMode] = useState(false);

    useEffect(() => {
        const savedBobUrl = localStorage.getItem('bobUrl');
        if (savedBobUrl) {
            setBobUrl(savedBobUrl);
            setIsConnected(true);
        }
        setDevMode(localStorage.getItem('devMode') === 'true');
    }, []);

    const connectToServer = (url, isDev = false) => {
        const trimmed = url.trim().replace(/\/+$/, '');
        setBobUrl(trimmed);
        setIsConnected(true);
        setDevMode(isDev);
        localStorage.setItem('bobUrl', trimmed);
        localStorage.setItem('devMode', isDev ? 'true' : 'false');
    };

    const disconnectFromServer = () => {
        setBobUrl('');
        setIsConnected(false);
        setDevMode(false);
        localStorage.removeItem('bobUrl');
        localStorage.removeItem('devMode');
    };

    const toggleDevMode = () => {
        setDevMode((prev) => {
            const next = !prev;
            localStorage.setItem('devMode', next ? 'true' : 'false');
            return next;
        });
    };

    return (
        <ConfigContext.Provider
            value={{ bobUrl, isConnected, devMode, connectToServer, disconnectFromServer, toggleDevMode }}
        >
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
