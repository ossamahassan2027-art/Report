import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Copy,
  Download,
  FileArchive,
  FileCheck2,
  FileImage,
  FileSpreadsheet,
  FileText,
  History,
  ImagePlus,
  Layers,
  MessageCircle,
  PenTool,
  Plus,
  Printer,
  QrCode,
  Redo2,
  RotateCcw,
  Save,
  Sparkles,
  Stamp,
  Trash2,
  Undo2,
  Upload,
  Wand2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  ALL_INITIAL_CERT_TEMPLATES,
  BEHEIRA_YOUTH_LOGO_SVG,
  CENTER_REHAB_LOGO_SVG,
  CERTIFICATE_TEMPLATES_LIST,
  DEFAULT_OFFICIAL_BEHEIRA_RECIPIENTS,
  OFFICIAL_BEHEIRA_STATEMENT_TEMPLATE,
  STATEMENT_TEMPLATES_LIST,
} from '../data/certificateTemplates';
import {
  CertBatchRegistryEntry,
  CertCanvasElement,
  CertCanvasElementKind,
  CertificateKind,
  CertificateTemplateDef,
  CertRecipientRow,
  READY_STATEMENT_TEXT_LIBRARY,
} from '../types/certificates';
import {
  appendCertBatchRegistryEntry,
  assignBatchSerials,
  buildWhatsAppMessageText,
  buildWhatsAppUrl,
  exportBatchPngsZip,
  exportBatchSinglePdf,
  exportBatchWordDocx,
  exportBatchZipPdfs,
  loadCertBatchRegistry,
  loadSavedCustomCertTemplates,
  parseRecipientsFromExcelFile,
  parseRecipientsFromSmartText,
  saveCustomCertTemplates,
  smartFixRecipientNames,
  validateRecipientRow,
  validateRecipientsBatch,
} from '../utils/certificateBatchEngine';
import { normalizeArabicTextStrict } from '../utils/cvSmartSuite';
import { copyTextToClipboard } from '../utils/storageAndBackup';
import { OfficialCertificateCanvas } from './OfficialCertificateCanvas';

interface CertificatesStatementsStudioProps {
  buttonRadiusClass: string;
  onNotify: (msg: string) => void;
}

const ELEMENT_PALETTE_ITEMS: {
  kind: CertCanvasElementKind;
  label: string;
  defaultText: string;
  defaultFontSize: number;
  defaultColor: string;
}[] = [
  { kind: 'free-text', label: 'نص حر', defaultText: 'نص مخصص قابل للتعديل', defaultFontSize: 20, defaultColor: '#1A237E' },
  { kind: 'name', label: 'الاسم', defaultText: '[الاسم]', defaultFontSize: 26, defaultColor: '#000000' },
  { kind: 'date', label: 'التاريخ', defaultText: 'التاريخ: [التاريخ]', defaultFontSize: 16, defaultColor: '#1E293B' },
  { kind: 'signature', label: 'التوقيع', defaultText: 'توقيع: د / أيمن الجمال', defaultFontSize: 18, defaultColor: '#1A237E' },
  { kind: 'stamp', label: 'الختم', defaultText: 'ختم المديرية المعتمد', defaultFontSize: 14, defaultColor: '#B71C1C' },
  { kind: 'logo', label: 'الشعار', defaultText: '', defaultFontSize: 14, defaultColor: '#1A237E' },
  { kind: 'photo', label: 'صورة', defaultText: '', defaultFontSize: 14, defaultColor: '#1A237E' },
  { kind: 'divider', label: 'خط فاصل', defaultText: '', defaultFontSize: 14, defaultColor: '#F59E0B' },
  { kind: 'serial', label: 'رقم تسلسلي', defaultText: 'الرقم: [التسلسلي]', defaultFontSize: 14, defaultColor: '#334155' },
  { kind: 'qr', label: 'QR Code', defaultText: '', defaultFontSize: 14, defaultColor: '#0F172A' },
];

