/**
 * Declaración del submódulo interno de pdf-parse. Importamos
 * `pdf-parse/lib/pdf-parse.js` directamente para evitar el bloque de depuración
 * de su `index.js`, que intenta leer un PDF de prueba del disco cuando se carga
 * como módulo principal. Reutiliza la firma de `@types/pdf-parse`.
 */
declare module 'pdf-parse/lib/pdf-parse.js' {
  import PdfParse = require('pdf-parse');
  export = PdfParse;
}
