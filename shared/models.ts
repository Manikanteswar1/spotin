import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// ===== User Model =====
export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);

// ===== Address Model =====
export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  label: string;
  address: string;
  default: boolean;
  createdAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, required: true },
    address: { type: String, required: true },
    default: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Address = mongoose.model<IAddress>('Address', addressSchema);

// ===== Category Model =====
export interface ICategory extends Document {
  name: string;
  slug: string;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>('Category', categorySchema);

// ===== Drink Model =====
export interface IDrink extends Document {
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  popular: boolean;
  categoryId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const drinkSchema = new Schema<IDrink>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    available: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Drink = mongoose.model<IDrink>('Drink', drinkSchema);

// ===== Order Model =====
export interface IOrderItem {
  drinkId: mongoose.Types.ObjectId | string; // Allow both ObjectId and string ID
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  total: number;
  deliveryFee: number;
  status: string;
  deliveryAddress: string;
  items: IOrderItem[];
  createdAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    total: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'on-the-way', 'delivered', 'cancelled'],
      default: 'pending'
    },
    deliveryAddress: { type: String, required: true },
    items: [
      {
        drinkId: { type: Schema.Types.ObjectId, ref: 'Drink', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 }
      }
    ],
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);

// ===== Admin Model =====
export interface IAdmin extends Document {
  username: string;
  password: string;
  createdAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);

// ===== Zod validation schemas =====
export const loginSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  otp: z.string().min(4, "OTP must be at least 4 characters"),
});

export const adminLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'on-the-way', 'delivered', 'cancelled']),
});

export const createOrderSchema = z.object({
  addressId: z.string(),
  items: z.array(z.object({
    drinkId: z.string(),
    quantity: z.number().int().positive(),
  })),
});

export const cartItemSchema = z.object({
  drinkId: z.string(),
  name: z.string(),
  price: z.number(),
  image: z.string(),
  quantity: z.number().int().positive(),
});

export type CartItem = z.infer<typeof cartItemSchema>;

// Extended types for frontend use
export type DrinkWithCategory = IDrink & {
  category: ICategory
};

// For preserving backward compatibility with the existing frontend
export type User = IUser;
export type Address = IAddress;
export type Category = ICategory;
export type Drink = IDrink;
export type Order = IOrder;
export type OrderItem = IOrderItem;