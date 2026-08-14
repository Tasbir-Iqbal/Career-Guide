import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  FileDown,
  Loader2,
  MessageSquareWarning,
  Plus,
  Search,
  Tags,
  UserCheck,
  Users,
  X,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

type Tab = "accounts" | "categories" | "stats" | "reports" | "feedback";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "student" | "counselor" | "admin";
  created_at: string;
};

type AdminSession = {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  counselor_id: number;
  counselor_name: string;
  counselor_email: string;
  session_date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
};

type AdminStats = {
  total_users: number;
  total_students: number;
  total_counselors: number;
  total_admins: number;
  total_sessions: number;
  pending_sessions: number;
  confirmed_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
};

type CounselorForm = {
  name: string;
  email: string;
  password: string;
  specialization: string;
  bio: string;
  availability: string;
};

const EMPTY_COUNSELOR_FORM: CounselorForm = {
  name: "",
  email: "",
  password: "",
  specialization: "",
  bio: "",
  availability: "Available",
};

export function AdminDashboard() {
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAdminData() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [usersResponse, sessionsResponse, statsResponse] =
        await Promise.all([
          fetch(`${API_URL}/admin/users`, { headers }),
          fetch(`${API_URL}/admin/sessions`, { headers }),
          fetch(`${API_URL}/admin/stats`, { headers }),
        ]);

      if (!usersResponse.ok || !sessionsResponse.ok || !statsResponse.ok) {
        throw new Error(
          "Could not load admin data. Please confirm you are logged in as an admin."
        );
      }

      const [usersData, sessionsData, statsData] = await Promise.all([
        usersResponse.json(),
        sessionsResponse.json(),
        statsResponse.json(),
      ]);

      setUsers(usersData);
      setSessions(sessionsData);
      setStats(statsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load admin data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [token]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full">
      <aside className="w-full lg:w-64 bg-slate-900 text-white lg:min-h-[calc(100vh-4rem)] flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center text-red-400">
              <BarChart3 className="w-5 h-5" />
            </div>

            <div>
              <h2 className="font-bold leading-tight">Admin Console</h2>
              <p className="text-xs text-slate-400">
                {user?.name || "System Administrator"}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {[
            { id: "accounts" as Tab, name: "Users & Counselors", icon: UserCheck },
            { id: "stats" as Tab, name: "System Stats", icon: BarChart3 },
            { id: "categories" as Tab, name: "Career Categories", icon: Tags },
            { id: "reports" as Tab, name: "Activity Reports", icon: FileDown },
            { id: "feedback" as Tab, name: "Feedback", icon: MessageSquareWarning },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-8 bg-gray-50 overflow-y-auto">
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            Loading admin data...
          </div>
        ) : error ? (
          <div className="max-w-4xl mx-auto bg-white rounded-xl border border-red-200 p-6 text-center">
            <h1 className="text-xl font-bold text-gray-900">
              Could not load Admin Console
            </h1>
            <p className="text-red-600 text-sm mt-2">{error}</p>
            <button
              onClick={loadAdminData}
              className="mt-5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {activeTab === "accounts" && (
              <AccountsView
                users={users}
                token={token}
                onCounselorCreated={loadAdminData}
              />
            )}

            {activeTab === "stats" && (
              <StatsView stats={stats} sessions={sessions} />
            )}

            {activeTab === "categories" && <CategoriesView />}
            {activeTab === "reports" && <ReportsView />}
            {activeTab === "feedback" && <FeedbackView />}
          </>
        )}
      </main>
    </div>
  );
}

