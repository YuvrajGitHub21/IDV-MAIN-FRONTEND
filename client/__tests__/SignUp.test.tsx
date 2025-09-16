import { waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";

import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import SignUp from "@/pages/SignUp";
import { server, http, HttpResponse } from "@/test/testServer";

// ---- Mock @/lib/auth (runtime only; TS types are erased) ----
const mockStoreAuthData = vi.fn();
const mockIsAuthenticated = vi.fn(() => false);

vi.mock("@/lib/auth", () => ({
  storeAuthData: (...args: any[]) => mockStoreAuthData(...args),
  isAuthenticated: () => mockIsAuthenticated(),
}));

// ---- Mock useNavigate so we can assert redirects ----
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// (Optional) localStorage stub if needed by other code
vi.stubGlobal("localStorage", {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

// Helper to fill the form
async function fillValidForm() {
  await userEvent.type(screen.getByLabelText(/first name/i), "Alice");
  await userEvent.type(screen.getByLabelText(/last name/i), "Smith");
  await userEvent.type(screen.getByLabelText(/email address/i), "alice@example.com");
  await userEvent.type(screen.getByLabelText(/phone number/i), "1234567890");
  await userEvent.type(screen.getByLabelText(/^password$/i), "secret1");
  await userEvent.type(screen.getByLabelText(/confirm password/i), "secret1");
}

describe("SignUp page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(false);
  });

  it("shows validation errors for empty/invalid fields", async () => {
    render(<SignUp />);

    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();

    // Mismatch passwords
    await userEvent.type(screen.getByLabelText(/^password$/i), "secret1");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "nope");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("submits successfully and navigates to /dashboard on 200", async () => {
    render(<SignUp />);
    await fillValidForm();

    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => expect(mockStoreAuthData).toHaveBeenCalledTimes(1));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  it("shows server error message when backend returns 400+", async () => {
    server.use(
      http.post("*/api/auth/register", async () =>
        HttpResponse.json({ message: "Email already registered" }, { status: 400 })
      )
    );

    render(<SignUp />);
    await fillValidForm();

    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/email already registered/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith("/dashboard", expect.anything());
  });

  it("handles network error gracefully", async () => {
    // server.use(
    //   http.post("*/api/auth/register", async () => new HttpResponse(null, { status: 500 }))
    // );
    
    server.use(
    http.post("*/api/auth/register", () => HttpResponse.error())
    );

    render(<SignUp />);
    await fillValidForm();

    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText(/network error\. please try again\./i)
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("redirects immediately if already authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(true);

    render(<SignUp />);

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true })
    );
  });
});
