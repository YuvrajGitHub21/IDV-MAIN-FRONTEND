import "@testing-library/jest-dom";
import "whatwg-fetch";
import { server } from "./testServer";

// MSW lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
