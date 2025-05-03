import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, and, desc, asc, gt, like, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const storage = {
  // User related operations
  async getUserByPhone(phone: string) {
    try {
      return await db.query.users.findFirst({
        where: eq(schema.users.phone, phone),
        with: {
          addresses: true
        }
      });
    } catch (error) {
      console.error("Error fetching user by phone:", error);
      throw new Error("User not found or database error");
    }
  },

  async createUser(userData: schema.UserInsert) {
    try {
      const [user] = await db.insert(schema.users)
        .values(userData)
        .returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Error creating user");
    }
  },

  // Address operations
  async getAddressesByUserId(userId: number) {
    try {
      return await db.query.addresses.findMany({
        where: eq(schema.addresses.userId, userId),
        orderBy: [desc(schema.addresses.default), asc(schema.addresses.id)]
      });
    } catch (error) {
      console.error("Error fetching addresses by user ID:", error);
      throw new Error("Error fetching addresses");
    }
  },

  async getAddressById(id: number) {
    try {
      return await db.query.addresses.findFirst({
        where: eq(schema.addresses.id, id)
      });
    } catch (error) {
      console.error("Error fetching address by ID:", error);
      throw new Error("Address not found or database error");
    }
  },

  async createAddress(addressData: schema.AddressInsert) {
    try {
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
    } catch (error) {
      console.error("Error creating address:", error);
      throw new Error("Error creating address");
    }
  },

  async updateAddress(id: number, addressData: Partial<schema.AddressInsert>) {
    try {
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
    } catch (error) {
      console.error("Error updating address:", error);
      throw new Error("Error updating address");
    }
  },

  async deleteAddress(id: number) {
    try {
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
    } catch (error) {
      console.error("Error deleting address:", error);
      throw new Error("Error deleting address");
    }
  },

  // Drink operations
  async getAllDrinks() {
    try {
      return await db.query.drinks.findMany({
        with: {
          category: true
        }
      });
    } catch (error) {
      console.error("Error fetching all drinks:", error);
      throw new Error("Error fetching drinks");
    }
  },

  async getDrinksByCategory(categoryId: number) {
    try {
      return await db.query.drinks.findMany({
        where: eq(schema.drinks.categoryId, categoryId),
        with: {
          category: true
        }
      });
    } catch (error) {
      console.error("Error fetching drinks by category:", error);
      throw new Error("Error fetching drinks by category");
    }
  },

  async getPopularDrinks() {
    try {
      return await db.query.drinks.findMany({
        where: eq(schema.drinks.popular, true),
        with: {
          category: true
        }
      });
    } catch (error) {
      console.error("Error fetching popular drinks:", error);
      throw new Error("Error fetching popular drinks");
    }
  },

  async getDrinkById(id: number) {
    try {
      return await db.query.drinks.findFirst({
        where: eq(schema.drinks.id, id),
        with: {
          category: true
        }
      });
    } catch (error) {
      console.error("Error fetching drink by ID:", error);
      throw new Error("Error fetching drink");
    }
  },

  async searchDrinks(query: string) {
    try {
      return await db.query.drinks.findMany({
        where: like(schema.drinks.name, `%${query}%`),
        with: {
          category: true
        }
      });
    } catch (error) {
      console.error("Error searching drinks:", error);
      throw new Error("Error searching drinks");
    }
  },

  // Category operations
  async getAllCategories() {
    try {
      return await db.query.categories.findMany();
    } catch (error) {
      console.error("Error fetching all categories:", error);
      throw new Error("Error fetching categories");
    }
  },

  // Order operations
  async createOrder(orderData: Omit<schema.OrderInsert, 'deliveryAddress'>) {
    try {
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
    } catch (error) {
      console.error("Error creating order:", error);
      throw new Error("Error creating order");
    }
  },

  async addOrderItems(items: schema.OrderItemInsert[]) {
    try {
      const orderItems = await db.insert(schema.orderItems)
        .values(items)
        .returning();
      return orderItems;
    } catch (error) {
      console.error("Error adding order items:", error);
      throw new Error("Error adding order items");
    }
  },

  async getOrderById(id: number, userId?: number) {
    try {
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
    } catch (error) {
      console.error("Error fetching order by ID:", error);
      throw new Error("Error fetching order");
    }
  },

  async getOrdersByUserId(userId: number) {
    try {
      return await db.query.orders.findMany({
        where: eq(schema.orders.userId, userId),
        orderBy: [desc(schema.orders.createdAt)],
        with: {
          items: true
        }
      });
    } catch (error) {
      console.error("Error fetching orders by user ID:", error);
      throw new Error("Error fetching orders by user ID");
    }
  },

  async getAllOrders() {
    try {
      return await db.query.orders.findMany({
        orderBy: [desc(schema.orders.createdAt)],
        with: {
          user: true,
          items: true
        }
      });
    } catch (error) {
      console.error("Error fetching all orders:", error);
      throw new Error("Error fetching all orders");
    }
  },

  async getPendingOrders() {
    try {
      return await db.query.orders.findMany({
        where: eq(schema.orders.status, "pending"),
        orderBy: [desc(schema.orders.createdAt)],
        with: {
          user: true,
          items: true
        }
      });
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      throw new Error("Error fetching pending orders");
    }
  },

  async updateOrderStatus(id: number, status: string) {
    try {
      const [order] = await db.update(schema.orders)
        .set({ 
          status, 
          updatedAt: new Date() 
        })
        .where(eq(schema.orders.id, id))
        .returning();
      return order;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw new Error("Error updating order status");
    }
  },

  // Admin operations
  async getAdminByUsername(username: string) {
    try {
      return await db.query.admins.findFirst({
        where: eq(schema.admins.username, username)
      });
    } catch (error) {
      console.error("Error fetching admin by username:", error);
      throw new Error("Error fetching admin");
    }
  },

  async verifyAdminPassword(admin: schema.Admin, password: string) {
    try {
      return await bcrypt.compare(password, admin.password);
    } catch (error) {
      console.error("Error verifying admin password:", error);
      throw new Error("Error verifying password");
    }
  }
};
