import React from "react";

const Footer = () => (
  <footer className="bg-gray-800 text-gray-300 text-center py-3 mt-6">
    <p className="text-sm">
      © {new Date().getFullYear()} ILAS – Innovative Library Automation System
    </p>
  </footer>
);

export default Footer;
