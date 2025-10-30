import React from "react";

export default function Unauthorized() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-3">🚫 Access Denied</h1>
      <p className="text-gray-500">
        You don’t have permission to view this page.
      </p>
    </div>
  );
}
