import React, { useState } from "react";
import { User, UserCircle, Phone, IdCard } from "lucide-react";

export default function About() {
  const [active, setActive] = useState(null);

  const sections = [
    {
      id: 1,
      title: "📘 Project Overview",
      content: (
        <p className="text-gray-600 leading-relaxed">
          <strong>ILAS (Innovative Library Automation System)</strong> is a
          cloud-ready, role-based library management platform designed to
          simplify, automate, and digitalize library operations. It provides
          secure access for Admins, Librarians, and Users with an elegant,
          responsive interface built for scalability and ease of use.
        </p>
      ),
    },
    {
      id: 2,
      title: "🎯 Mission & Vision",
      content: (
        <p className="text-gray-600 leading-relaxed">
          Our mission is to create a digital-first library ecosystem where
          management becomes seamless, access is instant, and data-driven
          decisions improve efficiency.
          <br />
          <br />
          We envision ILAS as a cloud-integrated solution that empowers
          institutions to manage their library resources effectively while
          offering readers an enhanced experience.
        </p>
      ),
    },
    {
      id: 3,
      title: "⚙️ Core Features",
      content: (
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Role-based access control for Admins, Librarians, and Users</li>
          <li>Smart book management with search and filter options</li>
          <li>Borrow and return tracking with activity logs</li>
          <li>Interactive dashboards and analytics visualization</li>
          <li>Cloud-ready modular API architecture</li>
          <li>Responsive and consistent UI/UX with Tailwind CSS</li>
        </ul>
      ),
    },
    {
      id: 4,
      title: "💻 Technology Stack",
      content: (
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>
            <strong>Frontend:</strong> React.js, Tailwind CSS
          </li>
          <li>
            <strong>Backend:</strong> Django REST Framework (DRF)
          </li>
          <li>
            <strong>Database:</strong> PostgreSQL / Supabase
          </li>
          <li>
            <strong>Hosting:</strong> Vercel (Frontend), Railway / Supabase
            (Backend)
          </li>
          <li>
            <strong>Version Control:</strong> Git & GitHub
          </li>
        </ul>
      ),
    },
    {
      id: 5,
      title: "👥 Project Team & Guidance",
      content: (
        <div className="text-gray-600 leading-relaxed space-y-6">
          {/* Guide Section */}
          <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-blue-600" />
              Under the Guidance Of
            </h3>
            <p className="text-gray-700 font-medium text-lg">
              👩‍🏫 Dr. Vidya Honguntikar
            </p>
            <p className="text-gray-600">
              Professor, Dept. of Electronics & Telecommunication
            </p>
            <p className="text-gray-600">
              Dr. Ambedkar Institute of Technology
            </p>
          </div>

          {/* Team Members Section */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Team Members</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Dhruvakumar */}
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-6 h-6 text-blue-500" />
                  <h4 className="text-gray-800 font-medium">Dhruvakumar H</h4>
                </div>
                <p className="flex items-center text-gray-600 text-sm gap-2">
                  <IdCard className="w-4 h-4 text-gray-500" /> 1DA23ET400
                </p>
                <p className="flex items-center text-gray-600 text-sm gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-500" /> +91 8095775236
                </p>
              </div>

              {/* Harish */}
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-6 h-6 text-blue-500" />
                  <h4 className="text-gray-800 font-medium">Harish D</h4>
                </div>
                <p className="flex items-center text-gray-600 text-sm gap-2">
                  <IdCard className="w-4 h-4 text-gray-500" /> 1DA23ET401
                </p>
                <p className="flex items-center text-gray-600 text-sm gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-500" /> +91 6361589164
                </p>
              </div>

              {/* Mahesh */}
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-6 h-6 text-blue-500" />
                  <h4 className="text-gray-800 font-medium">Mahesh</h4>
                </div>
                <p className="flex items-center text-gray-600 text-sm gap-2">
                  <IdCard className="w-4 h-4 text-gray-500" /> 1DA23ET402
                </p>
                <p className="flex items-center text-gray-600 text-sm gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-500" /> +91 9916446170
                </p>
              </div>

              {/* Yashaswini */}
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <UserCircle className="w-6 h-6 text-pink-500" />
                  <h4 className="text-gray-800 font-medium">Yashaswini K</h4>
                </div>
                <p className="flex items-center text-gray-600 text-sm gap-2">
                  <IdCard className="w-4 h-4 text-gray-500" /> 1DA23ET407
                </p>
                <p className="flex items-center text-gray-600 text-sm gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-500" /> +91 9380503097
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const toggleSection = (id) => {
    setActive(active === id ? null : id);
  };

  return (
    <div className="px-6 pt-2 pb-6 max-w-5xl mx-auto text-gray-700">
      {/* Header Section */}
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-1">
          About <span className="text-blue-600">ILAS</span>
        </h1>
        <p className="text-gray-500 text-[15px] leading-snug max-w-2xl mx-auto mb-2">
          Learn more about the{" "}
          <strong>Innovative Library Automation System</strong> — its mission,
          design, technology, and the team behind it.
        </p>
        <div className="h-[2px] w-14 bg-blue-500 mx-auto rounded-full opacity-70"></div>
      </div>

      {/* Accordion Section */}
      <div className="space-y-5">
        {sections.map((sec) => (
          <div
            key={sec.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <button
              onClick={() => toggleSection(sec.id)}
              className="w-full flex justify-between items-center p-5 focus:outline-none"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {sec.title}
              </h2>
              <span
                className={`text-gray-500 transform transition-transform ${active === sec.id ? "rotate-90" : ""
                  }`}
              >
                ▶
              </span>
            </button>

            {active === sec.id && (
              <div className="px-5 pb-5 pt-0 border-t border-gray-100 animate-fadeIn">
                {sec.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
