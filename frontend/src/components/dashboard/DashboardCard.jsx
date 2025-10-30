// src/components/dashboard/DashboardCard.jsx
import React from "react";
import { motion } from "framer-motion";
import cn from "../../utils/cn";
// optional helper if you use className merging

/**
 * DashboardCard Component
 * -----------------------
 * Props:
 * - title (string): label for the card
 * - value (string | number): main statistic to display
 * - icon (ReactNode): optional icon (e.g., <Book />, <Users />, etc.)
 * - color (string): Tailwind base color (e.g., "blue", "green", "purple")
 * - onClick (function): optional click handler for navigation or actions
 * - description (string): optional subtext or tooltip
 */
export default function DashboardCard({
  title,
  value,
  icon,
  color = "blue",
  onClick,
  description,
}) {
  const baseColor = {
    bg: `bg-${color}-600`,
    hover: `hover:bg-${color}-700`,
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={cn(
        `relative p-5 rounded-xl shadow-md text-white cursor-pointer transition-all duration-300`,
        baseColor.bg,
        baseColor.hover
      )}
      onClick={onClick}
    >
      {/* Icon */}
      {icon && (
        <div className="absolute top-4 right-4 text-white/70 text-3xl">
          {icon}
        </div>
      )}

      {/* Title */}
      <h2 className="text-lg font-semibold tracking-wide">{title}</h2>

      {/* Value */}
      <p className="text-4xl font-bold mt-2 mb-1">{value}</p>

      {/* Description (Optional) */}
      {description && (
        <p className="text-sm text-white/80">{description}</p>
      )}
    </motion.div>
  );
}
