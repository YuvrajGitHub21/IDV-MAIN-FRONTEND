import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "@/pages/Login";

// ---- mocks ----
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return { ...actual, useNavigate: () => mockNavigate };
});

// we’ll stub these per-test
const mockStoreAuthData = vi.fn();
const mockIsAuthenticated = vi.fn(() => false);

vi.mock("@/lib/auth", () => ({
  // types are compile-time only; no runtime export needed
  storeAuthData: (...args: any[]) => mockStoreAuthData(...args),
  isAuthenticated: () => mockIsAuthenticated(),
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Login />
    </MemoryRouter>
  );
}

const validEmail = "alice@example.com";
const validPassword = "secret1";

// helper to fill the form
async function fillValidForm() {
  await userEvent.type(
    screen.getByPlaceholderText(/enter mobile number or email address/i),
    validEmail
  );
  await userEvent.type(
    screen.getByPlaceholderText(/enter your password/i),
    validPassword
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Login page", () => {
  it("shows validation errors for empty/invalid fields", async () => {
    renderLogin();

    // empty submit
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();

    // invalid values
    await userEvent.type(
      screen.getByPlaceholderText(/enter mobile number or email address/i),
      "not-an-email"
    );
    await userEvent.type(
      screen.getByPlaceholderText(/enter your password/i),
      "123"
    );
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByText(/please enter a valid email address/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/password must be at least 6 characters/i)
    ).toBeInTheDocument();
  });

  it("submits successfully and navigates to /dashboard on 200", async () => {
    // mock successful fetch
    const authPayload = { accessToken: "tok", refreshToken: "ref" };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => authPayload,
    } as any);

    renderLogin();
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(mockStoreAuthData).toHaveBeenCalledWith(authPayload)
    );
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  it("shows server error message when backend returns 400+", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Invalid credentials" }),
    } as any);

    renderLogin();
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByText(/invalid credentials/i)
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("handles network error gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("boom"));

    renderLogin();
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByText(/network error\. please try again\./i)
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("redirects immediately if already authenticated", async () => {
    mockIsAuthenticated.mockReturnValueOnce(true);

    renderLogin();
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });
});
