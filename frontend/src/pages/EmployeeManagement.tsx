import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createManagedUserApi,
  getManagedUsersApi,
  resetManagedUserPasswordApi,
  toggleManagedUserApi,
  type ManagedUserRow,
} from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function EmployeeManagement() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery({ queryKey: ["managed-users"], queryFn: getManagedUsersApi });

  const [openCreate, setOpenCreate] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createDisplayName, setCreateDisplayName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"employee" | "supervisor">("employee");

  const [resetTarget, setResetTarget] = useState<ManagedUserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const createMutation = useMutation({
    mutationFn: createManagedUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      setCreateUsername("");
      setCreateDisplayName("");
      setCreatePassword("");
      setCreateRole("employee");
      setOpenCreate(false);
      toast.success("User created successfully");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create user"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleManagedUserApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      toast.success("User status updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update user status"),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => resetManagedUserPasswordApi(id, password),
    onSuccess: () => {
      setResetTarget(null);
      setNewPassword("");
      toast.success("Password reset successfully");
    },
    onError: (err: any) => toast.error(err.message || "Failed to reset password"),
  });

  const handleCreate = () => {
    if (!createUsername.trim() || !createDisplayName.trim() || createPassword.length < 6) {
      toast.error("Provide username, display name, and password (min 6 chars)");
      return;
    }

    createMutation.mutate({
      username: createUsername.trim(),
      displayName: createDisplayName.trim(),
      password: createPassword,
      role: createRole,
    });
  };

  const handleResetPassword = () => {
    if (!resetTarget) return;

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    resetMutation.mutate({ id: resetTarget.id, password: newPassword });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Employee Management</h1>
        <Button onClick={() => setOpenCreate(true)}>Create User</Button>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <StatusBadge variant={user.isActive ? "active" : "inactive"} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMutation.mutate(user.id)}
                        disabled={toggleMutation.isPending}
                      >
                        {user.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setResetTarget(user)}>
                        Reset Password
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username</Label>
              <Input id="new-username" value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} placeholder="e.g. rohan.kapoor" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-displayname">Display Name</Label>
              <Input id="new-displayname" value={createDisplayName} onChange={(e) => setCreateDisplayName(e.target.value)} placeholder="e.g. Rohan Kapoor" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Role</Label>
              <Select value={createRole} onValueChange={(value: "employee" | "supervisor") => setCreateRole(value)}>
                <SelectTrigger id="new-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!resetTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResetTarget(null);
            setNewPassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password{resetTarget ? `: ${resetTarget.username}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reset-password">New Password</Label>
            <Input
              id="reset-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={resetMutation.isPending}>Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
