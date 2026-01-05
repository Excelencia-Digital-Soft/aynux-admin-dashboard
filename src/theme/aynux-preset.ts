import { definePreset } from '@primeuix/themes'
import Lara from '@primeuix/themes/lara'

/**
 * Aynux Brand Theme Preset
 * Based on PrimeVue Lara with custom color palette:
 * - Primary: Violet (#7c3aed)
 * - Secondary: Navy (#0c1d3d)
 * - Accent: Cyan (#06b6d4)
 */
const AynuxPreset = definePreset(Lara, {
  primitive: {
    // Navy Blue palette (brand dark tones)
    navy: {
      50: '#e8eef6',
      100: '#c5d4e8',
      200: '#9fb8d8',
      300: '#789cc8',
      400: '#5a87bc',
      500: '#3d72b0',
      600: '#2d5a8c',
      700: '#1e3a5f',
      800: '#142b4a',
      900: '#0c1d3d',
      950: '#061222'
    },
    // Cyan palette (accent)
    cyan: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344'
    }
  },
  semantic: {
    // Primary color using violet palette
    primary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065'
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.600}',
          inverseColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}'
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}'
        }
      },
      dark: {
        primary: {
          color: '{primary.400}',
          inverseColor: '{surface.900}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}'
        },
        highlight: {
          background: 'rgba(139, 92, 246, 0.16)',
          focusBackground: 'rgba(139, 92, 246, 0.24)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)'
        },
        surface: {
          0: '#0c1d3d',
          50: '#142b4a',
          100: '#1e3a5f',
          200: '#2d5a8c',
          300: '{slate.600}',
          400: '{slate.500}',
          500: '{slate.400}',
          600: '{slate.300}',
          700: '{slate.200}',
          800: '{slate.100}',
          900: '{slate.50}',
          950: '#ffffff'
        }
      }
    }
  }
})

export default AynuxPreset
