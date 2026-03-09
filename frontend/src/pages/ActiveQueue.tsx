import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTickets, getBranches, resolveTicketApi, type TicketRow } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AlertCircle, Clock, Filter, CheckCircle2, Building2, User, Tag, CalendarDays, FileText, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ActiveQueue() {
  const queryClient = useQueryClient();
  const [filterBranch, setFilterBranch] = useState("all");
  const [resolveId, setResolveId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allOpen = [], isLoading } = useQuery({
    queryKey: ["tickets", "open"],
    queryFn: () => getTickets({ status: "open" }),
  });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: getBranches });

  const openTickets = allOpen.filter(
    (t) =>
      (filterBranch === "all" || t.branch_id === Number(filterBranch)) &&
      (searchQuery === "" ||
        `TK-${t.id}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const resolveTarget = allOpen.find((t) => t.id === resolveId);

  const totalOpen = allOpen.length;
  const todayTickets = allOpen.filter(
    (t) => new Date(t.created_at).toDateString() === new Date().toDateString()
  ).length;

  const getIssuePriority = (issueTypeName: string) => {
    const name = issueTypeName.toLowerCase();
    if (name.includes("security")) return "critical";
    if (name.includes("hardware") || name.includes("network")) return "high";
    if (name.includes("software") || name.includes("access")) return "medium";
    return "low";
  };

  const priorityConfig = {
    critical: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500", label: "Critical" },
    high: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", dot: "bg-orange-500", label: "High" },
    medium: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500", label: "Medium" },
    low: { color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground", label: "Low" },
  };

  const resolveMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: number; remarks: string }) => resolveTicketApi(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setResolveId(null);
      setRemarks("");
      toast.success("Ticket resolved successfully!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to resolve ticket"),
  });

  const handleResolve = () => {
    if (resolveId && remarks.trim()) {
      resolveMutation.mutate({ id: resolveId, remarks });
    }
  };

  const getDaysAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff}d ago`;
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Active Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and resolve open tickets across all branches</p>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-l-4 border-l-orange-400 shadow-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalOpen}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Open Tickets</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-l-4 border-l-primary shadow-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{todayTickets}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Raised Today</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-l-emerald-400 shadow-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{openTickets.length}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Showing</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </div>
              <div className="flex flex-1 flex-col sm:flex-row gap-3">
                <Select value={filterBranch} onValueChange={setFilterBranch}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter by branch..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.filter((b) => b.is_active).map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, employee, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tickets Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="shadow-card overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Ticket</TableHead>
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="font-semibold">Branch</TableHead>
                  <TableHead className="font-semibold">Issue Type</TableHead>
                  <TableHead className="font-semibold">Priority</TableHead>
                  <TableHead className="font-semibold">Submitted</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">All clear!</p>
                          <p className="text-sm text-muted-foreground">No open tickets match your filters</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  openTickets.map((t, i) => {
                    const priority = getIssuePriority(t.issue_type_name);
                    const config = priorityConfig[priority];
                    return (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b transition-colors hover:bg-muted/50 group"
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-primary">TK-{t.id}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{t.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {t.employee_name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <span className="font-medium">{t.employee_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{t.branch_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{t.issue_type_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                            {config.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{new Date(t.created_at).toLocaleDateString()}</span>
                            <span className="text-xs text-muted-foreground">{getDaysAgo(t.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => { setResolveId(t.id); setRemarks(""); }}
                            className="opacity-80 group-hover:opacity-100 transition-opacity"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Resolve
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveId} onOpenChange={(open) => { if (!open) setResolveId(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Resolve TK-{resolveTarget?.id}</DialogTitle>
                <DialogDescription>Review details and add your resolution remarks</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {resolveTarget && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Employee</p>
                      <p className="font-medium">{resolveTarget.employee_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Branch</p>
                      <p className="font-medium">{resolveTarget.branch_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Issue Type</p>
                      <p className="font-medium">{resolveTarget.issue_type_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="font-medium">{new Date(resolveTarget.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p className="text-sm mt-0.5">{resolveTarget.description}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Supervisor Remarks
                  <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Describe the resolution steps taken..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {remarks.trim().length === 0 ? "Required — describe how this issue was resolved" : `${remarks.trim().length} characters`}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResolveId(null)}>Cancel</Button>
            <Button onClick={handleResolve} disabled={!remarks.trim() || resolveMutation.isLoading}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
