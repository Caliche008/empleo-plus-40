/**
 * Lista estática de preguntas para la creación guiada del perfil (R2). Está en
 * español simple y sin tecnicismos. El campo `campo` indica a qué parte del
 * perfil corresponde la respuesta, para que el cliente arme el cuerpo de
 * `POST /perfil/confirmar`.
 */

export interface Pregunta {
  /** Identificador estable de la pregunta. */
  id: string;
  /** Texto que se le muestra a la persona. */
  texto: string;
  /** Campo del perfil al que corresponde la respuesta. */
  campo: string;
}

export const PREGUNTAS_PERFIL: readonly Pregunta[] = [
  { id: 'nombre', texto: '¿Cómo te llamas?', campo: 'nombre' },
  { id: 'telefono', texto: '¿A qué número de teléfono te podemos contactar?', campo: 'telefono' },
  { id: 'rol', texto: '¿Qué trabajo o rol estás buscando?', campo: 'objetivo.rol' },
  { id: 'sector', texto: '¿En qué sector o tipo de empresa te gustaría trabajar?', campo: 'objetivo.sector' },
  {
    id: 'modalidad',
    texto: '¿Cómo prefieres trabajar: presencial, híbrido o remoto?',
    campo: 'objetivo.modalidad',
  },
  { id: 'ubicacion', texto: '¿En qué ciudad o zona buscas trabajo?', campo: 'objetivo.ubicacion' },
  {
    id: 'disponibilidad',
    texto: '¿Cuándo podrías empezar y con qué disponibilidad?',
    campo: 'objetivo.disponibilidad',
  },
  {
    id: 'experiencias',
    texto: 'Cuéntanos tu experiencia: cargos que has tenido y qué hacías en cada uno.',
    campo: 'experiencias',
  },
  { id: 'habilidades', texto: '¿Qué sabes hacer bien? Enumera tus habilidades.', campo: 'habilidades' },
  {
    id: 'certificaciones',
    texto: '¿Tienes cursos o certificaciones que quieras mostrar?',
    campo: 'certificaciones',
  },
  { id: 'idiomas', texto: '¿Qué idiomas hablas y en qué nivel?', campo: 'idiomas' },
] as const;
