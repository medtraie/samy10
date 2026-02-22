import { useComputedRevisions, useDeleteRevision } from '@/hooks/useRevisions';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function RevisionsList() {
  const { revisions } = useComputedRevisions();
  const deleteRevision = useDeleteRevision();

  if (!revisions) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const statusBadge = (s: string) => {
    switch (s) {
      case 'overdue':
        return <Badge className="bg-destructive text-destructive-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> En retard</Badge>;
      case 'due':
        return <Badge className="bg-warning text-black flex items-center gap-1"><Clock className="w-3 h-3" /> À faire</Badge>;
      case 'completed':
        return <Badge className="bg-success text-success-foreground flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Terminé</Badge>;
      default:
        return <Badge variant="outline">Planifiée</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Véhicule</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Prochaine échéance</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revisions.map((rev) => (
              <TableRow key={rev.id}>
                <TableCell className="font-medium">{rev.vehicle_plate}</TableCell>
                <TableCell>{rev.type.replace('_', ' ')}</TableCell>
                <TableCell>{rev.mode === 'days' ? 'Jours' : 'Km'}</TableCell>
                <TableCell>
                  {rev.mode === 'days' ? (rev.next_due_date || '-') : (rev.next_due_km ?? '-')}
                </TableCell>
                <TableCell>{statusBadge(rev.status)}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette révision ?</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteRevision.mutate(rev.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
