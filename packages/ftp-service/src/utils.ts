import fs from 'fs';

export function removeFolder(folder?: string) {
  if (folder && fs.existsSync(folder)) {
    fs.rmSync(folder, { recursive: true });
  }
}

export function hyphenatedFromDate(date: Date) {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
