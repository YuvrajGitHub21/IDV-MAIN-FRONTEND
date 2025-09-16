import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const defaultAuthResponse = {
  accessToken: "test-access",
  refreshToken: "test-refresh",
  expiresIn: 3600,
  user: { id: "u1", email: "new@example.com", firstName: "New", lastName: "User" },
};

export const handlers = [
  // Matches any host (works with VITE_API_BASE / VITE_API_URL / fallback IP)
  http.post("*/api/auth/register", async ({ request }) => {
    const body = await request.json(); // optional: assert shape here
    return HttpResponse.json(defaultAuthResponse, { status: 200 });
  }),
];

export const server = setupServer(...handlers);
export { http, HttpResponse }; // re-export for overrides inside tests
