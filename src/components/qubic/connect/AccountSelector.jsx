import React, { useState } from 'react';
import {
  Box,
  Typography,
  ButtonBase,
  IconButton,
  Stack,
  Chip,
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

  const handleCopy = (value, e) => {
    e.stopPropagation();
    copyText(value);
    setCopiedValue(value);
    setTimeout(() => setCopiedValue(''), 1500);
  };

  return (
    <Box width='100%'>
      <Typography variant='body2' sx={{ mb: 1, color: 'text.secondary' }}>
        {label}
      </Typography>

      <Stack spacing={1} role='listbox' aria-label={label}>
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
                borderRadius: 1.5,
                border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                backgroundColor: isSelected ? theme.palette.action.selected : theme.palette.background.paper,
                px: 1.5,
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
              }}
              role='option'
              aria-selected={isSelected}
            >
              <Box sx={{ minWidth: 0, pr: 1 }}>
                <Typography variant='body2' sx={{ fontWeight: 600 }} noWrap>
                  {option.label || `Account ${index + 1}`}
                </Typography>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', wordBreak: 'break-all', lineHeight: 1.3 }}
                >
                  {option.value}
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

      {!!options[selected]?.value && (
        <Box sx={{ mt: 1 }}>
          <Chip size='small' label='Selected account ready' color='primary' variant='outlined' />
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
