export const DASHBOARD_THEME_STORAGE_KEY = 'hercules.dashboard.theme';

export const DASHBOARD_THEMES = [
  { value: 'hercules', label: 'Hercules Classic (Default)' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'nord', label: 'Nord' },
  { value: 'solarized', label: 'Solarized Dark' },
  { value: 'catppuccin', label: 'Catppuccin Mocha' },
];

export const DEFAULT_DASHBOARD_THEME = 'hercules';

export function isValidDashboardTheme(theme) {
  return DASHBOARD_THEMES.some((item) => item.value === theme);
}
