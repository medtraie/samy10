import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, FileText } from 'lucide-react';
import { usePersonnel, usePersonnelMutation, Personnel } from '@/hooks/usePersonnel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PersonnelForm } from './PersonnelForm';

export function PersonnelList() {
  const { t } = useTranslation();
  const { data: personnel = [], isLoading } = usePersonnel();
  const { deletePersonnel } = usePersonnelMutation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  const filteredPersonnel = personnel.filter(p => 
    p.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.cin && p.cin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      await deletePersonnel.mutateAsync(id);
    }
  };

  const roleLabels: Record<string, string> = {
    driver: 'Chauffeur',
    mechanic: 'Mécanicien',
    manager: 'Manager',
    admin: 'Administrateur',
  };

  const statusLabels: Record<string, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, CIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un employé
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un employé</DialogTitle>
            </DialogHeader>
            <PersonnelForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom complet</TableHead>
                <TableHead>CIN</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredPersonnel.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun employé trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredPersonnel.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">
                      {person.first_name} {person.last_name}
                    </TableCell>
                    <TableCell>{person.cin || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleLabels[person.role] || person.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={person.status === 'active' ? 'default' : 'secondary'}>
                        {statusLabels[person.status] || person.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingPersonnel(person)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(person.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editingPersonnel && (
        <Dialog open={!!editingPersonnel} onOpenChange={(open) => !open && setEditingPersonnel(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'employé</DialogTitle>
            </DialogHeader>
            <PersonnelForm 
              initialData={editingPersonnel} 
              onSuccess={() => setEditingPersonnel(null)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
