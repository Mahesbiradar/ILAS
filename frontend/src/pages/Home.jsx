// src/pages/Home.jsx
import React from "react";
import AnnouncementSection from "../components/layout/home/AnnouncementSection";
import SearchBar from "../components/common/SearchBar";
import CategoryGrid from "../components/layout/home/CategoryGrid";
import FeaturedBooks from "../components/layout/home/FeaturedBooks";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AnnouncementSection />
      <div className="mt-6">
        <SearchBar placeholder="Search books, authors, ISBN..." />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Categories</h2>
        <CategoryGrid />
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Featured books</h2>
        <FeaturedBooks />
      </div>
    </div>
  );
}
