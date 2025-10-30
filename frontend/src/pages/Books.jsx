import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthProvider";
import toast from "react-hot-toast";
import BookCard from "../components/library/BookCard";
import BookFilter from "../components/library/BookFilter";
import Loader from "../components/common/Loader";
import { getBooks } from "../api/libraryApi";

export default function Books() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]); // ✅ must always be an array
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await getBooks({
        search: search.trim(),
        category: category.trim(),
      });

      // ✅ ensure data is always an array
      if (Array.isArray(data)) {
        setBooks(data);
      } else if (data?.results) {
        setBooks(data.results);
      } else if (data?.books) {
        setBooks(data.books);
      } else {
        console.warn("Unexpected API response:", data);
        setBooks([]);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Failed to load books.");
      setBooks([]); // ✅ fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const filteredBooks = Array.isArray(books)
    ? books.filter(
        (b) =>
          b.title?.toLowerCase().includes(search.toLowerCase()) &&
          (category ? b.category === category : true)
      )
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-center text-blue-700 mb-6">
        📚 Library Catalog
      </h1>

      <BookFilter
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        onFilter={loadBooks}
      />

      {loading ? (
        <Loader />
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.book_id} book={book} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-10">No books found.</p>
      )}
    </div>
  );
}
