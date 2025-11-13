import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import LibraryOperations from "../LibraryOperations";
import * as transactionApi from "../../../services/transactionApi";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the BarcodeScanner component to avoid camera/device enumeration errors
vi.mock("../../../components/admin/libraryOps/BarcodeScanner", () => ({
  default: ({ onDetected, isActive }) => (
    <div data-testid="barcode-scanner">Barcode Scanner (mocked)</div>
  ),
}));

// Mock ManualScanInput
vi.mock("../../../components/admin/libraryOps/ManualScanInput", () => ({
  default: ({ onScan }) => (
    <div data-testid="manual-input">Manual Scan Input (mocked)</div>
  ),
}));

// Mock ScanResultCard
vi.mock("../../../components/admin/libraryOps/ScanResultCard", () => ({
  default: ({ book, onIssue, onReturn, onUpdateStatus, loading }) => (
    <div data-testid="scan-result">
      {book && <div data-testid="book-title">{book.title}</div>}
    </div>
  ),
}));

describe("LibraryOperations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders the library operations page with tabs", async () => {
    vi.spyOn(transactionApi, "lookupBookByCode").mockResolvedValue({});

    render(<LibraryOperations />);

    // Page header should appear
    expect(screen.getByText(/Library Operations/i)).toBeInTheDocument();

    // All tabs should be rendered (use more specific selector to avoid ambiguity)
    const tabs = screen.getAllByRole("button", { class: /px-4 py-3/ });
    expect(tabs.length).toBeGreaterThanOrEqual(3);
  });

  it("renders issue book tab with form inputs", async () => {
    vi.spyOn(transactionApi, "lookupBookByCode").mockResolvedValue({});

    render(<LibraryOperations />);

    // Check for form elements specific to Issue Book tab
    expect(screen.getByPlaceholderText(/Scan a book/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter member ID/i)).toBeInTheDocument();
  });
});
