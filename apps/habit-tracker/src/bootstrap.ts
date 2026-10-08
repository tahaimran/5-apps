import { setCurrentApp } from '@shared/crosspromo';
import { registerStrings } from '@shared/i18n';
import en from '@/i18n/en.json';
import '@/store/storage';

// Runs first in index.ts so headless widget and notification tasks (no UI mounted) can use t().
registerStrings({ en });
setCurrentApp('habit-tracker');
