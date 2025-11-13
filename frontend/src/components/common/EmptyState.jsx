import React from "react";

/**
 * Empty state component for when no data is available
 */
const EmptyState = ({ 
  icon: Icon = null,
  title = "No data found",
  description = "There's nothing to display here.",
  action = null,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {Icon && (
        <Icon className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
