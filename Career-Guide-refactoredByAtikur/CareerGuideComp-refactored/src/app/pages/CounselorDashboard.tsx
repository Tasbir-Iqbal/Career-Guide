import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Users,
  Video,
  XCircle,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

type Tab = "students" | "content" | "chat" | "webinars";
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

type CounselorSession = {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  counselor_id: number;
  session_date: string;
  status: BookingStatus;
};

type Article = {
  id: number;
  title: string;
  content: string;
  category: string | null;
  author_id: number | null;
  created_at: string;
};

type ChatMessage = {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
};

type ChatConversation = {
  id: number;
  student_id: number;
  student_name: string;
  counselor_id: number;
  counselor_name: string;
  created_at: string;
  updated_at: string;
  last_message: ChatMessage | null;
};

type ChatConversationDetail = ChatConversation & {
  messages: ChatMessage[];
};

export function CounselorDashboard() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("students");
  const [sessions, setSessions] = useState<CounselorSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");

  const loadSessions = useCallback(async () => {
    if (!token) {
      setSessionsLoading(false);
      return;
    }

    try {
      setSessionsLoading(true);
      setSessionsError("");

      const response = await fetch(`${API_URL}/counselors/me/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Could not load session requests.");
      }

      setSessions(await response.json());
    } catch (error) {
      setSessionsError(
        error instanceof Error ? error.message : "Could not load sessions."
      );
    } finally {
      setSessionsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const navigation = [
    { id: "students" as Tab, name: "Session Requests", icon: Calendar },
    { id: "content" as Tab, name: "Manage Content", icon: FileText },
    { id: "chat" as Tab, name: "Messages", icon: MessageSquare },
    { id: "webinars" as Tab, name: "Webinars", icon: Video },
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full">
      <aside className="w-full lg:w-64 bg-slate-900 text-white lg:min-h-[calc(100vh-4rem)] flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>

            <div>
              <h2 className="font-bold">Counselor Portal</h2>
              <p className="text-xs text-slate-400">
                {user?.name || "Counselor"}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
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
        {activeTab === "students" && (
          <SessionRequestsView
            sessions={sessions}
            loading={sessionsLoading}
            error={sessionsError}
            token={token}
            onRefresh={loadSessions}
          />
        )}

        {activeTab === "content" && (
          <ContentView token={token} currentUserId={user?.id || null} />
        )}

        {activeTab === "chat" && (
          <CounselorChatView
            token={token}
            currentUserId={user?.id || null}
          />
        )}

        {activeTab === "webinars" && (
          <Placeholder
            icon={Video}
            title="Host Webinars"
            text="Webinar scheduling will be added in a later feature."
          />
        )}
      </main>
    </div>
  );
}

function SessionRequestsView({
  sessions,
  loading,
  error,
  token,
  onRefresh,
}: {
  sessions: CounselorSession[];
  loading: boolean;
  error: string;
  token: string | null;
  onRefresh: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const filtered = useMemo(
    () =>
      sessions.filter((session) =>
        `${session.student_name} ${session.student_email} ${session.status}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [sessions, query]
  );

  async function updateStatus(
    bookingId: number,
    status: "confirmed" | "completed" | "cancelled"
  ) {
    if (!token) return;

    try {
      setUpdatingId(bookingId);
      setMessage("");

      const response = await fetch(
        `${API_URL}/counselors/me/sessions/${bookingId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not update booking.");
      }

      setMessage(`Booking #${bookingId} is now ${status}.`);
      await onRefresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update booking."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Session Requests
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage student counseling bookings.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {message && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-3 text-sm">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">
          <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3" />
          Loading sessions...
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 p-6 rounded-xl text-red-600">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
          No session requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((session) => {
            const date = new Date(session.session_date);
            const updating = updatingId === session.id;

            return (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center gap-4"
              >
                <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  {session.student_name.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 items-center">
                    <h2 className="font-bold text-gray-900">
                      {session.student_name}
                    </h2>
                    <StatusBadge status={session.status} />
                  </div>

                  <p className="text-sm text-gray-500">
                    {session.student_email}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {date.toLocaleDateString()}
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {date.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>

                    <span>Booking #{session.id}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {session.status === "pending" && (
                    <>
                      <ActionButton
                        disabled={updating}
                        onClick={() => updateStatus(session.id, "confirmed")}
                        label="Confirm"
                        color="blue"
                      />
                      <ActionButton
                        disabled={updating}
                        onClick={() => updateStatus(session.id, "cancelled")}
                        label="Cancel"
                        color="red"
                      />
                    </>
                  )}

                  {session.status === "confirmed" && (
                    <>
                      <ActionButton
                        disabled={updating}
                        onClick={() => updateStatus(session.id, "completed")}
                        label="Complete"
                        color="green"
                      />
                      <ActionButton
                        disabled={updating}
                        onClick={() => updateStatus(session.id, "cancelled")}
                        label="Cancel"
                        color="red"
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContentView({
  token,
  currentUserId,
}: {
  token: string | null;
  currentUserId: number | null;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "",
    content: "",
  });

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/articles`);

      if (!response.ok) {
        throw new Error("Could not load articles.");
      }

      setArticles(await response.json());
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not load articles."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const myArticles = articles.filter(
    (article) => article.author_id === currentUserId
  );

  async function publishArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) return;

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(`${API_URL}/articles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not publish article.");
      }

      setForm({ title: "", category: "", content: "" });
      setShowForm(false);
      setMessage("Article published successfully.");
      await loadArticles();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not publish article."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteArticle(articleId: number) {
    if (!token || !window.confirm("Delete this article permanently?")) {
      return;
    }

    const response = await fetch(`${API_URL}/articles/${articleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      setMessage("Article deleted.");
      await loadArticles();
    } else {
      const data = await response.json().catch(() => ({}));
      setMessage(data.detail || "Could not delete article.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Content
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Publish career-guidance articles for students.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Close Form" : "Create Article"}
        </button>
      </div>

      {message && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={publishArticle}
          className="mb-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4"
        >
          <input
            required
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            placeholder="Article title"
            className="w-full border rounded-lg px-3 py-2"
          />

          <input
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value })
            }
            placeholder="Category, e.g. Technology or Career Tips"
            className="w-full border rounded-lg px-3 py-2"
          />

          <textarea
            required
            rows={8}
            value={form.content}
            onChange={(event) =>
              setForm({ ...form, content: event.target.value })
            }
            placeholder="Write your article content..."
            className="w-full border rounded-lg px-3 py-2"
          />

          <button
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {saving ? "Publishing..." : "Publish Article"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading your articles...
        </div>
      ) : myArticles.length === 0 ? (
        <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
          You have not published any articles yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {myArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {article.category || "Career Guidance"}
              </span>

              <h2 className="font-bold text-gray-900 mt-3">
                {article.title}
              </h2>

              <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                {article.content}
              </p>

              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {new Date(article.created_at).toLocaleDateString()}
                </span>

                <button
                  onClick={() => deleteArticle(article.id)}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CounselorChatView({
  token,
  currentUserId,
}: {
  token: string | null;
  currentUserId: number | null;
}) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ChatConversationDetail | null>(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadConversationDetail = useCallback(
    async (conversationId: number, showLoading = false) => {
      if (!token) return;

      try {
        if (showLoading) {
          setLoading(true);
        }

        const response = await fetch(
          `${API_URL}/chat/conversations/${conversationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Could not load this conversation.");
        }

        setActiveConversation(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Could not load this conversation."
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [token]
  );

  const loadConversations = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your login session has expired. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: ChatConversation[] = await response.json();

      if (!response.ok) {
        throw new Error("Could not load your conversations.");
      }

      setConversations(data);

      if (data.length > 0) {
        await loadConversationDetail(data[0].id);
      } else {
        setActiveConversation(null);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load your conversations."
      );
    } finally {
      setLoading(false);
    }
  }, [token, loadConversationDetail]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConversation || !token) return;

    const timer = window.setInterval(() => {
      loadConversationDetail(activeConversation.id);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [activeConversation?.id, token, loadConversationDetail]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = messageText.trim();

    if (!content || !activeConversation || !token) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await fetch(
        `${API_URL}/chat/conversations/${activeConversation.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      const data: ChatMessage = await response.json();

      if (!response.ok) {
        throw new Error(data.content || "Could not send your message.");
      }

      setMessageText("");

      setActiveConversation((current) =>
        current
          ? {
              ...current,
              messages: [...current.messages, data],
            }
          : current
      );

      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === activeConversation.id
            ? {
                ...conversation,
                last_message: data,
                updated_at: data.created_at,
              }
            : conversation
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not send your message."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center text-gray-500">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Messages</h1>
        <p className="mt-1 text-gray-600">
          Reply to students who have contacted you for career guidance.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-blue-300" />
          <h2 className="text-lg font-bold text-gray-900">
            No student messages yet
          </h2>
          <p className="mt-2 text-gray-500">
            When a student messages you, their conversation will appear here.
          </p>
        </div>
      ) : (
        <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-gray-200 bg-white md:grid-cols-[260px_1fr]">
          <aside className="border-b border-gray-200 bg-gray-50 md:border-b-0 md:border-r">
            <div className="border-b border-gray-200 px-4 py-4">
              <h2 className="font-bold text-gray-900">Students</h2>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {conversations.map((conversation) => {
                const isActive = activeConversation?.id === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    onClick={() =>
                      loadConversationDetail(conversation.id, true)
                    }
                    className={`w-full border-b border-gray-100 px-4 py-4 text-left transition-colors ${
                      isActive ? "bg-blue-50" : "hover:bg-white"
                    }`}
                  >
                    <p className="truncate font-semibold text-gray-900">
                      {conversation.student_name}
                    </p>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {conversation.last_message
                        ? conversation.last_message.content
                        : "No messages yet"}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-[560px] flex-col">
            {activeConversation ? (
              <>
                <div className="border-b border-gray-200 px-5 py-4">
                  <h2 className="font-bold text-gray-900">
                    {activeConversation.student_name}
                  </h2>
                  <p className="text-sm text-gray-500">Student</p>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5">
                  {activeConversation.messages.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-500">
                      No messages in this conversation yet.
                    </div>
                  ) : (
                    activeConversation.messages.map((message) => {
                      const isMine = message.sender_id === currentUserId;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                              isMine
                                ? "bg-blue-600 text-white"
                                : "border border-gray-200 bg-white text-gray-800"
                            }`}
                          >
                            {!isMine && (
                              <p className="mb-1 text-xs font-semibold text-blue-600">
                                {message.sender_name}
                              </p>
                            )}

                            <p className="whitespace-pre-wrap">
                              {message.content}
                            </p>

                            <p
                              className={`mt-1 text-[10px] ${
                                isMine ? "text-blue-100" : "text-gray-400"
                              }`}
                            >
                              {new Date(message.created_at).toLocaleTimeString(
                                [],
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={sendMessage}
                  className="flex gap-3 border-t border-gray-200 p-4"
                >
                  <input
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Write a reply..."
                    maxLength={5000}
                    disabled={sending}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-10 text-center text-gray-500">
                Select a student conversation to begin.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded-full ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ActionButton({
  onClick,
  disabled,
  label,
  color,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  color: "blue" | "green" | "red";
}) {
  const styles = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    green: "bg-green-600 hover:bg-green-700 text-white",
    red: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium rounded-lg disabled:opacity-60 ${styles[color]}`}
    >
      {disabled ? "Updating..." : label}
    </button>
  );
}

function Placeholder({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MessageSquare;
  title: string;
  text: string;
}) {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 p-10 text-center">
      <Icon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600 mt-2">{text}</p>
    </div>
  );
}