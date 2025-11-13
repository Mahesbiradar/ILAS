import React from "react";

/**
 * Modern Card component for consistent layout and styling
 */
const Card = ({
  children,
  className = "",
  variant = "default",
  hoverEffect = true,
  ...props
}) => {
  const baseStyles = "rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden";
  
  const variants = {
    default: "border-gray-200 shadow-sm",
    elevated: "border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200",
    outlined: "border-gray-300 dark:border-gray-600",
    subtle: "border-transparent bg-gray-50 dark:bg-gray-900",
  };

  const hoverClass = hoverEffect ? "transition-transform duration-200 hover:scale-105" : "";

  return (
    <div
      className={`${baseStyles} ${variants[variant] || variants.default} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
