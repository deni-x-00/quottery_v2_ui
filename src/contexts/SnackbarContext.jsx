// src/contexts/SnackbarContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import CustomSnackbar from "../components/qubic/ui/CustomSnackbar";

const SnackbarContext = createContext(null);

export const SnackbarProvider = ({ children }) => {
  const [snackbars, setSnackbars] = useState([]);

  const showSnackbar = useCallback((message, severity = "info") => {
    setSnackbars((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        message,
        severity,
      },
    ]);
  }, []);

  const closeSnackbar = useCallback((id) => {
    setSnackbars((prev) => prev.filter((snack) => snack.id !== id));
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}

      {/* Render all active snackbars, stacked */}
      {snackbars.map((snack, index) => (
        <CustomSnackbar
          key={snack.id}
          open={true}
          message={snack.message}
          severity={snack.severity}
          handleClose={() => closeSnackbar(snack.id)}
          index={index}             // used for vertical offset
        />
      ))}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => useContext(SnackbarContext);
