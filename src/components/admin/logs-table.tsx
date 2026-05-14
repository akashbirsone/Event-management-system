
import type { EntryLog } from '@/lib/definitions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LogsTable({ logs }: { logs: EntryLog[] }) {

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 rounded-md border border-dashed">
        <p className="text-muted-foreground">No entries logged yet.</p>
      </div>
    );
  }

  return (
    <>
       {/* Mobile View */}
       <div className="md:hidden space-y-4">
        {logs.map((log) => (
          <Card key={log.id}>
             <CardHeader className="pb-2">
                <CardTitle className="text-base">{log.userName}</CardTitle>
                <p className="text-sm text-muted-foreground">{log.uniqueId}</p>
             </CardHeader>
             <CardContent className="text-sm space-y-1">
                <p><span className="font-medium">Entered:</span> {new Date(log.entryTime).toLocaleString('en-US')}</p>
                <p><span className="font-medium">Exited:</span> {log.exitTime ? new Date(log.exitTime).toLocaleString('en-US') : 'N/A'}</p>
             </CardContent>
          </Card>
        ))}
       </div>

       {/* Desktop View */}
      <div className="rounded-md border hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Name</TableHead>
              <TableHead>Unique ID</TableHead>
              <TableHead>Entry Time</TableHead>
              <TableHead>Exit Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.userName}</TableCell>
                <TableCell>{log.uniqueId}</TableCell>
                <TableCell>
                  {new Date(log.entryTime).toLocaleString('en-US')}
                </TableCell>
                <TableCell>{log.exitTime ? new Date(log.exitTime).toLocaleString('en-US') : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
