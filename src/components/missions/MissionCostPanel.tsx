import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Mission } from '@/hooks/useMissions';
import { useDrivers } from '@/hooks/useDrivers';
import { useGPSwoxVehicles } from '@/hooks/useGPSwoxVehicles';

interface MissionCostPanelProps {
  missions: Mission[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0 }).format(amount) + ' MAD';

export function MissionCostPanel({ missions }: MissionCostPanelProps) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [driverId, setDriverId] = useState('all');
  const [vehicleId, setVehicleId] = useState('all');

  const { data: drivers = [] } = useDrivers();
  const { data: gpswoxVehicles = [] } = useGPSwoxVehicles();

  const delivered = missions.filter((m) => m.status === 'completed');

  const driverIds = Array.from(
    new Set(delivered.map((m) => m.driver_id).filter((id): id is string => !!id)),
  );
  const vehicleIds = Array.from(
    new Set(delivered.map((m) => m.vehicle_id).filter((id): id is string => !!id)),
  );

  const filtered = delivered.filter((m) => {
    if (fromDate && m.mission_date < fromDate) return false;
    if (toDate && m.mission_date > toDate) return false;
    if (driverId !== 'all' && m.driver_id !== driverId) return false;
    if (vehicleId !== 'all' && m.vehicle_id !== vehicleId) return false;
    return true;
  });

  const resolveDriverName = (id: string | null) =>
    id ? drivers.find((d) => d.id === id)?.name || id : 'N/A';

  const resolveVehicleLabel = (id: string) => {
    const v = gpswoxVehicles.find((veh) => String(veh.id) === id);
    if (v) return `${v.plate}`;
    return id;
  };

  const rows = filtered.map((m) => ({
    id: m.id,
    date: m.mission_date,
    route: `${m.departure_zone} → ${m.arrival_zone}`,
    driver: resolveDriverName(m.driver_id),
    vehicle: resolveVehicleLabel(m.vehicle_id),
    client: m.client || 'N/A',
    fuel: (m.fuel_cost || 0),
    extras: (m.extra_fees || 0),
    cash: (m.cash_amount || 0),
    total: (m.total_cost || 0),
  }));

  const chartData = rows.map((r) => ({
    name: r.route,
    total: r.total,
  }));

  const clientBreakdown = useMemo(() => {
    const result: { client: string; total: number; missions: number }[] = [];
    const map = new Map<string, { total: number; missions: number }>();
    rows.forEach((r) => {
      const key = r.client || 'N/A';
      const item = map.get(key) || { total: 0, missions: 0 };
      item.total += r.total;
      item.missions += 1;
      map.set(key, item);
    });
    map.forEach((value, key) => {
      result.push({ client: key, total: value.total, missions: value.missions });
    });
    return result.sort((a, b) => b.total - a.total);
  }, [rows]);

  const totalCost = rows.reduce((acc, r) => acc + r.total, 0);
  const missionsCount = rows.length;
  const averageCost = missionsCount ? totalCost / missionsCount : 0;

  const exportCsv = () => {
    const headers = [
      'Date',
      'Trajet',
      'Client',
      'Chauffeur',
      'Véhicule',
      'Carburant',
      'Frais_supp',
      'Montant_remis',
      'Total',
    ];
    const csvRows = rows.map((r) => {
      let dateStr = '';
      try {
        dateStr = new Date(r.date).toISOString().split('T')[0];
      } catch (e) {
        dateStr = r.date || '';
      }
      return [
        dateStr,
        r.route,
        r.client,
        r.driver,
        r.vehicle,
        r.fuel.toString(),
        r.extras.toString(),
        r.cash.toString(),
        r.total.toString(),
      ];
    });
    const csv = [headers, ...csvRows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `missions-cost-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Rapport des coûts missions livrées', 14, 18);
    doc.setFontSize(10);
    if (fromDate || toDate) {
      doc.text(
        `Période: ${fromDate || '...'} au ${toDate || '...'}`,
        14,
        24,
      );
    }

    const body = rows.map((r) => {
      let dateStr = '';
      try {
        dateStr = new Date(r.date).toLocaleDateString('fr-FR');
      } catch (e) {
        dateStr = r.date || '';
      }
      return [
        dateStr,
        r.route,
        r.client,
        r.driver,
        r.vehicle,
        formatCurrency(r.fuel),
        formatCurrency(r.extras),
        formatCurrency(r.cash),
        formatCurrency(r.total),
      ];
    });

    autoTable(doc, {
      head: [
        [
          'Date',
          'Trajet',
          'Client',
          'Chauffeur',
          'Véhicule',
          'Carburant',
          'Frais supp.',
          'Montant remis',
          'Total',
        ],
      ],
      body,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    const safeName = (fromDate || 'periode') + '_' + (toDate || 'courante');
    doc.save(`missions-cost-${safeName}.pdf`);
  };

  if (!rows.length) {
    return null;
  }

  return (
    <div className="space-y-4 mt-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>Filtres coûts</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              Export Excel (CSV)
            </Button>
            <Button variant="outline" size="sm" onClick={exportPdf}>
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Date début
            </label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Date fin
            </label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Chauffeur
            </label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les chauffeurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {driverIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {resolveDriverName(id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Véhicule
            </label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les véhicules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {vehicleIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {resolveVehicleLabel(id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des coûts (missions livrées)</CardTitle>
              <div className="text-xs text-muted-foreground text-right space-y-1">
                <div>{missionsCount} missions</div>
                <div>Coût moyen: {formatCurrency(averageCost)}</div>
                <div>Total: {formatCurrency(totalCost)}</div>
              </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Trajet</TableHead>
                <TableHead>Chauffeur</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Carburant</TableHead>
                <TableHead>Frais supp.</TableHead>
                <TableHead>Montant remis</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{new Date(row.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{row.route}</TableCell>
                  <TableCell>{row.driver}</TableCell>
                  <TableCell>{row.vehicle}</TableCell>
                  <TableCell>{formatCurrency(row.fuel)}</TableCell>
                  <TableCell>{formatCurrency(row.extras)}</TableCell>
                  <TableCell>{formatCurrency(row.cash)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(row.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coût par mission</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Breakdown par client</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Missions</TableHead>
                <TableHead className="text-right">Coût total</TableHead>
                <TableHead className="text-right">Coût moyen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientBreakdown.map((c) => (
                <TableRow key={c.client}>
                  <TableCell>{c.client}</TableCell>
                  <TableCell className="text-right">{c.missions}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.total)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(c.total / c.missions)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
