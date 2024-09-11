import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process'; // TODO sync will block node process, use async

export async function validateXml(xml: string) {
  const dtdPath = path.resolve(__dirname, 'dtd/manuscript-bulk.dtd');
  try {
    await fs.access(dtdPath);
  } catch (error) {
    throw new Error(`DTD file not found: ${dtdPath}`);
  }

  try {
    execSync('xmllint --version', { stdio: 'ignore' });
  } catch (error) {
    throw new Error('xmllint is not available on the system. Please install xmllint.');
  }

  // Validate the XML string using xmllint
  try {
    // Run xmllint with the provided DTD file and XML string
    const command = `xmllint --noout --nowarning --nonet --dtdvalid ${dtdPath} -`;
    execSync(command, { input: xml });
  } catch (error: any) {
    // If xmllint returns an error, throw with the error message
    throw new Error('XML is not valid:\n' + error.message);
  }

  return true;
}
