import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  FilePlus2,
  FolderOpen,
  LayoutGrid,
  Loader2,
  Palette,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Stamp,
  Trash2,
  Upload,
  Zap,
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
  ADDON_CATALOG,
  ADDON_CATEGORIES,
  AddonsSettings,
  AutoFormatSettings,
  BEHAVIOR_TECHNIQUES,
  ButtonShapeOption,
  ContactSettings,
  DEFAULT_ADDONS_SETTINGS,
  DEFAULT_AUTO_FORMAT_SETTINGS,
  DEFAULT_THEME_SETTINGS,
  DensityOption,
  EVALUATION_FORM_TEMPLATES,
  EvaluationFormEntry,
  FontSizeOption,
  LIGHT_THEMES,
  LightThemeDefinition,
  LightThemeId,
  PlanGoalItem,
  RECIPIENT_OPTIONS,
  RECOMMENDATION_BANK,
  ReportExtras,
  SavedReportRecord,
  SidebarSectionId,
  SmartAddDraftItem,
  SmartAddKind,
  ThemeSettings,
  WeeklyTaskItem,
} from '../types/studio';
import { SmartFormatScope } from '../utils/smartAutoFormatter';
import { copyTextToClipboard } from '../utils/storageAndBackup';
import { ActiveModalType } from './StudioModals';

interface WorkspaceSectionPanelProps {
  activeSection: SidebarSectionId;
  activeTabOverride?: string;
  onTabChange?: (section: SidebarSectionId, tabId: string) => void;
  initialEvalCategory?: EvaluationFormEntry['category'];

  theme: LightThemeDefinition;
  buttonRadiusClass: string;
  data: ReportData;
  language: ReportLanguage;
  viewFormat: ViewFormat;
  layoutMode: LayoutMode;
  visibility: SectionVisibility;
  extras: ReportExtras;
  showStamp: boolean;
  savedReports: SavedReportRecord[];
  themeSettings: ThemeSettings;
  contactSettings: ContactSettings;
  addonsSettings: AddonsSettings;
  aiBusy: boolean;

  onUpdateData: (updated: ReportData) => void;
  onUpdateVisibility: (updated: SectionVisibility) => void;
  onUpdateExtras: (updated: ReportExtras) => void;
  onToggleStamp: () => void;
  onChangeView: (view: ViewFormat, layout: LayoutMode) => void;
  onApplyTemplateById: (id: string) => void;
  onAddRecommendations: (items: string[]) => void;

  onSaveDraft: (name: string) => void;
  onLoadRecord: (rec: SavedReportRecord) => void;
  onRequestDeleteRecord: (rec: SavedReportRecord) => void;

  onUpdateThemeSettings: (next: ThemeSettings, persist: boolean) => void;
  onUpdateContactSettings: (next: ContactSettings) => void;
  onUpdateAddonsSettings: (next: AddonsSettings) => void;
  onOpenModal: (modal: ActiveModalType) => void;
  onOpenAddVisual: (kind: 'chart' | 'table' | 'before-after') => void;
  onRunAiSummary: () => Promise<void>;
  onRunShortcut: (mode: 'executive' | 'parent-brief' | 'school-memo') => Promise<void>;
  onJumpToPreview: () => void;
  onNotify: (msg: string) => void;

  autoFormatSettings?: AutoFormatSettings;
  onUpdateAutoFormatSettings?: (next: AutoFormatSettings, persist: boolean) => void;
  onOpenAutoFormat?: (scope: SmartFormatScope) => void;
  onOpenSmartAdd?: (kind: SmartAddKind, draft?: SmartAddDraftItem) => void;
  smartAddDrafts?: SmartAddDraftItem[];
  onDeleteSmartAddDraft?: (id: string) => void;
}

const SECTION_META: Record<
  SidebarSectionId,
  { title: string; subtitle: string; defaultTab: string }
> = {
  dashboard: {
    title: 'إدارة التقارير والملفات',
    subtitle: 'فتح التقارير المحفوظة، المسودات، وجدول المهام الأسبوعي',
    defaultTab: 'all',
  },
  library: {
    title: 'المكتبة الذكية والمساعد السريري',
    subtitle: '81+ بطاقة تخصصية، مساعد الشكاوى الذكي، ومحرك تفريغ وتصحيح المرفقات',
    defaultTab: 'cards',
  },
  summary: {
    title: 'ملخص التقرير التربوي',
    subtitle: 'إنشاء ملخص تنفيذي أو ملخص سريع من 5 سطور وإدراجه بالتقرير',
    defaultTab: 'create',
  },
  evaluations: {
    title: 'التقييم والاستمارات المتخصصة',
    subtitle: 'تقييم شامل متعدد الاختيار، استمارات التخصصات، وملخص إنفوجراف',
    defaultTab: 'comprehensive',
  },
  plan: {
    title: 'خطة الأهداف والمتابعة',
    subtitle: 'إضافة أهداف الخطة الفردية ومتابعة التقدم الدوري',
    defaultTab: 'create',
  },
  recommendations: {
    title: 'بنك التوصيات وفنيات تعديل السلوك',
    subtitle: 'اختيار متعدد للتوصيات التربوية وفنيات تعديل السلوك وإدراجها',
    defaultTab: 'school',
  },
  charts: {
    title: 'الرسوم البيانية والجداول',
    subtitle: 'إدراج رسوم بيانية وجداول ومقارنات قبل وبعد بأرقامك الفعلية',
    defaultTab: 'chart',
  },
  templates: {
    title: 'قوالب التصميم وأنماط العرض',
    subtitle: 'تبديل قوالب المحتوى، أنماط A4 والإنفوجراف، والاختصارات الذكية',
    defaultTab: 'content',
  },
  recipients: {
    title: 'الجهات الموجه إليها التقرير',
    subtitle: 'تحديد الجهات وتوليد نسخ مخصصة بالصيغة الرسمية المناسبة',
    defaultTab: 'main',
  },
  settings: {
    title: 'إعدادات المركز والثيمات والإضافات',
    subtitle: 'بيانات المركز والتواصل، الثيمات الفاتحة، تخصيص زر الإضافات، والختم',
    defaultTab: 'center',
  },
  cv: {
    title: 'توليد سيرة ذاتية متوافقة مع ATS',
    subtitle: 'تصميم عمود واحد قياسي وفحص التوافق الفوري وتصدير Word / PDF / نص',
    defaultTab: 'new-cv',
  },
  certificates: {
    title: 'الشهادات والإفادات الجماعية',
    subtitle: '16 قالباً جاهزاً ومحرر لوحة حر وتوليد 40 شهادة دفعة واحدة من Excel',
    defaultTab: 'main',
  },
};

