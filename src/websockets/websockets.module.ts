import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from 'src/models/chat.entity';
import { Message } from 'src/models/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, Message])], // Импортируем TypeOrmModule с Chat репозиторием
  providers: [ChatGateway],
})
export class WebsocketsModule {}
