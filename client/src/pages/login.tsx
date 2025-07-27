import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginSuccessful, setLoginSuccessful] = useState(false);

  // Watch for authentication state changes and redirect
  useEffect(() => {
    if (loginSuccessful && isAuthenticated && user) {
      console.log(
        "Auth state updated after login - redirecting user:",
        user.email,
        "Role:",
        user.role,
      );
      setTimeout(() => {
        setLocation("/");
      }, 100); // Small delay to ensure component state is updated
    }
  }, [isAuthenticated, user, loginSuccessful, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (loginLoading) return;

    // Validate fields
    if (!loginData.email?.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (!loginData.password) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoginLoading(true);

      // Use auth context's login function
      await login(loginData.email.trim(), loginData.password);

      toast({
        title: "Success",
        description: "Welcome back! Redirecting to dashboard...",
      });

      // Set flag to trigger redirect when auth state updates
      setLoginSuccessful(true);
    } catch (error: any) {
      // Error handling is now done in auth context
      console.error("Login error:", error);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center animate-slide-in-left">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2 hover:scale-105 transition-transform duration-300">
            Platinum Scout
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced Football Analytics Platform
          </p>
        </div>

        <Card
          className="w-full hover:shadow-xl transition-all duration-500 animate-scale-in"
          style={{ animationDelay: "200ms" }}
        >
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to access advanced analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div
                className="space-y-2 animate-slide-in-right"
                style={{ animationDelay: "300ms" }}
              >
                <Label htmlFor="email">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 hover:border-gray-400"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div
                className="space-y-2 animate-slide-in-right"
                style={{ animationDelay: "400ms" }}
              >
                <Label htmlFor="password">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 hover:border-gray-400"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({
                        ...loginData,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent hover:scale-110 transition-all duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 transition-transform duration-200" />
                    ) : (
                      <Eye className="h-4 w-4 transition-transform duration-200" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full hover:scale-[1.02] hover:shadow-lg transition-all duration-300 animate-scale-in"
                style={{ animationDelay: "500ms" }}
                disabled={loginLoading}
              >
                {loginLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center">
                <Button
                  asChild
                  variant="ghost"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  <Link href="/forgot-password">Forgot your password?</Link>
                </Button>
              </div>
            </form>

            {/* Test Credentials */}
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Test Credentials:</strong>
                <br />
                Scout: scout@demo.com / password123
                <br />
                Agent: agent@scoutpro.com / agent123
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 w-full">
              Need an account?{" "}
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Create one here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
