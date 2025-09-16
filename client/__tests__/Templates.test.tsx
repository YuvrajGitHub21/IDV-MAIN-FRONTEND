import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";

// ---- Mock sonner ONCE ----
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
}));
import { toast } from "sonner";

// ---- Mock router (navigate spy) ----
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
import { MemoryRouter } from "react-router-dom";

// ---- Child component stubs ----
vi.mock("@/components/arcon/AddNewTemplateDropdown", () => ({
  AddNewTemplateDropdown: ({ onCreateNew }: { onCreateNew: (n: string) => void }) => (
    <button aria-label="add-new" onClick={() => onCreateNew("New Template")}>Add New</button>
  ),
}));

vi.mock("@/components/arcon/TemplateActionsDropdown", () => ({
  TemplateActionsDropdown: ({
    onPreview,
    onSendInvite,
    onGenerateLink,
    onDownload,
    onRename,
    onClone,
    onEdit,
    onDelete,
  }: any) => (
    <div>
      <button aria-label="preview" onClick={onPreview}>Preview</button>
      <button aria-label="send-invite" onClick={onSendInvite}>SendInvite</button>
      <button aria-label="generate-link" onClick={onGenerateLink}>GenLink</button>
      <button aria-label="download" onClick={onDownload}>Download</button>
      <button aria-label="rename" onClick={onRename}>Rename</button>
      <button aria-label="clone" onClick={onClone}>Clone</button>
      <button aria-label="edit" onClick={onEdit}>Edit</button>
      <button aria-label="delete" onClick={onDelete}>Delete</button>
    </div>
  ),
}));

vi.mock("@/components/arcon/InviteesAvatarGroup", () => ({
  default: () => <div data-testid="invitees">Invitees</div>,
}));

vi.mock("@/components/arcon/TemplateFilterDropdown", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="filter-dropdown">Filter Open</div> : null,
}));

vi.mock("@/components/arcon/ConfirmDeleteDialog", () => ({
  default: ({
    open,
    onOpenChange,
    templateName,
    onConfirm,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    templateName?: string;
    onConfirm: () => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="confirm-delete">
        <div>Confirm delete {templateName || "Template"}</div>
        <button onClick={() => onOpenChange(false)}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    ) : null,
}));

vi.mock("@/components/arcon/SendInviteDialog", () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>Invite Open</div> : null),
}));

// ---- Hook module stubs ----
const applyFiltersMock = vi.fn();
const fetchTemplatesMock = vi.fn();
const fetchMultipleUsersMock = vi.fn();

let hookState: {
  templates: any[];
  totalItems: number;
  loading: boolean;
  error: string | null;
  usersMap: Record<string, string>;
};

vi.mock("@/hooks/useTemplates", () => ({
  useTemplates: () => ({
    templates: hookState.templates,
    totalItems: hookState.totalItems,
    loading: hookState.loading,
    error: hookState.error,
    fetchTemplates: fetchTemplatesMock,
    applyFilters: applyFiltersMock,
  }),
  useUsers: () => ({
    users: hookState.usersMap,
    fetchMultipleUsers: fetchMultipleUsersMock,
  }),
  formatDate: (iso: string) => iso,
  getStatusInfo: (isActive: boolean) =>
    isActive
      ? { label: "Active", className: "text-green-700" }
      : { label: "Inactive", className: "text-gray-500" },
}));

// ===== Component under test =====
import Templates from "@/pages/Templates";

// ===== Helpers =====
const renderPage = () =>
  render(
    <MemoryRouter>
      <Templates />
    </MemoryRouter>
  );

const makeResponse = (over: Partial<Response> = {}): Response =>
  ({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({}),
    text: async () => "",
    headers: new Headers(),
    redirected: false,
    type: "basic",
    url: "http://test",
    clone() { return this as Response; },
    ...over,
  } as unknown as Response);

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  hookState = {
    templates: [
      {
        id: "t1",
        name: "KYC Onboarding",
        createdBy: "507f1f77bcf86cd799439011",
        isActive: true,
        createdAtUtc: "2025-01-01T00:00:00.000Z",
        updatedAtUtc: "2025-01-02T00:00:00.000Z",
        invitees: [{ name: "A" }],
        templateRuleId: 1,
        description: "desc",
      },
      {
        id: "t2",
        name: "Address Proof",
        createdBy: "John Doe",
        isActive: false,
        createdAtUtc: "2025-01-03T00:00:00.000Z",
        updatedAtUtc: "2025-01-04T00:00:00.000Z",
        invitees: [{ name: "B" }],
        templateRuleId: 1,
        description: "",
      },
    ],
    totalItems: 25,
    loading: false,
    error: null,
    usersMap: {
      "507f1f77bcf86cd799439011": "Alice Creator",
    },
  };
});

// ===== Tests =====

