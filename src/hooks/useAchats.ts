import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PurchaseRequestItem {
  id: string;
  request_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface PurchaseRequest {
  id: string;
  request_number: string;
  requester_name: string | null;
  supplier_name: string | null;
  request_date: string;
  needed_date: string | null;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: PurchaseRequestItem[];
}

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_name: string;
  order_date: string;
  expected_delivery_date: string | null;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: PurchaseOrderItem[];
}

export interface DeliveryNoteItem {
  id: string;
  delivery_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface DeliveryNote {
  id: string;
  delivery_number: string;
  supplier_name: string;
  order_number: string | null;
  delivery_date: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: DeliveryNoteItem[];
}

export interface SupplierInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface SupplierInvoice {
  id: string;
  invoice_number: string;
  supplier_name: string;
  invoice_date: string;
  due_date: string | null;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: SupplierInvoiceItem[];
}

function useCrudMutation<T>(
  queryKeys: string[],
  successMsg: string,
  errorMsg: string,
  mutationFn: (data: T) => Promise<any>
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryKeys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      toast({ title: successMsg });
    },
    onError: () => {
      toast({ title: errorMsg, variant: 'destructive' });
    },
  });
}

export function usePurchaseRequests() {
  return useQuery({
    queryKey: ['achats_purchase_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achats_purchase_requests')
        .select('*, items:achats_purchase_request_items(*)')
        .order('request_date', { ascending: false });
      if (error) throw error;
      return data as PurchaseRequest[];
    },
  });
}

export function usePurchaseRequestsPaged(page: number, pageSize: number) {
  return useQuery({
    queryKey: ['achats_purchase_requests_paged', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await supabase
        .from('achats_purchase_requests')
        .select('*', { count: 'exact' })
        .order('request_date', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data: (data || []) as PurchaseRequest[], count: count ?? (data?.length || 0) };
    },
    placeholderData: (prev) => prev,
    staleTime: 60000,
  });
}

export function useCreatePurchaseRequest() {
  return useCrudMutation(
    ['achats_purchase_requests'],
    'Demande d’achat créée',
    'Erreur création demande',
    async (payload: { request: Partial<PurchaseRequest>; items: Omit<PurchaseRequestItem, 'id' | 'request_id' | 'created_at'>[] }) => {
      const { data, error } = await supabase
        .from('achats_purchase_requests')
        .insert(payload.request as any)
        .select()
        .single();
      if (error) throw error;
      if (payload.items.length) {
        const items = payload.items.map(item => ({ ...item, request_id: data.id }));
        const { error: itemsError } = await supabase.from('achats_purchase_request_items').insert(items as any);
        if (itemsError) throw itemsError;
      }
      return data;
    }
  );
}

export function useUpdatePurchaseRequest() {
  return useCrudMutation(
    ['achats_purchase_requests'],
    'Demande d’achat mise à jour',
    'Erreur mise à jour demande',
    async (payload: { id: string; request: Partial<PurchaseRequest>; items: Omit<PurchaseRequestItem, 'id' | 'request_id' | 'created_at'>[] }) => {
      const { data, error } = await supabase
        .from('achats_purchase_requests')
        .update(payload.request)
        .eq('id', payload.id)
        .select()
        .single();
      if (error) throw error;
      const { error: deleteError } = await supabase
        .from('achats_purchase_request_items')
        .delete()
        .eq('request_id', payload.id);
      if (deleteError) throw deleteError;
      if (payload.items.length) {
        const items = payload.items.map(item => ({ ...item, request_id: payload.id }));
        const { error: itemsError } = await supabase.from('achats_purchase_request_items').insert(items as any);
        if (itemsError) throw itemsError;
      }
      return data;
    }
  );
}

export function useDeletePurchaseRequest() {
  return useCrudMutation(
    ['achats_purchase_requests'],
    'Demande d’achat supprimée',
    'Erreur suppression demande',
    async (id: string) => {
      const { error } = await supabase.from('achats_purchase_requests').delete().eq('id', id);
      if (error) throw error;
    }
  );
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ['achats_purchase_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achats_purchase_orders')
        .select('*, items:achats_purchase_order_items(*)')
        .order('order_date', { ascending: false });
      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });
}

export function usePurchaseOrdersPaged(page: number, pageSize: number) {
  return useQuery({
    queryKey: ['achats_purchase_orders_paged', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await supabase
        .from('achats_purchase_orders')
        .select('*', { count: 'exact' })
        .order('order_date', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data: (data || []) as PurchaseOrder[], count: count ?? (data?.length || 0) };
    },
    placeholderData: (prev) => prev,
    staleTime: 60000,
  });
}

