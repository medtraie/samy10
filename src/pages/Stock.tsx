import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { StockItemCard } from '@/components/stock/StockItemCard';
import { SupplierCard } from '@/components/stock/SupplierCard';
import { StockForm } from '@/components/stock/StockForm';
import { SupplierForm } from '@/components/stock/SupplierForm';
import { RestockForm } from '@/components/stock/RestockForm';
import { StockItem, StockSupplier, StockTransactionWithItem } from '@/types/stock';
import { 
  getStockItems, 
  createStockItem, 
  updateStockItem, 
  getSuppliers, 
  createSupplier, 
  updateSupplier, 
  restockItem,
  getStockTransactions, 
} from '@/services/stockService';
import { usePurchaseOrders, useSupplierInvoices } from '@/hooks/useAchats';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Building2,
  Filter,
  RefreshCw,
  History
} from 'lucide-react';
import { toast } from 'sonner';

const defaultCategories = [
  { value: 'pieces', label: 'Pièces détachées' },
  { value: 'consommables', label: 'Consommables' },
  { value: 'pneus', label: 'Pneus' },
  { value: 'huiles', label: 'Huiles & Lubrifiants' },
];

const getCategoryLabel = (value: string) =>
  defaultCategories.find((category) => category.value === value)?.label ?? value;

const normalizeSupplierName = (name: string | null | undefined) =>
  (name || '').trim().toLowerCase();

