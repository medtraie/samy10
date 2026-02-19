import { useTourismMissions, useDeleteTourismMission, useUpdateTourismMission, TourismMission } from '@/hooks/useTourism';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, MapPin, Users, Clock, Trash2, User, Truck, 
  Plane, Mountain, Route, Car, AlertCircle 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function MissionsList() {
  const { data: missions, isLoading } = useTourismMissions();
  const deleteMission = useDeleteTourismMission();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!missions?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Aucune mission planifiée</p>
        <p className="text-sm">Créez votre première mission touristique</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {missions.map((mission) => (
        <MissionCard 
          key={mission.id} 
          mission={mission} 
          onDelete={() => deleteMission.mutate(mission.id)} 
        />
      ))}
    </div>
  );
}

interface MissionCardProps {
  mission: TourismMission;
  onDelete: () => void;
}

function MissionCard({ mission, onDelete }: MissionCardProps) {
  const updateMission = useUpdateTourismMission();

  const statusConfig: Record<string, { label: string; className: string }> = {
    planned: { label: 'Planifiée', className: 'bg-blue-100 text-blue-800' },
    dispatched: { label: 'Dispatchée', className: 'bg-purple-100 text-purple-800' },
    in_progress: { label: 'En cours', className: 'bg-yellow-100 text-yellow-800' },
    completed: { label: 'Terminée', className: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
  };

  const typeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    transfer: { label: 'Transfert', icon: <Plane className="w-4 h-4" /> },
    excursion: { label: 'Excursion', icon: <Mountain className="w-4 h-4" /> },
    circuit: { label: 'Circuit', icon: <Route className="w-4 h-4" /> },
    rental: { label: 'Location', icon: <Car className="w-4 h-4" /> },
  };

  const priorityConfig: Record<string, { label: string; className: string }> = {
    low: { label: 'Basse', className: 'text-gray-500' },
    normal: { label: 'Normale', className: 'text-blue-500' },
    high: { label: 'Haute', className: 'text-orange-500' },
    urgent: { label: 'Urgente', className: 'text-red-500' },
  };

  const status = statusConfig[mission.status] || statusConfig.planned;
  const type = typeConfig[mission.mission_type] || typeConfig.transfer;
  const priority = priorityConfig[mission.priority] || priorityConfig.normal;

  const handleStatusChange = (newStatus: TourismMission['status']) => {
    updateMission.mutate({ id: mission.id, status: newStatus });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {mission.reference}
              </Badge>
              <Badge className={cn('text-xs', status.className)}>
                {status.label}
              </Badge>
              {mission.priority !== 'normal' && (
                <Badge variant="outline" className={cn('text-xs', priority.className)}>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {priority.label}
                </Badge>
              )}
            </div>
            <CardTitle className="text-base flex items-center gap-2">
              {type.icon}
              {mission.title}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(mission.start_date), 'dd MMM', { locale: fr })}
              {mission.start_date !== mission.end_date && (
                <> - {format(new Date(mission.end_date), 'dd MMM', { locale: fr })}</>
              )}
            </span>
          </div>
          {mission.start_time && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{mission.start_time.substring(0, 5)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{mission.passengers_count} passager(s)</span>
          </div>
          {mission.client && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="truncate">{mission.client.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-green-500" />
          <span className="text-muted-foreground">{mission.pickup_location || 'Non défini'}</span>
          <span className="text-muted-foreground">→</span>
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="text-muted-foreground">{mission.dropoff_location || 'Non défini'}</span>
        </div>

        {(mission.vehicle_id || mission.driver) && (
          <div className="flex items-center gap-4 text-sm">
            {mission.vehicle_id && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="w-4 h-4" />
                <span>{mission.vehicle_id}</span>
              </div>
            )}
            {mission.driver && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{mission.driver.name}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {mission.status === 'planned' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange('dispatched')}>
              Dispatcher
            </Button>
          )}
          {mission.status === 'dispatched' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange('in_progress')}>
              Démarrer
            </Button>
          )}
          {mission.status === 'in_progress' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange('completed')}>
              Terminer
            </Button>
          )}
          {mission.status !== 'cancelled' && mission.status !== 'completed' && (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleStatusChange('cancelled')}>
              Annuler
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
