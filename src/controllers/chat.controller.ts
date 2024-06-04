import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { Request, Response } from 'express';
import { CreateChatDto } from '../dto/create-chat.dto';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Post('/createChat')
  async createChat(
    @Res() response: Response,
    @Req() request: Request,
  ): Promise<void> {
    const data: CreateChatDto = request.body;
    const newChat = await this.chatService.createChat(data);
    response.status(201).json(newChat);
  }
}
