import { useState, useEffect } from 'react';
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
import { StockItemCard } from '@/components/stock/StockItemCard';
import { SupplierCard } from '@/components/stock/SupplierCard';
import { StockForm } from '@/components/stock/StockForm';
import { SupplierForm } from '@/components/stock/SupplierForm';
import { RestockForm } from '@/components/stock/RestockForm';
import { StockItem, StockSupplier } from '@/types/stock';
import { 
  getStockItems, 
  createStockItem, 
  updateStockItem, 
  getSuppliers, 
  createSupplier, 
  updateSupplier, 
  restockItem 
} from '@/services/stockService';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Building2,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function Stock() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [suppliers, setSuppliers] = useState<StockSupplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [restockFormOpen, setRestockFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | undefined>();
  const [editingSupplier, setEditingSupplier] = useState<StockSupplier | undefined>();
  const [restockingItem, setRestockingItem] = useState<StockItem | null>(null);

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

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate stats
  const totalItems = stockItems.length;
  const lowStockItems = stockItems.filter(item => item.quantity <= item.min_quantity).length;
  const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalSuppliers = suppliers.length;

  // Filter items
  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

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
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value="pieces">Pièces détachées</SelectItem>
                    <SelectItem value="consommables">Consommables</SelectItem>
                    <SelectItem value="pneus">Pneus</SelectItem>
                    <SelectItem value="huiles">Huiles & Lubrifiants</SelectItem>
                  </SelectContent>
                </Select>
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
              {filteredItems.map((item) => (
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
            <div className="flex justify-end">
              <Button onClick={() => { setEditingSupplier(undefined); setSupplierFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau fournisseur
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((supplier) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  onEdit={handleEditSupplier}
                  onOrder={() => toast.info('Fonctionnalité de commande en cours de développement')}
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
        </Tabs>
      </div>

      {/* Forms */}
      <StockForm
        open={stockFormOpen}
        onOpenChange={setStockFormOpen}
        stockItem={editingItem}
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