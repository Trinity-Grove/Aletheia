import { cpSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, 'src', 'styles');
const distDir = join(__dirname, 'dist', 'styles');

mkdirSync(distDir, { recursive: true });
cpSync(srcDir, distDir, { recursive: true });
