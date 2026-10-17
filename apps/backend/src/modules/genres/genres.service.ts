import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../db/index.js';
import { genre, type Genre } from '../../db/schemas/genre.table.js';
import { slugify } from '../../common/utils/slugify.js';

export interface CreateGenreDto {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
}

@Injectable()
export class GenresService implements OnModuleInit {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async onModuleInit() {
    await this.seedDefaultGenres();
  }

  async findAll(): Promise<Genre[]> {
    return this.db.query.genre.findMany({
      orderBy: [asc(genre.order), asc(genre.name)],
    });
  }

  async findBySlug(slug: string): Promise<Genre | undefined> {
    return this.db.query.genre.findFirst({
      where: eq(genre.slug, slug),
    });
  }

  async create(dto: CreateGenreDto): Promise<Genre> {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    const [created] = await this.db
      .insert(genre)
      .values({
        name: dto.name,
        slug,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        order: dto.order ?? 0,
      })
      .returning();

    return created;
  }

  private async seedDefaultGenres() {
    try {
      const existing = await this.db.query.genre.findMany({ limit: 1 });
      if (existing.length > 0) {
        return;
      }

      const defaultGenres: CreateGenreDto[] = [
        {
          name: 'Terror Sobrenatural',
          slug: 'terror-sobrenatural',
          description:
            'Assombrações, espíritos inquietos, possessões e entidades do além.',
          icon: 'ghost',
          color: '#800020',
          order: 1,
        },
        {
          name: 'Suspense Psicológico',
          slug: 'suspense-psicologico',
          description:
            'Jogos mentais, segredos perturbadores, paranoia e reviravoltas angustiantes.',
          icon: 'brain',
          color: '#4A0E4E',
          order: 2,
        },
        {
          name: 'Lendas & Folclore',
          slug: 'lendas-folclore',
          description:
            'Mitos urbanos brasileiros, criaturas das matas e o folclore sombrio redescoberto.',
          icon: 'moon',
          color: '#1B3B2B',
          order: 3,
        },
        {
          name: 'Mistério Investigativo',
          slug: 'misterio-investigativo',
          description:
            'Casos insolúveis, crimes hediondos, pistas enigmáticas e detetives no limite.',
          icon: 'search',
          color: '#2C3E50',
          order: 4,
        },
        {
          name: 'Horror Cósmico',
          slug: 'horror-cosmico',
          description:
            'Forças incompreensíveis, o desconhecido ancestral e a fragilidade da sanidade humana.',
          icon: 'eye',
          color: '#0F2027',
          order: 5,
        },
      ];

      for (const item of defaultGenres) {
        await this.db
          .insert(genre)
          .values({
            name: item.name,
            slug: item.slug!,
            description: item.description,
            icon: item.icon,
            color: item.color,
            order: item.order ?? 0,
          })
          .onConflictDoNothing();
      }
    } catch (error) {
      // If table doesn't exist yet before migrations run, gracefully ignore
      console.warn(
        '[GenresService] Skipping seed until tables are created:',
        error instanceof Error ? error.message : error,
      );
    }
  }
}
