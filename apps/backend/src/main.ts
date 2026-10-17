import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { NestFactory } from '@nestjs/core';
import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Required for Better Auth to parse raw incoming request streams
  });

  // Enable CORS for mobile app and web clients
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Apply json and urlencoded parsers only for non-auth endpoints
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/auth')) {
      return next();
    }
    express.json()(req, res, next);
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/auth')) {
      return next();
    }
    express.urlencoded({ extended: true })(req, res, next);
  });

  // Serve audio files statically for streaming playback
  const audioDir = fs.existsSync('/mnt/stuff/shortstory-audio')
    ? '/mnt/stuff/shortstory-audio'
    : path.resolve(process.cwd(), '../studio/public/audio');

  if (fs.existsSync(audioDir)) {
    app.use('/audio', express.static(audioDir));
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`[ShortStory Backend] Server running on:`);
  console.log(`  - Local:   http://localhost:${port}`);
  console.log(`  - Network: http://192.168.0.13:${port}`);
}

await bootstrap();
