// src/contexts/SnackbarContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import CustomSnackbar from "../components/qubic/ui/CustomSnackbar";

const SnackbarContext = createContext(null);

export const SnackbarProvider = ({ children }) => {
  const [snackbars, setSnackbars] = useState([]);

  const showSnackbar = useCallback((message, severity = "info", options = {}) => {
    const id = Date.now() + Math.random();
    setSnackbars((prev) => [
      ...prev,
      {
        id,
        message,
        severity,
        loading: Boolean(options.loading),
        autoHideDuration: options.autoHideDuration,
      },
    ]);
    return id;
  }, []);

  const closeSnackbar = useCallback((id) => {
    setSnackbars((prev) => prev.filter((snack) => snack.id !== id));
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar, closeSnackbar }}>
      {children}

      {/* Render all active snackbars, stacked */}
      {snackbars.map((snack, index) => (
        <CustomSnackbar
          key={snack.id}
          open={true}
          message={snack.message}
          severity={snack.severity}
          loading={snack.loading}
          autoHideDuration={snack.autoHideDuration}
          handleClose={() => closeSnackbar(snack.id)}
          index={index}             // used for vertical offset
        />
      ))}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => useContext(SnackbarContext);
