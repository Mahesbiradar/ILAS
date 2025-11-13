// src/components/common/DashboardCard.jsx
import React from "react";
import { motion } from "framer-motion";

/**
 * DashboardCard Component
 * Displays a statistic card with title, value, icon, and optional click handler
 */
export default function DashboardCard({
  title,
  value,
  icon,
  color = "blue",
  onClick,
  description,
}) {
  // Tailwind color mapping
  const colorMap = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    purple: "bg-purple-600 hover:bg-purple-700",
    yellow: "bg-yellow-600 hover:bg-yellow-700",
    red: "bg-red-600 hover:bg-red-700",
  };

  const baseStyle = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`relative p-5 rounded-xl shadow-md text-white cursor-pointer transition-all duration-300 ${baseStyle}`}
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
