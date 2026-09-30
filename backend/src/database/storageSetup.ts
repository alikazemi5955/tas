import fs from 'fs';
import path from 'path';

// Create storage directories if they do not exist
const storageDir = path.resolve(process.cwd(), process.env.STORAGE_PATH || './storage');
const reportsDir = path.join(storageDir, 'reports');
const zipsDir = path.join(storageDir, 'zips');

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}
if (!fs.existsSync(zipsDir)) {
  fs.mkdirSync(zipsDir, { recursive: true });
}

export const STORAGE_PATHS = {
  root: storageDir,
  reports: reportsDir,
  reportsDir: reportsDir,
  zips: zipsDir,
  zipsDir: zipsDir,
  dbFile: path.join(storageDir, 'parkway_data.json')
};
