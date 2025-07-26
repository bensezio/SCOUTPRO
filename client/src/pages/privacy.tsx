import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BarChart3 } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="border-b bg-white dark:bg-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Platinum Scout
                </span>
              </div>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Last updated: January 5, 2025
          </p>
        </div>

        <Card>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none p-8">
            <h2>1. Introduction</h2>
            <p>
              Platinum Scout ("we," "us," or "our") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our AI-powered football data solutions platform and services.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>2.1 Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide, including:</p>
            <ul>
              <li>Name and contact information (email address, phone number)</li>
              <li>Professional details (club affiliation, role, location)</li>
              <li>Account credentials and profile information</li>
              <li>Payment and billing information</li>
              <li>Communications with our support team</li>
            </ul>

            <h3>2.2 Usage Information</h3>
            <p>We automatically collect certain information when you use our Service:</p>
            <ul>
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage patterns and preferences</li>
              <li>Log data and analytics</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3>2.3 Player Data</h3>
            <p>
              As part of our football analytics service, we collect and process publicly available 
              player information, including performance statistics, career history, and video content 
              for legitimate scouting purposes.
            </p>

            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide and maintain our Service</li>
              <li>Process transactions and manage subscriptions</li>
              <li>Communicate with you about your account and our services</li>
              <li>Improve our platform and develop new features</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>

            <h2>4. Information Sharing and Disclosure</h2>
            <h3>4.1 We Do Not Sell Your Data</h3>
            <p>
              We do not sell, trade, or rent your personal information to third parties for 
              commercial purposes.
            </p>

            <h3>4.2 When We May Share Information</h3>
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li>With your explicit consent</li>
              <li>To comply with legal requirements or court orders</li>
              <li>To protect our rights, property, or safety</li>
              <li>With service providers who assist in operating our platform</li>
              <li>In connection with a business transaction (merger, acquisition)</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information, including:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Multi-factor authentication</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and employee training</li>
              <li>GDPR and data protection compliance</li>
            </ul>

            <h2>6. Your Rights and Choices</h2>
            <h3>6.1 Data Subject Rights (GDPR)</h3>
            <p>If you are located in the EU/UK, you have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Rectify inaccurate information</li>
              <li>Erase your data (right to be forgotten)</li>
              <li>Restrict processing</li>
              <li>Data portability</li>
              <li>Object to processing</li>
              <li>Withdraw consent</li>
            </ul>

            <h3>6.2 Communication Preferences</h3>
            <p>
              You can control your communication preferences through your account settings or by 
              contacting us directly. You may opt out of marketing communications at any time.
            </p>

            <h2>7. Marketing Communications</h2>
            <h3>7.1 Consent for Marketing</h3>
            <p>
              We may send you marketing communications about our services, exclusive offers, and 
              football industry insights. You can control these preferences during registration 
              or in your account settings.
            </p>
            <h3>7.2 Opt-Out</h3>
            <p>
              You may unsubscribe from marketing emails at any time by clicking the unsubscribe 
              link in our emails or updating your preferences in your account.
            </p>

            <h2>8. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, analyze usage, 
              and provide personalized content. You can control cookie preferences through your 
              browser settings.
            </p>

            <h2>9. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services 
              and comply with legal obligations. Account data is typically retained for the duration 
              of your subscription plus a reasonable period for backup and legal purposes.
            </p>

            <h2>10. International Data Transfers</h2>
            <p>
              Your information may be transferred and processed in countries outside your jurisdiction. 
              We ensure appropriate safeguards are in place to protect your data in accordance with 
              applicable laws.
            </p>

            <h2>11. Children's Privacy</h2>
            <p>
              Our Service is not intended for users under 16 years of age. We do not knowingly 
              collect personal information from children under 16. If we discover such information, 
              we will delete it promptly.
            </p>

            <h2>12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant 
              changes by email or through our Service. Your continued use after changes constitutes 
              acceptance of the updated policy.
            </p>

            <h2>13. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your rights, 
              please contact us:
            </p>
            <ul>
              <li>Email: privacy@platinumedge.com</li>
              <li>Data Protection Officer: dpo@platinumedge.com</li>
              <li>Address: London, United Kingdom</li>
            </ul>

            <div className="mt-8 space-y-4">
              <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-green-800 dark:text-green-200">
                  Your Data, Your Control
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  We believe in transparency and giving you full control over your personal information. 
                  Contact us anytime to exercise your privacy rights.
                </p>
              </div>

              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">
                  Marketing Consent
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  We'd like to send you exclusive offers and the latest information about football 
                  analytics from time to time. We'll always treat your personal details with the 
                  utmost care and you can unsubscribe at any time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}