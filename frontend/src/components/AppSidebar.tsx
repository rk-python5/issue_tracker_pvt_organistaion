import { useAuth } from "@/lib/auth";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  PlusCircle,
  FileText,
  CheckCircle2,
  ListTodo,
  CheckCheck,
  Building2,
  Tags } from
"lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar } from
"@/components/ui/sidebar";

const navConfig = {
  employee: [
  { title: "New Ticket", url: "/new-ticket", icon: PlusCircle },
  { title: "My Open Tickets", url: "/my-open-tickets", icon: FileText },
  { title: "My Closed Tickets", url: "/my-closed-tickets", icon: CheckCircle2 }],

  supervisor: [
  { title: "Active Queue", url: "/active-queue", icon: ListTodo },
  { title: "Resolved Tickets", url: "/resolved-tickets", icon: CheckCheck }],

  admin: [
  { title: "Manage Branches", url: "/manage-branches", icon: Building2 },
  { title: "Manage Issue Types", url: "/manage-issue-types", icon: Tags }]

};

const roleLabels = { employee: "Employee", supervisor: "Supervisor", admin: "Admin" };

export function AppSidebar() {
  const { user } = useAuth();
  const role = user?.role ?? "employee";
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const items = navConfig[role];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={collapsed ? "px-2 py-4" : "px-4 py-5"}>
          {!collapsed &&
          <h2 className="font-bold tracking-wider text-sidebar-foreground/60 uppercase text-lg">
              Issue Tracker
            </h2>
          }
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>{roleLabels[role]} Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) =>
              <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                    to={item.url}
                    end
                    className="hover:bg-sidebar-accent/50"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>);

}