import React from 'react';
import { Navigate } from 'react-router-dom';

// UserEvents now redirects to the unified Orders & Positions page
const UserEvents = () => {
  return <Navigate to="/orders" replace />;
};

export default UserEvents;
