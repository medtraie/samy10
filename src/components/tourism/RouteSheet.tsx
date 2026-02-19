import { useState } from 'react';
import { useTourismMissions, useCreateTourismWaypoint, useDeleteTourismWaypoint, TourismMission, TourismWaypoint } from '@/hooks/useTourism';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, MapPin, Clock, Plus, Trash2, User, Truck, Users, 
  Phone, Calendar, Printer, Download, Route as RouteIcon 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';

export function RouteSheet() {
  const { data: missions, isLoading } = useTourismMissions();
  const [selectedMission, setSelectedMission] = useState<TourismMission | null>(null);

  // Only show dispatched/in_progress missions
  const activeMissions = missions?.filter(m => 
    m.status === 'dispatched' || m.status === 'in_progress'
  ) || [];

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Mission selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Feuilles de route
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeMissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <RouteIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune mission active</p>
              <p className="text-sm">Dispatchez une mission pour générer sa feuille de route</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeMissions.map((mission) => (
                <MissionRouteCard
                  key={mission.id}
                  mission={mission}
                  onSelect={() => setSelectedMission(mission)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Sheet Detail */}
      {selectedMission && (
        <RouteSheetDetail
          mission={selectedMission}
          onClose={() => setSelectedMission(null)}
        />
      )}
    </div>
  );
}

interface MissionRouteCardProps {
  mission: TourismMission;
  onSelect: () => void;
}

function MissionRouteCard({ mission, onSelect }: MissionRouteCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelect}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className="font-mono text-xs">
            {mission.reference}
          </Badge>
          <Badge className={mission.status === 'dispatched' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'}>
            {mission.status === 'dispatched' ? 'Prête' : 'En cours'}
          </Badge>
        </div>
        <h3 className="font-medium truncate mb-2">{mission.title}</h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(new Date(mission.start_date), 'dd MMM yyyy', { locale: fr })}
          </div>
          {mission.driver && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {mission.driver.name}
            </div>
          )}
          {mission.vehicle_id && (
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              {mission.vehicle_id}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RouteSheetDetailProps {
  mission: TourismMission;
  onClose: () => void;
}

function RouteSheetDetail({ mission, onClose }: RouteSheetDetailProps) {
  const createWaypoint = useCreateTourismWaypoint();
  const deleteWaypoint = useDeleteTourismWaypoint();
  const [showAddWaypoint, setShowAddWaypoint] = useState(false);
  const [newWaypoint, setNewWaypoint] = useState({
    location_name: '',
    address: '',
    planned_arrival: '',
    planned_departure: '',
    notes: '',
  });

  const waypoints = mission.waypoints?.sort((a, b) => a.sequence_order - b.sequence_order) || [];

  const handleAddWaypoint = async () => {
    await createWaypoint.mutateAsync({
      mission_id: mission.id,
      sequence_order: waypoints.length + 1,
      location_name: newWaypoint.location_name,
      address: newWaypoint.address || null,
      planned_arrival: newWaypoint.planned_arrival || null,
      planned_departure: newWaypoint.planned_departure || null,
      notes: newWaypoint.notes || null,
      gps_lat: null,
      gps_lng: null,
      actual_arrival: null,
      actual_departure: null,
      distance_from_previous_km: null,
      duration_from_previous_minutes: null,
    });
    setNewWaypoint({ location_name: '', address: '', planned_arrival: '', planned_departure: '', notes: '' });
    setShowAddWaypoint(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="print:shadow-none">
      <CardHeader className="print:border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Feuille de Route - {mission.reference}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{mission.title}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" />
              Imprimer
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mission Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Date</p>
            <p className="font-medium">
              {format(new Date(mission.start_date), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Heure</p>
            <p className="font-medium">
              {mission.start_time?.substring(0, 5) || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Véhicule</p>
            <p className="font-medium">{mission.vehicle_id || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Chauffeur</p>
            <p className="font-medium">{mission.driver?.name || '-'}</p>
          </div>
        </div>

        {/* Client Info */}
        {mission.client && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              Informations Client
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nom:</span>{' '}
                <span className="font-medium">{mission.client.name}</span>
              </div>
              {mission.client.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span>{mission.client.phone}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Passagers:</span>{' '}
                <span className="font-medium">{mission.passengers_count}</span>
              </div>
            </div>
          </div>
        )}

        {/* Itinerary */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium flex items-center gap-2">
              <RouteIcon className="w-4 h-4" />
              Itinéraire
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddWaypoint(true)}
              className="print:hidden"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter étape
            </Button>
          </div>

          {/* Pickup */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Point de départ</p>
              <p className="text-sm text-muted-foreground">{mission.pickup_location || 'Non défini'}</p>
              {mission.start_time && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {mission.start_time.substring(0, 5)}
                </p>
              )}
            </div>
          </div>

          {/* Waypoints */}
          {waypoints.map((wp, idx) => (
            <div key={wp.id} className="flex items-start gap-3 mb-4 pl-4 border-l-2 border-dashed ml-4">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 -ml-[16px]">
                <span className="text-xs font-medium text-blue-600">{idx + 1}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{wp.location_name}</p>
                    {wp.address && <p className="text-sm text-muted-foreground">{wp.address}</p>}
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {wp.planned_arrival && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Arrivée: {wp.planned_arrival.substring(0, 5)}
                        </span>
                      )}
                      {wp.planned_departure && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Départ: {wp.planned_departure.substring(0, 5)}
                        </span>
                      )}
                    </div>
                    {wp.notes && <p className="text-xs italic mt-1">{wp.notes}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 print:hidden"
                    onClick={() => deleteWaypoint.mutate(wp.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Dropoff */}
          <div className="flex items-start gap-3 pl-4 border-l-2 border-dashed ml-4">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 -ml-[16px]">
              <MapPin className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-medium">Point d'arrivée</p>
              <p className="text-sm text-muted-foreground">{mission.dropoff_location || 'Non défini'}</p>
              {mission.end_time && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {mission.end_time.substring(0, 5)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Driver Instructions */}
        {mission.driver_instructions && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Instructions Chauffeur</h4>
            <p className="text-sm text-yellow-700">{mission.driver_instructions}</p>
          </div>
        )}

        {/* Add Waypoint Dialog */}
        <Dialog open={showAddWaypoint} onOpenChange={setShowAddWaypoint}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une étape</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nom du lieu *</label>
                <Input
                  value={newWaypoint.location_name}
                  onChange={(e) => setNewWaypoint(prev => ({ ...prev, location_name: e.target.value }))}
                  placeholder="Ex: Restaurant Le Jardin"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Adresse</label>
                <Input
                  value={newWaypoint.address}
                  onChange={(e) => setNewWaypoint(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Adresse complète"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Heure d'arrivée</label>
                  <Input
                    type="time"
                    value={newWaypoint.planned_arrival}
                    onChange={(e) => setNewWaypoint(prev => ({ ...prev, planned_arrival: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Heure de départ</label>
                  <Input
                    type="time"
                    value={newWaypoint.planned_departure}
                    onChange={(e) => setNewWaypoint(prev => ({ ...prev, planned_departure: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={newWaypoint.notes}
                  onChange={(e) => setNewWaypoint(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes pour cette étape..."
                />
              </div>
              <Button 
                onClick={handleAddWaypoint} 
                disabled={!newWaypoint.location_name || createWaypoint.isPending}
                className="w-full"
              >
                Ajouter l'étape
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
