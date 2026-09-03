export type ThemeId = 'void' | 'golden' | 'neon' | 'parchment';

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
  }
};
