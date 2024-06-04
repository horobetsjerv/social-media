import { InjectRepository } from '@nestjs/typeorm';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { Chat } from '../models/chat.entity';
import * as jwt from 'jsonwebtoken';
import { Message } from 'src/models/message.entity';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  @WebSocketServer() server: Server;

  private activeUsers = new Map<number, Socket[]>();

  async handleConnection(client: Socket) {
    // Допустим, что chatId передается в query при подключении
    const chatId = Number(client.handshake.query.chatId);
    const token = client.handshake.headers['auth'] as string;
    if (!token) {
      console.log('invaildToken');
      client.emit('error', 'Authentication token is missing');
      client.disconnect();
      return;
    }
    if (!chatId) {
      console.log('invaildChatId');
      client.emit('error', 'Chat ID is missing');
      client.disconnect();
      return;
    }

    let chat: Chat;
    try {
      const decoded = jwt.verify(token, 'your_secret_key') as jwt.JwtPayload; // Замените 'your_secret_key' на ваш секретный ключ
      chat = await this.chatRepository.findOne({
        where: { id: chatId },
        relations: ['users', 'messages'], // Загружаем связанные сущности
      });
      const userInChat = chat.users.some((user) => user.id === decoded.user.id);

      if (!userInChat) {
        client.emit('error', 'User is not part of the chat');
        console.log('notUsersInChat');
        client.disconnect();
        return;
      }
      console.log(this.activeUsers);
    } catch (error) {
      client.emit('error', 'Error occurred while checking the chat');
      console.log(error);

      client.disconnect();
      return;
    }

    if (!chat) {
      client.emit('error', 'Chat not found');
      client.disconnect();
      return;
    }

    // Если чат найден, добавляем клиента в комнату
    client.join(`chat_${chatId}`);
    if (!this.activeUsers.has(chatId)) {
      this.activeUsers.set(chatId, []);
    }
    this.activeUsers.get(chatId).push(client);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);

    // Удаление пользователя из активных
    const chatId = Number(client.handshake.query.chatId);
    if (chatId && this.activeUsers.has(chatId)) {
      const clients = this.activeUsers.get(chatId);
      this.activeUsers.set(
        chatId,
        clients.filter((c) => c.id !== client.id),
      );
    }
  }
  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, message: { content: string }) {
    const content = message?.content;
    const tokenHeader = client.handshake.headers['auth'];

    let token: string;
    if (Array.isArray(tokenHeader)) {
      token = tokenHeader[0]; // Если это массив, берем первый элемент
    } else {
      token = tokenHeader; // Если это строка, используем ее напрямую
    }
    if (!token) {
      client.emit('error', 'Unauthorized');
      console.log('error');
      return;
    }

    let decodedToken;

    try {
      decodedToken = jwt.verify(token, 'your_secret_key') as jwt.JwtPayload;
    } catch (error) {
      client.emit('error', 'Invalid token');
      console.log('errorWhenDeocded', error);
      return;
    }

    const chatId = Number(client.handshake.query.chatId);
    const senderId = decodedToken.user.id

    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });
    console.log(chat);
    console.log(message, '=> content');
    console.log(senderId, '=> senderId');
    if (chat) {
      const newMessage = this.messageRepository.create({
        chat,
        sender: senderId,
        content,
      });
      await this.messageRepository.save(newMessage);
    }
    if (chatId && content) {
      // Log the received message to the console
      console.log(
        `Message received for chat ${chatId}: ${content}, sender: ${senderId}`,
      );

      // Broadcast the message to all users in the room
      this.server.to(`chat_${chatId}`).emit('receiveMessage', content);
    } else {
      console.log('Invalid message format received:', message);
    }
  }
}
