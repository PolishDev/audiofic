import { vars } from 'nativewind';

// Raw color values - iOS Minimalist aesthetic with deep burgundy (bordô) highlight
export const colors = {
  light: {
    // Primary / Highlight: Deep Burgundy (Bordô #800020)
    '--primary': '128 0 32',
    '--primary-foreground': '255 255 255',

    // Backgrounds: Clean solid iOS white & grouped card
    '--background': '255 255 255', // iOS pure white
    '--foreground': '0 0 0', // iOS primary label
    '--card': '242 242 247', // iOS grouped table/card background (#F2F2F7)
    '--card-foreground': '0 0 0',

    // Secondary & Muted elements
    '--secondary': '242 242 247',
    '--secondary-foreground': '0 0 0',
    '--muted': '242 242 247',
    '--muted-foreground': '142 142 147', // iOS secondary label (#8E8E93)

    // Borders & Inputs (subtle separators)
    '--border': '229 229 234', // iOS separator line (#E5E5EA)
    '--input': '229 229 234',
    '--ring': '128 0 32',

    // Popover & Accent
    '--popover': '255 255 255',
    '--popover-foreground': '0 0 0',
    '--accent': '242 242 247',
    '--accent-foreground': '128 0 32',

    // System Destructive
    '--destructive': '197 34 31',
  },
  dark: {
    // Primary / Highlight: Bordô with calibrated contrast for dark mode (#A62B32)
    '--primary': '166 43 50',
    '--primary-foreground': '255 255 255',

    // Backgrounds: Clean solid iOS OLED black & dark card
    '--background': '0 0 0', // iOS True Black (#000000)
    '--foreground': '255 255 255', // iOS primary label
    '--card': '28 28 30', // iOS dark grouped background (#1C1C1E)
    '--card-foreground': '255 255 255',

    // Secondary & Muted elements
    '--secondary': '44 44 46', // iOS dark tertiary (#2C2C2E)
    '--secondary-foreground': '255 255 255',
    '--muted': '28 28 30',
    '--muted-foreground': '142 142 147', // iOS secondary label (#8E8E93)

    // Borders & Inputs (subtle dark separators)
    '--border': '56 56 58', // iOS dark separator (#38383A)
    '--input': '44 44 46',
    '--ring': '166 43 50',

    // Popover & Accent
    '--popover': '28 28 30',
    '--popover-foreground': '255 255 255',
    '--accent': '44 44 46',
    '--accent-foreground': '255 255 255',

    // System Destructive
    '--destructive': '255 69 58',
  },
};

// Config for nativewind vars() - used by provider
export const config = {
  light: vars(colors.light),
  dark: vars(colors.dark),
};
