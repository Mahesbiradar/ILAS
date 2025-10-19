// src/components/layout/home/FeaturedBooks.jsx
import React from "react";
import BookCard from "../../books/BookCard";

/**
 * Example featured books: replace with API call when backend ready.
 */
const mockBooks = [
  {
    book_id: 1,
    title: "Learn WebDev",
    author: "OpenAI",
    isbn: "012-345-6789",
    category: "Technology",
    quantity: 4,
    cover_url: "/assets/covers/webdev.jpg",
  },
  {
    book_id: 2,
    title: "Intro to AI",
    author: "A. Researcher",
    isbn: "111-222-333",
    category: "Technology",
    quantity: 2,
    cover_url: "/assets/covers/ai.jpg",
  },
  {
    book_id: 3,
    title: "Space & Beyond",
    author: "Cosmos Author",
    isbn: "444-555-666",
    category: "Science",
    quantity: 1,
    cover_url: "/assets/covers/space.jpg",
  },
];

export default function FeaturedBooks() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {mockBooks.map((b) => (
          <BookCard key={b.book_id} book={b} />
        ))}
      </div>
    </div>
  );
}
