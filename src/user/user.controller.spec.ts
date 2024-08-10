import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';

// Mock UserService
const mockUserService = {
  createUser: jest.fn(),
};

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  describe('register', () => {
    it('should successfully register a user and return it', async () => {
      const createUserDto: CreateUserDto = { email: 'test@example.com', password: 'password123' };
      const result: User = { id: '1', ...createUserDto, name: 'Test User', createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(userService, 'createUser').mockResolvedValue(result);

      expect(await userController.register(createUserDto)).toEqual(result);
      expect(userService.createUser).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw an HttpException if an error occurs during user creation', async () => {
      const createUserDto: CreateUserDto = { email: 'test@example.com', password: 'password123' };

      jest.spyOn(userService, 'createUser').mockRejectedValue(new HttpException('User already exists', HttpStatus.BAD_REQUEST));

      await expect(userController.register(createUserDto)).rejects.toThrow(HttpException);
      await expect(userController.register(createUserDto)).rejects.toHaveProperty('message', 'User already exists');
    });

    it('should throw an InternalServerErrorException if an unexpected error occurs', async () => {
      const createUserDto: CreateUserDto = { email: 'test@example.com', password: 'password123' };

      jest.spyOn(userService, 'createUser').mockRejectedValue(new Error('Unexpected error'));

      await expect(userController.register(createUserDto)).rejects.toThrow(HttpException);
      await expect(userController.register(createUserDto)).rejects.toHaveProperty('message', 'Internal server error');
    });
  });
});
