import React from 'react';
import { Navigate } from 'react-router-dom';

// UserEvents is kept as a compatibility redirect for old links.
const UserEvents = () => {
  return <Navigate to="/profile" replace />;
};

export default UserEvents;
