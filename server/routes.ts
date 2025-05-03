import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as schema from "@shared/schema";
import { 
  authenticateUser, 
  authenticateAdmin, 
  validateRequest, 
  generateUserToken, 
  generateAdminToken,
  verifyOtp
} from "./auth";
import { eq } from "drizzle-orm";
import { db } from "@db";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix for all routes
  const apiPrefix = "/api";

  // Auth routes
  app.post(`${apiPrefix}/auth/send-otp`, validateRequest(schema.loginSchema, async (req, res, data) => {
    // In a real app, this would send an OTP to the phone number
    // For demo purposes, we'll just return success
    res.status(200).json({ message: "OTP sent successfully" });
  }));

  app.post(`${apiPrefix}/auth/verify-otp`, validateRequest(schema.verifyOtpSchema, async (req, res, data) => {
    try {
      const { phone, otp } = data;
      
      // Verify OTP (dummy implementation)
      if (!verifyOtp(phone, otp)) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
      
      // Check if user exists
      let user = await storage.getUserByPhone(phone);
      
      // Generate token
      if (user) {
        const token = generateUserToken(user.id);
        return res.status(200).json({ 
          token,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email
          },
          isNewUser: false
        });
      } else {
        // User doesn't exist, return special status
        return res.status(200).json({ 
          isNewUser: true,
          phone
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return res.status(500).json({ message: "Failed to verify OTP" });
    }
  }));

  app.post(`${apiPrefix}/auth/register`, validateRequest(schema.insertUserSchema, async (req, res, data) => {
    try {
      const newUser = await storage.createUser(data);
      
      // Generate token
      const token = generateUserToken(newUser.id);
      
      res.status(201).json({ 
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          phone: newUser.phone,
          email: newUser.email
        }
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  }));

  app.post(`${apiPrefix}/auth/admin/login`, validateRequest(schema.adminLoginSchema, async (req, res, data) => {
    try {
      const { username, password } = data;
      
      // Find admin
      const admin = await storage.getAdminByUsername(username);
      
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isValid = await storage.verifyAdminPassword(admin, password);
      
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate token
      const token = generateAdminToken(admin.id);
      
      res.status(200).json({ 
        token,
        admin: {
          id: admin.id,
          username: admin.username
        }
      });
    } catch (error) {
      console.error("Error in admin login:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  }));

  // User routes
  app.get(`${apiPrefix}/user/profile`, authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      
      // Get user with addresses
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        with: {
          addresses: true
        }
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        addresses: user.addresses
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Address routes
  app.get(`${apiPrefix}/addresses`, authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const addresses = await storage.getAddressesByUserId(userId);
      res.status(200).json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });

  app.post(`${apiPrefix}/addresses`, authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).userId;
      console.log("Received address data:", req.body);
      
      // Validate the data ourselves
      if (!req.body.label || typeof req.body.label !== 'string') {
        return res.status(400).json({ message: "Label is required and must be a string" });
      }
      
      if (!req.body.address || typeof req.body.address !== 'string') {
        return res.status(400).json({ message: "Address is required and must be a string" });
      }
      
      const isDefault = req.body.default === true;
      
      const address = await storage.createAddress({
        userId,
        label: req.body.label,
        address: req.body.address,
        default: isDefault
      });
      
      res.status(201).json(address);
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(500).json({ message: "Failed to create address" });
    }
  });

  app.put(`${apiPrefix}/addresses/:id`, authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const addressId = parseInt(req.params.id);
      
      // Validate address belongs to user
      const address = await storage.getAddressById(addressId);
      if (!address || address.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      const updatedAddress = await storage.updateAddress(addressId, {
        ...req.body,
        userId
      });
      
      res.status(200).json(updatedAddress);
    } catch (error) {
      console.error("Error updating address:", error);
      res.status(500).json({ message: "Failed to update address" });
    }
  });

  app.delete(`${apiPrefix}/addresses/:id`, authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const addressId = parseInt(req.params.id);
      
      // Validate address belongs to user
      const address = await storage.getAddressById(addressId);
      if (!address || address.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      await storage.deleteAddress(addressId);
      
      res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
      console.error("Error deleting address:", error);
      res.status(500).json({ message: "Failed to delete address" });
    }
  });

  // Drink routes
  app.get(`${apiPrefix}/drinks`, async (req, res) => {
    try {
      const drinks = await storage.getAllDrinks();
      res.status(200).json(drinks);
    } catch (error) {
      console.error("Error fetching drinks:", error);
      res.status(500).json({ message: "Failed to fetch drinks" });
    }
  });

  app.get(`${apiPrefix}/drinks/popular`, async (req, res) => {
    try {
      const popularDrinks = await storage.getPopularDrinks();
      res.status(200).json(popularDrinks);
    } catch (error) {
      console.error("Error fetching popular drinks:", error);
      res.status(500).json({ message: "Failed to fetch popular drinks" });
    }
  });

  app.get(`${apiPrefix}/drinks/search`, async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const results = await storage.searchDrinks(query);
      res.status(200).json(results);
    } catch (error) {
      console.error("Error searching drinks:", error);
      res.status(500).json({ message: "Failed to search drinks" });
    }
  });

  app.get(`${apiPrefix}/drinks/:id`, async (req, res) => {
    try {
      const drinkId = parseInt(req.params.id);
      const drink = await storage.getDrinkById(drinkId);
      
      if (!drink) {
        return res.status(404).json({ message: "Drink not found" });
      }
      
      res.status(200).json(drink);
    } catch (error) {
      console.error("Error fetching drink:", error);
      res.status(500).json({ message: "Failed to fetch drink" });
    }
  });

  // Category routes
  app.get(`${apiPrefix}/categories`, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.status(200).json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get(`${apiPrefix}/categories/:id/drinks`, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const drinks = await storage.getDrinksByCategory(categoryId);
      res.status(200).json(drinks);
    } catch (error) {
      console.error("Error fetching drinks by category:", error);
      res.status(500).json({ message: "Failed to fetch drinks by category" });
    }
  });

  // Order routes
  app.post(`${apiPrefix}/orders`, authenticateUser, validateRequest(schema.createOrderSchema, async (req, res, data) => {
    try {
      const userId = (req as any).userId;
      const { addressId, items } = data;
      
      // Validate address belongs to user
      const address = await storage.getAddressById(addressId);
      if (!address || address.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Get drinks for price calculation
      const drinkIds = items.map(item => item.drinkId);
      const drinks = await Promise.all(
        drinkIds.map(id => storage.getDrinkById(id))
      );
      
      // Calculate totals
      const subtotal = items.reduce((total, item) => {
        const drink = drinks.find(d => d?.id === item.drinkId);
        if (!drink) return total;
        return total + (parseFloat(drink.price.toString()) * item.quantity);
      }, 0);
      
      const deliveryFee = 2.00; // Fixed delivery fee
      const total = subtotal + deliveryFee;
      
      // Create order
      const order = await storage.createOrder({
        userId,
        addressId,
        total: total.toString(),
        deliveryFee: deliveryFee.toString(),
        status: "pending",
        paymentMethod: "cod"
      });
      
      // Create order items
      const orderItems = await storage.addOrderItems(
        items.map(item => {
          const drink = drinks.find(d => d?.id === item.drinkId);
          if (!drink) throw new Error(`Drink with ID ${item.drinkId} not found`);
          
          return {
            orderId: order.id,
            drinkId: drink.id,
            name: drink.name,
            price: drink.price.toString(),
            quantity: item.quantity
          };
        })
      );
      
      // Return full order with items
      const fullOrder = await storage.getOrderById(order.id);
      
      res.status(201).json(fullOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  }));

  app.get(`${apiPrefix}/orders`, authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const orders = await storage.getOrdersByUserId(userId);
      res.status(200).json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get(`${apiPrefix}/orders/:id`, authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const orderId = parseInt(req.params.id);
      
      const order = await storage.getOrderById(orderId, userId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.status(200).json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Admin routes
  app.get(`${apiPrefix}/admin/orders`, authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const orders = await storage.getAllOrders();
      res.status(200).json(orders);
    } catch (error) {
      console.error("Error fetching all orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get(`${apiPrefix}/admin/orders/pending`, authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const pendingOrders = await storage.getPendingOrders();
      res.status(200).json(pendingOrders);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      res.status(500).json({ message: "Failed to fetch pending orders" });
    }
  });

  app.put(`${apiPrefix}/admin/orders/:id/status`, authenticateAdmin, validateRequest(schema.updateOrderStatusSchema, async (req, res, data) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = data;
      
      const order = await storage.updateOrderStatus(orderId, status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.status(200).json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  }));

  const httpServer = createServer(app);
  return httpServer;
}
