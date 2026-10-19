# Decisiones de arquitectura

## TAREA 6 — Endpoint `POST /perfil/cv` (subida de hoja de vida)

### Nombre del campo del formulario

El archivo se recibe en `multipart/form-data`, un solo archivo, en el campo
**`archivo`** (`@UseInterceptors(CvUploadInterceptor)`, constante
`CAMPO_ARCHIVO`). El almacenamiento es en memoria (multer sin `storage`): el
contenido llega en `archivo.buffer` y el tipo en `archivo.mimetype`. El archivo
NO se escribe a disco ni a base de datos; vive solo en memoria y se descarta al
terminar la petición.

### Forma de la respuesta

**`{ borrador: PerfilExtraido }`** (objeto envolvente, 200 OK). El nombre
`borrador` comunica al cliente que es un borrador sin guardar, pendiente de
confirmación vía `POST /perfil/confirmar`, y deja espacio para añadir metadatos
en el futuro sin romper el contrato. El valor es lo que devuelve
`PerfilExtractorService.extraerDeArchivo` tal cual, sin persistir.

Se fuerza **200 OK** con `@HttpCode(200)` en vez del 201 por defecto de un
`POST` en Nest: no se crea ni persiste ningún recurso (es un borrador que la
persona confirmará después), así que 200 es más preciso que 201 Created.

### Códigos HTTP para cada error de dominio

Se elige el código más preciso en cada caso, con mensaje en español simple y sin
filtrar nunca el error crudo de IA/parsing:

- `ArchivoDemasiadoGrandeError` → **413 Payload Too Large**. El cuerpo subido se
  rechaza por tamaño; 413 es el semánticamente exacto.
- `FormatoNoSoportadoError` → **415 Unsupported Media Type**. El tipo de archivo
  no es procesable; 415 describe un media type no soportado.
- `SinTextoLegibleError` → **422 Unprocessable Entity**. El archivo llegó bien
  formado y con un tipo admitido, pero su contenido no se pudo procesar (p. ej.
  PDF escaneado sin texto): sintaxis correcta pero contenido inprocesable.
- Sin archivo en la petición → **400 Bad Request** con mensaje claro en español.
  No es un error de dominio; se valida en el controller antes de llamar al
  servicio.

Se mantienen SIN CAMBIOS las traducciones previas: `PerfilNoEncontradoError` →
404, `ConsentimientoRequeridoError` → 400, `DatosInvalidosError` → 400. Un error
genérico (p. ej. fallo de IA) se re-lanza tal cual para que Nest responda 500 sin
filtrar su contenido.

### Límite de tamaño del interceptor

`limits: { fileSize: 10 * 1024 * 1024 }` (10 MB), coherente con el límite de
dominio de `ArchivoDemasiadoGrandeError`. Es una barrera temprana para no
bufferizar en memoria archivos enormes. `ParsingService` ya valida el tamaño
dentro de `extraerDeArchivo`, de modo que ambas barreras apuntan al mismo
mensaje (ver la sección siguiente, que explica cómo se cumple de verdad).

### Traducción de errores de multer: `CvUploadInterceptor`

El `FileInterceptor` por defecto de `@nestjs/platform-express` corta el archivo
por tamaño ANTES de que el cuerpo del handler se ejecute, por lo que ese fallo
nunca pasa por `aHttp` del controller. Nest lo traduce a 413, pero propaga el
mensaje crudo de multer **en inglés** (`"File too large"`); lo mismo ocurre con
otros fallos de multer (p. ej. varios archivos en el mismo campo →
`"Unexpected file field"`). Eso filtra texto técnico y en otro idioma al cliente,
incumpliendo el requisito de "mensaje claro en español" y dejando inalcanzable la
rama 413 del controller.

Para arreglarlo se usa un interceptor propio **`CvUploadInterceptor`** (en
`src/perfil/cv-upload.interceptor.ts`) que ejecuta `multer` en memoria y traduce
sus errores **por `code`** (identificador estable; los mensajes de multer cambian
entre versiones), sin exponer nunca el mensaje original:

- `LIMIT_FILE_SIZE` → **413** con el mensaje de `ArchivoDemasiadoGrandeError`
  (así el corte por tamaño del interceptor y la validación de `ParsingService`
  comparten código y mensaje: ambas barreras apuntan de verdad al mismo mensaje).
- Cualquier otro `MulterError` (p. ej. `LIMIT_UNEXPECTED_FILE`) → **400** con un
  mensaje español simple ("Adjunta un solo archivo en el campo 'archivo'...").
- Un error que no es de multer se re-lanza tal cual (Nest responde 500 sin
  traducirlo).

El guard detecta los errores de multer por `name === 'MulterError'` y `code`
(string), en vez de importar la clase `MulterError`, porque `@types/multer` no la
expone. La lógica de traducción se extrae a `traducirErrorMulter`, que se prueba
de forma unitaria, y el camino real (multer de verdad) se cubre con una prueba de
integración ligera por `supertest` contra un módulo mínimo sin IA ni base de
datos.

### Dependencia de tipos

`@nestjs/platform-express` y `multer` ya estaban instalados. Se añadió
`@types/multer` como devDependency para tipar `Express.Multer.File` en modo
`strict`. Como `tsconfig.json` restringe `types`, se añadió `"multer"` a ese
array para que la augmentación global `Express.Multer` quede visible al
compilador.
