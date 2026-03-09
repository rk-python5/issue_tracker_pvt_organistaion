import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIssueTypes, createIssueTypeApi, toggleIssueTypeApi } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ManageIssueTypes() {
  const queryClient = useQueryClient();
  const { data: issueTypes = [], isLoading } = useQuery({ queryKey: ["issueTypes"], queryFn: getIssueTypes });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const addMutation = useMutation({
    mutationFn: createIssueTypeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issueTypes"] });
      setName("");
      setOpen(false);
      toast.success("Issue type added!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to add issue type"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleIssueTypeApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["issueTypes"] }),
    onError: (err: any) => toast.error(err.message || "Failed to toggle issue type"),
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
        <h1 className="text-2xl font-semibold text-foreground">Manage Issue Types</h1>
        <Button onClick={() => setOpen(true)}>Add New Issue Type</Button>
      </div>
      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issueTypes.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.id}</TableCell>
                  <TableCell>{it.name}</TableCell>
                  <TableCell><StatusBadge variant={it.is_active ? "active" : "inactive"} /></TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => toggleMutation.mutate(it.id)}>
                      {it.is_active ? "Disable" : "Enable"}
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
          <DialogHeader><DialogTitle>Add New Issue Type</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Telephony" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!name.trim() || addMutation.isLoading}>Add Issue Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
