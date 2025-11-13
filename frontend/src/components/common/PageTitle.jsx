import React from "react";

/**
 * Page title component for consistent page headers
 */
const PageTitle = ({ 
  title, 
  subtitle = "", 
  icon: Icon = null,
  action = null,
  className = ""
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-8 h-8 text-blue-600" />}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div className="ml-auto">{action}</div>}
      </div>
    </div>
  );
};

export default PageTitle;
