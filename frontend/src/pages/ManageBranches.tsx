import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBranches, createBranchApi, toggleBranchApi } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ManageBranches() {
  const queryClient = useQueryClient();
  const { data: branches = [], isLoading } = useQuery({ queryKey: ["branches"], queryFn: getBranches });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const addMutation = useMutation({
    mutationFn: createBranchApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setName("");
      setOpen(false);
      toast.success("Branch added!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to add branch"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleBranchApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
    onError: (err: any) => toast.error(err.message || "Failed to toggle branch"),
  });

  const handleAdd = () => {
    if (!name.trim()) return;
    addMutation.mutate(name.trim());
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Manage Branches</h1>
        <Button onClick={() => setOpen(true)}>Add New Branch</Button>
      </div>
      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Branch Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.id}</TableCell>
                  <TableCell>{b.name}</TableCell>
                  <TableCell><StatusBadge variant={b.is_active ? "active" : "inactive"} /></TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => toggleMutation.mutate(b.id)}>
                      {b.is_active ? "Disable" : "Enable"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Branch</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Branch Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Midtown Office" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!name.trim() || addMutation.isLoading}>Add Branch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
