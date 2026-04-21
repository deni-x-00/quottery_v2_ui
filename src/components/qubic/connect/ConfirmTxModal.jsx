import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
  Button,
  useTheme,
  Snackbar,
  Alert,
} from "@mui/material";
import PhonelinkIcon from "@mui/icons-material/Phonelink";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

/**
 * @param {object} props
 * @param {object} props.tx
 * @param {object} [props.descriptionData]
 * @param {boolean} props.isEvent
 * @param {string}  props.title
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {function} props.onConfirm
 */
const ConfirmTxModal = ({
  tx,
  descriptionData = {},
  open,
  onClose,
  onConfirm
}) => {
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const theme = useTheme();

  // On confirm
  const handleConfirm = async () => {
    try {
      await onConfirm();
      if (onClose) onClose(); // Close the modal immediately after clicking "Confirm"
    } catch (error) {
      console.error("Error while confirming transaction :", error);
      setTransactionStatus("failure");
      setErrorMessage("The transaction could not be confirmed. Please retry.");
    }
  };

  const handleCloseSnackbar = () => {
    setErrorMessage("");
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth='sm'
        aria-labelledby='confirm-tx-dialog-title'
        BackdropProps={{
          sx: { backdropFilter: "blur(8px)" },
        }}
        PaperProps={{
          sx: {
            p: 1,
            py: 0,
            backgroundColor: theme.palette.background.card,
          },
          elevation: 2,
        }}
      >
        {/* Custom top bar */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "0.4rem",
            backgroundColor: theme.palette.primary.main,
          }}
        />

        {/* Title "qubic connect" */}
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingRight: "48px",
            mt: 1,
          }}
        >
          <Box display='flex' alignItems='center' gap={1}>
            <PhonelinkIcon
              fontSize='small'
              sx={{ color: theme.palette.text.primary }}
            />
            <Typography
              variant='h6'
              color={theme.palette.text.primary}
              sx={{ fontWeight: "bold" }}
            >
              qubic{" "}
              <span style={{ color: theme.palette.primary.main }}>connect</span>
            </Typography>
          </Box>

          <IconButton
            color={theme.palette.primary.main}
            aria-label='close'
            onClick={onClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Modal content */}
        <DialogContent>
          <Box display='flex' flexDirection='column' gap={1}>
            {/* 5) Transaction IDLE */}
            {transactionStatus === null && (
              <>
                {/* CANCEL / CONFIRM */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 4,
                    mt: 1,
                  }}
                >
                  <Button
                    variant='outlined'
                    color='tertiary'
                    startIcon={<CancelIcon />}
                    onClick={onClose}
                  >
                    CANCEL
                  </Button>
                  <Button
                    variant='outlined'
                    color='primary'
                    startIcon={<CheckCircleIcon />}
                    onClick={handleConfirm}
                  >
                    CONFIRM
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar for error messages */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={8000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity='error'
          sx={{
            width: "100%",
            fontSize: "1rem",
            "& .MuiAlert-message": { fontSize: "1rem" },
            "& .MuiAlert-icon": { fontSize: "1.25rem" },
          }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ConfirmTxModal;
