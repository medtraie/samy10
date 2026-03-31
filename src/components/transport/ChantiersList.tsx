import { useMemo, useState } from 'react';
import { useChantiers, useDeleteChantier, useSyncGeofencesToChantiers, useVoyages, useTrajets, useCreateTrajet } from '@/hooks/useTransportBTP';
import { useGPSwoxGeofences } from '@/hooks/useGPSwoxGeofences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Phone, User, Trash2, Loader2, Target, RefreshCw, Link2, Sparkles } from 'lucide-react';
import { ChantierForm } from './ChantierForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function ChantiersList() {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [createdSuggestionKeys, setCreatedSuggestionKeys] = useState<Set<string>>(new Set());
  const { data: chantiers = [], isLoading: chantiersLoading } = useChantiers();
  const { data: trajets = [] } = useTrajets();
  const { data: voyages = [] } = useVoyages();
  const { data: geofences = [], isLoading: geofencesLoading, refetch: refetchGeofences } = useGPSwoxGeofences();
  const deleteChantier = useDeleteChantier();
  const syncGeofences = useSyncGeofencesToChantiers();
  const createTrajet = useCreateTrajet();

  const isLoading = chantiersLoading || geofencesLoading;
  const chantierById = useMemo(() => new Map(chantiers.map((c) => [c.id, c])), [chantiers]);
  const trajetPairSet = useMemo(() => new Set(trajets
    .filter((t) => t.origin_chantier_id && t.destination_chantier_id)
    .map((t) => `${t.origin_chantier_id}|${t.destination_chantier_id}`)), [trajets]);

  const suggestions = useMemo(() => {
    const pairCounts = new Map<string, number>();

    voyages.forEach((voyage) => {
      const originId = voyage.trajet?.origin_chantier_id;
      const destinationId = voyage.trajet?.destination_chantier_id;
      if (!originId || !destinationId) return;
      const key = `${originId}|${destinationId}`;
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    });

    return Array.from(pairCounts.entries())
      .map(([pairKey, usageCount]) => {
        const [originId, destinationId] = pairKey.split('|');
        const origin = chantierById.get(originId);
        const destination = chantierById.get(destinationId);
        if (!origin || !destination) return null;
        return { pairKey, originId, destinationId, originName: origin.name, destinationName: destination.name, usageCount };
      })
      .filter((item): item is NonNullable<typeof item> => !!item)
      .filter((item) => !trajetPairSet.has(item.pairKey))
      .filter((item) => !createdSuggestionKeys.has(item.pairKey))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 8);
  }, [voyages, chantierById, trajetPairSet, createdSuggestionKeys]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const geofenceNames = new Set(geofences.map(g => g.name.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Zones & Chantiers</h2>
          <p className="text-sm text-muted-foreground">
            {chantiers.length} site(s) local(aux) • {geofences.length} zone(s) GPSwox
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => syncGeofences.mutate(geofences)}
            disabled={syncGeofences.isPending || geofencesLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncGeofences.isPending ? 'animate-spin' : ''}`} />
            Importer zones GPSwox
          </Button>
          <Button variant="ghost" onClick={() => refetchGeofences()} disabled={geofencesLoading}>
            Actualiser
          </Button>
          <Button
            variant="secondary"
            className="gap-2"
            disabled={syncGeofences.isPending || geofencesLoading}
            onClick={async () => {
              await syncGeofences.mutateAsync(geofences);
              setShowSuggestions(true);
            }}
          >
            <Link2 className="w-4 h-4" />
            Sync + Link trajets suggestions
          </Button>
          <ChantierForm />
        </div>
      </div>

      {showSuggestions && (
        <Card className="dashboard-panel border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Suggestions de trajets basées sur les zones les plus utilisées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune suggestion pour le moment. Les trajets existants couvrent déjà les zones les plus utilisées.</p>
            ) : (
              suggestions.map((item) => (
                <div key={item.pairKey} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{item.originName} → {item.destinationName}</p>
                    <p className="text-xs text-muted-foreground">{item.usageCount} voyage(s) détecté(s)</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => createTrajet.mutate({
                      name: `${item.originName} → ${item.destinationName}`,
                      origin_chantier_id: item.originId,
                      destination_chantier_id: item.destinationId,
                      distance_km: null,
                      estimated_duration_minutes: null,
                      price_per_ton: 0,
                      price_per_trip: 0,
                      status: 'active',
                      notes: 'suggested:gpswox',
                    }, {
                      onSuccess: () => {
                        setCreatedSuggestionKeys((prev) => new Set([...prev, item.pairKey]));
                      },
                    })}
                    disabled={createTrajet.isPending}
                  >
                    Créer trajet
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {chantiers.length === 0 && geofences.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune zone ou chantier enregistré</p>
            <p className="text-sm text-muted-foreground">Ajoutez votre premier chantier ou importez depuis GPSwox</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {geofences.map((geofence) => {
            const isImported = chantiers.some(c => c.name.toLowerCase() === geofence.name.toLowerCase());
            return (
              <Card key={`geo-${geofence.id}`} className={`relative border-l-4 border-l-primary/50 bg-primary/5`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base truncate max-w-[150px]" title={geofence.name}>
                          {geofence.name}
                        </CardTitle>
                        <Badge variant="outline" className="mt-1 bg-primary/10 text-primary border-primary/20">
                          Zone GPSwox
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={geofence.active ? 'default' : 'secondary'}>
                      {geofence.active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm pt-2">
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Synchronisé depuis GPSwox
                  </p>
                  {isImported && (
                    <p className="text-xs text-emerald-500 font-medium">✓ Utilisé dans vos trajets</p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {chantiers.map((chantier) => {
            const isFromGPSwox = geofenceNames.has(chantier.name.toLowerCase());
            if (isFromGPSwox) return null;

            return (
              <Card key={chantier.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base truncate max-w-[150px]" title={chantier.name}>
                          {chantier.name}
                        </CardTitle>
                        <Badge variant={chantier.type === 'carriere' ? 'secondary' : 'outline'} className="mt-1">
                          {chantier.type === 'carriere' ? 'Carrière' : 'Chantier Local'}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={chantier.status === 'active' ? 'default' : 'secondary'}>
                      {chantier.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {chantier.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{chantier.city}</span>
                    </div>
                  )}
                  {chantier.contact_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{chantier.contact_name}</span>
                    </div>
                  )}
                  {chantier.contact_phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{chantier.contact_phone}</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer ce site ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Le site "{chantier.name}" sera supprimé définitivement.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteChantier.mutate(chantier.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
