import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  Package,
  Fuel,
  Wrench,
  Boxes,
  Droplets,
  DollarSign,
  Settings,
  Bell,
  FileText,
  ShoppingCart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Palmtree,
  Bus,
  PackageCheck,
  BookOpen,
  UserCog,
  KeyRound,
  Building2,
  ReceiptText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useRevisionAlerts } from '@/hooks/useRevisions';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/', module: 'dashboard' },
  { key: 'vehicles', icon: Truck, path: '/vehicles', module: 'vehicles' },
  { key: 'liveMap', icon: MapPin, path: '/live-map', module: 'live_map' },
  { key: 'drivers', icon: Users, path: '/drivers', module: 'drivers' },
  { key: 'personnel', icon: UserCog, path: '/personnel', module: 'personnel' },
  { key: 'rental', icon: KeyRound, path: '/location-vehicules', module: 'rental' },
  { key: 'transportTouristique', icon: Palmtree, path: '/transport-touristique', module: 'transport_touristique' },
  { key: 'transportVoyageurs', icon: Bus, path: '/transport-voyageurs', module: 'transport_voyageurs' },
  { key: 'transportTMS', icon: PackageCheck, path: '/transport-tms', module: 'transport_tms' },
  { key: 'transportBTP', icon: Truck, path: '/transport-btp', module: 'transport_btp' },
  { key: 'missions', icon: Package, path: '/missions', module: 'missions' },
  { key: 'stock', icon: Boxes, path: '/stock', module: 'stock' },
  { key: 'fuel', icon: Fuel, path: '/fuel', module: 'fuel' },
  { key: 'oil', icon: Droplets, path: '/oil', module: 'oil' },
  { key: 'citerne', icon: Droplets, path: '/citerne', module: 'citerne' },
  { key: 'revisions', icon: FileText, path: '/revisions', module: 'revisions' },
  { key: 'maintenance', icon: Wrench, path: '/maintenance', module: 'maintenance' },
  { key: 'clients', icon: Users, path: '/clients', module: 'clients' },
  { key: 'societe', icon: Building2, path: '/societe', module: 'societe' },
  { key: 'facturation', icon: ReceiptText, path: '/facturation', module: 'facturation' },
  { key: 'fournisseurs', icon: Building2, path: '/fournisseurs', module: 'fournisseurs' },
  { key: 'achats', icon: ShoppingCart, path: '/achats', module: 'achats' },
  { key: 'finance', icon: DollarSign, path: '/finance', module: 'finance' },
  { key: 'comptabilite', icon: BookOpen, path: '/comptabilite', module: 'comptabilite' },
  { key: 'reports', icon: FileText, path: '/reports', module: 'reports' },
  { key: 'alerts', icon: Bell, path: '/alerts', module: 'alerts', badge: 4 },
  { key: 'settings', icon: Settings, path: '/settings' },
];

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { moduleSettings } = useAppSettings();
  const { data: revAlerts = [] } = useRevisionAlerts();
  const dueOverdueCount = (revAlerts as any[]).filter((a) => !a.ack && (a.status === 'due' || a.status === 'overdue')).length;

  const handleSignOut = async () => {
    const { error } = await signOut();
    navigate('/auth', { replace: true });
    if (error) {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la déconnexion: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const filteredNavItems = navItems.filter(item => {
    if (!item.module || !moduleSettings) return true;
    return moduleSettings[item.module as keyof typeof moduleSettings] !== false;
  });

  const computedNavItems = filteredNavItems.map((item) =>
    item.key === 'alerts' ? { ...item, badge: dueOverdueCount } : item
  );
  return (
    <aside
      className={cn(
        'fixed top-0 h-screen flex flex-col z-50 border bg-sidebar-background text-sidebar-foreground shadow-xl transition-all duration-300',
        collapsed ? 'w-20' : 'w-64',
        isRTL ? 'right-0 border-l border-sidebar-border' : 'left-0 border-r border-sidebar-border'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-border">
            <img src="/Parc_Gps_logo_transparent-10.png" alt="Parc gps" className="w-8 h-8 object-contain" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold">Parc gps</h1>
              <p className="text-[10px] text-sidebar-muted uppercase tracking-wider">Maroc</p>
            </div>
          )}
        </div>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground"
            onClick={onToggle}
          >
            {isRTL ? (
              collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Company Selector */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/15 flex items-center justify-center">
              <span className="text-xs font-semibold text-sidebar-primary">TM</span>
            </div>
            {!collapsed && (
              <div className={cn('text-left', isRTL && 'text-right')}>
                <p className="text-sm font-medium">Trans Maroc SARL</p>
                <p className="text-xs text-sidebar-muted">6 véhicules</p>
              </div>
            )}
          </div>
          {!collapsed && <ChevronDown className="w-4 h-4 text-sidebar-muted" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
        <ul className="space-y-1">
          {computedNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'nav-item relative',
                    collapsed && 'justify-center',
                    isActive && 'nav-item-active'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 truncate">{t(`nav.${item.key}`)}</span>
                  )}
                  {item.badge && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div
                      className={cn(
                        'absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary',
                        isRTL ? '-left-3' : '-right-3'
                      )}
                    />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn('flex items-center gap-3 px-2', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {user?.email?.substring(0, 2).toUpperCase() || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email || 'Utilisateur'}
              </p>
              <p className="text-xs text-sidebar-muted">Administrateur</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-8 w-8 text-sidebar-muted hover:text-destructive hover:bg-destructive/10"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
