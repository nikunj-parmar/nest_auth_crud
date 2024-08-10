import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

// Custom interface extending Request
interface CustomRequest extends Request {
  user?: {
    id: string;
  };
}

// Mock implementation of ProductService
const mockProductService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ProductController', () => {
  let productController: ProductController;
  let productService: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        { provide: ProductService, useValue: mockProductService },
      ],
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue({ canActivate: jest.fn(() => true) }) // Mock AuthGuard to always allow access
    .compile();

    productController = module.get<ProductController>(ProductController);
    productService = module.get<ProductService>(ProductService);
  });

  describe('create', () => {
    it('should create a product and return it', async () => {
      const createProductDto: CreateProductDto = { name: 'Product 1', price: 100, description: 'A sample product' };
      const userId = 'user-id';
      const result = {
        id: 'product-id',         // Ensure id is included
        name: 'Product 1',
        description: 'A sample product',
        price: 100,
        created_by: userId,
      };

      jest.spyOn(productService, 'create').mockResolvedValue(result);

      const req: CustomRequest = { user: { id: userId } } as CustomRequest;
      expect(await productController.create(createProductDto, req)).toEqual(result);
      expect(productService.create).toHaveBeenCalledWith(createProductDto, userId);
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const result = [
        {
          id: '1',                   // Ensure id is included
          name: 'Product 1',
          description: 'A sample product',
          price: 100,
          created_by: 'user-id',
        },
      ];
      
      jest.spyOn(productService, 'findAll').mockResolvedValue(result);

      expect(await productController.findAll()).toEqual(result);
      expect(productService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single product by id', async () => {
      const result = {
        id: '1',                   // Ensure id is included
        name: 'Product 1',
        description: 'A sample product',
        price: 100,
        created_by: 'user-id',
      };

      jest.spyOn(productService, 'findOne').mockResolvedValue(result);

      expect(await productController.findOne('1')).toEqual(result);
      expect(productService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a product and return it', async () => {
      const updateProductDto: UpdateProductDto = { 
        name: 'Updated Product', 
        price: 150, 
        description: 'Updated description' 
      };
      const result = {
        id: '1',                   // Ensure id is included
        name: 'Updated Product', 
        description: 'Updated description', 
        price: 150, 
        created_by: 'user-id',
      };

      jest.spyOn(productService, 'update').mockResolvedValue(result);

      expect(await productController.update('1', updateProductDto)).toEqual(result);
      expect(productService.update).toHaveBeenCalledWith('1', updateProductDto);
    });
  });

  describe('remove', () => {
    it('should remove a product and return success indicator', async () => {
      const result = { deleted: true };
  
      jest.spyOn(productService, 'remove').mockResolvedValue(result);
  
      expect(await productController.remove('1')).toEqual(result);
      expect(productService.remove).toHaveBeenCalledWith('1');
    });
  });
});
