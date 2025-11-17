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
      success: true,
      data: [
        {
          id: 1,
          book_id: 1,
          book_code: "BOOK-001",
          title: "Clean Code",
          author: "Robert C. Martin",
          category: "Programming",
          quantity: 3,
          status: "AVAILABLE",
        },
        {
          id: 2,
          book_id: 2,
          book_code: "BOOK-002",
          title: "Design Patterns",
          author: "Gang of Four",
          category: "Programming",
          quantity: 2,
          status: "AVAILABLE",
        },
      ],
      count: 2,
      next: null,
      previous: null,
    };

    vi.spyOn(libraryApi, "getBooks").mockResolvedValue(mockData);
    vi.spyOn(libraryApi, "getLibraryMeta").mockResolvedValue({
      categories: [{ id: 1, name: "Programming" }],
    });

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
      // Check if pagination controls exist
      const prevButton = screen.getByRole("button", { name: /prev/i });
      const nextButton = screen.getByRole("button", { name: /next/i });
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify getBooks was called
    expect(libraryApi.getBooks).toHaveBeenCalled();
  });
});
