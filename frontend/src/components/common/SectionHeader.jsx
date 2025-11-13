import React from "react";

/**
 * Section header for content sections within pages
 */
const SectionHeader = ({ 
  title, 
  description = "",
  action = null,
  className = ""
}) => {
  return (
    <div className={`mb-6 flex items-center justify-between gap-4 ${className}`}>
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default SectionHeader;
