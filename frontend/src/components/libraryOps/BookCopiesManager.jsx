// src/components/libraryOps/BookCopiesManager.jsx
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getBookCopies,
  addBookCopy,
  editBookCopy,
  deleteBookCopy,
  bulkDeleteCopies,
  generateCopyBarcode,
} from "../../api/libraryApi";
import Loader from "../common/Loader";

export default function BookCopiesManager({ bookCode, onUpdated }) {
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [editData, setEditData] = useState(null);

  // Fetch all copies for the book
  const fetchCopies = async () => {
    if (!bookCode) return;
    try {
      setLoading(true);
      const res = await getBookCopies(bookCode);
      setCopies(res);
    } catch (err) {
      console.error("Error fetching copies:", err);
      toast.error("Failed to load copies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCopies();
  }, [bookCode]);

  // Add a new copy
  const handleAddCopy = async () => {
    try {
      setLoading(true);
      await addBookCopy(bookCode);
      toast.success("📘 New copy added successfully!");
      fetchCopies();
      onUpdated?.();
    } catch (err) {
      console.error("Add copy error:", err);
      toast.error("Failed to add copy.");
    } finally {
      setLoading(false);
    }
  };

  // Edit copy details
  const handleEditCopy = async () => {
    if (!editData?.copy_code) return toast.error("Select a copy to edit.");
    try {
      setLoading(true);
      await editBookCopy(editData.copy_code, editData);
      toast.success("✏️ Copy details updated!");
      setEditData(null);
      fetchCopies();
    } catch (err) {
      console.error("Edit copy error:", err);
      toast.error("Failed to update copy.");
    } finally {
      setLoading(false);
    }
  };

  // Delete copy
  const handleDeleteCopy = async (copyCode) => {
    if (!window.confirm(`Delete copy ${copyCode}?`)) return;
    try {
      setLoading(true);
      await deleteBookCopy(copyCode);
      toast.success(`🗑️ Copy ${copyCode} deleted!`);
      fetchCopies();
      onUpdated?.();
    } catch (err) {
      console.error("Delete copy error:", err);
      toast.error("Failed to delete copy.");
    } finally {
      setLoading(false);
    }
  };

  // Bulk delete selected copies
  const handleBulkDelete = async () => {
    if (!selected.length)
      return toast.error("Select copies to delete.");
    if (!window.confirm(`Delete ${selected.length} selected copies?`)) return;

    try {
      setLoading(true);
      await bulkDeleteCopies(selected);
      toast.success("🗑️ Selected copies deleted!");
      setSelected([]);
      fetchCopies();
      onUpdated?.();
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.error("Failed to delete selected copies.");
    } finally {
      setLoading(false);
    }
  };

  // Generate barcode for a copy
  const handleGenerateBarcode = async (copyCode) => {
    try {
      setLoading(true);
      await generateCopyBarcode(copyCode);
      toast.success(`🏷️ Barcode generation started for ${copyCode}`);
    } catch (err) {
      console.error("Generate barcode error:", err);
      toast.error("Failed to start barcode generation.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  return (
    <div className="p-4 border-t mt-4 bg-gray-50 rounded-lg shadow-inner">
      {loading && <Loader overlay />}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-700">
          📦 Copies for {bookCode}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleAddCopy}
            className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700"
          >
            ➕ Add Copy
          </button>
          {selected.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-1.5 rounded hover:bg-red-700"
            >
              🗑️ Delete Selected ({selected.length})
            </button>
          )}
        </div>
      </div>

      {/* Copies Table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-200 text-gray-800">
            <tr>
              <th className="px-2 py-2 text-left">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? copies.map((c) => c.id) : []
                    )
                  }
                  checked={selected.length === copies.length && copies.length > 0}
                />
              </th>
              <th className="px-2 py-2 text-left">Copy Code</th>
              <th className="px-2 py-2 text-left">Status</th>
              <th className="px-2 py-2 text-left">Shelf</th>
              <th className="px-2 py-2 text-left">Condition</th>
              <th className="px-2 py-2 text-left">Added</th>
              <th className="px-2 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {copies.length > 0 ? (
              copies.map((copy) => (
                <tr
                  key={copy.id}
                  className="border-b hover:bg-gray-100 transition"
                >
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(copy.id)}
                      onChange={() => toggleSelect(copy.id)}
                    />
                  </td>
                  <td className="px-2 py-2 font-semibold text-gray-700">
                    {copy.copy_code}
                  </td>
                  <td className="px-2 py-2">
                    {editData?.id === copy.id ? (
                      <select
                        name="status"
                        value={editData.status || ""}
                        onChange={handleEditChange}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option>available</option>
                        <option>borrowed</option>
                        <option>maintenance</option>
                        <option>lost</option>
                      </select>
                    ) : (
                      <span>{copy.status || "available"}</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {editData?.id === copy.id ? (
                      <input
                        name="shelf_location"
                        value={editData.shelf_location || ""}
                        onChange={handleEditChange}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      copy.shelf_location || "-"
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {editData?.id === copy.id ? (
                      <input
                        name="condition"
                        value={editData.condition || ""}
                        onChange={handleEditChange}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      copy.condition || "-"
                    )}
                  </td>
                  <td className="px-2 py-2 text-gray-500">
                    {new Date(copy.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-2 py-2 text-center flex gap-2 justify-center">
                    {editData?.id === copy.id ? (
                      <>
                        <button
                          onClick={handleEditCopy}
                          className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700"
                        >
                          💾 Save
                        </button>
                        <button
                          onClick={() => setEditData(null)}
                          className="bg-gray-400 text-white text-xs px-3 py-1 rounded hover:bg-gray-500"
                        >
                          ✕ Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditData({ ...copy, id: copy.id })}
                          className="bg-yellow-500 text-white text-xs px-3 py-1 rounded hover:bg-yellow-600"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleGenerateBarcode(copy.copy_code)}
                          className="bg-blue-500 text-white text-xs px-3 py-1 rounded hover:bg-blue-600"
                        >
                          🏷️ Barcode
                        </button>
                        <button
                          onClick={() => handleDeleteCopy(copy.copy_code)}
                          className="bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-4 text-gray-500 italic"
                >
                  No copies available for this book.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
