import { useTheme } from '@shared/theme';
import { appColors, gameColors, type AppColors, type GameColors } from './tokens';

/** The app's extra tokens (sky, ribbons, the go button, stars) for the mode in use. */
export const useAppColors = (): AppColors => appColors[useTheme().mode];

/** The grid's colors (cells, pills, selection, hint ring) for the mode in use. */
export const useGameColors = (): GameColors => gameColors[useTheme().mode];

/** High contrast draws outlines instead of fills and has no sky, clouds or gradients. */
export const useIsHighContrast = (): boolean => useTheme().mode === 'high-contrast';
