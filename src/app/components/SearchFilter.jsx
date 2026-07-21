import React, { useCallback } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

/**
 *  Search and filter component
 */
const SearchFilter = ({
  searchTerm,
  onSearchChange,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleClearSearch = useCallback(() => {
    onSearchChange("");
  }, [onSearchChange]);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      sx={{ width: "100%" }}
    >
      <TextField
        fullWidth
        variant='outlined'
        placeholder={t('markets.search')}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon sx={{ mr: 1, color: "text.secondary", fontSize: 20 }} />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position='end'>
              <Tooltip title={t('markets.clearSearch')}>
                <IconButton
                  size='small'
                  onClick={handleClearSearch}
                  sx={{
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      color: theme.palette.error.main,
                    },
                  }}
                >
                  <ClearIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
          sx: {
            minHeight: 46,
            borderRadius: 1.25,
            bgcolor: theme.palette.surface?.[2] || theme.palette.background.paper,
            fontWeight: 650,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.border?.soft || theme.palette.divider,
              borderWidth: 1,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.border?.default || theme.palette.divider,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.primary.main,
            },
            "& .MuiInputBase-input": {
              py: 1.25,
              fontWeight: 650,
            },
            "& input": {
            fontWeight: 650,
            },
          },
        }}
      />
    </Box>
  );
};

export default SearchFilter;
