import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BarChart3 } from "lucide-react";

export default function Terms() {
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
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
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
            Terms & Conditions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Last updated: January 5, 2025
          </p>
        </div>

        <Card>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none p-8">
            <h2>1. Introduction</h2>
            <p>
              Welcome to Platinum Scout ("we," "our," or "us"). These Terms &
              Conditions ("Terms") govern your use of our AI-powered football
              data solutions platform and services located at our website (the
              "Service") operated by Platinum Scout.
            </p>
            <p>
              By accessing or using our Service, you agree to be bound by these
              Terms. If you disagree with any part of these terms, then you may
              not access the Service.
            </p>

            <h2>2. Acceptance of Terms</h2>
            <p>
              By creating an account or using our services, you confirm that you
              accept these Terms and that you agree to comply with them. If you
              do not agree to these Terms, you must not use our Service.
            </p>

            <h2>3. Description of Service</h2>
            <p>
              Platinum Scout provides a comprehensive football analytics
              platform that includes:
            </p>
            <ul>
              <li>Player database and scouting reports</li>
              <li>AI-powered player analysis and comparisons</li>
              <li>Video analysis and performance tracking</li>
              <li>Club and academy management tools</li>
              <li>Market valuation and transfer insights</li>
            </ul>

            <h2>4. User Accounts</h2>
            <h3>4.1 Account Creation</h3>
            <p>
              To access certain features of our Service, you must create an
              account. You must provide accurate, complete, and up-to-date
              information during the registration process.
            </p>
            <h3>4.2 Account Security</h3>
            <p>
              You are responsible for safeguarding the password and all
              activities that occur under your account. You must notify us
              immediately of any unauthorized use of your account.
            </p>
            <h3>4.3 Account Termination</h3>
            <p>
              We may terminate or suspend your account immediately, without
              prior notice, for conduct that we believe violates these Terms or
              is harmful to other users or our business.
            </p>

            <h2>5. User Responsibilities</h2>
            <p>
              You agree to use our Service only for lawful purposes and in
              accordance with these Terms. You agree not to:
            </p>
            <ul>
              <li>
                Use the Service in any way that violates applicable laws or
                regulations
              </li>
              <li>
                Transmit or share any content that is unlawful, harmful, or
                offensive
              </li>
              <li>
                Attempt to gain unauthorized access to our systems or other
                users' accounts
              </li>
              <li>
                Use automated systems to access the Service without our written
                permission
              </li>
              <li>
                Share player data or analytics outside of legitimate scouting
                activities
              </li>
            </ul>

            <h2>6. Intellectual Property Rights</h2>
            <h3>6.1 Our Content</h3>
            <p>
              The Service and its original content, features, and functionality
              are and will remain the exclusive property of Platinum Scout and
              its licensors.
            </p>
            <h3>6.2 User Content</h3>
            <p>
              You retain ownership of any content you submit to our Service. By
              submitting content, you grant us a worldwide, non-exclusive
              license to use, modify, and display such content.
            </p>

            <h2>7. Subscription and Payment Terms</h2>
            <h3>7.1 Subscription Plans</h3>
            <p>
              We offer various subscription plans with different features and
              pricing. Details of current plans are available on our pricing
              page.
            </p>
            <h3>7.2 Payment</h3>
            <p>
              Subscription fees are charged in advance on a monthly or annual
              basis. All payments are non-refundable except as required by law.
            </p>
            <h3>7.3 Auto-Renewal</h3>
            <p>
              Subscriptions automatically renew unless cancelled before the
              renewal date. You may cancel your subscription at any time through
              your account settings.
            </p>

            <h2>8. Data Protection and Privacy</h2>
            <p>
              We are committed to protecting your privacy and personal data. Our
              Privacy Policy explains how we collect, use, and protect your
              information when you use our Service.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              In no event shall Platinum Scout be liable for any indirect,
              incidental, special, consequential, or punitive damages, including
              loss of profits, data, or goodwill, arising from your use of the
              Service.
            </p>

            <h2>10. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an "as is" and "as available" basis. We
              make no representations or warranties of any kind, express or
              implied, regarding the Service's operation or content.
            </p>

            <h2>11. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Platinum Scout
              from any claims, damages, or expenses arising from your use of the
              Service or violation of these Terms.
            </p>

            <h2>12. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the
              laws of England and Wales, without regard to conflict of law
              principles.
            </p>

            <h2>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will
              notify users of significant changes via email or through the
              Service. Continued use after changes constitutes acceptance.
            </p>

            <h2>14. Contact Information</h2>
            <p>
              If you have any questions about these Terms & Conditions, please
              contact us at:
            </p>
            <ul>
              <li>Email: legal@platinumscout.ai</li>
              <li>Address: London, United Kingdom</li>
            </ul>

            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Agreement</h3>
              <p className="text-sm">
                By using Platinum Scout, you acknowledge that you have read,
                understood, and agree to be bound by these Terms & Conditions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
