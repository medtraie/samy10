import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import {
  Truck,
  Package,
  AlertTriangle,
  Fuel,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { AlertItem } from '@/components/dashboard/AlertItem';
import { Button } from '@/components/ui/button';
import { useGPSwoxVehicles } from '@/hooks/useGPSwoxVehicles';
import { useGPSwoxAlerts } from '@/hooks/useGPSwoxAlerts';
import { useMissions } from '@/hooks/useMissions';
import { useFuelLogs } from '@/hooks/useFuelLogs';
import { useComputedRevisions } from '@/hooks/useRevisions';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { t } = useTranslation();
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const { data: vehicles = [] } = useGPSwoxVehicles(60000);
  const { data: alertsResponse } = useGPSwoxAlerts(60000);
  const { data: missions = [] } = useMissions();
  const { data: fuelLogs = [] } = useFuelLogs();
  const { revisions = [] } = useComputedRevisions();
  const now = new Date();
  const rangeStart = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (rangeDays - 1));
    return start;
  }, [rangeDays]);

  const toDate = (value: string) => (value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`));
  const isInRange = (value?: string | null) => {
    if (!value) return false;
    const date = toDate(value);
    if (Number.isNaN(date.getTime())) return false;
    return date >= rangeStart && date <= now;
  };

  const filteredAlerts = useMemo(
    () => (alertsResponse?.alerts || []).filter((alert) => isInRange(alert.timestamp)),
    [alertsResponse?.alerts, rangeStart, now]
  );
  const filteredMissions = useMemo(
    () => missions.filter((mission) => isInRange(mission.mission_date)),
    [missions, rangeStart, now]
  );
  const filteredFuelLogs = useMemo(
    () => fuelLogs.filter((log) => isInRange(log.log_date)),
    [fuelLogs, rangeStart, now]
  );
  const filteredRevisions = useMemo(
    () => revisions.filter((revision) => isInRange(revision.updated_at)),
    [revisions, rangeStart, now]
  );

  const totalVehicles = vehicles.length;
  const activeVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          vehicle.online === 'online' ||
          vehicle.status === 'active' ||
          vehicle.status === 'moving'
      ).length,
    [vehicles]
  );

  const ongoingMissions = useMemo(
    () => filteredMissions.filter((mission) => mission.status === 'in_progress').length,
    [filteredMissions]
  );

  const recentMissions = useMemo(
    () =>
      [...filteredMissions]
        .sort((a, b) => toDate(b.mission_date).getTime() - toDate(a.mission_date).getTime())
        .slice(0, 4),
    [filteredMissions]
  );

  const pendingAlerts = filteredAlerts.length;
  const dashboardAlerts = useMemo(
    () =>
      filteredAlerts.slice(0, 4).map((alert) => ({
        id: alert.id,
        type:
          alert.type === 'speed'
            ? ('overspeed' as const)
            : alert.type === 'maintenance'
            ? ('maintenance' as const)
            : ('fuel' as const),
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp,
        vehiclePlate: alert.device_name,
        status: alert.acknowledged ? ('acknowledged' as const) : ('new' as const),
      })),
    [filteredAlerts]
  );

  const periodFuelCost = useMemo(
    () => filteredFuelLogs.reduce((sum, log) => sum + Number(log.total_cost || 0), 0),
    [filteredFuelLogs]
  );

  const upcomingMaintenance = useMemo(
    () => filteredRevisions.filter((revision) => revision.status === 'due' || revision.status === 'overdue').length,
    [filteredRevisions]
  );

  const fleetAvailability = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;

  const fuelConsumptionByMonth = useMemo(() => {
    const points = rangeDays === 7 ? 7 : rangeDays === 30 ? 10 : 12;
    const segmentSize = Math.ceil(rangeDays / points);
    const segments = Array.from({ length: points }, (_, index) => {
      const segmentStart = new Date(rangeStart);
      segmentStart.setDate(rangeStart.getDate() + index * segmentSize);
      const segmentEnd = new Date(segmentStart);
      segmentEnd.setDate(segmentStart.getDate() + segmentSize - 1);
      const key = `${segmentStart.toISOString().slice(0, 10)}_${segmentEnd.toISOString().slice(0, 10)}`;
      return {
        key,
        month:
          rangeDays === 90
            ? segmentStart.toLocaleDateString('fr-FR', { month: 'short' })
            : segmentStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        start: segmentStart,
        end: segmentEnd,
        consumption: 0,
        cost: 0,
      };
    });
    filteredFuelLogs.forEach((log) => {
      const date = new Date(log.log_date);
      const target = segments.find((segment) => date >= segment.start && date <= segment.end);
      if (target) {
        target.consumption += Number(log.liters || 0);
        target.cost += Number(log.total_cost || 0);
      }
    });
    return segments.map((item) => ({
      month: item.month,
      consumption: Number(item.consumption.toFixed(2)),
      cost: Number(item.cost.toFixed(2)),
    }));
  }, [filteredFuelLogs, rangeDays, rangeStart]);

  const fleetAvailabilityByDay = useMemo(() => {
    const points = rangeDays === 90 ? 30 : rangeDays;
    const days = Array.from({ length: points }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (points - 1 - index));
      const key = date.toISOString().slice(0, 10);
      const missionsCount = filteredMissions.filter(
        (mission) => mission.mission_date === key && mission.status !== 'cancelled'
      ).length;
      return {
        day: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        available: Math.max(activeVehicles - missionsCount, 0),
      };
    });
    return days;
  }, [filteredMissions, now, activeVehicles, rangeDays]);

  const vehiclePlateById = useMemo(() => {
    const map = new Map<string, string>();
    vehicles.forEach((vehicle) => map.set(String(vehicle.id), vehicle.plate));
    return map;
  }, [vehicles]);

  const costByVehicle = useMemo(() => {
    const costs = new Map<string, { plate: string; fuel: number; maintenance: number; other: number }>();

    filteredFuelLogs.forEach((log) => {
      const plate = vehiclePlateById.get(String(log.vehicle_id)) || String(log.vehicle_id);
      const current = costs.get(plate) || { plate, fuel: 0, maintenance: 0, other: 0 };
      current.fuel += Number(log.total_cost || 0);
      costs.set(plate, current);
    });

    filteredRevisions.forEach((revision) => {
      if (!revision.cost) return;
      const plate = revision.vehicle_plate;
      const current = costs.get(plate) || { plate, fuel: 0, maintenance: 0, other: 0 };
      current.maintenance += Number(revision.cost || 0);
      costs.set(plate, current);
    });

    return Array.from(costs.values())
      .sort((a, b) => b.fuel + b.maintenance + b.other - (a.fuel + a.maintenance + a.other))
      .slice(0, 6);
  }, [filteredFuelLogs, filteredRevisions, vehiclePlateById]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-border p-1 bg-background/60">
              {[7, 30, 90].map((days) => (
                <Button
                  key={days}
                  variant={rangeDays === days ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setRangeDays(days as 7 | 30 | 90)}
                >
                  {days}j
                </Button>
              ))}
            </div>
            <Button variant="outline">{t('common.export')}</Button>
            <Button>{t('vehicles.addVehicle')}</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title={t('dashboard.activeVehicles')}
            value={`${activeVehicles}/${totalVehicles}`}
            icon={Truck}
            subtitle={`${fleetAvailability.toFixed(0)}% disponible`}
            variant="default"
          />
          <KPICard
            title={t('dashboard.ongoingMissions')}
            value={ongoingMissions}
            icon={Package}
            subtitle={t('dashboard.today')}
            variant="success"
          />
          <KPICard
            title={t('dashboard.pendingAlerts')}
            value={pendingAlerts}
            icon={AlertTriangle}
            variant="warning"
          />
          <KPICard
            title={t('dashboard.monthlyFuelCost')}
            value={`${(periodFuelCost / 1000).toFixed(1)}K`}
            subtitle={`MAD • ${rangeDays} jours`}
            icon={Fuel}
            variant="accent"
          />
          <KPICard
            title={t('dashboard.upcomingMaintenance')}
            value={upcomingMaintenance}
            icon={Wrench}
            subtitle="Cette semaine"
            variant="destructive"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 dashboard-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">{t('dashboard.fuelConsumption')}</h3>
                <p className="text-sm text-muted-foreground">{rangeDays} derniers jours</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Consommation (L)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-info" />
                  <span className="text-muted-foreground">Coût (MAD)</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={fuelConsumptionByMonth}>
                <defs>
                  <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#42e8e0" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#42e8e0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.28)" />
                <XAxis dataKey="month" stroke="rgba(148,163,184,0.9)" fontSize={12} />
                <YAxis stroke="rgba(148,163,184,0.9)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15,23,42,0.96)',
                    border: '1px solid rgba(148,163,184,0.5)',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="consumption"
                  stroke="#42e8e0"
                  strokeWidth={2.4}
                  fill="url(#colorConsumption)"
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#00b4ff"
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="dashboard-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">{t('dashboard.fleetAvailability')}</h3>
                <p className="text-sm text-muted-foreground">{rangeDays} derniers jours</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={fleetAvailabilityByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.28)" />
                <XAxis dataKey="day" stroke="rgba(148,163,184,0.9)" fontSize={12} />
                <YAxis stroke="rgba(148,163,184,0.9)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15,23,42,0.96)',
                    border: '1px solid rgba(148,163,184,0.5)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="available" fill="#42e8e0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="dashboard-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">{t('dashboard.recentAlerts')}</h3>
              <Link to="/alerts">
                <Button variant="ghost" size="sm" className="text-primary">
                  {t('dashboard.viewAll')}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {dashboardAlerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
              {dashboardAlerts.length === 0 && (
                <div className="text-sm text-muted-foreground">Aucune alerte récente</div>
              )}
            </div>
          </div>

          <div className="dashboard-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">{t('dashboard.costByVehicle')}</h3>
                <p className="text-sm text-muted-foreground">{rangeDays} derniers jours</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(173, 58%, 39%)' }} />
                  <span>Carburant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(199, 89%, 48%)' }} />
                  <span>Maintenance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(25, 95%, 53%)' }} />
                  <span>Autres</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={costByVehicle} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.28)" />
                <XAxis type="number" stroke="rgba(148,163,184,0.9)" fontSize={10} />
                <YAxis dataKey="plate" type="category" stroke="rgba(148,163,184,0.9)" fontSize={10} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15,23,42,0.96)',
                    border: '1px solid rgba(148,163,184,0.5)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} MAD`]}
                />
                <Bar dataKey="fuel" stackId="a" fill="#42e8e0" />
                <Bar dataKey="maintenance" stackId="a" fill="#00b4ff" />
                <Bar dataKey="other" stackId="a" fill="#56ddA3" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="dashboard-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">{t('dashboard.recentMissions')}</h3>
              <Link to="/missions">
                <Button variant="ghost" size="sm" className="text-primary">
                  {t('dashboard.viewAll')}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{mission.reference}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {mission.departure_zone} → {mission.arrival_zone}
                    </p>
                  </div>
                  <span
                    className={`status-badge ${
                      mission.status === 'completed'
                        ? 'status-active'
                        : mission.status === 'in_progress'
                        ? 'status-warning'
                        : 'status-inactive'
                    }`}
                  >
                    {mission.status === 'completed'
                      ? 'Livrée'
                      : mission.status === 'in_progress'
                      ? 'En cours'
                      : 'Planifiée'}
                  </span>
                </div>
              ))}
              {recentMissions.length === 0 && (
                <div className="text-sm text-muted-foreground">Aucune mission récente</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
