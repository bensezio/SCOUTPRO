import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  passwordSchema,
  emailSchema,
  usernameSchema,
  displayNameSchema,
  checkPasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthText,
  sanitizeInput,
} from "@/lib/password-validation";

// Error parsing helper for registration
const parseRegistrationError = (error: any): string[] => {
  try {
    let errorData = error;

    // Handle TanStack Query error format - check if message contains JSON
    if (error?.message && typeof error.message === "string") {
      // Handle the format: "400: {\"error\":\"Validation failed\",\"details\":[...]}"
      const statusMatch = error.message.match(/(\d+):\s*(.+)/);
      if (statusMatch) {
        try {
          errorData = JSON.parse(statusMatch[2]);
        } catch {
          return [statusMatch[2]];
        }
      } else {
        return [error.message];
      }
    }

    // Check other common error properties
    if (error?.response?.data) {
      errorData = error.response.data;
    } else if (error?.data) {
      errorData = error.data;
    } else if (error?.serializedData) {
      // Handle apiRequest serialized error data
      try {
        errorData = JSON.parse(error.serializedData);
      } catch {
        errorData = error.serializedData;
      }
    }

    // Handle the backend validation format: { error: "Validation failed", details: [...] }
    if (
      errorData &&
      typeof errorData === "object" &&
      errorData.details &&
      Array.isArray(errorData.details)
    ) {
      const messages = errorData.details
        .map((detail: any) => {
          if (detail.message) {
            return detail.message;
          }
          // Fallback construction
          const fieldName =
            Array.isArray(detail.path) && detail.path.length > 0
              ? detail.path[detail.path.length - 1]
              : "Field";
          const fieldDisplayName = getFieldDisplayName(fieldName);
          return `${fieldDisplayName} ${getValidationMessage(detail.code)}`;
        })
        .filter(Boolean);

      return messages.length > 0 ? messages : ["Please check your input"];
    }

    // Handle direct array format (what you're seeing in the UI)
    if (Array.isArray(errorData)) {
      const messages = errorData
        .map((err: any) => {
          if (typeof err === "string") return err;
          if (err.message) return err.message;

          // Handle Zod validation error format
          if (err.code) {
            const fieldName =
              Array.isArray(err.path) && err.path.length > 0
                ? err.path[err.path.length - 1]
                : "Field";
            const fieldDisplayName = getFieldDisplayName(fieldName);
            return `${fieldDisplayName} ${getValidationMessage(err.code)}`;
          }

          return "Invalid input";
        })
        .filter(Boolean);

      return messages.length > 0 ? messages : ["Please check your input"];
    }

    // Handle single error object
    if (errorData && typeof errorData === "object") {
      if (errorData.message) return [errorData.message];
      if (errorData.error && typeof errorData.error === "string")
        return [errorData.error];
    }

    // Handle string errors
    if (typeof errorData === "string") {
      return [errorData];
    }

    return [
      "Registration failed. Please check your information and try again.",
    ];
  } catch (parseError) {
    return ["Registration failed. Please try again."];
  }
};

// Helper to convert field names to display names
const getFieldDisplayName = (fieldName: string): string => {
  const fieldNames: Record<string, string> = {
    email: "Email address",
    username: "Username",
    password: "Password",
    confirmPassword: "Password confirmation",
    displayName: "Display name",
    firstName: "First name",
    lastName: "Last name",
    role: "Role",
  };

  return fieldNames[fieldName] || fieldName;
};

// Helper to convert validation codes to user-friendly messages
const getValidationMessage = (
  code: string,
  minimum?: number,
  maximum?: number,
): string => {
  const messages: Record<string, string> = {
    invalid_string: "must be valid text",
    invalid_type: "must be the correct type",
    too_small: minimum
      ? `must be at least ${minimum} characters`
      : "is too short",
    too_big: maximum
      ? `must be no more than ${maximum} characters`
      : "is too long",
    invalid_email: "must be a valid email address",
    custom: "is invalid",
    regex: "contains invalid characters",
  };

  return messages[code] || "is invalid";
};

