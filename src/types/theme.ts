export type ThemeId = 'void' | 'golden' | 'neon' | 'parchment' | 'emerald' | 'solar' | 'aurora' | 'cherry' | 'ember' | 'jade' | 'opal';

export interface ThemeColors {
  id: ThemeId;
  name: string;
  subtitle: string;
  isDark: boolean;
  bg: string;
  bgSecondary: string;
  cardBg: string;
  border: string;
  glassBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentGlow: string;
  sandStream: string;
  sandGlow: string;
  sandGrains: string[];
}

export const THEMES: Record<ThemeId, ThemeColors> = {
  void: {
    id: 'void',
    name: 'Obsidian Void',
    subtitle: 'OLED pitch black & radiant golden starlight',
    isDark: true,
    bg: '#050507',
    bgSecondary: '#0d0d12',
    cardBg: 'rgba(18, 18, 24, 0.75)',
    border: 'rgba(255, 255, 255, 0.08)',
    glassBorder: 'rgba(234, 179, 8, 0.25)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#475569',
    accent: '#eab308',
    accentGlow: 'rgba(234, 179, 8, 0.35)',
    sandStream: '#fde047',
    sandGlow: 'rgba(253, 224, 71, 0.4)',
    sandGrains: ['#fde047', '#eab308', '#ca8a04', '#fef08a', '#ffffff']
  },
  golden: {
    id: 'golden',
    name: 'Golden Hour',
    subtitle: 'Warm sunset dusk & amber sand dunes',
    isDark: true,
    bg: '#140c06',
    bgSecondary: '#20130a',
    cardBg: 'rgba(36, 21, 12, 0.8)',
    border: 'rgba(249, 115, 22, 0.15)',
    glassBorder: 'rgba(249, 115, 22, 0.35)',
    textPrimary: '#fff7ed',
    textSecondary: '#fdba74',
    textMuted: '#9a3412',
    accent: '#f97316',
    accentGlow: 'rgba(249, 115, 22, 0.4)',
    sandStream: '#fb923c',
    sandGlow: 'rgba(251, 146, 60, 0.45)',
    sandGrains: ['#fb923c', '#f97316', '#ea580c', '#fed7aa', '#ffedd5']
  },
  neon: {
    id: 'neon',
    name: 'Cyber Neon',
    subtitle: 'Deep galactic indigo & electric cyan plasma',
    isDark: true,
    bg: '#070913',
    bgSecondary: '#0e1224',
    cardBg: 'rgba(16, 22, 44, 0.8)',
    border: 'rgba(6, 182, 212, 0.2)',
    glassBorder: 'rgba(6, 182, 212, 0.4)',
    textPrimary: '#f0fdfa',
    textSecondary: '#67e8f9',
    textMuted: '#0e7490',
    accent: '#06b6d4',
    accentGlow: 'rgba(6, 182, 212, 0.45)',
    sandStream: '#22d3ee',
    sandGlow: 'rgba(34, 211, 238, 0.5)',
    sandGrains: ['#22d3ee', '#06b6d4', '#0891b2', '#a5f3fc', '#ffffff']
  },
  parchment: {
    id: 'parchment',
    name: 'Clean Parchment',
    subtitle: 'Ceramic matte daylight & charcoal ink grains',
    isDark: false,
    bg: '#f8f6f0',
    bgSecondary: '#ede8df',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(0, 0, 0, 0.08)',
    glassBorder: 'rgba(68, 64, 60, 0.25)',
    textPrimary: '#1c1917',
    textSecondary: '#57534e',
    textMuted: '#a8a29e',
    accent: '#44403c',
    accentGlow: 'rgba(68, 64, 60, 0.2)',
    sandStream: '#292524',
    sandGlow: 'rgba(41, 37, 36, 0.2)',
    sandGrains: ['#1c1917', '#292524', '#44403c', '#78716c', '#0c0a09']
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Canopy',
    subtitle: 'Deep forest pine base with luminous pale emerald & mint sand',
    isDark: true,
    bg: '#05120a',
    bgSecondary: '#0a1e12',
    cardBg: 'rgba(10, 30, 18, 0.8)',
    border: 'rgba(16, 185, 129, 0.18)',
    glassBorder: 'rgba(16, 185, 129, 0.35)',
    textPrimary: '#ecfdf5',
    textSecondary: '#6ee7b7',
    textMuted: '#065f46',
    accent: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.4)',
    sandStream: '#34d399',
    sandGlow: 'rgba(52, 211, 153, 0.45)',
    sandGrains: ['#34d399', '#10b981', '#059669', '#a7f3d0', '#6ee7b7']
  },
  solar: {
    id: 'solar',
    name: 'Solar Flare',
    subtitle: 'Midnight navy base with vibrant crimson, terracotta & copper sand',
    isDark: true,
    bg: '#0a0a12',
    bgSecondary: '#141322',
    cardBg: 'rgba(20, 19, 34, 0.8)',
    border: 'rgba(244, 63, 94, 0.2)',
    glassBorder: 'rgba(249, 115, 22, 0.35)',
    textPrimary: '#fff1f2',
    textSecondary: '#fca5a5',
    textMuted: '#991b1b',
    accent: '#f43f5e',
    accentGlow: 'rgba(244, 63, 94, 0.45)',
    sandStream: '#fb7185',
    sandGlow: 'rgba(251, 113, 133, 0.45)',
    sandGrains: ['#f43f5e', '#ea580c', '#e11d48', '#fdba74', '#fb7185']
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora Borealis',
    subtitle: 'Dark arctic indigo base with shifting teal, violet & frost-white sand',
    isDark: true,
    bg: '#060a16',
    bgSecondary: '#0c1328',
    cardBg: 'rgba(12, 19, 40, 0.8)',
    border: 'rgba(147, 51, 234, 0.2)',
    glassBorder: 'rgba(45, 212, 191, 0.35)',
    textPrimary: '#f5f3ff',
    textSecondary: '#c4b5fd',
    textMuted: '#6b21a8',
    accent: '#8b5cf6',
    accentGlow: 'rgba(139, 92, 246, 0.45)',
    sandStream: '#2dd4bf',
    sandGlow: 'rgba(45, 212, 191, 0.5)',
    sandGrains: ['#2dd4bf', '#a855f7', '#38bdf8', '#e0e7ff', '#ffffff']
  },
  cherry: {
    id: 'cherry',
    name: 'Cherry Grove',
    subtitle: 'Misty blossom pink, cool cyan & deep twilight purple',
    isDark: true,
    bg: '#0d0714',
    bgSecondary: '#170c24',
    cardBg: 'rgba(28, 14, 42, 0.85)',
    border: 'rgba(244, 114, 182, 0.22)',
    glassBorder: 'rgba(244, 114, 182, 0.38)',
    textPrimary: '#fdf2f8',
    textSecondary: '#f472b6',
    textMuted: '#831843',
    accent: '#f472b6',
    accentGlow: 'rgba(244, 114, 182, 0.45)',
    sandStream: '#fbcfe8',
    sandGlow: 'rgba(251, 207, 232, 0.45)',
    sandGrains: ['#f472b6', '#22d3ee', '#c084fc', '#fbcfe8', '#ffffff']
  },
  ember: {
    id: 'ember',
    name: 'Ember Ash',
    subtitle: 'Volcanic charcoal base with warm orange-gold & pale yellow sand',
    isDark: true,
    bg: '#0c0a09',
    bgSecondary: '#1c1917',
    cardBg: 'rgba(28, 25, 23, 0.85)',
    border: 'rgba(245, 158, 11, 0.22)',
    glassBorder: 'rgba(245, 158, 11, 0.38)',
    textPrimary: '#fef3c7',
    textSecondary: '#fcd34d',
    textMuted: '#78350f',
    accent: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.45)',
    sandStream: '#fbbf24',
    sandGlow: 'rgba(251, 191, 36, 0.45)',
    sandGrains: ['#f59e0b', '#d97706', '#fef08a', '#fde047', '#ffedd5']
  },
  jade: {
    id: 'jade',
    name: 'Jade Lotus',
    subtitle: 'Dark forest-moss black base with cool jade & tranquil mint sand',
    isDark: true,
    bg: '#040d08',
    bgSecondary: '#09170f',
    cardBg: 'rgba(11, 28, 19, 0.85)',
    border: 'rgba(20, 184, 166, 0.22)',
    glassBorder: 'rgba(20, 184, 166, 0.38)',
    textPrimary: '#f0fdf4',
    textSecondary: '#5eead4',
    textMuted: '#134e4a',
    accent: '#14b8a6',
    accentGlow: 'rgba(20, 184, 166, 0.45)',
    sandStream: '#2dd4bf',
    sandGlow: 'rgba(45, 212, 191, 0.45)',
    sandGrains: ['#14b8a6', '#0d9488', '#2dd4bf', '#99f6e4', '#e6fffa']
  },
  opal: {
    id: 'opal',
    name: 'Opal Rift',
    subtitle: 'Matte dark navy base with pearlescent pink, blue & violet sand',
    isDark: true,
    bg: '#070a14',
    bgSecondary: '#0f1426',
    cardBg: 'rgba(18, 24, 48, 0.85)',
    border: 'rgba(168, 85, 247, 0.22)',
    glassBorder: 'rgba(192, 132, 252, 0.38)',
    textPrimary: '#faf5ff',
    textSecondary: '#d8b4fe',
    textMuted: '#581c87',
    accent: '#c084fc',
    accentGlow: 'rgba(192, 132, 252, 0.45)',
    sandStream: '#e879f9',
    sandGlow: 'rgba(232, 121, 249, 0.45)',
    sandGrains: ['#f472b6', '#60a5fa', '#c084fc', '#e879f9', '#ffffff']
  }
};
