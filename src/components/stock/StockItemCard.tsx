import { Package, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StockItem } from '@/types/stock';

interface StockItemCardProps {
  item: StockItem;
  onEdit?: (item: StockItem) => void;
  onRestock?: (item: StockItem) => void;
}

const categoryLabels: Record<string, string> = {
  pieces: 'Pièces détachées',
  consommables: 'Consommables',
  pneus: 'Pneus',
  huiles: 'Huiles & Lubrifiants',
};

const categoryColors: Record<string, string> = {
  pieces: 'bg-blue-500/10 text-blue-500',
  consommables: 'bg-green-500/10 text-green-500',
  pneus: 'bg-orange-500/10 text-orange-500',
  huiles: 'bg-purple-500/10 text-purple-500',
};

export function StockItemCard({ item, onEdit, onRestock }: StockItemCardProps) {
  const isLowStock = item.quantity <= item.min_quantity;
  const stockPercentage = (item.quantity / item.min_quantity) * 100;

  const categoryColor = categoryColors[item.category] || 'bg-gray-500/10 text-gray-500';
  const categoryLabel = categoryLabels[item.category] || item.category;

  return (
    <Card className={cn(
      'hover:shadow-md transition-shadow animate-in fade-in zoom-in-95 duration-300',
      isLowStock && 'border-destructive/50 bg-destructive/5'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              categoryColor
            )}>
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{item.name}</h3>
              <p className="text-xs text-muted-foreground">Réf: {item.reference || '-'}</p>
            </div>
          </div>
          <Badge variant="outline" className={categoryColor}>
            {categoryLabel}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-background/50 rounded-lg p-2 border border-border/50">
            <p className="text-xs text-muted-foreground">Quantité</p>
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-lg font-bold',
                isLowStock ? 'text-destructive' : 'text-foreground'
              )}>
                {item.quantity}
              </span>
              <span className="text-sm text-muted-foreground">{item.unit}</span>
              {isLowStock ? (
                <TrendingDown className="w-4 h-4 text-destructive ml-1" />
              ) : (
                <TrendingUp className="w-4 h-4 text-success ml-1" />
              )}
            </div>
          </div>
          <div className="bg-background/50 rounded-lg p-2 border border-border/50">
            <p className="text-xs text-muted-foreground">Prix unitaire</p>
            <p className="text-lg font-bold text-foreground">{item.unit_price.toFixed(2)} MAD</p>
          </div>
        </div>

        {isLowStock && (
          <div className="flex items-center gap-2 p-2 mb-3 bg-destructive/10 rounded-lg animate-pulse">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-xs text-destructive font-medium">
              Stock faible (min: {item.min_quantity} {item.unit})
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>📍 {item.location || 'Non défini'}</span>
          <span>🏢 {item.supplier?.name || 'Inconnu'}</span>
        </div>

        <div className="w-full bg-muted rounded-full h-2 mb-3 overflow-hidden">
          <div 
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              stockPercentage > 100 ? 'bg-success' : 
              stockPercentage > 50 ? 'bg-primary' : 
              stockPercentage > 25 ? 'bg-warning' : 'bg-destructive'
            )}
            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 hover:bg-primary/5" onClick={() => onEdit?.(item)}>
            Modifier
          </Button>
          <Button size="sm" className="flex-1 shadow-sm" onClick={() => onRestock?.(item)}>
            Réapprovisionner
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
