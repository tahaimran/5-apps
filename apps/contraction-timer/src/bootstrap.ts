import { setCurrentApp } from '@shared/crosspromo';
import { registerStrings } from '@shared/i18n';
import en from '@/i18n/en.json';
import '@/store/storage';

// Runs first in index.ts so anything without a mounted UI (a notification handler) can use t().
registerStrings({ en });
setCurrentApp('contraction-timer');
