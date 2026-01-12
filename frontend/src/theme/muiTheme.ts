import { createTheme } from '@mui/material/styles';

// MUI Theme configuration matching design rules:
// - Maximum border radius: 6px
// - Primary color: blue-600 (#2563eb)
// - Uses existing brand colors

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', // blue-600
      light: '#3b82f6', // blue-500
      dark: '#1d4ed8', // blue-700
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#64748b', // slate-500
      light: '#94a3b8', // slate-400
      dark: '#475569', // slate-600
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626', // red-600
      light: '#ef4444', // red-500
      dark: '#b91c1c', // red-700
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b', // amber-500
      light: '#fbbf24', // amber-400
      dark: '#d97706', // amber-600
      contrastText: '#ffffff',
    },
    success: {
      main: '#16a34a', // green-600
      light: '#22c55e', // green-500
      dark: '#15803d', // green-700
      contrastText: '#ffffff',
    },
    info: {
      main: '#0891b2', // cyan-600
      light: '#06b6d4', // cyan-500
      dark: '#0e7490', // cyan-700
      contrastText: '#ffffff',
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },

  shape: {
    borderRadius: 2, // Maximum 6px border radius as per design rules
  },

  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    fontSize: 14,
    button: {
      textTransform: 'none', // Disable uppercase transformation for buttons
      fontWeight: 500,
      borderRadius: 2
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2, // Enforce 6px max border radius
          paddingTop: '8px',
          paddingBottom: '8px',
          paddingLeft: '16px',
          paddingRight: '16px',
          fontSize: '14px',
          fontWeight: 500,
        },
        sizeSmall: {
          paddingTop: '6px',
          paddingBottom: '6px',
          paddingLeft: '12px',
          paddingRight: '12px',
          fontSize: '13px',
        },
        sizeLarge: {
          paddingTop: '10px',
          paddingBottom: '10px',
          paddingLeft: '20px',
          paddingRight: '20px',
          fontSize: '15px',
        },
      },
      defaultProps: {
        disableElevation: false, // Keep shadow for depth
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 2, // Enforce 6px max border radius
            fontSize: '14px',
            '& fieldset': {
              borderColor: '#d1d5db', // gray-300
            },
            '&:hover fieldset': {
              borderColor: '#9ca3af', // gray-400
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2563eb', // blue-600
              borderWidth: '1px',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '14px',
          },
        },
      },
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontSize: '14px',
        },
      },
      defaultProps: {
        size: 'small',
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 2, // Enforce 6px max border radius
          padding: '24px',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 2, // Enforce 6px max border radius
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 2, // Enforce 6px max border radius
        },
        rounded: {
          borderRadius: 2,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2, // Chips use 6px instead of full rounded
          fontSize: '12px',
          fontWeight: 500,
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 2, // Icon buttons use 6px instead of circular
          padding: '8px',
        },
        sizeSmall: {
          padding: '6px',
        },
        sizeLarge: {
          padding: '12px',
        },
      },
    },

    MuiCheckbox: {
      styleOverrides: {
        root: {
          borderRadius: 4, // Slightly smaller for checkboxes
          padding: '8px',
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            opacity: 1,
          },
        },
        track: {
          borderRadius: 12, // Switch track can be more rounded
          opacity: 1,
          backgroundColor: '#d1d5db',
        },
        thumb: {
          borderRadius: '50%', // Thumb remains circular
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontSize: '14px',
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 4,
          fontSize: '12px',
        },
      },
    },
  },
});
