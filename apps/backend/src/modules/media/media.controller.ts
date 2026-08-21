import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  mediaQuerySchema,
  updateMediaRequestSchema,
  type MediaQuery,
  type UpdateMediaRequest,
} from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { MediaService } from './media.service';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

/**
 * Минимальная форма файла из multer. Локальный тип вместо Express.Multer.File,
 * чтобы не тянуть @types/multer ради трёх полей.
 */
interface UploadedFileLike {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

/**
 * Управление медиафайлами. Доступно обеим ролям (Редактор загружает
 * контент — п. V ТЗ).
 */
@ApiTags('Медиафайлы')
@ApiBearerAuth()
@Controller('admin/media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  private actor(req: Request, user: AuthUser) {
    return {
      userId: user.id,
      userEmail: user.email,
      ...AuditService.contextFromRequest(req),
    };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Загрузить файл' })
  @ApiConsumes('multipart/form-data')
  // Верхняя граница на входе; точные лимиты по типам — в сервисе.
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 512 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: UploadedFileLike | undefined,
    /** Фото людей (персоны) — без сжатия и без даунскейла, см. MediaService.uploadImageOriginal. */
    @Body('keepOriginal') keepOriginal: string | undefined,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) throw new BadRequestException('Файл не передан');
    return this.media.upload(
      {
        buffer: file.buffer,
        originalName: file.originalname,
        declaredMime: file.mimetype,
      },
      this.actor(req, user),
      { keepOriginal: keepOriginal === 'true' },
    );
  }

  @Get()
  @ApiOperation({ summary: 'Список медиафайлов' })
  list(@Query(zodBody(mediaQuerySchema)) query: MediaQuery) {
    return this.media.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Медиафайл по идентификатору' })
  get(@Param('id') id: string) {
    return this.media.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить метаданные (alt, подпись, источник, дата)' })
  update(
    @Param('id') id: string,
    @Body(zodBody(updateMediaRequestSchema)) dto: UpdateMediaRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.media.update(id, dto, this.actor(req, user));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить файл' })
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    await this.media.remove(id, this.actor(req, user));
    return { ok: true };
  }
}
