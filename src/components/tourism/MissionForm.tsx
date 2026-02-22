import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTourismMission, useTourismClients, generateMissionReference } from '@/hooks/useTourism';
import { useCreateDriver, useDrivers } from '@/hooks/useDrivers';
import { useGPSwoxData } from '@/hooks/useGPSwoxVehicles';
import { useGPSwoxGeofences } from '@/hooks/useGPSwoxGeofences';
import { Calendar, MapPin, Users, Clock, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

const formSchema = z.object({
  title: z.string().min(2, 'Le titre est requis'),
  mission_type: z.enum(['transfer', 'excursion', 'circuit', 'rental']),
  client_id: z.string().optional(),
  vehicle_id: z.string().optional(),
  driver_id: z.string().optional(),
  passengers_count: z.number().min(1).default(1),
  start_date: z.string().min(1, 'Date de début requise'),
  end_date: z.string().min(1, 'Date de fin requise'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  pickup_location: z.string().optional(),
  dropoff_location: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  description: z.string().optional(),
  driver_instructions: z.string().optional(),
});

interface MissionFormProps {
  onSuccess?: () => void;
}

export function MissionForm({ onSuccess }: MissionFormProps) {
  const createMission = useCreateTourismMission();
  const { data: clients } = useTourismClients();
  const { data: drivers } = useDrivers();
  const createDriver = useCreateDriver();
  const { data: gpswoxData } = useGPSwoxData();
  const vehicles = gpswoxData?.vehicles || [];
  const gpswoxDrivers = gpswoxData?.drivers || [];
  const { data: geofences } = useGPSwoxGeofences();
  const [pickupMode, setPickupMode] = useState<'select' | 'input'>('select');
  const [dropoffMode, setDropoffMode] = useState<'select' | 'input'>('select');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      mission_type: 'transfer',
      passengers_count: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      priority: 'normal',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const resolveDriverId = async () => {
      if (!values.driver_id || values.driver_id === 'none') return null;
      if (!values.driver_id.startsWith('gpswox:')) return values.driver_id;
      const gpswoxId = values.driver_id.replace('gpswox:', '');
      const gpswoxDriver = gpswoxDrivers.find((d) => String(d.id) === gpswoxId);
      if (!gpswoxDriver) return null;
      const created = await createDriver.mutateAsync({
        name: gpswoxDriver.name,
        phone: gpswoxDriver.phone || '',
        license_type: 'GPSwox',
        license_expiry: '2099-12-31',
        status: 'available',
        vehicle_id: gpswoxDriver.deviceId ? String(gpswoxDriver.deviceId) : null,
      });
      return created.id;
    };

    const driverId = await resolveDriverId();

    await createMission.mutateAsync({
      reference: generateMissionReference(),
      title: values.title,
      mission_type: values.mission_type,
      client_id: values.client_id || null,
      vehicle_id: values.vehicle_id || null,
      driver_id: driverId,
      passengers_count: values.passengers_count,
      start_date: values.start_date,
      end_date: values.end_date,
      start_time: values.start_time || null,
      end_time: values.end_time || null,
      pickup_location: values.pickup_location || null,
      dropoff_location: values.dropoff_location || null,
      priority: values.priority,
      status: 'planned',
      description: values.description || null,
      driver_instructions: values.driver_instructions || null,
      notes: null,
    });
    form.reset();
    onSuccess?.();
  };

  const missionTypes = [
    { value: 'transfer', label: 'Transfert Aéroport/Hôtel' },
    { value: 'excursion', label: 'Excursion Journalière' },
    { value: 'circuit', label: 'Circuit Multi-jours' },
    { value: 'rental', label: 'Location avec Chauffeur' },
  ];

  const priorities = [
    { value: 'low', label: 'Basse' },
    { value: 'normal', label: 'Normale' },
    { value: 'high', label: 'Haute' },
    { value: 'urgent', label: 'Urgente' },
  ];

  const localDriverNames = new Set(drivers?.map((driver) => driver.name.toLowerCase()));
  const selectableDrivers = [
    ...(drivers || []).map((driver) => ({ id: driver.id, name: driver.name, source: 'local' as const })),
    ...gpswoxDrivers
      .filter((driver) => !localDriverNames.has(driver.name.toLowerCase()))
      .map((driver) => ({
        id: `gpswox:${driver.id}`,
        name: driver.name,
        source: 'gpswox' as const,
      })),
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Titre de la mission *
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Transfert Aéroport Mohammed V" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mission_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de mission *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Type de mission" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {missionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passengers_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Nombre de passagers
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date de début *
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date de fin *
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Heure de départ
                </FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Heure de fin
                </FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pickup_location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Lieu de prise en charge
                </FormLabel>
                <Tabs value={pickupMode} onValueChange={(v) => setPickupMode(v as 'select' | 'input')}>
                  <TabsList className="grid grid-cols-2 w-full mb-2">
                    <TabsTrigger value="select">Sélectionner un lieu</TabsTrigger>
                    <TabsTrigger value="input">Taper un lieu</TabsTrigger>
                  </TabsList>
                  <TabsContent value="select">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un lieu" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {geofences?.map((geofence) => (
                          <SelectItem key={geofence.id} value={geofence.name}>
                            {geofence.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="input">
                    <FormControl>
                      <Input placeholder="Saisir un lieu..." value={field.value || ''} onChange={(e) => field.onChange(e.target.value)} />
                    </FormControl>
                  </TabsContent>
                </Tabs>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dropoff_location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Lieu de destination
                </FormLabel>
                <Tabs value={dropoffMode} onValueChange={(v) => setDropoffMode(v as 'select' | 'input')}>
                  <TabsList className="grid grid-cols-2 w-full mb-2">
                    <TabsTrigger value="select">Sélectionner un lieu</TabsTrigger>
                    <TabsTrigger value="input">Taper un lieu</TabsTrigger>
                  </TabsList>
                  <TabsContent value="select">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un lieu" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {geofences?.map((geofence) => (
                          <SelectItem key={geofence.id} value={geofence.name}>
                            {geofence.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="input">
                    <FormControl>
                      <Input placeholder="Saisir un lieu..." value={field.value || ''} onChange={(e) => field.onChange(e.target.value)} />
                    </FormControl>
                  </TabsContent>
                </Tabs>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vehicle_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Véhicule</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un véhicule" />
                    </SelectTrigger>
                  </FormControl>
                <SelectContent>
                    {vehicles?.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.plate}>
                        {vehicle.plate} - {vehicle.brand} {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="driver_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chauffeur</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un chauffeur" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectableDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}{driver.source === 'gpswox' ? ' (GPSwox)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priorité</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description de la mission..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="driver_instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions pour le chauffeur</FormLabel>
              <FormControl>
                <Textarea placeholder="Instructions spéciales pour le chauffeur..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createMission.isPending} className="w-full">
          {createMission.isPending ? 'Création...' : 'Créer la mission'}
        </Button>
      </form>
    </Form>
  );
}
