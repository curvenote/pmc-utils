declare module 'xmllint' {
  interface ValidationOptions {
    xml: string;
    schema: string | string[];
  }

  interface ValidationResult {
    errors: string[] | null;
  }

  function validateXML(opts: ValidationOptions): ValidationResult;

  export = xmllint;
}
