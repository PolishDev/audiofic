import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './db/index.js';
import { AuthModule } from './modules/auth/index.js';
import { UserModule } from './modules/user/index.js';
import { GenresModule } from './modules/genres/index.js';
import { StoriesModule } from './modules/stories/index.js';
import { PlaybackModule } from './modules/playback/index.js';
import { FavoritesModule } from './modules/favorites/index.js';
import { WebhooksModule } from './modules/webhooks/webhooks.module.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    GenresModule,
    StoriesModule,
    PlaybackModule,
    FavoritesModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
