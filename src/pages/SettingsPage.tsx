import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppSettings, ModuleSettings } from '@/hooks/useAppSettings';
import { Settings, LayoutGrid, ShieldCheck, Bell, Palette } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme, Theme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { moduleSettings, isLoading, updateModuleSettings } = useAppSettings();
  const { theme, setTheme } = useTheme();

  const handleToggleModule = (moduleKey: keyof ModuleSettings, enabled: boolean) => {
    if (!moduleSettings) return;
    const newSettings = { ...moduleSettings, [moduleKey]: enabled };
    updateModuleSettings.mutate(newSettings);
  };

  const modulesList: { key: keyof ModuleSettings; label: string; description: string }[] = [
    { key: 'dashboard', label: 'Tableau de bord', description: "Vue d'ensemble et statistiques" },
    { key: 'vehicles', label: 'Véhicules', description: 'Gestion de la flotte et maintenance' },
    { key: 'drivers', label: 'Chauffeurs', description: 'Gestion des dossiers chauffeurs' },
    { key: 'personnel', label: 'Personnel & RH', description: 'Gestion des employés et documents' },
    { key: 'live_map', label: 'Carte Live', description: 'Suivi en temps réel des véhicules' },
    { key: 'missions', label: 'Missions', description: 'Planification et suivi des trajets' },
    { key: 'transport_btp', label: 'Transport BTP', description: 'Module spécialisé BTP' },
    { key: 'transport_touristique', label: 'Transport Touristique', description: 'Gestion des circuits touristiques' },
    { key: 'transport_voyageurs', label: 'Transport Voyageurs', description: 'Lignes régulières et personnel' },
    { key: 'transport_tms', label: 'Transport TMS', description: 'Transport Management System' },
    { key: 'fuel', label: 'Carburant', description: 'Gestion de la consommation et cartes' },
    { key: 'citerne', label: 'Citerne', description: 'Gestion des stocks de carburant' },
    { key: 'maintenance', label: 'Maintenance', description: 'Entretien et réparations' },
    { key: 'stock', label: 'Stock', description: 'Gestion des pièces et consommables' },
    { key: 'achats', label: 'Achats', description: 'Gestion des commandes fournisseurs' },
    { key: 'comptabilite', label: 'Comptabilité', description: 'Gestion comptable et facturation' },
    { key: 'finance', label: 'Finance', description: 'Trésorerie, caisses et banques' },
    { key: 'reports', label: 'Rapports', description: 'Analyses et statistiques' },
    { key: 'alerts', label: 'Alertes', description: 'Notifications et rappels' },
  ];

  const themes: { name: Theme; label: string; color: string; ring: string }[] = [
    { name: 'default', label: 'Défaut (Sarcelle)', color: 'bg-[#0d9488]', ring: 'ring-[#0d9488]' },
    { name: 'blue', label: 'Bleu Royal', color: 'bg-[#2563eb]', ring: 'ring-[#2563eb]' },
    { name: 'green', label: 'Émeraude', color: 'bg-[#16a34a]', ring: 'ring-[#16a34a]' },
    { name: 'purple', label: 'Violet', color: 'bg-[#9333ea]', ring: 'ring-[#9333ea]' },
    { name: 'orange', label: 'Orange', color: 'bg-[#f97316]', ring: 'ring-[#f97316]' },
    { name: 'red', label: 'Rouge', color: 'bg-[#ef4444]', ring: 'ring-[#ef4444]' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Paramètres
          </h1>
          <p className="text-muted-foreground">Gérez les configurations globales de votre application</p>
        </div>

        <Tabs defaultValue="modules" className="space-y-4">
          <TabsList>
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Activation des Modules
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Apparence
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Général
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Sécurité
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Modules de l'application</CardTitle>
                <CardDescription>
                  Activez ou désactivez les modules selon vos besoins. Les modules désactivés seront masqués du menu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isLoading ? (
                    <div className="col-span-2 text-center py-8">Chargement des paramètres...</div>
                  ) : (
                    modulesList.map((m) => (
                      <div key={m.key} className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
                        <div className="flex-1 space-y-1">
                          <Label htmlFor={m.key} className="text-base font-semibold">
                            {m.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {m.description}
                          </p>
                        </div>
                        <Switch
                          id={m.key}
                          checked={moduleSettings?.[m.key] ?? true}
                          disabled={updateModuleSettings.isPending}
                          onCheckedChange={(checked) => handleToggleModule(m.key, checked)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Thème de l'application</CardTitle>
                <CardDescription>
                  Personnalisez l'apparence de votre espace de travail. Choisissez parmi nos thèmes prédéfinis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {themes.map((t) => (
                    <div
                      key={t.name}
                      className={cn(
                        "cursor-pointer rounded-xl border-2 p-1 hover:bg-accent hover:text-accent-foreground transition-all",
                        theme === t.name ? `border-primary ring-2 ring-offset-2 ring-primary/30` : "border-transparent"
                      )}
                      onClick={() => setTheme(t.name)}
                    >
                      <div className="space-y-2 rounded-lg bg-card p-2">
                        <div className={cn("h-20 rounded-lg shadow-sm w-full", t.color)} />
                        <div className="space-y-1">
                          <h3 className="font-medium leading-none text-center text-sm">{t.label}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres Généraux</CardTitle>
                <CardDescription>Configurez les informations de base de votre entreprise</CardDescription>
              </CardHeader>
              <CardContent className="py-8 text-center text-muted-foreground">
                Bientôt disponible
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>Gérez les accès et les permissions</CardDescription>
              </CardHeader>
              <CardContent className="py-8 text-center text-muted-foreground">
                Bientôt disponible
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
