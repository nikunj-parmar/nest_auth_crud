import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });


  describe('login', () => {
    it('should return an access token on successful login', async () => {
      const loginDto: LoginDto = { email: 'nikunjparmar78@gmai.com', password: 'Nikunj8000@123' };
      const accessToken = 'valid-jwt-token';
      mockAuthService.login.mockResolvedValue({ accessToken });

      const result = await controller.login(loginDto);
      expect(result).toEqual({ accessToken });
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw an UnauthorizedException on invalid login', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'wrongpassword' };
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
