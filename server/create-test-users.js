// Test user creation script
const { db } = require('./db.js');
const { users } = require('../shared/schema.js');
const bcrypt = require('bcryptjs');

const testUsers = [
  {
    email: 'demo-freemium@platinumedge.com',
    password: 'Demo123!',
    username: 'demo-freemium',
    displayName: 'Demo Freemium User',
    role: 'scout',
    subscriptionTier: 'freemium',
    isActive: true,
    isEmailVerified: true,
    isSuspended: false
  },
  {
    email: 'demo-scoutpro@platinumedge.com',
    password: 'Demo123!',
    username: 'demo-scoutpro',
    displayName: 'Demo ScoutPro User',
    role: 'scout',
    subscriptionTier: 'scoutpro',
    isActive: true,
    isEmailVerified: true,
    isSuspended: false
  },
  {
    email: 'demo-agent@platinumedge.com',
    password: 'Demo123!',
    username: 'demo-agent',
    displayName: 'Demo Agent User',
    role: 'agent',
    subscriptionTier: 'agent_club',
    isActive: true,
    isEmailVerified: true,
    isSuspended: false
  },
  {
    email: 'demo-enterprise@platinumedge.com',
    password: 'Demo123!',
    username: 'demo-enterprise',
    displayName: 'Demo Enterprise User',
    role: 'club_director',
    subscriptionTier: 'enterprise',
    isActive: true,
    isEmailVerified: true,
    isSuspended: false
  },
  {
    email: 'demo-platinum@platinumedge.com',
    password: 'Demo123!',
    username: 'demo-platinum',
    displayName: 'Demo Platinum User',
    role: 'club_director',
    subscriptionTier: 'platinum',
    isActive: true,
    isEmailVerified: true,
    isSuspended: false
  },
  {
    email: 'demo-admin@platinumedge.com',
    password: 'Demo123!',
    username: 'demo-admin',
    displayName: 'Demo Admin User',
    role: 'admin',
    subscriptionTier: 'enterprise',
    isActive: true,
    isEmailVerified: true,
    isSuspended: false
  },
  {
    email: 'demo-superadmin@platinumedge.com',
    password: 'Demo123!',
    username: 'demo-superadmin',
    displayName: 'Demo Super Admin User',
    role: 'super_admin',
    subscriptionTier: 'platinum',
    isActive: true,
    isEmailVerified: true,
    isSuspended: false
  }
];

async function createTestUsers() {
  console.log('Creating test users...');
  
  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await db.select().from(users).where(users.email.eq(userData.email)).limit(1);
      
      if (existingUser.length > 0) {
        console.log(`User ${userData.email} already exists, skipping...`);
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
        isActive: userData.isActive,
        isEmailVerified: userData.isEmailVerified,
        isSuspended: userData.isSuspended,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log(`✅ Created user: ${userData.email} (${userData.subscriptionTier})`);
      
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }
  
  console.log('\nTest user creation complete!');
  process.exit(0);
}

createTestUsers();