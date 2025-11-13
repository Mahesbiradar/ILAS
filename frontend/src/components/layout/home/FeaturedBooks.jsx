// src/components/layout/home/FeaturedBooks.jsx
import React, { useEffect, useState } from "react";
import BookCard from "../../library/BookCard";
import { getPublicBooks } from "../../../api/libraryApi";
import Loader from "../../common/Loader";

export default function FeaturedBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getPublicBooks({ ordering: "-created_at", page: 1, page_size: 6 });
        if (mounted) setBooks(data.results || []);
      } catch (err) {
        console.warn("Failed to load featured books:", err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  if (loading) return <Loader />;

  if (!books.length)
    return <p className="text-center text-gray-500">No featured books available.</p>;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {books.map((b) => (
          <BookCard key={b.book_id || b.id || b.book_code} book={b} />
        ))}
      </div>
    </div>
  );
}
