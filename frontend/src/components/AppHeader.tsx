import { useAuth } from "@/lib/auth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) + " View" : "";

  return (
    <header className="h-14 flex items-center justify-between border-b bg-card px-4 shadow-card">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <span className="text-sm font-semibold text-foreground">Issue Tracker</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground hidden sm:inline">{roleLabel}</span>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground hidden sm:inline">{user?.displayName}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
