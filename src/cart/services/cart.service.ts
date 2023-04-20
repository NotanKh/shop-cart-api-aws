import { Injectable } from '@nestjs/common';

import { Cart } from '../entities/cart.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItemsService } from './cart-items.service';
import { CartItem } from '../models';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepository: Repository<Cart>,
    private cartItemService: CartItemsService,
  ) {}

  findByUserId(userId: string): Promise<Cart> {
    return this.cartRepository.findOne({
      where: { user_id: userId },
      relations: { items: true },
      select: {
        id: true,
        items: true,
      },
    });
  }

  async createByUserId(userId: string): Promise<Cart> {
    const cart = this.cartRepository.create({ user_id: userId });
    await this.cartRepository.save(cart);
    return this.findByUserId(userId);
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, { items }: Cart): Promise<Cart> {
    const { id } = await this.findOrCreateByUserId(userId);

    await this.cartItemService.updateItemsByCart(id, items);

    return await this.findByUserId(userId);
  }

  async removeByUserId(userId): Promise<void> {
    await this.cartRepository.delete({ user_id: userId });
  }

  async editCartItemByUserId(userId, cartItem: CartItem): Promise<Cart> {
    const { id: cartId } = await this.findOrCreateByUserId(userId);
    if (cartItem.count < 1) {
      await this.cartItemService.removeCartItemById(
        cartId,
        cartItem.product.id,
      );
    } else {
      await this.cartItemService.upsertItemByCart(
        cartId,
        cartItem.product,
        cartItem.count,
      );
    }

    return this.findByUserId(userId);
  }
}
