// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import Header from './components/layout/Header';
import StartPage from './pages/StartPage';
import AboutPage from './pages/AboutPage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import GovernancePage from "./pages/GovernancePage";
import UtilitiesPage from "./pages/UtilitiesPage";
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

function PublishRedirect() {
  const { id } = useParams();
  return <Navigate to={`/market/${id}`} replace />;
}

function MarketsRedirect() {
  const location = useLocation();
  return <Navigate to={`/markets${location.search || ""}`} replace />;
}

function EventRedirect() {
  const { id } = useParams();
  return <Navigate to={`/market/${id}`} replace />;
}

function ProfileRedirect() {
  const { identity } = useParams();
  return <Navigate to={identity ? `/portfolio/${identity}` : "/portfolio"} replace />;
}

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
                        <Route path='/markets' element={<EventsPage />} />
                        <Route path='/events' element={<MarketsRedirect />} />
                        <Route path='/market/:id' element={<EventDetailsPage />} />
                        <Route path='/event/:id' element={<EventRedirect />} />
                        <Route path='/publish/:id' element={<PublishRedirect />} />
                        <Route path='/user-events' element={<UserEvents />} />
                        <Route path="/portfolio" element={<ProfilePage />} />
                        <Route path="/portfolio/:identity" element={<ProfilePage />} />
                        <Route path="/profile" element={<ProfileRedirect />} />
                        <Route path="/profile/:identity" element={<ProfileRedirect />} />
                        <Route path="/leaderboard" element={<LeaderboardPage />} />
                        <Route path="/orders" element={<Navigate to="/portfolio" replace />} />
                        <Route path="/governance" element={<GovernancePage />} />
                        <Route path="/utilities" element={<UtilitiesPage />} />
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
