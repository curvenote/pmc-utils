import fs from 'fs';
import type { Response } from 'express';

export function respondBadRequest(res: Response, msg: string) {
  console.error(`error: ${msg}`);
  return res.status(204).send(`Bad Request: ${msg}`);
}

export function respondUnableToProcess(res: Response, id?: string) {
  return res.status(204).send(`Unable to process submission over FTP${id ? `: ${id}` : ''}`);
}

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
