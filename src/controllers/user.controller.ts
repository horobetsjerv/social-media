import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { JwtCheckDto } from '../dto/jwt-check.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/login')
  async createUser(
    @Res() response: Response,
    @Req() request: Request,
  ): Promise<void> {
    const data: any = request.body;
    console.log(data);
    const newUser = await this.userService.sendCode(data);
    response.status(201).json(newUser);
  }
  @Post('/code')
  async validateCode(
    @Res() response: Response,
    @Req() request: Request,
  ): Promise<void> {
    const data = request.body;
    console.log(data);

    const isValid = await this.userService.validateCode(data);

    if (isValid) {
      response.status(200).json({ ...isValid }); // Возвращаем токен в случае успеха
    } else {
      response.status(400).json({ message: 'failed', isValid });
    }
  }
  @Post('/setup')
  async setupUser(
    @Res() response: Response,
    @Req() request: Request,
  ): Promise<void> {
    const data: CreateUserDto = request.body;
    console.log(data);

    try {
      const newUser = await this.userService.setupUser(data);
      response.status(201).json(newUser);
    } catch (error) {
      response.status(400).json({ message: error.message });
    }
  }
  @Post('me')
  async checkJWT(
    @Res() response: Response,
    @Req() request: Request,
  ): Promise<void> {
    const token: string = request.body.token;

    try {
      const data = await this.userService.cheackJWT(token);
      response.status(201).json(data);
    } catch (error) {
      response.status(400).json({ message: error.message });
    }
  }
}
