import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { STORAGE_PATHS } from '../database/storageSetup';

export async function createDailyZip(dateStr: string, filesToInclude?: string[]): Promise<{ filename: string; fullPath: string }> {
  const zip = new JSZip();
  const safeDate = dateStr.replace(/[/\\?%*:|"<>#~ ]/g, '-');
  const zipFilename = `reports_${safeDate}.zip`;
  const zipFilePath = path.join(STORAGE_PATHS.zips, zipFilename);

  let targetFiles: string[] = [];

  if (filesToInclude && filesToInclude.length > 0) {
    targetFiles = filesToInclude;
  } else {
    // Include all files generated in storage/reports
    if (fs.existsSync(STORAGE_PATHS.reports)) {
      targetFiles = fs.readdirSync(STORAGE_PATHS.reports);
    }
  }

  let addedFilesCount = 0;
  for (const f of targetFiles) {
    const filePath = path.join(STORAGE_PATHS.reports, f);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const fileData = fs.readFileSync(filePath);
      zip.file(f, fileData);
      addedFilesCount++;
    }
  }

  // Also include a summary manifest JSON in the zip
  const manifest = {
    archiveDate: dateStr,
    createdAt: new Date().toISOString(),
    filesCount: addedFilesCount,
    files: targetFiles
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(zipFilePath, content);

  return {
    filename: zipFilename,
    fullPath: zipFilePath
  };
}
