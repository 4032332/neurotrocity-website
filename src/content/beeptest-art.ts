import fs from 'node:fs';
import path from 'node:path';

/**
 * Whether a /beeptest/ art file has been generated yet. Build time only.
 * The flame and closing skulls come from Task 12; until they exist, their
 * sections leave the image out rather than ship it broken (Rob, 2026-09-24).
 */
export const hasBeeptestArt = (file: string): boolean =>
  fs.existsSync(path.join(process.cwd(), 'public/beeptest/assets/img', file));
