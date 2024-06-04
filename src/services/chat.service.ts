import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../models/user.entity';
import { Repository } from 'typeorm';
import { CreateChatDto } from '../dto/create-chat.dto';
import { Chat } from '../models/chat.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
  ) {}

  async createChat(data: CreateChatDto) {
    const firstUser = await this.userRepository.findOne({
      where: { id: data.firstUser },
    });
    const secondUser = await this.userRepository.findOne({
      where: { id: data.secondUser },
    });
    const chat = new Chat();
    chat.users = [firstUser, secondUser];

    return await this.chatRepository.save(chat);
  }
}
