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

/**
 *  Search and filter component
 */
const SearchFilter = ({
  searchTerm,
  onSearchChange,
}) => {
  const theme = useTheme();

  const handleClearSearch = useCallback(() => {
    onSearchChange("");
  }, [onSearchChange]);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{ width: "100%" }}
    >
      <TextField
        fullWidth
        variant='outlined'
        placeholder='Search events...'
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon sx={{ mr: 1 }} />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position='end'>
              <Tooltip title='Clear search'>
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
            borderRadius: 3,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.divider,
              borderWidth: 2,
            },
          },
        }}
      />
    </Box>
  );
};

export default SearchFilter;
