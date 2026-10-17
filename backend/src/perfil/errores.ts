/**
 * Errores de dominio del módulo de perfil. Son errores propios (no excepciones
 * HTTP de Nest) para mantener los servicios desacoplados del transporte y
 * probables sin levantar la aplicación. Cada mensaje está en español y en
 * lenguaje simple, sin tecnicismos, tal como exige R1.
 */

/** El archivo supera el límite de tamaño admitido (10 MB). */
export class ArchivoDemasiadoGrandeError extends Error {
  constructor() {
    super(
      'El archivo es demasiado grande. Puedes subir uno de hasta 10 MB. ' +
        'Prueba a comprimirlo o a enviar solo las páginas de tu hoja de vida.',
    );
    this.name = 'ArchivoDemasiadoGrandeError';
  }
}

/** El tipo de archivo no es uno de los admitidos (PDF, DOCX, TXT, PNG, JPG). */
export class FormatoNoSoportadoError extends Error {
  constructor() {
    super(
      'Ese tipo de archivo no lo podemos leer. Sube tu hoja de vida en PDF, ' +
        'Word (DOCX), texto (TXT) o una foto en PNG o JPG.',
    );
    this.name = 'FormatoNoSoportadoError';
  }
}

/**
 * El archivo se abrió pero no contiene texto que podamos leer (por ejemplo un
 * PDF escaneado como imagen, cifrado o dañado). El mensaje ofrece alternativas
 * amables: creación guiada o nota de voz.
 */
export class SinTextoLegibleError extends Error {
  constructor() {
    super(
      'No pudimos leer el texto de tu archivo. Si es una foto o un documento ' +
        'escaneado, intenta con una imagen más nítida. También puedes crear tu ' +
        'perfil paso a paso con nuestra guía o grabando una nota de voz.',
    );
    this.name = 'SinTextoLegibleError';
  }
}

/**
 * Falta el consentimiento explícito para guardar el perfil. Nada se persiste
 * sin él (R6): la persona debe aceptar antes de que guardemos sus datos.
 */
export class ConsentimientoRequeridoError extends Error {
  constructor() {
    super(
      'Para guardar tu perfil necesitamos tu consentimiento. ' +
        'Acepta que guardemos tus datos y volvemos a intentarlo.',
    );
    this.name = 'ConsentimientoRequeridoError';
  }
}

/**
 * No existe un perfil con el identificador pedido. El id se recibe solo para
 * contexto interno y nunca se expone en el mensaje con tecnicismos.
 */
export class PerfilNoEncontradoError extends Error {
  constructor(_id?: string) {
    super('No encontramos el perfil que buscas.');
    this.name = 'PerfilNoEncontradoError';
  }
}

/**
 * Los datos recibidos no son válidos. El detalle llega en español simple (lo
 * arma la validación de entrada) y no filtra nada interno ni el stack de Zod.
 */
export class DatosInvalidosError extends Error {
  constructor(detalle: string) {
    super(detalle);
    this.name = 'DatosInvalidosError';
  }
}

/**
 * No se pudo completar una operación contra la base de datos por una causa que
 * no sabemos traducir a un mensaje concreto. El error crudo de Prisma/BD no se
 * filtra al cliente (compliance): solo guardamos un mensaje genérico y amable.
 */
export class OperacionFallidaError extends Error {
  constructor() {
    super('No pudimos completar la operación. Inténtalo de nuevo en un momento.');
    this.name = 'OperacionFallidaError';
  }
}

/** Resultado de extraer texto de un archivo. */
export interface ResultadoParsing {
  /** Texto plano extraído del archivo (vacío si no había texto legible). */
  texto: string;
  /** `true` si se obtuvo texto utilizable; `false` si el archivo no tenía texto. */
  textoLegible: boolean;
}
