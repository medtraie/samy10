import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Construction, FileText, Loader2, Pencil, Plus, Receipt, ShoppingCart, Trash2, Truck } from 'lucide-react';
import { useForm, useFieldArray, type Control, type FieldArrayWithId } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  useCreateDeliveryNote,
  useCreatePurchaseOrder,
  useCreatePurchaseRequest,
  useCreateSupplierInvoice,
  useDeleteDeliveryNote,
  useDeletePurchaseOrder,
  useDeletePurchaseRequest,
  useDeleteSupplierInvoice,
  useDeliveryNotes,
  usePurchaseOrders,
  usePurchaseRequests,
  useSupplierInvoices,
  useUpdateDeliveryNote,
  useUpdatePurchaseOrder,
  useUpdatePurchaseRequest,
  useUpdateSupplierInvoice,
  type DeliveryNote,
  type PurchaseOrder,
  type PurchaseRequest,
  type SupplierInvoice,
} from '@/hooks/useAchats';

interface ComingSoonPageProps {
  title: string;
  description: string;
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Construction className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground max-w-md">{description}</p>
        </div>
      </div>
    </DashboardLayout>
  );
}



export function FinancePage() {
  const { t } = useTranslation();
  return (
    <ComingSoonPage
      title={t('nav.finance')}
      description="Système de Point de Vente pour la gestion des transactions. En cours de développement."
    />
  );
}

const itemSchema = z.object({
  description: z.string().min(1, 'Description requise'),
  quantity: z.coerce.number().min(0.01, 'Quantité requise'),
  unit: z.string().min(1, 'Unité requise'),
  unit_price: z.coerce.number().min(0, 'Prix requis'),
});

type ItemFormValues = z.infer<typeof itemSchema>;

const purchaseRequestSchema = z.object({
  request_number: z.string().min(1, 'Numéro requis'),
  requester_name: z.string().optional(),
  supplier_name: z.string().optional(),
  request_date: z.string().min(1, 'Date requise'),
  needed_date: z.string().optional(),
  status: z.string().min(1, 'Statut requis'),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Au moins un article'),
});

const purchaseOrderSchema = z.object({
  order_number: z.string().min(1, 'Numéro requis'),
  supplier_name: z.string().min(1, 'Fournisseur requis'),
  order_date: z.string().min(1, 'Date requise'),
  expected_delivery_date: z.string().optional(),
  status: z.string().min(1, 'Statut requis'),
  tax_rate: z.coerce.number().min(0),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Au moins un article'),
});

const deliveryNoteSchema = z.object({
  delivery_number: z.string().min(1, 'Numéro requis'),
  supplier_name: z.string().min(1, 'Fournisseur requis'),
  order_number: z.string().optional(),
  delivery_date: z.string().min(1, 'Date requise'),
  status: z.string().min(1, 'Statut requis'),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Au moins un article'),
});

const supplierInvoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Numéro requis'),
  supplier_name: z.string().min(1, 'Fournisseur requis'),
  invoice_date: z.string().min(1, 'Date requise'),
  due_date: z.string().optional(),
  status: z.string().min(1, 'Statut requis'),
  tax_rate: z.coerce.number().min(0),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Au moins un article'),
});

type PurchaseRequestFormValues = z.infer<typeof purchaseRequestSchema>;
type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
type DeliveryNoteFormValues = z.infer<typeof deliveryNoteSchema>;
type SupplierInvoiceFormValues = z.infer<typeof supplierInvoiceSchema>;

function calculateItemsTotal(items: ItemFormValues[]) {
  return items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
}

