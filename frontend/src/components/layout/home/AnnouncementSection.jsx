// src/components/home/AnnouncementSection.jsx
import React, { useState, useEffect } from "react";

/**
 * Simple rotating announcement banner.
 * Replace `mockAnnouncements` with real API later.
 */

const mockAnnouncements = [
  { id: 1, title: "Welcome to ILAS", body: "New arrivals added this week — check Featured books!", type: "info" },
  { id: 2, title: "Library Closed", body: "Library will be closed on Oct 25 for maintenance.", type: "alert" },
  { id: 3, title: "Borrow Limit", body: "You can borrow up to 3 books at a time.", type: "tip" },
];

export default function AnnouncementSection() {
  const [index, setIndex] = useState(0);
  const ann = mockAnnouncements;

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % ann.length), 5000);
    return () => clearInterval(t);
  }, [ann.length]);

  return (
    <section className="bg-gradient-to-r from-blue-50 to-white rounded-lg p-4 sm:p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-none">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            IL
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{ann[index].title}</h3>
              <p className="text-sm text-gray-600 mt-1">{ann[index].body}</p>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              {ann.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Show announcement ${i + 1}`}
                  className={`w-2.5 h-2.5 rounded-full ${i === index ? "bg-blue-600" : "bg-gray-300"}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            <span>Tip:</span> You can search books or filter categories below.
          </div>
        </div>
      </div>
    </section>
  );
}
