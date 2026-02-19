import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mission } from '@/lib/mock-data';
import { useGPSwoxVehicles } from '@/hooks/useGPSwoxVehicles';
import { useDrivers } from '@/hooks/useDrivers';
import { useGPSwoxGeofences } from '@/hooks/useGPSwoxGeofences';

const missionSchema = z.object({
  client: z.string().min(1, 'Client requis'),
  origin: z.string().min(1, 'Origine requise'),
  destination: z.string().min(1, 'Destination requise'),
  departureDate: z.string().min(1, 'Date de départ requise'),
  departureTime: z.string().min(1, 'Heure de départ requise'),
  estimatedArrivalTime: z.string().min(1, 'Heure d\'arrivée estimée requise'),
  vehicleId: z.string().min(1, 'Véhicule requis'),
  driverId: z.string().min(1, 'Chauffeur requis'),
  cargo: z.string().min(1, 'Description cargaison requise'),
  weight: z.coerce.number().min(1, 'Poids requis'),
  notes: z.string().optional(),
});

type MissionFormData = z.infer<typeof missionSchema>;

interface MissionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mission?: Mission;
  onSubmit: (data: MissionFormData) => void;
}

export function MissionForm({ open, onOpenChange, mission, onSubmit }: MissionFormProps) {
  const isEditing = !!mission;
  
  const form = useForm<MissionFormData>({
    resolver: zodResolver(missionSchema),
    defaultValues: mission ? {
      client: mission.client,
      origin: mission.origin,
      destination: mission.destination,
      departureDate: mission.departureDate.split('T')[0],
      departureTime: mission.departureDate.split('T')[1]?.substring(0, 5) || '08:00',
      estimatedArrivalTime: mission.estimatedArrival.split('T')[1]?.substring(0, 5) || '12:00',
      vehicleId: mission.vehicleId,
      driverId: mission.driverId,
      cargo: mission.cargo,
      weight: mission.weight,
      notes: '',
    } : {
      client: '',
      origin: '',
      destination: '',
      departureDate: new Date().toISOString().split('T')[0],
      departureTime: '08:00',
      estimatedArrivalTime: '12:00',
      vehicleId: '',
      driverId: '',
      cargo: '',
      weight: 0,
      notes: '',
    },
  });

  // Fetch real vehicles from GPSwox
  const { data: gpswoxVehicles = [], isLoading: vehiclesLoading } = useGPSwoxVehicles();
  // Fetch real drivers from database
  const { data: drivers = [], isLoading: driversLoading } = useDrivers();
  const availableDrivers = drivers.filter(d => d.status === 'available' || d.status === 'on_mission');
  // Fetch geofences from GPSwox
  const { data: geofences = [], isLoading: geofencesLoading } = useGPSwoxGeofences();

  const handleSubmit = (data: MissionFormData) => {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la mission' : 'Nouvelle mission'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom du client" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      Origine
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={geofencesLoading}>
                      <FormControl>
                        <SelectTrigger>
                          {geofencesLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Chargement...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Sélectionner une zone" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {geofences.map((geofence) => (
                          <SelectItem key={geofence.id} value={geofence.name}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full border" 
                                style={{ backgroundColor: geofence.color || '#10b981' }}
                              />
                              {geofence.name}
                            </div>
                          </SelectItem>
                        ))}
                        {!geofencesLoading && geofences.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Aucune géo-clôture disponible
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-destructive" />
                      Destination
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={geofencesLoading}>
                      <FormControl>
                        <SelectTrigger>
                          {geofencesLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Chargement...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Sélectionner une zone" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {geofences.map((geofence) => (
                          <SelectItem key={geofence.id} value={geofence.name}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full border" 
                                style={{ backgroundColor: geofence.color || '#10b981' }}
                              />
                              {geofence.name}
                            </div>
                          </SelectItem>
                        ))}
                        {!geofencesLoading && geofences.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Aucune géo-clôture disponible
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date départ</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departureTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure départ</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimatedArrivalTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arrivée estimée</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Véhicule</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={vehiclesLoading}>
                      <FormControl>
                        <SelectTrigger>
                          {vehiclesLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Chargement...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Sélectionner un véhicule" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gpswoxVehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                            {vehicle.plate} - {vehicle.brand} {vehicle.model}
                          </SelectItem>
                        ))}
                        {!vehiclesLoading && gpswoxVehicles.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Aucun véhicule disponible
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="driverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chauffeur</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={driversLoading}>
                      <FormControl>
                        <SelectTrigger>
                          {driversLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Chargement...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Sélectionner un chauffeur" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableDrivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name} - Permis {driver.license_type}
                          </SelectItem>
                        ))}
                        {!driversLoading && availableDrivers.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Aucun chauffeur disponible
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description cargaison</FormLabel>
                    <FormControl>
                      <Input placeholder="Type de marchandise" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poids (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Instructions spéciales, remarques..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {isEditing ? 'Mettre à jour' : 'Créer la mission'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
