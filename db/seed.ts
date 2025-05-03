import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");

    // Check if admin exists
    const existingAdmin = await db.query.admins.findFirst({
      where: eq(schema.admins.username, "admin")
    });

    if (!existingAdmin) {
      // Create admin user
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.insert(schema.admins).values({
        username: "admin",
        password: hashedPassword
      });
      console.log("✅ Admin created");
    } else {
      console.log("👤 Admin already exists");
    }

    // Create categories if they don't exist
    const existingCategories = await db.query.categories.findMany();
    const categoryData = [
      { name: "Coffee", slug: "coffee" },
      { name: "Tea", slug: "tea" },
      { name: "Smoothies", slug: "smoothies" },
      { name: "Juices", slug: "juices" }
    ];

    if (existingCategories.length === 0) {
      await db.insert(schema.categories).values(categoryData);
      console.log("✅ Categories created");
    } else {
      console.log("🏷️ Categories already exist");
    }

    // Fetch categories for drink creation
    const categories = await db.query.categories.findMany();
    const categoryMap = new Map(categories.map(c => [c.slug, c.id]));

    // Create drinks if they don't exist
    const existingDrinks = await db.query.drinks.findMany();
    
    if (existingDrinks.length === 0) {
      const drinksData = [
        {
          name: "Iced Caramel Macchiato",
          description: "Rich espresso combined with vanilla-flavored syrup, milk and caramel sauce over ice.",
          price: "4.99",
          image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
          categoryId: categoryMap.get("coffee"),
          popular: true
        },
        {
          name: "Matcha Green Tea Latte",
          description: "Smooth and creamy matcha sweetened just right and served with milk.",
          price: "5.49",
          image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
          categoryId: categoryMap.get("tea"),
          popular: true
        },
        {
          name: "Classic Espresso",
          description: "Rich espresso with a caramel-colored crema layer, made from our signature blend.",
          price: "3.49",
          image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
          categoryId: categoryMap.get("coffee")
        },
        {
          name: "Fresh Orange Juice",
          description: "Freshly squeezed oranges with no added sugar or preservatives.",
          price: "4.29",
          image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
          categoryId: categoryMap.get("juices")
        },
        {
          name: "Berry Smoothie",
          description: "A blend of strawberries, blueberries, raspberries, yogurt, and honey.",
          price: "5.99",
          image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
          categoryId: categoryMap.get("smoothies")
        },
        {
          name: "Chai Tea Latte",
          description: "Black tea infused with cinnamon, clove, and other warming spices combined with milk.",
          price: "4.79",
          image: "https://images.unsplash.com/photo-1571066811602-716837d681de?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
          categoryId: categoryMap.get("tea")
        }
      ];

      for (const drink of drinksData) {
        await db.insert(schema.drinks).values(drink);
      }
      console.log("✅ Drinks created");
    } else {
      console.log("🍹 Drinks already exist");
    }

    console.log("✅ Seed completed successfully");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  }
}

seed();
