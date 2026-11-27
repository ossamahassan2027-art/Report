import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  FileDown,
  FilePlus2,
  LayoutTemplate,
  Palette,
  Printer,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  LayoutMode,
  REPORT_TEMPLATES,
  ReportData,
  ReportLanguage,
  SectionVisibility,
  ViewFormat,
} from '../types/report';
import {
  ChartDataPoint,
  CustomChartItem,
  CustomTableItem,
  LIGHT_THEMES,
  LightThemeDefinition,
  LightThemeId,
  RECIPIENT_OPTIONS,
  ThemeSettings,
} from '../types/studio';
import { parseImportedBackupJson, ReportBackupPayload } from '../utils/storageAndBackup';

export type ActiveModalType =
  | null
  | 'new-report'
  | 'save-copy'
  | 'delete-report'
  | 'choose-template'
  | 'choose-theme'
  | 'add-chart-table'
  | 'import-backup'
  | 'confirm-print';

interface StudioModalsProps {
  activeModal: ActiveModalType;
  onClose: () => void;
  theme: LightThemeDefinition;
  buttonRadiusClass: string;
  currentData: ReportData;
  language: ReportLanguage;
  layoutMode: LayoutMode;
  viewFormat: ViewFormat;
  visibility: SectionVisibility;
  themeSettings: ThemeSettings;
  deleteTargetName: string;
  initialChartKind?: 'chart' | 'table' | 'before-after';

  onCreateNewReport: (opts: {
    mode: 'blank' | 'template';
    templateId: string;
    recipients: string[];
    reportName: string;
  }) => void;
  onSaveCopyToDevice: (opts: {
    filename: string;
    formats: { html: boolean; pdf: boolean; json: boolean; word: boolean };
  }) => Promise<void>;
  onConfirmDeleteReport: () => void;
  onApplyTemplateChoice: (templateId: string, view: ViewFormat, layout: LayoutMode) => void;
  onApplyThemeChoice: (themeId: LightThemeId) => void;
  onInsertChart: (chart: CustomChartItem) => void;
  onInsertTable: (table: CustomTableItem) => void;
  onImportBackup: (payload: ReportBackupPayload) => void;
  onExecutePrint: () => void;
  onOpenAutoFormat?: () => void;
}

