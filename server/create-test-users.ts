import { db } from './db.js';
import { users } from '../shared/schema.js';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

const testUsers = [
  {
    email: 'demo-freemium@platinumscout.ai',
    password: 'Demo123!',
    username: 'demo-freemium',
    displayName: 'Demo Freemium User',
    role: 'scout',
    subscriptionTier: 'freemium'
  },
  {
    email: 'demo-scoutpro@platinumscout.ai',
    password: 'Demo123!',
    username: 'demo-scoutpro',
    displayName: 'Demo ScoutPro User',
    role: 'scout',
    subscriptionTier: 'scoutpro'
  },
  {
    email: 'demo-agent@platinumscout.ai',
    password: 'Demo123!',
    username: 'demo-agent',
    displayName: 'Demo Agent User',
    role: 'agent',
    subscriptionTier: 'agent_club'
  },
  {
    email: 'demo-enterprise@platinumscout.ai',
    password: 'Demo123!',
    username: 'demo-enterprise',
    displayName: 'Demo Enterprise User',
    role: 'club_director',
    subscriptionTier: 'enterprise'
  },
  {
    email: 'demo-platinum@platinumscout.ai',
    password: 'Demo123!',
    username: 'demo-platinum',
    displayName: 'Demo Platinum User',
    role: 'club_director',
    subscriptionTier: 'platinum'
  },
  {
    email: 'demo-admin@platinumscout.ai',
    password: 'Demo123!',
    username: 'demo-admin',
    displayName: 'Demo Admin User',
    role: 'admin',
    subscriptionTier: 'enterprise'
  },
  {
    email: 'demo-superadmin@platinumscout.ai',
    password: 'Demo123!',
    username: 'demo-superadmin',
    displayName: 'Demo Super Admin User',
    role: 'super_admin',
    subscriptionTier: 'platinum'
  }
];

async function createTestUsers() {
  console.log('Creating test users...');
  
  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
      
      if (existingUser.length > 0) {
        console.log(`User ${userData.email} already exists, updating...`);
        
        // Update existing user with correct password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await db.update(users).set({
          password: hashedPassword,
          username: userData.username,
          displayName: userData.displayName,
          role: userData.role,
          subscriptionTier: userData.subscriptionTier,
          isActive: true,
          isEmailVerified: true,
          isSuspended: false,
          loginAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date()
        }).where(eq(users.email, userData.email));
        
        console.log(`✅ Updated user: ${userData.email} (${userData.subscriptionTier})`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const newUser = await db.insert(users).values({
        email: userData.email,
        password: hashedPassword,
        username: userData.username,
        displayName: userData.displayName,
        role: userData.role,
        subscriptionTier: userData.subscriptionTier,
        isActive: true,
        isEmailVerified: true,
        isSuspended: false,
        loginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log(`✅ Created user: ${userData.email} (${userData.subscriptionTier})`);
      
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }
  
  console.log('\nTest user creation complete!');
  console.log('\n=== Test Credentials ===');
  testUsers.forEach(user => {
    console.log(`${user.subscriptionTier}: ${user.email} / ${user.password}`);
  });
  console.log('========================');
}

createTestUsers().then(() => process.exit(0));