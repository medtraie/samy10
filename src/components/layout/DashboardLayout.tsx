import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const sidebarMarginClass = isRTL
    ? isSidebarCollapsed
      ? 'mr-20'
      : 'mr-64'
    : isSidebarCollapsed
      ? 'ml-20'
      : 'ml-64';

  return (
    <div
      className={`min-h-screen bg-background text-foreground ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <div className={`${sidebarMarginClass} min-h-screen flex flex-col transition-[margin] duration-300`}>
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
