import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import authService from "../services/authService";

export function OTPVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const email = new URLSearchParams(location.search).get("email") || "";

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.nextSibling && element.value) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();

    const newOtp = new Array(6).fill("");
    pasted.split("").forEach((char, idx) => {
      newOtp[idx] = char;
    });
    setOtp(newOtp);

    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfo("");

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Le code OTP doit contenir 6 chiffres.");
      setIsLoading(false);
      return;
    }

    if (!email) {
      setError("Email manquant. Veuillez recommencer l’inscription.");
      setIsLoading(false);
      return;
    }

    try {
      const invitationToken = sessionStorage.getItem("invitationToken") ?? undefined;
      await authService.verifyOtp({ email, otpCode: code, invitationToken });
      sessionStorage.removeItem("invitationToken");
      sessionStorage.removeItem("invitationProjectId");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Code OTP invalide ou expiré.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    setError("");
    setInfo("");
    try {
      const response = await authService.resendOtp({ email });
      setInfo(response?.message || "Un nouveau code OTP a été envoyé.");
      setCooldown(30);
      setOtp(new Array(6).fill(""));
      inputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.message || "Impossible de renvoyer le code OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      imageSrc="https://images.unsplash.com/photo-1617957689233-207e3cd3c610?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdyYWRpZW50fGVufDF8fHx8MTc3MTg5MDYyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      tagline="Sécurisez votre compte"
    >
      <div className="space-y-8 text-center">
        <div>
          <h1 className="text-3xl text-secondary mb-2">Vérification OTP</h1>
          <p className="text-muted-foreground">
            Entrez le code à 6 chiffres envoyé à votre adresse email.
          </p>
          <p className="text-xs text-gray-500 mt-2">{email || "Email non détecté"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {info && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {info}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-2">
            {otp.map((data, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                className="w-12 h-14 text-center text-2xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                type="text"
                maxLength={1}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
              />
            ))}
          </div>

          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? "Vérification..." : "Vérifier le compte"}
          </Button>
        </form>

        <div className="text-sm text-muted-foreground">
          Vous n'avez pas reçu de code ?{" "}
          <button
            onClick={handleResend}
            type="button"
            disabled={resending || cooldown > 0 || !email}
            className="text-primary font-medium hover:underline focus:outline-none disabled:text-gray-400 disabled:no-underline"
          >
            {resending ? "Envoi..." : cooldown > 0 ? `Renvoyer (${cooldown}s)` : "Renvoyer le code"}
          </button>
        </div>

        <div className="text-sm text-muted-foreground">
          <Link to="/register" className="text-primary font-medium hover:underline">
            Revenir à l’inscription
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
