import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Today's date for comparison
  const today = new Date();
  const isToday = d.getDate() === today.getDate() &&
                   d.getMonth() === today.getMonth() &&
                   d.getFullYear() === today.getFullYear();
  
  if (isToday) {
    return `Today • ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else {
    return d.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ` • ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
}

export function getInitials(name: string): string {
  if (!name) return '';
  
  const names = name.split(' ');
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
}

export const phoneRegex = /^\+?[0-9]{10,15}$/;

export const phoneSchema = z.string()
  .min(10, { message: "Phone number must be at least 10 digits" })
  .regex(phoneRegex, { message: "Please enter a valid phone number" });

export const otpSchema = z.string()
  .length(4, { message: "OTP must be 4 digits" })
  .regex(/^[0-9]+$/, { message: "OTP must contain only digits" });

export const nameSchema = z.string()
  .min(2, { message: "Name must be at least 2 characters" })
  .max(50, { message: "Name must be less than 50 characters" });

export const addressSchema = z.string()
  .min(5, { message: "Address must be at least 5 characters" })
  .max(200, { message: "Address must be less than 200 characters" });

export const emailSchema = z.string()
  .email({ message: "Please enter a valid email address" })
  .optional()
  .or(z.literal(''));
