import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Grid, List, Download, RefreshCw, Loader2, ArrowDownUp, Fuel, Battery, Activity } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useGPSwoxVehicles } from '@/hooks/useGPSwoxVehicles';
import { cn } from '@/lib/utils';

export default function Vehicles() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [onlineFilter, setOnlineFilter] = useState<string>('all');
  const [fuelFilter, setFuelFilter] = useState<string>('all');
  const [batteryFilter, setBatteryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('mileage');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: vehicles = [], isLoading, isError, error, refetch, isFetching } = useGPSwoxVehicles(30000);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
      const matchesOnline = onlineFilter === 'all' || 
        (onlineFilter === 'online' && vehicle.online === 'online') ||
        (onlineFilter === 'offline' && vehicle.online === 'offline') ||
        (onlineFilter === 'ack' && vehicle.online === 'ack');
      const matchesFuel = fuelFilter === 'all' || 
        (fuelFilter === 'low' && vehicle.fuelQuantity !== null && vehicle.fuelQuantity < 20) ||
        (fuelFilter === 'ok' && (vehicle.fuelQuantity === null || vehicle.fuelQuantity >= 20));
      const matchesBattery = batteryFilter === 'all' ||
        (batteryFilter === 'low' && vehicle.battery !== null && vehicle.battery < 20) ||
        (batteryFilter === 'ok' && (vehicle.battery === null || vehicle.battery >= 20));
      const matchesSearch =
        searchQuery === '' ||
        vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicle.driver && vehicle.driver.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesOnline && matchesFuel && matchesBattery && matchesSearch;
    });
  }, [vehicles, statusFilter, onlineFilter, fuelFilter, batteryFilter, searchQuery]);

  const sortedVehicles = useMemo(() => {
    const list = [...filteredVehicles];
    list.sort((a, b) => {
      switch (sortBy) {
        case 'speed':
          return (b.lastPosition?.speed || 0) - (a.lastPosition?.speed || 0);
        case 'distanceToday':
          return (b.distanceToday || 0) - (a.distanceToday || 0);
        case 'updated':
          return (b.lastPosition?.timestamp ? new Date(b.lastPosition.timestamp).getTime() : 0) -
            (a.lastPosition?.timestamp ? new Date(a.lastPosition.timestamp).getTime() : 0);
        default:
          return (b.mileage || 0) - (a.mileage || 0);
      }
    });
    return list;
  }, [filteredVehicles, sortBy]);

  // Stats
  const totalVehicles = vehicles.length;
  const onlineCount = vehicles.filter(v => v.online === 'online').length;
  const offlineCount = vehicles.filter(v => v.online === 'offline').length;
  const activeCount = vehicles.filter(v => v.status === 'active').length;
  const movingCount = vehicles.filter(v => (v.lastPosition?.speed || 0) > 0).length;
  const lowFuelCount = vehicles.filter(v => v.fuelQuantity !== null && v.fuelQuantity < 20).length;
  const lowBatteryCount = vehicles.filter(v => v.battery !== null && v.battery < 20).length;

  const handleExport = () => {
    const headers = ['Plate', 'IMEI', 'Status', 'Online', 'Driver', 'Mileage', 'DistanceToday', 'Speed', 'City', 'LastUpdate'];
    const rows = sortedVehicles.map((vehicle) => [
      vehicle.plate,
      vehicle.imei,
      vehicle.status,
      vehicle.online,
      vehicle.driver || '',
      vehicle.mileage,
      vehicle.distanceToday ?? '',
      vehicle.lastPosition?.speed ?? '',
      vehicle.lastPosition?.city ?? '',
      vehicle.lastPosition?.timestamp ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vehicles-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Véhicules GPSwox</h1>
            <p className="text-muted-foreground">
              {isLoading ? 'Chargement...' : `${totalVehicles} véhicules • ${onlineCount} en ligne`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Actualiser
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={sortedVehicles.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-foreground">{totalVehicles}</div>
            <div className="text-sm text-muted-foreground">Total véhicules</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-success">{onlineCount}</div>
            <div className="text-sm text-muted-foreground">En ligne</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-muted-foreground">{offlineCount}</div>
            <div className="text-sm text-muted-foreground">Hors ligne</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-primary">{activeCount}</div>
            <div className="text-sm text-muted-foreground">Actifs</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-info">{movingCount}</div>
            <div className="text-sm text-muted-foreground">En mouvement</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-destructive">{lowFuelCount}</div>
            <div className="text-sm text-muted-foreground">Carburant bas</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Activity className="w-3.5 h-3.5" />
            {movingCount} en mouvement
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Fuel className="w-3.5 h-3.5" />
            {lowFuelCount} carburant bas
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Battery className="w-3.5 h-3.5" />
            {lowBatteryCount} batterie faible
          </Badge>
        </div>

        {/* Filters Bar */}
        <div className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[240px]">
              <div className="relative">
                <Search
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground',
                    isRTL ? 'right-3' : 'left-3'
                  )}
                />
                <Input
                  type="search"
                  placeholder="Rechercher par plaque, IMEI ou chauffeur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn('bg-muted/50 border-0', isRTL ? 'pr-10' : 'pl-10')}
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            {/* Online Filter */}
            <Select value={onlineFilter} onValueChange={setOnlineFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Connexion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes connexions</SelectItem>
                <SelectItem value="online">🟢 En ligne</SelectItem>
                <SelectItem value="offline">⚫ Hors ligne</SelectItem>
                <SelectItem value="ack">🟡 En attente</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <Select value={fuelFilter} onValueChange={setFuelFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Carburant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous niveaux</SelectItem>
                <SelectItem value="low">Bas (&lt; 20%)</SelectItem>
                <SelectItem value="ok">OK (≥ 20%)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={batteryFilter} onValueChange={setBatteryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Batterie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes batteries</SelectItem>
                <SelectItem value="low">Basse (&lt; 20%)</SelectItem>
                <SelectItem value="ok">OK (≥ 20%)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <ArrowDownUp className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mileage">Kilométrage</SelectItem>
                <SelectItem value="distanceToday">Distance jour</SelectItem>
                <SelectItem value="speed">Vitesse</SelectItem>
                <SelectItem value="updated">Dernière MAJ</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              className="h-8"
              onClick={() => {
                setStatusFilter('all');
                setOnlineFilter('all');
                setFuelFilter('all');
                setBatteryFilter('all');
                setSearchQuery('');
                setSortBy('mileage');
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sortedVehicles.length} véhicule{sortedVehicles.length > 1 ? 's' : ''} trouvé
            {sortedVehicles.length > 1 ? 's' : ''}
          </p>
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Actualisation...
            </span>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Chargement des véhicules...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Erreur de chargement
            </h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              {error?.message || 'Impossible de charger les véhicules depuis GPSwox'}
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        )}

        {/* Vehicles Grid/List */}
        {!isLoading && !isError && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
                {sortedVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in duration-300">
                {sortedVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} compact />
                ))}
              </div>
            )}

            {/* Empty State */}
            {sortedVehicles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Aucun véhicule trouvé
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  Essayez de modifier vos filtres de recherche.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
