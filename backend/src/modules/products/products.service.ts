import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto, imageUrl?: string): Promise<Product> {
    const product = this.productsRepo.create({
      ...createProductDto,
      imageUrl,
    });
    return await this.productsRepo.save(product);
  }

  async findAll(onlyActive = true): Promise<Product[]> {
    const where = onlyActive ? { isActive: true } : {};
    return await this.productsRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, imageUrl?: string): Promise<Product> {
    const product = await this.findOne(id);

    if (imageUrl && product.imageUrl) {
      this.deleteImage(product.imageUrl);
    }

    const updatedProduct = this.productsRepo.merge(product, {
      ...updateProductDto,
      ...(imageUrl ? { imageUrl } : {}),
    });

    return await this.productsRepo.save(updatedProduct);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    if (product.imageUrl) {
      this.deleteImage(product.imageUrl);
    }
    await this.productsRepo.remove(product);
  }

  private deleteImage(imageUrl: string): void {
    const filePath = path.join(process.cwd(), imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
