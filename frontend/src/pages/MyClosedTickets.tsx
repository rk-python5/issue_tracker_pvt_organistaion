import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTickets } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

export default function MyClosedTickets() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets", "closed"],
    queryFn: () => getTickets({ status: "closed" }),
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">My Closed Tickets</h1>
      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Issue Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No closed tickets</TableCell></TableRow>
              ) : (
                tickets.map((t) => (
                  <>
                    <TableRow
                      key={t.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    >
                      <TableCell>
                        {expandedId === t.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="font-medium">TK-{t.id}</TableCell>
                      <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{t.branch_name}</TableCell>
                      <TableCell>{t.issue_type_name}</TableCell>
                      <TableCell><StatusBadge variant="closed" /></TableCell>
                    </TableRow>
                    {expandedId === t.id && (
                      <TableRow key={`${t.id}-remarks`}>
                        <TableCell colSpan={6} className="bg-muted/30 px-8 py-4">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supervisor Remarks</p>
                            <p className="text-sm text-foreground">{t.supervisor_remarks}</p>
                            {t.resolved_at && (
                              <p className="text-xs text-muted-foreground mt-2">Resolved on {new Date(t.resolved_at).toLocaleDateString()}</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
