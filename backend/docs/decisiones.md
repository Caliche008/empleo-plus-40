# Decisiones de arquitectura

## TAREA 6 — Endpoint `POST /perfil/cv` (subida de hoja de vida)

### Nombre del campo del formulario

El archivo se recibe en `multipart/form-data`, un solo archivo, en el campo
**`archivo`** (`@UseInterceptors(FileInterceptor('archivo'))`). El almacenamiento
es en memoria (por defecto de `FileInterceptor` sin `storage`): el contenido llega
en `archivo.buffer` y el tipo en `archivo.mimetype`. El archivo NO se escribe a
disco ni a base de datos; vive solo en memoria y se descarta al terminar la
petición.

### Forma de la respuesta

**`{ borrador: PerfilExtraido }`** (objeto envolvente, 200 OK). El nombre
`borrador` comunica al cliente que es un borrador sin guardar, pendiente de
confirmación vía `POST /perfil/confirmar`, y deja espacio para añadir metadatos
en el futuro sin romper el contrato. El valor es lo que devuelve
`PerfilExtractorService.extraerDeArchivo` tal cual, sin persistir.

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
dentro de `extraerDeArchivo`, de modo que ambas barreras apuntan al mismo mensaje.

### Dependencia de tipos

`@nestjs/platform-express` y `multer` ya estaban instalados. Se añadió
`@types/multer` como devDependency para tipar `Express.Multer.File` en modo
`strict`. Como `tsconfig.json` restringe `types`, se añadió `"multer"` a ese
array para que la augmentación global `Express.Multer` quede visible al
compilador.
