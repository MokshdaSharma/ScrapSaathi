import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30 active:scale-95",
  secondary:
    "bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 active:scale-95",
  danger:
    "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 active:scale-95",
  ghost:
    "bg-transparent hover:bg-slate-800 text-slate-300 active:scale-95",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-12 px-5 text-base gap-2 rounded-xl",
  lg: "h-14 px-6 text-lg gap-2.5 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-semibold",
        "transition-all duration-150 focus:outline-none focus:ring-2",
        "focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
    </button>
  );
}
