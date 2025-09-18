export const COLOR = {
    deepNavy: '#0A2540', // main deep background
    skyBlue: '#3ABEFF', // main CTA / primary ring
    aquaMint: '#6FE7DD', // secondary highlights
    coral: '#FF6B6B', // alerts / missed
    amber: '#F7B801', // achievements / badges
    white: '#FFFFFF',
    softGray: '#F4F6F8',
    charcoal: '#1C1C1E',
    textDark: '#111111',
    textMuted: '#6B7280',
  };
  
  export const lightTheme = {
    background: "#f0f4f7",
    secondary: "#ffffff",
    text: COLOR.textDark,
    accent: COLOR.skyBlue,
  };
  
  export const darkTheme = {
    background: "#1c1c1e",
    secondary: "#2c2c2e",
    text: COLOR.white,
    accent: COLOR.aquaMint,
  };

  // Theme variations for unlockable themes
  export const unlockableThemes = {
    default: {
      name: 'Ocean Deep',
      background: COLOR.deepNavy,
      secondary: COLOR.softGray,
      text: COLOR.white,
      accent: COLOR.skyBlue,
      unlockRequirement: 'default'
    },
    sunset: {
      name: 'Sunset Glow',
      background: '#FF6B35',
      secondary: '#F7931E',
      text: COLOR.white,
      accent: '#FFE66D',
      unlockRequirement: '7 day streak'
    },
    forest: {
      name: 'Forest Green',
      background: '#2D5016',
      secondary: '#4F772D',
      text: COLOR.white,
      accent: '#90A955',
      unlockRequirement: '30 day streak'
    },
    midnight: {
      name: 'Midnight Blue',
      background: '#03045E',
      secondary: '#023E8A',
      text: COLOR.white,
      accent: '#0077B6',
      unlockRequirement: '1000 XP'
    },
    rose: {
      name: 'Rose Gold',
      background: '#B08D57',
      secondary: '#D4AF37',
      text: COLOR.white,
      accent: '#FFD700',
      unlockRequirement: '50 day streak'
    }
  };
  