interface RegisterData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function Register() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [registerData, setRegisterData] = useState<RegisterData>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    firstName: "",
    lastName: "",
    role: "scout",
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Override setValidationErrors to ALWAYS ensure strings only
  const setValidationErrorsSafe = (
    updater:
      | ((prev: Record<string, string>) => Record<string, string>)
      | Record<string, string>,
  ) => {
    if (typeof updater === "function") {
      setValidationErrors((prev) => {
        const newErrors = updater(prev);
        const safeErrors: Record<string, string> = {};

        for (const [key, value] of Object.entries(newErrors)) {
          if (typeof value === "string") {
            // Handle stringified JSON arrays (like your console output)
            if (value.trim().startsWith("[") && value.includes('"message"')) {
              try {
                const parsed = JSON.parse(value);
                if (
                  Array.isArray(parsed) &&
                  parsed.length > 0 &&
                  parsed[0]?.message
                ) {
                  safeErrors[key] = parsed[0].message;
                } else {
                  safeErrors[key] = "Please check your input";
                }
              } catch (e) {
                // If JSON parsing fails, extract message manually
                const messageMatch = value.match(/"message":\s*"([^"]+)"/);
                if (messageMatch) {
                  safeErrors[key] = messageMatch[1];
                } else {
                  safeErrors[key] = "Please check your input";
                }
              }
            } else {
              safeErrors[key] = value;
            }
          } else if (
            Array.isArray(value) &&
            value.length > 0 &&
            value[0]?.message
          ) {
            safeErrors[key] = value[0].message;
          } else {
            safeErrors[key] = "Please check your input";
          }
        }
        return safeErrors;
      });
    } else {
      const safeErrors: Record<string, string> = {};
      for (const [key, value] of Object.entries(updater)) {
        if (typeof value === "string") {
          // Handle stringified JSON arrays (like your console output)
          if (value.trim().startsWith("[") && value.includes('"message"')) {
            try {
              const parsed = JSON.parse(value);
              if (
                Array.isArray(parsed) &&
                parsed.length > 0 &&
                parsed[0]?.message
              ) {
                safeErrors[key] = parsed[0].message;
              } else {
                safeErrors[key] = "Please check your input";
              }
            } catch (e) {
              // If JSON parsing fails, extract message manually
              const messageMatch = value.match(/"message":\s*"([^"]+)"/);
              if (messageMatch) {
                safeErrors[key] = messageMatch[1];
              } else {
                safeErrors[key] = "Please check your input";
              }
            }
          } else {
            safeErrors[key] = value;
          }
        } else if (
          Array.isArray(value) &&
          value.length > 0 &&
          value[0]?.message
        ) {
          safeErrors[key] = value[0].message;
        } else {
          safeErrors[key] = "Please check your input";
        }
      }
      setValidationErrors(safeErrors);
    }
  };
  const [passwordStrength, setPasswordStrength] = useState(
    checkPasswordStrength(""),
  );
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [parsedErrorMessages, setParsedErrorMessages] = useState<string[]>([]);

  // Safe validation error setter - COMPLETELY prevent JSON objects from being stored
  const setFieldValidationError = (field: string, error: any) => {
    let errorMessage = "Please check your input";

    try {
      // Handle string errors
      if (typeof error === "string") {
        errorMessage = error;
      }
      // Handle Error objects with message property
      else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }
      // Handle Zod validation errors (ZodError objects)
      else if (
        error?.issues &&
        Array.isArray(error.issues) &&
        error.issues.length > 0
      ) {
        const firstIssue = error.issues[0];
        if (firstIssue?.message && typeof firstIssue.message === "string") {
          errorMessage = firstIssue.message;
        }
      }
      // Handle direct array format
      else if (Array.isArray(error) && error.length > 0) {
        const firstError = error[0];
        if (typeof firstError === "string") {
          errorMessage = firstError;
        } else if (
          firstError?.message &&
          typeof firstError.message === "string"
        ) {
          errorMessage = firstError.message;
        }
      }
      // Handle objects with message property
      else if (
        error &&
        typeof error === "object" &&
        error.message &&
        typeof error.message === "string"
      ) {
        errorMessage = error.message;
      }
    } catch (parseError) {
      errorMessage = "Please check your input";
    }

    // CRITICAL: Only set if it's a string
    if (typeof errorMessage === "string" && errorMessage.trim()) {
      setValidationErrorsSafe((prev) => ({ ...prev, [field]: errorMessage }));
    } else {
      setValidationErrorsSafe((prev) => ({
        ...prev,
        [field]: "Please check your input",
      }));
    }
  };

  // Validation function
  const validateField = (field: string, value: string) => {
    try {
      switch (field) {
        case "email":
          emailSchema.parse(value);
          break;
        case "username":
          usernameSchema.parse(value);
          break;
        case "password":
          passwordSchema.parse(value);
          break;
        case "displayName":
          displayNameSchema.parse(value);
          break;
        case "firstName":
        case "lastName":
          if (value.trim().length < 2)
            throw new Error("Must be at least 2 characters");
          break;
      }
      setValidationErrorsSafe((prev) => ({ ...prev, [field]: "" }));
    } catch (error: any) {
      setFieldValidationError(field, error);
    }
  };

  // Input change handler
  const handleInputChange = (field: keyof RegisterData, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setRegisterData((prev) => ({ ...prev, [field]: sanitizedValue }));

    // Clear validation error when user starts typing
    setValidationErrorsSafe((prev) => ({
      ...prev,
      [field]: "",
    }));

    // Clear parsed error messages when user starts editing
    if (parsedErrorMessages.length > 0) {
      setParsedErrorMessages([]);
    }

    // Real-time validation
    if (field === "password") {
      setPasswordStrength(checkPasswordStrength(sanitizedValue));
    }

    // Validate field if it has content
    if (sanitizedValue.trim()) {
      validateField(field, sanitizedValue);
    }
  };

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        ...data,
        recaptchaToken: recaptchaToken,
        acceptTerms: true, // Ensure this is always included
        acceptPrivacy: true, // Ensure this is always included
      });
      return await response.json();
    },
    onSuccess: () => {
      // Clear any previous error messages
      setParsedErrorMessages([]);

      toast({
        title: "Registration Successful",
        description: "Account created successfully. Please log in.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      // Clear any existing field validation errors first
      setValidationErrorsSafe({});

      console.log("Registration error:", error);
      console.log("Error message:", error?.message);
      console.log("Error data:", error?.data);
      console.log("Error serializedData:", error?.serializedData);

      // Extract and parse error messages
      const errorMessages = parseRegistrationError(error);
      console.log("Parsed error messages:", errorMessages);

      // Set the parsed error messages for UI display
      setParsedErrorMessages(errorMessages);

      // Show a toast notification as well
      toast({
        title: "Registration Failed",
        description:
          errorMessages.length === 1
            ? errorMessages[0]
            : `Please fix ${errorMessages.length} issues below`,
        variant: "destructive",
      });
    },
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Comprehensive validation
    const errors: string[] = [];

    if (
      !registerData.email ||
      !registerData.username ||
      !registerData.password ||
      !registerData.displayName
    ) {
      errors.push("Please fill in all required fields");
    }

    if (registerData.password !== registerData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    if (!passwordStrength.isValid) {
      errors.push("Password does not meet security requirements");
    }

    if (!recaptchaToken) {
      errors.push("Please complete the human verification");
    }

    // Check for any field validation errors
    const hasValidationErrors = Object.values(validationErrors).some(
      (error) => error,
    );
    if (hasValidationErrors) {
      errors.push("Please fix the form errors before submitting");
    }

    if (errors.length > 0) {
      toast({
        title: "Registration Error",
        description: errors[0],
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Platinum Scout
            </h1>
          </div>
          <CardTitle className="text-xl">Create Account</CardTitle>
          <CardDescription>
            Join the leading African football scouting platform
          </CardDescription>
        </CardHeader>

        {/* Display parsed error messages */}
        {parsedErrorMessages.length > 0 && (
          <div className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">
              Registration Failed:
            </div>
            <ul className="space-y-2">
              {parsedErrorMessages.map((msg, idx) => (
                <li
                  key={idx}
                  className="text-sm text-red-600 dark:text-red-400 flex items-start"
                >
                  <XCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={registerData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="h-11"
                />
                {validationErrors.firstName && (
                  <p className="text-sm text-red-500">
                    {typeof validationErrors.firstName === "string"
                      ? validationErrors.firstName
                      : "Please check your first name"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={registerData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="h-11"
                />
                {validationErrors.lastName && (
                  <p className="text-sm text-red-500">
                    {typeof validationErrors.lastName === "string"
                      ? validationErrors.lastName
                      : "Please check your last name"}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="John Doe"
                  value={registerData.displayName}
                  onChange={(e) =>
                    handleInputChange("displayName", e.target.value)
                  }
                  className="pl-10 h-11"
                />
              </div>
              {validationErrors.displayName && (
                <p className="text-sm text-red-500">
                  {validationErrors.displayName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={registerData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  className="pl-10 h-11"
                />
              </div>
              {validationErrors.username && (
                <p className="text-sm text-red-500">
                  {validationErrors.username}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={registerData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              {validationErrors.email && (
                <p className="text-sm text-red-500">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={registerData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="pl-10 pr-10 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {registerData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Password strength:
                    </span>
                    <span
                      className={`text-sm font-medium ${getPasswordStrengthColor(passwordStrength.score)}`}
                    >
                      {getPasswordStrengthText(passwordStrength.score)}
                    </span>
                  </div>
                  <Progress
                    value={(passwordStrength.score / 4) * 100}
                    className="h-2"
                  />
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-sm text-gray-600 space-y-1">
                      {passwordStrength.feedback.map((feedback, index) => (
                        <li key={index} className="flex items-center">
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          {feedback}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {validationErrors.password && (
                <p className="text-sm text-red-500">
                  {validationErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className="pl-10 pr-10 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {registerData.confirmPassword &&
                registerData.password !== registerData.confirmPassword && (
                  <p className="text-sm text-red-500 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    Passwords do not match
                  </p>
                )}
              {registerData.confirmPassword &&
                registerData.password === registerData.confirmPassword && (
                  <p className="text-sm text-green-500 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Passwords match
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={registerData.role}
                onValueChange={(value) => handleInputChange("role", value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scout">Scout</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="club_director">Club Director</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* reCAPTCHA - For demo purposes, show placeholder */}
            <div className="space-y-2">
              <Label>Human Verification *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  reCAPTCHA verification would appear here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  (Demo mode - verification bypassed)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setRecaptchaToken("demo-token")}
                >
                  {recaptchaToken ? "Verified ✓" : "Click to Verify"}
                </Button>
              </div>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>At least 8 characters long</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Include at least one number</li>
                <li>Include at least one special character</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white"
              disabled={
                registerMutation.isPending ||
                !passwordStrength.isValid ||
                !recaptchaToken
              }
            >
              {registerMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