export const WorkspaceSectionPanel: React.FC<WorkspaceSectionPanelProps> = ({
  activeSection,
  activeTabOverride,
  onTabChange,
  initialEvalCategory,
  theme,
  buttonRadiusClass,
  data,
  viewFormat,
  layoutMode,
  visibility,
  extras,
  showStamp,
  savedReports,
  themeSettings,
  contactSettings,
  addonsSettings,
  aiBusy,
  onUpdateData,
  onUpdateVisibility,
  onUpdateExtras,
  onToggleStamp,
  onChangeView,
  onApplyTemplateById,
  onAddRecommendations,
  onSaveDraft,
  onLoadRecord,
  onRequestDeleteRecord,
  onUpdateThemeSettings,
  onUpdateContactSettings,
  onUpdateAddonsSettings,
  onOpenModal,
  onOpenAddVisual,
  onRunAiSummary,
  onRunShortcut,
  onJumpToPreview,
  onNotify,
  autoFormatSettings = DEFAULT_AUTO_FORMAT_SETTINGS,
  onUpdateAutoFormatSettings,
  onOpenAutoFormat,
  onOpenSmartAdd,
  smartAddDrafts = [],
  onDeleteSmartAddDraft,
}) => {
  const [cardCollapsed, setCardCollapsed] = useState<boolean>(false);

  // Sub-tabs state per section (synced with persisted studio prefs)
  const [dashTab, setDashTab] = useState<'new' | 'all' | 'drafts' | 'tasks'>('all');
  const [summaryTab, setSummaryTab] = useState<'create' | 'five-lines'>('create');
  const [planTab, setPlanTab] = useState<'create' | 'table' | 'progress'>('create');
  const [chartsTab, setChartsTab] = useState<'chart' | 'table' | 'before-after'>('chart');
  const [templatesTab, setTemplatesTab] = useState<'content' | 'layouts' | 'shortcuts'>('content');
  const [recTab, setRecTab] = useState<'school' | 'home' | 'specialist'>('school');
  const [evalViewTab, setEvalViewTab] = useState<'comprehensive' | 'specialty' | 'infographic'>(
    'comprehensive'
  );
  const [evalSpecialty, setEvalSpecialty] =
    useState<EvaluationFormEntry['category']>('speech');
  const [settingsTab, setSettingsTab] = useState<
    'center' | 'themes' | 'addons' | 'signature' | 'format'
  >('center');
  const [formatDraft, setFormatDraft] = useState<AutoFormatSettings>(autoFormatSettings);

  useEffect(() => {
    setFormatDraft(autoFormatSettings);
  }, [autoFormatSettings]);

  // Sync controlled tab override when jumping from Sidebar Search, Addons Modal, or Saved Prefs
  useEffect(() => {
    setCardCollapsed(false);
    if (!activeTabOverride) return;
    if (
      activeSection === 'dashboard' &&
      (['new', 'all', 'drafts', 'tasks'] as const).includes(
        activeTabOverride as 'new' | 'all' | 'drafts' | 'tasks'
      )
    ) {
      setDashTab(activeTabOverride as 'new' | 'all' | 'drafts' | 'tasks');
    } else if (
      activeSection === 'summary' &&
      (['create', 'five-lines'] as const).includes(activeTabOverride as 'create' | 'five-lines')
    ) {
      setSummaryTab(activeTabOverride as 'create' | 'five-lines');
    } else if (
      activeSection === 'plan' &&
      (['create', 'table', 'progress'] as const).includes(
        activeTabOverride as 'create' | 'table' | 'progress'
      )
    ) {
      setPlanTab(activeTabOverride as 'create' | 'table' | 'progress');
    } else if (
      activeSection === 'charts' &&
      (['chart', 'table', 'before-after'] as const).includes(
        activeTabOverride as 'chart' | 'table' | 'before-after'
      )
    ) {
      setChartsTab(activeTabOverride as 'chart' | 'table' | 'before-after');
    } else if (
      activeSection === 'templates' &&
      (['content', 'layouts', 'shortcuts'] as const).includes(
        activeTabOverride as 'content' | 'layouts' | 'shortcuts'
      )
    ) {
      setTemplatesTab(activeTabOverride as 'content' | 'layouts' | 'shortcuts');
    } else if (
      activeSection === 'recommendations' &&
      (['school', 'home', 'specialist'] as const).includes(
        activeTabOverride as 'school' | 'home' | 'specialist'
      )
    ) {
      setRecTab(activeTabOverride as 'school' | 'home' | 'specialist');
    } else if (
      activeSection === 'evaluations' &&
      (['comprehensive', 'specialty', 'infographic'] as const).includes(
        activeTabOverride as 'comprehensive' | 'specialty' | 'infographic'
      )
    ) {
      setEvalViewTab(activeTabOverride as 'comprehensive' | 'specialty' | 'infographic');
    } else if (
      activeSection === 'settings' &&
      (['center', 'themes', 'addons', 'signature', 'format'] as const).includes(
        activeTabOverride as 'center' | 'themes' | 'addons' | 'signature' | 'format'
      )
    ) {
      setSettingsTab(
        activeTabOverride as 'center' | 'themes' | 'addons' | 'signature' | 'format'
      );
    }
  }, [activeSection, activeTabOverride]);

  useEffect(() => {
    if (initialEvalCategory) {
      setEvalSpecialty(initialEvalCategory);
    }
  }, [initialEvalCategory]);

  const selectTab = (tabId: string) => {
    if (onTabChange) {
      onTabChange(activeSection, tabId);
    }
  };

  // Local interactive states
  const [recSearch, setRecSearch] = useState('');
  const [pickedRecs, setPickedRecs] = useState<string[]>([]);
  const [pickedBehaviors, setPickedBehaviors] = useState<string[]>(
    extras.selectedBehaviorTechniques
  );
  const [evalSearch, setEvalSearch] = useState('');
  const [pickedEvalIds, setPickedEvalIds] = useState<string[]>(
    extras.selectedEvaluationForms.map((f) => f.id)
  );
  const [evalDrafts, setEvalDrafts] = useState<Record<string, EvaluationFormEntry>>(() => {
    const map: Record<string, EvaluationFormEntry> = {};
    EVALUATION_FORM_TEMPLATES.forEach((t) => {
      map[t.id] = { ...t, fields: t.fields.map((f) => ({ ...f })) };
    });
    return map;
  });
  const [recipsSearch, setRecipsSearch] = useState('');
  const [customRecipientText, setCustomRecipientText] = useState('');

  // Plan goal draft inputs
  const [goalText, setGoalText] = useState('');
  const [goalDuration, setGoalDuration] = useState('4 أسابيع');
  const [goalOwner, setGoalOwner] = useState('المدرسة والأسرة');
  const [goalProgress, setGoalProgress] = useState('قيد التنفيذ');

  // Weekly task draft inputs
  const [taskDay, setTaskDay] = useState('الأحد');
  const [taskText, setTaskText] = useState('');
  const [taskOwner, setTaskOwner] = useState('الأسرة والأخصائي');
  const [taskStatus, setTaskStatus] = useState('مجدول');

  // Quick 5 lines state
  const [fiveLineDraft, setFiveLineDraft] = useState<string[]>(
    extras.quickSummaryLines.length === 5
      ? extras.quickSummaryLines
      : [
          `الحالة: ${data.childName} · العمر: ${data.age}`,
          `الاحتياج الأساسي: ${data.diagnosis}`,
          'تتأثر كفاءة التعلم بالضوضاء والمثيرات الحسية المرتفعة.',
          'البيئة الهادئة والمنظمة تعزز التركيز والمشاركة والإنجاز.',
          `التوصية: ${data.reportSubtitle}`,
        ]
  );

  const [sectionSearch, setSectionSearch] = useState('');

  useEffect(() => {
    setPickedBehaviors(extras.selectedBehaviorTechniques);
    setPickedEvalIds(extras.selectedEvaluationForms.map((f) => f.id));
    setFiveLineDraft(
      extras.quickSummaryLines.length === 5
        ? extras.quickSummaryLines
        : [
            `الحالة: ${data.childName} · العمر: ${data.age}`,
            `الاحتياج الأساسي: ${data.diagnosis}`,
            'تتأثر كفاءة التعلم بالضوضاء والمثيرات الحسية المرتفعة.',
            'البيئة الهادئة والمنظمة تعزز التركيز والمشاركة والإنجاز.',
            `التوصية: ${data.reportSubtitle}`,
          ]
    );
  }, [extras, data.childName, data.age, data.diagnosis, data.reportSubtitle]);

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyTextToClipboard(text);
    onNotify(ok ? `تم نسخ ${label} إلى الحافظة` : 'تعذر النسخ إلى الحافظة');
  };

  const togglePickedRec = (txt: string) => {
    setPickedRecs((prev) =>
      prev.includes(txt) ? prev.filter((x) => x !== txt) : [...prev, txt]
    );
  };

  const filteredRecs = RECOMMENDATION_BANK[recTab].filter((item) =>
    item.includes(recSearch.trim())
  );
  const filteredRecipients = RECIPIENT_OPTIONS.filter((r) =>
    r.label.includes(recipsSearch.trim())
  );
  const filteredEvals = EVALUATION_FORM_TEMPLATES.filter((f) =>
    f.title.includes(evalSearch.trim())
  );

  const sectionToggleList: {
    key: 'personal' | 'background' | 'environment' | 'homeSchool' | 'recommendations' | 'opinion';
    label: string;
  }[] = [
    { key: 'personal', label: 'البيانات الشخصية' },
    { key: 'background', label: 'الخلفية النمائية' },
    { key: 'environment', label: 'تأثير البيئة' },
    { key: 'homeSchool', label: 'التعليم المنزلي' },
    { key: 'recommendations', label: 'التوصيات' },
    { key: 'opinion', label: 'الرأي المهني' },
  ];

  const extraSectionToggleList: {
    key: keyof ReportExtras['extrasVisibility'];
    label: string;
  }[] = [
    { key: 'summary', label: 'ملخص التقرير' },
    { key: 'plan', label: 'خطة وأهداف' },
    { key: 'behaviorTechniques', label: 'فنيات تعديل السلوك' },
    { key: 'evaluations', label: 'استمارات التقييم' },
    { key: 'charts', label: 'الرسوم البيانية' },
    { key: 'tables', label: 'الجداول' },
  ];

  const tabBtnClass = (active: boolean) =>
    `min-h-[36px] px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${buttonRadiusClass} ${
      active ? 'shadow-xs' : 'hover:bg-white/70'
    }`;

  const weeklyTasks = extras.weeklyTasks || [];
  const meta = SECTION_META[activeSection];

  const renderCardHeaderAction = () => {
    const targetScope: SmartFormatScope =
      activeSection === 'dashboard' && dashTab === 'tasks'
        ? 'tasks'
        : activeSection === 'evaluations'
          ? 'evaluations'
          : activeSection === 'plan' || activeSection === 'recommendations'
            ? 'plan-recs'
            : 'report';

    const autoFormatBtn = onOpenAutoFormat ? (
      <button
        type="button"
        onClick={() => onOpenAutoFormat(targetScope)}
        className={`min-h-[32px] px-3 text-xs font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
        title="تنسيق آلي ذكي لإصلاح الإملاء والترقيم والخطوط والتواريخ والجداول"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>✨ تنسيق آلي ذكي</span>
      </button>
    ) : null;

    if (activeSection === 'dashboard') {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {autoFormatBtn}
          {onOpenSmartAdd && (
            <button
              type="button"
              onClick={() => onOpenSmartAdd(dashTab === 'tasks' ? 'task' : 'report')}
              className={`min-h-[32px] px-3 text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{dashTab === 'tasks' ? 'إضافة مهمة ذكية' : 'تقرير جديد'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onSaveDraft(`مسودة ${data.childName || '[ ... ]'}`)}
            className={`min-h-[32px] px-3 text-xs font-bold border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A] hover:bg-[#DBEAFE] inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ كمسودة</span>
          </button>
        </div>
      );
    }
    if (activeSection === 'summary') {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {autoFormatBtn}
          <button
            type="button"
            disabled={aiBusy}
            onClick={onRunAiSummary}
            className={`min-h-[32px] px-3 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
            style={{ backgroundColor: '#2563EB' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{aiBusy ? 'جاري التلخيص...' : 'توليد اختصار ذكي'}</span>
          </button>
        </div>
      );
    }
    if (activeSection === 'charts') {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {autoFormatBtn}
          <button
            type="button"
            onClick={() => onOpenAddVisual(chartsTab)}
            className={`min-h-[32px] px-3 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
            style={{ backgroundColor: '#2563EB' }}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>إضافة رسم / جدول</span>
          </button>
        </div>
      );
    }
    if (activeSection === 'templates') {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {autoFormatBtn}
          <button
            type="button"
            onClick={() => onOpenModal('choose-template')}
            className={`min-h-[32px] px-3 text-xs font-bold border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A] hover:bg-[#DBEAFE] inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
          >
            <span>معرض القوالب</span>
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {autoFormatBtn}
        {activeSection === 'evaluations' && onOpenSmartAdd && (
          <button
            type="button"
            onClick={() => onOpenSmartAdd('evaluation')}
            className={`min-h-[32px] px-3 text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تقييم جديد</span>
          </button>
        )}
        <button
          type="button"
          onClick={onJumpToPreview}
          className={`min-h-[32px] px-3 text-xs font-bold border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A] hover:bg-[#DBEAFE] inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>معاينة التقرير</span>
        </button>
      </div>
    );
  };

  return (
    <section
      dir="rtl"
      className="no-print bg-white border border-[#E2E8F0] rounded-xl shadow-sm mb-4 overflow-hidden"
      style={{ color: '#0F172A' }}
    >
      {/* Unified Clean Card Header with Collapse/Expand & Left Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white border-b border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => setCardCollapsed((c) => !c)}
          className="flex items-center gap-2 text-right cursor-pointer group"
          title={cardCollapsed ? 'توسيع البطاقة' : 'طي البطاقة'}
        >
          <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] group-hover:bg-[#DBEAFE]">
            {cardCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </span>
          <div>
            <h2 className="font-editorial text-base font-bold text-[#0F172A] leading-tight">
              {meta.title}
            </h2>
            <p className="text-[11px] text-[#64748B]">{meta.subtitle}</p>
          </div>
        </button>

        <div className="flex items-center gap-2">{renderCardHeaderAction()}</div>
      </div>

      {!cardCollapsed && (
        <div>
          {/* 1. DASHBOARD / REPORTS */}
          {activeSection === 'dashboard' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(
                    [
                      ['new', 'تقرير جديد'],
                      ['all', `كل التقارير (${savedReports.filter((r) => !r.isDraft).length})`],
                      ['drafts', `مسودات (${savedReports.filter((r) => r.isDraft).length})`],
                      ['tasks', `جدول مهام (${weeklyTasks.length})`],
                    ] as const
                  ).map(([id, lbl]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setDashTab(id);
                        selectTab(id);
                      }}
                      className={tabBtnClass(dashTab === id)}
                      style={{
                        backgroundColor: dashTab === id ? '#2563EB' : 'transparent',
                        color: dashTab === id ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenModal('save-copy')}
                    className={`min-h-[32px] px-2.5 text-[11px] font-bold bg-white border border-[#CBD5E1] hover:border-[#2563EB] text-[#1E3A8A] inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                    title="حفظ نسخة احتياطية على الجهاز (Ctrl+S)"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ نسخة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenModal('import-backup')}
                    className={`min-h-[32px] px-2.5 text-[11px] font-bold bg-white border border-[#CBD5E1] hover:border-[#D97706] text-[#B45309] inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                    title="استيراد ملف نسخة احتياطية"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>استيراد</span>
                  </button>
                </div>
              </div>

              <div className="p-4 text-xs">
                {dashTab === 'new' && (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div>
                      <div className="font-bold text-sm text-[#0F172A]">
                        إنشاء تقرير جديد ذكي أو من قالب جاهز
                      </div>
                      <p className="mt-0.5 text-[#64748B]">
                        أدخل نصاً أو أرفق ملفات Word / Excel / PDF / صورة أو صوت وسيتم الملء محلياً فوراً.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {onOpenSmartAdd && (
                        <button
                          type="button"
                          onClick={() => onOpenSmartAdd('report')}
                          className={`min-h-[40px] px-4 text-white font-bold inline-flex items-center gap-2 cursor-pointer bg-[#059669] hover:bg-[#047857] ${buttonRadiusClass}`}
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>تقرير جديد (إضافة ذكية)</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenModal('new-report')}
                        className={`min-h-[40px] px-3.5 bg-white border border-[#CBD5E1] text-[#0F172A] font-bold inline-flex items-center gap-2 cursor-pointer hover:bg-[#EFF6FF] ${buttonRadiusClass}`}
                      >
                        <FilePlus2 className="w-4 h-4 text-[#2563EB]" />
                        <span>قالب تقرير فارغ / جاهز</span>
                      </button>
                    </div>
                  </div>
                )}

                {(dashTab === 'all' || dashTab === 'drafts') && (
                  <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#EFF6FF] text-[#1E3A8A] border-b border-[#BFDBFE]">
                          <th className="py-2.5 px-3 font-bold">اسم التقرير</th>
                          <th className="py-2.5 px-3 font-bold">الحالة</th>
                          <th className="py-2.5 px-3 font-bold">اللغة</th>
                          <th className="py-2.5 px-3 font-bold">آخر تحديث</th>
                          <th className="py-2.5 px-3 font-bold text-left">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {savedReports
                          .filter((r) => (dashTab === 'drafts' ? r.isDraft : !r.isDraft))
                          .map((rec) => (
                            <tr key={rec.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2.5 px-3 font-bold text-[#0F172A]">
                                {rec.name}
                              </td>
                              <td className="py-2.5 px-3 text-[#334155]">
                                {rec.arData.childName}
                              </td>
                              <td className="py-2.5 px-3 text-[#475569]">
                                {rec.language === 'ar' ? 'عربي' : 'English'}
                              </td>
                              <td className="py-2.5 px-3 text-[#64748B] tabular-nums-ar">
                                {rec.updatedAt}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onLoadRecord(rec);
                                      onJumpToPreview();
                                    }}
                                    className={`min-h-[32px] px-2.5 border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A] font-semibold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                                  >
                                    <FolderOpen className="w-3.5 h-3.5" />
                                    <span>فتح</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopy(
                                        `${rec.arData.reportTitle}\n${rec.arData.backgroundParagraph1}\n${rec.arData.coreGoalQuote}`,
                                        'ملخص التقرير'
                                      )
                                    }
                                    className={`min-h-[32px] px-2.5 border border-[#E2E8F0] bg-white text-[#334155] inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>نسخ</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onRequestDeleteRecord(rec)}
                                    className={`min-h-[32px] px-2.5 border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>حذف</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {savedReports.filter((r) => (dashTab === 'drafts' ? r.isDraft : !r.isDraft))
                      .length === 0 && (
                      <div className="p-5 text-center text-[#64748B]">
                        لا توجد تقارير في هذه القائمة حالياً.
                      </div>
                    )}

                    {dashTab === 'drafts' && smartAddDrafts.length > 0 && (
                      <div className="mt-3 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg space-y-2">
                        <div className="font-bold text-[#92400E]">
                          مسودات الإضافة الذكية الموحدة ({smartAddDrafts.length})
                        </div>
                        <div className="space-y-1.5">
                          {smartAddDrafts.map((dr) => (
                            <div
                              key={dr.id}
                              className="p-2 bg-white border border-[#E2E8F0] rounded-lg flex flex-wrap items-center justify-between gap-2"
                            >
                              <div>
                                <div className="font-bold text-[#0F172A]">{dr.title}</div>
                                <div className="text-[10.5px] text-[#64748B]">
                                  النوع: {dr.kind} · آخر تحديث: {dr.updatedAt}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {onOpenSmartAdd && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenSmartAdd(dr.kind, dr)}
                                    className={`min-h-[30px] px-2.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] font-bold cursor-pointer ${buttonRadiusClass}`}
                                  >
                                    فتح المسودة
                                  </button>
                                )}
                                {onDeleteSmartAddDraft && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteSmartAddDraft(dr.id)}
                                    className={`min-h-[30px] px-2.5 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] font-bold cursor-pointer ${buttonRadiusClass}`}
                                  >
                                    حذف
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {dashTab === 'tasks' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <select
                        value={taskDay}
                        onChange={(e) => setTaskDay(e.target.value)}
                        className={`min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                      >
                        {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'يومي'].map(
                          (d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          )
                        )}
                      </select>
                      <input
                        type="text"
                        value={taskText}
                        onChange={(e) => setTaskText(e.target.value)}
                        placeholder="وصف المهمة الأسبوعية..."
                        className={`min-h-[36px] px-3 bg-white border border-[#CBD5E1] sm:col-span-2 ${buttonRadiusClass}`}
                      />
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={taskOwner}
                          onChange={(e) => setTaskOwner(e.target.value)}
                          placeholder="المسؤول..."
                          className={`flex-1 min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                        />
                        <button
                          type="button"
                          disabled={!taskText.trim()}
                          onClick={() => {
                            const newTask: WeeklyTaskItem = {
                              id: `task-${Date.now()}`,
                              day: taskDay,
                              task: taskText.trim(),
                              owner: taskOwner.trim() || '[ ... ]',
                              status: taskStatus.trim() || 'مجدول',
                            };
                            onUpdateExtras({
                              ...extras,
                              weeklyTasks: [...weeklyTasks, newTask],
                            });
                            setTaskText('');
                            onNotify('تمت إضافة المهمة إلى الجدول الأسبوعي');
                          }}
                          className={`min-h-[36px] px-3 bg-[#2563EB] text-white font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>إضافة</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-[#EFF6FF] text-[#1E3A8A] border-b border-[#BFDBFE]">
                            <th className="py-2.5 px-3 font-bold">اليوم</th>
                            <th className="py-2.5 px-3 font-bold">المهمة / النشاط</th>
                            <th className="py-2.5 px-3 font-bold">المسؤول</th>
                            <th className="py-2.5 px-3 font-bold">الحالة</th>
                            <th className="py-2.5 px-3 font-bold text-left">إجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {weeklyTasks.map((t) => (
                            <tr key={t.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-bold text-[#1E3A8A]">{t.day}</td>
                              <td className="py-2 px-3">{t.task}</td>
                              <td className="py-2 px-3 text-[#475569]">{t.owner}</td>
                              <td className="py-2 px-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextStatus =
                                      t.status === 'مكتمل' ? 'مجدول' : 'مكتمل';
                                    onUpdateExtras({
                                      ...extras,
                                      weeklyTasks: weeklyTasks.map((x) =>
                                        x.id === t.id ? { ...x, status: nextStatus } : x
                                      ),
                                    });
                                  }}
                                  className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${buttonRadiusClass}`}
                                  style={{
                                    backgroundColor:
                                      t.status === 'مكتمل' ? '#ECFDF5' : '#EFF6FF',
                                    color: t.status === 'مكتمل' ? '#047857' : '#1E3A8A',
                                    borderColor:
                                      t.status === 'مكتمل' ? '#A7F3D0' : '#BFDBFE',
                                  }}
                                >
                                  {t.status}
                                </button>
                              </td>
                              <td className="py-2 px-3 text-left">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateExtras({
                                      ...extras,
                                      weeklyTasks: weeklyTasks.filter((x) => x.id !== t.id),
                                    })
                                  }
                                  className="text-[#DC2626] font-bold cursor-pointer"
                                >
                                  حذف
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {weeklyTasks.length === 0 && (
                        <div className="p-4 text-center text-[#64748B] flex items-center justify-center gap-2">
                          <CalendarDays className="w-4 h-4 text-[#94A3B8]" />
                          <span>لا توجد مهام أسبوعية بعد — أضف مهمة من الحقول أعلاه لإدراجها بالتقرير.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. SUMMARY */}
          {activeSection === 'summary' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSummaryTab('create');
                      selectTab('create');
                    }}
                    className={tabBtnClass(summaryTab === 'create')}
                    style={{
                      backgroundColor: summaryTab === 'create' ? '#2563EB' : 'transparent',
                      color: summaryTab === 'create' ? '#FFFFFF' : '#475569',
                    }}
                  >
                    إنشاء ملخص
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSummaryTab('five-lines');
                      selectTab('five-lines');
                    }}
                    className={tabBtnClass(summaryTab === 'five-lines')}
                    style={{
                      backgroundColor: summaryTab === 'five-lines' ? '#2563EB' : 'transparent',
                      color: summaryTab === 'five-lines' ? '#FFFFFF' : '#475569',
                    }}
                  >
                    ملخص سريع 5 سطور
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3 text-xs">
                {summaryTab === 'create' && (
                  <>
                    <textarea
                      rows={3}
                      value={extras.summaryText}
                      onChange={(e) =>
                        onUpdateExtras({ ...extras, summaryText: e.target.value })
                      }
                      placeholder="اكتب ملخص التقرير أو اضغط توليد ملخص تلقائي من التقرير الحالي..."
                      className={`w-full p-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const auto = `${data.reportTitle} — الحالة: ${data.childName} (${data.age})، التشخيص المذكور: ${data.diagnosis}. ${data.coreGoalQuote}`;
                          onUpdateExtras({
                            ...extras,
                            summaryText: auto,
                            extrasVisibility: { ...extras.extrasVisibility, summary: true },
                          });
                          onNotify('تم إدراج ملخص التقرير');
                        }}
                        className={`min-h-[38px] px-3.5 bg-[#2563EB] text-white font-semibold cursor-pointer ${buttonRadiusClass}`}
                      >
                        إدراج ملخص تلقائي في التقرير
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(extras.summaryText || data.coreGoalQuote, 'الملخص')
                        }
                        className={`min-h-[38px] px-3 border border-[#CBD5E1] inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ</span>
                      </button>
                    </div>
                  </>
                )}

                {summaryTab === 'five-lines' && (
                  <>
                    <div className="space-y-1.5">
                      {fiveLineDraft.map((ln, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={ln}
                          onChange={(e) => {
                            const copy = [...fiveLineDraft];
                            copy[idx] = e.target.value;
                            setFiveLineDraft(copy);
                          }}
                          className={`w-full min-h-[36px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateExtras({
                            ...extras,
                            quickSummaryLines: fiveLineDraft.filter((l) => l.trim()),
                            extrasVisibility: { ...extras.extrasVisibility, summary: true },
                          });
                          onNotify('تم إضافة الملخص السريع (5 سطور) للتقرير');
                        }}
                        className={`min-h-[38px] px-4 bg-[#2563EB] text-white font-semibold cursor-pointer ${buttonRadiusClass}`}
                      >
                        إدراج في التقرير
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(fiveLineDraft.join('\n'), 'الملخص السريع')
                        }
                        className={`min-h-[38px] px-3 border border-[#CBD5E1] inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 3. PLAN & GOALS */}
          {activeSection === 'plan' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      ['create', 'إنشاء خطة'],
                      ['table', `جدول الأهداف (${extras.planGoals.length})`],
                      ['progress', 'متابعة التقدم'],
                    ] as const
                  ).map(([id, lbl]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setPlanTab(id);
                        selectTab(id);
                      }}
                      className={tabBtnClass(planTab === id)}
                      style={{
                        backgroundColor: planTab === id ? '#2563EB' : 'transparent',
                        color: planTab === id ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 text-xs space-y-3">
                {planTab === 'create' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={goalText}
                        onChange={(e) => setGoalText(e.target.value)}
                        placeholder="اكتب الهدف التربوي أو السلوكي..."
                        className={`min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                      <input
                        type="text"
                        value={goalDuration}
                        onChange={(e) => setGoalDuration(e.target.value)}
                        placeholder="المدة المستهدفة..."
                        className={`min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                      <input
                        type="text"
                        value={goalOwner}
                        onChange={(e) => setGoalOwner(e.target.value)}
                        placeholder="المسؤول عن التنفيذ..."
                        className={`min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                      <input
                        type="text"
                        value={goalProgress}
                        onChange={(e) => setGoalProgress(e.target.value)}
                        placeholder="مؤشر المتابعة..."
                        className={`min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={!goalText.trim()}
                        onClick={() => {
                          const nextGoal: PlanGoalItem = {
                            id: `goal-${Date.now()}`,
                            goal: goalText.trim(),
                            targetDuration: goalDuration.trim() || '[ ... ]',
                            owner: goalOwner.trim() || '[ ... ]',
                            progress: goalProgress.trim() || '[ ... ]',
                          };
                          onUpdateExtras({
                            ...extras,
                            planGoals: [...extras.planGoals, nextGoal],
                            extrasVisibility: { ...extras.extrasVisibility, plan: true },
                          });
                          setGoalText('');
                          onNotify('تمت إضافة الهدف إلى جدول الخطة');
                        }}
                        className={`min-h-[38px] px-4 bg-[#2563EB] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة الهدف للتقرير</span>
                      </button>
                      {!goalText.trim() && (
                        <span className="text-[11px] text-[#64748B]">
                          اكتب نص الهدف أولاً لتفعيل الإضافة
                        </span>
                      )}
                    </div>
                  </>
                )}

                {planTab === 'table' && (
                  <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#EFF6FF] text-[#1E3A8A] border-b border-[#BFDBFE]">
                          <th className="py-2.5 px-3 font-bold">الهدف</th>
                          <th className="py-2.5 px-3 font-bold">المدة</th>
                          <th className="py-2.5 px-3 font-bold">المسؤول</th>
                          <th className="py-2.5 px-3 font-bold">المتابعة</th>
                          <th className="py-2.5 px-3 font-bold text-left">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {extras.planGoals.map((g) => (
                          <tr key={g.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-2 px-3 font-bold">{g.goal}</td>
                            <td className="py-2 px-3">{g.targetDuration}</td>
                            <td className="py-2 px-3">{g.owner}</td>
                            <td className="py-2 px-3">{g.progress}</td>
                            <td className="py-2 px-3 text-left">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateExtras({
                                    ...extras,
                                    planGoals: extras.planGoals.filter((x) => x.id !== g.id),
                                  })
                                }
                                className="text-[#DC2626] font-bold cursor-pointer"
                              >
                                حذف
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {extras.planGoals.length === 0 && (
                      <p className="p-4 text-center text-[#64748B]">
                        لم تُضف أهداف بعد. انتقل إلى تبويب «إنشاء خطة» لإضافة أهداف.
                      </p>
                    )}
                  </div>
                )}

                {planTab === 'progress' && (
                  <div className="space-y-2">
                    <label className="block font-bold">ملاحظات متابعة التقدم الدورية</label>
                    <textarea
                      rows={3}
                      value={extras.progressNotes}
                      onChange={(e) =>
                        onUpdateExtras({ ...extras, progressNotes: e.target.value })
                      }
                      placeholder="أدخل ملاحظات التقدم ومواعيد المراجعة..."
                      className={`w-full p-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. CHARTS & TABLES */}
          {activeSection === 'charts' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      ['chart', `رسم بياني (${extras.charts.length})`],
                      ['table', `جدول (${extras.tables.filter((t) => t.kind === 'table').length})`],
                      [
                        'before-after',
                        `مقارنة قبل / بعد (${
                          extras.tables.filter((t) => t.kind === 'before-after').length
                        })`,
                      ],
                    ] as const
                  ).map(([id, lbl]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setChartsTab(id);
                        selectTab(id);
                      }}
                      className={tabBtnClass(chartsTab === id)}
                      style={{
                        backgroundColor: chartsTab === id ? '#2563EB' : 'transparent',
                        color: chartsTab === id ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 text-xs space-y-2">
                <p className="text-[#64748B]">
                  اختياري فقط — يتم إدراج الرسوم والجداول بالأرقام التي تدخلها يدوياً دون اختراع أي بيانات.
                </p>
                {chartsTab === 'chart' && (
                  <>
                    {extras.charts.length === 0 && (
                      <div className="p-4 border border-[#E2E8F0] rounded-lg text-center text-[#64748B]">
                        لا توجد رسوم بيانية مضافة بعد. اضغط «إضافة رسم / جدول» أعلاه لإدراج رسم.
                      </div>
                    )}
                    {extras.charts.map((c) => (
                      <div
                        key={c.id}
                        className={`p-2.5 border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between ${buttonRadiusClass}`}
                      >
                        <span className="font-bold">
                          {c.title} ({c.points.length} عناصر)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateExtras({
                              ...extras,
                              charts: extras.charts.filter((x) => x.id !== c.id),
                            });
                            onNotify(`تمت إزالة الرسم: ${c.title}`);
                          }}
                          className="text-[#DC2626] font-bold cursor-pointer"
                        >
                          إزالة
                        </button>
                      </div>
                    ))}
                  </>
                )}
                {(chartsTab === 'table' || chartsTab === 'before-after') && (
                  <>
                    {extras.tables.filter((t) => t.kind === chartsTab).length === 0 && (
                      <div className="p-4 border border-[#E2E8F0] rounded-lg text-center text-[#64748B]">
                        {chartsTab === 'table'
                          ? 'لا توجد جداول مخصصة مضافة بعد.'
                          : 'لا توجد مقارنات قبل / بعد مضافة بعد.'}
                      </div>
                    )}
                    {extras.tables
                      .filter((t) => t.kind === chartsTab)
                      .map((t) => (
                        <div
                          key={t.id}
                          className={`p-2.5 border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between ${buttonRadiusClass}`}
                        >
                          <span className="font-bold">
                            {t.title} ({t.rows.length} صفوف)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateExtras({
                                ...extras,
                                tables: extras.tables.filter((x) => x.id !== t.id),
                              });
                              onNotify(`تمت إزالة الجدول: ${t.title}`);
                            }}
                            className="text-[#DC2626] font-bold cursor-pointer"
                          >
                            إزالة
                          </button>
                        </div>
                      ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* 5. DESIGN TEMPLATES (Consolidated Single Source of Truth) */}
          {activeSection === 'templates' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      ['content', 'قوالب المحتوى'],
                      ['layouts', 'أنماط العرض'],
                      ['shortcuts', 'اختصارات ذكية'],
                    ] as const
                  ).map(([id, lbl]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setTemplatesTab(id);
                        selectTab(id);
                      }}
                      className={tabBtnClass(templatesTab === id)}
                      style={{
                        backgroundColor: templatesTab === id ? '#2563EB' : 'transparent',
                        color: templatesTab === id ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 text-xs">
                {templatesTab === 'content' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {REPORT_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => onApplyTemplateById(tpl.id)}
                        className={`p-3 border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#2563EB] hover:bg-[#EFF6FF]/60 text-right cursor-pointer transition-colors ${buttonRadiusClass}`}
                      >
                        <div className="font-bold text-[#0F172A]">{tpl.name}</div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">{tpl.description}</div>
                      </button>
                    ))}
                  </div>
                )}

                {templatesTab === 'layouts' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(
                      [
                        ['formal-a4', 'رسمي A4', viewFormat === 'a4' && layoutMode === 'single'],
                        ['infographic', 'انفوجراف', viewFormat === 'infographic'],
                        ['single', 'صفحة واحدة', viewFormat === 'a4' && layoutMode === 'single'],
                        ['detailed', 'مفصل (صفحتان)', viewFormat === 'a4' && layoutMode === 'two-page'],
                      ] as const
                    ).map(([id, lbl, active]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          if (id === 'infographic') onChangeView('infographic', layoutMode);
                          else if (id === 'detailed') onChangeView('a4', 'two-page');
                          else onChangeView('a4', 'single');
                          onJumpToPreview();
                        }}
                        className={`min-h-[44px] px-3 border font-bold cursor-pointer ${buttonRadiusClass}`}
                        style={{
                          backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
                          borderColor: active ? '#2563EB' : '#CBD5E1',
                          color: active ? '#1E3A8A' : '#334155',
                        }}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                )}

                {templatesTab === 'shortcuts' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-[#1E3A8A] mb-1">
                      <Zap className="w-4 h-4" />
                      <span>إعادة صياغة ذكية للتقرير الحالي بنقرة واحدة:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(
                        [
                          ['executive', 'توليد ملخص تنفيذي مختصر'],
                          ['school-memo', 'تحويل إلى مذكرة تسهيلات صفية'],
                          ['parent-brief', 'إعادة صياغة كدليل لولي الأمر'],
                        ] as const
                      ).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          disabled={aiBusy}
                          onClick={() => onRunShortcut(mode)}
                          className={`min-h-[44px] px-3 py-2 bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-[#1E3A8A] font-bold flex items-center justify-between cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
                        >
                          <span>{label}</span>
                          {aiBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. RECOMMENDATIONS & BEHAVIOR TECHNIQUES */}
          {activeSection === 'recommendations' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      ['school', 'للمدرسة'],
                      ['home', 'للمنزل'],
                      ['specialist', 'للأخصائي'],
                    ] as const
                  ).map(([id, lbl]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setRecTab(id);
                        selectTab(id);
                      }}
                      className={tabBtnClass(recTab === id)}
                      style={{
                        backgroundColor: recTab === id ? '#2563EB' : 'transparent',
                        color: recTab === id ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-[#1E3A8A]">
                  المختار: {pickedRecs.length}
                </span>
              </div>

              <div className="p-4 space-y-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[#94A3B8]" />
                    <input
                      type="text"
                      value={recSearch}
                      onChange={(e) => setRecSearch(e.target.value)}
                      placeholder="بحث في التوصيات..."
                      className={`w-full min-h-[36px] pr-8 pl-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPickedRecs(Array.from(new Set([...pickedRecs, ...filteredRecs])))
                    }
                    className={`min-h-[36px] px-2.5 border border-[#CBD5E1] font-semibold cursor-pointer ${buttonRadiusClass}`}
                  >
                    تحديد الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickedRecs([])}
                    className={`min-h-[36px] px-2.5 border border-[#CBD5E1] font-semibold cursor-pointer ${buttonRadiusClass}`}
                  >
                    إلغاء الكل
                  </button>
                  <button
                    type="button"
                    disabled={pickedRecs.length === 0}
                    onClick={() => {
                      onAddRecommendations(pickedRecs);
                      setPickedRecs([]);
                    }}
                    className={`min-h-[36px] px-3.5 bg-[#2563EB] text-white font-semibold cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
                  >
                    إضافة المختار ({pickedRecs.length})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {filteredRecs.map((item, i) => {
                    const checked = pickedRecs.includes(item);
                    return (
                      <label
                        key={i}
                        className={`min-h-[40px] p-2 border flex items-start gap-2 cursor-pointer ${buttonRadiusClass}`}
                        style={{
                          backgroundColor: checked ? '#EFF6FF' : '#FFFFFF',
                          borderColor: checked ? '#2563EB' : '#E2E8F0',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePickedRec(item)}
                          className="mt-0.5 accent-[#2563EB]"
                        />
                        <span>{item}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#1E3A8A]">
                      فنيات تعديل السلوك (المختار: {pickedBehaviors.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPickedBehaviors([...BEHAVIOR_TECHNIQUES])}
                        className="underline cursor-pointer"
                      >
                        تحديد الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickedBehaviors([])}
                        className="underline cursor-pointer"
                      >
                        إلغاء الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateExtras({
                            ...extras,
                            selectedBehaviorTechniques: pickedBehaviors,
                            extrasVisibility: {
                              ...extras.extrasVisibility,
                              behaviorTechniques: true,
                            },
                          });
                          onNotify('تم تحديث فنيات تعديل السلوك في التقرير');
                        }}
                        className={`min-h-[34px] px-3 bg-[#2563EB] text-white font-semibold cursor-pointer ${buttonRadiusClass}`}
                      >
                        إضافة المختار للتقرير
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {BEHAVIOR_TECHNIQUES.map((tech) => {
                      const checked = pickedBehaviors.includes(tech);
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() =>
                            setPickedBehaviors((prev) =>
                              prev.includes(tech) ? prev.filter((x) => x !== tech) : [...prev, tech]
                            )
                          }
                          className={`min-h-[36px] px-3 border inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                          style={{
                            backgroundColor: checked ? '#EFF6FF' : '#FFFFFF',
                            borderColor: checked ? '#2563EB' : '#CBD5E1',
                            color: checked ? '#1E3A8A' : '#334155',
                            fontWeight: checked ? 700 : 500,
                          }}
                        >
                          {checked && <Check className="w-3.5 h-3.5" />}
                          <span>{tech}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. EVALUATIONS (Smart 3-Tab Structure: تقييم شامل | حسب التخصص | انفو جراف) */}
          {activeSection === 'evaluations' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      ['comprehensive', 'تقييم شامل'],
                      ['specialty', 'حسب التخصص'],
                      ['infographic', 'انفو جراف'],
                    ] as const
                  ).map(([id, lbl]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setEvalViewTab(id);
                        selectTab(id);
                      }}
                      className={tabBtnClass(evalViewTab === id)}
                      style={{
                        backgroundColor: evalViewTab === id ? '#2563EB' : 'transparent',
                        color: evalViewTab === id ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-[#1E3A8A]">
                  الاستمارات المختارة: {pickedEvalIds.length}
                </span>
              </div>

              <div className="p-4 space-y-3 text-xs">
                {evalViewTab === 'comprehensive' && (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[160px]">
                        <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[#94A3B8]" />
                        <input
                          type="text"
                          value={evalSearch}
                          onChange={(e) => setEvalSearch(e.target.value)}
                          placeholder="بحث في الاستمارات..."
                          className={`w-full min-h-[36px] pr-8 pl-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPickedEvalIds(filteredEvals.map((f) => f.id))}
                        className={`min-h-[36px] px-2.5 border border-[#CBD5E1] font-semibold cursor-pointer ${buttonRadiusClass}`}
                      >
                        تحديد الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickedEvalIds([])}
                        className={`min-h-[36px] px-2.5 border border-[#CBD5E1] font-semibold cursor-pointer ${buttonRadiusClass}`}
                      >
                        إلغاء الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const chosen = EVALUATION_FORM_TEMPLATES.filter((f) =>
                            pickedEvalIds.includes(f.id)
                          ).map((f) => evalDrafts[f.id]);
                          onUpdateExtras({
                            ...extras,
                            selectedEvaluationForms: chosen,
                            extrasVisibility: { ...extras.extrasVisibility, evaluations: true },
                          });
                          onNotify(`تم إدراج ${chosen.length} استمارات تقييم في التقرير`);
                        }}
                        className={`min-h-[36px] px-3.5 bg-[#2563EB] text-white font-semibold cursor-pointer ${buttonRadiusClass}`}
                      >
                        إضافة المختار للتقرير ({pickedEvalIds.length})
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {filteredEvals.map((f) => {
                        const checked = pickedEvalIds.includes(f.id);
                        return (
                          <label
                            key={f.id}
                            className={`min-h-[42px] p-2.5 border flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                            style={{
                              backgroundColor: checked ? '#EFF6FF' : '#FFFFFF',
                              borderColor: checked ? '#2563EB' : '#E2E8F0',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setPickedEvalIds((prev) =>
                                  prev.includes(f.id)
                                    ? prev.filter((x) => x !== f.id)
                                    : [...prev, f.id]
                                )
                              }
                              className="accent-[#2563EB]"
                            />
                            <span className="font-semibold">{f.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}

                {evalViewTab === 'specialty' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          ['speech', 'تخاطب'],
                          ['behavior', 'تعديل سلوك'],
                          ['sensory', 'تكامل حسي'],
                          ['learning', 'صعوبات تعلم'],
                          ['iq', 'اختبارات ذكاء'],
                          ['family', 'إرشاد أسري'],
                        ] as const
                      ).map(([cat, lbl]) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setEvalSpecialty(cat)}
                          className={`min-h-[36px] px-3 border font-bold cursor-pointer ${buttonRadiusClass}`}
                          style={{
                            backgroundColor: evalSpecialty === cat ? '#2563EB' : '#F8FAFC',
                            color: evalSpecialty === cat ? '#FFFFFF' : '#334155',
                            borderColor: evalSpecialty === cat ? '#2563EB' : '#CBD5E1',
                          }}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>

                    {EVALUATION_FORM_TEMPLATES.filter((f) => f.category === evalSpecialty).map(
                      (f) => {
                        const draft = evalDrafts[f.id];
                        return (
                          <div
                            key={f.id}
                            className={`p-3.5 border border-[#E2E8F0] bg-[#F8FAFC] space-y-2.5 ${buttonRadiusClass}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-bold text-[#1E3A8A]">
                                تحرير حقول: {draft.title}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextIds = pickedEvalIds.includes(f.id)
                                    ? pickedEvalIds
                                    : [...pickedEvalIds, f.id];
                                  setPickedEvalIds(nextIds);
                                  const chosen = EVALUATION_FORM_TEMPLATES.filter((t) =>
                                    nextIds.includes(t.id)
                                  ).map((t) => evalDrafts[t.id]);
                                  onUpdateExtras({
                                    ...extras,
                                    selectedEvaluationForms: chosen,
                                    extrasVisibility: {
                                      ...extras.extrasVisibility,
                                      evaluations: true,
                                    },
                                  });
                                  onNotify(`تم تحديث وإدراج ${draft.title} في التقرير`);
                                }}
                                className={`min-h-[34px] px-3 bg-[#2563EB] text-white font-semibold cursor-pointer ${buttonRadiusClass}`}
                              >
                                إدراج هذه الاستمارة في التقرير
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {draft.fields.map((fld, idx) => (
                                <div key={idx}>
                                  <label className="block text-[11px] mb-0.5 text-[#475569]">
                                    {fld.label}
                                  </label>
                                  <input
                                    type="text"
                                    value={fld.value}
                                    onChange={(e) => {
                                      const updatedFields = draft.fields.map((x, i) =>
                                        i === idx ? { ...x, value: e.target.value } : x
                                      );
                                      setEvalDrafts({
                                        ...evalDrafts,
                                        [f.id]: { ...draft, fields: updatedFields },
                                      });
                                    }}
                                    className={`w-full min-h-[36px] px-2.5 border border-[#CBD5E1] bg-white ${buttonRadiusClass}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                {evalViewTab === 'infographic' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className={`p-3 border border-[#BFDBFE] bg-[#EFF6FF] ${buttonRadiusClass}`}>
                        <div className="text-[11px] text-[#1E3A8A]">الاستمارات المفعلة بالتقرير</div>
                        <div className="text-xl font-bold text-[#1E3A8A] tabular-nums-ar mt-0.5">
                          {extras.selectedEvaluationForms.length} / {EVALUATION_FORM_TEMPLATES.length}
                        </div>
                      </div>
                      <div className={`p-3 border border-[#A7F3D0] bg-[#ECFDF5] ${buttonRadiusClass}`}>
                        <div className="text-[11px] text-[#047857]">الأهداف التربوية المضافة</div>
                        <div className="text-xl font-bold text-[#047857] tabular-nums-ar mt-0.5">
                          {extras.planGoals.length}
                        </div>
                      </div>
                      <div className={`p-3 border border-[#DDD6FE] bg-[#F5F3FF] ${buttonRadiusClass}`}>
                        <div className="text-[11px] text-[#5B21B6]">فنيات تعديل السلوك</div>
                        <div className="text-xl font-bold text-[#5B21B6] tabular-nums-ar mt-0.5">
                          {extras.selectedBehaviorTechniques.length}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[#334155] font-semibold">
                        عرض ملخص التقييم والتوصيات على هيئة إنفوجراف A4 جاهز للطباعة والتصدير
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onChangeView('infographic', layoutMode);
                          onJumpToPreview();
                        }}
                        className={`min-h-[38px] px-4 bg-[#2563EB] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span>فتح معاينة الإنفوجراف</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 8. RECIPIENTS */}
          {activeSection === 'recipients' && (
            <div className="p-4 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-[#1E3A8A]">
                  الجهات المختارة: {extras.selectedRecipients.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateExtras({
                        ...extras,
                        selectedRecipients: RECIPIENT_OPTIONS.map((r) => r.id),
                      })
                    }
                    className={`min-h-[34px] px-2.5 border border-[#CBD5E1] font-semibold cursor-pointer ${buttonRadiusClass}`}
                  >
                    تحديد الكل
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateExtras({ ...extras, selectedRecipients: [] })
                    }
                    className={`min-h-[34px] px-2.5 border border-[#CBD5E1] font-semibold cursor-pointer ${buttonRadiusClass}`}
                  >
                    إلغاء الكل
                  </button>
                </div>
              </div>

              <div className="relative max-w-xs">
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[#94A3B8]" />
                <input
                  type="text"
                  value={recipsSearch}
                  onChange={(e) => setRecipsSearch(e.target.value)}
                  placeholder="فلترة الجهات..."
                  className={`w-full min-h-[36px] pr-8 pl-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredRecipients.map((r) => {
                  const checked = extras.selectedRecipients.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className={`min-h-[42px] px-3 border flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                      style={{
                        backgroundColor: checked ? '#EFF6FF' : '#FFFFFF',
                        borderColor: checked ? '#2563EB' : '#E2E8F0',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? extras.selectedRecipients.filter((x) => x !== r.id)
                            : [...extras.selectedRecipients, r.id];
                          onUpdateExtras({ ...extras, selectedRecipients: next });
                        }}
                        className="accent-[#2563EB]"
                      />
                      <span className="font-semibold">{r.label}</span>
                    </label>
                  );
                })}
              </div>

              {extras.selectedRecipients.includes('أخرى') && (
                <input
                  type="text"
                  value={customRecipientText}
                  onChange={(e) => setCustomRecipientText(e.target.value)}
                  placeholder="اكتب اسم الجهة الأخرى..."
                  className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                />
              )}

              {extras.selectedRecipients.length > 0 && (
                <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                  <div className="font-bold">معاينة وتبديل النسخ المولدة للجهات المختارة:</div>
                  <div className="flex flex-wrap gap-2">
                    {extras.selectedRecipients.map((recId) => {
                      const found = RECIPIENT_OPTIONS.find((r) => r.id === recId);
                      const salutation =
                        recId === 'أخرى' && customRecipientText.trim()
                          ? `السادة / ${customRecipientText.trim()} الموقرين`
                          : found?.salutation || 'إلى من يهمه الأمر / [ ... ]';
                      const isActive = extras.activeRecipientCopy === recId;
                      return (
                        <button
                          key={recId}
                          type="button"
                          onClick={() => {
                            onUpdateData({ ...data, schoolAddressee: salutation });
                            onUpdateExtras({ ...extras, activeRecipientCopy: recId });
                            onNotify(`تم تحويل نسخة التقرير الموجهة إلى: ${recId}`);
                          }}
                          className={`min-h-[38px] px-3 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                          style={{
                            backgroundColor: isActive ? '#2563EB' : '#F8FAFC',
                            color: isActive ? '#FFFFFF' : '#0F172A',
                            borderColor: isActive ? '#2563EB' : '#CBD5E1',
                          }}
                        >
                          نسخة: {recId}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 9. SETTINGS (5 Tabs: المركز | الثيمات | زر الإضافات | التوقيع والختم | إعدادات التنسيق الآلي) */}
          {activeSection === 'settings' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(
                    [
                      ['center', 'المركز'],
                      ['themes', 'الثيمات'],
                      ['addons', 'زر الإضافات'],
                      ['signature', 'التوقيع والختم'],
                      ['format', 'إعدادات التنسيق الآلي'],
                    ] as const
                  ).map(([id, lbl]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setSettingsTab(id);
                        selectTab(id);
                      }}
                      className={tabBtnClass(settingsTab === id)}
                      style={{
                        backgroundColor: settingsTab === id ? '#2563EB' : 'transparent',
                        color: settingsTab === id ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 text-xs space-y-4">
                {settingsTab === 'center' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1">اسم المركز</label>
                        <input
                          type="text"
                          value={data.centerName}
                          onChange={(e) => onUpdateData({ ...data, centerName: e.target.value })}
                          className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">المدينة</label>
                        <input
                          type="text"
                          value={data.centerCity}
                          onChange={(e) => onUpdateData({ ...data, centerCity: e.target.value })}
                          className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">هاتف التقرير</label>
                        <input
                          type="text"
                          dir="ltr"
                          value={data.phone}
                          onChange={(e) => onUpdateData({ ...data, phone: e.target.value })}
                          className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] text-right ${buttonRadiusClass}`}
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">رقم المرجع</label>
                        <input
                          type="text"
                          value={data.referenceNumber}
                          onChange={(e) =>
                            onUpdateData({ ...data, referenceNumber: e.target.value })
                          }
                          className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                        />
                      </div>
                    </div>

                    {/* Editable Bottom Contact Bar Settings */}
                    <div className="pt-3 border-t border-[#E2E8F0] space-y-2.5">
                      <div className="flex items-center gap-1.5 font-bold text-[#1E3A8A]">
                        <Phone className="w-4 h-4" />
                        <span>بيانات شريط التواصل السفلي الثابت بالبرنامج:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block font-semibold mb-1">الهاتف</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={contactSettings.phone}
                            onChange={(e) =>
                              onUpdateContactSettings({
                                ...contactSettings,
                                phone: e.target.value,
                              })
                            }
                            className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] text-right ${buttonRadiusClass}`}
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">الموقع الإلكتروني</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={contactSettings.website}
                            onChange={(e) =>
                              onUpdateContactSettings({
                                ...contactSettings,
                                website: e.target.value,
                              })
                            }
                            placeholder="https://... أو [ ... ]"
                            className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] text-right ${buttonRadiusClass}`}
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">رقم الواتساب</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={contactSettings.whatsapp}
                            onChange={(e) =>
                              onUpdateContactSettings({
                                ...contactSettings,
                                whatsapp: e.target.value,
                              })
                            }
                            className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] text-right ${buttonRadiusClass}`}
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">يوتيوب</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={contactSettings.youtube || ''}
                            onChange={(e) =>
                              onUpdateContactSettings({
                                ...contactSettings,
                                youtube: e.target.value,
                              })
                            }
                            placeholder="https://youtube.com/... أو [ ... ]"
                            className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] text-right ${buttonRadiusClass}`}
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">فيسبوك</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={contactSettings.facebook || ''}
                            onChange={(e) =>
                              onUpdateContactSettings({
                                ...contactSettings,
                                facebook: e.target.value,
                              })
                            }
                            placeholder="https://facebook.com/... أو [ ... ]"
                            className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] text-right ${buttonRadiusClass}`}
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">انستجرام</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={contactSettings.instagram || ''}
                            onChange={(e) =>
                              onUpdateContactSettings({
                                ...contactSettings,
                                instagram: e.target.value,
                              })
                            }
                            placeholder="@username أو https://..."
                            className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] text-right ${buttonRadiusClass}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'themes' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-[#1E3A8A]">
                          ثيم العرض على الشاشة (6 ثيمات فاتحة بيضاء)
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenModal('choose-theme')}
                          className={`px-3 py-1.5 border border-[#CBD5E1] font-semibold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                        >
                          <Palette className="w-3.5 h-3.5" />
                          <span>نافذة المعاينة</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(Object.keys(LIGHT_THEMES) as LightThemeId[]).map((tid) => {
                          const t = LIGHT_THEMES[tid];
                          const active = themeSettings.screenTheme === tid;
                          return (
                            <button
                              key={tid}
                              type="button"
                              onClick={() =>
                                onUpdateThemeSettings(
                                  { ...themeSettings, screenTheme: tid },
                                  false
                                )
                              }
                              className={`p-2.5 border text-right cursor-pointer ${buttonRadiusClass}`}
                              style={{
                                backgroundColor: t.pageBg,
                                borderColor: active ? t.accentColor : t.borderColor,
                                boxShadow: active ? `0 0 0 2px ${t.accentColor}30` : 'none',
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold" style={{ color: t.headingColor }}>
                                  {t.name}
                                </span>
                                {active && (
                                  <Check className="w-3.5 h-3.5" style={{ color: t.accentColor }} />
                                )}
                              </div>
                              <div className="text-[10.5px] mt-0.5" style={{ color: t.textMuted }}>
                                {t.description}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#E2E8F0]">
                      <div>
                        <label className="block font-bold mb-1">ثيم الطباعة / PDF</label>
                        <select
                          value={themeSettings.printTheme}
                          onChange={(e) =>
                            onUpdateThemeSettings(
                              { ...themeSettings, printTheme: e.target.value as LightThemeId },
                              false
                            )
                          }
                          className={`w-full min-h-[38px] px-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                        >
                          {(Object.keys(LIGHT_THEMES) as LightThemeId[]).map((tid) => (
                            <option key={tid} value={tid}>
                              {LIGHT_THEMES[tid].name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">حجم الخط</label>
                        <div className="grid grid-cols-3 gap-1">
                          {(
                            [
                              ['small', 'صغير'],
                              ['medium', 'متوسط'],
                              ['large', 'كبير'],
                            ] as [FontSizeOption, string][]
                          ).map(([sz, lbl]) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() =>
                                onUpdateThemeSettings(
                                  { ...themeSettings, fontSize: sz },
                                  false
                                )
                              }
                              className={`min-h-[38px] border font-semibold cursor-pointer ${buttonRadiusClass}`}
                              style={{
                                backgroundColor:
                                  themeSettings.fontSize === sz ? '#EFF6FF' : '#FFFFFF',
                                borderColor:
                                  themeSettings.fontSize === sz ? '#2563EB' : '#CBD5E1',
                              }}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">شكل الأزرار</label>
                        <div className="grid grid-cols-2 gap-1">
                          {(
                            [
                              ['square', 'مربع'],
                              ['rounded', 'مستدير'],
                            ] as [ButtonShapeOption, string][]
                          ).map(([sh, lbl]) => (
                            <button
                              key={sh}
                              type="button"
                              onClick={() =>
                                onUpdateThemeSettings(
                                  { ...themeSettings, buttonShape: sh },
                                  false
                                )
                              }
                              className={`min-h-[38px] border font-semibold cursor-pointer ${buttonRadiusClass}`}
                              style={{
                                backgroundColor:
                                  themeSettings.buttonShape === sh ? '#EFF6FF' : '#FFFFFF',
                                borderColor:
                                  themeSettings.buttonShape === sh ? '#2563EB' : '#CBD5E1',
                              }}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">كثافة التصميم</label>
                        <div className="grid grid-cols-2 gap-1">
                          {(
                            [
                              ['compact', 'مدمج'],
                              ['comfortable', 'مريح'],
                            ] as [DensityOption, string][]
                          ).map(([dn, lbl]) => (
                            <button
                              key={dn}
                              type="button"
                              onClick={() =>
                                onUpdateThemeSettings(
                                  { ...themeSettings, density: dn },
                                  false
                                )
                              }
                              className={`min-h-[38px] border font-semibold cursor-pointer ${buttonRadiusClass}`}
                              style={{
                                backgroundColor:
                                  themeSettings.density === dn ? '#EFF6FF' : '#FFFFFF',
                                borderColor:
                                  themeSettings.density === dn ? '#2563EB' : '#CBD5E1',
                              }}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateThemeSettings(themeSettings, true);
                          onNotify('تم حفظ إعدادات الثيم في المتصفح');
                        }}
                        className={`min-h-[38px] px-4 bg-[#2563EB] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ الثيم</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateThemeSettings(DEFAULT_THEME_SETTINGS, true);
                          onNotify('تمت استعادة الثيم الافتراضي');
                        }}
                        className={`min-h-[38px] px-3.5 border border-[#CBD5E1] font-semibold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>استعادة الثيم الافتراضي</span>
                      </button>
                    </div>

                    {/* Multi-select Report Sections Visibility */}
                    <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold">
                          إظهار / إخفاء أقسام التقرير (اختيار متعدد):
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={sectionSearch}
                            onChange={(e) => setSectionSearch(e.target.value)}
                            placeholder="فلترة الأقسام..."
                            className={`min-h-[32px] px-2 border border-[#CBD5E1] text-[11px] ${buttonRadiusClass}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateVisibility({
                                personal: true,
                                background: true,
                                environment: true,
                                homeSchool: true,
                                recommendations: true,
                                opinion: true,
                              });
                              onUpdateExtras({
                                ...extras,
                                extrasVisibility: {
                                  summary: true,
                                  plan: true,
                                  charts: true,
                                  tables: true,
                                  evaluations: true,
                                  behaviorTechniques: true,
                                },
                              });
                            }}
                            className="underline cursor-pointer"
                          >
                            تحديد الكل
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateVisibility({
                                personal: false,
                                background: false,
                                environment: false,
                                homeSchool: false,
                                recommendations: false,
                                opinion: false,
                              });
                              onUpdateExtras({
                                ...extras,
                                extrasVisibility: {
                                  summary: false,
                                  plan: false,
                                  charts: false,
                                  tables: false,
                                  evaluations: false,
                                  behaviorTechniques: false,
                                },
                              });
                            }}
                            className="underline cursor-pointer"
                          >
                            إلغاء الكل
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {sectionToggleList
                          .filter((s) => s.label.includes(sectionSearch.trim()))
                          .map((s) => (
                            <label
                              key={s.key}
                              className={`min-h-[36px] px-2.5 border flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                              style={{
                                backgroundColor: visibility[s.key] ? '#EFF6FF' : '#FFFFFF',
                                borderColor: visibility[s.key] ? '#2563EB' : '#E2E8F0',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={visibility[s.key]}
                                onChange={() =>
                                  onUpdateVisibility({
                                    ...visibility,
                                    [s.key]: !visibility[s.key],
                                  })
                                }
                                className="accent-[#2563EB]"
                              />
                              <span>{s.label}</span>
                            </label>
                          ))}
                        {extraSectionToggleList
                          .filter((s) => s.label.includes(sectionSearch.trim()))
                          .map((s) => (
                            <label
                              key={s.key}
                              className={`min-h-[36px] px-2.5 border flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                              style={{
                                backgroundColor: extras.extrasVisibility[s.key]
                                  ? '#EFF6FF'
                                  : '#FFFFFF',
                                borderColor: extras.extrasVisibility[s.key]
                                  ? '#2563EB'
                                  : '#E2E8F0',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={extras.extrasVisibility[s.key]}
                                onChange={() =>
                                  onUpdateExtras({
                                    ...extras,
                                    extrasVisibility: {
                                      ...extras.extrasVisibility,
                                      [s.key]: !extras.extrasVisibility[s.key],
                                    },
                                  })
                                }
                                className="accent-[#2563EB]"
                              />
                              <span>{s.label}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'addons' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]">
                      <div>
                        <div className="font-bold text-[#1E3A8A]">
                          زر [ + إضافات ] الثابت أسفل القائمة الجانبية
                        </div>
                        <div className="text-[11px] text-[#475569]">
                          يمكنك تفعيل أو إخفاء الزر وتخصيص العناصر الظاهرة بداخله حسب حاجتك.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateAddonsSettings({
                            ...addonsSettings,
                            enabled: !addonsSettings.enabled,
                          });
                          onNotify(
                            !addonsSettings.enabled
                              ? 'تم تفعيل زر + إضافات'
                              : 'تم إخفاء زر + إضافات'
                          );
                        }}
                        className={`min-h-[36px] px-4 font-bold text-white cursor-pointer ${buttonRadiusClass}`}
                        style={{
                          backgroundColor: addonsSettings.enabled ? '#059669' : '#64748B',
                        }}
                      >
                        {addonsSettings.enabled ? 'مفعّل (تشغيل)' : 'متوقف (إيقاف)'}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#0F172A]">
                        العناصر الظاهرة داخل نافذة + إضافات (
                        {addonsSettings.visibleIds.length} / {ADDON_CATALOG.length})
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateAddonsSettings({
                              ...addonsSettings,
                              visibleIds: DEFAULT_ADDONS_SETTINGS.visibleIds,
                            })
                          }
                          className={`min-h-[32px] px-2.5 border border-[#CBD5E1] font-semibold cursor-pointer ${buttonRadiusClass}`}
                        >
                          تحديد الكل
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateAddonsSettings({
                              ...addonsSettings,
                              visibleIds: [],
                            })
                          }
                          className={`min-h-[32px] px-2.5 border border-[#CBD5E1] font-semibold cursor-pointer ${buttonRadiusClass}`}
                        >
                          إلغاء الكل
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {ADDON_CATEGORIES.map((cat) => (
                        <div
                          key={cat.id}
                          className={`p-3 border border-[#E2E8F0] bg-[#F8FAFC] space-y-2 ${buttonRadiusClass}`}
                        >
                          <div className="font-bold text-[#1E3A8A]">تبويب: {cat.label}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {ADDON_CATALOG.filter((a) => a.category === cat.id).map((item) => {
                              const checked = addonsSettings.visibleIds.includes(item.id);
                              return (
                                <label
                                  key={item.id}
                                  className={`min-h-[36px] px-2.5 border flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                                  style={{
                                    backgroundColor: checked ? '#EFF6FF' : '#FFFFFF',
                                    borderColor: checked ? '#2563EB' : '#E2E8F0',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const nextIds = checked
                                        ? addonsSettings.visibleIds.filter((x) => x !== item.id)
                                        : [...addonsSettings.visibleIds, item.id];
                                      onUpdateAddonsSettings({
                                        ...addonsSettings,
                                        visibleIds: nextIds,
                                      });
                                    }}
                                    className="accent-[#2563EB]"
                                  />
                                  <span className="font-semibold">{item.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {settingsTab === 'signature' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1">إعداد / التوقيع</label>
                        <input
                          type="text"
                          value={data.preparedBy}
                          onChange={(e) => onUpdateData({ ...data, preparedBy: e.target.value })}
                          className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">الصفة المهنية</label>
                        <input
                          type="text"
                          value={data.professionalTitle}
                          onChange={(e) =>
                            onUpdateData({ ...data, professionalTitle: e.target.value })
                          }
                          className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleStamp}
                      className={`min-h-[40px] px-4 border font-semibold inline-flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                      style={{
                        borderColor: showStamp ? '#2563EB' : '#CBD5E1',
                        backgroundColor: showStamp ? '#EFF6FF' : '#FFFFFF',
                        color: showStamp ? '#1E3A8A' : '#334155',
                      }}
                    >
                      <Stamp className="w-4 h-4" />
                      <span>
                        {showStamp
                          ? 'الختم والتوقيع الرقمي مفعّل (اضغط للإخفاء)'
                          : 'إظهار الختم والتوقيع الرقمي'}
                      </span>
                    </button>
                  </div>
                )}

                {settingsTab === 'format' && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] text-[#4C1D95] text-xs">
                      تحكم في قواعد التنسيق الآلي الذكي التي تُطبق عند الضغط على زر [ ✨ تنسيق آلي ذكي ] أو تلقائياً قبل التصدير والطباعة.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(
                        [
                          ['spellCheck', 'تصحيح إملائي تلقائي (الهمزات، التاء المربوطة، الحروف الإنجليزية)'],
                          ['unifyFonts', 'توحيد الخطوط والأحجام (Cairo / Arial + عنوان 16، فرعي 14، نص 12)'],
                          ['unifyDates', 'توحيد التواريخ والأرقام اللاتينية دون تغيير الأرقام الطبية'],
                          ['fixTables', 'إصلاح الجداول والقوائم وإزالة الجداول الداخلية في الـ CV'],
                          ['atsCvCheck', 'فحص ATS للـ CV وعرض النتيجة قبل وبعد + ضغط الصفحات'],
                          ['backupBeforeFormat', 'حفظ نسخة احتياطية تلقائية في سجل التعديلات قبل التنسيق'],
                          ['formatOnExport', 'تنسيق آلي تلقائي عند التصدير (Word / PDF / طباعة)'],
                        ] as [keyof AutoFormatSettings, string][]
                      ).map(([key, label]) => (
                        <label
                          key={key}
                          className={`min-h-[44px] p-3 border flex items-center gap-2.5 cursor-pointer ${buttonRadiusClass}`}
                          style={{
                            backgroundColor: formatDraft[key] ? '#EFF6FF' : '#FFFFFF',
                            borderColor: formatDraft[key] ? '#2563EB' : '#E2E8F0',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(formatDraft[key])}
                            onChange={(e) =>
                              setFormatDraft((prev) => ({
                                ...prev,
                                [key]: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 accent-[#2563EB] shrink-0"
                          />
                          <span className="font-semibold text-[#0F172A]">{label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateAutoFormatSettings?.(formatDraft, true);
                          onNotify('تم حفظ إعدادات التنسيق الآلي بنجاح ✓');
                        }}
                        className={`min-h-[40px] px-5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold inline-flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                      >
                        <Save className="w-4 h-4" />
                        <span>حفظ إعدادات التنسيق</span>
                      </button>
                      {onOpenAutoFormat && (
                        <button
                          type="button"
                          onClick={() => onOpenAutoFormat('report')}
                          className={`min-h-[40px] px-4 border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                        >
                          <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                          <span>تشغيل التنسيق الآن</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
