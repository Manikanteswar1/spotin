import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import connectDB, { closeDatabase } from "../db/mongodb";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import { storage } from './mongo-storage';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session setup will be added after MongoDB connection

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Setup graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      await closeDatabase();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      await closeDatabase();
      process.exit(0);
    });
    
    // Create a memory store as a fallback
    const MemoryStore = session.MemoryStore;
    const sessionStore = new MemoryStore();
    
    // Configure and add session middleware to app
    app.use(session({
      secret: process.env.SESSION_SECRET || 'coffee_app_secret',
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
      }
    }));
    
    // Assign session store to storage
    storage.sessionStore = sessionStore;
    
    // Set up routes
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error(err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error('Server initialization error:', error);
    process.exit(1);
  }
})();
