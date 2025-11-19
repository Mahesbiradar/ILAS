// src/components/admin/libraryOps/MemberSearch.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

/**
 * MemberSearch: small compact result items for selecting a member.
 * Props:
 *  - onSelect(member)
 */

export default function MemberSearch({ onSelect }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("v1/admin/ajax/user-search/", { params: { q } });
        const data = res.data || {};
        const list = Array.isArray(data) ? data : data.results || data.data || [];
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
      <div className="mb-2">
        <input
          placeholder="Search member by name / USN / Emp ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      {loading && <div className="text-xs text-gray-500 mb-2">Searching…</div>}

      {results.length > 0 && (
        <ul className="max-h-56 overflow-y-auto rounded border bg-white divide-y">
          {results.map((m) => (
            <li
              key={m.id}
              onClick={() => onSelect(m)}
              className="p-3 hover:bg-blue-50 cursor-pointer transition"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{m.full_name || m.username}</div>
                <div className="text-xs text-gray-500">ID: {m.id}</div>
              </div>

              <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-3">
                <div><span className="font-semibold">Unique:</span> {m.unique_id || "—"}</div>
                <div><span className="font-semibold">Role:</span> {m.role}</div>
                <div><span className="font-semibold">Email:</span> {m.email || "—"}</div>
                <div><span className="font-semibold">Phone:</span> {m.phone || "—"}</div>
                <div><span className="font-semibold">Borrowed:</span> {m.borrow_count ?? 0}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
