import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, and, desc, asc, gt, like, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const storage = {
  // User related operations
  async getUserByPhone(phone: string) {
    return await db.query.users.findFirst({
      where: eq(schema.users.phone, phone),
      with: {
        addresses: true
      }
    });
  },

  async createUser(userData: schema.UserInsert) {
    const [user] = await db.insert(schema.users)
      .values(userData)
      .returning();
    return user;
  },

  // Address operations
  async getAddressesByUserId(userId: number) {
    return await db.query.addresses.findMany({
      where: eq(schema.addresses.userId, userId),
      orderBy: [desc(schema.addresses.default), asc(schema.addresses.id)]
    });
  },

  async getAddressById(id: number) {
    return await db.query.addresses.findFirst({
      where: eq(schema.addresses.id, id)
    });
  },

  async createAddress(addressData: schema.AddressInsert) {
    // If this is the first address, make it default
    if (addressData.default) {
      // Reset all other defaults
      await db.update(schema.addresses)
        .set({ default: false })
        .where(eq(schema.addresses.userId, addressData.userId));
    } else {
      // Check if this is the first address
      const existingAddresses = await db.query.addresses.findMany({
        where: eq(schema.addresses.userId, addressData.userId)
      });
      
      if (existingAddresses.length === 0) {
        addressData.default = true;
      }
    }

    const [address] = await db.insert(schema.addresses)
      .values(addressData)
      .returning();
    return address;
  },

  async updateAddress(id: number, addressData: Partial<schema.AddressInsert>) {
    if (addressData.default) {
      // Reset all other defaults
      await db.update(schema.addresses)
        .set({ default: false })
        .where(and(
          eq(schema.addresses.userId, addressData.userId!),
          gt(schema.addresses.id, 0)
        ));
    }

    const [address] = await db.update(schema.addresses)
      .set(addressData)
      .where(eq(schema.addresses.id, id))
      .returning();
    return address;
  },

  async deleteAddress(id: number) {
    const [address] = await db.delete(schema.addresses)
      .where(eq(schema.addresses.id, id))
      .returning();
    
    // If deleted address was default, make another address default
    if (address.default) {
      const otherAddress = await db.query.addresses.findFirst({
        where: eq(schema.addresses.userId, address.userId)
      });

      if (otherAddress) {
        await db.update(schema.addresses)
          .set({ default: true })
          .where(eq(schema.addresses.id, otherAddress.id));
      }
    }
    
    return address;
  },

  // Drink operations
  async getAllDrinks() {
    return await db.query.drinks.findMany({
      with: {
        category: true
      }
    });
  },

  async getDrinksByCategory(categoryId: number) {
    return await db.query.drinks.findMany({
      where: eq(schema.drinks.categoryId, categoryId),
      with: {
        category: true
      }
    });
  },

  async getPopularDrinks() {
    return await db.query.drinks.findMany({
      where: eq(schema.drinks.popular, true),
      with: {
        category: true
      }
    });
  },

  async getDrinkById(id: number) {
    return await db.query.drinks.findFirst({
      where: eq(schema.drinks.id, id),
      with: {
        category: true
      }
    });
  },

  async searchDrinks(query: string) {
    return await db.query.drinks.findMany({
      where: like(schema.drinks.name, `%${query}%`),
      with: {
        category: true
      }
    });
  },

  // Category operations
  async getAllCategories() {
    return await db.query.categories.findMany();
  },

  // Order operations
  async createOrder(orderData: Omit<schema.OrderInsert, 'deliveryAddress'>) {
    // Get the address data
    const address = await db.query.addresses.findFirst({
      where: eq(schema.addresses.id, orderData.addressId)
    });

    if (!address) {
      throw new Error("Address not found");
    }

    // Create the order with the address text
    const [order] = await db.insert(schema.orders)
      .values({
        ...orderData,
        deliveryAddress: address.address
      })
      .returning();
    
    return order;
  },

  async addOrderItems(items: schema.OrderItemInsert[]) {
    const orderItems = await db.insert(schema.orderItems)
      .values(items)
      .returning();
    return orderItems;
  },

  async getOrderById(id: number, userId?: number) {
    const whereClause = userId
      ? and(eq(schema.orders.id, id), eq(schema.orders.userId, userId))
      : eq(schema.orders.id, id);

    return await db.query.orders.findFirst({
      where: whereClause,
      with: {
        items: {
          with: {
            drink: true
          }
        }
      }
    });
  },

  async getOrdersByUserId(userId: number) {
    return await db.query.orders.findMany({
      where: eq(schema.orders.userId, userId),
      orderBy: [desc(schema.orders.createdAt)],
      with: {
        items: true
      }
    });
  },

  async getAllOrders() {
    return await db.query.orders.findMany({
      orderBy: [desc(schema.orders.createdAt)],
      with: {
        user: true,
        items: true
      }
    });
  },

  async getPendingOrders() {
    return await db.query.orders.findMany({
      where: eq(schema.orders.status, "pending"),
      orderBy: [desc(schema.orders.createdAt)],
      with: {
        user: true,
        items: true
      }
    });
  },

  async updateOrderStatus(id: number, status: string) {
    const [order] = await db.update(schema.orders)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(schema.orders.id, id))
      .returning();
    return order;
  },

  // Admin operations
  async getAdminByUsername(username: string) {
    return await db.query.admins.findFirst({
      where: eq(schema.admins.username, username)
    });
  },

  async verifyAdminPassword(admin: schema.Admin, password: string) {
    return await bcrypt.compare(password, admin.password);
  }
};
