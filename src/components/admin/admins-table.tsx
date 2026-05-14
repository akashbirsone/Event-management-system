

'use client';

import type { Admin } from '@/lib/definitions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RemoveAdminButton } from './remove-admin-button';
import { EditAdminDialog } from './edit-admin-dialog';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '../ui/card';

export function AdminsTable({ admins, currentAdmin }: { admins: Admin[], currentAdmin: Admin | null }) {
  const isAdmin = currentAdmin?.role === 'Admin';

  const getRoleBadgeVariant = (role: Admin['role']) => {
    switch (role) {
      case 'Admin':
        return 'destructive';
      case 'EventsManager':
        return 'secondary';
      default:
        return 'default';
    }
  }
  
  const visibleAdmins = admins;

  if (visibleAdmins.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 rounded-md border border-dashed">
        <p className="text-muted-foreground">No admins found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {visibleAdmins.map((admin) => {
           const canManage = isAdmin && admin.id !== currentAdmin?.id && admin.role !== 'Admin';
           return (
            <Card key={admin.id}>
              <CardHeader className="flex flex-row justify-between items-start pb-2">
                <div className="space-y-1">
                  <p className="font-medium">{admin.name}</p>
                  <p className="text-sm text-muted-foreground">{admin.id}</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={!canManage}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <EditAdminDialog admin={admin} loggedInAdminId={currentAdmin?.id} disabled={!canManage}>
                         <button className={cn(
                           'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent',
                           !canManage && 'cursor-not-allowed text-muted-foreground opacity-50 hover:bg-transparent'
                         )}>
                           <Pencil className="mr-2 h-4 w-4" />
                           Edit
                         </button>
                       </EditAdminDialog>
                       <RemoveAdminButton adminId={admin.id} disabled={!canManage}>
                         <div className={cn(
                            'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-accent hover:text-destructive-foreground focus:text-destructive-foreground focus:bg-accent',
                             !canManage && 'cursor-not-allowed text-muted-foreground opacity-50 hover:bg-transparent hover:text-muted-foreground'
                         )}>
                           <Trash className="mr-2 h-4 w-4" />
                           Remove
                        </div>
                       </RemoveAdminButton>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </CardHeader>
              <CardContent>
                <Badge variant={getRoleBadgeVariant(admin.role)}>
                    {admin.role}
                </Badge>
              </CardContent>
            </Card>
           )
        })}
      </div>

      {/* Desktop View */}
      <div className="rounded-md border hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleAdmins.map((admin) => {
              const canManage = isAdmin && admin.id !== currentAdmin?.id && admin.role !== 'Admin';

              return (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>{admin.id}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(admin.role)}>
                      {admin.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={!canManage}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <EditAdminDialog admin={admin} loggedInAdminId={currentAdmin?.id} disabled={!canManage}>
                          <button className={cn(
                            'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent',
                            !canManage && 'cursor-not-allowed text-muted-foreground opacity-50 hover:bg-transparent'
                          )}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </button>
                        </EditAdminDialog>
                        <RemoveAdminButton adminId={admin.id} disabled={!canManage}>
                          <div className={cn(
                              'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-accent hover:text-destructive-foreground focus:text-destructive-foreground focus:bg-accent',
                              !canManage && 'cursor-not-allowed text-muted-foreground opacity-50 hover:bg-transparent hover:text-muted-foreground'
                          )}>
                            <Trash className="mr-2 h-4 w-4" />
                            Remove
                          </div>
                        </RemoveAdminButton>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
