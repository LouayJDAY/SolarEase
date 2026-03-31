import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { Shield } from "lucide-react";

export function OtpPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    // Focus last filled input or first empty
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Veuillez entrer les 6 chiffres");
      return;
    }

    // Mock verification (in real app, verify with backend)
    if (code === "123456") {
      // Success - navigate to dashboard
      console.log("Verification successful");
      navigate("/dashboard");
    } else {
      setError("Code invalide. Veuillez réessayer.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = () => {
    if (countdown === 0) {
      setCountdown(30);
      setOtp(["", "", "", "", "", ""]);
      setError("");
      console.log("Resending code...");
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <AuthLayout
      imageSrc="https://images.unsplash.com/photo-1762340275855-ae8f4c2c144e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHBob25lJTIwc2VjdXJpdHklMjB2ZXJpZmljYXRpb258ZW58MXx8fHwxNzcxODkwNjI2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      tagline="Sécurité renforcée pour vos données"
    >
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl text-secondary mb-2">
            Vérification de sécurité
          </h1>
          <p className="text-muted-foreground">
            Nous avons envoyé un code à{" "}
            <span className="font-medium text-secondary">user@example.com</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-secondary mb-4 text-center">
              Entrez le code à 6 chiffres
            </label>
            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`
                    w-12 h-14 text-center text-xl font-semibold
                    border-2 rounded-lg bg-white
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    transition-all duration-200
                    ${error ? 'border-destructive' : 'border-gray-300'}
                    ${digit ? 'border-primary' : ''}
                  `}
                />
              ))}
            </div>
            {error && (
              <p className="mt-3 text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          <Button type="submit" fullWidth>
            Vérifier
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0}
              className={`text-sm transition-colors ${
                countdown > 0
                  ? "text-muted-foreground cursor-not-allowed"
                  : "text-primary hover:text-[#27AE60] font-medium"
              }`}
            >
              {countdown > 0 ? (
                `Renvoyer le code dans ${countdown}s`
              ) : (
                "Renvoyer le code"
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas reçu le code ?{" "}
            <a href="#" className="text-primary hover:text-[#27AE60] font-medium transition-colors">
              Vérifier vos spams
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}