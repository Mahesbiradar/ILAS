import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AdminTransactionList from "../AdminTransactionList";
import * as transactionApi from "../../../../services/transactionApi";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("AdminTransactionList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders transactions from server and shows pagination info", async () => {
    const mockData = {
      results: [
        {
          id: 1,
          user: { username: "alice" },
          book: { title: "Test Driven Development" },
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

    render(<AdminTransactionList />);

    // header should appear
    expect(screen.getByText(/All Book Transactions/i)).toBeInTheDocument();

    // wait for transaction to be rendered
    await waitFor(() => {
      expect(screen.getByText(/Test Driven Development/i)).toBeInTheDocument();
    });

    // pagination info should show 'Page 1 of 1' after load
    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 1/i)).toBeInTheDocument();
    });
  });
});
