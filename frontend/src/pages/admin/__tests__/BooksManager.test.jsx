import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import BooksManager from "../BooksManager";
import * as libraryApi from "../../../api/libraryApi";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("BooksManager", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("loads and displays books with pagination", async () => {
    const mockData = {
      results: [
        {
          book_id: 1,
          book_code: "BOOK-001",
          title: "Clean Code",
          author: "Robert C. Martin",
          category: "Programming",
          quantity: 3,
        },
        {
          book_id: 2,
          book_code: "BOOK-002",
          title: "Design Patterns",
          author: "Gang of Four",
          category: "Programming",
          quantity: 2,
        },
      ],
      count: 2,
      next: null,
      previous: null,
    };

    vi.spyOn(libraryApi, "getBooks").mockResolvedValue(mockData);

    render(
      <BrowserRouter>
        <BooksManager />
      </BrowserRouter>
    );

    // Header should appear
    expect(screen.getByText(/Books Manager/i)).toBeInTheDocument();

    // Wait for books to load and table to render
    await waitFor(() => {
      expect(screen.getByText("Clean Code")).toBeInTheDocument();
      expect(screen.getByText("Design Patterns")).toBeInTheDocument();
    });

    // Pagination info should show
    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 1/i)).toBeInTheDocument();
    });

    // Verify getBooks was called
    expect(libraryApi.getBooks).toHaveBeenCalled();
  });
});
