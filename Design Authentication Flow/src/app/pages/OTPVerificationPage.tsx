import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../components/ui/input-otp";

export function OTPVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "user@example.com";
  
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    // Mock API call to Spring Boot backend
    // POST /api/auth/verify-otp
    // Body: { email, otp }
    
    setTimeout(() => {
      console.log("OTP verification attempt:", { email, otp });
      setIsLoading(false);
      
      // In real implementation:
      // - If successful, navigate to dashboard or success page
      // - If failed, show error message
      
      // For demo: simulate success
      // navigate("/login");
      alert("Account verified successfully! You can now sign in.");
      navigate("/login");
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setCanResend(false);
    setCountdown(60);
    setOtp("");
    setError("");

    // Mock API call to Spring Boot backend
    // POST /api/auth/resend-otp
    // Body: { email }
    
    setTimeout(() => {
      console.log("Resend OTP request:", { email });
      alert("A new verification code has been sent to your email");
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-green-500 rounded-full mb-4">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl text-slate-900 mb-2">Verify Your Email</h2>
          <p className="text-slate-600">
            Enter the 6-digit code sent to
          </p>
          <p className="text-green-600 mt-1">{email}</p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setError("");
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-12 h-12 text-lg rounded-lg" />
                <InputOTPSlot index={1} className="w-12 h-12 text-lg rounded-lg" />
                <InputOTPSlot index={2} className="w-12 h-12 text-lg rounded-lg" />
                <InputOTPSlot index={3} className="w-12 h-12 text-lg rounded-lg" />
                <InputOTPSlot index={4} className="w-12 h-12 text-lg rounded-lg" />
                <InputOTPSlot index={5} className="w-12 h-12 text-lg rounded-lg" />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {error && (
            <p className="text-sm text-red-500 text-center mt-2">{error}</p>
          )}
        </div>

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          className="w-full bg-gradient-to-r from-amber-500 to-green-500 hover:from-amber-600 hover:to-green-600 text-white rounded-lg h-12 mb-4"
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? "Verifying..." : "Verify Account"}
        </Button>

        {/* Resend Code */}
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-2">
            Didn't receive the code?
          </p>
          {canResend ? (
            <button
              onClick={handleResendOTP}
              className="text-sm text-green-600 hover:text-green-700"
            >
              Resend Code
            </button>
          ) : (
            <p className="text-sm text-slate-500">
              Resend code in{" "}
              <span className="text-green-600">{countdown}s</span>
            </p>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-600 text-center">
            For security reasons, this code will expire in 10 minutes.
            Please check your spam folder if you don't see the email.
          </p>
        </div>
      </div>
    </div>
  );
}
