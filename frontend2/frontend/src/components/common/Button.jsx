import React from "react";

const Button = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
  ...props
}) => {
  const baseStyle =
    "px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
  const variants = {
    primary:
      "bg-linear-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/30 disabled:hover:shadow-none",
    secondary:
      "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:hover:bg-white",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:hover:bg-rose-50",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
