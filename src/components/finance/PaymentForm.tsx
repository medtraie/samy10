import { useForm } from 'react-hook-form';
import { usePaymentMutation, useCashRegisters, useBankAccounts, PaymentInsert } from '@/hooks/useFinance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CashRegisterForm } from './CashRegisterForm';
import { useState } from 'react';

const formSchema = z.object({
  payment_type: z.enum(['income', 'expense']),
  payment_method: z.enum(['cash', 'check', 'transfer', 'virement']),
  amount: z.coerce.number().min(0.01, 'Le montant doit être supérieur à 0'),
  payment_date: z.string().min(1, 'Date requise'),
  entity_name: z.string().min(1, 'Nom du client/fournisseur requis'),
  reference_number: z.string().optional(),
  cash_register_id: z.string().optional(),
  bank_account_id: z.string().optional(),
  notes: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof formSchema>;

interface PaymentFormProps {
  onSuccess: () => void;
  initialValues?: Partial<PaymentFormValues>;
}

export function PaymentForm({ onSuccess, initialValues }: PaymentFormProps) {
  const { createPayment } = usePaymentMutation();
  const { data: cashRegisters = [] } = useCashRegisters();
  const { data: bankAccounts = [] } = useBankAccounts();
  const [isAddCaisseOpen, setIsAddCaisseOpen] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payment_type: 'expense',
      payment_method: 'cash',
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      entity_name: '',
      reference_number: '',
      notes: '',
      ...(initialValues || {}),
    },
  });

  const paymentMethod = form.watch('payment_method');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createPayment.mutateAsync(values as PaymentInsert);
      onSuccess();
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="payment_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de règlement</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="income">Encaissement (Client)</SelectItem>
                    <SelectItem value="expense">Décaissement (Fournisseur)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="entity_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client / Fournisseur</FormLabel>
              <FormControl>
                <Input placeholder="Nom de l'entité" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Montant</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mode de paiement</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="check">Chèque</SelectItem>
                    <SelectItem value="transfer">Virement</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {paymentMethod === 'cash' ? (
          <FormField
            control={form.control}
            name="cash_register_id"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Caisse</FormLabel>
                  <Dialog open={isAddCaisseOpen} onOpenChange={setIsAddCaisseOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Nouvelle Caisse
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter une caisse</DialogTitle>
                      </DialogHeader>
                      <CashRegisterForm onSuccess={() => setIsAddCaisseOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={cashRegisters.length === 0 ? "Aucune caisse disponible" : "Sélectionner la caisse"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cashRegisters.map((reg) => (
                      <SelectItem key={reg.id} value={reg.id}>{reg.name} ({reg.current_balance} {reg.currency})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="bank_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compte Bancaire</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le compte" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bankAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="reference_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Référence (N° Chèque / Virement)</FormLabel>
              <FormControl>
                <Input placeholder="Optionnel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={createPayment.isPending}>
            {createPayment.isPending ? 'Enregistrement...' : 'Enregistrer le règlement'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
