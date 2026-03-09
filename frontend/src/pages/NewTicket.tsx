import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBranches, getIssueTypes, createTicket } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function NewTicket() {
  const queryClient = useQueryClient();
  const [branchId, setBranchId] = useState("");
  const [issueTypeId, setIssueTypeId] = useState("");
  const [description, setDescription] = useState("");

  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: getBranches });
  const { data: issueTypes = [] } = useQuery({ queryKey: ["issueTypes"], queryFn: getIssueTypes });

  const activeBranches = branches.filter((b) => b.is_active);
  const activeIssueTypes = issueTypes.filter((it) => it.is_active);

  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setBranchId("");
      setIssueTypeId("");
      setDescription("");
      toast.success("Ticket submitted successfully!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create ticket"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId || !issueTypeId || !description.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    mutation.mutate({ branch_id: Number(branchId), issue_type_id: Number(issueTypeId), description });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Submit a New Ticket</h1>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Ticket Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger id="branch">
                  <SelectValue placeholder="Select branch..." />
                </SelectTrigger>
                <SelectContent>
                  {activeBranches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueType">Issue Type</Label>
              <Select value={issueTypeId} onValueChange={setIssueTypeId}>
                <SelectTrigger id="issueType">
                  <SelectValue placeholder="Select issue type..." />
                </SelectTrigger>
                <SelectContent>
                  {activeIssueTypes.map((it) => (
                    <SelectItem key={it.id} value={String(it.id)}>{it.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue in detail..."
                rows={5}
              />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Ticket
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
