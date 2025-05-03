import mongoose from 'mongoose';
import connectDB from './mongodb';
import { 
  User, Address, Category, Drink, Admin,
  IUser, IAddress, ICategory, IDrink, IAdmin
} from '@shared/models';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function seedMongoDB() {
  try {
    console.log("🌱 Starting MongoDB database seeding...");
    
    // Connect to MongoDB
    await connectDB();
    
    // First, check if any existing data
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      console.log("👤 Admin already exists");
    } else {
      // Create admin user
      const adminPassword = await hashPassword('admin123');
      const admin = new Admin({
        username: 'admin',
        password: adminPassword
      });
      await admin.save();
      console.log("✅ Created admin user");
    }
    
    // Check if categories exist
    const categoryCount = await Category.countDocuments();
    if (categoryCount > 0) {
      console.log("🏷️ Categories already exist");
    } else {
      // Create categories
      const categories = await Category.insertMany([
        { name: 'Coffee', slug: 'coffee' },
        { name: 'Tea', slug: 'tea' },
        { name: 'Smoothies', slug: 'smoothies' },
        { name: 'Juices', slug: 'juices' }
      ]);
      console.log("✅ Created categories");
    }
    
    // Check if drinks exist
    const drinkCount = await Drink.countDocuments();
    if (drinkCount > 0) {
      console.log("🍹 Drinks already exist");
    } else {
      // Get categories for reference
      const categories = await Category.find().lean();
      const coffeeCategory = categories.find(c => c.slug === 'coffee')!;
      const teaCategory = categories.find(c => c.slug === 'tea')!;
      const smoothiesCategory = categories.find(c => c.slug === 'smoothies')!;
      const juicesCategory = categories.find(c => c.slug === 'juices')!;
      
      // Create drinks
      const drinks = await Drink.insertMany([
        {
          name: "Iced Caramel Macchiato",
          description: "Rich espresso combined with vanilla-flavored syrup, milk and caramel sauce over ice.",
          price: 4.99,
          image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
          available: true,
          popular: true,
          categoryId: coffeeCategory._id
        },
        {
          name: "Matcha Green Tea Latte",
          description: "Smooth and creamy matcha sweetened just right and served with milk.",
          price: 5.49,
          image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
          available: true,
          popular: true,
          categoryId: teaCategory._id
        },
        {
          name: "Classic Espresso",
          description: "Rich espresso with a caramel-colored crema layer, made from our signature blend.",
          price: 3.49,
          image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
          available: true,
          popular: false,
          categoryId: coffeeCategory._id
        },
        {
          name: "Fresh Orange Juice",
          description: "Freshly squeezed oranges with no added sugar or preservatives.",
          price: 4.29,
          image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
          available: true,
          popular: false,
          categoryId: juicesCategory._id
        },
        {
          name: "Berry Smoothie",
          description: "A blend of strawberries, blueberries, raspberries, yogurt, and honey.",
          price: 5.99,
          image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
          available: true,
          popular: true,
          categoryId: smoothiesCategory._id
        },
        {
          name: "Chai Tea Latte",
          description: "Black tea infused with cinnamon, clove, and other warming spices combined with milk.",
          price: 4.79,
          image: "https://images.unsplash.com/photo-1571066811602-716837d681de?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
          available: true,
          popular: false,
          categoryId: teaCategory._id
        }
      ]);
      console.log("✅ Created drinks");
    }
    
    console.log("✅ MongoDB seed completed successfully");
  } catch (err) {
    console.error("❌ MongoDB seed failed:", err);
  } finally {
    // Don't close the connection if it's being used by the application
    if (process.env.NODE_ENV !== 'production') {
      await mongoose.disconnect();
    }
  }
}

// Run the seed function
seedMongoDB().catch(console.error);

export default seedMongoDB;