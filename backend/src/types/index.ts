export type Role = "employee" | "supervisor" | "admin";
export type TicketStatus = "open" | "closed";

export interface JwtPayload {
  id: number;
  role: Role;
  username: string;
  displayName: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
