// src/components/books/index.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import toast from "react-hot-toast";
import BookList from "./BookList";
import BookFilter from "./BookFilter";
import Loader from "../common/Loader";

export default function Books() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

 // 📚 Mock book data for Electronics, Telecom, and Programming
const mockBooks = [
  {
    book_id: 1,
    title: "Fundamentals of Signals and Systems",
    author: "Alan V. Oppenheim",
    isbn: "978-0138147570",
    category: "Signal Processing",
    quantity: 4,
    cover_url: "/assets/covers/signal.jpg",
  },
  {
    book_id: 2,
    title: "Embedded Systems with ARM Cortex-M Microcontrollers",
    author: "Jonathan W. Valvano",
    isbn: "978-1477508992",
    category: "Embedded Systems",
    quantity: 3,
    cover_url: "/assets/covers/embedded.jpg",
  },
  {
    book_id: 3,
    title: "Antenna and Wave Propagation",
    author: "K.D. Prasad",
    isbn: "978-8122418586",
    category: "Telecommunication",
    quantity: 5,
    cover_url: "/assets/covers/antenna.jpg",
  },
  {
    book_id: 4,
    title: "Python for Engineers",
    author: "Rakesh Ranjan",
    isbn: "978-8193897942",
    category: "Programming",
    quantity: 2,
    cover_url: "/assets/covers/python.jpg",
  },
  {
    book_id: 5,
    title: "Engineering Mathematics - Vol 1",
    author: "B.S. Grewal",
    isbn: "978-8187433665",
    category: "Engineering Mathematics",
    quantity: 6,
    cover_url: "/assets/covers/maths.jpg",
  },
  {
    book_id: 6,
    title: "IoT: Building Internet of Things",
    author: "Raj Kamal",
    isbn: "978-9353164973",
    category: "IoT",
    quantity: 0,
    cover_url: "/assets/covers/iot.jpg",
  },
  {
    book_id: 7,
    title: "Data Communication and Networking",
    author: "Behrouz A. Forouzan",
    isbn: "978-1259064753",
    category: "Networking",
    quantity: 5,
    cover_url: "/assets/covers/network.jpg",
  },
  {
    book_id: 8,
    title: "Microcontrollers: Principles and Applications",
    author: "Ajay V. Deshmukh",
    isbn: "978-0070585959",
    category: "Microcontrollers",
    quantity: 3,
    cover_url: "/assets/covers/microcontroller.jpg",
  },
];


  useEffect(() => {
    // simulate API
    setTimeout(() => {
      setBooks(mockBooks);
      setLoading(false);
    }, 500);
  }, []);

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
    if (book.quantity > 0) toast.success(`Borrow request sent for "${book.title}"`);
    else toast.error("Book unavailable.");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-center text-blue-700 mb-6">
        📚 Available Books
      </h1>

      <BookFilter
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
      />

      {loading ? (
        <Loader />
      ) : (
        <BookList books={filteredBooks} onBorrow={handleBorrow} userRole={user?.role} />
      )}
    </div>
  );
}
