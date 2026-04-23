import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, Pencil } from 'lucide-react';
import { useTourismClients, useCreateTourismClient, useUpdateTourismClient } from '@/hooks/useTourism';
import { useTMSClients, useCreateTMSClient } from '@/hooks/useTMS';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UnifiedClientForm, type UnifiedClientFormValues } from '@/components/clients/UnifiedClientForm';
import { getUnifiedClientsRegistry, type UnifiedClientModule, upsertUnifiedClientRecord } from '@/lib/unifiedClients';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

type UnifiedListRow = {
  id: string;
  sourceModule: UnifiedClientModule;
  sourceId: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  city: string;
};

export default function Clients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: tourismClients = [] } = useTourismClients();
  const { data: tmsClients = [] } = useTMSClients();
  const createTourismClient = useCreateTourismClient();
  const createTmsClient = useCreateTMSClient();
  const updateTourismClient = useUpdateTourismClient();
  const [search, setSearch] = useState('');
  const [showUnifiedClientForm, setShowUnifiedClientForm] = useState(false);
  const [showEditClientForm, setShowEditClientForm] = useState(false);
  const [editingRow, setEditingRow] = useState<UnifiedListRow | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [registryVersion, setRegistryVersion] = useState(0);
  const [formValues, setFormValues] = useState<UnifiedClientFormValues>({
    sourceModule: 'facturation',
    type: 'societe',
    name: '',
    company: '',
    email: '',
    phone: '',
    gsm: '',
    fax: '',
    website: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'Maroc',
    ice: '',
    ifCode: '',
    rcCode: '',
    createdDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [editValues, setEditValues] = useState<UnifiedClientFormValues>({
    sourceModule: 'facturation',
    type: 'societe',
    name: '',
    company: '',
    email: '',
    phone: '',
    gsm: '',
    fax: '',
    website: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'Maroc',
    ice: '',
    ifCode: '',
    rcCode: '',
    createdDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'unified-clients-registry-v1') {
        setRegistryVersion((v) => v + 1);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const registryClients = useMemo(() => getUnifiedClientsRegistry(), [registryVersion]);

  const unifiedRows = useMemo(() => {
    const fromTourism: UnifiedListRow[] = tourismClients.map((client) => ({
      id: `tour-${client.id}`,
      sourceModule: 'touristique',
      sourceId: client.id,
      name: client.name,
      company: client.company || '',
      phone: client.phone || '',
      email: client.email || '',
      city: '',
    }));
    const fromTms: UnifiedListRow[] = tmsClients.map((client) => ({
      id: `tms-${client.id}`,
      sourceModule: 'tms',
      sourceId: client.id,
      name: client.name,
      company: client.company || '',
      phone: client.phone || '',
      email: client.email || '',
      city: client.city || '',
    }));
    const fromFacturation: UnifiedListRow[] = registryClients
      .filter((item) => item.source_module === 'facturation')
      .map((item) => ({
        id: item.id,
        sourceModule: 'facturation',
        sourceId: item.source_id,
        name: item.name,
        company: item.company || '',
        phone: item.phone || '',
        email: item.email || '',
        city: item.city || '',
      }));
    return [...fromFacturation, ...fromTourism, ...fromTms];
  }, [tourismClients, tmsClients, registryClients]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return unifiedRows;
    const q = search.trim().toLowerCase();
    return unifiedRows.filter((row) =>
      `${row.name} ${row.company} ${row.phone} ${row.email} ${row.city}`.toLowerCase().includes(q)
    );
  }, [unifiedRows, search]);

  const resetForm = () => {
    setFormValues({
      sourceModule: 'facturation',
      type: 'societe',
      name: '',
      company: '',
      email: '',
      phone: '',
      gsm: '',
      fax: '',
      website: '',
      address: '',
      postalCode: '',
      city: '',
      country: 'Maroc',
      ice: '',
      ifCode: '',
      rcCode: '',
      createdDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
  };

  const handleCreateUnifiedClient = async () => {
    const name = formValues.name.trim();
    if (!name) return;
    const notes = [
      formValues.notes.trim(),
      formValues.gsm.trim() ? `GSM: ${formValues.gsm.trim()}` : '',
      formValues.fax.trim() ? `Fax: ${formValues.fax.trim()}` : '',
      formValues.website.trim() ? `Web: ${formValues.website.trim()}` : '',
      formValues.postalCode.trim() ? `CP: ${formValues.postalCode.trim()}` : '',
      formValues.country.trim() ? `Pays: ${formValues.country.trim()}` : '',
      formValues.ifCode.trim() ? `IF: ${formValues.ifCode.trim()}` : '',
      formValues.rcCode.trim() ? `RC: ${formValues.rcCode.trim()}` : '',
      formValues.createdDate.trim() ? `Création: ${formValues.createdDate.trim()}` : '',
      formValues.type ? `Type: ${formValues.type}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    if (formValues.sourceModule === 'touristique') {
      const created = await createTourismClient.mutateAsync({
        name,
        email: formValues.email.trim() || null,
        phone: formValues.phone.trim() || null,
        company: formValues.company.trim() || null,
        address: formValues.address.trim() || null,
        notes: notes || null,
      });
      upsertUnifiedClientRecord({
        source_module: 'touristique',
        source_id: created.id,
        name: created.name,
        company: created.company,
        phone: created.phone,
        email: created.email,
        address: created.address,
        city: null,
        ice: formValues.ice.trim() || null,
        notes: created.notes,
      });
    } else if (formValues.sourceModule === 'tms') {
      const created = await createTmsClient.mutateAsync({
        name,
        company: formValues.company.trim() || null,
        phone: formValues.phone.trim() || null,
        email: formValues.email.trim() || null,
        address: formValues.address.trim() || null,
        city: formValues.city.trim() || null,
        ice: formValues.ice.trim() || null,
        notes: notes || null,
      });
      upsertUnifiedClientRecord({
        source_module: 'tms',
        source_id: created.id,
        name: created.name,
        company: created.company,
        phone: created.phone,
        email: created.email,
        address: created.address,
        city: created.city,
        ice: created.ice,
        notes: created.notes,
      });
    } else {
      upsertUnifiedClientRecord({
        source_module: 'facturation',
        source_id: `facturation-${Date.now()}`,
        name,
        company: formValues.company.trim() || null,
        phone: formValues.phone.trim() || null,
        email: formValues.email.trim() || null,
        address: formValues.address.trim() || null,
        city: formValues.city.trim() || null,
        ice: formValues.ice.trim() || null,
        notes: notes || null,
      });
    }

    setRegistryVersion((v) => v + 1);
    setShowUnifiedClientForm(false);
    resetForm();
  };

  const openEditClient = (row: UnifiedListRow) => {
    const fromRegistry = getUnifiedClientsRegistry().find(
      (item) => item.source_module === row.sourceModule && item.source_id === row.sourceId
    );
    const tourism = row.sourceModule === 'touristique' ? tourismClients.find((c) => c.id === row.sourceId) : null;
    const tms = row.sourceModule === 'tms' ? tmsClients.find((c) => c.id === row.sourceId) : null;
    setEditingRow(row);
    setEditValues({
      sourceModule: row.sourceModule,
      type: 'societe',
      name: row.name || '',
      company: row.company || '',
      email: row.email || '',
      phone: row.phone || '',
      gsm: '',
      fax: '',
      website: '',
      address: fromRegistry?.address || tourism?.address || tms?.address || '',
      postalCode: '',
      city: row.city || (tms?.city || ''),
      country: 'Maroc',
      ice: fromRegistry?.ice || tms?.ice || '',
      ifCode: '',
      rcCode: '',
      createdDate: new Date().toISOString().slice(0, 10),
      notes: fromRegistry?.notes || tourism?.notes || tms?.notes || '',
    });
    setShowEditClientForm(true);
  };

  const handleUpdateClient = async () => {
    if (!editingRow) return;
    const name = editValues.name.trim();
    if (!name) return;
    setIsSavingEdit(true);
    try {
      if (editingRow.sourceModule === 'facturation') {
        upsertUnifiedClientRecord({
          source_module: 'facturation',
          source_id: editingRow.sourceId,
          name,
          company: editValues.company.trim() || null,
          phone: editValues.phone.trim() || null,
          email: editValues.email.trim() || null,
          address: editValues.address.trim() || null,
          city: editValues.city.trim() || null,
          ice: editValues.ice.trim() || null,
          notes: editValues.notes.trim() || null,
        });
      } else if (editingRow.sourceModule === 'touristique') {
        const updated = await updateTourismClient.mutateAsync({
          id: editingRow.sourceId,
          name,
          company: editValues.company.trim() || null,
          phone: editValues.phone.trim() || null,
          email: editValues.email.trim() || null,
          address: editValues.address.trim() || null,
          notes: editValues.notes.trim() || null,
        });
        upsertUnifiedClientRecord({
          source_module: 'touristique',
          source_id: updated.id,
          name: updated.name,
          company: updated.company,
          phone: updated.phone,
          email: updated.email,
          address: updated.address,
          city: null,
          ice: editValues.ice.trim() || null,
          notes: updated.notes,
        });
      } else {
        const { data, error } = await supabase
          .from('tms_clients')
          .update({
            name,
            company: editValues.company.trim() || null,
            phone: editValues.phone.trim() || null,
            email: editValues.email.trim() || null,
            address: editValues.address.trim() || null,
            city: editValues.city.trim() || null,
            ice: editValues.ice.trim() || null,
            notes: editValues.notes.trim() || null,
          })
          .eq('id', editingRow.sourceId)
          .select()
          .single();
        if (error) throw error;
        upsertUnifiedClientRecord({
          source_module: 'tms',
          source_id: data.id,
          name: data.name,
          company: data.company,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          ice: data.ice,
          notes: data.notes,
        });
        await queryClient.invalidateQueries({ queryKey: ['tms_clients'] });
      }
      setRegistryVersion((v) => v + 1);
      setShowEditClientForm(false);
      setEditingRow(null);
      toast({ title: 'Succès', description: 'Client modifié avec succès.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la modification du client.';
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestion des Clients</h1>
            <p className="text-muted-foreground">Liste client unifiée pour Facturation, Touristique et TMS.</p>
          </div>
          <Dialog open={showUnifiedClientForm} onOpenChange={setShowUnifiedClientForm}>
            <Button onClick={() => setShowUnifiedClientForm(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Nouveau client
            </Button>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Nouveau client</DialogTitle>
              </DialogHeader>
              <div className="max-h-[72vh] overflow-y-auto pr-1">
                <UnifiedClientForm
                  values={formValues}
                  onChange={(field, value) => setFormValues((prev) => ({ ...prev, [field]: value }))}
                  onSubmit={handleCreateUnifiedClient}
                  onCancel={() => setShowUnifiedClientForm(false)}
                  isSubmitting={createTourismClient.isPending || createTmsClient.isPending}
                  showSourceModule
                />
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showEditClientForm} onOpenChange={setShowEditClientForm}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Modifier client</DialogTitle>
              </DialogHeader>
              <div className="max-h-[72vh] overflow-y-auto pr-1">
                <UnifiedClientForm
                  values={editValues}
                  onChange={(field, value) => setEditValues((prev) => ({ ...prev, [field]: value }))}
                  onSubmit={handleUpdateClient}
                  onCancel={() => setShowEditClientForm(false)}
                  isSubmitting={isSavingEdit || updateTourismClient.isPending}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Rechercher par nom, téléphone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
          <Users className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
        </div>

        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle>Liste client</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredRows.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Aucun client enregistré</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Société</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.company || '-'}</TableCell>
                      <TableCell>
                        {row.sourceModule === 'facturation'
                          ? 'Facturation'
                          : row.sourceModule === 'touristique'
                            ? 'Transport Touristique'
                            : 'Transport TMS'}
                      </TableCell>
                      <TableCell>{row.phone || '-'}</TableCell>
                      <TableCell>{row.email || '-'}</TableCell>
                      <TableCell>{row.city || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEditClient(row)}>
                          <Pencil className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
