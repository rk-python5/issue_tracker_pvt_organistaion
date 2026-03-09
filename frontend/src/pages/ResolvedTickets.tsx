import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTickets } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronDown, ChevronRight, User, Building2, Tag, CalendarDays, FileText, MessageSquare, Search, BarChart3, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ResolvedTickets() {
  const { data: closed = [], isLoading } = useQuery({
    queryKey: ["tickets", "closed"],
    queryFn: () => getTickets({ status: "closed" }),
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = closed.filter(
    (t) =>
      searchQuery === "" ||
      `TK-${t.id}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.supervisor_remarks ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDaysToResolve = (created: string, resolved?: string) => {
    if (!resolved) return "—";
    const diff = Math.floor((new Date(resolved).getTime() - new Date(created).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Same day";
    if (diff === 1) return "1 day";
    return `${diff} days`;
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Resolved Tickets</h1>
        <p className="text-sm text-muted-foreground mt-1">History of all resolved issues with supervisor remarks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-l-4 border-l-emerald-400 shadow-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{closed.length}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Resolved</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-l-4 border-l-primary shadow-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {closed.length > 0
                    ? `${(closed.reduce((sum, t) => {
                        if (!t.resolved_at) return sum;
                        return sum + Math.max(0, Math.floor((new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)));
                      }, 0) / closed.length).toFixed(1)}d`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Resolution</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-l-blue-400 shadow-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Showing</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticket ID, employee, or remarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
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
                  <TableHead className="font-semibold w-8"></TableHead>
                  <TableHead className="font-semibold">Ticket</TableHead>
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="font-semibold">Branch</TableHead>
                  <TableHead className="font-semibold">Issue Type</TableHead>
                  <TableHead className="font-semibold">Resolved</TableHead>
                  <TableHead className="font-semibold">Time to Resolve</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Search className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">No resolved tickets found</p>
                          <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t, i) => (
                    <motion.tbody
                      key={t.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <tr
                        className="border-b transition-colors hover:bg-muted/50 cursor-pointer group"
                        onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      >
                        <TableCell className="w-8 px-3">
                          {expandedId === t.id ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-primary">TK-{t.id}</span>
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
                          <span className="text-sm">{t.resolved_at ? new Date(t.resolved_at).toLocaleDateString() : "—"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                            {getDaysToResolve(t.created_at, t.resolved_at)}
                          </span>
                        </TableCell>
                        <TableCell><StatusBadge variant="closed" /></TableCell>
                      </tr>
                      <AnimatePresence>
                        {expandedId === t.id && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-muted/30"
                          >
                            <td colSpan={8} className="p-0">
                              <div className="px-6 py-4 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="rounded-lg border bg-card p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original Issue</span>
                                    </div>
                                    <p className="text-sm">{t.description}</p>
                                    <p className="text-xs text-muted-foreground mt-2">Submitted on {new Date(t.created_at).toLocaleDateString()}</p>
                                  </div>
                                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Resolution Remarks</span>
                                    </div>
                                    <p className="text-sm">{t.supervisor_remarks}</p>
                                    <p className="text-xs text-muted-foreground mt-2">Resolved on {t.resolved_at ? new Date(t.resolved_at).toLocaleDateString() : "—"}</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </motion.tbody>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
