import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Route, TruckIcon, FileText } from 'lucide-react';
import { TrajetsList } from '@/components/transport/TrajetsList';
import { VoyagesList } from '@/components/transport/VoyagesList';
import { FacturesList } from '@/components/transport/FacturesList';

export default function TransportBTP() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('nav.transportBTP')}</h1>
          <p className="text-muted-foreground">
            Gestion du transport BTP: trajets, voyages et facturation
          </p>
        </div>

        <Tabs defaultValue="voyages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="trajets" className="flex items-center gap-2">
              <Route className="w-4 h-4" />
              <span className="hidden sm:inline">Trajets</span>
            </TabsTrigger>
            <TabsTrigger value="voyages" className="flex items-center gap-2">
              <TruckIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Voyages</span>
            </TabsTrigger>
            <TabsTrigger value="facturation" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Facturation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trajets">
            <TrajetsList />
          </TabsContent>

          <TabsContent value="voyages">
            <VoyagesList />
          </TabsContent>

          <TabsContent value="facturation">
            <FacturesList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
