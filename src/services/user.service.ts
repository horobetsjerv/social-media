import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../models/user.entity';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Code } from '../models/code.entity';
import * as jwt from 'jsonwebtoken';
import { CreateUserDto } from '../dto/create-user.dto';
import { JwtCheckDto } from '../dto/jwt-check.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  public isNewUser: boolean = false;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Code)
    private codeRepository: Repository<Code>,
    private readonly jwtService: JwtService,
  ) {}
  async sendCode(data: User) {
    function generateCode(length) {
      const characters = '0123456789';
      let code = '';
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
      }
      return code;
    }

    try {
      const code = generateCode(6);

      let user: User = await this.userRepository.findOne({
        where: { email: data.email },
      });

      if (!user) {
        user = this.userRepository.create(data);
        await this.userRepository.save(user);
        this.isNewUser = true;
      }

      if (!this.isNewUser) {
        // Если пользователь не новый, удаляем старый код (если он есть) и сохраняем новый
        await this.codeRepository.delete({ user: user });
      }

      const verificationCode = this.codeRepository.create({
        code: code,
        user: user,
      });

      await this.codeRepository.save(verificationCode);

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'molodoytankist06@gmail.com',
          pass: 'hgvehfwkzrexsifw',
        },
      });

      const mailOptions = {
        from: 'molodoytankist06@gmail.com',
        to: data.email,
        subject: 'socialMedia',
        html: `Your auth code is ${verificationCode.code}`,
      };

      transporter.sendMail(mailOptions, (error: any, info: any) => {
        if (error) {
          console.log('ERRORMAIL', error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      return { isUserNew: this.isNewUser };
    } catch (error) {
      console.error('Ошибка при создании пользователя:', error);
      throw new Error('Ошибка при создании пользователя');
    }
  }
  async validateCode(data: any) {
    try {
      console.log('validateCodeUser', this.isNewUser);
      //let user: User = await this.userRepository.findOne({
      //where: { email: data.email },
      //});
      let user: User = await this.userRepository.findOne({
        where: { email: data.email },
        relations: ['chats'],
      });
      let code: Code = await this.codeRepository.findOne({
        where: { userId: user.id },
      });
      console.log(data);
      console.log('user code ->', code, 'data code =>', data.code);
      console.log(user.id);

      if (code && code.code === data.code) {
        const token = jwt.sign({ user }, 'your_secret_key', {
          expiresIn: '30d',
        });
        console.log({ token, isNewUser: this.isNewUser });
        const isNewUser = this.isNewUser;
        this.isNewUser = false;

        return { token, isNewUser };
      } else {
        return false; // В противном случае возвращаем false
      }
    } catch (err) {
      console.log(err);
      return false; // В случае ошибки также возвращаем false
    }
  }
  async setupUser(data: CreateUserDto) {
    const { email, ...updatedFields } = data;
    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      // Если пользователь найден, обновляем его поля
      if (data.username && data.name) {
        await this.userRepository.update({ email }, updatedFields);
        return await this.userRepository.findOne({ where: { email } });
      } else {
        throw new NotFoundException('Вы не передали username или name');
      }
    } else {
      throw new NotFoundException('Пользователь не найден');
    }
  }
  async cheackJWT(token: string) {
    try {
      let isValid: boolean;
      const decodedToken = this.jwtService.verify(token);
      const decodedUser = decodedToken.user;
      let user: User = await this.userRepository.findOne({
        where: { email: decodedUser.email },
        relations: ['chats'],
      });
     if (!user) {
        throw new UnauthorizedException('Такого пользователя не существует');
      }
      if (!decodedToken || !decodedToken.exp) {
        throw new UnauthorizedException('Неправильный токен');
      }
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);
      if (decodedToken.exp < currentTimeInSeconds) {
        isValid = false;
        throw new UnauthorizedException('Дата токена истекла');
      } else {
        isValid = true;
      }
      return { isValid: isValid, user };
    } catch (error) {
      throw new Error(error);
    }
  }
}
