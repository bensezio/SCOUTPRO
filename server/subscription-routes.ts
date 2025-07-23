import type { Express } from "express";
import Stripe from "stripe";
import { authenticateToken, requireAdmin, requireSuperAdmin, AuthenticatedRequest } from "./auth-routes";
import { storage } from "./storage.js";
import { Response } from "express";

// Use STRIPE_API_KEY from environment (user's new key)
const stripeApiKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;

if (!stripeApiKey) {
  throw new Error('Missing required Stripe secret: STRIPE_API_KEY or STRIPE_SECRET_KEY');
}

const stripe = new Stripe(stripeApiKey, {
  apiVersion: "2024-06-20",
});

// Import the unified subscription tiers
import { SUBSCRIPTION_TIERS } from '../shared/subscription-tiers.js';

// Subscription plans configuration with test-compatible price IDs
// For production, replace these with actual Stripe Price IDs from your dashboard
const SUBSCRIPTION_PLANS = {
  pro: {
    name: 'Pro',
    monthly_price_id: process.env.STRIPE_PRO_MONTHLY_PRICE || 'price_1OHWOKDGo6F59D5t6qhX1P8L', // Test: $79/month
    yearly_price_id: process.env.STRIPE_PRO_YEARLY_PRICE || 'price_1OHWOLDGo6F59D5t9zTw3kEb',   // Test: $790/year
    features: SUBSCRIPTION_TIERS.pro.features,
    maxCredits: SUBSCRIPTION_TIERS.pro.limits.monthlyCredits,
    maxUsers: 1
  },
  enterprise: {
    name: 'Enterprise',
    monthly_price_id: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE || 'price_1OHWOODGo6F59D5tKlM8pQrS', // Test: $299/month
    yearly_price_id: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE || 'price_1OHWOPDGo6F59D5tVwX3yZnC',   // Test: $2990/year
    features: SUBSCRIPTION_TIERS.enterprise.features,
    maxCredits: SUBSCRIPTION_TIERS.enterprise.limits.monthlyCredits,
    maxUsers: -1
  }
};

