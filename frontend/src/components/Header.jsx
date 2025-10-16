import React from "react";
import { BookOpen, Menu } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <BookOpen size={26} />
        <h1 className="text-lg font-semibold tracking-wide">
          <Link to="/">ILAS Library System</Link>
        </h1>
      </div>
      <button className="md:hidden border border-white px-3 py-1 rounded">
        <Menu size={22} />
      </button>
    </header>
  );
};

export default Header;
