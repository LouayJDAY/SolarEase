interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const calculateStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    return Math.min(strength, 4);
  };

  const strength = calculateStrength(password);
  
  const getStrengthColor = () => {
    if (strength === 0) return "bg-slate-200";
    if (strength === 1) return "bg-red-500";
    if (strength === 2) return "bg-orange-500";
    if (strength === 3) return "bg-amber-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (strength === 0 || password.length === 0) return "";
    if (strength === 1) return "Weak";
    if (strength === 2) return "Fair";
    if (strength === 3) return "Good";
    return "Strong";
  };

  if (password.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`flex-1 rounded-full transition-colors ${
              level <= strength ? getStrengthColor() : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-600">
        Password strength: <span className="font-medium">{getStrengthText()}</span>
      </p>
    </div>
  );
}
