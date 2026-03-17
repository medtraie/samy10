import { useTranslation } from 'react-i18next';
import { Bell, Search, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function Topbar() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <header className="h-16 border-b border-slate-200/70 bg-white/80 dark:bg-card/90 backdrop-blur-md flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className={cn(
            'absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground',
            isRTL ? 'right-3' : 'left-3'
          )} />
          <Input
            type="search"
            placeholder={t('common.search')}
            className={cn(
              'w-full h-10 bg-white/60 dark:bg-muted/60 border border-slate-200/70 dark:border-border rounded-full text-sm shadow-[0_0_0_1px_rgba(148,163,184,0.15)] focus-visible:ring-1 focus-visible:ring-sky-500 focus-visible:border-sky-500 transition-colors',
              isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
            )}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Globe className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
            <DropdownMenuItem onClick={() => toggleLanguage('fr')}>
              <span className="mr-2">🇫🇷</span> Français
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
            4
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center">
                <span className="text-xs font-bold text-white">MA</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
            <DropdownMenuItem>{t('user.profile')}</DropdownMenuItem>
            <DropdownMenuItem>{t('user.settings')}</DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onSelect={async (e) => {
                e.preventDefault();
                const { error } = await signOut();
                navigate('/auth', { replace: true });
                if (error) {
                  toast.error(`Erreur lors de la déconnexion: ${error.message}`);
                }
              }}
            >
              {t('user.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
