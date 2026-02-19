import { supabase } from "@/integrations/supabase/client";
import { StockItem, StockSupplier, StockTransaction } from "@/types/stock";

// --- Suppliers ---

export const getSuppliers = async (): Promise<StockSupplier[]> => {
  const { data, error } = await supabase
    .from('stock_suppliers')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};

export const createSupplier = async (supplier: Omit<StockSupplier, 'id' | 'created_at' | 'updated_at'>): Promise<StockSupplier> => {
  const { data, error } = await supabase
    .from('stock_suppliers')
    .insert([supplier])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateSupplier = async (id: string, updates: Partial<StockSupplier>): Promise<StockSupplier> => {
  const { data, error } = await supabase
    .from('stock_suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteSupplier = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('stock_suppliers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// --- Stock Items ---

export const getStockItems = async (): Promise<StockItem[]> => {
  const { data, error } = await supabase
    .from('stock_items')
    .select(`
      *,
      supplier:stock_suppliers(*)
    `)
    .order('name');
  
  if (error) throw error;
  return data || [];
};

export const createStockItem = async (item: Omit<StockItem, 'id' | 'created_at' | 'updated_at'>): Promise<StockItem> => {
  const { data, error } = await supabase
    .from('stock_items')
    .insert([item])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateStockItem = async (id: string, updates: Partial<StockItem>): Promise<StockItem> => {
  const { data, error } = await supabase
    .from('stock_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteStockItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('stock_items')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// --- Transactions / Restock ---

export const restockItem = async (itemId: string, quantityToAdd: number, notes?: string): Promise<StockItem> => {
  // 1. Get current item
  const { data: item, error: fetchError } = await supabase
    .from('stock_items')
    .select('*')
    .eq('id', itemId)
    .single();
  
  if (fetchError) throw fetchError;
  if (!item) throw new Error('Item not found');

  const previousQuantity = item.quantity;
  const newQuantity = previousQuantity + quantityToAdd;

  // 2. Update item quantity
  const { data: updatedItem, error: updateError } = await supabase
    .from('stock_items')
    .update({ 
      quantity: newQuantity,
      last_restocked: new Date().toISOString()
    })
    .eq('id', itemId)
    .select()
    .single();

  if (updateError) throw updateError;

  // 3. Log transaction
  const { error: logError } = await supabase
    .from('stock_transactions')
    .insert([{
      item_id: itemId,
      type: 'IN',
      quantity: quantityToAdd,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      notes: notes
    }]);

  if (logError) console.error('Error logging transaction:', logError);

  return updatedItem;
};
