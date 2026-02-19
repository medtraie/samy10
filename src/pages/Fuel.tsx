import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Fuel as FuelIcon,
  TrendingUp,
  DollarSign,
  BarChart3,
  Loader2,
  RefreshCw,
  Settings,
  AlertTriangle,
  Car,
  Gauge,
  Droplets,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { useGPSwoxVehicles } from '@/hooks/useGPSwoxVehicles';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Fuel() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pricePerLiter, setPricePerLiter] = useState(12.5); // Default price in MAD
  const [tempPrice, setTempPrice] = useState('12.5');
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);

  const { data: vehicles = [], isLoading, refetch, isFetching } = useGPSwoxVehicles();

  // Filter vehicles with fuel data or sensors
  const vehiclesWithFuel = useMemo(() => vehicles.filter(v => 
    (v.fuelQuantity !== null && v.fuelQuantity !== undefined) || 
    (v.sensors && v.sensors.some(s => s.type === 'fuel'))
  ), [vehicles]);

  const filteredVehicles = useMemo(() => vehiclesWithFuel.filter((vehicle) => {
    const matchesSearch = vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (vehicle.driverDetails?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVehicle = vehicleFilter === 'all' || String(vehicle.id) === vehicleFilter;
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'low' && (vehicle.fuelQuantity || 0) < 20) ||
                          (statusFilter === 'normal' && (vehicle.fuelQuantity || 0) >= 20);
    return matchesSearch && matchesVehicle && matchesStatus;
  }), [vehiclesWithFuel, searchQuery, vehicleFilter, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalFuel = vehiclesWithFuel.reduce((acc, v) => acc + (v.fuelQuantity || 0), 0);
    const estimatedCost = totalFuel * pricePerLiter;
    const avgFuelLevel = vehiclesWithFuel.length > 0 
      ? totalFuel / vehiclesWithFuel.length 
      : 0;
    const totalDistance = vehiclesWithFuel.reduce((acc, v) => acc + (v.distanceMonth || 0), 0);
    const lowFuelCount = vehiclesWithFuel.filter(v => (v.fuelQuantity || 0) < 20).length;
    
    return {
      totalFuel,
      estimatedCost,
      avgFuelLevel,
      totalDistance,
      lowFuelCount
    };
  }, [vehiclesWithFuel, pricePerLiter]);

  // Chart Data
  const consumptionData = useMemo(() => filteredVehicles
    .slice(0, 10)
    .sort((a, b) => (b.fuelQuantity || 0) - (a.fuelQuantity || 0))
    .map(vehicle => ({
      name: vehicle.plate,
      fuel: vehicle.fuelQuantity || 0,
      cost: (vehicle.fuelQuantity || 0) * pricePerLiter,
    })), [filteredVehicles, pricePerLiter]);

  // Mock Trend Data (in a real app, this would come from historical API)
  const trendData = [
    { name: 'Lun', value: stats.totalFuel * 0.9 },
    { name: 'Mar', value: stats.totalFuel * 0.95 },
    { name: 'Mer', value: stats.totalFuel * 0.88 },
    { name: 'Jeu', value: stats.totalFuel * 1.02 },
    { name: 'Ven', value: stats.totalFuel * 0.97 },
    { name: 'Sam', value: stats.totalFuel * 1.05 },
    { name: 'Dim', value: stats.totalFuel },
  ];

  const handlePriceSave = () => {
    const price = parseFloat(tempPrice);
    if (!isNaN(price) && price > 0) {
      setPricePerLiter(price);
      setPriceDialogOpen(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Chargement des données carburant...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FuelIcon className="h-8 w-8 text-primary" />
              {t('nav.fuel')}
            </h1>
            <p className="text-muted-foreground mt-1">
              Suivi de la consommation et des niveaux de carburant en temps réel via GPS
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2 transition-all hover:bg-primary/5"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-md hover:shadow-lg transition-all">
                  <Settings className="h-4 w-4" />
                  Configuration Prix
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Configuration du Carburant</DialogTitle>
                  <DialogDescription>
                    Définissez le prix moyen du carburant pour les estimations de coûts.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Prix / Litre
                    </Label>
                    <div className="col-span-3 relative">
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">Dh</span>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                    Actuellement: <span className="font-bold text-foreground">{pricePerLiter} MAD/L</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handlePriceSave}>Enregistrer les modifications</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="overflow-hidden relative border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full -mr-4 -mt-4" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Droplets className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                {stats.totalFuel > 0 && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                    En direct
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight">{stats.totalFuel.toLocaleString()} L</h3>
                <p className="text-sm text-muted-foreground">Volume Total Flotte</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden relative border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full -mr-4 -mt-4" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
                  Estimé
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight">{formatCurrency(stats.estimatedCost)}</h3>
                <p className="text-sm text-muted-foreground">Valeur Carburant</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden relative border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full -mr-4 -mt-4" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Gauge className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex items-center text-xs font-medium text-amber-600 dark:text-amber-400">
                  Moyenne
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight">{stats.avgFuelLevel.toFixed(1)} L</h3>
                <p className="text-sm text-muted-foreground">Niveau Moyen / Véhicule</p>
              </div>
              <Progress value={Math.min(stats.avgFuelLevel, 100)} className="h-1.5 mt-3 bg-amber-100 dark:bg-amber-900/20" indicatorClassName="bg-amber-500" />
            </CardContent>
          </Card>

          <Card className="overflow-hidden relative border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full -mr-4 -mt-4" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                {stats.lowFuelCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    Action Requise
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight">{stats.lowFuelCount}</h3>
                <p className="text-sm text-muted-foreground">Véhicules Niveau Bas (&lt;20L)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 lg:col-span-2 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Niveau Carburant par Véhicule
              </CardTitle>
              <CardDescription>
                Comparaison des volumes actuels pour les 10 premiers véhicules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consumptionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value}L`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                      }}
                      formatter={(value: number) => [`${value} L`, 'Carburant']}
                    />
                    <Bar dataKey="fuel" radius={[4, 4, 0, 0]}>
                      {consumptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fuel < 20 ? '#ef4444' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Tendance (7 jours)
              </CardTitle>
              <CardDescription>
                Evolution du volume total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} hide />
                    <Tooltip 
                       contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)' 
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle>Détail par Véhicule</CardTitle>
              <CardDescription>Liste complète des véhicules avec données carburant</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher (Matricule, Chauffeur)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full sm:w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="normal">Niveau Normal</SelectItem>
                  <SelectItem value="low">Niveau Bas (&lt;20L)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead className="w-[200px]">Niveau Carburant</TableHead>
                    <TableHead className="text-right">Volume (L)</TableHead>
                    <TableHead className="text-right">Valeur Est.</TableHead>
                    <TableHead className="text-right">Distance (Mois)</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Aucun véhicule trouvé avec des données de carburant.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVehicles.map((vehicle) => {
                      const fuel = vehicle.fuelQuantity || 0;
                      const fuelPct = Math.min(Math.max((fuel / 200) * 100, 0), 100); // Assuming 200L tank for viz
                      const isLow = fuel < 20;
                      
                      return (
                        <TableRow key={vehicle.id} className="group hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-primary/10 rounded-md">
                                <Car className="h-4 w-4 text-primary" />
                              </div>
                              {vehicle.plate}
                            </div>
                          </TableCell>
                          <TableCell>{vehicle.driverDetails?.name || '-'}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{fuelPct.toFixed(0)}%</span>
                              </div>
                              <Progress 
                                value={fuelPct} 
                                className="h-2" 
                                indicatorClassName={isLow ? "bg-red-500" : fuelPct < 40 ? "bg-amber-500" : "bg-green-500"} 
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold">{fuel.toFixed(1)} L</TableCell>
                          <TableCell className="text-right">{formatCurrency(fuel * pricePerLiter)}</TableCell>
                          <TableCell className="text-right">{vehicle.distanceMonth?.toLocaleString()} km</TableCell>
                          <TableCell className="text-center">
                            {isLow ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Critique
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Normal
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-xs text-muted-foreground text-center">
              Affichage de {filteredVehicles.length} véhicules sur {vehiclesWithFuel.length} équipés de capteurs
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
