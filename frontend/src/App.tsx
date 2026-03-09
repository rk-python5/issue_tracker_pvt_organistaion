import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import Login from "./pages/Login";
import NewTicket from "./pages/NewTicket";
import MyOpenTickets from "./pages/MyOpenTickets";
import MyClosedTickets from "./pages/MyClosedTickets";
import ActiveQueue from "./pages/ActiveQueue";
import ResolvedTickets from "./pages/ResolvedTickets";
import ManageBranches from "./pages/ManageBranches";
import ManageIssueTypes from "./pages/ManageIssueTypes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/manage-branches" replace />;
  if (user.role === "supervisor") return <Navigate to="/active-queue" replace />;
  return <Navigate to="/new-ticket" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootRedirect />} />
            <Route path="/new-ticket" element={<DashboardLayout><ProtectedRoute allowedRoles={["employee"]}><NewTicket /></ProtectedRoute></DashboardLayout>} />
            <Route path="/my-open-tickets" element={<DashboardLayout><ProtectedRoute allowedRoles={["employee"]}><MyOpenTickets /></ProtectedRoute></DashboardLayout>} />
            <Route path="/my-closed-tickets" element={<DashboardLayout><ProtectedRoute allowedRoles={["employee"]}><MyClosedTickets /></ProtectedRoute></DashboardLayout>} />
            <Route path="/active-queue" element={<DashboardLayout><ProtectedRoute allowedRoles={["supervisor"]}><ActiveQueue /></ProtectedRoute></DashboardLayout>} />
            <Route path="/resolved-tickets" element={<DashboardLayout><ProtectedRoute allowedRoles={["supervisor"]}><ResolvedTickets /></ProtectedRoute></DashboardLayout>} />
            <Route path="/manage-branches" element={<DashboardLayout><ProtectedRoute allowedRoles={["admin"]}><ManageBranches /></ProtectedRoute></DashboardLayout>} />
            <Route path="/manage-issue-types" element={<DashboardLayout><ProtectedRoute allowedRoles={["admin"]}><ManageIssueTypes /></ProtectedRoute></DashboardLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
