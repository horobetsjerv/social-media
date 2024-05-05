import { Controller, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { UserService } from './user.service';

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
      response.status(200).json({ isValid }); // Возвращаем токен в случае успеха
    } else {
      response.status(400).json({ message: 'failed' });
    }
  }
}
