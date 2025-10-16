import React from "react";
import { BookOpen, Info, Bell } from "lucide-react";

const Home = () => {
  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">
          📚 Welcome to ILAS
        </h1>
        <p className="text-gray-600">
          Innovative Library Automation System — your smart library assistant
        </p>
      </div>

      {/* Announcements */}
      <section className="mb-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm flex items-center gap-3">
          <Bell className="text-yellow-500" />
          <p className="text-gray-700">
            📢 <strong>Notice:</strong> The library will be open on Saturdays
            from 9 AM – 3 PM starting this month!
          </p>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Featured Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-md border hover:shadow-lg transition">
            <BookOpen className="text-blue-600 mb-3" size={28} />
            <h3 className="text-xl font-semibold">Programming</h3>
            <p className="text-gray-600 mt-2">
              Explore the latest in Python, C, Java, and embedded systems.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border hover:shadow-lg transition">
            <BookOpen className="text-green-600 mb-3" size={28} />
            <h3 className="text-xl font-semibold">Science</h3>
            <p className="text-gray-600 mt-2">
              From Physics to Robotics — dive into the world of discovery.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border hover:shadow-lg transition">
            <BookOpen className="text-purple-600 mb-3" size={28} />
            <h3 className="text-xl font-semibold">Technology</h3>
            <p className="text-gray-600 mt-2">
              Stay updated on IoT, AI, and modern engineering innovations.
            </p>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-blue-50 rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
        <div className="flex items-center gap-3">
          <Info className="text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-blue-700">
              About ILAS
            </h3>
            <p className="text-gray-700 mt-1">
              ILAS is designed to simplify library management — from cataloging
              books to tracking members and issuing transactions — with a clean
              interface and smart automation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
