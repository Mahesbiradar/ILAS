import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthProvider";
import toast from "react-hot-toast";
import BookCard from "../components/books/BookCard";
import BookFilter from "../components/books/BookFilter";
import Loader from "../components/common/Loader";

export default function Books() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // Temporary mock data (replace later with API)
  const mockBooks = [
    {
      book_id: 1,
      title: "Learn React the Right Way",
      author: "OpenAI",
      isbn: "123-456-789",
      category: "Technology",
      quantity: 3,
      cover_url: "/assets/covers/webdev.jpg",
    },
    {
      book_id: 2,
      title: "Artificial Intelligence Basics",
      author: "John AI",
      isbn: "987-654-321",
      category: "Science",
      quantity: 0,
      cover_url: "/assets/covers/ai.jpg",
    },
    {
      book_id: 3,
      title: "The Physics of Everything",
      author: "Dr. Cosmos",
      isbn: "555-666-777",
      category: "Science",
      quantity: 5,
      cover_url: "/assets/covers/space.jpg",
    },
  ];

  useEffect(() => {
    // Simulate fetch delay
    setTimeout(() => {
      setBooks(mockBooks);
      setLoading(false);
    }, 500);
  }, []);

  // Filtered books
  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) &&
      (category ? b.category === category : true)
  );

  const handleBorrow = (book) => {
    if (user?.role === "admin") {
      toast.error("Admins cannot borrow books.");
      return;
    }
    if (book.quantity > 0) {
      toast.success(`Borrow request sent for "${book.title}"`);
    } else {
      toast.error("Book unavailable at the moment.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-center text-blue-700 mb-6">
        📚 Available Books
      </h1>

      {/* Filters */}
      <BookFilter
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
      />

      {/* Content */}
      {loading ? (
        <Loader />
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.book_id}
              book={book}
              onBorrow={handleBorrow}
              isDisabled={user?.role === "admin"}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-10">No books found.</p>
      )}
    </div>
  );
}
