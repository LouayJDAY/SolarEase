import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
}

export function Button({ 
  variant = "primary", 
  fullWidth = false,
  className = "",
  children,
  ...props 
}: ButtonProps) {
  const baseClasses = "px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-[#27AE60] shadow-md hover:shadow-lg",
    secondary: "bg-secondary text-white hover:bg-[#34495E] shadow-md hover:shadow-lg",
    outline: "border-2 border-gray-300 text-secondary hover:border-primary hover:text-primary bg-white"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