export function registerSubscriptionRoutes(app: Express) {
  
  // Create Stripe Checkout Session
  app.post('/api/create-checkout-session', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { planId, billingInterval = 'monthly' } = req.body;
      const user = req.user!;

      if (!planId || !SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
        return res.status(400).json({ error: 'Invalid plan ID' });
      }

      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      let priceId = billingInterval === 'yearly' ? plan.yearly_price_id : plan.monthly_price_id;
      
      // For testing, create a test product if no real price ID is configured
      if (priceId.startsWith('price_1OHW')) {
        console.log(`Creating test product for ${planId} plan (${billingInterval})`);
        
        try {
          const testProduct = await stripe.products.create({
            name: `PlatinumEdge ${plan.name} (Test)`,
            description: `Test product for ${plan.name} subscription - Development Mode`,
          });

          // Get the correct pricing from SUBSCRIPTION_TIERS
          const tierPrice = SUBSCRIPTION_TIERS[planId as keyof typeof SUBSCRIPTION_TIERS];
          const monthlyAmount = tierPrice ? tierPrice.price * 100 : 9900; // Convert to cents
          const yearlyAmount = tierPrice ? tierPrice.priceYearly * 100 : monthlyAmount * 10; // Convert to cents
          const testPrice = await stripe.prices.create({
            product: testProduct.id,
            unit_amount: billingInterval === 'yearly' ? yearlyAmount : monthlyAmount,
            currency: 'usd',
            recurring: { interval: billingInterval === 'yearly' ? 'year' : 'month' },
          });

          priceId = testPrice.id;
          console.log(`✅ Created test price: ${priceId} for ${planId} (${billingInterval})`);
        } catch (testError: any) {
          console.error('❌ Test product creation failed:', testError.message);
          return res.status(500).json({ 
            error: 'Test product creation failed',
            details: testError.message,
            solution: 'Configure proper Stripe products using STRIPE-SETUP-GUIDE.md'
          });
        }
      }

      // Create Stripe customer if doesn't exist
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.displayName,
          metadata: {
            userId: user.id.toString(),
            platform: 'platinumedge'
          }
        });
        
        // Update user with Stripe customer ID
        await storage.updateUser(user.id, {
          stripeCustomerId: customer.id
        });
        
        customerId = customer.id;
      }

      // Create checkout session with PlatinumEdge branding
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `https://${req.get('host')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://${req.get('host')}/pricing?cancelled=true`,
        metadata: {
          userId: user.id.toString(),
          planId: planId
        },
        subscription_data: {
          metadata: {
            userId: user.id.toString(),
            planId: planId
          }
        },
        // PlatinumEdge branding
        custom_text: {
          submit: {
            message: 'Start your journey with PlatinumEdge Analytics - Africa\'s leading football scouting platform'
          }
        },
        // Custom colors for PlatinumEdge brand
        ui_mode: 'hosted',
        locale: 'en'
      });

      res.json({ 
        success: true,
        sessionUrl: session.url,
        sessionId: session.id 
      });

    } catch (error: any) {
      console.error('Checkout session creation error:', error);
      res.status(500).json({ 
        error: 'Failed to create checkout session',
        details: error.message 
      });
    }
  });

  // Create subscription (legacy method - keeping for compatibility)
  app.post('/api/create-subscription', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { priceId, planId } = req.body;
      const user = req.user!;

      // Create or retrieve Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: user.id.toString(),
            role: user.role
          }
        });
        
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateUser(user.id, {
          stripeCustomerId: customer.id
        });
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price: priceId,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user.id.toString(),
          planId: planId
        }
      });

      // Update user subscription info
      await storage.updateUser(user.id, {
        stripeSubscriptionId: subscription.id,
        subscriptionTier: planId,
        subscriptionStatus: 'pending'
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });

    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get current subscription
  app.get('/api/subscription', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      
      if (!user.stripeSubscriptionId) {
        return res.json({
          subscription: null,
          plan: 'free',
          status: 'inactive',
          creditsRemaining: user.creditsRemaining || 5
        });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      res.json({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          planId: subscription.metadata.planId,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        },
        plan: user.subscriptionTier,
        status: user.subscriptionStatus,
        creditsRemaining: user.creditsRemaining
      });

    } catch (error: any) {
      console.error('Subscription retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve subscription' });
    }
  });

  // Cancel subscription
  app.post('/api/cancel-subscription', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ error: 'No active subscription found' });
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      res.json({
        message: 'Subscription will be cancelled at the end of the current period',
        cancelAt: subscription.current_period_end
      });

    } catch (error: any) {
      console.error('Subscription cancellation error:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  // Verify checkout session
  app.post('/api/verify-checkout-session', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.body;
      const user = req.user!;

      // Retrieve the checkout session
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer']
      });

      if (session.customer_details?.email !== user.email) {
        return res.status(403).json({ error: 'Session does not belong to this user' });
      }

      // If subscription was created, update user
      if (session.subscription) {
        const subscription = session.subscription as Stripe.Subscription;
        const planId = session.metadata?.planId;
        
        if (planId && SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
          const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
          
          await storage.updateUser(user.id, {
            subscriptionStatus: 'active',
            subscriptionTier: planId,
            stripeSubscriptionId: subscription.id,
            creditsRemaining: plan.maxCredits === -1 ? 999999 : plan.maxCredits,
            subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
          });

          res.json({
            success: true,
            planName: plan.name,
            interval: subscription.items.data[0]?.price?.recurring?.interval || 'month',
            nextBilling: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
            credits: plan.maxCredits === -1 ? 'Unlimited' : plan.maxCredits,
            maxUsers: plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers
          });
        } else {
          res.status(400).json({ error: 'Invalid plan configuration' });
        }
      } else {
        res.status(400).json({ error: 'No subscription found in session' });
      }

    } catch (error: any) {
      console.error('Session verification error:', error);
      res.status(500).json({ 
        error: 'Failed to verify session',
        details: error.message 
      });
    }
  });

  // Stripe webhook for subscription events
  app.post('/api/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test');
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handler error:', error);
      return res.status(500).json({ error: 'Webhook handler failed' });
    }

    res.json({ received: true });
  });

  // Purchase credits (one-time payment)
  app.post('/api/purchase-credits', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, credits } = req.body; // amount in cents, credits to add
      const user = req.user!;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        customer: user.stripeCustomerId || undefined,
        metadata: {
          type: 'credit_purchase',
          userId: user.id.toString(),
          credits: credits.toString()
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        credits: credits
      });

    } catch (error: any) {
      console.error('Credit purchase error:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  // Get pricing information
  app.get('/api/pricing', async (req, res) => {
    try {
      // Return current pricing structure
      res.json({
        plans: SUBSCRIPTION_PLANS,
        creditPacks: [
          { credits: 10, price: 1000, description: '10 AI analyses' }, // $10
          { credits: 50, price: 4500, description: '50 AI analyses (10% discount)' }, // $45
          { credits: 100, price: 8000, description: '100 AI analyses (20% discount)' }, // $80
          { credits: 250, price: 18750, description: '250 AI analyses (25% discount)' } // $187.50
        ]
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve pricing' });
    }
  });

  // Subscription analytics endpoint - Admin only
  app.get('/api/subscription/analytics', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      
      // Mock analytics data - in production, this would query actual usage data
      const analytics = {
        totalSpent: 299.99,
        creditsUsed: 45,
        creditsTotal: user.subscriptionTier === 'free' ? 5 : 
                     user.subscriptionTier === 'academy' ? 500 : -1,
        monthlyUsage: {
          playerAnalysis: 25,
          playerComparison: 15,
          reportGeneration: 5,
          total: 45
        },
        usageTrends: [
          { date: '2025-06-01', usage: 12 },
          { date: '2025-06-15', usage: 18 },
          { date: '2025-07-01', usage: 25 }
        ]
      };

      res.json(analytics);
    } catch (error: any) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to retrieve analytics' });
    }
  });

  // Partnership management endpoints - Admin only
  app.get('/api/partnerships', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Mock partnerships data - in production, this would query the brandPartnerships table
      const partnerships = [
        {
          id: 1,
          brandName: 'Nike',
          partnershipType: 'affiliate',
          commissionRate: 5.0,
          isActive: true,
          contactEmail: 'partnerships@nike.com',
          contractStart: '2025-01-01',
          contractEnd: '2025-12-31',
          totalRevenue: 2500.00,
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 2,
          brandName: 'Adidas',
          partnershipType: 'sponsorship',
          commissionRate: 8.0,
          isActive: true,
          contactEmail: 'sponsorship@adidas.com',
          contractStart: '2025-02-01',
          contractEnd: '2026-02-01',
          totalRevenue: 1800.00,
          createdAt: '2025-02-01T00:00:00Z'
        }
      ];

      res.json(partnerships);
    } catch (error: any) {
      console.error('Partnerships error:', error);
      res.status(500).json({ error: 'Failed to retrieve partnerships' });
    }
  });

  app.get('/api/partnerships/analytics', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Mock partnership analytics
      const analytics = {
        totalRevenue: 4300.00,
        monthlyRevenue: 650.00,
        averageCommission: 6.5,
        activePartnerships: 2,
        pendingCommissions: 450.00
      };

      res.json(analytics);
    } catch (error: any) {
      console.error('Partnership analytics error:', error);
      res.status(500).json({ error: 'Failed to retrieve partnership analytics' });
    }
  });

  app.post('/api/partnerships', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { brandName, partnershipType, commissionRate, contactEmail, contractStart, contractEnd } = req.body;
      
      // Mock creation - in production, this would insert into brandPartnerships table
      const newPartnership = {
        id: Date.now(), // Mock ID
        brandName,
        partnershipType,
        commissionRate,
        isActive: true,
        contactEmail,
        contractStart,
        contractEnd,
        totalRevenue: 0,
        createdAt: new Date().toISOString()
      };

      res.status(201).json(newPartnership);
    } catch (error: any) {
      console.error('Partnership creation error:', error);
      res.status(500).json({ error: 'Failed to create partnership' });
    }
  });

  app.put('/api/partnerships/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Mock update - in production, this would update the brandPartnerships table
      res.json({ id: parseInt(id), ...updateData, updatedAt: new Date().toISOString() });
    } catch (error: any) {
      console.error('Partnership update error:', error);
      res.status(500).json({ error: 'Failed to update partnership' });
    }
  });

  app.delete('/api/partnerships/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Mock deletion - in production, this would delete from brandPartnerships table
      res.json({ message: 'Partnership deleted successfully' });
    } catch (error: any) {
      console.error('Partnership deletion error:', error);
      res.status(500).json({ error: 'Failed to delete partnership' });
    }
  });
}

// Webhook handlers
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const userId = parseInt(subscription.metadata.userId);
  const planId = subscription.metadata.planId;
  
  if (userId && planId) {
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
    
    await storage.updateUser(userId, {
      subscriptionStatus: 'active',
      subscriptionTier: planId,
      creditsRemaining: plan.maxCredits === -1 ? 999999 : plan.maxCredits,
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
    });
    
    console.log(`Subscription activated for user ${userId}, plan: ${planId}`);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const userId = parseInt(subscription.metadata.userId);
  
  if (userId) {
    await storage.updateUser(userId, {
      subscriptionStatus: 'past_due'
    });
    
    console.log(`Payment failed for user ${userId}`);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = parseInt(subscription.metadata.userId);
  
  if (userId) {
    await storage.updateUser(userId, {
      subscriptionStatus: subscription.status,
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
    });
    
    console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = parseInt(subscription.metadata.userId);
  
  if (userId) {
    await storage.updateUser(userId, {
      subscriptionStatus: 'cancelled',
      subscriptionTier: 'free',
      creditsRemaining: 5, // Reset to free tier
      stripeSubscriptionId: null
    });
    
    console.log(`Subscription cancelled for user ${userId}`);
  }
}