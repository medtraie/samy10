import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTourismCompanyProfile } from '@/hooks/useTourismCompany';
import {
  FactDirection,
  FactDocumentItem,
  FactDocumentType,
  FactLanguage,
  FactTemplateType,
  useConvertFactDocument,
  useCreateFactDocument,
  useFactDocumentDetails,
  useFactDocuments,
  useFactQuickStats,
  useCreateFactDocumentEvent,
  useReplaceFactDocumentItems,
  useSendFactDocumentEmail,
  useSendFactDocumentWhatsApp,
  useUpdateFactDocument,
} from '@/hooks/useFacturation';
import { ArrowRightLeft, Eye, FileDown, FileSpreadsheet, FileText, Mail, MessageCircle, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type EditorState = {
  id?: string;
  doc_type: FactDocumentType;
  status: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  issue_date: string;
  due_date: string;
  language: FactLanguage;
  direction: FactDirection;
  template_type: FactTemplateType;
  show_header: boolean;
  show_footer: boolean;
  notes: string;
  tax_rate: number;
  discount_amount: number;
  custom_columns: string[];
  source_document_id?: string | null;
  items: Array<Partial<FactDocumentItem>>;
};

const defaultItem = (): Partial<FactDocumentItem> => ({
  description: '',
  quantity: 1,
  unit: 'u',
  unit_price: 0,
  discount_rate: 0,
  tax_rate: 20,
  extra_fields: {},
});

const defaultEditor = (): EditorState => ({
  doc_type: 'devis',
  status: 'draft',
  client_name: '',
  client_email: '',
  client_phone: '',
  client_address: '',
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  language: 'fr',
  direction: 'ltr',
  template_type: 'classic',
  show_header: true,
  show_footer: true,
  notes: '',
  tax_rate: 20,
  discount_amount: 0,
  custom_columns: [],
  items: [defaultItem()],
});

const nextTypeMap: Record<FactDocumentType, FactDocumentType | null> = {
  devis: 'bon_commande',
  bon_commande: 'bon_livraison',
  bon_livraison: 'facture',
  facture: null,
};

const templateClassMap: Record<FactTemplateType, string> = {
  classic: 'bg-white text-slate-900 border border-slate-300',
  modern: 'bg-gradient-to-br from-slate-50 to-blue-50 text-slate-900 border border-blue-200',
  minimalist: 'bg-white text-slate-900 border border-slate-200',
  creative: 'bg-gradient-to-br from-violet-50 via-white to-pink-50 text-slate-900 border border-violet-200',
};

export default function Facturation() {
  const { data: docs = [], isLoading: docsLoading } = useFactDocuments();
  const { data: stats } = useFactQuickStats();
  const { data: company } = useTourismCompanyProfile();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [customColumnDraft, setCustomColumnDraft] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [editor, setEditor] = useState<EditorState>(defaultEditor());
  const detailsQ = useFactDocumentDetails(selectedId);
  const createDoc = useCreateFactDocument();
  const convertDoc = useConvertFactDocument();
  const updateDoc = useUpdateFactDocument();
  const replaceItems = useReplaceFactDocumentItems();
  const createEvent = useCreateFactDocumentEvent();
  const sendEmail = useSendFactDocumentEmail();
  const sendWhatsApp = useSendFactDocumentWhatsApp();

  useEffect(() => {
    if (!detailsQ.data?.document) return;
    const d = detailsQ.data.document;
    setEditor({
      id: d.id,
      doc_type: d.doc_type,
      status: d.status,
      client_name: d.client_name,
      client_email: d.client_email || '',
      client_phone: d.client_phone || '',
      client_address: d.client_address || '',
      issue_date: d.issue_date,
      due_date: d.due_date || '',
      language: d.language,
      direction: d.direction,
      template_type: d.template_type,
      show_header: d.show_header,
      show_footer: d.show_footer,
      notes: d.notes || '',
      tax_rate: Number(d.tax_rate || 20),
      discount_amount: Number(d.discount_amount || 0),
      custom_columns: Array.isArray(d.custom_columns) ? d.custom_columns : [],
      source_document_id: d.source_document_id,
      items: detailsQ.data.items.length > 0 ? detailsQ.data.items : [defaultItem()],
    });
  }, [detailsQ.data]);

  const previewTotals = useMemo(() => {
    const subtotal = editor.items.reduce((acc, item) => {
      const qty = Number(item.quantity || 0);
      const unit = Number(item.unit_price || 0);
      const disc = Number(item.discount_rate || 0);
      return acc + qty * unit * (1 - disc / 100);
    }, 0);
    const tax = subtotal * (Number(editor.tax_rate || 0) / 100);
    const total = subtotal + tax - Number(editor.discount_amount || 0);
    return { subtotal, tax, total };
  }, [editor.items, editor.tax_rate, editor.discount_amount]);

  const timeline = detailsQ.data?.events || [];

  const updateItem = (idx: number, patch: Partial<FactDocumentItem>) => {
    setEditor((prev) => {
      const next = [...prev.items];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, items: next };
    });
  };

  const updateItemExtra = (idx: number, key: string, value: string) => {
    setEditor((prev) => {
      const next = [...prev.items];
      const current = next[idx]?.extra_fields || {};
      next[idx] = {
        ...next[idx],
        extra_fields: {
          ...(current as Record<string, string>),
          [key]: value,
        },
      };
      return { ...prev, items: next };
    });
  };

  const addCustomColumn = () => {
    const value = customColumnDraft.trim();
    if (!value) return;
    if (editor.custom_columns.includes(value)) return;
    setEditor((prev) => ({ ...prev, custom_columns: [...prev.custom_columns, value] }));
    setCustomColumnDraft('');
  };

  const removeCustomColumn = (name: string) => {
    setEditor((prev) => ({
      ...prev,
      custom_columns: prev.custom_columns.filter((c) => c !== name),
      items: prev.items.map((item) => {
        const extra = { ...(item.extra_fields as Record<string, string> | undefined) };
        if (extra) delete extra[name];
        return { ...item, extra_fields: extra };
      }),
    }));
  };

  const handleNew = (docType: FactDocumentType) => {
    const direction = editor.language === 'ar' ? 'rtl' : 'ltr';
    setSelectedId(undefined);
    setEditor({
      ...defaultEditor(),
      doc_type: docType,
      direction,
      language: editor.language,
      client_name: '',
      client_email: '',
      client_phone: '',
      client_address: '',
      items: [defaultItem()],
    });
  };

  const handleSave = () => {
    if (!editor.client_name.trim()) return;
    if (editor.id) {
      updateDoc.mutate(
        {
          id: editor.id,
          status: editor.status,
          due_date: editor.due_date || null,
          language: editor.language,
          direction: editor.direction,
          template_type: editor.template_type,
          show_header: editor.show_header,
          show_footer: editor.show_footer,
          client_name: editor.client_name,
          client_email: editor.client_email || null,
          client_phone: editor.client_phone || null,
          client_address: editor.client_address || null,
          custom_columns: editor.custom_columns,
          notes: editor.notes || null,
          tax_rate: editor.tax_rate,
          discount_amount: editor.discount_amount,
        },
        {
          onSuccess: () => {
            replaceItems.mutate({ documentId: editor.id!, items: editor.items });
          },
        }
      );
      return;
    }

    createDoc.mutate(
      {
        doc_type: editor.doc_type,
        client_name: editor.client_name,
        client_email: editor.client_email,
        client_phone: editor.client_phone,
        client_address: editor.client_address,
        issue_date: editor.issue_date,
        due_date: editor.due_date || undefined,
        template_type: editor.template_type,
        language: editor.language,
        direction: editor.direction,
        show_header: editor.show_header,
        show_footer: editor.show_footer,
        notes: editor.notes,
        custom_columns: editor.custom_columns,
        source_document_id: editor.source_document_id || null,
      },
      {
        onSuccess: (doc) => {
          setSelectedId(doc.id);
          replaceItems.mutate({ documentId: doc.id, items: editor.items });
        },
      }
    );
  };

  const handleConvert = () => {
    if (!editor.id) return;
    const nextType = nextTypeMap[editor.doc_type];
    if (!nextType) return;
    convertDoc.mutate(
      { source_document_id: editor.id, target_doc_type: nextType },
      {
        onSuccess: (doc) => {
          setSelectedId(doc.id);
        },
      }
    );
  };

  const exportPreview = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const marginX = 12;
    let y = 14;
    const palette = {
      classic: { r: 15, g: 23, b: 42 },
      modern: { r: 37, g: 99, b: 235 },
      minimalist: { r: 31, g: 41, b: 55 },
      creative: { r: 147, g: 51, b: 234 },
    }[editor.template_type];

    if (editor.show_header) {
      doc.setTextColor(palette.r, palette.g, palette.b);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(company?.company_name || 'Société', marginX, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(company?.address || '-', marginX, y);
      y += 5;
      doc.text(`${company?.contact_phone || '-'} | ${company?.contact_email || '-'}`, marginX, y);
      y += 6;
      doc.setTextColor(17, 24, 39);
      doc.setFont('helvetica', 'bold');
      doc.text(editor.doc_type.replace('_', ' ').toUpperCase(), 155, 14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${editor.issue_date}`, 155, 20);
      y += 4;
    }

    doc.setFontSize(11);
    doc.text(`Client: ${editor.client_name || '-'}`, marginX, y);
    y += 5;
    doc.setFontSize(9);
    doc.text(editor.client_address || '-', marginX, y);
    y += 7;

    const headers = ['Description', ...editor.custom_columns, 'Qté', 'PU', 'Rem%', 'Total'];
    const body = editor.items.map((it) => {
      const total = Number(it.quantity || 0) * Number(it.unit_price || 0) * (1 - Number(it.discount_rate || 0) / 100);
      const dynamicValues = editor.custom_columns.map((col) => ((it.extra_fields as Record<string, string> | undefined)?.[col]) || '-');
      return [
        it.description || '-',
        ...dynamicValues,
        Number(it.quantity || 0).toFixed(2),
        Number(it.unit_price || 0).toFixed(2),
        Number(it.discount_rate || 0).toFixed(2),
        total.toFixed(2),
      ];
    });

    autoTable(doc, {
      head: [headers],
      body,
      startY: y,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [palette.r, palette.g, palette.b] },
    });

    const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || y + 60;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Sous-total: ${previewTotals.subtotal.toFixed(2)} MAD`, 140, finalY + 8);
    doc.text(`TVA: ${previewTotals.tax.toFixed(2)} MAD`, 140, finalY + 13);
    doc.text(`Remise: ${Number(editor.discount_amount || 0).toFixed(2)} MAD`, 140, finalY + 18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${previewTotals.total.toFixed(2)} MAD`, 140, finalY + 24);

    if (editor.show_footer) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(editor.notes || 'Merci pour votre confiance.', marginX, 287);
    }

    const fileName = `${editor.doc_type}-${editor.client_name || 'client'}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    if (editor.id) {
      createEvent.mutate({
        document_id: editor.id,
        event_type: 'pdf_exported',
        event_label: 'PDF exporté',
        event_payload: { template: editor.template_type, file_name: fileName },
      });
    }
  };

  const handleSendEmail = () => {
    if (!editor.id || !editor.client_email) return;
    const subject = `${editor.doc_type.toUpperCase()} ${detailsQ.data?.document?.doc_number || ''}`.trim();
    const body = `Bonjour,\nVeuillez trouver votre document ${detailsQ.data?.document?.doc_number || ''}.\nMontant: ${previewTotals.total.toFixed(2)} MAD\n\nCordialement`;
    sendEmail.mutate({
      document_id: editor.id,
      to: editor.client_email,
      subject,
      body,
    });
  };

  const handleSendWhatsApp = () => {
    if (!editor.id || !editor.client_phone) return;
    const body = `${editor.doc_type.toUpperCase()} ${detailsQ.data?.document?.doc_number || ''}\nMontant: ${previewTotals.total.toFixed(2)} MAD\nMerci pour votre confiance.`;
    sendWhatsApp.mutate({
      document_id: editor.id,
      to: editor.client_phone,
      body,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Facturation</h1>
            <p className="text-muted-foreground">Cycle documentaire intelligent: Devis → Bon de Commande → Bon de Livraison → Facture</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={editor.doc_type} onValueChange={(value: FactDocumentType) => setEditor((p) => ({ ...p, doc_type: value }))}>
              <SelectTrigger className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="devis">Devis</SelectItem>
                <SelectItem value="bon_commande">Bon de Commande</SelectItem>
                <SelectItem value="bon_livraison">Bon de Livraison</SelectItem>
                <SelectItem value="facture">Facture</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => handleNew(editor.doc_type)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={createDoc.isPending || updateDoc.isPending || replaceItems.isPending}>
              Enregistrer
            </Button>
            <Button variant="outline" onClick={handleConvert} disabled={!editor.id || !nextTypeMap[editor.doc_type] || convertDoc.isPending}>
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Convertir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardDescription>Ventes attendues (Devis)</CardDescription></CardHeader>
            <CardContent className="text-xl font-semibold">{(stats?.pending_devis_amount || 0).toFixed(2)} MAD</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>B.L non facturé</CardDescription></CardHeader>
            <CardContent className="text-xl font-semibold">{stats?.bl_not_invoiced_count || 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Factures non payées</CardDescription></CardHeader>
            <CardContent className="text-xl font-semibold">{stats?.unpaid_invoices_count || 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Montant impayé</CardDescription></CardHeader>
            <CardContent className="text-xl font-semibold">{(stats?.unpaid_invoices_amount || 0).toFixed(2)} MAD</CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Choisissez un document ou créez-en un nouveau</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[660px] overflow-auto">
              {docsLoading ? (
                <div className="text-sm text-muted-foreground">Chargement...</div>
              ) : docs.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucun document.</div>
              ) : (
                docs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedId(doc.id)}
                    className={cn(
                      'w-full border rounded-md p-3 text-left transition',
                      selectedId === doc.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{doc.doc_number}</div>
                      <Badge variant="outline">{doc.doc_type}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{doc.client_name}</div>
                    <div className="text-xs mt-1">{Number(doc.total_amount || 0).toFixed(2)} MAD</div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="xl:col-span-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Éditeur Document</CardTitle>
                  <CardDescription>Live Preview + Templates + Dynamic Fields</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={activeTab === 'editor' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('editor')}>
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    Édition
                  </Button>
                  <Button variant={activeTab === 'preview' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('preview')}>
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportPreview}>
                    <FileDown className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendEmail}
                    disabled={!editor.id || !editor.client_email || sendEmail.isPending}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Envoyer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendWhatsApp}
                    disabled={!editor.id || !editor.client_phone || sendWhatsApp.isPending}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'editor' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Client</Label>
                      <Input value={editor.client_name} onChange={(e) => setEditor((p) => ({ ...p, client_name: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={editor.client_email} onChange={(e) => setEditor((p) => ({ ...p, client_email: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input value={editor.client_phone} onChange={(e) => setEditor((p) => ({ ...p, client_phone: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Adresse</Label>
                      <Input value={editor.client_address} onChange={(e) => setEditor((p) => ({ ...p, client_address: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Langue</Label>
                      <Select
                        value={editor.language}
                        onValueChange={(value: FactLanguage) =>
                          setEditor((p) => ({ ...p, language: value, direction: value === 'ar' ? 'rtl' : 'ltr' }))
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Template</Label>
                      <Select value={editor.template_type} onValueChange={(value: FactTemplateType) => setEditor((p) => ({ ...p, template_type: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="minimalist">Minimalist</SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Taux TVA (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editor.tax_rate}
                        onChange={(e) => setEditor((p) => ({ ...p, tax_rate: Number(e.target.value || 0) }))}
                      />
                    </div>
                    <div>
                      <Label>Remise globale (MAD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editor.discount_amount}
                        onChange={(e) => setEditor((p) => ({ ...p, discount_amount: Number(e.target.value || 0) }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch checked={editor.show_header} onCheckedChange={(checked) => setEditor((p) => ({ ...p, show_header: checked }))} />
                      <Label>Afficher Header</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={editor.show_footer} onCheckedChange={(checked) => setEditor((p) => ({ ...p, show_footer: checked }))} />
                      <Label>Afficher Footer</Label>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Dynamic Fields</Label>
                    <div className="flex gap-2">
                      <Input value={customColumnDraft} onChange={(e) => setCustomColumnDraft(e.target.value)} placeholder="Ex: Numéro Série, Garantie..." />
                      <Button type="button" variant="outline" onClick={addCustomColumn}>Ajouter</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editor.custom_columns.map((name) => (
                        <Badge key={name} variant="secondary" className="gap-2">
                          {name}
                          <button onClick={() => removeCustomColumn(name)} className="text-xs">×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Lignes</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditor((p) => ({ ...p, items: [...p.items, defaultItem()] }))}>
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter ligne
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editor.items.map((item, idx) => (
                        <Card key={`line-${idx}`} className="p-3">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                            <Input className="md:col-span-4" value={String(item.description || '')} placeholder="Description" onChange={(e) => updateItem(idx, { description: e.target.value })} />
                            <Input className="md:col-span-2" type="number" value={Number(item.quantity || 0)} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value || 0) })} />
                            <Input className="md:col-span-2" value={String(item.unit || 'u')} onChange={(e) => updateItem(idx, { unit: e.target.value })} />
                            <Input className="md:col-span-2" type="number" value={Number(item.unit_price || 0)} onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value || 0) })} />
                            <Input className="md:col-span-1" type="number" value={Number(item.discount_rate || 0)} onChange={(e) => updateItem(idx, { discount_rate: Number(e.target.value || 0) })} />
                            <Button className="md:col-span-1" type="button" variant="ghost" onClick={() => setEditor((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}>×</Button>
                          </div>
                          {editor.custom_columns.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                              {editor.custom_columns.map((col) => (
                                <Input
                                  key={`${idx}-${col}`}
                                  placeholder={col}
                                  value={((item.extra_fields as Record<string, string> | undefined)?.[col]) || ''}
                                  onChange={(e) => updateItemExtra(idx, col, e.target.value)}
                                />
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea value={editor.notes} onChange={(e) => setEditor((p) => ({ ...p, notes: e.target.value }))} rows={3} />
                  </div>
                </div>
              ) : (
                <div className={cn('rounded-lg p-4 min-h-[560px] transition-all', templateClassMap[editor.template_type], editor.direction === 'rtl' && 'text-right')} dir={editor.direction}>
                  {editor.show_header && (
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="text-xl font-bold">{company?.company_name || 'Société'}</div>
                        <div className="text-xs opacity-80">{company?.address || '-'}</div>
                        <div className="text-xs opacity-80">{company?.contact_phone || '-'} · {company?.contact_email || '-'}</div>
                        <div className="text-xs opacity-80">{company?.tax_info || '-'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold uppercase">{editor.doc_type.replace('_', ' ')}</div>
                        <div className="text-xs">{editor.issue_date}</div>
                      </div>
                    </div>
                  )}
                  <div className="mb-3">
                    <div className="font-semibold">{editor.client_name || 'Client'}</div>
                    <div className="text-xs opacity-80">{editor.client_address || '-'}</div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">PU</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editor.items.map((it, idx) => {
                        const total = Number(it.quantity || 0) * Number(it.unit_price || 0) * (1 - Number(it.discount_rate || 0) / 100);
                        return (
                          <TableRow key={`pv-${idx}`}>
                            <TableCell>
                              <div>{it.description || '-'}</div>
                              {editor.custom_columns.length > 0 && (
                                <div className="text-[11px] opacity-70 mt-1">
                                  {editor.custom_columns
                                    .map((c) => `${c}: ${((it.extra_fields as Record<string, string> | undefined)?.[c]) || '-'}`)
                                    .join(' · ')}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{Number(it.quantity || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{Number(it.unit_price || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{total.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="mt-4 ml-auto max-w-sm space-y-1 text-sm">
                    <div className="flex justify-between"><span>Sous-total</span><span>{previewTotals.subtotal.toFixed(2)} MAD</span></div>
                    <div className="flex justify-between"><span>TVA</span><span>{previewTotals.tax.toFixed(2)} MAD</span></div>
                    <div className="flex justify-between"><span>Remise</span><span>- {Number(editor.discount_amount || 0).toFixed(2)} MAD</span></div>
                    <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{previewTotals.total.toFixed(2)} MAD</span></div>
                  </div>
                  {editor.show_footer && (
                    <div className="mt-6 text-xs opacity-80">
                      <div>{editor.notes || 'Merci pour votre confiance.'}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Suivi des états et transformations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[660px] overflow-auto">
              {timeline.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucun événement.</div>
              ) : (
                timeline.map((ev) => (
                  <div key={ev.id} className="border rounded-md p-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <div className="text-sm font-medium">{ev.event_label}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(ev.created_at).toLocaleString('fr-FR')}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Parcours Documents</CardTitle>
            <CardDescription>Cycle conseillé et flexible</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="flow">
              <TabsList>
                <TabsTrigger value="flow"><FileText className="w-4 h-4 mr-1" />Document Flow</TabsTrigger>
                <TabsTrigger value="templates"><Eye className="w-4 h-4 mr-1" />Templates</TabsTrigger>
              </TabsList>
              <TabsContent value="flow" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {(['devis', 'bon_commande', 'bon_livraison', 'facture'] as FactDocumentType[]).map((t) => (
                    <Card key={t} className="p-3">
                      <div className="font-semibold capitalize">{t.replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground mt-1">Démarrage direct possible</div>
                      <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => handleNew(t)}>
                        Créer {t.replace('_', ' ')}
                      </Button>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="templates" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {(['classic', 'modern', 'minimalist', 'creative'] as FactTemplateType[]).map((tpl) => (
                    <Card key={tpl} className={cn('p-3', templateClassMap[tpl])}>
                      <div className="font-semibold capitalize">{tpl}</div>
                      <div className="text-xs mt-1 opacity-80">Preview instantané disponible</div>
                      <Button size="sm" className="mt-3 w-full" onClick={() => setEditor((p) => ({ ...p, template_type: tpl }))}>
                        Utiliser
                      </Button>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
