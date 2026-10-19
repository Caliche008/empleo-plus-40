import {
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import multer from 'multer';
import { type Observable } from 'rxjs';
import { ArchivoDemasiadoGrandeError } from './errores.js';

/**
 * Nombre del campo de formulario (`multipart/form-data`) que transporta la hoja
 * de vida. Documentado también en el endpoint `POST /perfil/cv`.
 */
export const CAMPO_ARCHIVO = 'archivo';

/**
 * Tamaño máximo admitido para el archivo subido (10 MB), coherente con el
 * límite de dominio de `ArchivoDemasiadoGrandeError` y con `MAX_BYTES` de
 * `ParsingService`. Actúa como barrera temprana para no bufferizar en memoria
 * archivos enormes.
 */
const MAX_BYTES_SUBIDA = 10 * 1024 * 1024;

/**
 * `true` si el error proviene de multer. Se detecta por `name`/`code` en vez de
 * importar la clase `MulterError` (que `@types/multer` no exporta), de modo que
 * el guard no acopla a detalles internos del paquete.
 */
function esErrorDeMulter(error: unknown): error is { code: string } {
  return (
    error instanceof Error &&
    error.name === 'MulterError' &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

/**
 * Traduce un fallo de multer a una excepción HTTP con mensaje en español. El
 * corte por tamaño comparte código (413) y mensaje con
 * `ArchivoDemasiadoGrandeError`, para que la respuesta sea coherente venga la
 * barrera del interceptor o del dominio. Cualquier otro fallo de multer (p. ej.
 * varios archivos en el mismo campo) se normaliza a 400 con un mensaje simple,
 * sin filtrar el texto técnico original. Un error que no sea de multer se
 * devuelve tal cual para que Nest responda 500 sin traducirlo.
 */
export function traducirErrorMulter(error: unknown): unknown {
  if (!esErrorDeMulter(error)) {
    return error;
  }
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new PayloadTooLargeException(
      new ArchivoDemasiadoGrandeError().message,
    );
  }
  return new BadRequestException(
    "Adjunta un solo archivo en el campo 'archivo' con tu hoja de vida.",
  );
}

/**
 * Interceptor que recibe UN archivo en memoria desde el campo `archivo` y lo
 * deja en `request.file` (`archivo.buffer`). Reemplaza a `FileInterceptor` de
 * `@nestjs/platform-express` únicamente para traducir los errores de multer a
 * mensajes en español simple: el `FileInterceptor` por defecto propaga el
 * mensaje crudo de multer en inglés (p. ej. "File too large"), lo que filtra
 * texto técnico y en otro idioma al cliente. Aquí se traduce por `code`, que es
 * el identificador estable del error (los mensajes de multer cambian entre
 * versiones), sin exponer nunca el mensaje original.
 *
 * El archivo vive solo en memoria y se descarta al terminar la petición: no se
 * escribe a disco ni a base de datos.
 */
@Injectable()
export class CvUploadInterceptor implements NestInterceptor {
  private readonly manejador = multer({
    limits: { fileSize: MAX_BYTES_SUBIDA },
  }).single(CAMPO_ARCHIVO);

  async intercept(
    contexto: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const ctx = contexto.switchToHttp();
    const peticion = ctx.getRequest();
    const respuesta = ctx.getResponse();

    await new Promise<void>((resolver, rechazar) => {
      this.manejador(peticion, respuesta, (error: unknown) => {
        if (error) {
          rechazar(traducirErrorMulter(error));
          return;
        }
        resolver();
      });
    });

    return next.handle();
  }
}
