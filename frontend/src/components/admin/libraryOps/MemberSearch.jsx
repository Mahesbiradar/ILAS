// src/components/admin/libraryOps/MemberSearch.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

/**
 * MemberSearch
 * - Search by USN / employee id / name
 * - Calls: GET /v1/admin/ajax/user-search/?q=<query>
 *
 * Props:
 * - onSelect(member)  // called with selected member object
 */
export default function MemberSearch({ onSelect }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q || q.length < 3) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("v1/admin/ajax/user-search/", { params: { q } });
        // server may return array or {results:[]}
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
    <div>
      <div className="flex items-center gap-2">
        <input
          placeholder="Search member by USN / Emp ID (min 3 chars)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        {loading && <div className="text-sm text-gray-500">Searching…</div>}
      </div>

      {results.length > 0 && (
        <ul className="mt-2 max-h-48 overflow-auto border rounded bg-white">
          {results.map((m) => (
            <li
              key={m.id}
              onClick={() => onSelect(m)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
            >
              <div>
                <div className="text-sm font-medium">{m.full_name || m.name}</div>
                <div className="text-xs text-gray-500">{m.usn || m.employee_id || m.email}</div>
              </div>
              <div className="text-xs text-gray-600">ID:{m.id}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
