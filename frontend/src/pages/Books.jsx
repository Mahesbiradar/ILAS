import { useEffect, useState } from "react";

function Books() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/books/")
      .then((response) => response.json())
      .then((data) => setBooks(data))
      .catch((error) => console.error("Error fetching books:", error));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📚 Library Books</h1>
      {books.length === 0 ? (
        <p>No books available.</p>
      ) : (
        <ul className="space-y-2">
          {books.map((book) => (
            <li key={book.id} className="p-4 border rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold">{book.title}</h2>
              <p className="text-gray-600">Author: {book.author}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Books;
