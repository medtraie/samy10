import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useConvertFactDocument, useFactDocumentDetails, useReplaceFactDocumentItems, useUpdateFactDocument, type FactDocumentType } from '@/hooks/useFacturation';
import { ArrowLeft, ArrowRightLeft, FileDown, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type EditableItem = {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_rate: number;
  tax_rate: number;
};

const nextTypeMap: Record<FactDocumentType, FactDocumentType | null> = {
  devis: 'bon_commande',
  bon_commande: 'bon_livraison',
  bon_livraison: 'facture',
  facture: null,
};

const statusWorkflowMap: Record<FactDocumentType, Array<{ value: string; label: string }>> = {
  devis: [
    { value: 'draft', label: 'Brouillon' },
    { value: 'sent', label: 'Envoyé' },
    { value: 'approved', label: 'Validé' },
    { value: 'rejected', label: 'Refusé' },
  ],
  bon_commande: [
    { value: 'draft', label: 'Brouillon' },
    { value: 'sent', label: 'Envoyé' },
    { value: 'approved', label: 'Validé' },
  ],
  bon_livraison: [
    { value: 'draft', label: 'Brouillon' },
    { value: 'sent', label: 'Envoyé' },
    { value: 'delivered', label: 'Livré' },
  ],
  facture: [
    { value: 'draft', label: 'Brouillon' },
    { value: 'sent', label: 'Envoyé' },
    { value: 'partial', label: 'Partiel' },
    { value: 'overdue', label: 'En retard' },
    { value: 'paid', label: 'Payé' },
  ],
};

export default function FacturationDetail() {
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();
  const { data, isLoading } = useFactDocumentDetails(documentId);
  const updateDoc = useUpdateFactDocument();
  const replaceItems = useReplaceFactDocumentItems();
  const convertDoc = useConvertFactDocument();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState(20);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [status, setStatus] = useState('draft');

  useEffect(() => {
    if (!data?.document) return;
    setClientName(data.document.client_name || '');
    setClientEmail(data.document.client_email || '');
    setClientPhone(data.document.client_phone || '');
    setClientAddress(data.document.client_address || '');
    setNotes(data.document.notes || '');
    setTaxRate(Number(data.document.tax_rate || 20));
    setDiscountAmount(Number(data.document.discount_amount || 0));
    setStatus(data.document.status || 'draft');
    setItems(
      data.items.length > 0
        ? data.items.map((item) => ({
            id: item.id,
            description: item.description || '',
            quantity: Number(item.quantity || 0),
            unit: item.unit || 'u',
            unit_price: Number(item.unit_price || 0),
            discount_rate: Number(item.discount_rate || 0),
            tax_rate: Number(item.tax_rate || 20),
          }))
        : [{ description: '', quantity: 1, unit: 'u', unit_price: 0, discount_rate: 0, tax_rate: 20 }]
    );
  }, [data?.document, data?.items]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + Number(item.quantity || 0) * Number(item.unit_price || 0) * (1 - Number(item.discount_rate || 0) / 100), 0);
    const tax = subtotal * (Number(taxRate || 0) / 100);
    const total = subtotal + tax - Number(discountAmount || 0);
    return { subtotal, tax, total };
  }, [items, taxRate, discountAmount]);

  const statusSteps = useMemo(() => {
    if (!data?.document) return [];
    return statusWorkflowMap[data.document.doc_type] || [];
  }, [data?.document]);

  const updateItem = (idx: number, patch: Partial<EditableItem>) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const buildDocumentPayload = (nextStatus: string) => {
    if (!data?.document) return null;
    return {
      id: data.document.id,
      status: nextStatus,
      client_name: clientName,
      client_email: clientEmail || null,
      client_phone: clientPhone || null,
      client_address: clientAddress || null,
      notes: notes || null,
      tax_rate: taxRate,
      discount_amount: discountAmount,
    };
  };

  const handleSave = () => {
    const payload = buildDocumentPayload(status);
    if (!data?.document || !payload) return;
    updateDoc.mutate(
      payload,
      {
        onSuccess: () => {
          replaceItems.mutate({
            documentId: data.document.id,
            items: items.map((item, idx) => ({
              line_order: idx + 1,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              discount_rate: item.discount_rate,
              tax_rate: item.tax_rate,
            })),
          });
        },
      }
    );
  };

  const handleStatusWorkflow = (nextStatus: string) => {
    const payload = buildDocumentPayload(nextStatus);
    if (!payload) return;
    setStatus(nextStatus);
    updateDoc.mutate(payload);
  };

  const handleConvert = () => {
    if (!data?.document) return;
    const nextType = nextTypeMap[data.document.doc_type];
    if (!nextType) return;
    convertDoc.mutate(
      { source_document_id: data.document.id, target_doc_type: nextType },
      {
        onSuccess: (doc) => navigate(`/facturation/${doc.id}`),
      }
    );
  };

  const handleExportPdf = () => {
    if (!data?.document) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${data.document.doc_number} (${data.document.doc_type})`, 12, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Client: ${clientName || '-'}`, 12, 21);
    doc.text(`Date: ${new Date(data.document.issue_date).toLocaleDateString('fr-FR')}`, 12, 27);
    autoTable(doc, {
      startY: 33,
      head: [['Description', 'Qté', 'PU', 'Rem%', 'TVA%', 'Total']],
      body: items.map((item) => {
        const lineTotal = Number(item.quantity || 0) * Number(item.unit_price || 0) * (1 - Number(item.discount_rate || 0) / 100) * (1 + Number(item.tax_rate || 0) / 100);
        return [
          item.description || '-',
          Number(item.quantity || 0).toFixed(2),
          Number(item.unit_price || 0).toFixed(2),
          Number(item.discount_rate || 0).toFixed(2),
          Number(item.tax_rate || 0).toFixed(2),
          lineTotal.toFixed(2),
        ];
      }),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 120;
    doc.setFontSize(10);
    doc.text(`Sous-total: ${totals.subtotal.toFixed(2)} MAD`, 140, finalY + 8);
    doc.text(`TVA: ${totals.tax.toFixed(2)} MAD`, 140, finalY + 13);
    doc.text(`Remise: ${Number(discountAmount || 0).toFixed(2)} MAD`, 140, finalY + 18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${totals.total.toFixed(2)} MAD`, 140, finalY + 24);
    doc.save(`${data.document.doc_number}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Détail Document</h1>
            <p className="text-muted-foreground">Consultation détaillée du document de facturation</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/facturation')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
        </div>

        {isLoading ? (
          <Card><CardContent className="py-10 text-sm text-muted-foreground">Chargement...</CardContent></Card>
        ) : !data?.document ? (
          <Card><CardContent className="py-10 text-sm text-muted-foreground">Document introuvable.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <Card className="xl:col-span-8">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle>{data.document.doc_number}</CardTitle>
                    <CardDescription>{data.document.doc_type} · {new Date(data.document.issue_date).toLocaleDateString('fr-FR')}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{data.document.status}</Badge>
                    <Button size="sm" variant="outline" onClick={handleExportPdf}>
                      <FileDown className="w-4 h-4 mr-1" />
                      Export PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleConvert} disabled={!nextTypeMap[data.document.doc_type] || convertDoc.isPending}>
                      <ArrowRightLeft className="w-4 h-4 mr-1" />
                      Convertir
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={updateDoc.isPending || replaceItems.isPending}>
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Client</Label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Téléphone</Label>
                    <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Workflow statut</Label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusSteps.map((step) => (
                        <Button
                          key={step.value}
                          size="sm"
                          variant={status === step.value ? 'default' : 'outline'}
                          onClick={() => handleStatusWorkflow(step.value)}
                          disabled={updateDoc.isPending}
                        >
                          {step.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Adresse</Label>
                    <Textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} rows={2} />
                  </div>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">PU</TableHead>
                        <TableHead className="text-right">TVA</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune ligne.</TableCell></TableRow>
                      ) : (
                        items.map((item, idx) => (
                          <TableRow key={item.id}>
                            <TableCell><Input value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })} /></TableCell>
                            <TableCell className="text-right"><Input type="number" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value || 0) })} /></TableCell>
                            <TableCell className="text-right"><Input type="number" value={item.unit_price} onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value || 0) })} /></TableCell>
                            <TableCell className="text-right"><Input type="number" value={item.tax_rate} onChange={(e) => updateItem(idx, { tax_rate: Number(e.target.value || 0) })} /></TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <span>{(Number(item.quantity || 0) * Number(item.unit_price || 0) * (1 - Number(item.discount_rate || 0) / 100) * (1 + Number(item.tax_rate || 0) / 100)).toFixed(2)} MAD</span>
                                <Button size="icon" variant="ghost" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, { description: '', quantity: 1, unit: 'u', unit_price: 0, discount_rate: 0, tax_rate: taxRate }])}>
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter ligne
                  </Button>
                  <div className="flex items-center gap-2">
                    <Label>TVA globale</Label>
                    <Input className="w-[100px]" type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value || 0))} />
                    <Label>Remise</Label>
                    <Input className="w-[120px]" type="number" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value || 0))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
                <div className="ml-auto max-w-sm space-y-1 text-sm">
                  <div className="flex justify-between"><span>Sous-total</span><span>{totals.subtotal.toFixed(2)} MAD</span></div>
                  <div className="flex justify-between"><span>TVA</span><span>{totals.tax.toFixed(2)} MAD</span></div>
                  <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{totals.total.toFixed(2)} MAD</span></div>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-4">
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>Historique du document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.events.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Aucun événement.</div>
                ) : (
                  data.events.map((event) => (
                    <div key={event.id} className="border rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <div className="text-sm font-medium">{event.event_label}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(event.created_at).toLocaleString('fr-FR')}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
