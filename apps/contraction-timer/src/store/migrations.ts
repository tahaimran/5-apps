import type { Migration } from '@shared/storage';

/** Current on-disk schema version (plan §9 `ct.schemaVersion`). Bump it and add `migrations[N]` (upgrades N-1 → N) together. */
export const SCHEMA_VERSION = 1;

export const migrations: Record<number, Migration> = {};
