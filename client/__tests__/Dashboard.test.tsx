import { describe, it, expect, beforeEach } from "vitest";
import { vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// --- hoisted fixtures & flags (safe for vi.mock) ---
const h = vi.hoisted(() => ({
  users: [
    {
      id: 1,
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@example.com",
      createdAt: new Date("2024-01-01T10:00:00Z").toISOString(),
    },
    {
      id: 2,
      firstName: "Bob",
      lastName: "Jones",
      email: "bob@example.com",
      createdAt: new Date("2024-01-02T10:00:00Z").toISOString(),
    },
  ],
  profile: { firstName: "Admin", lastName: "User", email: "admin@example.com" },
  failUsers: false,       // set true to make /api/User fail (500)
  unauthorizedUsers: false, // set true to make /api/User return 401
}));

// mock useNavigate but keep the rest of react-router-dom actual
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// mock auth helpers (we only use isAuthenticated here)
vi.mock("@/lib/auth", () => ({
  isAuthenticated: vi.fn(() => true), // default authenticated; flip in tests
  getAccessToken: vi.fn(() => "fake-token"),
}));

// mock AppHeader to render the userName so we can assert on it
vi.mock("@/components/arcon/AppHeader", () => {
  const React = require("react");
  const AppHeader = ({ userName }: { userName: string }) =>
    React.createElement("div", { "data-testid": "app-header" }, userName);
  return { __esModule: true, default: AppHeader };
});

// mock DataTable to a minimal table that shows rows
vi.mock("@/components/arcon/DataTable", () => {
  const React = require("react");
  function DataTable(props: any) {
    const { data = [], loading = false, emptyMessage = "No data", columns = [] } = props;
    if (loading) return React.createElement("div", null, "Loading...");
    if (!data.length) return React.createElement("div", null, emptyMessage);
    return React.createElement(
      "table",
      { "data-testid": "data-table" },
      React.createElement(
        "tbody",
        null,
        data.map((row: any) =>
          React.createElement(
            "tr",
            { key: row.id },
            columns.map((c: any) =>
              React.createElement("td", { key: c.key }, String(row[c.key] ?? ""))
            )
          )
        )
      )
    );
  }
  return { __esModule: true, default: DataTable };
});

// mock fetchWithTokenRefresh and return real Response objects
vi.mock("@/hooks/useTokenRefresh", () => {
  const fetchWithTokenRefresh = vi.fn((url: string) => {
    // users list
    if (url.endsWith("/api/User")) {
      if (h.unauthorizedUsers) {
        return Promise.resolve(new Response("", { status: 401 }));
      }
      if (h.failUsers) {
        return Promise.resolve(new Response("", { status: 500 }));
      }
      return Promise.resolve(
        new Response(JSON.stringify(h.users), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
    // profile
    if (url.endsWith("/api/User/profile")) {
      return Promise.resolve(
        new Response(JSON.stringify(h.profile), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
    // default
    return Promise.resolve(new Response("", { status: 404 }));
  });

  return { __esModule: true, fetchWithTokenRefresh };
});

// import SUT after all mocks
import Dashboard from "@/pages/Dashboard";
import { isAuthenticated } from "@/lib/auth";

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // reset flags before each test
    h.failUsers = false;
    h.unauthorizedUsers = false;
    (isAuthenticated as unknown as Mock).mockReturnValue(true);
  });

  it("redirects to /login when not authenticated", async () => {
    (isAuthenticated as unknown as Mock).mockReturnValue(false);

    render(<Dashboard />);

    // should call navigate('/login')
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/login")
    );
  });

  it("loads users & profile and renders rows", async () => {
    render(<Dashboard />);

    // header shows userName
    expect(await screen.findByTestId("app-header")).toHaveTextContent("Admin User");

    // table renders both emails
    expect(await screen.findByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  it("filters with search input (Toolbar) by name/email", async () => {
    render(<Dashboard />);

    // baseline presence
    await screen.findByText("alice@example.com");
    const search = screen.getByLabelText(/search users/i);
    await userEvent.type(search, "bob");

    // Bob visible, Alice filtered out
    expect(await screen.findByText("bob@example.com")).toBeInTheDocument();
    expect(screen.queryByText("alice@example.com")).not.toBeInTheDocument();
  });

  it("shows error UI when users fetch fails", async () => {
    h.failUsers = true;

    render(<Dashboard />);

    expect(
      await screen.findByText(/failed to fetch users/i)
    ).toBeInTheDocument();
  });

  it("shows Unauthorized error when users fetch returns 401", async () => {
    h.unauthorizedUsers = true;

    render(<Dashboard />);

    expect(await screen.findByText(/unauthorized/i)).toBeInTheDocument();
    // No redirect here (component only shows error)
    expect(mockNavigate).not.toHaveBeenCalledWith("/login");
  });
});
