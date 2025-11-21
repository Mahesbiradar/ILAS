// src/components/home/AnnouncementSection.jsx
import React, { useState, useEffect } from "react";
import { getAnnouncements } from "../../../services/announcementApi";
import Loader from "../../common/Loader";

export default function AnnouncementSection() {
  const [index, setIndex] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ Static announcements fallback
  const STATIC_ANN = [
    {
      id: 1001,
      title: "Welcome to ILAS Library",
      body: "Explore 5000+ books, journals & digital resources anytime."
    },
    {
      id: 1002,
      title: "New Feature Released",
      body: "Smart search and category-based filtering are now live."
    },
    {
      id: 1003,
      title: "Library Timings",
      body: "The library is open from 8:30 AM to 6:00 PM on all working days."
    },
    {
      id: 1004,
      title: "Reminder",
      body: "Please return issued books on time to avoid overdue fines."
    }
  ];

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);

      try {
        const data = await getAnnouncements();
        const valid = Array.isArray(data)
          ? data.filter((a) => a.is_active !== false)
          : [];

        // ⭐ If backend has zero announcements → show static ones
        if (mounted) {
          setAnnouncements(valid.length ? valid : STATIC_ANN);
        }
      } catch (err) {
        console.warn("Failed to load announcements, using fallback:", err.message);
        if (mounted) setAnnouncements(STATIC_ANN); // ⭐ fallback
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Auto-rotate announcements
  useEffect(() => {
    if (!announcements.length) return;

    const t = setInterval(() => {
      setIndex((i) => (i + 1) % announcements.length);
    }, 6000);

    return () => clearInterval(t);
  }, [announcements.length]);

  if (loading) return <Loader />;

  const ann = announcements;

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
              <h3 className="text-lg font-semibold text-gray-800">
                {ann[index].title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{ann[index].body}</p>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              {ann.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => setIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i === index ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            <span>Tip:</span> You can search books or browse categories below.
          </div>
        </div>
      </div>
    </section>
  );
}