function ItemsFields({
  control,
  fields,
  append,
  remove,
}: {
  control: Control<any>;
  fields: FieldArrayWithId<any, 'items', 'id'>[];
  append: (value: ItemFormValues) => void;
  remove: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Articles</h4>
        <Button type="button" variant="outline" onClick={() => append({ description: '', quantity: 1, unit: 'u', unit_price: 0 })}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un article
        </Button>
      </div>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
            <FormField
              control={control}
              name={`items.${index}.description`}
              render={({ field: formField }) => (
                <FormItem className="col-span-12 md:col-span-4">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Article" {...formField} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`items.${index}.quantity`}
              render={({ field: formField }) => (
                <FormItem className="col-span-4 md:col-span-2">
                  <FormLabel>Quantité</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...formField} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`items.${index}.unit`}
              render={({ field: formField }) => (
                <FormItem className="col-span-4 md:col-span-2">
                  <FormLabel>Unité</FormLabel>
                  <FormControl>
                    <Input placeholder="u" {...formField} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`items.${index}.unit_price`}
              render={({ field: formField }) => (
                <FormItem className="col-span-4 md:col-span-3">
                  <FormLabel>Prix unitaire</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...formField} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="col-span-12 md:col-span-1 flex md:justify-end">
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PurchaseRequestForm({
  open,
  onOpenChange,
  request,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: PurchaseRequest | null;
  onSubmit: (values: PurchaseRequestFormValues) => void;
}) {
  const form = useForm<PurchaseRequestFormValues>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: {
      request_number: '',
      requester_name: '',
      supplier_name: '',
      request_date: new Date().toISOString().split('T')[0],
      needed_date: '',
      status: 'draft',
      notes: '',
      items: [{ description: '', quantity: 1, unit: 'u', unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (request) {
      form.reset({
        request_number: request.request_number,
        requester_name: request.requester_name || '',
        supplier_name: request.supplier_name || '',
        request_date: request.request_date,
        needed_date: request.needed_date || '',
        status: request.status,
        notes: request.notes || '',
        items: request.items?.length
          ? request.items.map(item => ({
              description: item.description,
              quantity: Number(item.quantity),
              unit: item.unit,
              unit_price: Number(item.unit_price),
            }))
          : [{ description: '', quantity: 1, unit: 'u', unit_price: 0 }],
      });
    } else {
      form.reset({
        request_number: '',
        requester_name: '',
        supplier_name: '',
        request_date: new Date().toISOString().split('T')[0],
        needed_date: '',
        status: 'draft',
        notes: '',
        items: [{ description: '', quantity: 1, unit: 'u', unit_price: 0 }],
      });
    }
  }, [request, form]);

  const items = form.watch('items');
  const totalAmount = calculateItemsTotal(items);

  const handleSubmit = (values: PurchaseRequestFormValues) => {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{request ? 'Modifier la demande d’achat' : 'Nouvelle demande d’achat'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="request_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro</FormLabel>
                    <FormControl>
                      <Input placeholder="DA-2026-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="request_date"
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requester_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Demandeur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du demandeur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplier_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fournisseur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du fournisseur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="needed_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date souhaitée</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="submitted">Soumise</SelectItem>
                        <SelectItem value="approved">Approuvée</SelectItem>
                        <SelectItem value="rejected">Rejetée</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <ItemsFields control={form.control} fields={fields} append={append} remove={remove} />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Notes ou remarques" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total: {totalAmount.toFixed(2)} MAD</p>
              <Button type="submit">{request ? 'Mettre à jour' : 'Créer'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PurchaseOrderForm({
  open,
  onOpenChange,
  order,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: PurchaseOrder | null;
  onSubmit: (values: PurchaseOrderFormValues) => void;
}) {
  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      order_number: '',
      supplier_name: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      status: 'draft',
      tax_rate: 20,
      notes: '',
      items: [{ description: '', quantity: 1, unit: 'u', unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (order) {
      form.reset({
        order_number: order.order_number,
        supplier_name: order.supplier_name,
        order_date: order.order_date,
        expected_delivery_date: order.expected_delivery_date || '',
        status: order.status,
        tax_rate: Number(order.tax_rate),
        notes: order.notes || '',
        items: order.items?.length
          ? order.items.map(item => ({
              description: item.description,
              quantity: Number(item.quantity),
              unit: item.unit,
              unit_price: Number(item.unit_price),
            }))
          : [{ description: '', quantity: 1, unit: 'u', unit_price: 0 }],
      });
    } else {
      form.reset({
        order_number: '',
        supplier_name: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        status: 'draft',
        tax_rate: 20,
        notes: '',
        items: [{ description: '', quantity: 1, unit: 'u', unit_price: 0 }],
      });
    }
  }, [order, form]);

  const items = form.watch('items');
  const subtotal = calculateItemsTotal(items);
  const taxRate = Number(form.watch('tax_rate') || 0);
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = (values: PurchaseOrderFormValues) => {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? 'Modifier le bon de commande' : 'Nouveau bon de commande'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro</FormLabel>
                    <FormControl>
                      <Input placeholder="BC-2026-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order_date"
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fournisseur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du fournisseur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expected_delivery_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Livraison prévue</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="sent">Envoyé</SelectItem>
                        <SelectItem value="confirmed">Confirmé</SelectItem>
                        <SelectItem value="received">Reçu</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tax_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TVA %</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <ItemsFields control={form.control} fields={fields} append={append} remove={remove} />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Notes ou remarques" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Sous-total: {subtotal.toFixed(2)} MAD • TVA: {taxAmount.toFixed(2)} MAD • Total: {totalAmount.toFixed(2)} MAD
              </p>
              <Button type="submit">{order ? 'Mettre à jour' : 'Créer'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryNoteForm({
  open,
  onOpenChange,
  note,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: DeliveryNote | null;
  onSubmit: (values: DeliveryNoteFormValues) => void;
}) {
  const form = useForm<DeliveryNoteFormValues>({
    resolver: zodResolver(deliveryNoteSchema),
    defaultValues: {
      delivery_number: '',
      supplier_name: '',
      order_number: '',
      delivery_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: '',
      items: [{ description: '', quantity: 1, unit: 'u', unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (note) {
      form.reset({
        delivery_number: note.delivery_number,
        supplier_name: note.supplier_name,
        order_number: note.order_number || '',
        delivery_date: note.delivery_date,
        status: note.status,
        notes: note.notes || '',
        items: note.items?.length
          ? note.items.map(item => ({
              description: item.description,
              quantity: Number(item.quantity),
              unit: item.unit,
              unit_price: Number(item.unit_price),
            }))
          : [{ description: '', quantity: 1, unit: 'u', unit_price: 0 }],
      });
    } else {
      form.reset({
        delivery_number: '',
        supplier_name: '',
        order_number: '',
        delivery_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: '',
        items: [{ description: '', quantity: 1, unit: 'u', unit_price: 0 }],
      });
    }
  }, [note, form]);

  const items = form.watch('items');
  const totalAmount = calculateItemsTotal(items);

  const handleSubmit = (values: DeliveryNoteFormValues) => {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? 'Modifier le bon de livraison' : 'Nouveau bon de livraison'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="delivery_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro</FormLabel>
                    <FormControl>
                      <Input placeholder="BL-2026-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="delivery_date"
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fournisseur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du fournisseur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commande</FormLabel>
                    <FormControl>
                      <Input placeholder="Référence commande" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="partial">Partielle</SelectItem>
                      <SelectItem value="received">Reçue</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ItemsFields control={form.control} fields={fields} append={append} remove={remove} />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Notes ou remarques" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total: {totalAmount.toFixed(2)} MAD</p>
              <Button type="submit">{note ? 'Mettre à jour' : 'Créer'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SupplierInvoiceForm({
  open,
  onOpenChange,
  invoice,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: SupplierInvoice | null;
  onSubmit: (values: SupplierInvoiceFormValues) => void;
}) {
  const form = useForm<SupplierInvoiceFormValues>({
    resolver: zodResolver(supplierInvoiceSchema),
    defaultValues: {
      invoice_number: '',
      supplier_name: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'draft',
      tax_rate: 20,
      notes: '',
      items: [{ description: '', quantity: 1, unit: 'u', unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (invoice) {
      form.reset({
        invoice_number: invoice.invoice_number,
        supplier_name: invoice.supplier_name,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date || '',
        status: invoice.status,
        tax_rate: Number(invoice.tax_rate),
        notes: invoice.notes || '',
        items: invoice.items?.length
          ? invoice.items.map(item => ({
              description: item.description,
              quantity: Number(item.quantity),
              unit: item.unit,
              unit_price: Number(item.unit_price),
            }))
          : [{ description: '', quantity: 1, unit: 'u', unit_price: 0 }],
      });
    } else {
      form.reset({
        invoice_number: '',
        supplier_name: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        status: 'draft',
        tax_rate: 20,
        notes: '',
        items: [{ description: '', quantity: 1, unit: 'u', unit_price: 0 }],
      });
    }
  }, [invoice, form]);

  const items = form.watch('items');
  const subtotal = calculateItemsTotal(items);
  const taxRate = Number(form.watch('tax_rate') || 0);
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = (values: SupplierInvoiceFormValues) => {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Modifier la facture fournisseur' : 'Nouvelle facture fournisseur'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro</FormLabel>
                    <FormControl>
                      <Input placeholder="FF-2026-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invoice_date"
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fournisseur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du fournisseur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Échéance</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="received">Reçue</SelectItem>
                        <SelectItem value="paid">Payée</SelectItem>
                        <SelectItem value="overdue">En retard</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tax_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TVA %</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <ItemsFields control={form.control} fields={fields} append={append} remove={remove} />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Notes ou remarques" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Sous-total: {subtotal.toFixed(2)} MAD • TVA: {taxAmount.toFixed(2)} MAD • Total: {totalAmount.toFixed(2)} MAD
              </p>
              <Button type="submit">{invoice ? 'Mettre à jour' : 'Créer'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function AchatsPage() {
  const { t } = useTranslation();
  const [requestOpen, setRequestOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryNote | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<SupplierInvoice | null>(null);
  const { data: requests = [], isLoading: loadingRequests } = usePurchaseRequests();
  const { data: orders = [], isLoading: loadingOrders } = usePurchaseOrders();
  const { data: deliveries = [], isLoading: loadingDeliveries } = useDeliveryNotes();
  const { data: invoices = [], isLoading: loadingInvoices } = useSupplierInvoices();
  const createRequest = useCreatePurchaseRequest();
  const updateRequest = useUpdatePurchaseRequest();
  const deleteRequest = useDeletePurchaseRequest();
  const createOrder = useCreatePurchaseOrder();
  const updateOrder = useUpdatePurchaseOrder();
  const deleteOrder = useDeletePurchaseOrder();
  const createDelivery = useCreateDeliveryNote();
  const updateDelivery = useUpdateDeliveryNote();
  const deleteDelivery = useDeleteDeliveryNote();
  const createInvoice = useCreateSupplierInvoice();
  const updateInvoice = useUpdateSupplierInvoice();
  const deleteInvoice = useDeleteSupplierInvoice();

  const requestStatusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'secondary',
    submitted: 'default',
    approved: 'outline',
    rejected: 'destructive',
  };
  const orderStatusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'secondary',
    sent: 'default',
    confirmed: 'outline',
    received: 'outline',
    cancelled: 'destructive',
  };
  const deliveryStatusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    partial: 'default',
    received: 'outline',
    cancelled: 'destructive',
  };
  const invoiceStatusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'secondary',
    received: 'default',
    paid: 'outline',
    overdue: 'destructive',
    cancelled: 'destructive',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('achats.title')}</h1>
          <p className="text-muted-foreground">{t('achats.subtitle')}</p>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-4xl">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t('achats.requests')}</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">{t('achats.orders')}</span>
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">{t('achats.deliveries')}</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">{t('achats.invoices')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Demandes d’achat</h2>
                  <p className="text-sm text-muted-foreground">{requests.length} demande(s)</p>
                </div>
                <Button onClick={() => { setEditingRequest(null); setRequestOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle demande
                </Button>
              </div>
              {loadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : requests.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Aucune demande d’achat créée
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Demandeur</TableHead>
                          <TableHead>Fournisseur</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map(request => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.request_number}</TableCell>
                            <TableCell>{request.requester_name || '-'}</TableCell>
                            <TableCell>{request.supplier_name || '-'}</TableCell>
                            <TableCell>{format(new Date(request.request_date), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                            <TableCell className="text-right">{Number(request.total_amount).toFixed(2)} MAD</TableCell>
                            <TableCell>
                              <Badge variant={requestStatusColors[request.status] || 'secondary'}>{request.status}</Badge>
                            </TableCell>
                            <TableCell className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setEditingRequest(request); setRequestOpen(true); }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer la demande ?</AlertDialogTitle>
                                    <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteRequest.mutate(request.id)}>Supprimer</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              <PurchaseRequestForm
                open={requestOpen}
                onOpenChange={setRequestOpen}
                request={editingRequest}
                onSubmit={(values) => {
                  const totalAmount = calculateItemsTotal(values.items);
                  if (editingRequest) {
                    updateRequest.mutate({
                      id: editingRequest.id,
                      request: {
                        request_number: values.request_number,
                        requester_name: values.requester_name || null,
                        supplier_name: values.supplier_name || null,
                        request_date: values.request_date,
                        needed_date: values.needed_date || null,
                        status: values.status,
                        notes: values.notes || null,
                        total_amount: totalAmount,
                        updated_at: new Date().toISOString(),
                      },
                      items: values.items.map(item => ({
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit: item.unit,
                        unit_price: Number(item.unit_price),
                        total_price: Number(item.quantity) * Number(item.unit_price),
                      })),
                    });
                  } else {
                    createRequest.mutate({
                      request: {
                        request_number: values.request_number,
                        requester_name: values.requester_name || null,
                        supplier_name: values.supplier_name || null,
                        request_date: values.request_date,
                        needed_date: values.needed_date || null,
                        status: values.status,
                        notes: values.notes || null,
                        total_amount: totalAmount,
                      },
                      items: values.items.map(item => ({
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit: item.unit,
                        unit_price: Number(item.unit_price),
                        total_price: Number(item.quantity) * Number(item.unit_price),
                      })),
                    });
                  }
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Bons de commandes</h2>
                  <p className="text-sm text-muted-foreground">{orders.length} bon(s)</p>
                </div>
                <Button onClick={() => { setEditingOrder(null); setOrderOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau bon
                </Button>
              </div>
              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : orders.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Aucun bon de commande créé
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Fournisseur</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map(order => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.order_number}</TableCell>
                            <TableCell>{order.supplier_name}</TableCell>
                            <TableCell>{format(new Date(order.order_date), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                            <TableCell className="text-right">{Number(order.total_amount).toFixed(2)} MAD</TableCell>
                            <TableCell>
                              <Badge variant={orderStatusColors[order.status] || 'secondary'}>{order.status}</Badge>
                            </TableCell>
                            <TableCell className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setEditingOrder(order); setOrderOpen(true); }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer le bon ?</AlertDialogTitle>
                                    <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteOrder.mutate(order.id)}>Supprimer</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              <PurchaseOrderForm
                open={orderOpen}
                onOpenChange={setOrderOpen}
                order={editingOrder}
                onSubmit={(values) => {
                  const subtotal = calculateItemsTotal(values.items);
                  const taxAmount = subtotal * (Number(values.tax_rate) / 100);
                  const totalAmount = subtotal + taxAmount;
                  if (editingOrder) {
                    updateOrder.mutate({
                      id: editingOrder.id,
                      order: {
                        order_number: values.order_number,
                        supplier_name: values.supplier_name,
                        order_date: values.order_date,
                        expected_delivery_date: values.expected_delivery_date || null,
                        status: values.status,
                        subtotal,
                        tax_rate: Number(values.tax_rate),
                        tax_amount: taxAmount,
                        total_amount: totalAmount,
                        notes: values.notes || null,
                        updated_at: new Date().toISOString(),
                      },
                      items: values.items.map(item => ({
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit: item.unit,
                        unit_price: Number(item.unit_price),
                        total_price: Number(item.quantity) * Number(item.unit_price),
                      })),
                    });
                  } else {
                    createOrder.mutate({
                      order: {
                        order_number: values.order_number,
                        supplier_name: values.supplier_name,
                        order_date: values.order_date,
                        expected_delivery_date: values.expected_delivery_date || null,
                        status: values.status,
                        subtotal,
                        tax_rate: Number(values.tax_rate),
                        tax_amount: taxAmount,
                        total_amount: totalAmount,
                        notes: values.notes || null,
                      },
                      items: values.items.map(item => ({
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit: item.unit,
                        unit_price: Number(item.unit_price),
                        total_price: Number(item.quantity) * Number(item.unit_price),
                      })),
                    });
                  }
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="deliveries">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Bons de livraisons</h2>
                  <p className="text-sm text-muted-foreground">{deliveries.length} bon(s)</p>
                </div>
                <Button onClick={() => { setEditingDelivery(null); setDeliveryOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau bon
                </Button>
              </div>
              {loadingDeliveries ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : deliveries.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Aucun bon de livraison créé
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Fournisseur</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deliveries.map(delivery => (
                          <TableRow key={delivery.id}>
                            <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
                            <TableCell>{delivery.supplier_name}</TableCell>
                            <TableCell>{format(new Date(delivery.delivery_date), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                            <TableCell className="text-right">{Number(delivery.total_amount).toFixed(2)} MAD</TableCell>
                            <TableCell>
                              <Badge variant={deliveryStatusColors[delivery.status] || 'secondary'}>{delivery.status}</Badge>
                            </TableCell>
                            <TableCell className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setEditingDelivery(delivery); setDeliveryOpen(true); }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer le bon ?</AlertDialogTitle>
                                    <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteDelivery.mutate(delivery.id)}>Supprimer</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              <DeliveryNoteForm
                open={deliveryOpen}
                onOpenChange={setDeliveryOpen}
                note={editingDelivery}
                onSubmit={(values) => {
                  const totalAmount = calculateItemsTotal(values.items);
                  if (editingDelivery) {
                    updateDelivery.mutate({
                      id: editingDelivery.id,
                      note: {
                        delivery_number: values.delivery_number,
                        supplier_name: values.supplier_name,
                        order_number: values.order_number || null,
                        delivery_date: values.delivery_date,
                        status: values.status,
                        notes: values.notes || null,
                        total_amount: totalAmount,
                        updated_at: new Date().toISOString(),
                      },
                      items: values.items.map(item => ({
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit: item.unit,
                        unit_price: Number(item.unit_price),
                        total_price: Number(item.quantity) * Number(item.unit_price),
                      })),
                    });
                  } else {
                    createDelivery.mutate({
                      note: {
                        delivery_number: values.delivery_number,
                        supplier_name: values.supplier_name,
                        order_number: values.order_number || null,
                        delivery_date: values.delivery_date,
                        status: values.status,
                        notes: values.notes || null,
                        total_amount: totalAmount,
                      },
                      items: values.items.map(item => ({
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit: item.unit,
                        unit_price: Number(item.unit_price),
                        total_price: Number(item.quantity) * Number(item.unit_price),
                      })),
                    });
                  }
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Factures fournisseurs</h2>
                  <p className="text-sm text-muted-foreground">{invoices.length} facture(s)</p>
                </div>
                <Button onClick={() => { setEditingInvoice(null); setInvoiceOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle facture
                </Button>
              </div>
              {loadingInvoices ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : invoices.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Aucune facture fournisseur créée
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Fournisseur</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map(invoice => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>{invoice.supplier_name}</TableCell>
                            <TableCell>{format(new Date(invoice.invoice_date), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                            <TableCell className="text-right">{Number(invoice.total_amount).toFixed(2)} MAD</TableCell>
                            <TableCell>
                              <Badge variant={invoiceStatusColors[invoice.status] || 'secondary'}>{invoice.status}</Badge>
                            </TableCell>
                            <TableCell className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setEditingInvoice(invoice); setInvoiceOpen(true); }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer la facture ?</AlertDialogTitle>
                                    <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteInvoice.mutate(invoice.id)}>Supprimer</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              <SupplierInvoiceForm
                open={invoiceOpen}
                onOpenChange={setInvoiceOpen}
                invoice={editingInvoice}
                onSubmit={(values) => {
                  const subtotal = calculateItemsTotal(values.items);
                  const taxAmount = subtotal * (Number(values.tax_rate) / 100);
                  const totalAmount = subtotal + taxAmount;
                  if (editingInvoice) {
                    updateInvoice.mutate({
                      id: editingInvoice.id,
                      invoice: {
                        invoice_number: values.invoice_number,
                        supplier_name: values.supplier_name,
                        invoice_date: values.invoice_date,
                        due_date: values.due_date || null,
                        status: values.status,
                        subtotal,
                        tax_rate: Number(values.tax_rate),
                        tax_amount: taxAmount,
                        total_amount: totalAmount,
                        notes: values.notes || null,
                        updated_at: new Date().toISOString(),
                      },
                      items: values.items.map(item => ({
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit: item.unit,
                        unit_price: Number(item.unit_price),
                        total_price: Number(item.quantity) * Number(item.unit_price),
                      })),
                    });
                  } else {
                    createInvoice.mutate({
                      invoice: {
                        invoice_number: values.invoice_number,
                        supplier_name: values.supplier_name,
                        invoice_date: values.invoice_date,
                        due_date: values.due_date || null,
                        status: values.status,
                        subtotal,
                        tax_rate: Number(values.tax_rate),
                        tax_amount: taxAmount,
                        total_amount: totalAmount,
                        notes: values.notes || null,
                      },
                      items: values.items.map(item => ({
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit: item.unit,
                        unit_price: Number(item.unit_price),
                        total_price: Number(item.quantity) * Number(item.unit_price),
                      })),
                    });
                  }
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// ReportsPage moved to src/pages/Reports.tsx

// AlertsPage moved to src/pages/Alerts.tsx

export function SettingsPage() {
  const { t } = useTranslation();
  return (
    <ComingSoonPage
      title={t('nav.settings')}
      description="Paramètres de l'entreprise, utilisateurs et rôles. En cours de développement."
    />
  );
}
