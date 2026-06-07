// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import StartPage from './pages/StartPage';
import AboutPage from './pages/AboutPage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import EventPublishPage from './pages/EventPublishPage';
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import GovernancePage from "./pages/GovernancePage";
import MiscPage from "./pages/MiscPage";
import Footer from './components/layout/Footer';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { QuotteryProvider } from './contexts/QuotteryContext';
import UserEvents from './components/UserEvents';
import { SnackbarProvider } from './contexts/SnackbarContext';
import './App.css';
import { Box } from '@mui/material';
import { QubicConnectProvider } from './components/qubic/connect/QubicConnectContext';
import { WalletConnectProvider } from './components/qubic/connect/WalletConnectContext';

function App() {
  return (
      <ThemeContextProvider>
        <ConfigProvider>
          <WalletConnectProvider>
            <QubicConnectProvider>
              <QuotteryProvider>
                <SnackbarProvider>
                  <BrowserRouter>
                    <Header />
                    <Box component='main'>
                      <Routes>
                        <Route path='/' element={<StartPage />} />
                        <Route path='/about' element={<AboutPage />} />
                        <Route path='/events' element={<EventsPage />} />
                        <Route path='/event/:id' element={<EventDetailsPage />} />
                        <Route path='/publish/:id' element={<EventPublishPage />} />
                        <Route path='/user-events' element={<UserEvents />} />
                        <Route path="/portfolio" element={<ProfilePage />} />
                        <Route path="/portfolio/:identity" element={<ProfilePage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/profile/:identity" element={<ProfilePage />} />
                        <Route path="/leaderboard" element={<LeaderboardPage />} />
                        <Route path="/orders" element={<Navigate to="/portfolio" replace />} />
                        <Route path="/governance" element={<GovernancePage />} />
                        <Route path="/utilities" element={<MiscPage />} />
                        <Route path="/misc" element={<Navigate to="/utilities" replace />} />
                      </Routes>
                    </Box>
                    <Footer />
                  </BrowserRouter>
                </SnackbarProvider>
              </QuotteryProvider>
            </QubicConnectProvider>
          </WalletConnectProvider>
        </ConfigProvider>
      </ThemeContextProvider>
  );
}

export default App;
