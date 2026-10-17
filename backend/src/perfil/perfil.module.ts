import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service.js';
import { ParsingService } from './parsing.service.js';
import { PerfilController } from './perfil.controller.js';
import { PerfilExtractorService } from './perfil-extractor.service.js';
import { PerfilService } from './perfil.service.js';

/**
 * Módulo de perfil: agrupa los servicios de la fase 1 (parseo, OCR y
 * extracción) y la persistencia de la fase 2 (PerfilService + controller).
 * IaModule y PrismaModule son globales, así que IaService y PrismaService se
 * inyectan sin reimportarlos aquí.
 */
@Module({
  controllers: [PerfilController],
  providers: [ParsingService, OcrService, PerfilExtractorService, PerfilService],
  exports: [ParsingService, OcrService, PerfilExtractorService, PerfilService],
})
export class PerfilModule {}