export default function Stock() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockTypeFilter, setStockTypeFilter] = useState<'all' | 'internal' | 'external'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'qty_asc' | 'qty_desc' | 'value_desc'>('name');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [suppliers, setSuppliers] = useState<StockSupplier[]>([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<StockTransactionWithItem[]>([]);
  const [isTxLoading, setIsTxLoading] = useState(false);
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'IN' | 'OUT' | 'ADJUSTMENT'>('all');
  const [txVehicleFilter, setTxVehicleFilter] = useState('');
  const [txStartDate, setTxStartDate] = useState('');
  const [txEndDate, setTxEndDate] = useState('');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [supplierSort, setSupplierSort] = useState<'name' | 'spent_desc' | 'debt_desc'>('name');
  
  // Form states
  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [restockFormOpen, setRestockFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | undefined>();
  const [editingSupplier, setEditingSupplier] = useState<StockSupplier | undefined>();
  const [restockingItem, setRestockingItem] = useState<StockItem | null>(null);

  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const { data: supplierInvoices = [] } = useSupplierInvoices();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemsData, suppliersData] = await Promise.all([
        getStockItems(),
        getSuppliers()
      ]);
      setStockItems(itemsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setIsTxLoading(true);
    try {
      const data = await getStockTransactions();
      const internalOnly = data.filter((tx) => tx.item?.stock_type === 'internal');
      setTransactions(internalOnly);
    } catch (error) {
      console.error('Error fetching stock transactions:', error);
      toast.error('Erreur lors du chargement des mouvements de stock');
    } finally {
      setIsTxLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    setCategories((current) => {
      const merged = new Map(current.map((category) => [category.value, category]));
      stockItems.forEach((item) => {
        const value = item.category?.trim();
        if (!value) return;
        if (!merged.has(value)) {
          merged.set(value, { value, label: getCategoryLabel(value) });
        }
      });
      return Array.from(merged.values());
    });
  }, [stockItems]);

  // Calculate stats
  const totalItems = stockItems.length;
  const lowStockItems = stockItems.filter(item => item.quantity <= item.min_quantity).length;
  const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalSuppliers = suppliers.length;

  const supplierAggregates = useMemo(() => {
    type Agg = {
      ordersCount: number;
      ordersTotal: number;
      invoicesCount: number;
      invoicesTotal: number;
      outstandingAmount: number;
      lastInvoiceDate: string | null;
    };

    const map = new Map<string, Agg>();

    const ensure = (name: string) => {
      const key = normalizeSupplierName(name);
      if (!key) return null;
      if (!map.has(key)) {
        map.set(key, {
          ordersCount: 0,
          ordersTotal: 0,
          invoicesCount: 0,
          invoicesTotal: 0,
          outstandingAmount: 0,
          lastInvoiceDate: null,
        });
      }
      return map.get(key)!;
    };

    purchaseOrders.forEach((order) => {
      const agg = ensure(order.supplier_name);
      if (!agg) return;
      agg.ordersCount += 1;
      const total = typeof order.total_amount === 'number'
        ? order.total_amount
        : (order as any).total_amount ?? order.subtotal ?? 0;
      agg.ordersTotal += Number(total) || 0;
    });

    supplierInvoices.forEach((invoice) => {
      const agg = ensure(invoice.supplier_name);
      if (!agg) return;
      agg.invoicesCount += 1;
      const total = typeof invoice.total_amount === 'number'
        ? invoice.total_amount
        : (invoice as any).total_amount ?? invoice.subtotal ?? 0;
      const numericTotal = Number(total) || 0;
      agg.invoicesTotal += numericTotal;
      const isPaid = invoice.status === 'paid';
      if (!isPaid) {
        agg.outstandingAmount += numericTotal;
      }
      if (!agg.lastInvoiceDate || invoice.invoice_date > agg.lastInvoiceDate) {
        agg.lastInvoiceDate = invoice.invoice_date;
      }
    });

    return map;
  }, [purchaseOrders, supplierInvoices]);

  const suppliersWithStats: StockSupplier[] = useMemo(
    () =>
      suppliers.map((supplier) => {
        const key = normalizeSupplierName(supplier.name);
        const agg = key ? supplierAggregates.get(key) : undefined;
        return {
          ...supplier,
          ordersCount: agg?.ordersCount ?? supplier.ordersCount,
          totalSpent: agg?.invoicesTotal ?? supplier.totalSpent,
          invoicesCount: agg?.invoicesCount ?? supplier.invoicesCount,
          outstandingAmount: agg?.outstandingAmount ?? supplier.outstandingAmount ?? 0,
          lastInvoiceDate: agg?.lastInvoiceDate ?? supplier.lastInvoiceDate ?? null,
        };
      }),
    [suppliers, supplierAggregates],
  );

  // Filter items
  const filteredItems = stockItems.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesType =
      stockTypeFilter === 'all' ||
      (stockTypeFilter === 'internal' ? item.stock_type === 'internal' : item.stock_type !== 'internal');
    const isLowStock = item.quantity <= item.min_quantity;
    const matchesLowStock = !showOnlyLowStock || isLowStock;
    return matchesSearch && matchesCategory && matchesType && matchesLowStock;
  });

  const sortedItems = useMemo(() => {
    const items = [...filteredItems];
    if (sortBy === 'name') {
      return items.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === 'qty_asc') {
      return items.sort((a, b) => a.quantity - b.quantity);
    }
    if (sortBy === 'qty_desc') {
      return items.sort((a, b) => b.quantity - a.quantity);
    }
    if (sortBy === 'value_desc') {
      return items.sort(
        (a, b) => b.quantity * b.unit_price - a.quantity * a.unit_price,
      );
    }
    return items;
  }, [filteredItems, sortBy]);

  // Filter suppliers
  const filteredSuppliers = suppliersWithStats.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false),
  );

  const sortedSuppliers = useMemo(() => {
    const list = [...filteredSuppliers];
    if (supplierSort === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (supplierSort === 'spent_desc') {
      return list.sort(
        (a, b) => (b.totalSpent ?? 0) - (a.totalSpent ?? 0),
      );
    }
    if (supplierSort === 'debt_desc') {
      return list.sort(
        (a, b) => (b.outstandingAmount ?? 0) - (a.outstandingAmount ?? 0),
      );
    }
    return list;
  }, [filteredSuppliers, supplierSort]);

  const filteredTransactions = transactions.filter((tx) => {
    const createdAt = new Date(tx.created_at);
    const matchesType = txTypeFilter === 'all' || tx.type === txTypeFilter;
    const matchesStart = !txStartDate || createdAt >= new Date(txStartDate);
    const matchesEnd = !txEndDate || createdAt <= new Date(txEndDate + 'T23:59:59');
    const notes = tx.notes?.toLowerCase() || '';
    const matchesVehicle =
      txVehicleFilter.trim().length === 0 ||
      notes.includes(txVehicleFilter.trim().toLowerCase());
    return matchesType && matchesStart && matchesEnd && matchesVehicle;
  });

  const inCount = filteredTransactions.filter((tx) => tx.type === 'IN').length;
  const outCount = filteredTransactions.filter((tx) => tx.type === 'OUT').length;
  const adjustmentCount = filteredTransactions.filter((tx) => tx.type === 'ADJUSTMENT').length;
  const totalOutQuantity = filteredTransactions
    .filter((tx) => tx.type === 'OUT')
    .reduce((sum, tx) => sum + (tx.quantity || 0), 0);

  const parsedConsumption = useMemo(() => {
    const byVehicle: Record<
      string,
      { vehiclePlate: string; totalQuantity: number; totalCost: number; lines: number }
    > = {};
    const byRevisionType: Record<
      string,
      { type: string; totalQuantity: number; totalCost: number; lines: number }
    > = {};

    filteredTransactions
      .filter((tx) => tx.type === 'OUT')
      .forEach((tx) => {
        const notes = tx.notes || '';
        const lower = notes.toLowerCase();
        const unitPrice = tx.item?.unit_price ?? 0;
        const qty = tx.quantity || 0;
        const cost = unitPrice * qty;

        let vehiclePlate: string | null = null;
        let revisionType: string | null = null;

        if (lower.startsWith('révision ')) {
          const parts = notes.split(' ');
          if (parts.length >= 4) {
            revisionType = parts[1];
            const vehIndex = parts.findIndex(
              (p) => p.toLowerCase().startsWith('véhicule'),
            );
            if (vehIndex >= 0 && vehIndex + 1 < parts.length) {
              vehiclePlate = parts.slice(vehIndex + 1).join(' ').trim();
            }
          }
        } else if (lower.startsWith('maintenance véhicule ')) {
          const afterPrefix = notes.slice('Maintenance véhicule '.length);
          const dashIndex = afterPrefix.indexOf(' - ');
          if (dashIndex > 0) {
            vehiclePlate = afterPrefix.slice(0, dashIndex).trim();
          } else {
            vehiclePlate = afterPrefix.trim();
          }
        }

        if (vehiclePlate) {
          const key = vehiclePlate;
          if (!byVehicle[key]) {
            byVehicle[key] = {
              vehiclePlate: key,
              totalQuantity: 0,
              totalCost: 0,
              lines: 0,
            };
          }
          byVehicle[key].totalQuantity += qty;
          byVehicle[key].totalCost += cost;
          byVehicle[key].lines += 1;
        }

        if (revisionType) {
          const key = revisionType;
          if (!byRevisionType[key]) {
            byRevisionType[key] = {
              type: key,
              totalQuantity: 0,
              totalCost: 0,
              lines: 0,
            };
          }
          byRevisionType[key].totalQuantity += qty;
          byRevisionType[key].totalCost += cost;
          byRevisionType[key].lines += 1;
        }
      });

    return {
      byVehicle: Object.values(byVehicle).sort((a, b) =>
        a.vehiclePlate.localeCompare(b.vehiclePlate),
      ),
      byRevisionType: Object.values(byRevisionType),
    };
  }, [filteredTransactions]);

  // Handlers
  const handleStockSubmit = async (data: any) => {
    try {
      if (editingItem) {
        await updateStockItem(editingItem.id, data);
        toast.success('Article modifié avec succès');
      } else {
        await createStockItem(data);
        toast.success('Article ajouté avec succès');
      }
      setStockFormOpen(false);
      setEditingItem(undefined);
      fetchData();
    } catch (error) {
      console.error('Error saving stock item:', error);
      toast.error('Erreur lors de l\'enregistrement de l\'article');
    }
  };

  const handleEditItem = (item: StockItem) => {
    setEditingItem(item);
    setStockFormOpen(true);
  };

  const handleRestock = (item: StockItem) => {
    setRestockingItem(item);
    setRestockFormOpen(true);
  };

  const handleRestockSubmit = async (itemId: string, quantity: number, notes?: string) => {
    try {
      await restockItem(itemId, quantity, notes);
      toast.success(`Réapprovisionnement de ${quantity} unités enregistré`);
      setRestockFormOpen(false);
      setRestockingItem(null);
      fetchData();
    } catch (error) {
      console.error('Error restocking item:', error);
      toast.error('Erreur lors du réapprovisionnement');
    }
  };

  const handleSupplierSubmit = async (data: any) => {
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, data);
        toast.success('Fournisseur modifié avec succès');
      } else {
        await createSupplier(data);
        toast.success('Fournisseur ajouté avec succès');
      }
      setSupplierFormOpen(false);
      setEditingSupplier(undefined);
      fetchData();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Erreur lors de l\'enregistrement du fournisseur');
    }
  };

  const handleEditSupplier = (supplier: StockSupplier) => {
    setEditingSupplier(supplier);
    setSupplierFormOpen(true);
  };

  const handleViewSupplier = (supplier: StockSupplier) => {
    navigate(`/stock/suppliers/${supplier.id}`);
  };

  const handleAddCategory = () => {
    const value = newCategoryLabel.trim();
    if (!value) {
      toast.error('Nom de catégorie requis');
      return;
    }
    const exists = categories.some(
      (category) =>
        category.value.toLowerCase() === value.toLowerCase() ||
        category.label.toLowerCase() === value.toLowerCase()
    );
    if (exists) {
      toast.info('Catégorie déjà existante');
      return;
    }
    setCategories((current) => [...current, { value, label: value }]);
    setNewCategoryLabel('');
    setCategoryDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('nav.stock')}</h1>
            <p className="text-muted-foreground">Gestion des pièces, consommables et fournisseurs</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Articles en stock</p>
                  <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock faible</p>
                  <p className="text-2xl font-bold text-destructive">{lowStockItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valeur totale</p>
                  <p className="text-2xl font-bold text-foreground">{(totalValue).toFixed(2)} MAD</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fournisseurs</p>
                  <p className="text-2xl font-bold text-foreground">{totalSuppliers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stock" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="stock" className="gap-2">
                <Package className="w-4 h-4" />
                Articles
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="gap-2">
                <Building2 className="w-4 h-4" />
                Fournisseurs
              </TabsTrigger>
              <TabsTrigger value="movements" className="gap-2">
                <History className="w-4 h-4" />
                Mouvements internes
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Stock Tab */}
          <TabsContent value="stock" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stockTypeFilter} onValueChange={(v) => setStockTypeFilter(v as 'all' | 'internal' | 'external')}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type de stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="internal">Stock interne</SelectItem>
                    <SelectItem value="external">Stock externe</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Ordre d'affichage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Par nom</SelectItem>
                    <SelectItem value="qty_asc">Quantité croissante</SelectItem>
                    <SelectItem value="qty_desc">Quantité décroissante</SelectItem>
                    <SelectItem value="value_desc">Valeur décroissante</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={showOnlyLowStock ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowOnlyLowStock((v) => !v)}
                >
                  Stock faible seulement
                </Button>
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Ajouter catégorie
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Ajouter une catégorie</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nom de la catégorie</Label>
                        <Input
                          value={newCategoryLabel}
                          onChange={(e) => setNewCategoryLabel(e.target.value)}
                          placeholder="Ex: Batteries"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleAddCategory}>Ajouter</Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Button onClick={() => { setEditingItem(undefined); setStockFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel article
              </Button>
            </div>

            {lowStockItems > 0 && (
              <Card className="border-destructive/50 bg-destructive/5 animate-in slide-in-from-top-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Attention: {lowStockItems} article(s) en stock faible</p>
                      <p className="text-sm text-muted-foreground">Pensez à réapprovisionner ces articles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedItems.map((item) => (
                <StockItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onRestock={handleRestock}
                />
              ))}
            </div>

            {filteredItems.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Aucun article trouvé</p>
                <p className="text-sm text-muted-foreground">Modifiez vos filtres ou ajoutez un nouvel article</p>
              </div>
            )}
            
            {isLoading && (
               <div className="text-center py-12">
                 <p className="text-muted-foreground">Chargement...</p>
               </div>
            )}
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={supplierSort} onValueChange={(v) => setSupplierSort(v as typeof supplierSort)}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Ordre des fournisseurs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Par nom</SelectItem>
                    <SelectItem value="spent_desc">Montant dépensé décroissant</SelectItem>
                    <SelectItem value="debt_desc">Dette décroissante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => { setEditingSupplier(undefined); setSupplierFormOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau fournisseur
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedSuppliers.map((supplier) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  onEdit={handleEditSupplier}
                  onOrder={() => toast.info('Fonctionnalité de commande en cours de développement')}
                  onView={handleViewSupplier}
                />
              ))}
            </div>

            {filteredSuppliers.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Aucun fournisseur trouvé</p>
                <p className="text-sm text-muted-foreground">Ajoutez un nouveau fournisseur</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={txTypeFilter} onValueChange={(v) => setTxTypeFilter(v as 'all' | 'IN' | 'OUT' | 'ADJUSTMENT')}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type de mouvement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="IN">Entrées</SelectItem>
                    <SelectItem value="OUT">Sorties</SelectItem>
                    <SelectItem value="ADJUSTMENT">Ajustements</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={txStartDate}
                  onChange={(e) => setTxStartDate(e.target.value)}
                  className="w-40"
                />
                <Input
                  type="date"
                  value={txEndDate}
                  onChange={(e) => setTxEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Filtrer par véhicule (plaque dans les notes)"
                  value={txVehicleFilter}
                  onChange={(e) => setTxVehicleFilter(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Entrées</p>
                  <p className="text-lg font-bold text-foreground">{inCount}</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Sorties</p>
                  <p className="text-lg font-bold text-foreground">
                    {outCount} ({totalOutQuantity} unités)
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Ajustements</p>
                  <p className="text-lg font-bold text-foreground">{adjustmentCount}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-3 border-b">
                    <p className="text-xs font-medium text-muted-foreground">
                      Consommation stock interne par véhicule
                    </p>
                  </div>
                  {parsedConsumption.byVehicle.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      Aucune consommation liée à une maintenance ou révision pour ce filtre
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/60">
                          <tr>
                            <th className="text-left px-3 py-2">Véhicule</th>
                            <th className="text-right px-3 py-2">Quantité utilisée</th>
                            <th className="text-right px-3 py-2">Coût estimé</th>
                            <th className="text-right px-3 py-2">Lignes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedConsumption.byVehicle.map((row) => (
                            <tr key={row.vehiclePlate} className="border-t">
                              <td className="px-3 py-2">{row.vehiclePlate}</td>
                              <td className="px-3 py-2 text-right">
                                {row.totalQuantity}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {row.totalCost.toFixed(2)} MAD
                              </td>
                              <td className="px-3 py-2 text-right">{row.lines}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-3 border-b">
                    <p className="text-xs font-medium text-muted-foreground">
                      Consommation liée aux révisions (par type)
                    </p>
                  </div>
                  {parsedConsumption.byRevisionType.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      Aucune consommation stock provenant des fiches Révisions pour ce filtre
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/60">
                          <tr>
                            <th className="text-left px-3 py-2">Type de révision</th>
                            <th className="text-right px-3 py-2">Quantité utilisée</th>
                            <th className="text-right px-3 py-2">Coût estimé</th>
                            <th className="text-right px-3 py-2">Lignes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedConsumption.byRevisionType.map((row) => (
                            <tr key={row.type} className="border-t">
                              <td className="px-3 py-2">
                                {row.type.replace('_', ' ')}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {row.totalQuantity}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {row.totalCost.toFixed(2)} MAD
                              </td>
                              <td className="px-3 py-2 text-right">{row.lines}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {isTxLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Chargement des mouvements...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Aucun mouvement trouvé pour ce filtre</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left px-4 py-2">Date</th>
                          <th className="text-left px-4 py-2">Article</th>
                          <th className="text-left px-4 py-2">Type</th>
                          <th className="text-right px-4 py-2">Quantité</th>
                          <th className="text-right px-4 py-2">Stock avant</th>
                          <th className="text-right px-4 py-2">Stock après</th>
                          <th className="text-left px-4 py-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((tx) => (
                          <tr
                            key={tx.id}
                            className={
                              'border-t transition-colors ' +
                              (tx.type === 'IN'
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                                : tx.type === 'OUT'
                                ? 'bg-rose-50/40 dark:bg-rose-950/20'
                                : 'bg-muted/40')
                            }
                          >
                            <td className="px-4 py-2">
                              {new Date(tx.created_at).toLocaleString('fr-FR')}
                            </td>
                            <td className="px-4 py-2">
                              {tx.item?.name || '-'}
                            </td>
                            <td className="px-4 py-2">
                              {tx.type === 'IN'
                                ? 'Entrée'
                                : tx.type === 'OUT'
                                ? 'Sortie'
                                : 'Ajustement'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : ''}
                              {tx.quantity}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {tx.previous_quantity ?? '-'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {tx.new_quantity ?? '-'}
                            </td>
                            <td className="px-4 py-2 max-w-xs truncate" title={tx.notes || ''}>
                              {tx.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Forms */}
      <StockForm
        open={stockFormOpen}
        onOpenChange={setStockFormOpen}
        stockItem={editingItem}
        categories={categories}
        onSubmit={handleStockSubmit}
      />

      <SupplierForm
        open={supplierFormOpen}
        onOpenChange={setSupplierFormOpen}
        supplier={editingSupplier}
        onSubmit={handleSupplierSubmit}
      />

      <RestockForm
        open={restockFormOpen}
        onOpenChange={setRestockFormOpen}
        stockItem={restockingItem}
        onSubmit={handleRestockSubmit}
      />
    </DashboardLayout>
  );
}
