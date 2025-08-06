import fs from 'fs';
import type { Response } from 'express';

export function respondBadRequest(res: Response, msg: string) {
  console.error(`error: ${msg}`);
  return res.status(400).send(msg);
}

export function respondUnableToProcess(res: Response, id?: string, err?: any) {
  console.error('Unable to process submission over FTP', err);
  const message =
    err?.statusText || err?.message || String(err) || 'Unable to process submission over FTP';
  return res.status(422).send(message);
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
