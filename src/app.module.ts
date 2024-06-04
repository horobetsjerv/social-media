import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './models/user.entity';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { Code } from './models/code.entity';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketsModule } from './websockets/websockets.module';
import { ChatService } from './services/chat.service';
import { ChatController } from './controllers/chat.controller';
import { Chat } from './models/chat.entity';
import { Message } from './models/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        synchronize: true,
        entities: [User, Code, Chat, Message],
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Code, Chat,Message]),
    JwtModule.register({
      secret: 'your_secret_key', // Замените на ваш секретный ключ
      signOptions: { expiresIn: '1h' }, // Опционально, установите время действия токена
    }),
    WebsocketsModule,
  ],
  controllers: [AppController, UserController, ChatController],
  providers: [AppService, UserService, ChatService],
})
export class AppModule {}
