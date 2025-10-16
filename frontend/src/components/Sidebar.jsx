import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { name: "Dashboard", path: "/" },
    { name: "Books", path: "/books" },
    { name: "Members", path: "/members" },
    { name: "Transactions", path: "/transactions" },
    { name: "About", path: "/about" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 h-full bg-gray-100 border-r p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Navigation</h2>
      <nav className="flex flex-col gap-2 text-gray-700">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`hover:text-blue-600 ${
              location.pathname === link.path ? "text-blue-700 font-semibold" : ""
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
