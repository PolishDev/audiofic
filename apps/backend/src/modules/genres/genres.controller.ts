import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { GenresService } from './genres.service.js';

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get()
  async getAll() {
    return this.genresService.findAll();
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const genre = await this.genresService.findBySlug(slug);
    if (!genre) {
      throw new NotFoundException('Gênero não encontrado');
    }
    return genre;
  }
}
