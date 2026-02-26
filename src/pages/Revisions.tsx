import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, Filter } from 'lucide-react';
import { RevisionForm } from '@/components/revisions/RevisionForm';
import { RevisionsList } from '@/components/revisions/RevisionsList';
import {
  useComputedRevisions,
  RevisionType,
} from '@/hooks/useRevisions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Revisions() {
  const [open, setOpen] = useState(false);
  const { revisions } = useComputedRevisions();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'due' | 'overdue' | 'completed'
  >('all');
  const [typeFilter, setTypeFilter] = useState<'all' | RevisionType>('all');

  const total = revisions.length;
  const overdue = revisions.filter((r) => r.status === 'overdue').length;
  const due = revisions.filter((r) => r.status === 'due').length;

  const filtered = useMemo(
    () =>
      revisions.filter((rev) => {
        const matchesSearch =
          !search ||
          rev.vehicle_plate
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === 'all' || rev.status === statusFilter;
        const matchesType =
          typeFilter === 'all' || rev.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      }),
    [revisions, search, statusFilter, typeFilter]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                Révisions
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" /> Total: {total}
                </Badge>
                <Badge className="bg-warning text-black">
                  À faire: {due}
                </Badge>
                <Badge className="bg-destructive text-destructive-foreground">
                  En retard: {overdue}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Input
                placeholder="Rechercher par véhicule..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
              />
              <div className="flex items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(v) =>
                    setStatusFilter(
                      v as 'all' | 'pending' | 'due' | 'overdue' | 'completed'
                    )
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">Planifiée</SelectItem>
                    <SelectItem value="due">À faire</SelectItem>
                    <SelectItem value="overdue">En retard</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={typeFilter}
                  onValueChange={(v) =>
                    setTypeFilter(v as 'all' | RevisionType)
                  }
                >
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="vidange">Vidange</SelectItem>
                    <SelectItem value="vignette">Vignette</SelectItem>
                    <SelectItem value="visite_technique">
                      Visite technique
                    </SelectItem>
                    <SelectItem value="autre_document">
                      Autre document
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Filter className="w-4 h-4 hidden sm:inline" />
                      Nouvelle révision
                    </Button>
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
          </div>
        </div>

        <RevisionsList revisions={filtered} />
      </div>
    </DashboardLayout>
  );
}
