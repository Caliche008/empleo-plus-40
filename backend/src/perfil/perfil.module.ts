import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service.js';
import { ParsingService } from './parsing.service.js';
import { PerfilExtractorService } from './perfil-extractor.service.js';

/**
 * Módulo de perfil: agrupa los servicios de la fase 1 (parseo, OCR y
 * extracción). No declara controllers todavía (la subida HTTP del CV es una
 * fase posterior, Decisión D5). IaModule es global, así que IaService se inyecta
 * sin reimportarlo aquí.
 */
@Module({
  providers: [ParsingService, OcrService, PerfilExtractorService],
  exports: [ParsingService, OcrService, PerfilExtractorService],
})
export class PerfilModule {}
