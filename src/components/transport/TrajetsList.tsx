import { useTrajets, useDeleteTrajet } from '@/hooks/useTransportBTP';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Route, ArrowRight, Trash2, Loader2 } from 'lucide-react';
import { TrajetForm } from './TrajetForm';
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

export function TrajetsList() {
  const { data: trajets = [], isLoading } = useTrajets();
  const deleteTrajet = useDeleteTrajet();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Trajets</h2>
          <p className="text-sm text-muted-foreground">
            {trajets.length} trajet(s) configuré(s)
          </p>
        </div>
        <TrajetForm />
      </div>

      {trajets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Route className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun trajet configuré</p>
            <p className="text-sm text-muted-foreground">Créez des trajets pour faciliter l'enregistrement des voyages</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trajets.map((trajet) => (
            <Card key={trajet.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                      <Route className="w-5 h-5 text-info" />
                    </div>
                    <CardTitle className="text-base">{trajet.name}</CardTitle>
                  </div>
                  <Badge variant={trajet.status === 'active' ? 'default' : 'secondary'}>
                    {trajet.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground truncate">
                    {trajet.origin_chantier?.name || 'Non défini'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground truncate">
                    {trajet.destination_chantier?.name || 'Non défini'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {trajet.distance_km && (
                    <div>
                      <span className="text-muted-foreground">Distance:</span>
                      <p className="font-medium">{trajet.distance_km} km</p>
                    </div>
                  )}
                  {trajet.estimated_duration_minutes && (
                    <div>
                      <span className="text-muted-foreground">Durée:</span>
                      <p className="font-medium">{trajet.estimated_duration_minutes} min</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div>
                    <span className="text-muted-foreground">Prix/tonne:</span>
                    <p className="font-semibold text-primary">{trajet.price_per_ton} MAD</p>
                  </div>
                  {trajet.price_per_trip > 0 && (
                    <div>
                      <span className="text-muted-foreground">Prix/voyage:</span>
                      <p className="font-semibold">{trajet.price_per_trip} MAD</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce trajet ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Le trajet "{trajet.name}" sera supprimé définitivement.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteTrajet.mutate(trajet.id)}
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
          ))}
        </div>
      )}
    </div>
  );
}
