import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import UserDashboard from "../UserDashboard";
import * as transactionApi from "../../../../services/transactionApi";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("UserDashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("loads and displays user stats from transaction API", async () => {
    const mockStats = {
      results: [],
      count: 5,
      next: null,
      previous: null,
    };

    vi.spyOn(transactionApi, "getActiveTransactions").mockResolvedValue(mockStats);

    render(
      <BrowserRouter>
        <UserDashboard />
      </BrowserRouter>
    );

    // Wait for header to appear
    await waitFor(() => {
      expect(screen.getByText(/Welcome to Your Library/i)).toBeInTheDocument();
    });

    // Wait for stat values to appear (5, 5, 5)
    await waitFor(() => {
      const values = screen.getAllByText("5");
      expect(values.length).toBeGreaterThanOrEqual(3); // At least the 3 stat cards
    });

    // Verify that getActiveTransactions was called 3 times (borrowed, returned, pending)
    expect(transactionApi.getActiveTransactions).toHaveBeenCalledTimes(3);
  });
});
