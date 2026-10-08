import { Alert } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { levelPuzzleId } from '@/domain/puzzles';
import type { Difficulty, PackId } from '@/domain/types';
import { useGame } from '@/store/game';

export const openPuzzle = (puzzleId: string) => router.push({ pathname: '/play/[puzzleId]', params: { puzzleId } });
export const replaceWithPuzzle = (puzzleId: string) => router.replace({ pathname: '/play/[puzzleId]', params: { puzzleId } });

/**
 * Opens a puzzle. If another one is in progress, asks first, because there is only one save slot:
 * "Keep playing" goes back to the puzzle in progress, "Start new" replaces it.
 */
export function startPuzzle(puzzleId: string): void {
  const current = useGame.getState().current;
  if (!current || current.puzzle.id === puzzleId) {
    openPuzzle(puzzleId);
    return;
  }
  Alert.alert(t('resume.title'), t('resume.body'), [
    { text: t('resume.keep'), style: 'cancel', onPress: () => openPuzzle(current.puzzle.id) },
    {
      text: t('resume.startNew'),
      onPress: () => {
        useGame.getState().discard();
        openPuzzle(puzzleId);
      },
    },
  ]);
}

export const startLevel = (packId: PackId, difficulty: Difficulty, level: number) => startPuzzle(levelPuzzleId(packId, difficulty, level));
