const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error || "Request failed");
  }

  return res.json();
}

// ─── Auth ───
export interface LoginResponse {
  token: string;
  user: { id: number; username: string; displayName: string; role: string };
}

export function loginApi(username: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

// ─── Tickets ───
export interface TicketRow {
  id: number;
  description: string;
  status: "open" | "closed";
  created_at: string;
  employee_name: string;
  employee_id: number;
  branch_name: string;
  branch_id: number;
  issue_type_name: string;
  issue_type_id: number;
  supervisor_remarks: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

export function getTickets(params?: { status?: string; branch_id?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.branch_id) qs.set("branch_id", String(params.branch_id));
  const query = qs.toString();
  return request<TicketRow[]>(`/tickets${query ? `?${query}` : ""}`);
}

export function createTicket(data: { branch_id: number; issue_type_id: number; description: string }) {
  return request<TicketRow>("/tickets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function resolveTicketApi(ticketId: number, remarks: string) {
  return request<{ message: string }>(`/tickets/${ticketId}/resolve`, {
    method: "POST",
    body: JSON.stringify({ remarks }),
  });
}

// ─── Branches ───
export interface BranchRow {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export function getBranches() {
  return request<BranchRow[]>("/branches");
}

export function createBranchApi(name: string) {
  return request<BranchRow>("/branches", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function toggleBranchApi(id: number) {
  return request<BranchRow>(`/branches/${id}`, { method: "PATCH" });
}

// ─── Issue Types ───
export interface IssueTypeRow {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export function getIssueTypes() {
  return request<IssueTypeRow[]>("/issue-types");
}

export function createIssueTypeApi(name: string) {
  return request<IssueTypeRow>("/issue-types", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function toggleIssueTypeApi(id: number) {
  return request<IssueTypeRow>(`/issue-types/${id}`, { method: "PATCH" });
}

export { ApiError };
