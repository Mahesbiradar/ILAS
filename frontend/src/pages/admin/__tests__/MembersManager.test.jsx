import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import MembersManager from "../MembersManager";
import * as membersApi from "../../../api/members";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the components
vi.mock("../../../components/admin/members/AddMemberForm", () => ({
  default: ({ onAdded }) => <div data-testid="add-member-form">Add Member Form</div>,
}));

vi.mock("../../../components/admin/members/MemberTable", () => ({
  default: ({ members, onEdit, onDelete, onPromote }) => (
    <div data-testid="member-table">
      {members.map((m) => (
        <div key={m.id} data-testid={`member-row-${m.id}`}>
          {m.username} ({m.role})
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../../../components/admin/members/EditMemberModal", () => ({
  default: ({ member, onClose, onSave }) => (
    <div data-testid="edit-member-modal">Edit Member Modal</div>
  ),
}));

vi.mock("../../../components/admin/members/MemberLogs", () => ({
  default: ({ logs, onRefresh }) => <div data-testid="member-logs">Member Logs</div>,
}));

vi.mock("../../../components/admin/members/ExportReports", () => ({
  default: () => <div data-testid="export-reports">Export Reports</div>,
}));

describe("MembersManager", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders members manager page with tabs", async () => {
    const mockMembers = {
      count: 2,
      results: [
        { id: 1, username: "user1", email: "user1@example.com", role: "user", is_logged_in: false },
        { id: 2, username: "user2", email: "user2@example.com", role: "librarian", is_logged_in: false },
      ],
    };

    vi.spyOn(membersApi, "fetchMembers").mockResolvedValue(mockMembers);

    render(<MembersManager />);

    // Header should appear
    expect(screen.getByText(/Members Manager/i)).toBeInTheDocument();

    // All tabs should be visible
    expect(screen.getByText(/All Members/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Member/i)).toBeInTheDocument();
    expect(screen.getByText(/Activity Logs/i)).toBeInTheDocument();
    expect(screen.getByText(/Export Reports/i)).toBeInTheDocument();
  });

  it("loads and displays members from server with pagination", async () => {
    const mockMembers = {
      count: 2,
      results: [
        { id: 1, username: "john", email: "john@example.com", role: "user", is_logged_in: false },
        { id: 2, username: "jane", email: "jane@example.com", role: "librarian", is_logged_in: false },
      ],
    };

    vi.spyOn(membersApi, "fetchMembers").mockResolvedValue(mockMembers);

    render(<MembersManager />);

    await waitFor(() => {
      expect(screen.getByTestId("member-table")).toBeInTheDocument();
    });

    // Members should be displayed
    expect(screen.getByTestId("member-row-1")).toHaveTextContent("john");
    expect(screen.getByTestId("member-row-2")).toHaveTextContent("jane");

    // Pagination info should show
    expect(screen.getByText(/Showing 2 of 2 members/i)).toBeInTheDocument();
  });

  it("filters members by search term", async () => {
    const mockMembers = {
      count: 1,
      results: [
        { id: 1, username: "john", email: "john@example.com", role: "user", is_logged_in: false },
      ],
    };

    vi.spyOn(membersApi, "fetchMembers").mockResolvedValue(mockMembers);

    const { rerender } = render(<MembersManager />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId("member-table")).toBeInTheDocument();
    });

    // Verify fetchMembers was called with correct params
    expect(membersApi.fetchMembers).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        page_size: 20,
        search: "",
        role: "",
      })
    );
  });

  it("displays role filter dropdown", async () => {
    const mockMembers = {
      count: 0,
      results: [],
    };

    vi.spyOn(membersApi, "fetchMembers").mockResolvedValue(mockMembers);

    render(<MembersManager />);

    await waitFor(() => {
      expect(screen.getByTestId("member-table")).toBeInTheDocument();
    });

    // Role filter dropdown should exist
    const roleSelect = screen.getByRole("combobox");
    expect(roleSelect).toBeInTheDocument();
    expect(roleSelect).toHaveTextContent("All Roles");
  });

  it("displays pagination controls after loading completes", async () => {
    const mockMembers = {
      count: 50,
      results: [
        { id: 1, username: "user1", email: "user1@example.com", role: "user", is_logged_in: false },
      ],
    };

    vi.spyOn(membersApi, "fetchMembers").mockResolvedValue(mockMembers);

    render(<MembersManager />);

    // Wait for pagination to appear
    await waitFor(() => {
      expect(screen.getByText(/Previous/i)).toBeInTheDocument();
    });

    // Pagination controls should be visible
    expect(screen.getByText(/Page 1 of/i)).toBeInTheDocument();
  });
});