export const CertificatesStatementsStudio: React.FC<CertificatesStatementsStudioProps> = ({
  buttonRadiusClass,
  onNotify,
}) => {
  // Default to Statements -> Official Beheira Statement #1
  const [kindMode, setKindMode] = useState<'statement' | 'certificate' | 'custom'>('statement');
  const [customTemplates, setCustomTemplates] = useState<CertificateTemplateDef[]>(() =>
    loadSavedCustomCertTemplates()
  );
  const [activeTemplate, setActiveTemplate] = useState<CertificateTemplateDef>(
    () => OFFICIAL_BEHEIRA_STATEMENT_TEMPLATE
  );

  const [recipients, setRecipients] = useState<CertRecipientRow[]>(
    () => DEFAULT_OFFICIAL_BEHEIRA_RECIPIENTS
  );
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [generatedActive, setGeneratedActive] = useState<boolean>(false);

  // Canvas Interactive State + Undo/Redo
  const [canvasElements, setCanvasElements] = useState<CertCanvasElement[]>(
    () => OFFICIAL_BEHEIRA_STATEMENT_TEMPLATE.defaultElements || []
  );
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [historyStack, setHistoryStack] = useState<
    { tpl: CertificateTemplateDef; els: CertCanvasElement[] }[]
  >([]);
  const [redoStack, setRedoStack] = useState<
    { tpl: CertificateTemplateDef; els: CertCanvasElement[] }[]
  >([]);
  const [addFieldMenuOpen, setAddFieldMenuOpen] = useState<boolean>(false);

  // Studio side tabs
  const [studioTab, setStudioTab] = useState<'template' | 'batch' | 'export' | 'registry'>(
    'template'
  );
  const [importMethodTab, setImportMethodTab] = useState<'excel' | 'paste' | 'manual'>(
    'manual'
  );
  const [smartPasteText, setSmartPasteText] = useState<string>('');
  const [showQrOnCard, setShowQrOnCard] = useState<boolean>(true);
  const [customSignatureUrl, setCustomSignatureUrl] = useState<string>('');
  const [customStampUrl, setCustomStampUrl] = useState<string>('');
  const [saveTemplateName, setSaveTemplateName] = useState<string>('');
  const [editThisCardOnly, setEditThisCardOnly] = useState<boolean>(false);
  const [batchBusyLabel, setBatchBusyLabel] = useState<string>('');
  const [showWhatsAppPanel, setShowWhatsAppPanel] = useState<boolean>(false);
  const [registryList, setRegistryList] = useState<CertBatchRegistryEntry[]>(() =>
    loadCertBatchRegistry()
  );

  // Preview Scaling for responsive display of 1123x794 canvas
  const previewStageRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState<number>(0.68);
  const batchCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Hidden file inputs
  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const rightLogoInputRef = useRef<HTMLInputElement | null>(null);
  const leftLogoInputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const stampInputRef = useRef<HTMLInputElement | null>(null);
  const elementImageInputRef = useRef<{
    kind: 'logo' | 'photo';
    elRef: HTMLInputElement | null;
  }>({ kind: 'logo', elRef: null });

  useEffect(() => {
    const updateScale = () => {
      const el = previewStageRef.current;
      if (!el) return;
      const available = el.clientWidth - 20;
      setPreviewScale(Math.min(0.95, Math.max(0.28, available / 1123)));
    };
    updateScale();
    const obs = new ResizeObserver(updateScale);
    if (previewStageRef.current) obs.observe(previewStageRef.current);
    window.addEventListener('resize', updateScale);
    return () => {
      obs.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const validation = useMemo(() => validateRecipientsBatch(recipients), [recipients]);
  const safeIndex = Math.min(activePreviewIndex, Math.max(0, recipients.length - 1));
  const currentRecipient: CertRecipientRow = recipients[safeIndex] || {
    id: 'fallback',
    serial: 'CERT-2026-001',
    fullName: 'أسامة حسن علي الصماد',
    roleOrCourse: 'المدير الفني الإداري للمركز',
    grade: 'امتياز',
    dateStr: '1/10/2022',
    phone: '00201069579757',
    status: 'valid',
    issues: [],
  };

  const pushHistory = () => {
    setHistoryStack((prev) => [
      ...prev.slice(-24),
      { tpl: activeTemplate, els: canvasElements },
    ]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const prevItem = historyStack[historyStack.length - 1];
    setRedoStack((r) => [...r, { tpl: activeTemplate, els: canvasElements }]);
    setHistoryStack((h) => h.slice(0, -1));
    setActiveTemplate(prevItem.tpl);
    setCanvasElements(prevItem.els);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextItem = redoStack[redoStack.length - 1];
    setHistoryStack((h) => [...h, { tpl: activeTemplate, els: canvasElements }]);
    setRedoStack((r) => r.slice(0, -1));
    setActiveTemplate(nextItem.tpl);
    setCanvasElements(nextItem.els);
  };

  const handleSelectTemplate = (tpl: CertificateTemplateDef) => {
    pushHistory();
    setActiveTemplate(tpl);
    setCanvasElements(tpl.defaultElements || []);
    setSelectedElementId(null);
    onNotify(`تم تفعيل: ${tpl.name}`);
  };

  const updateTemplateField = (patch: Partial<CertificateTemplateDef>) => {
    pushHistory();
    setActiveTemplate((prev) => ({ ...prev, ...patch }));
  };

  const handleAddElement = (kind: CertCanvasElementKind, imageDataUrl?: string) => {
    const preset = ELEMENT_PALETTE_ITEMS.find((p) => p.kind === kind)!;
    pushHistory();
    const newEl: CertCanvasElement = {
      id: `cel-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      kind,
      label: preset.label,
      text: preset.defaultText,
      xPercent: 50,
      yPercent: 50,
      widthPercent: kind === 'divider' ? 50 : kind === 'qr' || kind === 'stamp' ? 12 : 28,
      fontSizePx: preset.defaultFontSize,
      fontId: 'cairo',
      color: preset.defaultColor,
      bold: kind === 'name' || kind === 'free-text',
      italic: false,
      underline: false,
      align: 'center',
      rotationDeg: 0,
      locked: false,
      zIndex: 20 + canvasElements.length,
      imageDataUrl,
    };
    setCanvasElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
    setAddFieldMenuOpen(false);
    onNotify(`تمت إضافة عنصر "${preset.label}" في منتصف اللوحة — اسحبه للمكان المطلوب`);
  };

  const handleUpdateElement = (id: string, patch: Partial<CertCanvasElement>) => {
    if (editThisCardOnly && currentRecipient) {
      const baseList = currentRecipient.perCardElementsOverride || canvasElements;
      const updatedList = baseList.map((el) => (el.id === id ? { ...el, ...patch } : el));
      setRecipients((prev) =>
        prev.map((r, idx) =>
          idx === safeIndex ? { ...r, perCardElementsOverride: updatedList } : r
        )
      );
      return;
    }
    setCanvasElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...patch } : el))
    );
  };

  const handleDeleteElement = (id: string) => {
    pushHistory();
    setCanvasElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleDuplicateElement = (id: string) => {
    const src = canvasElements.find((el) => el.id === id);
    if (!src) return;
    pushHistory();
    const copy: CertCanvasElement = {
      ...src,
      id: `cel-dup-${Date.now()}`,
      xPercent: Math.min(88, src.xPercent + 4),
      yPercent: Math.min(88, src.yPercent + 4),
      zIndex: 20 + canvasElements.length + 1,
    };
    setCanvasElements((prev) => [...prev, copy]);
    setSelectedElementId(copy.id);
  };

  const handleReorderElementZ = (id: string, delta: 1 | -1) => {
    setCanvasElements((prev) =>
      prev.map((el) =>
        el.id === id ? { ...el, zIndex: Math.max(5, el.zIndex + delta * 2) } : el
      )
    );
  };

  const handleSmartImproveTemplateText = () => {
    pushHistory();
    setActiveTemplate((prev) => ({
      ...prev,
      headerTitle: normalizeArabicTextStrict(prev.headerTitle),
      introLine: normalizeArabicTextStrict(prev.introLine),
      bodyParagraphBeforeName: normalizeArabicTextStrict(prev.bodyParagraphBeforeName),
      bodyParagraphAfterRole: normalizeArabicTextStrict(prev.bodyParagraphAfterRole),
      closingLine: normalizeArabicTextStrict(prev.closingLine),
    }));
    onNotify('✨ تم تنقيح وتحسين صياغة الإفادة / الشهادة لغوياً بنجاح');
  };

  const handleSaveModifiedTemplate = () => {
    const title = saveTemplateName.trim() || `${activeTemplate.name} (نسخة معدلة)`;
    const saved: CertificateTemplateDef = {
      ...activeTemplate,
      id: `custom-tpl-${Date.now()}`,
      name: title,
      isDefaultOfficial: false,
      isCustomSaved: true,
      defaultElements: canvasElements,
    };
    const next = [saved, ...customTemplates];
    setCustomTemplates(next);
    saveCustomCertTemplates(next);
    setSaveTemplateName('');
    onNotify(`تم حفظ القالب "${title}" في قوالبك الخاصة ✓`);
  };

  const handleUploadImageFile = (
    file: File,
    onDone: (dataUrl: string) => void
  ) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onDone(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImportExcel = async (file: File) => {
    try {
      const parsed = await parseRecipientsFromExcelFile(file);
      if (parsed.length === 0) {
        onNotify('لم يتم العثور على صفوف أسماء صالحة داخل ملف Excel');
        return;
      }
      setRecipients(parsed);
      setActivePreviewIndex(0);
      setGeneratedActive(true);
      onNotify(`تم استيراد ${parsed.length} مستلم من ملف Excel بنجاح ✓`);
    } catch {
      onNotify('تعذر قراءة ملف Excel، تأكد من أنه بصيغة .xlsx أو .csv');
    }
  };

  const handleDownloadSampleExcel = () => {
    const rows = [
      {
        الاسم: 'مازن كرم عطيه زكي',
        الوظيفة: 'أخصائية تخاطب',
        التقدير: 'امتياز',
        التاريخ: '1/2/2024',
        الهاتف: '01000000001',
      },
      {
        الاسم: 'أسامة حسن علي الصماد',
        الوظيفة: 'المدير الفني الإداري للمركز',
        التقدير: 'امتياز',
        التاريخ: '1/10/2022',
        الهاتف: '00201069579757',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المستلمون');
    XLSX.writeFile(wb, 'نموذج-استيراد-الشهادات-والإفادات.xlsx');
    onNotify('تم تحميل ملف Excel النموذجي');
  };

  const handleParseSmartPaste = () => {
    const parsed = parseRecipientsFromSmartText(smartPasteText);
    if (parsed.length === 0) {
      onNotify('الصق أسطر الأسماء أولاً للتحليل الذكي');
      return;
    }
    setRecipients(parsed);
    setActivePreviewIndex(0);
    setGeneratedActive(true);
    onNotify(`تم تفريغ ${parsed.length} اسم تلقائياً من النص ✓`);
  };

  const handleGenerateBatchNow = () => {
    if (recipients.length === 0) {
      onNotify('أضف مستلماً واحداً على الأقل قبل التوليد');
      return;
    }
    if (validation.missingCount > 0) {
      setStudioTab('batch');
      onNotify(
        `بوابة الجودة: ${validation.summaryBadge} — أكمل البيانات الناقصة باللون الأصفر قبل التصدير`
      );
      return;
    }
    setGeneratedActive(true);
    setActivePreviewIndex(0);
    setStudioTab('export');

    const entry: CertBatchRegistryEntry = {
      id: `batch-${Date.now()}`,
      createdAt: new Date().toLocaleString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      templateId: activeTemplate.id,
      templateName: activeTemplate.name,
      kind: activeTemplate.kind,
      count: recipients.length,
      names: recipients.map((r) => r.fullName),
      recipients,
    };
    setRegistryList(appendCertBatchRegistryEntry(entry));
    onNotify(`✨ تم توليد ${recipients.length} ${activeTemplate.kind === 'statement' ? 'إفادة' : 'شهادة'} وحفظها في السجل!`);
  };

  const ensureQualityGatePassed = (): boolean => {
    if (recipients.length === 0) {
      onNotify('لا توجد أسماء للتصدير');
      return false;
    }
    if (validation.missingCount > 0) {
      onNotify(`توقف التصدير: ${validation.summaryBadge} — أكمل الحقول الناقصة أولاً`);
      return false;
    }
    return true;
  };

  const collectBatchCardItems = () => {
    return recipients
      .map((rec) => ({
        el: batchCardRefs.current[rec.id],
        recipient: rec,
        kind: activeTemplate.kind as CertificateKind,
      }))
      .filter((item): item is { el: HTMLDivElement; recipient: CertRecipientRow; kind: CertificateKind } =>
        Boolean(item.el)
      );
  };

  const handleRunBatchExport = async (
    mode: 'single-pdf' | 'zip-pdfs' | 'zip-pngs' | 'word'
  ) => {
    if (!ensureQualityGatePassed()) return;
    if (mode === 'word') {
      setBatchBusyLabel('جارٍ بناء ملف Word جماعي...');
      try {
        await exportBatchWordDocx(
          recipients,
          activeTemplate,
          `دفعة-${activeTemplate.kind === 'statement' ? 'إفادات' : 'شهادات'}-${recipients.length}.docx`
        );
        onNotify(`تم تصدير ${recipients.length} مستند في ملف Word واحد ✓`);
      } finally {
        setBatchBusyLabel('');
      }
      return;
    }

    const items = collectBatchCardItems();
    if (items.length === 0) {
      onNotify('جارٍ تحضير البطاقات، أعد المحاولة بعد لحظة');
      return;
    }

    setBatchBusyLabel(
      mode === 'single-pdf'
        ? `جارٍ تجميع ${items.length} صفحة PDF...`
        : mode === 'zip-pdfs'
          ? `جارٍ ضغط ${items.length} ملف PDF في ZIP...`
          : `جارٍ تصدير ${items.length} صورة PNG عالية الجودة...`
    );

    try {
      if (mode === 'single-pdf') {
        await exportBatchSinglePdf(
          items.map((i) => i.el),
          `دفعة-${activeTemplate.kind === 'statement' ? 'إفادات' : 'شهادات'}-${items.length}.pdf`
        );
        onNotify(`تم تصدير ملف PDF واحد يحتوي على ${items.length} صفحة ✓`);
      } else if (mode === 'zip-pdfs') {
        await exportBatchZipPdfs(
          items,
          `${activeTemplate.kind === 'statement' ? 'إفادات' : 'شهادات'}-${items.length}-ZIP.zip`
        );
        onNotify(`تم تنزيل ملف ZIP يضم ${items.length} PDF بأسماء المستلمين ✓`);
      } else if (mode === 'zip-pngs') {
        await exportBatchPngsZip(
          items,
          `صور-${activeTemplate.kind === 'statement' ? 'إفادات' : 'شهادات'}-${items.length}.zip`
        );
        onNotify(`تم تنزيل ${items.length} صورة PNG عالية الدقة ✓`);
      }
    } catch {
      onNotify('حدث خطأ أثناء إنشاء الملف الجماعي');
    } finally {
      setBatchBusyLabel('');
    }
  };

  const handlePrintLandscapeBatch = () => {
    if (!ensureQualityGatePassed()) return;
    document.body.classList.add('print-landscape-certs');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('print-landscape-certs');
      }, 600);
    }, 80);
  };

  const templatesToShow =
    kindMode === 'statement'
      ? STATEMENT_TEMPLATES_LIST
      : kindMode === 'certificate'
        ? CERTIFICATE_TEMPLATES_LIST
        : customTemplates;

  const activeCardElements =
    editThisCardOnly && currentRecipient.perCardElementsOverride
      ? currentRecipient.perCardElementsOverride
      : canvasElements;

  return (
    <div dir="rtl" className="space-y-4">
      {/* Hidden File Upload Inputs */}
      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImportExcel(f);
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        ref={rightLogoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUploadImageFile(f, (url) => updateTemplateField({ rightLogoDataUrl: url }));
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        ref={leftLogoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUploadImageFile(f, (url) => updateTemplateField({ leftLogoDataUrl: url }));
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        ref={signatureInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUploadImageFile(f, setCustomSignatureUrl);
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        ref={stampInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUploadImageFile(f, setCustomStampUrl);
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        ref={(node) => {
          elementImageInputRef.current.elRef = node;
        }}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            const k = elementImageInputRef.current.kind;
            handleUploadImageFile(f, (url) => handleAddElement(k, url));
          }
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Top Studio Banner */}
      <section className="no-print bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-editorial text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D97706]" />
              <span>استوديو الشهادات والإفادات الجماعية — محرر اللوحة الحر</span>
            </h2>
            <p className="text-[11.5px] text-[#64748B]">
              16 قالباً جاهزاً (8 شهادات + 8 إفادات منها القالب الرسمي لمديرية الشباب والرياضة بالبحيرة) · توليد 40 شهادة من Excel بضغطة واحدة
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quality Status Pill */}
            <div
              className={`px-3 py-1.5 text-xs font-bold border inline-flex items-center gap-1.5 ${buttonRadiusClass}`}
              style={{
                backgroundColor: validation.missingCount === 0 ? '#ECFDF5' : '#FFFBEB',
                borderColor: validation.missingCount === 0 ? '#A7F3D0' : '#FDE68A',
                color: validation.missingCount === 0 ? '#065F46' : '#92400E',
              }}
            >
              {validation.missingCount === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
              )}
              <span>{validation.summaryBadge}</span>
            </div>

            <button
              type="button"
              onClick={handleGenerateBatchNow}
              className={`min-h-[38px] px-4 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer ${buttonRadiusClass}`}
            >
              <Sparkles className="w-4 h-4" />
              <span>✨ توليد {recipients.length} الآن</span>
            </button>
          </div>
        </div>

        {/* Category Switcher + Quick Templates Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-1.5">
            {(
              [
                ['statement', `الإفادات الرسمية (${STATEMENT_TEMPLATES_LIST.length})`],
                ['certificate', `شهادات التقدير (${CERTIFICATE_TEMPLATES_LIST.length})`],
                ['custom', `قوالبي المحفوظة (${customTemplates.length})`],
              ] as const
            ).map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKindMode(k)}
                className={`min-h-[34px] px-3 text-xs font-bold cursor-pointer ${buttonRadiusClass}`}
                style={{
                  backgroundColor: kindMode === k ? '#1A237E' : '#F1F5F9',
                  color: kindMode === k ? '#FFFFFF' : '#334155',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>

          {/* Main Studio Section Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['template', '1. القالب والشعارات'],
                ['batch', `2. استيراد 40 اسم (${recipients.length})`],
                ['export', '3. التصدير والواتساب'],
                ['registry', `4. السجل (${registryList.length})`],
              ] as const
            ).map(([id, lbl]) => (
              <button
                key={id}
                type="button"
                onClick={() => setStudioTab(id)}
                className={`min-h-[34px] px-3 text-xs font-bold cursor-pointer ${buttonRadiusClass}`}
                style={{
                  backgroundColor: studioTab === id ? '#2563EB' : '#FFFFFF',
                  color: studioTab === id ? '#FFFFFF' : '#1E293B',
                  border: '1px solid #CBD5E1',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {templatesToShow.length === 0 ? (
            <div className="text-xs text-[#64748B] py-1">
              لا توجد قوالب مخصصة محفوظة بعد — عدّل أي قالب واضغط «حفظ القالب المعدل».
            </div>
          ) : (
            templatesToShow.map((tpl) => {
              const selected = activeTemplate.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`min-h-[38px] px-3 py-1.5 border text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: selected ? '#EFF6FF' : '#F8FAFC',
                    borderColor: selected ? '#2563EB' : '#CBD5E1',
                    color: selected ? '#1E3A8A' : '#334155',
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tpl.style.innerBorderColor }}
                  />
                  <span>{tpl.name}</span>
                  {tpl.isDefaultOfficial && (
                    <span className="px-1.5 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded text-[10px]">
                      افتراضي رسمي
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Main Split Workspace: Left Control Panel + Right Interactive A4 Landscape Canvas */}
      <div className="no-print flex flex-col xl:flex-row items-start gap-5">
        {/* Control Card */}
        <div className="w-full xl:w-[440px] shrink-0 bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 space-y-4 text-xs xl:max-h-[calc(100vh-200px)] xl:overflow-y-auto">
          {/* TAB 1: TEMPLATE, LOGOS, SIGNER & SMART PHRASING */}
          {studioTab === 'template' && (
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
                <span className="font-bold text-[#1A237E]">تحرير محتوى القالب والشعارات</span>
                <button
                  type="button"
                  onClick={handleSmartImproveTemplateText}
                  className={`px-2.5 py-1 bg-[#7C3AED] text-white font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>✨ تحسين نص ذكي</span>
                </button>
              </div>

              {/* Quick Logos & Signature Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => rightLogoInputRef.current?.click()}
                  className={`min-h-[36px] px-2.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>تغيير الشعار الأيمن</span>
                </button>
                <button
                  type="button"
                  onClick={() => leftLogoInputRef.current?.click()}
                  className={`min-h-[36px] px-2.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>تغيير الشعار الأيسر</span>
                </button>
                <button
                  type="button"
                  onClick={() => signatureInputRef.current?.click()}
                  className={`min-h-[36px] px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <PenTool className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>رفع صورة التوقيع</span>
                </button>
                <button
                  type="button"
                  onClick={() => stampInputRef.current?.click()}
                  className={`min-h-[36px] px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Stamp className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>رفع صورة الختم</span>
                </button>
              </div>

              {activeTemplate.id === OFFICIAL_BEHEIRA_STATEMENT_TEMPLATE.id && (
                <button
                  type="button"
                  onClick={() => {
                    updateTemplateField({
                      rightLogoDataUrl: BEHEIRA_YOUTH_LOGO_SVG,
                      leftLogoDataUrl: CENTER_REHAB_LOGO_SVG,
                    });
                    setCustomSignatureUrl('');
                    setCustomStampUrl('');
                    onNotify('تمت استعادة شعارات البحيرة والمركز الأصلية');
                  }}
                  className="text-[11px] text-[#2563EB] font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>استعادة الشعارات الرسمية لمديرية الشباب والرياضة بالبحيرة</span>
                </button>
              )}

              {/* Ready Statement Library */}
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <div className="font-bold text-[#0F172A]">مكتبة النصوص الجاهزة للإفادات:</div>
                <div className="flex flex-wrap gap-1">
                  {READY_STATEMENT_TEXT_LIBRARY.map((lib) => (
                    <button
                      key={lib.id}
                      type="button"
                      onClick={() => {
                        updateTemplateField({ introLine: lib.templateText });
                        onNotify(`تم إدراج صيغة: ${lib.label}`);
                      }}
                      className="px-2 py-1 bg-white border border-[#CBD5E1] hover:border-[#2563EB] rounded text-[10.5px] font-semibold cursor-pointer"
                    >
                      {lib.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editable Text Fields */}
              <div className="space-y-2">
                <div>
                  <label className="block font-bold mb-1">عنوان الشهادة / الإفادة:</label>
                  <input
                    type="text"
                    value={activeTemplate.headerTitle}
                    onChange={(e) => updateTemplateField({ headerTitle: e.target.value })}
                    className={`w-full min-h-[34px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">الجملة الافتتاحية:</label>
                  <textarea
                    rows={2}
                    value={activeTemplate.introLine}
                    onChange={(e) => updateTemplateField({ introLine: e.target.value })}
                    className={`w-full p-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">نص جهة العمل / البرنامج:</label>
                  <input
                    type="text"
                    value={activeTemplate.bodyParagraphBeforeName}
                    onChange={(e) =>
                      updateTemplateField({ bodyParagraphBeforeName: e.target.value })
                    }
                    className={`w-full min-h-[34px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">الفقرة الختامية والتعاون:</label>
                  <textarea
                    rows={3}
                    value={activeTemplate.bodyParagraphAfterRole}
                    onChange={(e) =>
                      updateTemplateField({ bodyParagraphAfterRole: e.target.value })
                    }
                    className={`w-full p-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1">مسمى الموقّع:</label>
                    <input
                      type="text"
                      value={activeTemplate.signerTitle}
                      onChange={(e) => updateTemplateField({ signerTitle: e.target.value })}
                      className={`w-full min-h-[34px] px-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">اسم الموقّع (تعديل التوقيع):</label>
                    <input
                      type="text"
                      value={activeTemplate.signerName}
                      onChange={(e) => updateTemplateField({ signerName: e.target.value })}
                      className={`w-full min-h-[34px] px-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1">الجهة اليمنى:</label>
                    <input
                      type="text"
                      value={activeTemplate.rightEntityTitle}
                      onChange={(e) =>
                        updateTemplateField({ rightEntityTitle: e.target.value })
                      }
                      className={`w-full min-h-[32px] px-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">الجهة اليسرى:</label>
                    <input
                      type="text"
                      value={activeTemplate.leftEntityTitle}
                      onChange={(e) =>
                        updateTemplateField({ leftEntityTitle: e.target.value })
                      }
                      className={`w-full min-h-[32px] px-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                    />
                  </div>
                </div>
              </div>

              {/* Save Modified Template */}
              <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showQrOnCard}
                    onChange={(e) => setShowQrOnCard(e.target.checked)}
                    className="accent-[#2563EB]"
                  />
                  <span>عرض رمز QR للتحقق والرقم التسلسلي على كل شهادة</span>
                </label>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={saveTemplateName}
                    onChange={(e) => setSaveTemplateName(e.target.value)}
                    placeholder="اسم لحفظ القالب المعدل..."
                    className={`flex-1 min-h-[34px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                  <button
                    type="button"
                    onClick={handleSaveModifiedTemplate}
                    className={`min-h-[34px] px-3 bg-[#1A237E] text-white font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ القالب</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 40-PERSON BATCH IMPORTER & QUALITY TABLE */}
          {studioTab === 'batch' && (
            <div className="space-y-3">
              {/* 3 Import Methods Switch */}
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['excel', 'Excel (.xlsx)'],
                    ['paste', 'لصق واتساب/Word'],
                    ['manual', 'جدول يدوي'],
                  ] as const
                ).map(([m, lbl]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setImportMethodTab(m)}
                    className={`min-h-[34px] px-2 font-bold border cursor-pointer ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: importMethodTab === m ? '#EFF6FF' : '#F8FAFC',
                      borderColor: importMethodTab === m ? '#2563EB' : '#CBD5E1',
                      color: importMethodTab === m ? '#1E3A8A' : '#334155',
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {importMethodTab === 'excel' && (
                <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] space-y-2">
                  <div className="font-bold text-[#065F46]">
                    استيراد جدول 40+ شخص من Excel بضغطة واحدة
                  </div>
                  <p className="text-[11px] text-[#047857]">
                    يدعم الأعمدة: الاسم، الوظيفة / الدورة، التقدير، التاريخ، الهاتف
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => excelInputRef.current?.click()}
                      className={`min-h-[38px] px-3.5 bg-[#059669] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>رفع ملف Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSampleExcel}
                      className={`min-h-[38px] px-3 bg-white border border-[#10B981] text-[#065F46] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>نموذج Excel</span>
                    </button>
                  </div>
                </div>
              )}

              {importMethodTab === 'paste' && (
                <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] space-y-2">
                  <div className="font-bold text-[#1E3A8A]">
                    لصق قائمة الأسماء من واتساب أو Word (كل شخص في سطر)
                  </div>
                  <textarea
                    rows={5}
                    value={smartPasteText}
                    onChange={(e) => setSmartPasteText(e.target.value)}
                    placeholder={`مثال:\nأحمد محمد علي - أخصائي تخاطب - امتياز - 2026/05/01 - 01012345678\nسارة محمود حسن - علاج وظيفي - ممتاز - 2026/05/01`}
                    className={`w-full p-2 bg-white border border-[#93C5FD] ${buttonRadiusClass}`}
                  />
                  <button
                    type="button"
                    onClick={handleParseSmartPaste}
                    className={`w-full min-h-[36px] bg-[#2563EB] text-white font-bold cursor-pointer ${buttonRadiusClass}`}
                  >
                    تحليل وتعبئة الجدول تلقائياً
                  </button>
                </div>
              )}

              {/* Manual + Batch Controls */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setRecipients((prev) => [
                      ...prev,
                      validateRecipientRow({
                        id: `rec-${Date.now()}`,
                        serial: `CERT-2026-${String(prev.length + 1).padStart(3, '0')}`,
                        fullName: '',
                        roleOrCourse: 'أخصائي تأهيل',
                        grade: 'امتياز',
                        dateStr: '2026/05/01',
                        phone: '',
                        status: 'incomplete',
                        issues: ['الاسم ناقص'],
                      }),
                    ])
                  }
                  className={`px-2.5 py-1.5 bg-[#2563EB] text-white font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة شخص</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const base = recipients.length;
                    const added = Array.from({ length: 10 }).map((_, idx) =>
                      validateRecipientRow({
                        id: `rec-10-${Date.now()}-${idx}`,
                        serial: `CERT-2026-${String(base + idx + 1).padStart(3, '0')}`,
                        fullName: `متدرب تأهيلي رقم ${base + idx + 1}`,
                        roleOrCourse: 'برنامج التأهيل والتخاطب',
                        grade: 'امتياز',
                        dateStr: '2026/05/01',
                        phone: '',
                        status: 'valid',
                        issues: [],
                      })
                    );
                    setRecipients((prev) => [...prev, ...added]);
                    onNotify('تمت إضافة 10 صفوف بنجاح');
                  }}
                  className={`px-2.5 py-1.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] font-bold cursor-pointer ${buttonRadiusClass}`}
                >
                  + إضافة 10 صفوف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipients(smartFixRecipientNames(recipients));
                    onNotify('تم تصحيح وتنقيح جميع الأسماء عربياً ✓');
                  }}
                  className={`px-2.5 py-1.5 bg-[#F5F3FF] border border-[#DDD6FE] text-[#5B21B6] font-bold cursor-pointer ${buttonRadiusClass}`}
                >
                  تصحيح أسماء ذكي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipients(assignBatchSerials(recipients));
                    onNotify('تم ترقيم السجل تسلسلياً (CERT-2026-001...) ✓');
                  }}
                  className={`px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-bold cursor-pointer ${buttonRadiusClass}`}
                >
                  توليد رقم تسلسلي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQrOnCard(true);
                    onNotify('تم توليد QR Code موثق لكل شهادة في الدفعة ✓');
                  }}
                  className={`px-2.5 py-1.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>توليد QR للكل</span>
                </button>
              </div>

              {/* Editable Review Table */}
              <div className="space-y-1.5 max-h-[370px] overflow-y-auto pr-0.5">
                {recipients.map((row, idx) => (
                  <div
                    key={row.id}
                    onClick={() => setActivePreviewIndex(idx)}
                    className={`p-2 border rounded-lg space-y-1.5 cursor-pointer ${
                      row.status === 'incomplete'
                        ? 'bg-[#FFFBEB] border-[#FCD34D]'
                        : idx === safeIndex
                          ? 'bg-[#EFF6FF] border-[#2563EB]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[11px] flex items-center gap-1">
                        <span>#{idx + 1}</span>
                        <span className="text-[#475569]">({row.serial})</span>
                        <span>{row.status === 'valid' ? '✅' : `⚠️ ${row.issues.join('، ')}`}</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecipients((prev) => prev.filter((r) => r.id !== row.id));
                        }}
                        className="text-[#DC2626] p-0.5 cursor-pointer"
                        title="حذف الصف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={row.fullName}
                        placeholder="الاسم الكامل..."
                        onChange={(e) => {
                          const val = e.target.value;
                          setRecipients((prev) =>
                            prev.map((r) =>
                              r.id === row.id
                                ? validateRecipientRow({ ...r, fullName: val })
                                : r
                            )
                          );
                        }}
                        className="min-h-[30px] px-2 bg-white border border-[#CBD5E1] rounded font-bold"
                      />
                      <input
                        type="text"
                        value={row.roleOrCourse}
                        placeholder="الوظيفة / الدورة..."
                        onChange={(e) => {
                          const val = e.target.value;
                          setRecipients((prev) =>
                            prev.map((r) =>
                              r.id === row.id
                                ? validateRecipientRow({ ...r, roleOrCourse: val })
                                : r
                            )
                          );
                        }}
                        className="min-h-[30px] px-2 bg-white border border-[#CBD5E1] rounded"
                      />
                      <input
                        type="text"
                        value={row.dateStr}
                        placeholder="التاريخ..."
                        onChange={(e) => {
                          const val = e.target.value;
                          setRecipients((prev) =>
                            prev.map((r) =>
                              r.id === row.id
                                ? validateRecipientRow({ ...r, dateStr: val })
                                : r
                            )
                          );
                        }}
                        className="min-h-[30px] px-2 bg-white border border-[#CBD5E1] rounded"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={row.phone}
                        placeholder="رقم واتساب..."
                        onChange={(e) => {
                          const val = e.target.value;
                          setRecipients((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, phone: val } : r
                            )
                          );
                        }}
                        className="min-h-[30px] px-2 bg-white border border-[#CBD5E1] rounded text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BATCH EXPORTS & WHATSAPP */}
          {studioTab === 'export' && (
            <div className="space-y-3">
              {validation.missingCount > 0 ? (
                <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FCD34D] text-[#92400E] space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{validation.summaryBadge}</span>
                  </div>
                  <p className="text-[11px]">
                    بوابة الجودة تمنع التصدير الجماعي مع وجود صفوف ينقصها الاسم أو التاريخ.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStudioTab('batch')}
                    className={`px-3 py-1 bg-[#D97706] text-white font-bold cursor-pointer ${buttonRadiusClass}`}
                  >
                    مراجعة الأسماء الناقصة الآن
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]">
                  <div className="font-bold flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4" />
                    <span>{validation.summaryBadge}</span>
                  </div>
                </div>
              )}

              {batchBusyLabel && (
                <div className="p-2.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] font-bold">
                  ⏳ {batchBusyLabel}
                </div>
              )}

              <button
                type="button"
                disabled={Boolean(batchBusyLabel)}
                onClick={() => handleRunBatchExport('single-pdf')}
                className={`w-full min-h-[42px] px-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${buttonRadiusClass}`}
              >
                <Download className="w-4 h-4" />
                <span>تصدير {recipients.length} في ملف PDF واحد (A4 بالعرض)</span>
              </button>

              <button
                type="button"
                disabled={Boolean(batchBusyLabel)}
                onClick={() => handleRunBatchExport('zip-pdfs')}
                className={`w-full min-h-[42px] px-4 bg-[#1A237E] hover:bg-[#1E3A8A] text-white font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${buttonRadiusClass}`}
              >
                <FileArchive className="w-4 h-4" />
                <span>تصدير ZIP ({recipients.length} ملف PDF بأسماء المستلمين)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={Boolean(batchBusyLabel)}
                  onClick={() => handleRunBatchExport('word')}
                  className={`min-h-[38px] px-3 bg-[#2563EB] text-white font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${buttonRadiusClass}`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Word جماعي</span>
                </button>
                <button
                  type="button"
                  disabled={Boolean(batchBusyLabel)}
                  onClick={() => handleRunBatchExport('zip-pngs')}
                  className={`min-h-[38px] px-3 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${buttonRadiusClass}`}
                >
                  <FileImage className="w-4 h-4" />
                  <span>صور PNG (ZIP)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrintLandscapeBatch}
                className={`w-full min-h-[40px] px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold inline-flex items-center justify-center gap-2 cursor-pointer ${buttonRadiusClass}`}
              >
                <Printer className="w-4 h-4" />
                <span>طباعة A4 بالعرض (300 DPI) للكل</span>
              </button>

              {/* Group WhatsApp Sender */}
              <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppPanel((p) => !p)}
                  className={`w-full min-h-[38px] px-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold inline-flex items-center justify-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال واتساب جماعي ({recipients.length})</span>
                </button>

                {showWhatsAppPanel && (
                  <div className="p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] space-y-2 max-h-56 overflow-y-auto">
                    <button
                      type="button"
                      onClick={async () => {
                        const allText = recipients
                          .map((r) => buildWhatsAppMessageText(r, activeTemplate.kind))
                          .join('\n');
                        const ok = await copyTextToClipboard(allText);
                        onNotify(ok ? 'تم نسخ جميع رسائل التهنئة ✓' : 'تعذر النسخ');
                      }}
                      className="text-[11px] font-bold text-[#065F46] inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>نسخ كل رسائل التهنئة دفعة واحدة</span>
                    </button>
                    {recipients.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-2 bg-white p-1.5 rounded border border-[#DCFCE7]"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[#0F172A] truncate">
                            {r.fullName || '[بدون اسم]'}
                          </div>
                          <div className="text-[10px] text-[#64748B] truncate">
                            {buildWhatsAppMessageText(r, activeTemplate.kind)}
                          </div>
                        </div>
                        <a
                          href={buildWhatsAppUrl(r, activeTemplate.kind)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-[#16A34A] text-white rounded text-[10.5px] font-bold shrink-0"
                        >
                          إرسال
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SAVED BATCH REGISTRY */}
          {studioTab === 'registry' && (
            <div className="space-y-2.5">
              <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#2563EB]" />
                <span>سجل الشهادات والإفادات المصدرة ({registryList.length})</span>
              </div>
              {registryList.length === 0 ? (
                <div className="p-4 text-center text-[#64748B] bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  لا توجد دفعات محفوظة بعد — اضغط «✨ توليد الآن» لتوثيق أول دفعة هنا.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                  {registryList.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#1E3A8A]">
                          {entry.templateName} ({entry.count})
                        </span>
                        <span className="text-[10.5px] text-[#64748B]">
                          {entry.createdAt}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#475569] truncate">
                        الأسماء: {entry.names.slice(0, 4).join('، ')}
                        {entry.names.length > 4 ? ` (+${entry.names.length - 4})` : ''}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const foundTpl =
                            [...ALL_INITIAL_CERT_TEMPLATES, ...customTemplates].find(
                              (t) => t.id === entry.templateId
                            ) || activeTemplate;
                          setActiveTemplate(foundTpl);
                          setRecipients(entry.recipients);
                          setActivePreviewIndex(0);
                          setGeneratedActive(true);
                          setStudioTab('export');
                          onNotify(`تمت استعادة الدفعة (${entry.count}) للطباعة فوراً ✓`);
                        }}
                        className={`px-3 py-1 bg-[#2563EB] text-white font-bold cursor-pointer ${buttonRadiusClass}`}
                      >
                        إعادة فتح وطباعة بضغطة
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Free Canvas Preview + Toolbar Stage */}
        <div
          ref={previewStageRef}
          className="flex-1 w-full min-w-0 bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-3 md:p-4 space-y-3"
        >
          {/* Free Canvas Top Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E2E8F0] text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* [ + إضافة حقل / نص ] Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAddFieldMenuOpen((p) => !p)}
                  className={`min-h-[34px] px-3 bg-[#1A237E] hover:bg-[#1E3A8A] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة حقل / نص</span>
                </button>
                {addFieldMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-[#CBD5E1] rounded-xl shadow-2xl z-50 p-1.5 grid grid-cols-2 gap-1">
                    {ELEMENT_PALETTE_ITEMS.map((item) => (
                      <button
                        key={item.kind}
                        type="button"
                        onClick={() => {
                          if (item.kind === 'logo' || item.kind === 'photo') {
                            elementImageInputRef.current.kind = item.kind;
                            elementImageInputRef.current.elRef?.click();
                            setAddFieldMenuOpen(false);
                          } else {
                            handleAddElement(item.kind);
                          }
                        }}
                        className="px-2.5 py-2 text-right rounded-lg hover:bg-[#EFF6FF] font-bold text-[#0F172A] cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={historyStack.length === 0}
                onClick={handleUndo}
                className={`min-h-[34px] px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 ${buttonRadiusClass}`}
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>تراجع</span>
              </button>
              <button
                type="button"
                disabled={redoStack.length === 0}
                onClick={handleRedo}
                className={`min-h-[34px] px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 ${buttonRadiusClass}`}
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>إعادة</span>
              </button>

              {canvasElements.length > 0 && (
                <span className="px-2 py-1 rounded bg-[#EFF6FF] text-[#1E3A8A] font-bold inline-flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>عناصر حرة: {canvasElements.length}</span>
                </span>
              )}
            </div>

            {/* Batch Card Arrow Navigation & Per-Card vs Apply-All */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={safeIndex === 0}
                onClick={() => setActivePreviewIndex((i) => Math.max(0, i - 1))}
                className={`min-h-[32px] px-2 border border-[#CBD5E1] bg-white font-bold inline-flex items-center cursor-pointer disabled:opacity-40 ${buttonRadiusClass}`}
                title="الشهادة السابقة"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-[#0F172A]">
                {safeIndex + 1} / {Math.max(1, recipients.length)}
                {generatedActive ? ' ✓' : ''}
              </span>
              <button
                type="button"
                disabled={safeIndex >= recipients.length - 1}
                onClick={() =>
                  setActivePreviewIndex((i) => Math.min(recipients.length - 1, i + 1))
                }
                className={`min-h-[32px] px-2 border border-[#CBD5E1] bg-white font-bold inline-flex items-center cursor-pointer disabled:opacity-40 ${buttonRadiusClass}`}
                title="الشهادة التالية"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setEditThisCardOnly((p) => !p)}
                className={`min-h-[32px] px-2.5 border font-bold cursor-pointer ${buttonRadiusClass}`}
                style={{
                  backgroundColor: editThisCardOnly ? '#FFFBEB' : '#F8FAFC',
                  borderColor: editThisCardOnly ? '#F59E0B' : '#CBD5E1',
                  color: editThisCardOnly ? '#92400E' : '#334155',
                }}
              >
                {editThisCardOnly ? 'تعديل هذه الشهادة فقط ✓' : 'تعديل هذه الشهادة فقط'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditThisCardOnly(false);
                  setRecipients((prev) =>
                    prev.map((r) => ({
                      ...r,
                      perCardElementsOverride: undefined,
                      perCardTitleOverride: undefined,
                      perCardIntroOverride: undefined,
                    }))
                  );
                  onNotify('تم تعميم التعديلات والتنسيق على جميع الشهادات بالدفعة ✓');
                }}
                className={`min-h-[32px] px-2.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] font-bold cursor-pointer ${buttonRadiusClass}`}
              >
                تطبيق على الكل
              </button>
            </div>
          </div>

          <div className="text-[11px] text-[#64748B] flex flex-wrap items-center justify-between gap-2">
            <span>
              اسحب أي عنصر مضاف لتحريكه بحرية، أو اضغط مرتين للكتابة المباشرة، أو استخدم الشريط العائم لتغيير الخط واللون والحجم.
            </span>
            <span className="font-bold text-[#1A237E]">
              المستلم المعروض: {currentRecipient.fullName || '[ غير محدد ]'}
            </span>
          </div>

          {/* Scaled A4 Landscape Interactive Preview */}
          <div
            className="w-full flex justify-center overflow-x-auto bg-[#F1F5F9] p-3 rounded-lg"
            style={{
              minHeight: `${Math.ceil(794 * previewScale) + 32}px`,
            }}
          >
            <div
              style={{
                width: `${1123 * previewScale}px`,
                height: `${794 * previewScale}px`,
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '1123px',
                  height: '794px',
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top right',
                }}
              >
                <OfficialCertificateCanvas
                  template={activeTemplate}
                  recipient={currentRecipient}
                  elements={activeCardElements}
                  selectedElementId={selectedElementId}
                  interactive={true}
                  showQrOnCard={showQrOnCard}
                  customSignatureImageUrl={customSignatureUrl}
                  customStampImageUrl={customStampUrl}
                  onSelectElement={setSelectedElementId}
                  onUpdateElement={handleUpdateElement}
                  onDeleteElement={handleDeleteElement}
                  onDuplicateElement={handleDuplicateElement}
                  onReorderZIndex={handleReorderElementZ}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Capture & Landscape Print Stage Rendering All Recipients */}
      <div
        aria-hidden="true"
        className="cert-print-batch-stage fixed -left-[9999px] top-0 pointer-events-none"
      >
        {recipients.map((rec) => (
          <div key={rec.id} className="cert-print-page">
            <OfficialCertificateCanvas
              template={activeTemplate}
              recipient={rec}
              elements={rec.perCardElementsOverride || canvasElements}
              selectedElementId={null}
              interactive={false}
              showQrOnCard={showQrOnCard}
              customSignatureImageUrl={customSignatureUrl}
              customStampImageUrl={customStampUrl}
              cardRef={(el) => {
                batchCardRefs.current[rec.id] = el;
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
