import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, Filter, LayoutGrid, List, UserCheck, UserX, Clock, Loader2, Car, Wifi, WifiOff, Plus, Bug } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDrivers, Driver } from '@/hooks/useDrivers';
import { useGPSwoxData, GPSwoxDriver } from '@/hooks/useGPSwoxVehicles';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DriverForm } from '@/components/drivers/DriverForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useUpdateDriver } from '@/hooks/useDrivers';

interface MappedDriver {
  id: string;
  name: string;
  phone: string;
  licenseType: string;
  licenseExpiry: string;
  vehicleId: string | null;
  vehiclePlate: string | null;
  status: 'available' | 'on_mission' | 'off_duty';
  isOnline: boolean;
  source: 'local' | 'gpswox';
}

export default function Drivers() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [hideGPSwox, setHideGPSwox] = useState(false);

  const { data: drivers = [], isLoading: isLoadingDrivers } = useDrivers();
  const { data: gpswoxData, isLoading: isLoadingGPSwox, error: gpswoxError } = useGPSwoxData();
  const updateDriver = useUpdateDriver();
  const [restDialogDriver, setRestDialogDriver] = useState<MappedDriver | null>(null);
  const [restStart, setRestStart] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [restDays, setRestDays] = useState<number>(1);
  
  const vehicles = gpswoxData?.vehicles || [];
  const gpswoxDrivers = gpswoxData?.drivers || [];
  const debug = gpswoxData?.debug;

  console.log('GPSwox Data Debug:', { 
    vehiclesCount: vehicles.length, 
    driversCount: gpswoxDrivers.length, 
    error: gpswoxError,
    drivers: gpswoxDrivers 
  });

  const isLoading = isLoadingDrivers || isLoadingGPSwox;

  // Map drivers with vehicle status from GPSwox
  const mappedDrivers = useMemo(() => {
    // Create a map of vehicle plate to vehicle for quick lookup
    const vehicleByPlate = new Map<string, typeof vehicles[0]>();
    const vehicleById = new Map<string, typeof vehicles[0]>();
    vehicles.forEach(v => {
      vehicleByPlate.set(v.plate.toLowerCase(), v);
      vehicleById.set(v.id, v);
    });

    const localDrivers: MappedDriver[] = drivers.map((driver: Driver): MappedDriver => {
      // Try to find the vehicle assigned to this driver
      let vehicle = driver.vehicle_id ? vehicleById.get(driver.vehicle_id) : null;
      
      // Also try to find by matching vehicle plate
      if (!vehicle && driver.vehicle_id) {
        vehicle = vehicleByPlate.get(driver.vehicle_id.toLowerCase());
      }
      
      // Determine status based on vehicle state
      let status: 'available' | 'on_mission' | 'off_duty' = (driver.status as 'available' | 'on_mission' | 'off_duty') || 'off_duty';
      let isOnline = false;
      
      if (vehicle) {
        isOnline = vehicle.online === 'online' || vehicle.online === 'ack';
        const isMoving = vehicle.lastPosition?.speed && vehicle.lastPosition.speed > 0;
        
        if (!isOnline) {
          status = 'off_duty';
        } else if (isMoving) {
          status = 'on_mission';
        } else {
          status = 'available';
        }
      }
      
      return {
        id: driver.id,
        name: driver.name,
        phone: driver.phone || '',
        licenseType: driver.license_type,
        licenseExpiry: driver.license_expiry,
        vehicleId: driver.vehicle_id,
        vehiclePlate: vehicle?.plate || null,
        status,
        isOnline,
        source: 'local',
      };
    });

    // Map GPSwox drivers that are not in local DB (by name)
    const localDriverNames = new Set(localDrivers.map(d => d.name.toLowerCase()));
    
    const remoteDrivers: MappedDriver[] = gpswoxDrivers
      .filter(d => !localDriverNames.has(d.name.toLowerCase()))
      .map((driver: GPSwoxDriver) => {
        // Find vehicle for this driver
        let vehicle = driver.deviceId ? vehicleById.get(String(driver.deviceId)) : null;
        if (!vehicle && driver.deviceName) {
          vehicle = vehicleByPlate.get(driver.deviceName.toLowerCase());
        }

        let status: 'available' | 'on_mission' | 'off_duty' = 'off_duty';
        let isOnline = false;

        if (vehicle) {
          isOnline = vehicle.online === 'online' || vehicle.online === 'ack';
          const isMoving = vehicle.lastPosition?.speed && vehicle.lastPosition.speed > 0;
          
          if (!isOnline) {
            status = 'off_duty';
          } else if (isMoving) {
            status = 'on_mission';
          } else {
            status = 'available';
          }
        }

        return {
          id: `gpswox-${driver.id}`,
          name: driver.name,
          phone: driver.phone || '',
          licenseType: 'GPSwox',
          licenseExpiry: '',
          vehicleId: driver.deviceId ? String(driver.deviceId) : null,
          vehiclePlate: driver.deviceName || vehicle?.plate || null,
          status,
          isOnline,
          source: 'gpswox',
        };
      });

    return [...localDrivers, ...remoteDrivers];
  }, [drivers, vehicles, gpswoxDrivers]);

  useEffect(() => {
    mappedDrivers.forEach(d => {
      const key = `driver_rest_${d.id}`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (!raw) return;
      const data = JSON.parse(raw);
      const end = new Date(data.end);
      const now = new Date();
      if (now >= end && d.source === 'local' && d.status === 'off_duty') {
        updateDriver.mutate({ id: d.id, status: 'available' });
        localStorage.removeItem(key);
      }
    });
  }, [mappedDrivers, updateDriver]);

  const handleSaveRest = () => {
    if (!restDialogDriver) return;
    const start = new Date(restStart);
    const end = new Date(restStart);
    end.setDate(start.getDate() + Number(restDays));
    const key = `driver_rest_${restDialogDriver.id}`;
    localStorage.setItem(key, JSON.stringify({ start: start.toISOString(), end: end.toISOString(), days: Number(restDays) }));
    if (restDialogDriver.source === 'local') {
      updateDriver.mutate({ id: restDialogDriver.id, status: 'off_duty' });
    }
    setRestDialogDriver(null);
  };
  // Filter drivers
  const filteredDrivers = mappedDrivers.filter((driver) => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery) ||
      (driver.vehiclePlate?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    const matchesSource = !hideGPSwox || driver.source !== 'gpswox';
    return matchesSearch && matchesStatus && matchesSource;
  });

  // Status counts
  const statusCounts = {
    all: mappedDrivers.length,
    available: mappedDrivers.filter(d => d.status === 'available').length,
    on_mission: mappedDrivers.filter(d => d.status === 'on_mission').length,
    off_duty: mappedDrivers.filter(d => d.status === 'off_duty').length,
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {gpswoxError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
            <UserX className="w-5 h-5" />
            <p className="font-medium">
              Erreur GPSwox: {gpswoxError instanceof Error ? gpswoxError.message : 'Erreur inconnue'}
            </p>
          </div>
        )}

        {/* Debug Toggle */}
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Bug className="w-3 h-3 mr-1" />
            {showDebug ? 'Masquer Debug' : 'Afficher Debug'}
          </Button>
        </div>

        {/* Debug Panel */}
        {showDebug && debug && (
          <Card className="bg-slate-950 text-slate-50 border-slate-800">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-blue-400 mb-2">Logs Serveur GPSwox</h3>
                <div className="bg-slate-900 p-2 rounded text-xs font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {debug.logs ? debug.logs.join('\n') : 'Aucun log disponible'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-green-400 mb-2">Source Données</h3>
                  <pre className="bg-slate-900 p-2 rounded text-xs font-mono overflow-x-auto">
                    {JSON.stringify({
                      source: debug.driversSource,
                      extracted: debug.extractedCount,
                      fetchError: debug.driverFetchError
                    }, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-400 mb-2">Exemple Véhicule (Brut)</h3>
                  <pre className="bg-slate-900 p-2 rounded text-xs font-mono overflow-x-auto max-h-40">
                    {debug.firstVehicleSample ? JSON.stringify(debug.firstVehicleSample, null, 2) : 'Aucun véhicule trouvé'}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" />
              {t('nav.drivers')}
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestion des conducteurs avec statut en temps réel
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
              <Car className="w-4 h-4" />
              {vehicles.length} véhicules • {mappedDrivers.length} conducteurs
            </Badge>
            {gpswoxDrivers.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 border-blue-200">
                <Wifi className="w-3 h-3" />
                GPSwox: {gpswoxDrivers.length}
              </Badge>
            )}
            <Button 
              variant={hideGPSwox ? 'secondary' : 'outline'} 
              size="sm" 
              onClick={() => setHideGPSwox(!hideGPSwox)}
              className="px-3"
            >
              {hideGPSwox ? 'Afficher GPSwox' : 'Masquer GPSwox'}
            </Button>
            <Button className="flex items-center gap-2" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Ajouter un conducteur
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'p-4 rounded-xl border transition-all text-left',
              statusFilter === 'all' 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-card hover:border-primary/30'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{statusCounts.all}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setStatusFilter('available')}
            className={cn(
              'p-4 rounded-xl border transition-all text-left',
              statusFilter === 'available' 
                ? 'border-success bg-success/5' 
                : 'border-border bg-card hover:border-success/30'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{statusCounts.available}</p>
                <p className="text-sm text-muted-foreground">Disponibles</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setStatusFilter('on_mission')}
            className={cn(
              'p-4 rounded-xl border transition-all text-left',
              statusFilter === 'on_mission' 
                ? 'border-info bg-info/5' 
                : 'border-border bg-card hover:border-info/30'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{statusCounts.on_mission}</p>
                <p className="text-sm text-muted-foreground">En mission</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setStatusFilter('off_duty')}
            className={cn(
              'p-4 rounded-xl border transition-all text-left',
              statusFilter === 'off_duty' 
                ? 'border-muted bg-muted/30' 
                : 'border-border bg-card hover:border-muted-foreground/30'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <UserX className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{statusCounts.off_duty}</p>
                <p className="text-sm text-muted-foreground">Repos</p>
              </div>
            </div>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-xl border border-border">
          <div className="flex flex-1 gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:max-w-xs">
              <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground', isRTL ? 'right-3' : 'left-3')} />
              <Input
                placeholder="Rechercher un chauffeur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn('w-full', isRTL ? 'pr-10' : 'pl-10')}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="on_mission">En mission</SelectItem>
                <SelectItem value="off_duty">Repos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {filteredDrivers.length} conducteur{filteredDrivers.length > 1 ? 's' : ''}
          </Badge>
          {statusFilter !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')} className="h-6 px-2 text-xs">
              Effacer le filtre
            </Button>
          )}
        </div>

        {/* Drivers Grid/List */}
        {filteredDrivers.length > 0 ? (
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
              : 'space-y-3'
          )}>
            {filteredDrivers.map((driver) => (
              <DriverCardComponent key={driver.id} driver={driver} viewMode={viewMode} onOpenRepos={() => setRestDialogDriver(driver)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">Aucun conducteur trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {mappedDrivers.length === 0 
                ? "Ajoutez des conducteurs pour commencer"
                : "Essayez de modifier vos critères de recherche"
              }
            </p>
            {mappedDrivers.length === 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un conducteur
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Driver Dialog */}
      <DriverForm 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
      />
      <Dialog open={!!restDialogDriver} onOpenChange={(v) => !v && setRestDialogDriver(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Mettre en repos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Date de début</span>
                <Input type="date" value={restStart} onChange={(e) => setRestStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Jours de repos</span>
                <Input type="number" min={1} value={restDays} onChange={(e) => setRestDays(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestDialogDriver(null)}>Annuler</Button>
            <Button onClick={handleSaveRest}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Driver Card Component
function DriverCardComponent({ driver, viewMode, onOpenRepos }: { driver: MappedDriver; viewMode: 'grid' | 'list'; onOpenRepos: () => void }) {
  const statusConfig = {
    available: { label: 'Disponible', color: 'bg-success text-success-foreground' },
    on_mission: { label: 'En mission', color: 'bg-info text-info-foreground' },
    off_duty: { label: 'Repos', color: 'bg-muted text-muted-foreground' },
  };

  const config = statusConfig[driver.status];
  const initials = driver.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const restKey = `driver_rest_${driver.id}`;
  const restRaw = typeof window !== 'undefined' ? localStorage.getItem(restKey) : null;
  const restData = restRaw ? JSON.parse(restRaw) : null;
  const daysLeft = restData ? Math.max(0, Math.ceil((new Date(restData.end).getTime() - Date.now()) / 86400000)) : null;

  if (viewMode === 'list') {
    return (
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {driver.vehiclePlate && (
                  <div className={cn(
                    'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center',
                    driver.isOnline ? 'bg-success' : 'bg-muted'
                  )}>
                    {driver.isOnline ? (
                      <Wifi className="w-2.5 h-2.5 text-success-foreground" />
                    ) : (
                      <WifiOff className="w-2.5 h-2.5 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{driver.name}</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {driver.phone && <span>{driver.phone}</span>}
                  <span>Permis {driver.licenseType}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {driver.source === 'gpswox' && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                  GPSwox
                </Badge>
              )}
              {driver.vehiclePlate && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  {driver.vehiclePlate}
                </Badge>
              )}
              <Badge className={config.color}>
                {config.label}
                {daysLeft !== null && (
                  <span className="ml-1 text-destructive font-semibold">• reste {daysLeft}j</span>
                )}
              </Badge>
              {driver.source === 'local' && (
                <Button size="sm" variant="secondary" onClick={onOpenRepos}>Repos</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            {driver.vehiclePlate && (
              <div className={cn(
                'absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center',
                driver.isOnline ? 'bg-success' : 'bg-muted'
              )}>
                {driver.isOnline ? (
                  <Wifi className="w-3 h-3 text-success-foreground" />
                ) : (
                  <WifiOff className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {driver.source === 'gpswox' && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 h-fit">
                GPSwox
              </Badge>
            )}
            <Badge className={cn(config.color, "h-fit")}>
              {config.label}
              {daysLeft !== null && (
                <span className="ml-1 text-destructive font-semibold">• reste {daysLeft}j</span>
              )}
            </Badge>
            {driver.source === 'local' && (
              <Button size="sm" variant="secondary" onClick={onOpenRepos}>Repos</Button>
            )}
          </div>
        </div>
        
        <h3 className="font-semibold text-foreground text-lg mb-1">{driver.name}</h3>
        
        <div className="space-y-1 text-sm text-muted-foreground mb-3">
          {driver.phone && (
            <p className="flex items-center gap-2">
              <span className="text-foreground/70">📞</span> {driver.phone}
            </p>
          )}
          <p className="flex items-center gap-2">
            <span className="text-foreground/70">🪪</span> Permis {driver.licenseType}
          </p>
        </div>
        
        {driver.vehiclePlate ? (
          <Badge variant="outline" className="flex items-center gap-1 w-fit">
            <Car className="w-3 h-3" />
            {driver.vehiclePlate}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-muted-foreground">
            Aucun véhicule assigné
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
