import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_BOB_URL } from '../config/network';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [bobUrl, setBobUrl] = useState(DEFAULT_BOB_URL);
    const [isConnected, setIsConnected] = useState(true);
    const [devMode, setDevMode] = useState(false);

    useEffect(() => {
        setBobUrl(DEFAULT_BOB_URL);
        setIsConnected(true);
        setDevMode(localStorage.getItem('devMode') === 'true');
    }, []);

    const connectToServer = (url = DEFAULT_BOB_URL, isDev = false) => {
        const trimmed = (url || DEFAULT_BOB_URL).trim().replace(/\/+$/, '');
        setBobUrl(trimmed);
        setIsConnected(true);
        setDevMode(isDev);
        localStorage.setItem('devMode', isDev ? 'true' : 'false');
    };

    const disconnectFromServer = () => {
        setBobUrl(DEFAULT_BOB_URL);
        setIsConnected(true);
        setDevMode(false);
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
