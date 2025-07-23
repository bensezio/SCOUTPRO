import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Cookie,
  Eye,
  Lock,
  Globe,
  Mail,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground">
            Learn how Platinum Scout protects your privacy and handles your data
          </p>
          <Badge variant="outline" className="text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </Badge>
        </div>

        {/* Cookie Policy Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5" />
              Cookie Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What Are Cookies?</h3>
                <p className="text-sm text-muted-foreground">
                  Cookies are small text files that are placed on your device
                  when you visit our website. They help us provide you with a
                  better experience by remembering your preferences and
                  understanding how you use our platform.
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold">Types of Cookies We Use</h3>

                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">
                        Strictly Necessary Cookies
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Essential for website functionality, authentication, and
                        security. These cannot be disabled.
                      </p>
                      <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                        <li>User authentication tokens</li>
                        <li>Session management</li>
                        <li>Security and fraud prevention</li>
                        <li>Cookie consent preferences</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Analytics Cookies</h4>
                      <p className="text-sm text-muted-foreground">
                        Help us understand how you use our platform to improve
                        user experience.
                      </p>
                      <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                        <li>Google Analytics for usage statistics</li>
                        <li>Performance monitoring</li>
                        <li>User behavior analysis</li>
                        <li>Feature usage tracking</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Functional Cookies</h4>
                      <p className="text-sm text-muted-foreground">
                        Enable enhanced features and personalisation for a
                        better experience.
                      </p>
                      <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                        <li>Language preferences</li>
                        <li>Theme and display settings</li>
                        <li>Personalized content</li>
                        <li>Saved search preferences</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Data We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Information You Provide</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Account information (name, email, organization)</li>
                  <li>Player data and scouting reports</li>
                  <li>Video uploads and analysis data</li>
                  <li>Communication and support requests</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  Information We Collect Automatically
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Device and browser information</li>
                  <li>IP address and location data</li>
                  <li>Usage patterns and feature interactions</li>
                  <li>Performance and error logs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              How We Use Your Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Provide and maintain our football analytics platform</li>
              <li>Process player data and generate scouting reports</li>
              <li>Improve our AI and machine learning algorithms</li>
              <li>Communicate with you about your account and updates</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </CardContent>
        </Card>

        {/* GDPR Rights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Your Rights Under GDPR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If you are in the European Union, you have the following rights:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>
                  <strong>Right to Access:</strong> Request copies of your
                  personal data
                </li>
                <li>
                  <strong>Right to Rectification:</strong> Correct inaccurate
                  personal data
                </li>
                <li>
                  <strong>Right to Erasure:</strong> Request deletion of your
                  personal data
                </li>
                <li>
                  <strong>Right to Restrict Processing:</strong> Limit how we
                  use your data
                </li>
                <li>
                  <strong>Right to Data Portability:</strong> Transfer your data
                  to another service
                </li>
                <li>
                  <strong>Right to Object:</strong> Object to processing for
                  legitimate interests
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                For questions about this privacy policy or to exercise your
                rights:
              </p>
              <div className="text-sm">
                <p>
                  <strong>Email:</strong> privacy@platinumscout.ai
                </p>
                <p>
                  <strong>Data Protection Officer:</strong> dpo@platinumscout.ai
                </p>
                <p>
                  <strong>Address:</strong> Platinum Scout, Data Protection Team
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Management */}
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5" />
              Managing Your Cookie Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You can manage your cookie preferences at any time through your
                browser settings or by clicking the cookie settings link in the
                footer of our website.
              </p>
              <div className="text-sm">
                <p>
                  <strong>Browser Settings:</strong> Most browsers allow you to
                  control cookies through their settings.
                </p>
                <p>
                  <strong>Cookie Banner:</strong> You can change your
                  preferences using our cookie consent banner.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
