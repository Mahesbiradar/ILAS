import React from "react";

export default function Loader() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-gradient-to-r from-blue-500 to-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}
