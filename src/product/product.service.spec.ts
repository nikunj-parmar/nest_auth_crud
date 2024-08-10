import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Product } from '@prisma/client';

// Mock PrismaService
const mockPrismaService = {
  product: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ProductService', () => {
  let productService: ProductService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    productService = module.get<ProductService>(ProductService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a product and return it', async () => {
      const createProductDto = { name: 'Product A', description: 'Description A', price: 100 };
      const userId = 'user-id';
      const result = {
        id: '1',
        ...createProductDto,
        created_by: userId,
      };

      jest.spyOn(prismaService.product, 'create').mockResolvedValue(result);

      expect(await productService.create(createProductDto, userId)).toEqual(result);
      expect(prismaService.product.create).toHaveBeenCalledWith({
        data: {
          ...createProductDto,
          created_by: userId,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const result: Product[] = [
        { id: '1', name: 'Product A', description: 'Description A', price: 100, created_by: 'user-id' },
        { id: '2', name: 'Product B', description: 'Description B', price: 200, created_by: 'user-id' },
      ];

      jest.spyOn(prismaService.product, 'findMany').mockResolvedValue(result);

      expect(await productService.findAll()).toEqual(result);
      expect(prismaService.product.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const result = { id: '1', name: 'Product A', description: 'Description A', price: 100, created_by: 'user-id' };

      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(result);

      expect(await productService.findOne('1')).toEqual(result);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(null);

      await expect(productService.findOne('1')).rejects.toThrow(
        new NotFoundException(`Product with ID 1 not found`),
      );
    });
  });

  describe('update', () => {
    it('should update a product and return it', async () => {
      const updateProductDto = { name: 'Updated Product', description: 'Updated description', price: 150 };
      const result = {
        id: '1',
        ...updateProductDto,
        created_by: 'user-id',
      };

      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(result);
      jest.spyOn(prismaService.product, 'update').mockResolvedValue(result);

      expect(await productService.update('1', updateProductDto)).toEqual(result);
      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateProductDto,
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(null);

      await expect(productService.update('1', {} as any)).rejects.toThrow(
        new NotFoundException(`Product with ID 1 not found`),
      );
    });
  });

  describe('remove', () => {
    it('should remove a product and return a success indicator', async () => {
      const result = { deleted: true };

      jest.spyOn(prismaService.product, 'delete').mockResolvedValue({ id: '1' } as any); // Mocking delete method

      expect(await productService.remove('1')).toEqual(result);
      expect(prismaService.product.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