export function useCreatePurchaseOrder() {
  return useCrudMutation(
    ['achats_purchase_orders'],
    'Bon de commande créé',
    'Erreur création bon',
    async (payload: { order: Partial<PurchaseOrder>; items: Omit<PurchaseOrderItem, 'id' | 'order_id' | 'created_at'>[] }) => {
      const { data, error } = await supabase
        .from('achats_purchase_orders')
        .insert(payload.order as any)
        .select()
        .single();
      if (error) throw error;
      if (payload.items.length) {
        const items = payload.items.map(item => ({ ...item, order_id: data.id }));
        const { error: itemsError } = await supabase.from('achats_purchase_order_items').insert(items as any);
        if (itemsError) throw itemsError;
      }
      return data;
    }
  );
}

export function useUpdatePurchaseOrder() {
  return useCrudMutation(
    ['achats_purchase_orders'],
    'Bon de commande mis à jour',
    'Erreur mise à jour bon',
    async (payload: { id: string; order: Partial<PurchaseOrder>; items: Omit<PurchaseOrderItem, 'id' | 'order_id' | 'created_at'>[] }) => {
      const { data, error } = await supabase
        .from('achats_purchase_orders')
        .update(payload.order)
        .eq('id', payload.id)
        .select()
        .single();
      if (error) throw error;
      const { error: deleteError } = await supabase
        .from('achats_purchase_order_items')
        .delete()
        .eq('order_id', payload.id);
      if (deleteError) throw deleteError;
      if (payload.items.length) {
        const items = payload.items.map(item => ({ ...item, order_id: payload.id }));
        const { error: itemsError } = await supabase.from('achats_purchase_order_items').insert(items as any);
        if (itemsError) throw itemsError;
      }
      return data;
    }
  );
}

export function useDeletePurchaseOrder() {
  return useCrudMutation(
    ['achats_purchase_orders'],
    'Bon de commande supprimé',
    'Erreur suppression bon',
    async (id: string) => {
      const { error } = await supabase.from('achats_purchase_orders').delete().eq('id', id);
      if (error) throw error;
    }
  );
}

export function useDeliveryNotes() {
  return useQuery({
    queryKey: ['achats_delivery_notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achats_delivery_notes')
        .select('*, items:achats_delivery_note_items(*)')
        .order('delivery_date', { ascending: false });
      if (error) throw error;
      return data as DeliveryNote[];
    },
  });
}

export function useDeliveryNotesPaged(page: number, pageSize: number) {
  return useQuery({
    queryKey: ['achats_delivery_notes_paged', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await supabase
        .from('achats_delivery_notes')
        .select('*', { count: 'exact' })
        .order('delivery_date', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data: (data || []) as DeliveryNote[], count: count ?? (data?.length || 0) };
    },
    placeholderData: (prev) => prev,
    staleTime: 60000,
  });
}

export function useCreateDeliveryNote() {
  return useCrudMutation(
    ['achats_delivery_notes'],
    'Bon de livraison créé',
    'Erreur création bon de livraison',
    async (payload: { note: Partial<DeliveryNote>; items: Omit<DeliveryNoteItem, 'id' | 'delivery_id' | 'created_at'>[] }) => {
      const { data, error } = await supabase
        .from('achats_delivery_notes')
        .insert(payload.note as any)
        .select()
        .single();
      if (error) throw error;
      if (payload.items.length) {
        const items = payload.items.map(item => ({ ...item, delivery_id: data.id }));
        const { error: itemsError } = await supabase.from('achats_delivery_note_items').insert(items as any);
        if (itemsError) throw itemsError;
      }
      return data;
    }
  );
}

export function useUpdateDeliveryNote() {
  return useCrudMutation(
    ['achats_delivery_notes'],
    'Bon de livraison mis à jour',
    'Erreur mise à jour bon de livraison',
    async (payload: { id: string; note: Partial<DeliveryNote>; items: Omit<DeliveryNoteItem, 'id' | 'delivery_id' | 'created_at'>[] }) => {
      const { data, error } = await supabase
        .from('achats_delivery_notes')
        .update(payload.note)
        .eq('id', payload.id)
        .select()
        .single();
      if (error) throw error;
      const { error: deleteError } = await supabase
        .from('achats_delivery_note_items')
        .delete()
        .eq('delivery_id', payload.id);
      if (deleteError) throw deleteError;
      if (payload.items.length) {
        const items = payload.items.map(item => ({ ...item, delivery_id: payload.id }));
        const { error: itemsError } = await supabase.from('achats_delivery_note_items').insert(items as any);
        if (itemsError) throw itemsError;
      }
      return data;
    }
  );
}

