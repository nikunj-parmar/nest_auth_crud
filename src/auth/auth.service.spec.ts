import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { LoginDto } from './dto/login.dto';

// Mock implementation of PrismaService
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
  },
};

// Mock implementation of JwtService
const mockJwtService = {
  sign: jest.fn(),
};

// Mock implementation of bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should return a user when credentials are valid', async () => {
      const hashedPassword = 'hashed-password';
      const user: User = {
        id: '1',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword); // Ensure hash function is available

      const result = await authService.validateUser('test@example.com', 'password123');
      expect(result).toEqual(user);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', user.password);
    });

    it('should return null when credentials are invalid', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      
      const result = await authService.validateUser('test@example.com', 'wrongpassword');
      expect(result).toBeNull();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('should return null when password is incorrect', async () => {
      const hashedPassword = 'hashed-password';
      const user: User = {
        id: '1',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Ensure compare function is available
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword); // Ensure hash function is available

      const result = await authService.validateUser('test@example.com', 'wrongpassword');
      expect(result).toBeNull();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', user.password);
    });
  });

  describe('login', () => {
    it('should return an access token when login is successful', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const user: User = {
        id: '1',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const accessToken = 'valid-jwt-token';

      jest.spyOn(authService, 'validateUser').mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockReturnValue(accessToken);

      const result = await authService.login(loginDto);
      expect(result).toEqual({ accessToken });
      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(jwtService.sign).toHaveBeenCalledWith({ email: user.email, sub: user.id });
    });

    it('should throw an UnauthorizedException when login fails', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'wrongpassword' };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });
  });
});