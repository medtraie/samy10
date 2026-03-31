import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVoyages, useTrajets, useChantiers, useFactures } from '@/hooks/useTransportBTP';
import { Truck, MapPin, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function TransportBTPDashboard() {
  const { data: voyages = [] } = useVoyages();
  const { data: trajets = [] } = useTrajets();
  const { data: chantiers = [] } = useChantiers();
  const { data: factures = [] } = useFactures();

  const stats = useMemo(() => {
    const totalVoyages = voyages.length;
    const completedVoyages = voyages.filter((v) => v.status === 'completed').length;
    const totalTonnage = voyages.reduce((sum, v) => sum + Number(v.tonnage || 0), 0);
    const totalFactureAmount = factures.reduce((sum, f) => sum + Number(f.total_with_tax || 0), 0);

    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const chartData = last7Days.map(date => {
      const dayVoyages = voyages.filter(v => v.voyage_date.startsWith(date));
      return {
        date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        voyages: dayVoyages.length,
        tonnage: dayVoyages.reduce((sum, v) => sum + Number(v.tonnage || 0), 0)
      };
    });

    return {
      totalVoyages,
      completedVoyages,
      totalTonnage,
      totalFactureAmount,
      totalTrajets: trajets.length,
      totalChantiers: chantiers.length,
      chartData
    };
  }, [voyages, trajets, chantiers, factures]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dashboard-panel kpi-card">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Voyages</p>
                <h3 className="text-2xl font-bold">{stats.totalVoyages}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" />
              <span className="text-emerald-500 font-medium">{stats.completedVoyages}</span>
              <span className="text-muted-foreground ml-1">terminés</span>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-panel kpi-card kpi-card-accent">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 text-accent rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tonnage Global</p>
                <h3 className="text-2xl font-bold">{stats.totalTonnage.toLocaleString('fr-FR')} T</h3>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Volume total transporté
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-panel kpi-card kpi-card-success">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chiffre d'Affaires</p>
                <h3 className="text-2xl font-bold">{stats.totalFactureAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-sm font-normal">MAD</span></h3>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Basé sur {factures.length} facture(s)
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-panel kpi-card kpi-card-warning">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Réseau BTP</p>
                <h3 className="text-2xl font-bold">{stats.totalChantiers}</h3>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {stats.totalTrajets} trajets configurés
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Activité des 7 derniers jours (Voyages)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                <XAxis dataKey="date" stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="voyages" name="Voyages" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Volume transporté (Tonnage)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                <XAxis dataKey="date" stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="tonnage" name="Tonnage (T)" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