describe("Templates page", () => {
  it("renders list with names, creator names and status badges (scoped to table)", () => {
    renderPage();

    const table = screen.getByRole("table");
    expect(within(table).getByText("KYC Onboarding")).toBeInTheDocument();
    expect(within(table).getByText("Address Proof")).toBeInTheDocument();

    expect(within(table).getByText("Alice Creator")).toBeInTheDocument();
    expect(within(table).getByText("John Doe")).toBeInTheDocument();

    expect(within(table).getByText("Active")).toBeInTheDocument();
    expect(within(table).getByText("Inactive")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    hookState.loading = true;
    renderPage();
    expect(screen.getAllByText(/Loading templates/i).length).toBeGreaterThan(0);
  });

  it("shows empty state when no templates", () => {
    hookState.templates = [];
    hookState.totalItems = 0;
    renderPage();
    expect(screen.getAllByText(/No templates found/i).length).toBeGreaterThan(0);
  });

  it("shows error banner when error exists", () => {
    hookState.error = "Boom";
    renderPage();
    expect(screen.getByText(/Error loading templates/i)).toBeInTheDocument();
    expect(screen.getByText("Boom")).toBeInTheDocument();
  });

  it("applies search filter when typing in search box", async () => {
    renderPage();
    const search = screen.getByPlaceholderText("Search");
    fireEvent.change(search, { target: { value: "kyc" } });
    await waitFor(() =>
      expect(applyFiltersMock).toHaveBeenCalledWith(
        expect.objectContaining({ search: "kyc" })
      )
    );
  });

  it("changes page size and resets page; range text updates", async () => {
    renderPage();
    expect(screen.getByText("1-12 of 25")).toBeInTheDocument();

    const select = screen.getByDisplayValue("12") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "24" } });

    await waitFor(() =>
      expect(applyFiltersMock).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 24, page: 1 })
      )
    );

    expect(screen.getByText("1-24 of 25")).toBeInTheDocument();
  });

  it("opens filter dropdown when clicking Filter", () => {
    renderPage();
    fireEvent.click(screen.getByText("Filter"));
    expect(screen.getByTestId("filter-dropdown")).toBeInTheDocument();
  });

  it("delete flow: opens confirm and calls DELETE then refreshes list", async () => {
    localStorage.setItem("access", "token");
    global.fetch = vi.fn().mockResolvedValueOnce(makeResponse({ ok: true }));

    renderPage();
    const table = screen.getByRole("table");
    const row = within(table).getByText("KYC Onboarding").closest("tr")!;

    fireEvent.click(within(row).getByLabelText("delete"));

    const dialog = await screen.findByRole("dialog", { name: /confirm-delete/i });
    fireEvent.click(within(dialog).getByText("Confirm"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/Template\/t1$/),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    expect(fetchTemplatesMock).toHaveBeenCalled();
    expect(applyFiltersMock).toHaveBeenCalled();
  });

  it("rename flow: validates >30 char then succeeds", async () => {
    localStorage.setItem("access", "token");
    global.fetch = vi.fn().mockResolvedValue(makeResponse({ ok: true, status: 204 }));

    renderPage();

    const table = screen.getByRole("table");
    const row = within(table).getByText("KYC Onboarding").closest("tr")!;

    fireEvent.click(within(row).getByLabelText("rename"));

    const input = await screen.findByPlaceholderText(/Enter new template name/i);

    fireEvent.change(input, { target: { value: "X".repeat(31) } });
    expect(await screen.findByText(/Max length is 30/i)).toBeInTheDocument();
    const renameBtn = screen.getByRole("button", { name: "Rename" });
    expect(renameBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: "New Name" } });
    await waitFor(() => expect(renameBtn).not.toBeDisabled());

    fireEvent.click(renameBtn);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/Template\/t1$/),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ name: "New Name" }),
        })
      )
    );

    expect(fetchTemplatesMock).toHaveBeenCalled();
    expect(applyFiltersMock).toHaveBeenCalled();
    // expect(toastSuccess).toHaveBeenCalledWith("Template renamed successfully");
    expect((toast.success as unknown as Mock)).toHaveBeenCalledWith("Template renamed successfully");
  });

  it("preview action fetches details and navigates", async () => {
    localStorage.setItem("access", "token");
    global.fetch = vi.fn().mockResolvedValueOnce(
      makeResponse({
        ok: true,
        json: async () =>
          ({ Id: 99, Name: "KYC Onboarding", activeVersion: { versionId: 42 } } as any),
      })
    );

    renderPage();

    const table = screen.getByRole("table");
    const row = within(table).getByText("KYC Onboarding").closest("tr")!;

    fireEvent.click(within(row).getByLabelText("preview"));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        "/preview-backend/t1",
        expect.objectContaining({
          state: expect.objectContaining({
            templateName: "KYC Onboarding",
            templateId: "t1",
          }),
        })
      )
    );
  });
});
