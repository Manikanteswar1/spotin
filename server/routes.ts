import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./mongo-storage";
import * as models from "@shared/models";
import { 
  authenticateUser, 
  authenticateAdmin, 
  validateRequest, 
  generateUserToken, 
  generateAdminToken,
  verifyOtp
} from "./auth";
import mongoose from "mongoose";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix for all routes
  const apiPrefix = "/api";

  // Auth routes
  app.post(`${apiPrefix}/auth/send-otp`, async (req, res) => {
    try {
      const { phone } = req.body;
      
      // Validate phone
      if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ message: "Valid phone number is required" });
      }
      
      // In a real app, this would send an OTP to the phone number
      // For demo purposes, we'll just return success
      
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
      
      res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post(`${apiPrefix}/auth/verify-otp`, async (req, res) => {
    try {
      const { phone, otp } = req.body;
      
      // Validate input
      if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ message: "Valid phone number is required" });
      }
      
      if (!otp || typeof otp !== 'string') {
        return res.status(400).json({ message: "Valid OTP is required" });
      }
      
      // Verify OTP (dummy implementation)
      if (!verifyOtp(phone, otp)) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
      
      // Check if user exists
      let user = await storage.getUserByPhone(phone);
      
      // Generate token
      if (user) {
        const token = generateUserToken(user._id.toString());
        return res.status(200).json({ 
          token,
          user: {
            id: user._id,
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
  });

  app.post(`${apiPrefix}/auth/register`, async (req, res) => {
    try {
      const { name, phone, email } = req.body;
      
      // Validate input
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Valid name is required" });
      }
      
      if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ message: "Valid phone number is required" });
      }
      
      // Email is optional but must be a string if provided
      if (email !== undefined && typeof email !== 'string') {
        return res.status(400).json({ message: "Email must be a string if provided" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser) {
        return res.status(400).json({ message: "User with this phone number already exists" });
      }
      
      const newUser = await storage.createUser({ name, phone, email });
      
      // Generate token
      const token = generateUserToken(String(newUser._id));
      
      res.status(201).json({ 
        token,
        user: {
          id: String(newUser._id),
          name: newUser.name,
          phone: newUser.phone,
          email: newUser.email
        }
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post(`${apiPrefix}/auth/admin/login`, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Username is required" });
      }
      
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ message: "Password is required" });
      }
      
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
      const token = generateAdminToken(admin._id.toString());
      
      res.status(200).json({ 
        token,
        admin: {
          id: admin._id,
          username: admin.username
        }
      });
    } catch (error) {
      console.error("Error in admin login:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  // User routes
  app.get(`${apiPrefix}/user/profile`, authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      
      // Get user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user addresses
      const addresses = await storage.getAddressesByUserId(userId);
      
      res.status(200).json({
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        addresses: addresses
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
      const addressId = req.params.id;
      
      // Validate address belongs to user
      const address = await storage.getAddressById(addressId);
      if (!address || address.userId.toString() !== userId) {
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
      const addressId = req.params.id;
      
      // Validate address belongs to user
      const address = await storage.getAddressById(addressId);
      if (!address || address.userId.toString() !== userId) {
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
      const drinkId = req.params.id;
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
      const categoryId = req.params.id;
      const drinks = await storage.getDrinksByCategory(categoryId);
      res.status(200).json(drinks);
    } catch (error) {
      console.error("Error fetching drinks by category:", error);
      res.status(500).json({ message: "Failed to fetch drinks by category" });
    }
  });

  // Order routes
  app.post(`${apiPrefix}/orders`, authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { addressId, items } = req.body;
      
      // Validate data
      if (!addressId || typeof addressId !== 'string') {
        return res.status(400).json({ message: "Valid addressId is required" });
      }
      
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items array is required and cannot be empty" });
      }
      
      // Validate address belongs to user
      const address = await storage.getAddressById(addressId);
      if (!address || address.userId.toString() !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Get drinks for price calculation
      const drinkIds = items.map(item => item.drinkId);
      const drinks = await Promise.all(
        drinkIds.map(id => storage.getDrinkById(id))
      );
      
      // Calculate totals
      const subtotal = items.reduce((total, item) => {
        const drink = drinks.find(d => d?._id.toString() === item.drinkId);
        if (!drink) return total;
        return total + (parseFloat(drink.price.toString()) * item.quantity);
      }, 0);
      
      const deliveryFee = 2.00; // Fixed delivery fee
      const total = subtotal + deliveryFee;
      
      // In MongoDB, we store the order with items directly
      const order = await storage.createOrder({
        userId,
        deliveryAddress: address.address, // Store the actual address text
        items: items.map(item => {
          const drink = drinks.find(d => d?._id.toString() === item.drinkId);
          if (!drink) throw new Error(`Drink with ID ${item.drinkId} not found`);
          
          return {
            drinkId: drink._id.toString(), // Convert to string ID
            name: drink.name,
            price: drink.price,
            quantity: item.quantity
          };
        }),
        total,
        deliveryFee,
        status: "pending"
      });
      
      // Return full order
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

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
      const orderId = req.params.id;
      
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

  app.put(`${apiPrefix}/admin/orders/:id/status`, authenticateAdmin, async (req, res) => {
    try {
      const orderId = req.params.id;
      const { status } = req.body;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status is required and must be a string" });
      }
      
      const order = await storage.updateOrderStatus(orderId, status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.status(200).json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
