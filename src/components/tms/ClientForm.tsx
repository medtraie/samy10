import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateTMSClient } from '@/hooks/useTMS';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

interface FormData {
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  ice: string;
  notes: string;
}

export function ClientForm() {
  const [open, setOpen] = useState(false);
  const createClient = useCreateTMSClient();
  const { register, handleSubmit, reset } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    await createClient.mutateAsync({
      name: data.name,
      company: data.company || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      ice: data.ice || null,
      notes: data.notes || null,
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> Nouveau client (TMS)</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input {...register('name', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Société</Label>
              <Input {...register('company')} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input {...register('city')} />
            </div>
            <div className="space-y-2">
              <Label>ICE</Label>
              <Input {...register('ice')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input {...register('address')} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register('notes')} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={createClient.isPending}>Créer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
