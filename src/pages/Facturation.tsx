import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useTourismCompanyProfile } from '@/hooks/useTourismCompany';
import {
  useAchatsSuppliers,
  useBulkUpdatePurchaseOrdersStatus,
  useBulkUpdateSupplierInvoicesStatus,
  useCreatePurchaseOrder,
  useCreateSupplierInvoice,
  useDeletePurchaseOrder,
  useDeleteSupplierInvoice,
  usePurchaseOrders,
  useSupplierInvoices,
} from '@/hooks/useAchats';
import { createStockItem, deleteStockItem, getStockItems, updateStockItem } from '@/services/stockService';
import { StockItem } from '@/types/stock';
import { supabase } from '@/integrations/supabase/client';
import {
  FactDirection,
  FactDocument,
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
import { Activity, ArrowRightLeft, Building2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, FileDown, Filter, Grid3X3, ListChecks, Mail, MessageCircle, PackagePlus, Plus, Search, Sparkles, Table2, TriangleAlert, Users2 } from 'lucide-react';
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mainModule, setMainModule] = useState<'home' | 'contacts' | 'sales' | 'purchases' | 'catalog' | 'analytics'>('sales');
  const [contactsTab, setContactsTab] = useState<'clients' | 'suppliers'>('clients');
  const [achatsTab, setAchatsTab] = useState<'orders' | 'invoices'>('orders');
  const [contactsSearch, setContactsSearch] = useState('');
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [newClientType, setNewClientType] = useState<'societe' | 'particulier'>('societe');
  const [newClientName, setNewClientName] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientPostalCode, setNewClientPostalCode] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientGsm, setNewClientGsm] = useState('');
  const [newClientFax, setNewClientFax] = useState('');
  const [newClientWebsite, setNewClientWebsite] = useState('');
  const [newClientCity, setNewClientCity] = useState('');
  const [newClientCountry, setNewClientCountry] = useState('Maroc');
  const [newClientIce, setNewClientIce] = useState('');
  const [newClientIf, setNewClientIf] = useState('');
  const [newClientRc, setNewClientRc] = useState('');
  const [newClientCreatedDate, setNewClientCreatedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [newSupplierType, setNewSupplierType] = useState<'societe' | 'particulier'>('societe');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [newSupplierPostalCode, setNewSupplierPostalCode] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierGsm, setNewSupplierGsm] = useState('');
  const [newSupplierFax, setNewSupplierFax] = useState('');
  const [newSupplierWebsite, setNewSupplierWebsite] = useState('');
  const [newSupplierCity, setNewSupplierCity] = useState('');
  const [newSupplierCountry, setNewSupplierCountry] = useState('Maroc');
  const [newSupplierIce, setNewSupplierIce] = useState('');
  const [newSupplierIf, setNewSupplierIf] = useState('');
  const [newSupplierRc, setNewSupplierRc] = useState('');
  const [newSupplierCreatedDate, setNewSupplierCreatedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualClients, setManualClients] = useState<Array<{
    id: string;
    name: string;
    city: string;
    email: string;
    phone: string;
    total: number;
    clientType: 'societe' | 'particulier';
    address: string;
    postalCode: string;
    country: string;
    gsm: string;
    fax: string;
    website: string;
    ice: string;
    ifCode: string;
    rcCode: string;
    createdDate: string;
  }>>([]);
  const [manualSuppliers, setManualSuppliers] = useState<Array<{
    id: string;
    name: string;
    city: string;
    email: string;
    phone: string;
    total: number;
    clientType: 'societe' | 'particulier';
    address: string;
    postalCode: string;
    country: string;
    gsm: string;
    fax: string;
    website: string;
    ice: string;
    ifCode: string;
    rcCode: string;
    createdDate: string;
  }>>([]);
  const [newDocDialogOpen, setNewDocDialogOpen] = useState(false);
  const [newDocClientId, setNewDocClientId] = useState('');
  const [newDocClientSearch, setNewDocClientSearch] = useState('');
  const newDocClientSearchRef = useRef<HTMLInputElement | null>(null);
  const [newDocIssueDate, setNewDocIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [salesView, setSalesView] = useState<'table' | 'grid'>('table');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [salesPage, setSalesPage] = useState(1);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [homeMonthCursor, setHomeMonthCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Service');
  const [newProductUnit, setNewProductUnit] = useState('u');
  const [newProductStock, setNewProductStock] = useState('0');
  const [newPurchaseSupplierId, setNewPurchaseSupplierId] = useState('');
  const [newPurchaseAmount, setNewPurchaseAmount] = useState('');
  const [newInvoiceSupplierId, setNewInvoiceSupplierId] = useState('');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
  const [achatsSearch, setAchatsSearch] = useState('');
  const [achatsStatusFilter, setAchatsStatusFilter] = useState('all');
  const [achatsPage, setAchatsPage] = useState(1);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('all');
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogItems] = useState([
    { id: 'prd-1', name: 'Location véhicule tourisme', unit: 'jour', price: 950, tax: 20, stock: 999 },
    { id: 'prd-2', name: 'Transfert Aéroport', unit: 'service', price: 420, tax: 20, stock: 999 },
    { id: 'prd-3', name: 'Gasoil interne', unit: 'litre', price: 12.5, tax: 10, stock: 1430 },
  ]);
  const { data: docs = [], isLoading: docsLoading } = useFactDocuments();
  const { data: stats } = useFactQuickStats();
  const { data: company } = useTourismCompanyProfile();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [currentStage, setCurrentStage] = useState<FactDocumentType>('facture');
  const [editorOpen, setEditorOpen] = useState(false);
  const [customColumnDraft, setCustomColumnDraft] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('preview');
  const [editor, setEditor] = useState<EditorState>(defaultEditor());
  const detailsQ = useFactDocumentDetails(selectedId);
  const createDoc = useCreateFactDocument();
  const convertDoc = useConvertFactDocument();
  const updateDoc = useUpdateFactDocument();
  const replaceItems = useReplaceFactDocumentItems();
  const createEvent = useCreateFactDocumentEvent();
  const sendEmail = useSendFactDocumentEmail();
  const sendWhatsApp = useSendFactDocumentWhatsApp();
  const achatsSuppliersQ = useAchatsSuppliers();
  const purchaseOrdersQ = usePurchaseOrders();
  const supplierInvoicesQ = useSupplierInvoices();
  const createPurchaseOrder = useCreatePurchaseOrder();
  const createSupplierInvoice = useCreateSupplierInvoice();
  const deletePurchaseOrder = useDeletePurchaseOrder();
  const deleteSupplierInvoice = useDeleteSupplierInvoice();
  const bulkUpdatePurchaseOrdersStatus = useBulkUpdatePurchaseOrdersStatus();
  const bulkUpdateSupplierInvoicesStatus = useBulkUpdateSupplierInvoicesStatus();
  const stockItemsQ = useQuery({
    queryKey: ['facturation_stock_items'],
    queryFn: getStockItems,
  });
  const paymentEventsQ = useQuery({
    queryKey: ['facturation_payment_events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_document_events')
        .select('document_id,event_payload')
        .eq('event_type', 'payment_recorded');
      if (error) throw error;
      return data || [];
    },
  });
  const createCatalogItem = useMutation({
    mutationFn: createStockItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturation_stock_items'] });
    },
  });
  const updateCatalogItem = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<StockItem> }) => updateStockItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturation_stock_items'] });
    },
  });
  const deleteCatalogItem = useMutation({
    mutationFn: (id: string) => deleteStockItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturation_stock_items'] });
    },
  });
  useEffect(() => {
    if (!selectedId || !detailsQ.data?.document || detailsQ.data.document.id !== selectedId) return;
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
  }, [selectedId, detailsQ.data]);


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
    setCurrentStage(docType);
    openNewDocDialog();
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
    doc.text(`Total H.T: ${previewTotals.subtotal.toFixed(2)} MAD`, 140, finalY + 8);
    doc.text(`TVA 20%: ${previewTotals.tax.toFixed(2)} MAD`, 140, finalY + 13);
    doc.text(`Remise: ${Number(editor.discount_amount || 0).toFixed(2)} MAD`, 140, finalY + 18);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL T.T.C: ${previewTotals.total.toFixed(2)} MAD`, 140, finalY + 24);

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

  const docTypeLabels: Record<FactDocumentType, string> = {
    devis: 'Devis',
    bon_commande: 'Commandes',
    bon_livraison: 'Livraisons',
    facture: 'Factures',
  };

  const stageUi = useMemo(
    () => ({
      devis: { title: 'Devis clients', numberLabel: 'Devis N°' },
      bon_commande: { title: 'Commandes clients', numberLabel: 'Commande N°' },
      bon_livraison: { title: 'Livraisons clients', numberLabel: 'Livraison N°' },
      facture: { title: 'Factures clients', numberLabel: 'Facture N°' },
    }[currentStage]),
    [currentStage]
  );

  const handleStageChange = (type: FactDocumentType) => {
    setCurrentStage(type);
    setSelectedId(undefined);
    setSearchQuery('');
    setStatusFilter('all');
    setPeriodFilter('all');
  };

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      if (doc.doc_type !== currentStage) return false;
      if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hit = doc.doc_number.toLowerCase().includes(q) || doc.client_name.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (periodFilter === 'month') {
        const now = new Date();
        const d = new Date(doc.issue_date);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    });
  }, [docs, currentStage, statusFilter, searchQuery, periodFilter]);

  const clientsSummary = useMemo(() => {
    const map = new Map<string, { client: string; count: number; total: number }>();
    docs.forEach((doc) => {
      const key = doc.client_name || 'Client';
      const prev = map.get(key) || { client: key, count: 0, total: 0 };
      prev.count += 1;
      prev.total += Number(doc.total_amount || 0);
      map.set(key, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 12);
  }, [docs]);

  useEffect(() => {
    setSalesPage(1);
  }, [currentStage, statusFilter, searchQuery, periodFilter, rowsPerPage]);

  const salesTotalPages = useMemo(() => Math.max(1, Math.ceil(filteredDocs.length / rowsPerPage)), [filteredDocs.length, rowsPerPage]);
  const salesPageSafe = Math.min(Math.max(1, salesPage), salesTotalPages);
  const salesPagedDocs = useMemo(() => {
    const start = (salesPageSafe - 1) * rowsPerPage;
    return filteredDocs.slice(start, start + rowsPerPage);
  }, [filteredDocs, rowsPerPage, salesPageSafe]);

  const invoicePaidById = useMemo(() => {
    const map = new Map<string, number>();
    (paymentEventsQ.data || []).forEach((evt) => {
      const payload = evt.event_payload as { amount?: number | string } | null;
      const amount = Number(payload?.amount || 0);
      if (!evt.document_id || Number.isNaN(amount) || amount <= 0) return;
      map.set(evt.document_id, (map.get(evt.document_id) || 0) + amount);
    });
    return map;
  }, [paymentEventsQ.data]);

  const invoiceRemaining = (doc: FactDocument) => {
    if (doc.status === 'paid') return 0;
    const paid = invoicePaidById.get(doc.id) || 0;
    return Math.max(0, Number(doc.total_amount || 0) - paid);
  };

  const purchasesRows = useMemo(
    () =>
      (purchaseOrdersQ.data || []).map((order) => ({
        id: order.id,
        ref: order.order_number,
        supplier: order.supplier_name,
        type: 'BC Fournisseur',
        date: order.order_date,
        amount: Number(order.total_amount || 0),
        status: order.status,
      })),
    [purchaseOrdersQ.data]
  );

  const supplierInvoicesRows = useMemo(
    () =>
      (supplierInvoicesQ.data || []).map((invoice) => ({
        id: invoice.id,
        ref: invoice.invoice_number,
        supplier: invoice.supplier_name,
        date: invoice.invoice_date,
        dueDate: invoice.due_date,
        amount: Number(invoice.total_amount || 0),
        status: invoice.status,
      })),
    [supplierInvoicesQ.data]
  );

  const catalogRows = useMemo(() => {
    const persisted = stockItemsQ.data || [];
    if (persisted.length > 0) return persisted;
    return catalogItems;
  }, [stockItemsQ.data, catalogItems]);

  useEffect(() => {
    setAchatsPage(1);
  }, [achatsTab, achatsSearch, achatsStatusFilter]);

  useEffect(() => {
    setCatalogPage(1);
  }, [catalogSearch, catalogCategoryFilter]);

  const achatsSourceRows = useMemo(
    () => (achatsTab === 'orders' ? purchasesRows : supplierInvoicesRows),
    [achatsTab, purchasesRows, supplierInvoicesRows]
  );

  const achatsFilteredRows = useMemo(() => {
    return achatsSourceRows.filter((row) => {
      if (achatsStatusFilter !== 'all' && row.status !== achatsStatusFilter) return false;
      if (achatsSearch.trim()) {
        const q = achatsSearch.toLowerCase();
        const searchable = `${row.ref} ${row.supplier} ${row.status}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [achatsSourceRows, achatsStatusFilter, achatsSearch]);

  const achatsTotalPages = useMemo(() => Math.max(1, Math.ceil(achatsFilteredRows.length / 10)), [achatsFilteredRows.length]);
  const achatsPageSafe = Math.min(Math.max(1, achatsPage), achatsTotalPages);
  const achatsPagedRows = useMemo(() => {
    const start = (achatsPageSafe - 1) * 10;
    return achatsFilteredRows.slice(start, start + 10);
  }, [achatsFilteredRows, achatsPageSafe]);

  const catalogFilteredRows = useMemo(() => {
    return catalogRows.filter((item) => {
      if (catalogCategoryFilter !== 'all' && String((item as StockItem).category || '') !== catalogCategoryFilter) return false;
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        const searchable = `${(item as StockItem).name || ''} ${(item as StockItem).category || ''} ${(item as StockItem).reference || ''}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [catalogRows, catalogSearch, catalogCategoryFilter]);

  const catalogTotalPages = useMemo(() => Math.max(1, Math.ceil(catalogFilteredRows.length / 10)), [catalogFilteredRows.length]);
  const catalogPageSafe = Math.min(Math.max(1, catalogPage), catalogTotalPages);
  const catalogPagedRows = useMemo(() => {
    const start = (catalogPageSafe - 1) * 10;
    return catalogFilteredRows.slice(start, start + 10);
  }, [catalogFilteredRows, catalogPageSafe]);

  const analyticsSummary = useMemo(() => {
    const factures = docs.filter((d) => d.doc_type === 'facture');
    const devis = docs.filter((d) => d.doc_type === 'devis');
    const conversionRate = devis.length > 0 ? (factures.length / devis.length) * 100 : 0;
    const revenue = factures.reduce((acc, d) => acc + Number(d.total_amount || 0), 0);
    const overdue = factures.filter((d) => d.status === 'overdue').reduce((acc, d) => acc + Number(d.total_amount || 0), 0);
    const averageTicket = factures.length > 0 ? revenue / factures.length : 0;
    return { conversionRate, revenue, overdue, averageTicket };
  }, [docs]);

  const homeCalendar = useMemo(() => {
    const year = homeMonthCursor.getFullYear();
    const month = homeMonthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leading = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();
    const cells: Array<{ day?: number; iso?: string; overdueCount?: number }> = [];
    for (let i = 0; i < leading; i += 1) cells.push({});
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = new Date(year, month, day).toISOString().slice(0, 10);
      const overdueCount = docs.filter((d) => d.issue_date === iso && d.status === 'overdue').length;
      cells.push({ day, iso, overdueCount });
    }
    while (cells.length % 7 !== 0) cells.push({});
    return { cells, monthLabel: homeMonthCursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) };
  }, [homeMonthCursor, docs]);

  const getStatusBadge = (doc: FactDocument) => {
    if (doc.status === 'paid') {
      return (
        <Badge className="bg-green-500/15 text-green-600 border-green-500/30 gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Payé
        </Badge>
      );
    }
    if (doc.status === 'overdue' || doc.status === 'failed') {
      return (
        <Badge variant="destructive" className="gap-1">
          <TriangleAlert className="w-3 h-3" />
          {doc.status}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Clock3 className="w-3 h-3" />
        {doc.status}
      </Badge>
    );
  };

  const contactsRows = useMemo(() => {
    const inferredSuppliers = clientsSummary
      .slice(0, 8)
      .map((row, idx) => ({
        id: `sup-${idx}`,
        name: row.client,
        city: ['Casablanca', 'Rabat', 'Marrakech', 'Tanger'][idx % 4],
        email: `${row.client.replace(/\s+/g, '.').toLowerCase()}@mail.com`,
        phone: `+212 6${(10000000 + idx * 1337).toString().slice(0, 8)}`,
      }));
    const suppliers = [...manualSuppliers, ...inferredSuppliers];
    const inferredClients = clientsSummary
      .map((row, idx) => ({
        id: `cli-${idx}`,
        name: row.client,
        city: ['Casablanca', 'Rabat', 'Agadir', 'Fès', 'Meknès'][idx % 5],
        email: `${row.client.replace(/\s+/g, '.').toLowerCase()}@client.com`,
        phone: `+212 6${(20000000 + idx * 1777).toString().slice(0, 8)}`,
        total: row.total,
      }));
    const clients = [...manualClients, ...inferredClients];
    return { suppliers, clients };
  }, [clientsSummary, manualClients, manualSuppliers]);

  const contactsFiltered = useMemo(() => {
    const q = contactsSearch.trim().toLowerCase();
    const list = contactsTab === 'suppliers' ? contactsRows.suppliers : contactsRows.clients;
    if (!q) return list;
    return list.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [contactsRows, contactsTab, contactsSearch]);

  const handleAddCatalogItem = () => {
    const name = newProductName.trim();
    const price = Number(newProductPrice);
    const qty = Number(newProductStock || 0);
    if (!name || Number.isNaN(price) || price <= 0) return;
    createCatalogItem.mutate({
      name,
      reference: `CAT-${Date.now()}`,
      category: newProductCategory || 'Service',
      quantity: Number.isNaN(qty) ? 0 : qty,
      min_quantity: 0,
      unit: newProductUnit || 'u',
      unit_price: price,
      supplier_id: null,
      location: 'Facturation',
      last_restocked: new Date().toISOString().slice(0, 10),
    });
    setNewProductName('');
    setNewProductPrice('');
    setNewProductCategory('Service');
    setNewProductUnit('u');
    setNewProductStock('0');
  };

  const handleCreatePurchaseOrderQuick = () => {
    const supplier = (achatsSuppliersQ.data || []).find((s) => s.id === newPurchaseSupplierId);
    const amount = Number(newPurchaseAmount || 0);
    if (!supplier || Number.isNaN(amount) || amount <= 0) return;
    createPurchaseOrder.mutate(
      {
        order: {
          order_number: `BC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.floor(Math.random() * 900 + 100)}`,
          supplier_name: supplier.legal_name,
          supplier_id: supplier.id,
          order_date: new Date().toISOString().slice(0, 10),
          expected_delivery_date: null,
          status: 'draft',
          subtotal: amount,
          tax_rate: 20,
          tax_amount: amount * 0.2,
          total_amount: amount * 1.2,
          notes: 'Créé depuis Facturation',
        },
        items: [
          {
            description: 'Achat divers',
            quantity: 1,
            unit: 'u',
            unit_price: amount,
            total_price: amount,
          },
        ],
      },
      {
        onSuccess: () => {
          setNewPurchaseSupplierId('');
          setNewPurchaseAmount('');
        },
      }
    );
  };

  const handleCreateSupplierInvoiceQuick = () => {
    const supplier = (achatsSuppliersQ.data || []).find((s) => s.id === newInvoiceSupplierId);
    const amount = Number(newInvoiceAmount || 0);
    if (!supplier || Number.isNaN(amount) || amount <= 0) return;
    createSupplierInvoice.mutate(
      {
        invoice: {
          invoice_number: `F-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.floor(Math.random() * 900 + 100)}`,
          supplier_name: supplier.legal_name,
          supplier_id: supplier.id,
          invoice_date: new Date().toISOString().slice(0, 10),
          due_date: null,
          status: 'draft',
          subtotal: amount,
          tax_rate: 20,
          tax_amount: amount * 0.2,
          total_amount: amount * 1.2,
          notes: 'Créée depuis Facturation',
        },
        items: [
          {
            description: 'Facture divers',
            quantity: 1,
            unit: 'u',
            unit_price: amount,
            total_price: amount,
          },
        ],
      },
      {
        onSuccess: () => {
          setNewInvoiceSupplierId('');
          setNewInvoiceAmount('');
        },
      }
    );
  };

  const handleArchivePurchaseOrder = (id: string) => {
    deletePurchaseOrder.mutate(id);
  };

  const handleArchiveSupplierInvoice = (id: string) => {
    deleteSupplierInvoice.mutate(id);
  };

  const handleAdvancePurchaseOrderStatus = (id: string, status: string) => {
    const nextStatus = status === 'draft' ? 'sent' : status === 'sent' ? 'approved' : 'approved';
    bulkUpdatePurchaseOrdersStatus.mutate({ ids: [id], status: nextStatus });
  };

  const handleAdvanceSupplierInvoiceStatus = (id: string, status: string) => {
    const nextStatus = status === 'draft' ? 'sent' : status === 'sent' ? 'approved' : status === 'approved' ? 'paid' : 'paid';
    bulkUpdateSupplierInvoicesStatus.mutate({ ids: [id], status: nextStatus });
  };

  const openClientCreation = () => {
    setMainModule('contacts');
    setContactsTab('clients');
    setNewClientType('societe');
    setNewClientName('');
    setNewClientAddress('');
    setNewClientPostalCode('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientGsm('');
    setNewClientFax('');
    setNewClientWebsite('');
    setNewClientCity('');
    setNewClientCountry('Maroc');
    setNewClientIce('');
    setNewClientIf('');
    setNewClientRc('');
    setNewClientCreatedDate(new Date().toISOString().slice(0, 10));
    setClientFormOpen(true);
    setSupplierFormOpen(false);
  };

  const openSupplierCreation = () => {
    setMainModule('contacts');
    setContactsTab('suppliers');
    setNewSupplierType('societe');
    setNewSupplierName('');
    setNewSupplierAddress('');
    setNewSupplierPostalCode('');
    setNewSupplierEmail('');
    setNewSupplierPhone('');
    setNewSupplierGsm('');
    setNewSupplierFax('');
    setNewSupplierWebsite('');
    setNewSupplierCity('');
    setNewSupplierCountry('Maroc');
    setNewSupplierIce('');
    setNewSupplierIf('');
    setNewSupplierRc('');
    setNewSupplierCreatedDate(new Date().toISOString().slice(0, 10));
    setSupplierFormOpen(true);
    setClientFormOpen(false);
  };

  const handleCreateClient = () => {
    const name = newClientName.trim();
    if (!name) return;
    setManualClients((prev) => [
      {
        id: `manual-${Date.now()}`,
        name,
        city: newClientCity.trim() || 'Casablanca',
        email: newClientEmail.trim() || `${name.replace(/\s+/g, '.').toLowerCase()}@client.com`,
        phone: newClientPhone.trim() || '+212 600000000',
        total: 0,
        clientType: newClientType,
        address: newClientAddress.trim(),
        postalCode: newClientPostalCode.trim(),
        country: newClientCountry.trim() || 'Maroc',
        gsm: newClientGsm.trim(),
        fax: newClientFax.trim(),
        website: newClientWebsite.trim(),
        ice: newClientIce.trim(),
        ifCode: newClientIf.trim(),
        rcCode: newClientRc.trim(),
        createdDate: newClientCreatedDate,
      },
      ...prev,
    ]);
    setContactsSearch(name);
    setClientFormOpen(false);
    setNewClientType('societe');
    setNewClientName('');
    setNewClientAddress('');
    setNewClientPostalCode('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientGsm('');
    setNewClientFax('');
    setNewClientWebsite('');
    setNewClientCity('');
    setNewClientCountry('Maroc');
    setNewClientIce('');
    setNewClientIf('');
    setNewClientRc('');
    setNewClientCreatedDate(new Date().toISOString().slice(0, 10));
  };

  const handleCreateSupplier = () => {
    const name = newSupplierName.trim();
    if (!name) return;
    setManualSuppliers((prev) => [
      {
        id: `manual-sup-${Date.now()}`,
        name,
        city: newSupplierCity.trim() || 'Casablanca',
        email: newSupplierEmail.trim() || `${name.replace(/\s+/g, '.').toLowerCase()}@supplier.com`,
        phone: newSupplierPhone.trim() || '+212 600000000',
        total: 0,
        clientType: newSupplierType,
        address: newSupplierAddress.trim(),
        postalCode: newSupplierPostalCode.trim(),
        country: newSupplierCountry.trim() || 'Maroc',
        gsm: newSupplierGsm.trim(),
        fax: newSupplierFax.trim(),
        website: newSupplierWebsite.trim(),
        ice: newSupplierIce.trim(),
        ifCode: newSupplierIf.trim(),
        rcCode: newSupplierRc.trim(),
        createdDate: newSupplierCreatedDate,
      },
      ...prev,
    ]);
    setContactsSearch(name);
    setSupplierFormOpen(false);
    setNewSupplierType('societe');
    setNewSupplierName('');
    setNewSupplierAddress('');
    setNewSupplierPostalCode('');
    setNewSupplierEmail('');
    setNewSupplierPhone('');
    setNewSupplierGsm('');
    setNewSupplierFax('');
    setNewSupplierWebsite('');
    setNewSupplierCity('');
    setNewSupplierCountry('Maroc');
    setNewSupplierIce('');
    setNewSupplierIf('');
    setNewSupplierRc('');
    setNewSupplierCreatedDate(new Date().toISOString().slice(0, 10));
  };

  const openNewDocDialog = () => {
    setNewDocClientId('');
    setNewDocClientSearch('');
    setNewDocIssueDate(new Date().toISOString().slice(0, 10));
    setNewDocDialogOpen(true);
  };

  useEffect(() => {
    if (!newDocDialogOpen) return;
    const timer = window.setTimeout(() => {
      newDocClientSearchRef.current?.focus();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [newDocDialogOpen]);

  const newDocClientsFiltered = useMemo(() => {
    const sorted = [...contactsRows.clients].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
    const q = newDocClientSearch.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [contactsRows.clients, newDocClientSearch]);

  const handleQuickCreateDocument = () => {
    const selectedClient = contactsRows.clients.find((c) => c.id === newDocClientId);
    if (!selectedClient) return;
    createDoc.mutate(
      {
        doc_type: currentStage,
        client_name: selectedClient.name,
        client_email: selectedClient.email,
        client_phone: selectedClient.phone,
        client_address: `${selectedClient.city}, Maroc`,
        issue_date: newDocIssueDate,
        language: 'fr',
        direction: 'ltr',
        show_header: true,
        show_footer: true,
      },
      {
        onSuccess: (doc) => {
          setNewDocDialogOpen(false);
          navigate(`/facturation/${doc.id}`);
        },
      }
    );
  };

  const toggleInvoiceSelection = (id: string) => {
    setSelectedInvoiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAllInvoicesOnPage = () => {
    const pageIds = salesPagedDocs.filter((d) => d.doc_type === 'facture').map((d) => d.id);
    setSelectedInvoiceIds((prev) => {
      const allSelected = pageIds.every((id) => prev.includes(id));
      if (allSelected) return prev.filter((id) => !pageIds.includes(id));
      return Array.from(new Set([...prev, ...pageIds]));
    });
  };

  const handleExportSelectedInvoicesPdf = async (forcedIds?: string[]) => {
    const ids = forcedIds || selectedInvoiceIds;
    const selectedDocs = docs.filter((d) => ids.includes(d.id) && d.doc_type === 'facture');
    if (selectedDocs.length === 0) return;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    for (let index = 0; index < selectedDocs.length; index += 1) {
      const d = selectedDocs[index];
      if (index > 0) pdf.addPage();
      const { data: lines } = await supabase
        .from('fact_document_items')
        .select('*')
        .eq('document_id', d.id)
        .order('line_order', { ascending: true });
      const items = (lines || []) as FactDocumentItem[];
      const paid = invoicePaidById.get(d.id) || 0;
      const remain = Math.max(0, Number(d.total_amount || 0) - paid);
      const companyName = company?.company_name || 'Société';
      const companyAddress = company?.address || '-';
      const companyEmail = company?.contact_email || '-';
      const companyPhone = company?.contact_phone || '-';
      const companyTax = company?.tax_info || '-';

      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, 210, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(companyName, 12, 14);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Email: ${companyEmail}`, 12, 20);
      pdf.text(`Tél: ${companyPhone}`, 12, 25);
      pdf.text(`Adresse: ${companyAddress}`, 12, 30);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.text('FACTURE', 140, 14);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`N°: ${d.doc_number}`, 140, 21);
      pdf.text(`Date: ${new Date(d.issue_date).toLocaleDateString('fr-FR')}`, 140, 26);
      pdf.text(`Statut: ${d.status}`, 140, 31);
      pdf.setTextColor(0, 0, 0);

      pdf.setFillColor(241, 245, 249);
      pdf.rect(12, 46, 186, 30, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Informations client', 14, 53);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Nom: ${d.client_name || '-'}`, 14, 59);
      pdf.text(`Email: ${d.client_email || '-'}`, 14, 64);
      pdf.text(`Téléphone: ${d.client_phone || '-'}`, 14, 69);
      const clientAddressLines = pdf.splitTextToSize(`Adresse: ${d.client_address || '-'}`, 176);
      pdf.text(clientAddressLines, 14, 74);

      autoTable(pdf, {
        startY: 83,
        head: [['Description', 'Qté', 'Prix H.T', 'Remise %', 'TVA', 'Total H.T']],
        body: items.map((it) => [
          it.description || '-',
          Number(it.quantity || 0).toFixed(2),
          Number(it.unit_price || 0).toFixed(2),
          Number(it.discount_rate || 0).toFixed(2),
          Number(it.tax_rate || 0).toFixed(2),
          Number(it.line_total || 0).toFixed(2),
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59] },
      });

      let finalY = (pdf as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 120;
      if (finalY > 230) {
        pdf.addPage();
        finalY = 24;
      }
      const subtotal = Number(d.subtotal || 0);
      const tax = Number(d.tax_amount || 0);
      const paymentStatus = remain <= 0.0001 ? 'PAYE' : paid > 0 ? 'PARTIEL' : 'NON PAYE';

      pdf.setDrawColor(203, 213, 225);
      pdf.rect(120, finalY + 6, 78, 36);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Total H.T: ${subtotal.toFixed(2)} MAD`, 123, finalY + 13);
      pdf.text(`TVA 20%: ${tax.toFixed(2)} MAD`, 123, finalY + 18);
      pdf.text(`Remise: ${Number(d.discount_amount || 0).toFixed(2)} MAD`, 123, finalY + 23);
      pdf.text(`Payé: ${paid.toFixed(2)} MAD`, 123, finalY + 28);
      pdf.text(`Reste: ${remain.toFixed(2)} MAD`, 123, finalY + 33);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`TOTAL T.T.C: ${Number(d.total_amount || 0).toFixed(2)} MAD`, 123, finalY + 40);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const taxLines = pdf.splitTextToSize(`Infos fiscales: ${companyTax}`, 100);
      pdf.text(taxLines, 12, finalY + 14);
      pdf.text(`Mode de règlement: ${paymentStatus}`, 12, finalY + 26);
      pdf.setDrawColor(226, 232, 240);
      pdf.line(12, 280, 198, 280);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Document généré le ${new Date().toLocaleString('fr-FR')}`, 12, 286);
      pdf.text(companyName, 198, 286, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
    }
    pdf.save(
      selectedDocs.length === 1
        ? `${selectedDocs[0].doc_number}.pdf`
        : `factures-selection-${new Date().toISOString().slice(0, 10)}.pdf`
    );
  };

  const handleSettleDebt = () => {
    if (selectedInvoiceIds.length !== 1) return;
    const targetId = selectedInvoiceIds[0];
    const targetDoc = docs.find((d) => d.id === targetId);
    if (!targetDoc) return;
    const paidBefore = invoicePaidById.get(targetId) || 0;
    const remainingBefore = Math.max(0, Number(targetDoc.total_amount || 0) - paidBefore);
    const amount = Number(settlementAmount || 0);
    if (Number.isNaN(amount) || amount <= 0 || amount > remainingBefore) return;
    const paidAfter = paidBefore + amount;
    const remainingAfter = Math.max(0, Number(targetDoc.total_amount || 0) - paidAfter);
    const nextStatus = remainingAfter <= 0 ? 'paid' : paidAfter > 0 ? 'partial' : 'unpaid';
    createEvent.mutate(
      {
        document_id: targetId,
        event_type: 'payment_recorded',
        event_label: 'Règlement de dette',
        event_payload: {
          amount,
          paid_before: paidBefore,
          paid_after: paidAfter,
          remaining_after: remainingAfter,
        },
      },
      {
        onSuccess: () => {
          updateDoc.mutate(
            {
              id: targetId,
              status: nextStatus,
            },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['fact-documents'] });
                queryClient.invalidateQueries({ queryKey: ['facturation_payment_events'] });
                setSettlementAmount('');
              },
            }
          );
        },
      }
    );
  };

  const handleDownloadInvoicePdf = async (id: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    const cleanup = () => {
      if (iframe.parentNode) iframe.remove();
    };
    iframe.addEventListener('load', () => {
      window.setTimeout(cleanup, 3000);
    });
    iframe.src = `/facturation/${id}?download=1`;
    document.body.appendChild(iframe);
    // Fallback cleanup in case load event is delayed.
    window.setTimeout(cleanup, 30000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <Card className="p-0 overflow-hidden border">
          <div className="bg-sky-600 text-white px-4 py-2 flex items-center gap-6 text-sm font-medium">
            <button className={cn('transition-all duration-200 hover:scale-105 hover:brightness-110', mainModule === 'home' && 'underline')} onClick={() => setMainModule('home')}>Accueil</button>
            <button className={cn('transition-all duration-200 hover:scale-105 hover:brightness-110', mainModule === 'contacts' && 'underline')} onClick={() => setMainModule('contacts')}>Contacts</button>
            <button className={cn('transition-all duration-200 hover:scale-105 hover:brightness-110', mainModule === 'sales' && 'underline')} onClick={() => setMainModule('sales')}>Ventes</button>
            <button className={cn('transition-all duration-200 hover:scale-105 hover:brightness-110', mainModule === 'purchases' && 'underline')} onClick={() => setMainModule('purchases')}>Achats</button>
            <button className={cn('transition-all duration-200 hover:scale-105 hover:brightness-110', mainModule === 'catalog' && 'underline')} onClick={() => setMainModule('catalog')}>Produits & Services</button>
            <button className={cn('transition-all duration-200 hover:scale-105 hover:brightness-110', mainModule === 'analytics' && 'underline')} onClick={() => setMainModule('analytics')}>Analyse</button>
          </div>

          {mainModule === 'sales' ? (
            <>
              <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
                {(['devis', 'bon_commande', 'bon_livraison', 'facture'] as FactDocumentType[]).map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={currentStage === type ? 'default' : 'outline'}
                    className={cn('transition-all duration-200 hover:-translate-y-0.5', currentStage === type ? 'bg-lime-500 hover:bg-lime-600 text-black shadow-md' : 'hover:bg-white/10')}
                    onClick={() => handleStageChange(type)}
                  >
                    {docTypeLabels[type]}
                  </Button>
                ))}
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap border-t">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{stageUi.title}</h2>
                  <Button
                    size="sm"
                    className="bg-sky-500 hover:bg-sky-600"
                    onClick={() => {
                      handleNew(currentStage);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Nouveau
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
                    <Input
                      className="pl-8 w-[240px]"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes périodes</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="w-4 h-4 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les états</SelectItem>
                      <SelectItem value="draft">draft</SelectItem>
                      <SelectItem value="sent">sent</SelectItem>
                      <SelectItem value="paid">paid</SelectItem>
                      <SelectItem value="overdue">overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={String(rowsPerPage)} onValueChange={(value) => setRowsPerPage(Number(value))}>
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="25">25 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                      <SelectItem value="100">100 / page</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant={salesView === 'table' ? 'default' : 'outline'} onClick={() => setSalesView('table')}>
                    <Table2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant={salesView === 'grid' ? 'default' : 'outline'} onClick={() => setSalesView('grid')}>
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Dialog open={newDocDialogOpen} onOpenChange={setNewDocDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{`Nouveau ${docTypeLabels[currentStage].toLowerCase()} client`}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                      <Label className="md:col-span-1">Client</Label>
                      <div className="md:col-span-4 space-y-2">
                        <Input
                          ref={newDocClientSearchRef}
                          value={newDocClientSearch}
                          onChange={(e) => setNewDocClientSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter') return;
                            e.preventDefault();
                            if (!newDocClientId && newDocClientsFiltered.length > 0) {
                              setNewDocClientId(newDocClientsFiltered[0].id);
                            }
                          }}
                          placeholder="Rechercher client..."
                        />
                        <Select value={newDocClientId} onValueChange={setNewDocClientId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                          <SelectContent>
                            {newDocClientsFiltered.map((client) => (
                              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => { setNewDocDialogOpen(false); openClientCreation(); }}>
                        + Nouveau
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                      <Label className="md:col-span-1">Date</Label>
                      <div className="md:col-span-2">
                        <Input type="date" value={newDocIssueDate} onChange={(e) => setNewDocIssueDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setNewDocDialogOpen(false)}>Annuler</Button>
                      <Button onClick={handleQuickCreateDocument} disabled={!newDocClientId || createDoc.isPending}>Valider</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="px-4 pb-4">
                <div className="text-xs text-muted-foreground mb-2">
                  {salesPagedDocs.length} / {filteredDocs.length} (page {salesPageSafe}/{salesTotalPages})
                </div>
                {currentStage === 'facture' && (
                  <div className="mb-2 p-2 rounded border border-slate-700 bg-slate-900/40 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-200">Sélection: {selectedInvoiceIds.length}</span>
                    <Button size="sm" variant="outline" onClick={handleExportSelectedInvoicesPdf} disabled={selectedInvoiceIds.length === 0}>
                      <FileDown className="w-4 h-4 mr-1" />
                      PDF sélection
                    </Button>
                    <Input
                      className="w-[160px] h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      type="number"
                      placeholder="Montant règlement"
                      value={settlementAmount}
                      onChange={(e) => setSettlementAmount(e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <Button size="sm" onClick={handleSettleDebt} disabled={selectedInvoiceIds.length !== 1 || !settlementAmount}>
                      Règlement dette
                    </Button>
                    {selectedInvoiceIds.length === 1 && (
                      <span className="text-xs text-slate-300">
                        Reste: {(() => {
                          const doc = docs.find((d) => d.id === selectedInvoiceIds[0]);
                          return doc ? invoiceRemaining(doc).toFixed(2) : '0.00';
                        })()} MAD
                      </span>
                    )}
                  </div>
                )}
                {salesView === 'table' ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-sky-50 dark:bg-sky-900/20">
                          {currentStage === 'facture' && (
                            <TableHead className="w-[40px]">
                              <input
                                type="checkbox"
                                checked={salesPagedDocs.filter((d) => d.doc_type === 'facture').every((d) => selectedInvoiceIds.includes(d.id)) && salesPagedDocs.some((d) => d.doc_type === 'facture')}
                                onChange={toggleAllInvoicesOnPage}
                              />
                            </TableHead>
                          )}
                          <TableHead>Etat</TableHead>
                        <TableHead>{stageUi.numberLabel}</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead className="text-right">Montant HT</TableHead>
                          <TableHead className="text-right">Montant TTC</TableHead>
                          <TableHead className="text-right">Solde</TableHead>
                          {currentStage === 'facture' && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {docsLoading ? (
                          <TableRow>
                            <TableCell colSpan={currentStage === 'facture' ? 9 : 7} className="text-center py-8 text-muted-foreground">Chargement...</TableCell>
                          </TableRow>
                        ) : salesPagedDocs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={currentStage === 'facture' ? 9 : 7} className="text-center py-8 text-muted-foreground">Aucun document.</TableCell>
                          </TableRow>
                        ) : (
                          salesPagedDocs.map((doc) => (
                            <TableRow
                              key={doc.id}
                              className={cn('cursor-pointer', selectedId === doc.id && 'bg-primary/5')}
                              onClick={() => {
                                navigate(`/facturation/${doc.id}`);
                              }}
                            >
                              {currentStage === 'facture' && (
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <input type="checkbox" checked={selectedInvoiceIds.includes(doc.id)} onChange={() => toggleInvoiceSelection(doc.id)} />
                                </TableCell>
                              )}
                              <TableCell>{getStatusBadge(doc)}</TableCell>
                              <TableCell className="font-semibold text-sky-600">{doc.doc_number}</TableCell>
                              <TableCell>{new Date(doc.issue_date).toLocaleDateString('fr-FR')}</TableCell>
                              <TableCell>{doc.client_name}</TableCell>
                              <TableCell className="text-right">{Number(doc.subtotal || 0).toFixed(2)}</TableCell>
                              <TableCell className="text-right">{Number(doc.total_amount || 0).toFixed(2)}</TableCell>
                              <TableCell className="text-right">{invoiceRemaining(doc).toFixed(2)}</TableCell>
                              {currentStage === 'facture' && (
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-sky-600 border-sky-300 hover:bg-sky-50"
                                    onClick={() => handleDownloadInvoicePdf(doc.id)}
                                  >
                                    <FileDown className="w-4 h-4 mr-1" />
                                    Télécharger PDF
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {salesPagedDocs.map((doc) => (
                      <Card
                        key={doc.id}
                        className={cn('cursor-pointer border', selectedId === doc.id && 'ring-2 ring-primary/40')}
                        onClick={() => {
                          navigate(`/facturation/${doc.id}`);
                        }}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{doc.doc_number}</CardTitle>
                            {getStatusBadge(doc)}
                          </div>
                          <CardDescription>{new Date(doc.issue_date).toLocaleDateString('fr-FR')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                          <div className="font-medium">{doc.client_name}</div>
                          <div className="text-muted-foreground">HT: {Number(doc.subtotal || 0).toFixed(2)} MAD</div>
                          <div className="text-muted-foreground">TTC: {Number(doc.total_amount || 0).toFixed(2)} MAD</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button size="icon" variant="outline" onClick={() => setSalesPage((p) => Math.max(1, p - 1))} disabled={salesPageSafe <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">Page {salesPageSafe}/{salesTotalPages}</span>
                  <Button size="icon" variant="outline" onClick={() => setSalesPage((p) => Math.min(salesTotalPages, p + 1))} disabled={salesPageSafe >= salesTotalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : mainModule === 'contacts' ? (
            <div className="px-4 py-3 space-y-3">
              <div className="inline-flex items-center gap-2 border border-slate-200 bg-white px-2 py-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    'h-7 rounded-none border px-5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5',
                    contactsTab === 'clients' ? 'bg-lime-500 border-lime-500 text-black hover:bg-lime-600' : 'bg-lime-100 border-lime-200 text-slate-700 hover:bg-lime-200'
                  )}
                  onClick={() => setContactsTab('clients')}
                >
                  Clients
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    'h-7 rounded-none border px-5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5',
                    contactsTab === 'suppliers' ? 'bg-lime-500 border-lime-500 text-black hover:bg-lime-600' : 'bg-lime-100 border-lime-200 text-slate-700 hover:bg-lime-200'
                  )}
                  onClick={() => setContactsTab('suppliers')}
                >
                  Fournisseurs
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap border border-slate-200 bg-white px-3 py-2">
                <h3 className="text-2xl font-medium tracking-tight">
                  {contactsTab === 'suppliers' ? 'Fournisseurs' : 'Clients'}
                </h3>
                <div className="flex items-center gap-2">
                  {contactsTab === 'suppliers' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-sm text-xs font-semibold"
                      onClick={() => navigate('/fournisseurs')}
                    >
                      Module Fournisseurs
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="h-8 bg-sky-500 hover:bg-sky-600 rounded-sm text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95"
                    onClick={() => {
                      if (contactsTab === 'suppliers') {
                        openSupplierCreation();
                      } else {
                        openClientCreation();
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {contactsTab === 'suppliers' ? 'Ajouter Fournisseur' : 'Ajouter Client'}
                  </Button>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
                    <Input className="h-8 pl-8 w-[220px] rounded-sm" placeholder="Rechercher..." value={contactsSearch} onChange={(e) => setContactsSearch(e.target.value)} />
                  </div>
                </div>
              </div>
              {clientFormOpen && contactsTab === 'clients' && (
                <Card className="border-sky-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Nouveau Client</CardTitle>
                    <CardDescription>Ajout rapide depuis Facturation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-6">
                      <Label className="font-medium">Type</Label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" checked={newClientType === 'societe'} onChange={() => setNewClientType('societe')} />
                        Société
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" checked={newClientType === 'particulier'} onChange={() => setNewClientType('particulier')} />
                        Particulier
                      </label>
                    </div>

                    <div className="space-y-1">
                      <Label>Nom</Label>
                      <Input value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Nom" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="font-semibold">Adresse de facturation</Label>
                        <div className="space-y-1">
                          <Label>Adresse</Label>
                          <Input value={newClientAddress} onChange={(e) => setNewClientAddress(e.target.value)} placeholder="Adresse" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label>CP</Label>
                            <Input value={newClientPostalCode} onChange={(e) => setNewClientPostalCode(e.target.value)} placeholder="CP" />
                          </div>
                          <div className="space-y-1">
                            <Label>Ville</Label>
                            <Input value={newClientCity} onChange={(e) => setNewClientCity(e.target.value)} placeholder="Ville" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Pays</Label>
                          <Input value={newClientCountry} onChange={(e) => setNewClientCountry(e.target.value)} placeholder="Pays" />
                        </div>
                        <div className="space-y-1">
                          <Label>Code ICE</Label>
                          <Input value={newClientIce} onChange={(e) => setNewClientIce(e.target.value)} placeholder="Code ICE" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label>Code IF</Label>
                            <Input value={newClientIf} onChange={(e) => setNewClientIf(e.target.value)} placeholder="Code IF" />
                          </div>
                          <div className="space-y-1">
                            <Label>RC</Label>
                            <Input value={newClientRc} onChange={(e) => setNewClientRc(e.target.value)} placeholder="RC" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="font-semibold">Informations société</Label>
                        <div className="space-y-1">
                          <Label>Date Création</Label>
                          <Input type="date" value={newClientCreatedDate} onChange={(e) => setNewClientCreatedDate(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Téléphone</Label>
                          <Input value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} placeholder="+212 ..." />
                        </div>
                        <div className="space-y-1">
                          <Label>GSM</Label>
                          <Input value={newClientGsm} onChange={(e) => setNewClientGsm(e.target.value)} placeholder="+212 ..." />
                        </div>
                        <div className="space-y-1">
                          <Label>Fax</Label>
                          <Input value={newClientFax} onChange={(e) => setNewClientFax(e.target.value)} placeholder="Fax" />
                        </div>
                        <div className="space-y-1">
                          <Label>Email</Label>
                          <Input value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} placeholder="email@client.com" />
                        </div>
                        <div className="space-y-1">
                          <Label>Site Web</Label>
                          <Input value={newClientWebsite} onChange={(e) => setNewClientWebsite(e.target.value)} placeholder="https://..." />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="outline" onClick={() => setClientFormOpen(false)}>Annuler</Button>
                      <Button onClick={handleCreateClient}>Enregistrer</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {supplierFormOpen && contactsTab === 'suppliers' && (
                <Card className="border-sky-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Nouveau Fournisseur</CardTitle>
                    <CardDescription>Ajout rapide depuis Facturation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-6">
                      <Label className="font-medium">Type</Label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" checked={newSupplierType === 'societe'} onChange={() => setNewSupplierType('societe')} />
                        Société
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" checked={newSupplierType === 'particulier'} onChange={() => setNewSupplierType('particulier')} />
                        Particulier
                      </label>
                    </div>

                    <div className="space-y-1">
                      <Label>Nom</Label>
                      <Input value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} placeholder="Nom" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="font-semibold">Adresse de facturation</Label>
                        <div className="space-y-1">
                          <Label>Adresse</Label>
                          <Input value={newSupplierAddress} onChange={(e) => setNewSupplierAddress(e.target.value)} placeholder="Adresse" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label>CP</Label>
                            <Input value={newSupplierPostalCode} onChange={(e) => setNewSupplierPostalCode(e.target.value)} placeholder="CP" />
                          </div>
                          <div className="space-y-1">
                            <Label>Ville</Label>
                            <Input value={newSupplierCity} onChange={(e) => setNewSupplierCity(e.target.value)} placeholder="Ville" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Pays</Label>
                          <Input value={newSupplierCountry} onChange={(e) => setNewSupplierCountry(e.target.value)} placeholder="Pays" />
                        </div>
                        <div className="space-y-1">
                          <Label>Code ICE</Label>
                          <Input value={newSupplierIce} onChange={(e) => setNewSupplierIce(e.target.value)} placeholder="Code ICE" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label>Code IF</Label>
                            <Input value={newSupplierIf} onChange={(e) => setNewSupplierIf(e.target.value)} placeholder="Code IF" />
                          </div>
                          <div className="space-y-1">
                            <Label>RC</Label>
                            <Input value={newSupplierRc} onChange={(e) => setNewSupplierRc(e.target.value)} placeholder="RC" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="font-semibold">Informations société</Label>
                        <div className="space-y-1">
                          <Label>Date Création</Label>
                          <Input type="date" value={newSupplierCreatedDate} onChange={(e) => setNewSupplierCreatedDate(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Téléphone</Label>
                          <Input value={newSupplierPhone} onChange={(e) => setNewSupplierPhone(e.target.value)} placeholder="+212 ..." />
                        </div>
                        <div className="space-y-1">
                          <Label>GSM</Label>
                          <Input value={newSupplierGsm} onChange={(e) => setNewSupplierGsm(e.target.value)} placeholder="+212 ..." />
                        </div>
                        <div className="space-y-1">
                          <Label>Fax</Label>
                          <Input value={newSupplierFax} onChange={(e) => setNewSupplierFax(e.target.value)} placeholder="Fax" />
                        </div>
                        <div className="space-y-1">
                          <Label>Email</Label>
                          <Input value={newSupplierEmail} onChange={(e) => setNewSupplierEmail(e.target.value)} placeholder="email@supplier.com" />
                        </div>
                        <div className="space-y-1">
                          <Label>Site Web</Label>
                          <Input value={newSupplierWebsite} onChange={(e) => setNewSupplierWebsite(e.target.value)} placeholder="https://..." />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="outline" onClick={() => setSupplierFormOpen(false)}>Annuler</Button>
                      <Button onClick={handleCreateSupplier}>Enregistrer</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="border border-slate-700 rounded-sm overflow-hidden bg-slate-900/60 text-slate-100 [&_th]:text-slate-200 [&_td]:text-slate-100 [&_tr]:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      {contactsTab === 'clients' && <TableHead className="text-right">Total</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactsFiltered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={contactsTab === 'clients' ? 5 : 4} className="text-center py-8 text-muted-foreground">Aucun résultat trouvé.</TableCell>
                      </TableRow>
                    ) : (
                      contactsFiltered.map((row) => (
                        <TableRow key={(row as { id: string }).id}>
                          <TableCell>{(row as { name: string }).name}</TableCell>
                          <TableCell>{(row as { city: string }).city}</TableCell>
                          <TableCell>{(row as { email: string }).email}</TableCell>
                          <TableCell>{(row as { phone: string }).phone}</TableCell>
                          {contactsTab === 'clients' && (
                            <TableCell className="text-right">{Number((row as { total?: number }).total || 0).toFixed(2)} MAD</TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : mainModule === 'home' ? (
            <div className="px-4 py-4 space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                <Card className="xl:col-span-2 border-sky-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Démarrez vos ventes</CardTitle>
                    <CardDescription>Suivez les étapes</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button className="rounded-md border p-3 text-center hover:bg-muted/30" onClick={() => navigate('/societe')}><Building2 className="w-5 h-5 mx-auto mb-2 text-sky-600" /><div className="text-xs font-medium">Données de l’entreprise</div></button>
                    <button className="rounded-md border p-3 text-center hover:bg-muted/30" onClick={openClientCreation}><Users2 className="w-5 h-5 mx-auto mb-2 text-sky-600" /><div className="text-xs font-medium">Créer un client</div></button>
                    <button className="rounded-md border p-3 text-center hover:bg-muted/30" onClick={() => { setMainModule('sales'); setCurrentStage('devis'); }}><FileDown className="w-5 h-5 mx-auto mb-2 text-sky-600" /><div className="text-xs font-medium">Proposer un devis</div></button>
                    <button className="rounded-md border p-3 text-center hover:bg-muted/30" onClick={() => { setMainModule('sales'); setCurrentStage('facture'); handleNew('facture'); }}><CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-sky-600" /><div className="text-xs font-medium">Créer une facture</div></button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Activité du mois</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Devis en cours</span><span className="font-semibold">{docs.filter((d) => d.doc_type === 'devis').length}</span></div>
                    <div className="flex justify-between"><span>Factures émises</span><span className="font-semibold">{docs.filter((d) => d.doc_type === 'facture').length}</span></div>
                    <div className="flex justify-between"><span>CA du mois</span><span className="font-semibold">{(stats?.pending_devis_amount || 0).toFixed(2)} MAD</span></div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Devis clients émis</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{docs.filter((d) => d.doc_type === 'devis').length}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Factures non réglées</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats?.unpaid_invoices_count || 0}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Commandes ouvertes</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{docs.filter((d) => d.doc_type === 'bon_commande').length}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Livraisons</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{docs.filter((d) => d.doc_type === 'bon_livraison').length}</CardContent></Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Tâches / Actions</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex items-center gap-2"><ListChecks className="w-4 h-4 text-amber-500" /><span>Relancer 3 clients impayés</span></div>
                    <div className="flex items-center gap-2"><ListChecks className="w-4 h-4 text-sky-500" /><span>Valider 2 devis à envoyer</span></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Situation ventes HT</CardTitle></CardHeader>
                  <CardContent className="flex items-center gap-3 text-sm">
                    <Activity className="w-10 h-10 text-sky-500" />
                    <div>
                      <div>DV/BC/FA ce mois</div>
                      <div className="font-semibold">{docs.length} documents</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Calendrier</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <Button size="icon" variant="ghost" onClick={() => setHomeMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="font-semibold capitalize">{homeCalendar.monthLabel}</div>
                      <Button size="icon" variant="ghost" onClick={() => setHomeMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-muted-foreground">
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, idx) => <div key={`${d}-${idx}`}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {homeCalendar.cells.map((cell, idx) => (
                        <div
                          key={`cal-${idx}`}
                          className={cn(
                            'h-7 rounded border text-[10px] flex items-center justify-center',
                            !cell.day && 'border-transparent',
                            cell.overdueCount && cell.overdueCount > 0 && 'bg-red-100 text-red-700 border-red-300'
                          )}
                        >
                          {cell.day || ''}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">{docs.filter((d) => d.status === 'overdue').length} échéances en retard</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : mainModule === 'purchases' ? (
            <div className="px-4 py-4 space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Fournisseurs actifs</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{(achatsSuppliersQ.data || []).length}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Bons de commande</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{purchasesRows.length}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Factures fournisseurs</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{supplierInvoicesRows.length}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Montant achats</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{(purchasesRows.reduce((acc, r) => acc + r.amount, 0) + supplierInvoicesRows.reduce((acc, r) => acc + r.amount, 0)).toFixed(2)} MAD</CardContent></Card>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant={achatsTab === 'orders' ? 'default' : 'outline'} className="transition-all duration-200 hover:-translate-y-0.5" onClick={() => setAchatsTab('orders')}>Commandes</Button>
                <Button size="sm" variant={achatsTab === 'invoices' ? 'default' : 'outline'} className="transition-all duration-200 hover:-translate-y-0.5" onClick={() => setAchatsTab('invoices')}>Factures fournisseurs</Button>
                <Button size="sm" variant="outline" className="transition-all duration-200 hover:-translate-y-0.5" onClick={() => navigate('/fournisseurs')}>Module Fournisseurs</Button>
              </div>

              {achatsTab === 'orders' ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Nouveau Bon de commande fournisseur</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Select value={newPurchaseSupplierId} onValueChange={setNewPurchaseSupplierId}>
                      <SelectTrigger><SelectValue placeholder="Choisir fournisseur" /></SelectTrigger>
                      <SelectContent>
                        {(achatsSuppliersQ.data || []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.legal_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Montant HT"
                      value={newPurchaseAmount}
                      onChange={(e) => setNewPurchaseAmount(e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <Button className="transition-all duration-200 hover:scale-[1.02] active:scale-95" onClick={handleCreatePurchaseOrderQuick} disabled={createPurchaseOrder.isPending}>Créer BC</Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Nouvelle Facture fournisseur</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Select value={newInvoiceSupplierId} onValueChange={setNewInvoiceSupplierId}>
                      <SelectTrigger><SelectValue placeholder="Choisir fournisseur" /></SelectTrigger>
                      <SelectContent>
                        {(achatsSuppliersQ.data || []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.legal_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Montant HT"
                      value={newInvoiceAmount}
                      onChange={(e) => setNewInvoiceAmount(e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <Button className="transition-all duration-200 hover:scale-[1.02] active:scale-95" onClick={handleCreateSupplierInvoiceQuick} disabled={createSupplierInvoice.isPending}>Créer facture</Button>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Input className="w-[260px]" placeholder="Rechercher référence / fournisseur..." value={achatsSearch} onChange={(e) => setAchatsSearch(e.target.value)} />
                <Select value={achatsStatusFilter} onValueChange={setAchatsStatusFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="draft">draft</SelectItem>
                    <SelectItem value="sent">sent</SelectItem>
                    <SelectItem value="approved">approved</SelectItem>
                    <SelectItem value="paid">paid</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">{achatsPagedRows.length} / {achatsFilteredRows.length}</span>
              </div>

              <div className="border border-slate-700 rounded-md overflow-hidden bg-slate-900/60 text-slate-100 [&_th]:text-slate-200 [&_td]:text-slate-100 [&_tr]:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Date</TableHead>
                      {achatsTab === 'invoices' && <TableHead>Échéance</TableHead>}
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {achatsPagedRows.length === 0 ? (
                      <TableRow><TableCell colSpan={achatsTab === 'orders' ? 6 : 7} className="text-center py-8 text-muted-foreground">Aucune donnée achats.</TableCell></TableRow>
                    ) : (
                      achatsPagedRows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>{row.ref}</TableCell>
                          <TableCell>{row.supplier}</TableCell>
                          <TableCell>{new Date(row.date).toLocaleDateString('fr-FR')}</TableCell>
                          {achatsTab === 'invoices' && <TableCell>{row.dueDate ? new Date(row.dueDate).toLocaleDateString('fr-FR') : '-'}</TableCell>}
                          <TableCell className="text-right">{row.amount.toFixed(2)} MAD</TableCell>
                          <TableCell><Badge variant="outline">{row.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  achatsTab === 'orders'
                                    ? handleAdvancePurchaseOrderStatus(row.id, row.status)
                                    : handleAdvanceSupplierInvoiceStatus(row.id, row.status)
                                }
                              >
                                Next
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  achatsTab === 'orders'
                                    ? handleArchivePurchaseOrder(row.id)
                                    : handleArchiveSupplierInvoice(row.id)
                                }
                              >
                                Archiver
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button size="icon" variant="outline" onClick={() => setAchatsPage((p) => Math.max(1, p - 1))} disabled={achatsPageSafe <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground">Page {achatsPageSafe}/{achatsTotalPages}</span>
                <Button size="icon" variant="outline" onClick={() => setAchatsPage((p) => Math.min(achatsTotalPages, p + 1))} disabled={achatsPageSafe >= achatsTotalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : mainModule === 'catalog' ? (
            <div className="px-4 py-4 space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Articles</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{catalogRows.length}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Valeur stock</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{catalogRows.reduce((acc, i) => acc + Number((i as StockItem).unit_price || 0) * Number((i as StockItem).quantity || 0), 0).toFixed(2)} MAD</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Stock faible</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{catalogRows.filter((i) => Number((i as StockItem).quantity || 0) <= Number((i as StockItem).min_quantity || 0)).length}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Dernière MAJ</CardTitle></CardHeader><CardContent className="text-sm font-semibold">{new Date().toLocaleDateString('fr-FR')}</CardContent></Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Nouveau produit / service</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-2">
                  <Input placeholder="Nom" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
                  <Input placeholder="Catégorie" value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)} />
                  <Input placeholder="Unité" value={newProductUnit} onChange={(e) => setNewProductUnit(e.target.value)} />
                  <Input
                    placeholder="Prix"
                    type="number"
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <Input
                    placeholder="Stock initial"
                    type="number"
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <Button className="transition-all duration-200 hover:scale-[1.02] active:scale-95" onClick={handleAddCatalogItem} disabled={createCatalogItem.isPending}>
                    <PackagePlus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </CardContent>
              </Card>

              <div className="flex items-center gap-2 flex-wrap">
                <Input className="w-[260px]" placeholder="Rechercher article..." value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} />
                <Select value={catalogCategoryFilter} onValueChange={setCatalogCategoryFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Produit">Produit</SelectItem>
                    <SelectItem value="Pièce">Pièce</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">{catalogPagedRows.length} / {catalogFilteredRows.length}</span>
              </div>

              <div className="border border-slate-700 rounded-md overflow-hidden bg-slate-900/60 text-slate-100 [&_th]:text-slate-200 [&_td]:text-slate-100 [&_tr]:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Unité</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalogPagedRows.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun article.</TableCell></TableRow>
                    ) : (
                      catalogPagedRows.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>{(item as StockItem).name}</TableCell>
                          <TableCell>{(item as StockItem).category}</TableCell>
                          <TableCell>{(item as StockItem).unit}</TableCell>
                          <TableCell className="text-right">{Number((item as StockItem).unit_price || 0).toFixed(2)} MAD</TableCell>
                          <TableCell className="text-right">{Number((item as StockItem).quantity || 0)}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateCatalogItem.mutate({
                                    id: item.id,
                                    updates: { quantity: Number((item as StockItem).quantity || 0) + 1 },
                                  })
                                }
                              >
                                +1
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateCatalogItem.mutate({
                                    id: item.id,
                                    updates: { quantity: Math.max(0, Number((item as StockItem).quantity || 0) - 1) },
                                  })
                                }
                              >
                                -1
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => deleteCatalogItem.mutate(item.id)}>
                                Suppr.
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button size="icon" variant="outline" onClick={() => setCatalogPage((p) => Math.max(1, p - 1))} disabled={catalogPageSafe <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground">Page {catalogPageSafe}/{catalogTotalPages}</span>
                <Button size="icon" variant="outline" onClick={() => setCatalogPage((p) => Math.min(catalogTotalPages, p + 1))} disabled={catalogPageSafe >= catalogTotalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">CA Facturé</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{analyticsSummary.revenue.toFixed(2)} MAD</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Taux conversion</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{analyticsSummary.conversionRate.toFixed(1)}%</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Impayés</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{analyticsSummary.overdue.toFixed(2)} MAD</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Panier moyen</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{analyticsSummary.averageTicket.toFixed(2)} MAD</CardContent></Card>
              </div>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Top clients (Poids CA)</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {clientsSummary.slice(0, 8).map((c) => {
                    const percent = analyticsSummary.revenue > 0 ? (c.total / analyticsSummary.revenue) * 100 : 0;
                    return (
                      <div key={c.client}>
                        <div className="flex justify-between text-xs">
                          <span>{c.client}</span>
                          <span>{c.total.toFixed(2)} MAD</span>
                        </div>
                        <div className="h-2 rounded bg-muted mt-1">
                          <div className="h-2 rounded bg-sky-500" style={{ width: `${Math.min(percent, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}
        </Card>

        {false && mainModule === 'sales' && editorOpen && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <Card className="xl:col-span-8">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle>Éditeur</CardTitle>
                    <CardDescription>{editor.id ? 'Modification document' : 'Nouveau document'}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant={activeTab === 'editor' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('editor')}>Édition</Button>
                    <Button variant={activeTab === 'preview' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('preview')}><Eye className="w-4 h-4 mr-1" />Preview</Button>
                    <Button size="sm" onClick={handleSave} disabled={createDoc.isPending || updateDoc.isPending || replaceItems.isPending}>Enregistrer</Button>
                    <Button size="sm" variant="outline" onClick={handleConvert} disabled={!editor.id || !nextTypeMap[editor.doc_type] || convertDoc.isPending}><ArrowRightLeft className="w-4 h-4 mr-1" />Convertir</Button>
                    <Button size="sm" variant="outline" onClick={exportPreview}><FileDown className="w-4 h-4 mr-1" />PDF</Button>
                    <Button size="sm" variant="outline" onClick={handleSendEmail} disabled={!editor.id || !editor.client_email || sendEmail.isPending}><Mail className="w-4 h-4 mr-1" />Email</Button>
                    <Button size="sm" variant="outline" onClick={handleSendWhatsApp} disabled={!editor.id || !editor.client_phone || sendWhatsApp.isPending}><MessageCircle className="w-4 h-4 mr-1" />WhatsApp</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeTab === 'editor' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input value={editor.client_name} onChange={(e) => setEditor((p) => ({ ...p, client_name: e.target.value }))} placeholder="Client" />
                      <Input value={editor.client_email} onChange={(e) => setEditor((p) => ({ ...p, client_email: e.target.value }))} placeholder="Email" />
                      <Input value={editor.client_phone} onChange={(e) => setEditor((p) => ({ ...p, client_phone: e.target.value }))} placeholder="Téléphone" />
                    </div>
                    <Textarea value={editor.client_address} onChange={(e) => setEditor((p) => ({ ...p, client_address: e.target.value }))} placeholder="Adresse" rows={2} />
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <Select value={editor.language} onValueChange={(value: FactLanguage) => setEditor((p) => ({ ...p, language: value, direction: value === 'ar' ? 'rtl' : 'ltr' }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={editor.template_type} onValueChange={(value: FactTemplateType) => setEditor((p) => ({ ...p, template_type: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="minimalist">Minimalist</SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={editor.tax_rate === 0 ? '' : editor.tax_rate}
                        onChange={(e) => setEditor((p) => ({ ...p, tax_rate: Number(e.target.value || 0) }))}
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="TVA %"
                      />
                      <Input
                        type="number"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={editor.discount_amount === 0 ? '' : editor.discount_amount}
                        onChange={(e) => setEditor((p) => ({ ...p, discount_amount: Number(e.target.value || 0) }))}
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="Remise"
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2"><Switch checked={editor.show_header} onCheckedChange={(checked) => setEditor((p) => ({ ...p, show_header: checked }))} /><span className="text-xs">Header</span></div>
                        <div className="flex items-center gap-2"><Switch checked={editor.show_footer} onCheckedChange={(checked) => setEditor((p) => ({ ...p, show_footer: checked }))} /><span className="text-xs">Footer</span></div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Input value={customColumnDraft} onChange={(e) => setCustomColumnDraft(e.target.value)} placeholder="Ajouter colonne dynamique..." />
                      <Button type="button" variant="outline" onClick={addCustomColumn}>Ajouter</Button>
                    </div>

                    <div className="space-y-2">
                      {editor.items.map((item, idx) => (
                        <div key={`line-${idx}`} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                          <Input className="md:col-span-5" value={String(item.description || '')} placeholder="Description" onChange={(e) => updateItem(idx, { description: e.target.value })} />
                          <Input
                            className="md:col-span-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            type="number"
                            value={Number(item.quantity || 0) === 0 ? '' : Number(item.quantity || 0)}
                            onChange={(e) => updateItem(idx, { quantity: Number(e.target.value || 0) })}
                            onFocus={(e) => e.currentTarget.select()}
                            placeholder="Qté"
                          />
                          <Input
                            className="md:col-span-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            type="number"
                            value={Number(item.unit_price || 0) === 0 ? '' : Number(item.unit_price || 0)}
                            onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value || 0) })}
                            onFocus={(e) => e.currentTarget.select()}
                            placeholder="PU"
                          />
                          <Input
                            className="md:col-span-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            type="number"
                            value={Number(item.discount_rate || 0) === 0 ? '' : Number(item.discount_rate || 0)}
                            onChange={(e) => updateItem(idx, { discount_rate: Number(e.target.value || 0) })}
                            onFocus={(e) => e.currentTarget.select()}
                            placeholder="Rem%"
                          />
                          <Button className="md:col-span-1" type="button" variant="ghost" onClick={() => setEditor((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}>×</Button>
                          {editor.custom_columns.length > 0 && (
                            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-2">
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
                        </div>
                      ))}
                    </div>

                    <Button type="button" variant="outline" size="sm" onClick={() => setEditor((p) => ({ ...p, items: [...p.items, defaultItem()] }))}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter ligne
                    </Button>
                  </div>
                ) : (
                  <div className={cn('rounded-lg p-4 min-h-[380px] transition-all', templateClassMap[editor.template_type], editor.direction === 'rtl' && 'text-right')} dir={editor.direction}>
                    {editor.show_header && (
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="text-xl font-bold">{company?.company_name || 'Société'}</div>
                          <div className="text-xs opacity-80">{company?.address || '-'}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold uppercase">{editor.doc_type.replace('_', ' ')}</div>
                          <div className="text-xs">{editor.issue_date}</div>
                        </div>
                      </div>
                    )}
                    <div className="mb-3 text-sm">
                      <div className="font-semibold">{editor.client_name || 'Client'}</div>
                      <div className="opacity-80">{editor.client_address || '-'}</div>
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
                              <TableCell>{it.description || '-'}</TableCell>
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
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-4">
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>Suivi des transformations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[540px] overflow-auto">
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
        )}
      </div>
    </DashboardLayout>
  );
}
