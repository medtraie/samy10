import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MissionCard } from '@/components/missions/MissionCard';
import { MissionForm } from '@/components/missions/MissionForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { useMissions, useCreateMission, useUpdateMission, useDeleteMission, Mission as DBMission } from '@/hooks/useMissions';
import { toast } from '@/hooks/use-toast';

const statusFilters = [
  { value: 'all', label: 'Toutes', icon: FileText },
  { value: 'in_progress', label: 'En cours', icon: Truck },
  { value: 'pending', label: 'Planifiées', icon: Clock },
  { value: 'completed', label: 'Livrées', icon: CheckCircle },
  { value: 'cancelled', label: 'Annulées', icon: XCircle },
];

// Map DB mission to card format
interface MissionCardData {
  id: string;
  reference: string;
  client: string;
  origin: string;
  destination: string;
  status: 'planned' | 'in_progress' | 'delivered' | 'cancelled';
  vehicleId: string;
  driverId: string;
  departureDate: string;
  estimatedArrival: string;
  cargo: string;
  weight: number;
}

function mapDBToCard(m: DBMission): MissionCardData {
  const statusMap: Record<string, 'planned' | 'in_progress' | 'delivered' | 'cancelled'> = {
    pending: 'planned',
    in_progress: 'in_progress',
    completed: 'delivered',
    cancelled: 'cancelled',
  };
  return {
    id: m.id,
    reference: `MIS-${m.id.substring(0, 8).toUpperCase()}`,
    client: m.notes || 'Client',
    origin: m.departure_zone,
    destination: m.arrival_zone,
    status: statusMap[m.status] || 'planned',
    vehicleId: m.vehicle_id,
    driverId: m.driver_id || '',
    departureDate: m.mission_date,
    estimatedArrival: m.mission_date,
    cargo: 'Marchandise',
    weight: 1000,
  };
}

export default function Missions() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<MissionCardData | undefined>();

  const { data: missions = [], isLoading, refetch } = useMissions();
  const createMission = useCreateMission();
  const updateMission = useUpdateMission();
  const deleteMission = useDeleteMission();

  const mappedMissions = missions.map(mapDBToCard);

  const filteredMissions = mappedMissions.filter((mission) => {
    const matchesSearch =
      mission.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    const dbStatusMap: Record<string, string> = {
      planned: 'pending',
      in_progress: 'in_progress',
      delivered: 'completed',
      cancelled: 'cancelled',
    };
    const dbStatus = Object.entries(dbStatusMap).find(([card]) => card === mission.status)?.[1] || mission.status;
    const matchesStatus = statusFilter === 'all' || dbStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: mappedMissions.length,
    inProgress: mappedMissions.filter(m => m.status === 'in_progress').length,
    planned: mappedMissions.filter(m => m.status === 'planned').length,
    delivered: mappedMissions.filter(m => m.status === 'delivered').length,
    totalWeight: mappedMissions.filter(m => m.status !== 'cancelled').reduce((acc, m) => acc + m.weight, 0),
  };

  const handleView = (mission: MissionCardData) => {
    setSelectedMission(mission);
    setFormOpen(true);
  };

  const handleEdit = (mission: MissionCardData) => {
    setSelectedMission(mission);
    setFormOpen(true);
  };

  const handleStatusChange = (mission: MissionCardData, newStatus: 'delivered' | 'cancelled') => {
    const dbStatusMap: Record<string, 'pending' | 'in_progress' | 'completed' | 'cancelled'> = {
      delivered: 'completed',
      cancelled: 'cancelled',
    };
    updateMission.mutate({
      id: mission.id,
      status: dbStatusMap[newStatus],
    });
  };

  const handleFormSubmit = (data: any) => {
    if (selectedMission) {
      updateMission.mutate({
        id: selectedMission.id,
        departure_zone: data.origin,
        arrival_zone: data.destination,
        mission_date: data.departureDate,
        vehicle_id: data.vehicleId,
        driver_id: data.driverId || null,
        notes: data.client,
      }, {
        onSuccess: () => refetch(),
      });
    } else {
      createMission.mutate({
        departure_zone: data.origin,
        arrival_zone: data.destination,
        mission_date: data.departureDate,
        vehicle_id: data.vehicleId,
        driver_id: data.driverId || null,
        notes: data.client,
        status: 'pending',
      }, {
        onSuccess: () => refetch(),
      });
    }
    setSelectedMission(undefined);
  };

  const handleDelete = (mission: MissionCardData) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
      deleteMission.mutate(mission.id, {
        onSuccess: () => refetch(),
      });
    }
  };

  const openNewMissionForm = () => {
    setSelectedMission(undefined);
    setFormOpen(true);
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('nav.missions')}</h1>
            <p className="text-muted-foreground">Gestion des missions de transport</p>
          </div>
          <Button onClick={openNewMissionForm} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle mission
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Truck className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.planned}</p>
                  <p className="text-xs text-muted-foreground">Planifiées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.delivered}</p>
                  <p className="text-xs text-muted-foreground">Livrées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{(stats.totalWeight / 1000).toFixed(1)}t</p>
                  <p className="text-xs text-muted-foreground">Tonnage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une mission..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              {statusFilters.map((filter) => (
                <TabsTrigger key={filter.value} value={filter.value} className="gap-2">
                  <filter.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{filter.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Missions Grid */}
        {filteredMissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-1">Aucune mission trouvée</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Créez votre première mission de transport'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onView={handleView}
                onEdit={handleEdit}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Mission Form Dialog */}
        <MissionForm
          open={formOpen}
          onOpenChange={setFormOpen}
          mission={selectedMission}
          onSubmit={handleFormSubmit}
        />
      </div>
    </DashboardLayout>
  );
}
