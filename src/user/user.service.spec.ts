import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { BadRequestException, ConflictException } from '@nestjs/common';

// Mock bcrypt.hash function
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;

  // Type assertion for the mock
  const mockedHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, PrismaService],
    }).compile();

    userService = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should successfully create a user', async () => {
      const createUserDto: CreateUserDto = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const fixedDate = new Date('2024-08-10T11:34:59.602Z'); // Fixed date for testing


      // Mock Prisma methods
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null); // No existing user
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        id: '1',
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
        createdAt: fixedDate,
        updatedAt: fixedDate,
      } as User);

      const result = await userService.createUser(createUserDto);

      expect(result).toEqual({
        id: '1',
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashedPassword,
        createdAt: fixedDate,
        updatedAt: fixedDate,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          password: hashedPassword,
          name: createUserDto.name,
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = { email: 'test@example.com', password: 'password123', name: 'Test User' };

      // Mock Prisma methods
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({} as User); // Simulate existing user

      await expect(userService.createUser(createUserDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if creation fails', async () => {
      const createUserDto: CreateUserDto = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      
      // Mock Prisma methods
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null); // No existing user
      jest.spyOn(prismaService.user, 'create').mockRejectedValue(new Error('Creation failed'));

      await expect(userService.createUser(createUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findUserByEmail', () => {
    it('should return a user if found', async () => {
      const email = 'test@example.com';
      const user: User = {
        id: '1',
        email,
        name: 'Test User',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma methods
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);

      const result = await userService.findUserByEmail(email);
      expect(result).toEqual(user);
    });

    it('should throw BadRequestException if user cannot be found', async () => {
      const email = 'test@example.com';

      // Mock Prisma methods
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null); // Simulate no user found

      await expect(userService.findUserByEmail(email)).rejects.toThrow(BadRequestException);
    });
  });
});
