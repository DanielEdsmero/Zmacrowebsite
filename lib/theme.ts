// Single source of truth for the active visual theme.
// Currently the only implemented theme is "cyber-terminal".
export const THEME = "cyber-terminal" as const;

export type ThemeName = typeof THEME;