export const StudioModals: React.FC<StudioModalsProps> = ({
  activeModal,
  onClose,
  theme,
  buttonRadiusClass,
  currentData,
  language,
  layoutMode,
  viewFormat,
  visibility,
  themeSettings,
  deleteTargetName,
  initialChartKind = 'chart',
  onCreateNewReport,
  onSaveCopyToDevice,
  onConfirmDeleteReport,
  onApplyTemplateChoice,
  onApplyThemeChoice,
  onInsertChart,
  onInsertTable,
  onImportBackup,
  onExecutePrint,
  onOpenAutoFormat,
}) => {
  // New Report State
  const [newReportMode, setNewReportMode] = useState<'blank' | 'template'>('template');
  const [newTemplateId, setNewTemplateId] = useState<string>(REPORT_TEMPLATES[0].id);
  const [newRecipients, setNewRecipients] = useState<string[]>(['مدرسة']);
  const [newReportName, setNewReportName] = useState<string>('تقرير تربوي جديد');

  // Save Copy State
  const [saveFilename, setSaveFilename] = useState<string>('نسخة-التقرير-التربوي');
  const [saveFormats, setSaveFormats] = useState({
    html: true,
    json: true,
    word: false,
    pdf: false,
  });
  const [savingBusy, setSavingBusy] = useState(false);

  // Template Modal State
  const [pickedTemplateId, setPickedTemplateId] = useState<string>(REPORT_TEMPLATES[0].id);
  const [pickedDesignFormat, setPickedDesignFormat] = useState<
    'formal-a4' | 'infographic' | 'single' | 'detailed'
  >('formal-a4');

  // Theme Modal State
  const [previewThemeId, setPreviewThemeId] = useState<LightThemeId>(themeSettings.screenTheme);

  // Chart / Table Modal State (No invented numbers!)
  const [visualKind, setVisualKind] = useState<'chart' | 'table' | 'before-after'>('chart');
  const [visualTitle, setVisualTitle] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'horizontal'>('bar');
  const [chartUnit, setChartUnit] = useState<string>('');
  const [chartRows, setChartRows] = useState<{ label: string; value: string }[]>([
    { label: '', value: '' },
    { label: '', value: '' },
  ]);
  const [tableHeaders, setTableHeaders] = useState<string[]>(['البند', 'الملاحظة', 'التقييم']);
  const [tableRows, setTableRows] = useState<string[][]>([
    ['', '', ''],
    ['', '', ''],
  ]);
  const [beforeAfterRows, setBeforeAfterRows] = useState<
    { aspect: string; before: string; after: string }[]
  >([
    { aspect: '', before: '', after: '' },
    { aspect: '', before: '', after: '' },
  ]);

  // Import Modal State
  const [importPreview, setImportPreview] = useState<ReportBackupPayload | null>(null);
  const [importError, setImportError] = useState<string>('');

  useEffect(() => {
    setPreviewThemeId(themeSettings.screenTheme);
    if (activeModal === 'add-chart-table') {
      setVisualKind(initialChartKind);
    }
  }, [themeSettings.screenTheme, activeModal, initialChartKind]);

  useEffect(() => {
    if (!activeModal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeModal, onClose]);

  if (!activeModal) return null;

  const handleFileImportRead = async (file: File) => {
    setImportError('');
    setImportPreview(null);
    try {
      const text = await file.text();
      const parsed = parseImportedBackupJson(text);
      setImportPreview(parsed);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'تعذر قراءة الملف.');
    }
  };

  const toggleNewRecipient = (id: string) => {
    setNewRecipients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const activeSectionsCount = Object.values(visibility).filter(Boolean).length;
  const hasValidVisualInput =
    visualKind === 'chart'
      ? chartRows.some(
          (r) => r.label.trim() && r.value !== '' && !Number.isNaN(Number(r.value))
        )
      : visualKind === 'table'
      ? tableRows.some((r) => r.some((c) => c.trim()))
      : beforeAfterRows.some(
          (r) => r.aspect.trim() || r.before.trim() || r.after.trim()
        );

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          activeModal === 'add-chart-table' || activeModal === 'choose-template'
            ? 'max-w-3xl'
            : 'max-w-lg'
        } max-h-[90vh] overflow-y-auto border shadow-2xl ${buttonRadiusClass}`}
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
          color: theme.textPrimary,
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b"
          style={{ borderColor: theme.borderColor, backgroundColor: theme.surfaceBg }}
        >
          <div className="flex items-center gap-2 font-editorial text-lg font-bold" style={{ color: theme.headingColor }}>
            {activeModal === 'new-report' && (
              <>
                <FilePlus2 className="w-5 h-5" />
                <span>إنشاء تقرير جديد</span>
              </>
            )}
            {activeModal === 'save-copy' && (
              <>
                <FileDown className="w-5 h-5" />
                <span>حفظ نسخة على الجهاز</span>
              </>
            )}
            {activeModal === 'delete-report' && (
              <>
                <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                <span className="text-[#DC2626]">تأكيد حذف التقرير</span>
              </>
            )}
            {activeModal === 'choose-template' && (
              <>
                <LayoutTemplate className="w-5 h-5" />
                <span>اختيار قالب التصميم</span>
              </>
            )}
            {activeModal === 'choose-theme' && (
              <>
                <Palette className="w-5 h-5" />
                <span>اختيار ثيم العرض الفاتح</span>
              </>
            )}
            {activeModal === 'add-chart-table' && (
              <>
                <BarChart3 className="w-5 h-5" />
                <span>إضافة رسم بياني أو جدول</span>
              </>
            )}
            {activeModal === 'import-backup' && (
              <>
                <Upload className="w-5 h-5" />
                <span>استيراد نسخة محفوظة</span>
              </>
            )}
            {activeModal === 'confirm-print' && (
              <>
                <Printer className="w-5 h-5" />
                <span>تأكيد الإرسال والطباعة</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className={`min-h-[38px] min-w-[38px] flex items-center justify-center border cursor-pointer ${buttonRadiusClass}`}
            style={{ borderColor: theme.borderColor, color: theme.textMuted }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* 1. NEW REPORT */}
          {activeModal === 'new-report' && (
            <>
              <div>
                <label className="block font-bold mb-1">اسم التقرير في اللوحة</label>
                <input
                  type="text"
                  value={newReportName}
                  onChange={(e) => setNewReportName(e.target.value)}
                  className={`w-full min-h-[40px] px-3 border ${buttonRadiusClass}`}
                  style={{ borderColor: theme.borderColor }}
                />
              </div>

              <div>
                <label className="block font-bold mb-1.5">نوع الإنشاء</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewReportMode('template')}
                    className={`min-h-[42px] px-3 py-2 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: newReportMode === 'template' ? theme.accentSoft : theme.cardBg,
                      borderColor: newReportMode === 'template' ? theme.accentColor : theme.borderColor,
                      color: newReportMode === 'template' ? theme.headingColor : theme.textPrimary,
                    }}
                  >
                    من قالب جاهز
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewReportMode('blank')}
                    className={`min-h-[42px] px-3 py-2 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: newReportMode === 'blank' ? theme.accentSoft : theme.cardBg,
                      borderColor: newReportMode === 'blank' ? theme.accentColor : theme.borderColor,
                      color: newReportMode === 'blank' ? theme.headingColor : theme.textPrimary,
                    }}
                  >
                    نموذج فارغ [ ... ]
                  </button>
                </div>
              </div>

              {newReportMode === 'template' && (
                <div>
                  <label className="block font-bold mb-1">القالب المبدئي</label>
                  <select
                    value={newTemplateId}
                    onChange={(e) => setNewTemplateId(e.target.value)}
                    className={`w-full min-h-[40px] px-3 border ${buttonRadiusClass}`}
                    style={{ borderColor: theme.borderColor }}
                  >
                    {REPORT_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold">الجهة الموجه إليها (اختيار متعدد: {newRecipients.length})</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRecipients(RECIPIENT_OPTIONS.map((r) => r.id))}
                      className="underline cursor-pointer"
                      style={{ color: theme.headingColor }}
                    >
                      تحديد الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRecipients([])}
                      className="underline cursor-pointer text-[#78716C]"
                    >
                      إلغاء الكل
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {RECIPIENT_OPTIONS.map((r) => {
                    const checked = newRecipients.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleNewRecipient(r.id)}
                        className={`min-h-[40px] px-2.5 border flex items-center justify-between cursor-pointer ${buttonRadiusClass}`}
                        style={{
                          backgroundColor: checked ? theme.accentSoft : theme.cardBg,
                          borderColor: checked ? theme.accentColor : theme.borderColor,
                        }}
                      >
                        <span>{r.label}</span>
                        {checked && <Check className="w-3.5 h-3.5" style={{ color: theme.headingColor }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                <button
                  type="button"
                  onClick={onClose}
                  className={`min-h-[40px] px-4 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                  style={{ borderColor: theme.borderColor }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCreateNewReport({
                      mode: newReportMode,
                      templateId: newTemplateId,
                      recipients: newRecipients.length > 0 ? newRecipients : ['مدرسة'],
                      reportName: newReportName,
                    });
                    onClose();
                  }}
                  className={`min-h-[40px] px-5 text-white font-semibold cursor-pointer ${buttonRadiusClass}`}
                  style={{ backgroundColor: theme.accentColor }}
                >
                  ابدأ
                </button>
              </div>
            </>
          )}

          {/* 2. SAVE COPY */}
          {activeModal === 'save-copy' && (
            <>
              <div className="p-3 border text-[11.5px]" style={{ backgroundColor: theme.surfaceBg, borderColor: theme.borderColor }}>
                يتم حفظ نسخة محلية في ذاكرة المتصفح دون حذف أي تقارير سابقة، مع تنزيل الملفات المختارة إلى جهازك مباشرة.
              </div>

              <div>
                <label className="block font-bold mb-1">اسم الملف</label>
                <input
                  type="text"
                  value={saveFilename}
                  onChange={(e) => setSaveFilename(e.target.value)}
                  className={`w-full min-h-[40px] px-3 border ${buttonRadiusClass}`}
                  style={{ borderColor: theme.borderColor }}
                />
              </div>

              <div>
                <label className="block font-bold mb-1.5">اختر صيغ الحفظ على الجهاز</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      ['html', 'HTML'],
                      ['json', 'JSON'],
                      ['word', 'Word'],
                      ['pdf', 'PDF (طباعة)'],
                    ] as [keyof typeof saveFormats, string][]
                  ).map(([k, lbl]) => (
                    <label
                      key={k}
                      className={`min-h-[42px] px-3 border flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                      style={{
                        backgroundColor: saveFormats[k] ? theme.accentSoft : theme.cardBg,
                        borderColor: saveFormats[k] ? theme.accentColor : theme.borderColor,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={saveFormats[k]}
                        onChange={(e) =>
                          setSaveFormats({ ...saveFormats, [k]: e.target.checked })
                        }
                        className="accent-[#1E3A8A]"
                      />
                      <span className="font-semibold">{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                {!saveFormats.html && !saveFormats.json && !saveFormats.word && !saveFormats.pdf ? (
                  <span className="text-[11px] text-[#DC2626] font-medium">
                    اختر صيغة واحدة على الأقل للحفظ
                  </span>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`min-h-[40px] px-4 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                    style={{ borderColor: theme.borderColor }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={savingBusy || (!saveFormats.html && !saveFormats.json && !saveFormats.word && !saveFormats.pdf)}
                    onClick={async () => {
                      setSavingBusy(true);
                      await onSaveCopyToDevice({
                        filename: saveFilename,
                        formats: saveFormats,
                      });
                      setSavingBusy(false);
                      onClose();
                    }}
                    className={`min-h-[40px] px-5 text-white font-semibold cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    {savingBusy ? 'جاري الحفظ...' : 'حفظ على الجهاز'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 3. DELETE REPORT */}
          {activeModal === 'delete-report' && (
            <>
              <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded">
                <p className="font-bold text-sm mb-1">هل أنت متأكد من الحذف؟</p>
                <p>سيتم حذف السجل: «{deleteTargetName}» من القائمة المحفوظة.</p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                <button
                  type="button"
                  onClick={onClose}
                  className={`min-h-[40px] px-4 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                  style={{ borderColor: theme.borderColor }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirmDeleteReport();
                    onClose();
                  }}
                  className={`min-h-[40px] px-5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف</span>
                </button>
              </div>
            </>
          )}

          {/* 4. CHOOSE TEMPLATE */}
          {activeModal === 'choose-template' && (
            <>
              <div>
                <div className="font-bold mb-2">1. اختر قالب المحتوى (صور مصغرة):</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {REPORT_TEMPLATES.map((tpl) => {
                    const selected = pickedTemplateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setPickedTemplateId(tpl.id)}
                        className={`p-3 border text-right flex gap-3 items-start cursor-pointer ${buttonRadiusClass}`}
                        style={{
                          backgroundColor: selected ? theme.accentSoft : theme.cardBg,
                          borderColor: selected ? theme.accentColor : theme.borderColor,
                        }}
                      >
                        {/* Mini document thumbnail */}
                        <div className="w-12 h-16 bg-white border border-[#D4D4D8] p-1 shrink-0 flex flex-col gap-1">
                          <div className="h-1.5 w-full" style={{ backgroundColor: theme.headingColor }} />
                          <div className="h-1 w-3/4 bg-[#CBD5E1]" />
                          <div className="h-1 w-full bg-[#E2E8F0]" />
                          <div className="h-1 w-5/6 bg-[#E2E8F0]" />
                          <div className="h-1 w-2/3 bg-[#E2E8F0]" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs">{tpl.name}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>
                            {tpl.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="font-bold mb-2">2. نمط العرض الهندسي:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      ['formal-a4', 'رسمي A4'],
                      ['infographic', 'انفوجراف'],
                      ['single', 'صفحة واحدة'],
                      ['detailed', 'مفصل (صفحتان)'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPickedDesignFormat(id)}
                      className={`min-h-[40px] px-3 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                      style={{
                        backgroundColor: pickedDesignFormat === id ? theme.accentSoft : theme.cardBg,
                        borderColor: pickedDesignFormat === id ? theme.accentColor : theme.borderColor,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                <button
                  type="button"
                  onClick={onClose}
                  className={`min-h-[40px] px-4 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                  style={{ borderColor: theme.borderColor }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextView: ViewFormat =
                      pickedDesignFormat === 'infographic' ? 'infographic' : 'a4';
                    const nextLayout: LayoutMode =
                      pickedDesignFormat === 'detailed' ? 'two-page' : 'single';
                    onApplyTemplateChoice(pickedTemplateId, nextView, nextLayout);
                    onClose();
                  }}
                  className={`min-h-[40px] px-5 text-white font-semibold cursor-pointer ${buttonRadiusClass}`}
                  style={{ backgroundColor: theme.accentColor }}
                >
                  تطبيق
                </button>
              </div>
            </>
          )}

          {/* 5. CHOOSE THEME */}
          {activeModal === 'choose-theme' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(LIGHT_THEMES) as LightThemeId[]).map((tid) => {
                  const t = LIGHT_THEMES[tid];
                  const active = previewThemeId === tid;
                  return (
                    <button
                      key={tid}
                      type="button"
                      onClick={() => setPreviewThemeId(tid)}
                      className={`p-3 border text-right cursor-pointer ${buttonRadiusClass}`}
                      style={{
                        backgroundColor: t.pageBg,
                        borderColor: active ? t.accentColor : t.borderColor,
                        boxShadow: active ? `0 0 0 2px ${t.accentColor}33` : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs" style={{ color: t.headingColor }}>
                          {t.name}
                        </span>
                        <span
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: t.accentColor, borderColor: t.borderColor }}
                        />
                      </div>
                      <p className="text-[11px]" style={{ color: t.textMuted }}>
                        {t.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Live miniature preview of chosen light theme */}
              <div
                className="p-3 border"
                style={{
                  backgroundColor: LIGHT_THEMES[previewThemeId].pageBg,
                  borderColor: LIGHT_THEMES[previewThemeId].borderColor,
                }}
              >
                <div
                  className="font-editorial text-sm font-bold mb-1"
                  style={{ color: LIGHT_THEMES[previewThemeId].headingColor }}
                >
                  معاينة مباشرة: {LIGHT_THEMES[previewThemeId].name}
                </div>
                <div className="text-[11px]" style={{ color: LIGHT_THEMES[previewThemeId].textPrimary }}>
                  تظهر العناوين والنصوص والحدود بهذا التنسيق الفاتح المريح للقراءة على الشاشة.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                <button
                  type="button"
                  onClick={onClose}
                  className={`min-h-[40px] px-4 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                  style={{ borderColor: theme.borderColor }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApplyThemeChoice(previewThemeId);
                    onClose();
                  }}
                  className={`min-h-[40px] px-5 text-white font-semibold cursor-pointer ${buttonRadiusClass}`}
                  style={{ backgroundColor: theme.accentColor }}
                >
                  تطبيق
                </button>
              </div>
            </>
          )}

          {/* 6. ADD CHART / TABLE (Manual entry only, no invented numbers) */}
          {activeModal === 'add-chart-table' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['chart', 'رسم بياني'],
                    ['table', 'جدول مخصص'],
                    ['before-after', 'مقارنة قبل / بعد'],
                  ] as const
                ).map(([k, lbl]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setVisualKind(k)}
                    className={`min-h-[40px] border font-semibold cursor-pointer ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: visualKind === k ? theme.accentSoft : theme.cardBg,
                      borderColor: visualKind === k ? theme.accentColor : theme.borderColor,
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-bold mb-1">العنوان</label>
                <input
                  type="text"
                  value={visualTitle}
                  onChange={(e) => setVisualTitle(e.target.value)}
                  placeholder="أدخل عنوان الرسم أو الجدول..."
                  className={`w-full min-h-[38px] px-3 border ${buttonRadiusClass}`}
                  style={{ borderColor: theme.borderColor }}
                />
              </div>

              {visualKind === 'chart' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">نوع الرسم</label>
                      <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value as 'bar' | 'horizontal')}
                        className={`w-full min-h-[38px] px-2 border ${buttonRadiusClass}`}
                        style={{ borderColor: theme.borderColor }}
                      >
                        <option value="bar">أعمدة رأسية</option>
                        <option value="horizontal">أشرطة أفقية</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">وحدة القياس (اختياري)</label>
                      <input
                        type="text"
                        value={chartUnit}
                        onChange={(e) => setChartUnit(e.target.value)}
                        placeholder="مثال: دقيقة / درجة / %"
                        className={`w-full min-h-[38px] px-3 border ${buttonRadiusClass}`}
                        style={{ borderColor: theme.borderColor }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold">إدخال البيانات يدوياً:</div>
                    {chartRows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => {
                            const copy = [...chartRows];
                            copy[idx] = { ...copy[idx], label: e.target.value };
                            setChartRows(copy);
                          }}
                          placeholder="اسم البند..."
                          className={`col-span-7 min-h-[36px] px-2.5 border ${buttonRadiusClass}`}
                          style={{ borderColor: theme.borderColor }}
                        />
                        <input
                          type="number"
                          value={row.value}
                          onChange={(e) => {
                            const copy = [...chartRows];
                            copy[idx] = { ...copy[idx], value: e.target.value };
                            setChartRows(copy);
                          }}
                          placeholder="القيمة الرقمية"
                          className={`col-span-4 min-h-[36px] px-2.5 border tabular-nums-ar ${buttonRadiusClass}`}
                          style={{ borderColor: theme.borderColor }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setChartRows((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="col-span-1 text-[#DC2626] font-bold cursor-pointer"
                          title="حذف صف"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setChartRows([...chartRows, { label: '', value: '' }])}
                      className="px-3 py-1.5 border font-semibold cursor-pointer"
                      style={{ borderColor: theme.borderColor, color: theme.headingColor }}
                    >
                      + إضافة صف بيانات
                    </button>
                  </div>
                </div>
              )}

              {visualKind === 'table' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {tableHeaders.map((h, i) => (
                      <input
                        key={i}
                        type="text"
                        value={h}
                        onChange={(e) => {
                          const copy = [...tableHeaders];
                          copy[i] = e.target.value;
                          setTableHeaders(copy);
                        }}
                        className={`min-h-[36px] px-2 border font-bold ${buttonRadiusClass}`}
                        style={{ borderColor: theme.borderColor, backgroundColor: theme.surfaceBg }}
                      />
                    ))}
                  </div>
                  {tableRows.map((row, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-3 gap-2">
                      {row.map((cell, cIdx) => (
                        <input
                          key={cIdx}
                          type="text"
                          value={cell}
                          placeholder="[ ... ]"
                          onChange={(e) => {
                            const copy = tableRows.map((r) => [...r]);
                            copy[rIdx][cIdx] = e.target.value;
                            setTableRows(copy);
                          }}
                          className={`min-h-[36px] px-2 border ${buttonRadiusClass}`}
                          style={{ borderColor: theme.borderColor }}
                        />
                      ))}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTableRows([...tableRows, ['', '', '']])}
                    className="px-3 py-1.5 border font-semibold cursor-pointer"
                    style={{ borderColor: theme.borderColor, color: theme.headingColor }}
                  >
                    + إضافة صف
                  </button>
                </div>
              )}

              {visualKind === 'before-after' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 font-bold text-center">
                    <div>المهارة / الجانب</div>
                    <div>قبل التدخل</div>
                    <div>بعد التدخل</div>
                  </div>
                  {beforeAfterRows.map((row, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={row.aspect}
                        placeholder="الجانب..."
                        onChange={(e) => {
                          const copy = [...beforeAfterRows];
                          copy[rIdx] = { ...copy[rIdx], aspect: e.target.value };
                          setBeforeAfterRows(copy);
                        }}
                        className={`min-h-[36px] px-2 border ${buttonRadiusClass}`}
                        style={{ borderColor: theme.borderColor }}
                      />
                      <input
                        type="text"
                        value={row.before}
                        placeholder="[ ... ]"
                        onChange={(e) => {
                          const copy = [...beforeAfterRows];
                          copy[rIdx] = { ...copy[rIdx], before: e.target.value };
                          setBeforeAfterRows(copy);
                        }}
                        className={`min-h-[36px] px-2 border ${buttonRadiusClass}`}
                        style={{ borderColor: theme.borderColor }}
                      />
                      <input
                        type="text"
                        value={row.after}
                        placeholder="[ ... ]"
                        onChange={(e) => {
                          const copy = [...beforeAfterRows];
                          copy[rIdx] = { ...copy[rIdx], after: e.target.value };
                          setBeforeAfterRows(copy);
                        }}
                        className={`min-h-[36px] px-2 border ${buttonRadiusClass}`}
                        style={{ borderColor: theme.borderColor }}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setBeforeAfterRows([
                        ...beforeAfterRows,
                        { aspect: '', before: '', after: '' },
                      ])
                    }
                    className="px-3 py-1.5 border font-semibold cursor-pointer"
                    style={{ borderColor: theme.borderColor, color: theme.headingColor }}
                  >
                    + إضافة صف مقارنة
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                {!hasValidVisualInput ? (
                  <span className="text-[11px] text-[#DC2626] font-medium">
                    أدخل صف بيانات واحداً على الأقل لتفعيل الإدراج
                  </span>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`min-h-[40px] px-4 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                    style={{ borderColor: theme.borderColor }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={!hasValidVisualInput}
                    onClick={() => {
                      if (visualKind === 'chart') {
                        const validPoints: ChartDataPoint[] = chartRows
                          .filter((r) => r.label.trim() && r.value !== '' && !Number.isNaN(Number(r.value)))
                          .map((r) => ({ label: r.label.trim(), value: Number(r.value) }));
                        if (validPoints.length === 0) return;
                        onInsertChart({
                          id: `chart-${Date.now()}`,
                          title: visualTitle.trim() || 'رسم بياني للمتابعة',
                          chartType,
                          unit: chartUnit.trim(),
                          points: validPoints,
                        });
                      } else if (visualKind === 'table') {
                        const cleanRows = tableRows
                          .filter((r) => r.some((c) => c.trim()))
                          .map((r) => r.map((c) => c.trim() || '[ ... ]'));
                        if (cleanRows.length === 0) return;
                        onInsertTable({
                          id: `tbl-${Date.now()}`,
                          title: visualTitle.trim() || 'جدول بيانات التقييم',
                          kind: 'table',
                          headers: tableHeaders.map((h) => h.trim() || '[ ... ]'),
                          rows: cleanRows,
                        });
                      } else {
                        const cleanRows = beforeAfterRows
                          .filter((r) => r.aspect.trim() || r.before.trim() || r.after.trim())
                          .map((r) => [
                            r.aspect.trim() || '[ ... ]',
                            r.before.trim() || '[ ... ]',
                            r.after.trim() || '[ ... ]',
                          ]);
                        if (cleanRows.length === 0) return;
                        onInsertTable({
                          id: `ba-${Date.now()}`,
                          title: visualTitle.trim() || 'مقارنة الأداء قبل وبعد التدخل',
                          kind: 'before-after',
                          headers: ['الجانب', 'قبل التدخل', 'بعد التدخل'],
                          rows: cleanRows,
                        });
                      }
                      onClose();
                    }}
                    className={`min-h-[40px] px-5 text-white font-semibold cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    إدراج
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 7. IMPORT BACKUP */}
          {activeModal === 'import-backup' && (
            <>
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileImportRead(file);
                }}
                className={`block border-2 border-dashed p-6 text-center cursor-pointer ${buttonRadiusClass}`}
                style={{ borderColor: theme.borderColor, backgroundColor: theme.surfaceBg }}
              >
                <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: theme.headingColor }} />
                <div className="font-bold">اسحب ملف النسخة (.json) هنا أو اضغط للاختيار من الجهاز</div>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileImportRead(file);
                  }}
                />
              </label>

              {importError && (
                <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]">
                  {importError}
                </div>
              )}

              {importPreview && (
                <div className="p-3 border space-y-1" style={{ borderColor: theme.borderColor, backgroundColor: theme.accentSoft }}>
                  <div className="font-bold" style={{ color: theme.headingColor }}>
                    معاينة النسخة الجاهزة للاستيراد:
                  </div>
                  <div>الاسم: {importPreview.name}</div>
                  <div>الطفل: {importPreview.arData.childName}</div>
                  <div>التاريخ: {importPreview.arData.reportDate}</div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                {!importPreview ? (
                  <span className="text-[11px] font-medium" style={{ color: theme.textMuted }}>
                    اختر ملف نسخة JSON أولاً لتفعيل الاستيراد
                  </span>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`min-h-[40px] px-4 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                    style={{ borderColor: theme.borderColor }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={!importPreview}
                    onClick={() => {
                      if (importPreview) {
                        onImportBackup(importPreview);
                        onClose();
                      }
                    }}
                    className={`min-h-[40px] px-5 text-white font-semibold cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    استيراد
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 8. CONFIRM PRINT */}
          {activeModal === 'confirm-print' && (
            <>
              <div className="p-3.5 border space-y-1.5" style={{ borderColor: theme.borderColor, backgroundColor: theme.surfaceBg }}>
                <div className="font-bold text-sm" style={{ color: theme.headingColor }}>
                  ملخص التقرير قبل الطباعة
                </div>
                <div><strong>العنوان:</strong> {currentData.reportTitle}</div>
                <div><strong>الجهة الموجه إليها:</strong> {currentData.schoolAddressee}</div>
                <div><strong>اللغة:</strong> {language === 'ar' ? 'العربية' : 'English'}</div>
                <div><strong>التنسيق:</strong> {viewFormat === 'infographic' ? 'إنفوجراف' : layoutMode === 'single' ? 'A4 صفحة واحدة' : 'A4 صفحتان'}</div>
                <div><strong>الأقسام المفعلة:</strong> {activeSectionsCount} أقسام أساسية</div>
                <div><strong>ثيم الطباعة:</strong> {LIGHT_THEMES[themeSettings.printTheme].name} (خلفية بيضاء لتوفير الحبر)</div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                {onOpenAutoFormat ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setTimeout(onOpenAutoFormat, 80);
                    }}
                    className={`min-h-[40px] px-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>✨ تنسيق آلي ذكي</span>
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`min-h-[40px] px-4 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                    style={{ borderColor: theme.borderColor }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setTimeout(onExecutePrint, 120);
                    }}
                    className={`min-h-[40px] px-5 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
