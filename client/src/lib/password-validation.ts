import { z } from 'zod';

// Password strength requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
  .max(128, 'Password must be no more than 128 characters long');

// Input sanitization for user inputs
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove basic HTML characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove on* event handlers
    .substring(0, 1000); // Limit length
};

// Email validation
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(255, 'Email must be no more than 255 characters long')
  .transform(sanitizeInput);

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters long')
  .max(50, 'Username must be no more than 50 characters long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
  .transform(sanitizeInput);

// Display name validation
export const displayNameSchema = z
  .string()
  .min(2, 'Display name must be at least 2 characters long')
  .max(100, 'Display name must be no more than 100 characters long')
  .regex(/^[a-zA-Z\s-']+$/, 'Display name can only contain letters, spaces, hyphens, and apostrophes')
  .transform(sanitizeInput);

// Password strength checker
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Include special characters');

  // Additional strength checks
  if (password.length >= 12) score += 0.5;
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    feedback.push('Avoid repeating characters');
  }

  // Common passwords check (basic)
  const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score -= 1;
    feedback.push('Avoid common passwords');
  }

  return {
    score: Math.max(0, Math.min(4, score)),
    feedback: feedback.slice(0, 3), // Limit feedback to 3 items
    isValid: score >= 4
  };
};

// Get password strength color
export const getPasswordStrengthColor = (score: number): string => {
  if (score < 2) return 'text-red-500';
  if (score < 3) return 'text-orange-500';
  if (score < 4) return 'text-yellow-500';
  return 'text-green-500';
};

// Get password strength text
export const getPasswordStrengthText = (score: number): string => {
  if (score < 2) return 'Weak';
  if (score < 3) return 'Fair';
  if (score < 4) return 'Good';
  return 'Strong';
};