function AccountsView({
  users,
  token,
  onCounselorCreated,
}: {
  users: AdminUser[];
  token: string | null;
  onCounselorCreated: () => Promise<void>;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CounselorForm>(EMPTY_COUNSELOR_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter(
      (account) =>
        account.name.toLowerCase().includes(query) ||
        account.email.toLowerCase().includes(query) ||
        account.role.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  async function createCounselor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setMessage("Your login session has expired.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(`${API_URL}/admin/counselors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          specialization: form.specialization || null,
          bio: form.bio || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not create counselor.");
      }

      setMessage(`Counselor account for ${data.name} was created.`);
      setForm(EMPTY_COUNSELOR_FORM);
      setShowForm(false);
      await onCounselorCreated();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not create counselor."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Users & Counselor Accounts
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Review registered accounts and create verified counselor profiles.
          </p>
        </div>

        <button
          onClick={() => {
            setMessage("");
            setShowForm(!showForm);
          }}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Close Form" : "Create Counselor"}
        </button>
      </div>

      {message && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={createCounselor}
          className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
          <h2 className="font-bold text-gray-900 mb-5">
            Create Counselor Account
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              ["name", "Full name", "text"],
              ["email", "Email address", "email"],
              ["password", "Temporary password", "password"],
              ["specialization", "Specialization", "text"],
              ["availability", "Availability", "text"],
            ].map(([field, label, type]) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  required={field === "name" || field === "email" || field === "password"}
                  value={form[field as keyof CounselorForm]}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      [field]: event.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Counselor bio
              </label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(event) =>
                  setForm({ ...form, bio: event.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Creating..." : "Create Counselor"}
          </button>
        </form>
      )}

      <div className="flex justify-end mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute w-5 h-5 left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-170">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredUsers.map((account) => (
              <tr key={account.id}>
                <td className="p-4 font-medium text-gray-900">{account.name}</td>
                <td className="p-4 text-gray-600">{account.email}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      account.role === "admin"
                        ? "bg-red-100 text-red-700"
                        : account.role === "counselor"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {account.role}
                  </span>
                </td>
                <td className="p-4 text-gray-500">
                  {new Date(account.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatsView({
  stats,
  sessions,
}: {
  stats: AdminStats | null;
  sessions: AdminSession[];
}) {
  if (!stats) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        System Statistics
      </h1>
      <p className="text-gray-600 text-sm mb-6">
        Live totals from the CareerGuide database.
      </p>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {[
          ["Total Users", stats.total_users, Users],
          ["Students", stats.total_students, UserCheck],
          ["Counselors", stats.total_counselors, UserCheck],
          ["Total Sessions", stats.total_sessions, Calendar],
        ].map(([label, value, Icon]) => (
          <div key={String(label)} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-sm text-gray-500 font-medium">{label}</p>
              <Icon className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Session Status</h2>
          {[
            ["Pending", stats.pending_sessions, "bg-amber-500"],
            ["Confirmed", stats.confirmed_sessions, "bg-blue-500"],
            ["Completed", stats.completed_sessions, "bg-green-500"],
            ["Cancelled", stats.cancelled_sessions, "bg-red-500"],
          ].map(([label, count, color]) => (
            <div key={String(label)} className="flex items-center justify-between py-3 border-b last:border-0">
              <span className="flex items-center gap-2 text-gray-700">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {label}
              </span>
              <span className="font-bold text-gray-900">{count}</span>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Recent Bookings</h2>
          {sessions.slice(0, 5).map((session) => (
            <div key={session.id} className="py-3 border-b last:border-0">
              <p className="font-medium text-sm text-gray-900">
                {session.student_name} → {session.counselor_name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(session.session_date).toLocaleString()} · {session.status}
              </p>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-sm text-gray-500">No bookings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoriesView() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Career Categories</h1>
      <p className="text-gray-600 text-sm mb-6">Category management is the next content feature.</p>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {["Engineering", "Medical", "Arts & Design", "Business", "Law", "Data Science"].map((category) => (
          <div key={category} className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="font-medium text-gray-900">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsView() {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
      <FileDown className="w-12 h-12 text-blue-500 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-gray-900">Activity Reports</h1>
      <p className="text-gray-600 mt-2">PDF reporting can be added after the core content features.</p>
    </div>
  );
}

function FeedbackView() {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
      <MessageSquareWarning className="w-12 h-12 text-blue-500 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-gray-900">Feedback & Complaints</h1>
      <p className="text-gray-600 mt-2">Feedback storage and moderation will be added in a later feature.</p>
    </div>
  );
}