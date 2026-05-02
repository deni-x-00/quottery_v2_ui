// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import StartPage from './pages/StartPage';
import EventDetailsPage from './pages/EventDetailsPage';
import EventPublishPage from './pages/EventPublishPage';
import UserOrdersPage from "./pages/UserOrdersPage";
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
                        <Route path='/event/:id' element={<EventDetailsPage />} />
                        <Route path='/publish/:id' element={<EventPublishPage />} />
                        <Route path='/user-events' element={<UserEvents />} />
                        <Route path="/orders" element={<UserOrdersPage />} />
                        <Route path="/governance" element={<GovernancePage />} />
                        <Route path="/misc" element={<MiscPage />} />
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
