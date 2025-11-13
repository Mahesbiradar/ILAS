import React from "react";

/**
 * Modern Input component with variants and states
 */
const Input = ({
  label,
  error,
  required,
  variant = "outlined",
  size = "md",
  className = "",
  ...props
}) => {
  const baseStyles = "rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white";

  const variants = {
    outlined: "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500",
    filled: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-4 py-3 text-lg",
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`w-full ${baseStyles} ${variants[variant] || variants.outlined} ${sizes[size] || sizes.md} ${error ? "border-red-500 focus:ring-red-500" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;
