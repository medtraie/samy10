import { useChantiers, useDeleteChantier } from '@/hooks/useTransportBTP';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Phone, User, Trash2, Loader2 } from 'lucide-react';
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
  const { data: chantiers = [], isLoading } = useChantiers();
  const deleteChantier = useDeleteChantier();

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
          <h2 className="text-xl font-semibold">Chantiers & Carrières</h2>
          <p className="text-sm text-muted-foreground">
            {chantiers.length} site(s) enregistré(s)
          </p>
        </div>
        <ChantierForm />
      </div>

      {chantiers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun site enregistré</p>
            <p className="text-sm text-muted-foreground">Ajoutez votre premier chantier ou carrière</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chantiers.map((chantier) => (
            <Card key={chantier.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{chantier.name}</CardTitle>
                      <Badge variant={chantier.type === 'carriere' ? 'secondary' : 'outline'} className="mt-1">
                        {chantier.type === 'carriere' ? 'Carrière' : 'Chantier'}
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
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
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
          ))}
        </div>
      )}
    </div>
  );
}
