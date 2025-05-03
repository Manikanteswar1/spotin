import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { verifyOtpSchema, adminLoginSchema } from "@shared/schema";

// Secret for JWT (should be in .env in a real app)
const JWT_SECRET = process.env.JWT_SECRET || "sip-and-savor-secret";
const JWT_EXPIRES_IN = "7d";
const ADMIN_JWT_EXPIRES_IN = "1d";

// Generate JWT for a user
export function generateUserToken(userId: number) {
  return jwt.sign({ userId, type: "user" }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Generate JWT for an admin
export function generateAdminToken(adminId: number) {
  return jwt.sign({ adminId, type: "admin" }, JWT_SECRET, { expiresIn: ADMIN_JWT_EXPIRES_IN });
}

// Verify OTP (dummy implementation for demo)
export function verifyOtp(phone: string, otp: string): boolean {
  // For demo, we'll accept any 4-digit OTP (in a real app, this would verify against a stored OTP)
  return otp.length === 4 && /^\d+$/.test(otp);
}

// Middleware to authenticate user tokens
export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, type: string };
    
    if (decoded.type !== "user") {
      return res.status(403).json({ message: "Forbidden: Invalid token type" });
    }
    
    // Add userId to request object
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

// Middleware to authenticate admin tokens
export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: number, type: string };
    
    if (decoded.type !== "admin") {
      return res.status(403).json({ message: "Forbidden: Invalid token type" });
    }
    
    // Add adminId to request object
    (req as any).adminId = decoded.adminId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

// Validate request body with Zod schema
export function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  handler: (req: Request, res: Response, validData: z.infer<T>) => Promise<void>
) {
  return async (req: Request, res: Response) => {
    try {
      const validData = schema.parse(req.body);
      await handler(req, res, validData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Validation error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  };
}
