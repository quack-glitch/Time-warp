export type ThemeId = 'parchment' | 'void' | 'neon' | 'solar' | 'cherry' | 'emerald' | 'frost';

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
  parchment: {
    id: 'parchment',
    name: 'Clean Parchment',
    subtitle: 'Warm off-white ceramic background, charcoal frame & deep slate sand',
    isDark: false,
    bg: '#fcfaf6',
    bgSecondary: '#f2eee6',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    border: 'rgba(68, 64, 60, 0.12)',
    glassBorder: 'rgba(68, 64, 60, 0.35)',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    accent: '#334155',
    accentGlow: 'rgba(51, 65, 85, 0.2)',
    sandStream: '#1e293b',
    sandGlow: 'rgba(30, 41, 59, 0.25)',
    sandGrains: ['#1e293b', '#334155', '#475569', '#64748b', '#0f172a']
  },
  void: {
    id: 'void',
    name: 'Obsidian Void',
    subtitle: 'Pitch OLED black background with metallic warm gold sand',
    isDark: true,
    bg: '#000000',
    bgSecondary: '#0a0a0c',
    cardBg: 'rgba(16, 16, 20, 0.85)',
    border: 'rgba(234, 179, 8, 0.15)',
    glassBorder: 'rgba(234, 179, 8, 0.35)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#475569',
    accent: '#eab308',
    accentGlow: 'rgba(234, 179, 8, 0.4)',
    sandStream: '#fde047',
    sandGlow: 'rgba(253, 224, 71, 0.45)',
    sandGrains: ['#fbbf24', '#f59e0b', '#d97706', '#fef08a', '#ffffff']
  },
  neon: {
    id: 'neon',
    name: 'Cyber Neon',
    subtitle: 'Deep synthetic violet base with electric cyan & magenta sand',
    isDark: true,
    bg: '#090514',
    bgSecondary: '#110a24',
    cardBg: 'rgba(18, 12, 38, 0.85)',
    border: 'rgba(6, 182, 212, 0.22)',
    glassBorder: 'rgba(6, 182, 212, 0.4)',
    textPrimary: '#f0fdfa',
    textSecondary: '#67e8f9',
    textMuted: '#0e7490',
    accent: '#06b6d4',
    accentGlow: 'rgba(6, 182, 212, 0.45)',
    sandStream: '#22d3ee',
    sandGlow: 'rgba(34, 211, 238, 0.5)',
    sandGrains: ['#06b6d4', '#d946ef', '#ec4899', '#22d3ee', '#a855f7']
  },
  solar: {
    id: 'solar',
    name: 'Solar Flare',
    subtitle: 'Rich midnight charcoal base with radiant crimson, terracotta & copper sand',
    isDark: true,
    bg: '#0b0a0f',
    bgSecondary: '#15131c',
    cardBg: 'rgba(21, 19, 28, 0.85)',
    border: 'rgba(244, 63, 94, 0.22)',
    glassBorder: 'rgba(249, 115, 22, 0.38)',
    textPrimary: '#fff1f2',
    textSecondary: '#fca5a5',
    textMuted: '#991b1b',
    accent: '#f43f5e',
    accentGlow: 'rgba(244, 63, 94, 0.45)',
    sandStream: '#fb7185',
    sandGlow: 'rgba(251, 113, 133, 0.45)',
    sandGrains: ['#f43f5e', '#ea580c', '#c2410c', '#fdba74', '#fb923c']
  },
  cherry: {
    id: 'cherry',
    name: 'Cherry Grove',
    subtitle: 'Muted twilight lavender base with soft sakura pink & pale teal mist sand',
    isDark: true,
    bg: '#0e0a16',
    bgSecondary: '#181224',
    cardBg: 'rgba(24, 18, 36, 0.85)',
    border: 'rgba(244, 114, 182, 0.22)',
    glassBorder: 'rgba(244, 114, 182, 0.38)',
    textPrimary: '#fdf2f8',
    textSecondary: '#f472b6',
    textMuted: '#831843',
    accent: '#f472b6',
    accentGlow: 'rgba(244, 114, 182, 0.45)',
    sandStream: '#fbcfe8',
    sandGlow: 'rgba(251, 207, 232, 0.45)',
    sandGrains: ['#f472b6', '#fbcfe8', '#5eead4', '#99f6e4', '#ffffff']
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Canopy',
    subtitle: 'Ink-black pine base with phosphorescent mint & pale jade sand',
    isDark: true,
    bg: '#030c07',
    bgSecondary: '#07180e',
    cardBg: 'rgba(7, 24, 14, 0.85)',
    border: 'rgba(16, 185, 129, 0.2)',
    glassBorder: 'rgba(16, 185, 129, 0.38)',
    textPrimary: '#ecfdf5',
    textSecondary: '#6ee7b7',
    textMuted: '#065f46',
    accent: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.45)',
    sandStream: '#34d399',
    sandGlow: 'rgba(52, 211, 153, 0.45)',
    sandGrains: ['#34d399', '#6ee7b7', '#a7f3d0', '#10b981', '#059669']
  },
  frost: {
    id: 'frost',
    name: 'Glacial Frost',
    subtitle: 'Deep arctic navy base with stark icy-white & faint glacial blue sand',
    isDark: true,
    bg: '#040812',
    bgSecondary: '#081020',
    cardBg: 'rgba(8, 16, 32, 0.85)',
    border: 'rgba(186, 230, 253, 0.22)',
    glassBorder: 'rgba(186, 230, 253, 0.38)',
    textPrimary: '#f0f9ff',
    textSecondary: '#bae6fd',
    textMuted: '#0369a1',
    accent: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.45)',
    sandStream: '#e0f2fe',
    sandGlow: 'rgba(224, 242, 254, 0.5)',
    sandGrains: ['#ffffff', '#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc']
  }
};
