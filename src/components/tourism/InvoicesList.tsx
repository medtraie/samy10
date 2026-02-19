import { useState } from 'react';
import { useTourismInvoices, useUpdateTourismInvoice, useDeleteTourismInvoice, TourismInvoice } from '@/hooks/useTourism';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Calendar, Trash2, User, DollarSign, 
  Send, CheckCircle, XCircle, FileDown, Eye 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function InvoicesList() {
  const { data: invoices, isLoading } = useTourismInvoices();
  const deleteInvoice = useDeleteTourismInvoice();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<TourismInvoice | null>(null);

  const handleOpenDetails = (invoice: TourismInvoice) => {
    setSelectedInvoice(invoice);
    setDetailsOpen(true);
  };

  const handleDownloadPdf = (invoice: TourismInvoice) => {
    const doc = new jsPDF();
    const formatCurrency = (value: number) => `${value.toFixed(2)} MAD`;
    
    // Header background
    doc.setFillColor(22, 78, 99);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Track parc', 14, 18);
    doc.setFontSize(11);
    doc.text('Facture Touristique', 14, 26);

    // Invoice Info
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(18);
    doc.text(`FAC ${invoice.invoice_number}`, 196, 20, { align: 'right' });
    doc.setFontSize(10);
    const statusLabel = {
      draft: 'Brouillon',
      sent: 'Envoyée',
      paid: 'Payée',
      cancelled: 'Annulée'
    }[invoice.status] || invoice.status;
    doc.text(`Statut: ${statusLabel}`, 196, 26, { align: 'right' });
    doc.text(`Date: ${format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}`, 196, 31, { align: 'right' });

    // Client Info
    doc.setFontSize(11);
    doc.text('Client', 14, 42);
    doc.setFontSize(12);
    doc.text(invoice.client?.name || 'Client inconnu', 14, 48);
    doc.setFontSize(10);
    if (invoice.client?.address) {
      doc.text(invoice.client.address, 14, 54);
    }
    if (invoice.mission) {
      doc.text(`Mission: ${invoice.mission.reference}`, 14, invoice.client?.address ? 60 : 54);
    }

    // Summary Card
    const summaryY = 70;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, summaryY, 182, 26, 3, 3, 'FD');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    
    doc.text('Type', 20, summaryY + 10);
    doc.text('Montant HT', 80, summaryY + 10); // Changed position
    doc.text('TVA', 140, summaryY + 10); // Changed position
    
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    
    const billingTypeLabels: Record<string, string> = {
      flat: 'Forfait',
      hourly: 'Tarif horaire',
      per_km: 'Prix/km',
      custom: 'Personnalisé',
    };
    
    doc.text(billingTypeLabels[invoice.billing_type] || invoice.billing_type, 20, summaryY + 20);
    doc.text(formatCurrency(invoice.subtotal), 80, summaryY + 20);
    doc.text(`${invoice.tax_rate}%`, 140, summaryY + 20);

    // Prepare table data
    let rows: any[] = [];
    if (invoice.billing_type === 'custom' && invoice.custom_lines) {
      rows = invoice.custom_lines.map(line => [
        line.description,
        line.quantity.toString(),
        formatCurrency(line.unit_price),
        formatCurrency(line.total)
      ]);
    } else if (invoice.billing_type === 'flat') {
      rows = [[
        'Forfait mission',
        '1',
        formatCurrency(invoice.flat_rate),
        formatCurrency(invoice.flat_rate)
      ]];
    } else if (invoice.billing_type === 'hourly') {
      rows = [[
        'Heures travaillées',
        invoice.hours_worked.toString(),
        formatCurrency(invoice.hourly_rate),
        formatCurrency(invoice.hours_worked * invoice.hourly_rate)
      ]];
    } else if (invoice.billing_type === 'per_km') {
      rows = [[
        'Kilométrage',
        invoice.kilometers.toString(),
        formatCurrency(invoice.per_km_rate),
        formatCurrency(invoice.kilometers * invoice.per_km_rate)
      ]];
    }

    // Table
    const totalY = summaryY + 36;
    
    autoTable(doc, {
      startY: totalY + 16,
      head: [['Description', 'Qté', 'Prix Unitaire', 'Total']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [22, 78, 99], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
    });

    // Total TTC
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Total TTC', 196, finalY, { align: 'right' });
    doc.setFontSize(16);
    doc.text(formatCurrency(invoice.total_amount), 196, finalY + 8, { align: 'right' });

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 18, 196, pageHeight - 18);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Merci pour votre confiance', 14, pageHeight - 10);

    doc.save(`Facture-${invoice.invoice_number}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!invoices?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Aucune facture</p>
        <p className="text-sm">Créez votre première facture touristique</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {invoices.map((invoice) => (
          <InvoiceCard 
            key={invoice.id} 
            invoice={invoice} 
            onDelete={() => deleteInvoice.mutate(invoice.id)}
            onDownload={() => handleDownloadPdf(invoice)}
            onViewDetails={() => handleOpenDetails(invoice)}
          />
        ))}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails de la facture {selectedInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedInvoice.client?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedInvoice.invoice_date), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge variant="outline">{selectedInvoice.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total TTC</p>
                  <p className="font-bold text-lg">{selectedInvoice.total_amount.toFixed(2)} MAD</p>
                </div>
              </div>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Lignes de facture</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">Prix Unitaire</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.billing_type === 'custom' && selectedInvoice.custom_lines ? (
                        selectedInvoice.custom_lines.map((line, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{line.description}</TableCell>
                            <TableCell className="text-right">{line.quantity}</TableCell>
                            <TableCell className="text-right">{line.unit_price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{line.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell>
                            {selectedInvoice.billing_type === 'flat' ? 'Forfait mission' :
                             selectedInvoice.billing_type === 'hourly' ? 'Heures travaillées' :
                             selectedInvoice.billing_type === 'per_km' ? 'Kilométrage' : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {selectedInvoice.billing_type === 'flat' ? '1' :
                             selectedInvoice.billing_type === 'hourly' ? selectedInvoice.hours_worked :
                             selectedInvoice.billing_type === 'per_km' ? selectedInvoice.kilometers : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {selectedInvoice.billing_type === 'flat' ? selectedInvoice.flat_rate.toFixed(2) :
                             selectedInvoice.billing_type === 'hourly' ? selectedInvoice.hourly_rate.toFixed(2) :
                             selectedInvoice.billing_type === 'per_km' ? selectedInvoice.per_km_rate.toFixed(2) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {(selectedInvoice.subtotal).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4 text-sm">
                <div className="space-y-1 text-right">
                  <p><span className="text-muted-foreground">Sous-total:</span> {selectedInvoice.subtotal.toFixed(2)} MAD</p>
                  <p><span className="text-muted-foreground">TVA ({selectedInvoice.tax_rate}%):</span> {selectedInvoice.tax_amount.toFixed(2)} MAD</p>
                  <p className="font-bold text-lg pt-2 border-t">Total: {selectedInvoice.total_amount.toFixed(2)} MAD</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface InvoiceCardProps {
  invoice: TourismInvoice;
  onDelete: () => void;
  onDownload: () => void;
  onViewDetails: () => void;
}

function InvoiceCard({ invoice, onDelete, onDownload, onViewDetails }: InvoiceCardProps) {
  const updateInvoice = useUpdateTourismInvoice();

  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800', icon: <FileText className="w-3 h-3" /> },
    sent: { label: 'Envoyée', className: 'bg-blue-100 text-blue-800', icon: <Send className="w-3 h-3" /> },
    paid: { label: 'Payée', className: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
    cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
  };

  const billingTypeLabels: Record<string, string> = {
    flat: 'Forfait',
    hourly: 'Tarif horaire',
    per_km: 'Prix/km',
    custom: 'Devis personnalisé',
  };

  const status = statusConfig[invoice.status] || statusConfig.draft;

  const handleStatusChange = (newStatus: TourismInvoice['status']) => {
    updateInvoice.mutate({ id: invoice.id, status: newStatus });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {invoice.invoice_number}
              </Badge>
              <Badge className={cn('text-xs flex items-center gap-1', status.className)}>
                {status.icon}
                {status.label}
              </Badge>
            </div>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {invoice.total_amount.toFixed(2)} MAD
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(invoice.invoice_date), 'dd MMM yyyy', { locale: fr })}</span>
          </div>
          {invoice.client && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="truncate">{invoice.client.name}</span>
            </div>
          )}
          <div className="text-muted-foreground">
            <span className="text-xs uppercase">Type:</span>{' '}
            <span>{billingTypeLabels[invoice.billing_type]}</span>
          </div>
          {invoice.mission && (
            <div className="text-muted-foreground text-xs">
              Mission: {invoice.mission.reference}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Sous-total: {invoice.subtotal.toFixed(2)} MAD</span>
          <span>TVA ({invoice.tax_rate}%): {invoice.tax_amount.toFixed(2)} MAD</span>
        </div>

        <div className="flex gap-2 pt-2">
            {invoice.status === 'draft' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange('sent')}>
                <Send className="w-4 h-4 mr-1" />
                Envoyer
              </Button>
            )}
            {invoice.status === 'sent' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange('paid')}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Marquer payée
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onViewDetails}>
              <Eye className="w-4 h-4 mr-1" />
              Détails
            </Button>
            <Button size="sm" variant="ghost" onClick={onDownload}>
              <FileDown className="w-4 h-4 mr-1" />
              PDF
            </Button>
            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleStatusChange('cancelled')}>
                Annuler
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer la facture ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. La facture {invoice.invoice_number} sera définitivement supprimée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    );
  }
