import { NavLink, useLocation } from 'react-router-dom';
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
  LogOut,
  Palmtree,
  HardHat,
  Bus,
  Car,
  PackageCheck,
  BookOpen,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAppSettings } from '@/hooks/useAppSettings';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/', module: 'dashboard' },
  { key: 'vehicles', icon: Truck, path: '/vehicles', module: 'vehicles' },
  { key: 'drivers', icon: Users, path: '/drivers', module: 'drivers' },
  { key: 'personnel', icon: UserCog, path: '/personnel', module: 'personnel' },
  { key: 'liveMap', icon: MapPin, path: '/live-map', module: 'live_map' },
  { key: 'missions', icon: Package, path: '/missions', module: 'missions' },
  { key: 'transportBTP', icon: HardHat, path: '/transport-btp', module: 'transport_btp' },
  { key: 'transportTouristique', icon: Palmtree, path: '/transport-touristique', module: 'transport_touristique' },
  { key: 'transportVoyageurs', icon: Bus, path: '/transport-voyageurs', module: 'transport_voyageurs' },
  { key: 'transportTMS', icon: PackageCheck, path: '/transport-tms', module: 'transport_tms' },
  { key: 'fuel', icon: Fuel, path: '/fuel', module: 'fuel' },
  { key: 'citerne', icon: Droplets, path: '/citerne', module: 'citerne' },
  { key: 'maintenance', icon: Wrench, path: '/maintenance', module: 'maintenance' },
  { key: 'stock', icon: Boxes, path: '/stock', module: 'stock' },
  { key: 'achats', icon: ShoppingCart, path: '/achats', module: 'achats' },
  { key: 'comptabilite', icon: BookOpen, path: '/comptabilite', module: 'comptabilite' },
  { key: 'finance', icon: DollarSign, path: '/finance', module: 'finance' },
  { key: 'reports', icon: FileText, path: '/reports', module: 'reports' },
  { key: 'alerts', icon: Bell, path: '/alerts', module: 'alerts', badge: 4 },
  { key: 'settings', icon: Settings, path: '/settings' },
];

export function Sidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { moduleSettings } = useAppSettings();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تسجيل الخروج',
        variant: 'destructive',
      });
    }
  };

  const filteredNavItems = navItems.filter(item => {
    if (!item.module || !moduleSettings) return true;
    return moduleSettings[item.module as keyof typeof moduleSettings] !== false;
  });

  return (
    <aside
      className={cn(
        'fixed top-0 h-screen w-64 bg-sidebar border-sidebar-border flex flex-col z-50',
        isRTL ? 'right-0 border-l' : 'left-0 border-r'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-info to-success flex items-center justify-center relative">
            <Truck className="w-3.5 h-3.5 text-white absolute left-1 top-1" />
            <Car className="w-3.5 h-3.5 text-white absolute right-1 top-1" />
            <Bus className="w-3.5 h-3.5 text-white absolute left-1 bottom-1" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Track parc</h1>
            <p className="text-[10px] text-sidebar-muted uppercase tracking-wider">Maroc</p>
          </div>
        </div>
      </div>

      {/* Company Selector */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">TM</span>
            </div>
            <div className={cn('text-left', isRTL && 'text-right')}>
              <p className="text-sm font-medium text-sidebar-foreground">Trans Maroc SARL</p>
              <p className="text-xs text-sidebar-muted">6 véhicules</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-sidebar-muted" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'nav-item relative',
                    isActive && 'nav-item-active'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{t(`nav.${item.key}`)}</span>
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
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {user?.email?.substring(0, 2).toUpperCase() || 'U'}
            </span>
          </div>
          <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.email || 'مستخدم'}
            </p>
            <p className="text-xs text-sidebar-muted">مدير</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-8 w-8 text-sidebar-muted hover:text-destructive"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