export function useDeleteDeliveryNote() {
  return useCrudMutation(
    ['achats_delivery_notes'],
    'Bon de livraison supprimé',
    'Erreur suppression bon de livraison',
    async (id: string) => {
      const { error } = await supabase.from('achats_delivery_notes').delete().eq('id', id);
      if (error) throw error;
    }
  );
}

export function useSupplierInvoices() {
  return useQuery({
    queryKey: ['achats_supplier_invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achats_supplier_invoices')
        .select('*, items:achats_supplier_invoice_items(*)')
        .order('invoice_date', { ascending: false });
      if (error) throw error;
      return data as SupplierInvoice[];
    },
  });
}

export function useSupplierInvoicesPaged(page: number, pageSize: number) {
  return useQuery({
    queryKey: ['achats_supplier_invoices_paged', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await supabase
        .from('achats_supplier_invoices')
        .select('*', { count: 'exact' })
        .order('invoice_date', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data: (data || []) as SupplierInvoice[], count: count ?? (data?.length || 0) };
    },
    placeholderData: (prev) => prev,
    staleTime: 60000,
  });
}

export function usePurchaseRequestItems(requestId: string | null) {
  return useQuery({
    queryKey: ['achats_purchase_request_items', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achats_purchase_request_items')
        .select('*')
        .eq('request_id', requestId);
      if (error) throw error;
      return data as PurchaseRequestItem[];
    },
  });
}

export function usePurchaseOrderItems(orderId: string | null) {
  return useQuery({
    queryKey: ['achats_purchase_order_items', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achats_purchase_order_items')
        .select('*')
        .eq('order_id', orderId);
      if (error) throw error;
      return data as PurchaseOrderItem[];
    },
  });
}

export function useDeliveryNoteItems(deliveryId: string | null) {
  return useQuery({
    queryKey: ['achats_delivery_note_items', deliveryId],
    enabled: !!deliveryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achats_delivery_note_items')
        .select('*')
        .eq('delivery_id', deliveryId);
      if (error) throw error;
      return data as DeliveryNoteItem[];
    },
  });
}

export function useSupplierInvoiceItems(invoiceId: string | null) {
  return useQuery({
    queryKey: ['achats_supplier_invoice_items', invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achats_supplier_invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);
      if (error) throw error;
      return data as SupplierInvoiceItem[];
    },
  });
}

export function useCreateSupplierInvoice() {
  return useCrudMutation(
    ['achats_supplier_invoices'],
    'Facture fournisseur créée',
    'Erreur création facture',
    async (payload: { invoice: Partial<SupplierInvoice>; items: Omit<SupplierInvoiceItem, 'id' | 'invoice_id' | 'created_at'>[] }) => {
      const { data, error } = await supabase
        .from('achats_supplier_invoices')
        .insert(payload.invoice as any)
        .select()
        .single();
      if (error) throw error;
      if (payload.items.length) {
        const items = payload.items.map(item => ({ ...item, invoice_id: data.id }));
        const { error: itemsError } = await supabase.from('achats_supplier_invoice_items').insert(items as any);
        if (itemsError) throw itemsError;
      }
      return data;
    }
  );
}

export function useUpdateSupplierInvoice() {
  return useCrudMutation(
    ['achats_supplier_invoices'],
    'Facture fournisseur mise à jour',
    'Erreur mise à jour facture',
    async (payload: { id: string; invoice: Partial<SupplierInvoice>; items: Omit<SupplierInvoiceItem, 'id' | 'invoice_id' | 'created_at'>[] }) => {
      const { data, error } = await supabase
        .from('achats_supplier_invoices')
        .update(payload.invoice)
        .eq('id', payload.id)
        .select()
        .single();
      if (error) throw error;
      const { error: deleteError } = await supabase
        .from('achats_supplier_invoice_items')
        .delete()
        .eq('invoice_id', payload.id);
      if (deleteError) throw deleteError;
      if (payload.items.length) {
        const items = payload.items.map(item => ({ ...item, invoice_id: payload.id }));
        const { error: itemsError } = await supabase.from('achats_supplier_invoice_items').insert(items as any);
        if (itemsError) throw itemsError;
      }
      return data;
    }
  );
}

export function useDeleteSupplierInvoice() {
  return useCrudMutation(
    ['achats_supplier_invoices'],
    'Facture fournisseur supprimée',
    'Erreur suppression facture',
    async (id: string) => {
      const { error } = await supabase.from('achats_supplier_invoices').delete().eq('id', id);
      if (error) throw error;
    }
  );
}
