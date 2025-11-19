// src/components/admin/libraryOps/MemberSearch.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

/**
 * MemberSearch
 * - Fully enhanced UI (no logic change)
 * - Displays: name, username, unique_id, role, phone, borrow_count
 *
 * Props:
 * - onSelect(member)
 */

export default function MemberSearch({ onSelect }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("v1/admin/ajax/user-search/", { params: { q } });

        const data = res.data || [];
        const list = Array.isArray(data) ? data : data.results || [];
        setResults(list);
      } catch (err) {
        console.warn("Member search failed", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(id);
  }, [q]);

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <input
          placeholder="Search member by Name / USN / Emp ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-blue-200"
        />
        {loading && <div className="text-xs text-gray-500">Searching…</div>}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <ul className="mt-2 max-h-56 overflow-y-auto rounded-lg border bg-white shadow-sm divide-y">
          {results.map((m) => (
            <li
              key={m.id}
              onClick={() => onSelect(m)}
              className="p-3 hover:bg-blue-50 cursor-pointer transition flex flex-col gap-1"
            >
              <div className="font-medium text-sm">{m.full_name || m.username}</div>

              <div className="text-xs text-gray-600 flex flex-wrap gap-3">
                <span className="font-semibold">ID:</span> {m.id}
                <span className="font-semibold">Unique ID:</span> {m.unique_id || "—"}
                <span className="font-semibold">Role:</span> {m.role}
              </div>

              <div className="text-xs text-gray-600 flex flex-wrap gap-3">
                <span className="font-semibold">Email:</span> {m.email || "—"}
                <span className="font-semibold">Phone:</span> {m.phone || "—"}
              </div>

              <div className="text-xs text-gray-700 flex gap-2">
                <span className="font-semibold">Borrowed:</span> {m.borrow_count}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
