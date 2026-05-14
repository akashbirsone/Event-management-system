

import type { AuditLog, Admin } from '@/lib/definitions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Card, CardHeader, CardContent } from '../ui/card';

export function AuditLogTable({ logs, admins }: { logs: AuditLog[], admins: Admin[] }) {

  const getAdminName = (adminId: string) => {
    const admin = admins.find(a => a.id === adminId);
    return admin ? admin.name : adminId;
  };

  const getActionVariant = (action: AuditLog['action']): 'default' | 'destructive' | 'secondary' => {
    switch (action) {
      case 'CREATE':
        return 'default';
      case 'UPDATE':
      case 'STATUS_CHANGE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      default:
        return 'secondary';
    }
  }
  
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 rounded-md border border-dashed">
        <p className="text-muted-foreground">No audit logs found.</p>
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
                <div className='flex justify-between items-start'>
                  <div className='space-y-1'>
                    <p className="font-medium">{log.entityType}</p>
                    <p className="text-sm text-muted-foreground">{log.entityId}</p>
                  </div>
                  <Badge variant={getActionVariant(log.action)}>{log.action.replace('_', ' ')}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                 <p>{log.details}</p>
                 <div className='text-xs text-muted-foreground pt-2 border-t'>
                    <p>By: {getAdminName(log.adminId)}</p>
                    <p>On: {new Date(log.timestamp).toLocaleString()}</p>
                 </div>
              </CardContent>
           </Card>
        ))}
      </div>


      {/* Desktop View */}
      <div className="rounded-md border hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant={getActionVariant(log.action)}>{log.action.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{log.entityType}</div>
                    <div className="text-xs text-muted-foreground">{log.entityId}</div>
                  </TableCell>
                  <TableCell>{log.details}</TableCell>
                  <TableCell>{getAdminName(log.adminId)}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {new Date(log.timestamp).toLocaleDateString()}
                        </TooltipTrigger>
                        <TooltipContent>
                          {new Date(log.timestamp).toLocaleString()}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
