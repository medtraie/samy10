import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Palmtree, PackageCheck } from 'lucide-react';
import { useTourismClients } from '@/hooks/useTourism';
import { useTMSClients } from '@/hooks/useTMS';
import { ClientsList as TourismClientsList } from '@/components/tourism/ClientsList';
import { ClientsList as TMSClientsList } from '@/components/tms/ClientsList';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientForm as TourismClientForm } from '@/components/tourism/ClientForm';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Card, CardContent } from '@/components/ui/card';

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
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Total: {total}
              </Badge>
              {showTourism && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Palmtree className="w-4 h-4" /> Touristique: {tourismCount}
                </Badge>
              )}
              {showTMS && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4" /> TMS: {tmsCount}
                </Badge>
              )}
            </div>
          </div>
          <div className="w-full sm:w-80">
            <Input
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                <div className="flex justify-end mb-4">
                  <Dialog open={showTourismClientForm} onOpenChange={setShowTourismClientForm}>
                    <Button size="sm" onClick={() => setShowTourismClientForm(true)}>
                      Nouveau client
                    </Button>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Nouveau client (Touristique)</DialogTitle>
                      </DialogHeader>
                      <TourismClientForm onSuccess={() => setShowTourismClientForm(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
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
