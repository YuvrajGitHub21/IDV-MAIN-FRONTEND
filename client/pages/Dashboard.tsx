import React from "react";
import AppHeader from "@/components/arcon/AppHeader";
import Toolbar from "@/components/arcon/Toolbar";
import DataTable, { Column } from "@/components/arcon/DataTable";
import EditProfileDialog from "@/components/arcon/EditProfileDialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
//Every thing is running fine with new Database and frontend commit.
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

const columns: Column<User>[] = [
  { key: "id", header: "ID", className: "w-[80px]" },
  { key: "firstName", header: "First Name" },
  { key: "lastName", header: "Last Name" },
  { key: "email", header: "Email" },
  {
    key: "createdAt",
    header: "Created At",
    render: (row) => new Date(row.createdAt).toLocaleString(),
  },
];

const Dashboard: React.FC = () => {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [profile, setProfile] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const navigate = useNavigate();
  const tokenRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    tokenRef.current = localStorage.getItem("access");
    if (!tokenRef.current) {
      navigate("/login");
      return;
    }
    const init = async () => {
      setLoading(true);
      setError("");
      await Promise.all([loadUsers(), loadProfile()]);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch("http://localhost:5294/api/User", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${tokenRef.current}`,
        },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setUsers(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
    }
  };

  const loadProfile = async () => {
    try {
      const res = await fetch("http://localhost:5294/api/User/profile", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${tokenRef.current}`,
        },
      });
      if (!res.ok) return;
      const body = await res.json();
      const p = body?.data ?? body;
      setProfile({
        firstName: p.firstName ?? "",
        lastName: p.lastName ?? "",
        email: p.email ?? "",
      });
    } catch {
      // ignore
    }
  };

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.id.toString(), u.firstName, u.lastName, u.email].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [search, users]);

  const handleSaveProfile = async (data: {
    firstName: string;
    lastName: string;
  }) => {
    const res = await fetch("http://localhost:5294/api/User/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenRef.current}`,
      },
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: profile.email,
      }),
    });
    if (!res.ok) {
      let message = "Failed to update profile";
      try {
        const err = await res.json();
        message = err?.message || message;
      } catch {}
      throw new Error(message);
    }
    await Promise.all([loadProfile(), loadUsers()]);
  };

  return (
    <div className="min-h-screen bg-white">
      <AppHeader
        onSearchChange={setSearch}
        onFilter={() => {}}
        userName={(profile.firstName + " " + profile.lastName).trim()}
      />
      <main className="mx-auto max-w-[1200px] px-6 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-arcon-gray-heading font-roboto">
              Dashboard
            </h1>
            <p className="text-sm text-arcon-gray-secondary font-roboto mt-1">
              All Users
            </p>
          </div>
          <Button
            variant="outline"
            className="h-10 rounded-control border-arcon-gray-border text-arcon-gray-primary"
            onClick={() => setOpen(true)}
          >
            Edit Profile
          </Button>
        </div>

        <div className="mb-4">
          <Toolbar onSearchChange={setSearch} onFilter={() => {}} />
        </div>

        {error ? (
          <div className="rounded-[12px] border border-arcon-gray-border bg-white p-6 text-sm text-red-600 font-roboto">
            {error}
          </div>
        ) : (
          <DataTable<User>
            columns={columns}
            data={filtered}
            loading={loading}
            emptyMessage="No users found. Add a new user to get started."
          />
        )}
      </main>

      <EditProfileDialog
        open={open}
        onOpenChange={setOpen}
        firstName={profile.firstName}
        lastName={profile.lastName}
        email={profile.email}
        onSave={handleSaveProfile}
      />
    </div>
  );
};

export default Dashboard;
