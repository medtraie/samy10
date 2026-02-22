import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { RevisionForm } from '@/components/revisions/RevisionForm';
import { RevisionsList } from '@/components/revisions/RevisionsList';
import { useRevisions } from '@/hooks/useRevisions';

export default function Revisions() {
  const [open, setOpen] = useState(false);
  const { data: revisions = [] } = useRevisions();
  const [search, setSearch] = useState('');

  const total = revisions.length;
  const overdue = revisions.filter(r => r.status === 'overdue').length;
  const due = revisions.filter(r => r.status === 'due').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Révisions</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="flex items-center gap-2">
                <RefreshCcw className="w-4 h-4" /> Total: {total}
              </Badge>
              <Badge className="bg-warning text-black">À faire: {due}</Badge>
              <Badge className="bg-destructive text-destructive-foreground">En retard: {overdue}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Rechercher par véhicule..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Nouvelle révision</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nouvelle révision</DialogTitle>
                </DialogHeader>
                <RevisionForm onSuccess={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <RevisionsList />
      </div>
    </DashboardLayout>
  );
}
