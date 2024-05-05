import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Code } from './code.entity';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Code)
    private codeRepository: Repository<Code>,
  ) {}
  async sendCode(data: User) {
    function generateCode(length) {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
      }
      return code;
    }

    try {
      const code = generateCode(5);

      let user: User = await this.userRepository.findOne({
        where: { email: data.email },
      });
      let isNewUser = false;

      if (!user) {
        user = this.userRepository.create(data);
        console.log('user', user);
        await this.userRepository.save(user);
        console.log('savework');
        isNewUser = true;
      }

      const verificationCode = this.codeRepository.create({
        code: code,
        user: user,
      });
      if (!isNewUser) {
        // Если пользователь не новый, удаляем старый код (если он есть) и сохраняем новый
        await this.codeRepository.delete({ user: user });
      }
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
    } catch (error) {
      console.error('Ошибка при создании пользователя:', error);
      throw new Error('Ошибка при создании пользователя');
    }
  }
  async validateCode(data: any) {
    try {
      console.log('data', data);
      let user: User = await this.userRepository.findOne({
        where: { email: data.email },
      });
      let code: Code = await this.codeRepository.findOne({
        where: { userId: data.user },
      });
      console.log('user code ->', code, 'data code =>', data.code);
      console.log(user.id);

      if (code && code.code === data.code) {
        const token = jwt.sign({ user }, 'your_secret_key', {
          expiresIn: '1h',
        });
        return token; // Возвращаем токен при успешной аутентификации
      } else {
        return false; // В противном случае возвращаем false
      }
    } catch (err) {
      console.log(err);
      return false; // В случае ошибки также возвращаем false
    }
  }
}
