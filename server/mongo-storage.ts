import mongoose from 'mongoose';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import session from 'express-session';
import {
  User, Address, Category, Drink, Order, Admin,
  IUser, IAddress, ICategory, IDrink, IOrder, IAdmin,
  IOrderItem
} from '@shared/models';

const scryptAsync = promisify(scrypt);

// Helper functions for password hashing
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export const storage = {
  // User operations
  async getUserByPhone(phone: string) {
    return await User.findOne({ phone }).lean();
  },

  async createUser(userData: Partial<IUser>) {
    const user = new User(userData);
    await user.save();
    return user.toObject();
  },

  async getUser(id: string) {
    return await User.findById(id).lean();
  },

  // Address operations
  async getAddressesByUserId(userId: string) {
    return await Address.find({ userId: new mongoose.Types.ObjectId(userId) }).lean();
  },

  async getAddressById(id: string) {
    return await Address.findById(id).lean();
  },

  async createAddress(addressData: Partial<IAddress>) {
    // If this is set as default, unset any other default addresses
    if (addressData.default) {
      await Address.updateMany(
        { userId: addressData.userId },
        { $set: { default: false } }
      );
    }
    const address = new Address(addressData);
    await address.save();
    return address.toObject();
  },

  async updateAddress(id: string, addressData: Partial<IAddress>) {
    // If this is set as default, unset any other default addresses
    if (addressData.default) {
      await Address.updateMany(
        { userId: addressData.userId, _id: { $ne: id } },
        { $set: { default: false } }
      );
    }
    
    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      { $set: addressData },
      { new: true }
    ).lean();
    
    return updatedAddress;
  },

  async deleteAddress(id: string) {
    await Address.findByIdAndDelete(id);
    return true;
  },

  // Drink operations
  async getAllDrinks() {
    return await Drink.find().populate('categoryId').lean();
  },

  async getDrinksByCategory(categoryId: string) {
    return await Drink.find({ 
      categoryId: new mongoose.Types.ObjectId(categoryId) 
    }).populate('categoryId').lean();
  },

  async getPopularDrinks() {
    return await Drink.find({ popular: true }).populate('categoryId').lean();
  },

  async getDrinkById(id: string) {
    return await Drink.findById(id).populate('categoryId').lean();
  },

  async searchDrinks(query: string) {
    return await Drink.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).populate('categoryId').lean();
  },

  // Category operations
  async getAllCategories() {
    return await Category.find().lean();
  },

  // Order operations
  async createOrder(orderData: Partial<IOrder>) {
    const order = new Order(orderData);
    await order.save();
    return order.toObject();
  },

  async getOrderById(id: string, userId?: string) {
    const query = userId 
      ? { _id: id, userId: new mongoose.Types.ObjectId(userId) }
      : { _id: id };
    
    return await Order.findOne(query)
      .populate('userId')
      .lean();
  },

  async getOrdersByUserId(userId: string) {
    return await Order.find({ 
      userId: new mongoose.Types.ObjectId(userId) 
    }).sort({ createdAt: -1 }).lean();
  },

  async getAllOrders() {
    return await Order.find()
      .populate('userId')
      .sort({ createdAt: -1 })
      .lean();
  },

  async getPendingOrders() {
    return await Order.find({ 
      status: { $nin: ['delivered', 'cancelled'] } 
    })
      .populate('userId')
      .sort({ createdAt: -1 })
      .lean();
  },

  async updateOrderStatus(id: string, status: string) {
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    )
      .populate('userId')
      .lean();
    
    return updatedOrder;
  },

  // Admin operations
  async getAdminByUsername(username: string) {
    return await Admin.findOne({ username }).lean();
  },

  async verifyAdminPassword(admin: IAdmin, password: string) {
    return await comparePasswords(password, admin.password);
  },

  // Session handling for express-session
  sessionStore: undefined as unknown as session.Store  // This will be set in server/index.ts
};