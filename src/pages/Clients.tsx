import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Palmtree, PackageCheck, TrendingUp, Building2, UserPlus } from 'lucide-react';
import { useTourismClients } from '@/hooks/useTourism';
import { useTMSClients } from '@/hooks/useTMS';
import { ClientsList as TourismClientsList } from '@/components/tourism/ClientsList';
import { ClientsList as TMSClientsList } from '@/components/tms/ClientsList';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientForm as TourismClientForm } from '@/components/tourism/ClientForm';
import { ClientForm as TMSClientForm } from '@/components/tms/ClientForm';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Clients() {
  const { data: tourismClients = [] } = useTourismClients();
  const { data: tmsClients = [] } = useTMSClients();
  const [search, setSearch] = useState('');
  const [showTourismClientForm, setShowTourismClientForm] = useState(false);
  const { moduleSettings } = useAppSettings();

  const showTourism = moduleSettings?.transport_touristique !== false;
  const showTMS = moduleSettings?.transport_tms !== false;

  const tourismCount = showTourism ? tourismClients.length : 0;
  const tmsCount = showTMS ? tmsClients.length : 0;
  const total = tourismCount + tmsCount;

  // Calculate companies vs individuals (simple heuristic: has company name)
  const companyCount = useMemo(() => {
    const tourismCompanies = tourismClients.filter(c => !!c.company).length;
    const tmsCompanies = tmsClients.filter(c => !!c.company).length;
    return (showTourism ? tourismCompanies : 0) + (showTMS ? tmsCompanies : 0);
  }, [tourismClients, tmsClients, showTourism, showTMS]);

  const searchLower = search.toLowerCase();
  const match = (v: string | null | undefined) => (v || '').toLowerCase().includes(searchLower);

  const filteredTourism = useMemo(() => {
    if (!search) return tourismClients;
    return tourismClients.filter(c => match(c.name) || match(c.company) || match(c.email) || match(c.phone));
  }, [tourismClients, search]);

  const filteredTMS = useMemo(() => {
    if (!search) return tmsClients;
    return tmsClients.filter(c => match(c.name) || match(c.company) || match(c.email) || match(c.phone) || match(c.city) || match(c.ice));
  }, [tmsClients, search]);

  const defaultTab = showTourism ? 'tourism' : 'tms';
  const tabCols = (showTourism && showTMS) ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestion des Clients</h1>
            <p className="text-muted-foreground">Gérez votre portefeuille client et suivez les performances.</p>
          </div>
          <div className="flex gap-2">
            {showTourism && (
              <Dialog open={showTourismClientForm} onOpenChange={setShowTourismClientForm}>
                <Button onClick={() => setShowTourismClientForm(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nouveau Client (Tourisme)
                </Button>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Nouveau client (Touristique)</DialogTitle>
                  </DialogHeader>
                  <TourismClientForm onSuccess={() => setShowTourismClientForm(false)} />
                </DialogContent>
              </Dialog>
            )}
            {showTMS && (
              <TMSClientForm />
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">
                Portefeuille global
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sociétés</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companyCount}</div>
              <p className="text-xs text-muted-foreground">
                Clients B2B
              </p>
            </CardContent>
          </Card>
          {showTourism && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tourisme</CardTitle>
                <Palmtree className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tourismCount}</div>
                <p className="text-xs text-muted-foreground">
                  Clients touristiques
                </p>
              </CardContent>
            </Card>
          )}
          {showTMS && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Logistique (TMS)</CardTitle>
                <PackageCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tmsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Clients transport
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Rechercher par nom, téléphone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
            <Users className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          </div>
        </div>

        {(showTourism || showTMS) ? (
          <Tabs defaultValue={defaultTab} className="space-y-4">
            <TabsList className={`grid ${tabCols} w-full max-w-md`}>
              {showTourism && (
                <TabsTrigger value="tourism" className="flex items-center gap-2">
                  <Palmtree className="w-4 h-4" /> Transport Touristique
                </TabsTrigger>
              )}
              {showTMS && (
                <TabsTrigger value="tms" className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4" /> Transport TMS
                </TabsTrigger>
              )}
            </TabsList>

            {showTourism && (
              <TabsContent value="tourism">
                <TourismClientsList />
              </TabsContent>
            )}
            {showTMS && (
              <TabsContent value="tms">
                <TMSClientsList />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Aucun module client activé
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
