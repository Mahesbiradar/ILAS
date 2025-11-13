import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import UserTransactionList from "../UserTransactionList";
import * as transactionApi from "../../../../services/transactionApi";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("UserTransactionList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders user borrow history from server with pagination", async () => {
    const mockData = {
      results: [
        {
          id: 1,
          user: { username: "john" },
          book: { title: "Clean Code" },
          status: "approved",
          request_date: "2025-11-01",
          issue_date: "2025-11-02",
          return_date: null,
        },
      ],
      count: 1,
      next: null,
      previous: null,
    };

    vi.spyOn(transactionApi, "getActiveTransactions").mockResolvedValue(mockData);

    render(<UserTransactionList />);

    // header should appear
    expect(screen.getByText(/Borrow History/i)).toBeInTheDocument();

    // wait for transaction to be rendered
    await waitFor(() => {
      expect(screen.getByText(/Clean Code/i)).toBeInTheDocument();
    });

    // pagination info should show 'Page 1 of 1' after load
    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 1/i)).toBeInTheDocument();
    });
  });
});
