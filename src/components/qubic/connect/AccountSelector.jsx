import React, { useState } from 'react';
import {
  Box,
  Typography,
  ButtonBase,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import { copyText } from '../../../utils';

const AccountSelector = ({
  label,
  options,
  selected,
  setSelected,
  isLoading = false,
  error,
}) => {
  const theme = useTheme();
  const [copiedValue, setCopiedValue] = useState('');
  const selectedOption = options[selected];

  const formatIdentity = (value = '') => {
    if (value.length <= 20) return value;
    return `${value.slice(0, 10)}...${value.slice(-10)}`;
  };

  const handleCopy = (value, e) => {
    e.stopPropagation();
    copyText(value);
    setCopiedValue(value);
    setTimeout(() => setCopiedValue(''), 1500);
  };

  return (
    <Box width='100%'>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
        <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {label}
        </Typography>
        <Chip
          size='small'
          label={`${options.length} account${options.length === 1 ? '' : 's'}`}
          variant='outlined'
          sx={{ height: 22, '& .MuiChip-label': { px: 0.75 } }}
        />
      </Box>

      <Stack
        spacing={0.75}
        role='listbox'
        aria-label={label}
        sx={{
          maxHeight: { xs: '44vh', sm: 360 },
          overflowY: 'auto',
          pr: 0.25,
        }}
      >
        {isLoading && options.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!isLoading && options.length === 0 && !error && (
          <Typography variant='body2' color='text.secondary'>
            No accounts available.
          </Typography>
        )}

        {options.map((option, index) => {
          const isSelected = selected === index;
          const isCopied = copiedValue === option.value;
          return (
            <ButtonBase
              key={`${option.value}-${index}`}
              onClick={() => setSelected(index)}
              disabled={isLoading}
              sx={{
                width: '100%',
                minHeight: 76,
                borderRadius: 1,
                border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                backgroundColor: isSelected ? theme.palette.action.selected : theme.palette.background.default,
                px: 1.5,
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.25,
                textAlign: 'left',
                transition: theme.transitions.create(['border-color', 'background-color', 'box-shadow']),
                boxShadow: isSelected ? `inset 3px 0 0 ${theme.palette.primary.main}` : 'none',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
              role='option'
              aria-selected={isSelected}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                  color: isSelected ? 'primary.main' : 'text.secondary',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {index + 1}
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                  <Typography variant='body2' sx={{ fontWeight: 700 }} noWrap>
                    {option.label || `Account ${index + 1}`}
                  </Typography>
                  {isSelected && (
                    <Chip
                      size='small'
                      label='Selected'
                      color='primary'
                      variant='outlined'
                      sx={{ height: 20, flexShrink: 0, '& .MuiChip-label': { px: 0.75 } }}
                    />
                  )}
                </Box>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  title={option.value}
                  sx={{
                    display: 'block',
                    fontFamily: 'monospace',
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatIdentity(option.value)}
                </Typography>
              </Box>

              <Stack direction='row' spacing={0.5} alignItems='center' flexShrink={0}>
                <IconButton
                  size='small'
                  onClick={(e) => handleCopy(option.value, e)}
                  aria-label='Copy account address'
                >
                  {isCopied ? <DoneIcon fontSize='small' color='success' /> : <ContentCopyIcon fontSize='small' />}
                </IconButton>
                {isSelected ? (
                  <CheckCircleIcon color='primary' fontSize='small' />
                ) : (
                  <RadioButtonUncheckedIcon color='disabled' fontSize='small' />
                )}
              </Stack>
            </ButtonBase>
          );
        })}
      </Stack>

      {!!selectedOption?.value && (
        <Box
          sx={{
            mt: 1,
            px: 1.25,
            py: 0.75,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', lineHeight: 1.2 }}>
            Selected identity
          </Typography>
          <Typography variant='caption' sx={{ display: 'block', fontFamily: 'monospace', lineHeight: 1.35 }} noWrap>
            {formatIdentity(selectedOption.value)}
          </Typography>
        </Box>
      )}

      {error && (
        <Typography variant='caption' color='error' sx={{ mt: 0.75, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default AccountSelector;
