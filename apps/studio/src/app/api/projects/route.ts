import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export interface StudioProject {
  id: string;
  title: string;
  genre: string;
  time: string;
  updatedAt: number;
  prompt?: string;
  bible: unknown;
  scripts: Record<number, unknown>;
  activeStep?: string;
  activeEpisodeIdx?: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

async function readProjects(): Promise<StudioProject[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeProjects(projects: StudioProject[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const projects = await readProjects();
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar projetos' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project } = body;

    if (!project || !project.id || !project.title) {
      return NextResponse.json(
        { error: 'Dados do projeto inválidos' },
        { status: 400 },
      );
    }

    const projects = await readProjects();
    const existingIdx = projects.findIndex((p) => p.id === project.id);

    if (existingIdx >= 0) {
      projects[existingIdx] = {
        ...projects[existingIdx],
        ...project,
        updatedAt: Date.now(),
      };
    } else {
      projects.unshift({
        ...project,
        updatedAt: Date.now(),
      });
    }

    // Keep up to 50 saved projects
    const trimmed = projects.slice(0, 50);
    await writeProjects(trimmed);

    return NextResponse.json({ success: true, project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao salvar projeto' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const projects = await readProjects();
    const filtered = projects.filter((p) => p.id !== id);
    await writeProjects(filtered);

    return NextResponse.json({ success: true, remaining: filtered.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao excluir projeto' },
      { status: 500 },
    );
  }
}
