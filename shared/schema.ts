import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
}));

// User address table
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  label: text("label").notNull(),
  address: text("address").notNull(),
  default: boolean("default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const addressRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

// Drink categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categoryRelations = relations(categories, ({ many }) => ({
  drinks: many(drinks),
}));

// Drinks table
export const drinks = pgTable("drinks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image").notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  popular: boolean("popular").default(false),
  available: boolean("available").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const drinkRelations = relations(drinks, ({ one, many }) => ({
  category: one(categories, {
    fields: [drinks.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  addressId: integer("address_id").references(() => addresses.id).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  paymentMethod: text("payment_method").notNull().default("cod"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  address: one(addresses, {
    fields: [orders.addressId],
    references: [addresses.id],
  }),
  items: many(orderItems),
}));

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  drinkId: integer("drink_id").references(() => drinks.id).notNull(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  drink: one(drinks, {
    fields: [orderItems.drinkId],
    references: [drinks.id],
  }),
}));

// Admin users table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  phone: (schema) => schema.min(10, "Phone number must be at least 10 digits"),
});
export type UserInsert = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertAddressSchema = createInsertSchema(addresses);
export type AddressInsert = z.infer<typeof insertAddressSchema>;
export type Address = typeof addresses.$inferSelect;

export const insertDrinkSchema = createInsertSchema(drinks);
export type DrinkInsert = z.infer<typeof insertDrinkSchema>;
export type Drink = typeof drinks.$inferSelect;

export const insertCategorySchema = createInsertSchema(categories);
export type CategoryInsert = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export const insertOrderSchema = createInsertSchema(orders);
export type OrderInsert = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const insertOrderItemSchema = createInsertSchema(orderItems);
export type OrderItemInsert = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export const insertAdminSchema = createInsertSchema(admins, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
});
export type AdminInsert = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Auth related schemas
export const loginSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  otp: z.string().length(4, "OTP must be 4 digits"),
});

export const adminLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "on-the-way", "delivered", "cancelled"]),
});

export const createOrderSchema = z.object({
  addressId: z.number(),
  items: z.array(z.object({
    drinkId: z.number(),
    quantity: z.number().min(1),
  })),
});

export const cartItemSchema = z.object({
  drinkId: z.number(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().min(1),
  image: z.string(),
});
export type CartItem = z.infer<typeof cartItemSchema>;

export type OrderWithItems = Order & { 
  items: (OrderItem & { drink: Drink })[] 
};

export type DrinkWithCategory = Drink & {
  category: Category
};
