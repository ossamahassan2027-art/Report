import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  Archive,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Globe,
  Languages,
  Layers,
  Loader2,
  Lock,
  Menu,
  MessageCircle,
  MessageSquarePlus,
  MousePointerClick,
  Palette,
  Phone,
  Plus,
  Printer,
  Redo2,
  RotateCcw,
  Share2,
  Sparkles,
  Stamp,
  Undo2,
  UserCheck,
  Video,
} from 'lucide-react';
import { AddonsModal } from './components/AddonsModal';
import { CaseOperationsCards } from './components/CaseOperationsCards';
import { CaseProfileCard } from './components/CaseProfileCard';
import { CertificatesStatementsStudio } from './components/CertificatesStatementsStudio';
import { ClickToEditModal } from './components/ClickToEditModal';
import { CvAtsStudio, CvMenuActionId, normalizeCvStudioTab } from './components/CvAtsStudio';
import { EditorPanel, EditorTab } from './components/EditorPanel';
import { InfographicDocument } from './components/InfographicDocument';
import { ParentReportWizardModal } from './components/ParentReportWizardModal';
import { ReportDocument } from './components/ReportDocument';
import { RightSidebar } from './components/RightSidebar';
import { SmartAutoFormatModal } from './components/SmartAutoFormatModal';
import { SmartExportModal } from './components/SmartExportModal';
import { SmartLibraryStudio } from './components/SmartLibraryStudio';
import { ActiveModalType, StudioModals } from './components/StudioModals';
import { StudioUtilityModals, UtilityModalType } from './components/StudioUtilityModals';
import {
  UnifiedSmartAddModal,
  UnifiedSmartAddSavePayload,
} from './components/UnifiedSmartAddModal';
import { WorkspaceSectionPanel } from './components/WorkspaceSectionPanel';
import {
  LibraryCard,
  ParentReport15Document,
} from './types/library';
import {
  CvData,
  CvLanguage,
  CvTemplateId,
  DEFAULT_AR_CV_DATA,
  DEFAULT_EN_CV_DATA,
  SavedCvRecord,
} from './types/cv';
import {
  BlockStyleOverride,
  DEFAULT_SECTION_ORDER,
  EditTargetDescriptor,
  ReportHistorySnapshot,
  ReportSectionKey,
} from './types/clickEdit';
import {
  AccentTheme,
  createFullSelections,
  DEFAULT_ENGLISH_REPORT_DATA,
  DEFAULT_REPORT_DATA,
  DEFAULT_SECTION_VISIBILITY,
  getFilteredReportData,
  ItemSelections,
  LayoutMode,
  PaperTone,
  REPORT_TEMPLATES,
  ReportData,
  ReportLanguage,
  ReportTemplate,
  SectionVisibility,
  ViewFormat,
} from './types/report';
import {
  AddonsSettings,
  AssignedSessionItem,
  AutoFormatSettings,
  CaseProfileMeta,
  ChangeLogEntry,
  ContactSettings,
  createBlankReportData,
  CustomCardItem,
  CustomChartItem,
  CustomTableItem,
  DEFAULT_AUTO_FORMAT_SETTINGS,
  DEFAULT_CASE_PROFILE_META,
  DEFAULT_REPORT_EXTRAS,
  EvaluationFormEntry,
  LIGHT_THEMES,
  LightThemeId,
  RECIPIENT_OPTIONS,
  ReportExtras,
  SavedReportRecord,
  SessionLogItem,
  SidebarSectionId,
  SmartAddDraftItem,
  SmartAddKind,
  StudioNavigationPrefs,
  ThemeSettings,
  WeeklyTaskItem,
} from './types/studio';
import { exportReportToExcel, exportReportToWord } from './utils/exporters';
import {
  analyzeAndBuildSmartFormat,
  SmartFormatAnalysisResult,
  SmartFormatBundlePayload,
  SmartFormatScope,
} from './utils/smartAutoFormatter';
import {
  AssistantAnalysisResult,
  copyCardByIdHelper,
  createAutomaticBackupSnapshot,
  ensureInitialPreUpgradeBackup,
  LibraryAutoBackupSnapshot,
  loadAutoBackupsList,
  loadCustomLibraryCards,
  loadMergedLibraryCards,
  loadPinnedIds,
  loadSavedParentReports,
  persistSavedParentReports,
  registerWindowLibraryBridge,
  restoreBackupSnapshotById,
  saveCustomLibraryCards,
  savePinnedIds,
} from './utils/libraryEngine';
import { convertParentReport15ToReportData } from './utils/trustedEvidenceSources';
import {
  AccountSecurityConfig,
  copyTextToClipboard,
  exportReportToHtml,
  exportReportToJson,
  loadAccountSecurity,
  loadAddonsSettings,
  loadAutoFormatSettings,
  loadChangeLog,
  loadContactSettings,
  loadSavedCvs,
  loadSavedReports,
  loadSmartAddDrafts,
  loadStudioPrefs,
  loadThemeSettings,
  persistChangeLog,
  persistSavedCvs,
  persistSavedReports,
  persistSmartAddDrafts,
  ReportBackupPayload,
  saveAccountSecurity,
  saveAddonsSettings,
  saveAutoFormatSettings,
  saveContactSettings,
  saveStudioPrefs,
  saveThemeSettings,
} from './utils/storageAndBackup';

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

type MobilePane = 'preview' | 'editor' | 'sections';

const SIDEBAR_ORDER: SidebarSectionId[] = [
  'dashboard',
  'summary',
  'plan',
  'charts',
  'templates',
  'recommendations',
  'evaluations',
  'recipients',
  'settings',
];

export default function App() {
  const [arData, setArData] = useState<ReportData>(DEFAULT_REPORT_DATA);
  const [enData, setEnData] = useState<ReportData | null>(DEFAULT_ENGLISH_REPORT_DATA);
  const [language, setLanguage] = useState<ReportLanguage>('ar');
  const [visibility, setVisibility] = useState<SectionVisibility>(DEFAULT_SECTION_VISIBILITY);
  const [selections, setSelections] = useState<ItemSelections>(() =>
    createFullSelections(DEFAULT_REPORT_DATA)
  );
  const [extras, setExtras] = useState<ReportExtras>(DEFAULT_REPORT_EXTRAS);

  const [savedReports, setSavedReports] = useState<SavedReportRecord[]>(() =>
    loadSavedReports()
  );
  const [activeRecordId, setActiveRecordId] = useState<string>('default-adnan-report');
  const [pendingDeleteRecord, setPendingDeleteRecord] =
    useState<SavedReportRecord | null>(null);
  const [savedCvs, setSavedCvs] = useState<SavedCvRecord[]>(() => loadSavedCvs());
  const [pendingCvMenuAction, setPendingCvMenuAction] = useState<{
    action: CvMenuActionId;
    seq: number;
  } | null>(null);

  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() =>
    loadThemeSettings()
  );
  const [contactSettings, setContactSettings] = useState<ContactSettings>(() =>
    loadContactSettings()
  );
  const [addonsSettings, setAddonsSettings] = useState<AddonsSettings>(() =>
    loadAddonsSettings()
  );
  const [studioPrefs, setStudioPrefs] = useState<StudioNavigationPrefs>(() =>
    loadStudioPrefs()
  );

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [activeSidebarSection, setActiveSidebarSection] =
    useState<SidebarSectionId>(() => loadStudioPrefs().activeSection);
  const [sectionHistory, setSectionHistory] = useState<SidebarSectionId[]>([]);
  const [showSectionWorkspace, setShowSectionWorkspace] = useState<boolean>(true);
  const [initialEvalCategory, setInitialEvalCategory] = useState<
    EvaluationFormEntry['category'] | undefined
  >(undefined);

  const [viewFormat, setViewFormat] = useState<ViewFormat>('a4');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('single');
  const [paperTone] = useState<PaperTone>('white');
  const [accentTheme] = useState<AccentTheme>('lapis');
  const [showStamp, setShowStamp] = useState<boolean>(true);
  const [showEditor, setShowEditor] = useState<boolean>(true);
  const [editorTab, setEditorTab] = useState<EditorTab>('school');
  const [mobilePane, setMobilePane] = useState<MobilePane>('preview');
  const [previewCollapsed, setPreviewCollapsed] = useState<boolean>(false);

  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [addonsModalOpen, setAddonsModalOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [initialVisualKind, setInitialVisualKind] = useState<
    'chart' | 'table' | 'before-after'
  >('chart');

  const [aiBusy, setAiBusy] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');
  const [exportState, setExportState] = useState<'idle' | 'exporting' | 'done' | 'error'>('idle');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [stageScale, setStageScale] = useState<number>(1);
  const [zoomPreference, setZoomPreference] = useState<'fit' | 0.75 | 1>('fit');

  // Click-to-Edit & Undo/Redo state
  const [clickEditEnabled, setClickEditEnabled] = useState<boolean>(true);
  const [activeEditTarget, setActiveEditTarget] = useState<EditTargetDescriptor | null>(null);
  const [undoStack, setUndoStack] = useState<ReportHistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<ReportHistorySnapshot[]>([]);

  // Case Profile, Follow-up, Change Log & Security Lock state
  const [showCaseProfileCard, setShowCaseProfileCard] = useState<boolean>(true);
  const [followUpFocusSeq, setFollowUpFocusSeq] = useState<number>(0);
  const [utilityModal, setUtilityModal] = useState<UtilityModalType>(null);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>(() => loadChangeLog());
  const [accountSecurity, setAccountSecurity] = useState<AccountSecurityConfig>(() =>
    loadAccountSecurity()
  );
  const [unlockInput, setUnlockInput] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');

  // Feature A: Smart Auto-Formatting State
  const [autoFormatSettings, setAutoFormatSettings] = useState<AutoFormatSettings>(() =>
    loadAutoFormatSettings()
  );
  const [autoFormatModalState, setAutoFormatModalState] = useState<{
    open: boolean;
    scope: SmartFormatScope;
    analysis: SmartFormatAnalysisResult | null;
  }>({ open: false, scope: 'report', analysis: null });
  const [lastFormatUndoSnapshot, setLastFormatUndoSnapshot] = useState<{
    scope: SmartFormatScope;
    payload: SmartFormatBundlePayload;
    cvLang?: CvLanguage;
  } | null>(null);
  const cvSnapshotRef = useRef<{
    cv: CvData;
    language: CvLanguage;
    templateId: CvTemplateId;
  }>({
    cv: DEFAULT_AR_CV_DATA,
    language: 'ar',
    templateId: 'ats-classic',
  });
  const [externalCvOverride, setExternalCvOverride] = useState<{
    ar?: CvData;
    en?: CvData;
    lang?: CvLanguage;
    seq: number;
  } | null>(null);

  // Feature B: Unified Smart Add Modal & Drafts State
  const [smartAddModalState, setSmartAddModalState] = useState<{
    open: boolean;
    kind: SmartAddKind;
    draft: SmartAddDraftItem | null;
  }>({ open: false, kind: 'report', draft: null });
  const [smartAddDrafts, setSmartAddDrafts] = useState<SmartAddDraftItem[]>(() =>
    loadSmartAddDrafts()
  );

  // Feature C: Smart Library (81 Cards), Backups & Parent 15-Section Report State
  const [libraryCards, setLibraryCards] = useState<LibraryCard[]>(() => {
    ensureInitialPreUpgradeBackup();
    return loadMergedLibraryCards();
  });
  const [activeLibraryCardId, setActiveLibraryCardId] = useState<string | null>(null);
  const [libraryBackups, setLibraryBackups] = useState<LibraryAutoBackupSnapshot[]>(() =>
    loadAutoBackupsList()
  );
  const [parentReportWizardOpen, setParentReportWizardOpen] = useState<boolean>(false);
  const [parentReportInitialComplaint, setParentReportInitialComplaint] = useState<string>('');

  const [toastJumpAction, setToastJumpAction] = useState<{
    label: string;
    onClick: () => void;
  } | null>(null);

  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const caseProfileAnchorRef = useRef<HTMLDivElement | null>(null);
  const previewAnchorRef = useRef<HTMLDivElement | null>(null);
  const page1Ref = useRef<HTMLDivElement | null>(null);
  const page2Ref = useRef<HTMLDivElement | null>(null);
  const infographicRef = useRef<HTMLDivElement | null>(null);

  const hiddenPage1Ref = useRef<HTMLDivElement | null>(null);
  const hiddenPage2Ref = useRef<HTMLDivElement | null>(null);
  const hiddenInfographicRef = useRef<HTMLDivElement | null>(null);

  const activeLightTheme = LIGHT_THEMES[themeSettings.screenTheme];
  const buttonRadiusClass =
    themeSettings.buttonShape === 'square' ? 'rounded-none' : 'rounded-lg';

  const activeData = language === 'en' && enData ? enData : arData;

  const filteredData = useMemo(
    () => getFilteredReportData(activeData, selections),
    [activeData, selections]
  );

  const showToast = (
    msg: string,
    jump?: { label: string; onClick: () => void } | null
  ) => {
    setToastMessage(msg);
    setToastJumpAction(jump ?? null);
    setTimeout(() => {
      setToastMessage((curr) => {
        if (curr === msg) {
          setToastJumpAction(null);
          return '';
        }
        return curr;
      });
    }, 4500);
  };

  const appendChangeLog = (action: string, details: string) => {
    const entry: ChangeLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      action,
      details,
    };
    setChangeLog((prev) => {
      const next = [entry, ...prev].slice(0, 120);
      persistChangeLog(next);
      return next;
    });
  };

  const handleUpdateActiveData = (updated: ReportData) => {
    if (language === 'en') {
      setEnData(updated);
    } else {
      setArData(updated);
      setEnData(null);
    }
  };

  const handleUpdateCaseProfile = (nextProfile: CaseProfileMeta, logDesc?: string) => {
    setExtras((prev) => ({
      ...prev,
      caseProfile: nextProfile,
    }));
    if (logDesc) {
      appendChangeLog('ملف الحالة', logDesc);
    }
  };

  const handleChangeAssignedSessions = (next: AssignedSessionItem[], logDesc: string) => {
    pushUndoSnapshot();
    setExtras((prev) => ({
      ...prev,
      assignedSessions: next,
    }));
    appendChangeLog('الجلسات المخصصة', logDesc);
  };

  const handleChangeSessionLogs = (next: SessionLogItem[], logDesc: string) => {
    pushUndoSnapshot();
    setExtras((prev) => ({
      ...prev,
      sessionLogs: next,
    }));
    appendChangeLog('سجل الجلسات', logDesc);
  };

  // Undo / Redo & Click-to-Edit helpers
  const pushUndoSnapshot = () => {
    const snap: ReportHistorySnapshot = {
      arData,
      enData,
      language,
      visibility,
      selections,
      extras,
    };
    setUndoStack((prev) => [...prev.slice(-29), snap]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prevSnap = undoStack[undoStack.length - 1];
    const currentSnap: ReportHistorySnapshot = {
      arData,
      enData,
      language,
      visibility,
      selections,
      extras,
    };
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, currentSnap]);
    setArData(prevSnap.arData);
    setEnData(prevSnap.enData);
    setLanguage(prevSnap.language);
    setVisibility(prevSnap.visibility);
    setSelections(prevSnap.selections);
    setExtras(prevSnap.extras);
    setActiveEditTarget(null);
    appendChangeLog('تراجع', 'تم التراجع عن التعديل الأخير');
    showToast('تم التراجع عن التعديل الأخير');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextSnap = redoStack[redoStack.length - 1];
    const currentSnap: ReportHistorySnapshot = {
      arData,
      enData,
      language,
      visibility,
      selections,
      extras,
    };
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, currentSnap]);
    setArData(nextSnap.arData);
    setEnData(nextSnap.enData);
    setLanguage(nextSnap.language);
    setVisibility(nextSnap.visibility);
    setSelections(nextSnap.selections);
    setExtras(nextSnap.extras);
    setActiveEditTarget(null);
    appendChangeLog('إعادة', 'تمت إعادة التعديل المتراجع عنه');
    showToast('تمت إعادة التعديل');
  };

  const resolveOriginalListIndex = (
    sourceArr: string[],
    selArr: boolean[],
    filteredIdx: number
  ): number => {
    let count = 0;
    for (let i = 0; i < sourceArr.length; i++) {
      if (selArr[i] !== false) {
        if (count === filteredIdx) return i;
        count++;
      }
    }
    return filteredIdx;
  };

  const getFilteredIndicesInOrder = (
    sourceArr: string[],
    selArr: boolean[]
  ): number[] => {
    const out: number[] = [];
    for (let i = 0; i < sourceArr.length; i++) {
      if (selArr[i] !== false) out.push(i);
    }
    return out;
  };

  const handleSaveTextAndStyle: React.ComponentProps<typeof ClickToEditModal>['onSaveTextAndStyle'] = ({
    target,
    textValue,
    styleOverride,
    personalFields,
    chartItem,
    tableItem,
    planGoalItem,
    evalItem,
  }) => {
    pushUndoSnapshot();

    if (target.kind === 'personal-table' && personalFields) {
      handleUpdateActiveData({
        ...activeData,
        childName: personalFields.childName,
        birthDate: personalFields.birthDate,
        age: personalFields.age,
        diagnosis: personalFields.diagnosis,
      });
    } else if (target.kind === 'chart' && chartItem) {
      setExtras((prev) => ({
        ...prev,
        charts: prev.charts.map((c) => (c.id === chartItem.id ? chartItem : c)),
        blockStyles: { ...(prev.blockStyles || {}), [target.blockId]: styleOverride },
      }));
      showToast('تم تحديث الرسم البياني وتنسيقه');
      return;
    } else if (target.kind === 'table' && tableItem) {
      setExtras((prev) => ({
        ...prev,
        tables: prev.tables.map((t) => (t.id === tableItem.id ? tableItem : t)),
        blockStyles: { ...(prev.blockStyles || {}), [target.blockId]: styleOverride },
      }));
      showToast('تم تحديث الجدول وتنسيقه');
      return;
    } else if (target.kind === 'plan-goal' && planGoalItem) {
      setExtras((prev) => ({
        ...prev,
        planGoals: prev.planGoals.map((g) =>
          g.id === planGoalItem.id ? planGoalItem : g
        ),
        blockStyles: { ...(prev.blockStyles || {}), [target.blockId]: styleOverride },
      }));
      showToast('تم تحديث هدف الخطة وتنسيقه');
      return;
    } else if (target.kind === 'evaluation' && evalItem) {
      setExtras((prev) => ({
        ...prev,
        selectedEvaluationForms: prev.selectedEvaluationForms.map((f) =>
          f.id === evalItem.id ? evalItem : f
        ),
        blockStyles: { ...(prev.blockStyles || {}), [target.blockId]: styleOverride },
      }));
      showToast('تم تحديث استمارة التقييم وتنسيقها');
      return;
    } else if (target.kind === 'summary') {
      setExtras((prev) => ({
        ...prev,
        summaryText: textValue,
        blockStyles: { ...(prev.blockStyles || {}), [target.blockId]: styleOverride },
      }));
      showToast('تم تحديث الملخص الذكي');
      return;
    } else if (target.kind === 'behavior') {
      const parsedLines = textValue
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      setExtras((prev) => ({
        ...prev,
        selectedBehaviorTechniques: parsedLines,
        blockStyles: { ...(prev.blockStyles || {}), [target.blockId]: styleOverride },
      }));
      showToast('تم تحديث أساليب تعديل السلوك');
      return;
    } else if (
      target.kind === 'list-item' &&
      target.listKind &&
      target.listIndex !== undefined
    ) {
      if (target.listKind === 'envNegativePoints') {
        const origIdx = resolveOriginalListIndex(
          activeData.envNegativePoints,
          selections.envNegative,
          target.listIndex
        );
        const nextArr = activeData.envNegativePoints.map((v, i) =>
          i === origIdx ? textValue : v
        );
        handleUpdateActiveData({ ...activeData, envNegativePoints: nextArr });
      } else if (target.listKind === 'homeSchoolBenefits') {
        const origIdx = resolveOriginalListIndex(
          activeData.homeSchoolBenefits,
          selections.homeSchoolBenefits,
          target.listIndex
        );
        const nextArr = activeData.homeSchoolBenefits.map((v, i) =>
          i === origIdx ? textValue : v
        );
        handleUpdateActiveData({ ...activeData, homeSchoolBenefits: nextArr });
      } else if (target.listKind === 'recommendations') {
        const origIdx = resolveOriginalListIndex(
          activeData.recommendations,
          selections.recommendations,
          target.listIndex
        );
        const nextArr = activeData.recommendations.map((v, i) =>
          i === origIdx ? textValue : v
        );
        handleUpdateActiveData({ ...activeData, recommendations: nextArr });
      }
    } else if (target.dataField) {
      handleUpdateActiveData({
        ...activeData,
        [target.dataField]: textValue,
      });
    }

    setExtras((prev) => ({
      ...prev,
      blockStyles: {
        ...(prev.blockStyles || {}),
        [target.blockId]: styleOverride,
      },
    }));
    appendChangeLog('تعديل التقرير', `تعديل: ${target.label}`);
    showToast(`تم حفظ تعديل: ${target.label}`);
  };

  const handleApplyStyleOnly = (blockId: string, styleOverride: BlockStyleOverride) => {
    pushUndoSnapshot();
    setExtras((prev) => {
      const nextStyles = { ...(prev.blockStyles || {}) };
      if (Object.keys(styleOverride).length === 0) {
        delete nextStyles[blockId];
      } else {
        nextStyles[blockId] = styleOverride;
      }
      return { ...prev, blockStyles: nextStyles };
    });
    showToast('تم تطبيق التصميم على الجزء المحدد فقط');
  };

  const handleHideBlock = (blockId: string) => {
    pushUndoSnapshot();
    setExtras((prev) => ({
      ...prev,
      blockStyles: {
        ...(prev.blockStyles || {}),
        [blockId]: {
          ...((prev.blockStyles || {})[blockId] || {}),
          hidden: true,
        },
      },
    }));
    showToast('تم إخفاء الجزء المحدد (يمكنك استعادته أو التراجع)');
  };

  const handleRestoreHiddenBlocks = () => {
    pushUndoSnapshot();
    setExtras((prev) => {
      const nextStyles: Record<string, BlockStyleOverride> = {};
      Object.entries(prev.blockStyles || {}).forEach(([k, v]) => {
        const rest = { ...v };
        delete rest.hidden;
        if (Object.keys(rest).length > 0) {
          nextStyles[k] = rest;
        }
      });
      return { ...prev, blockStyles: nextStyles };
    });
    showToast('تمت استعادة جميع الأجزاء المخفية');
  };

  const handleDeleteBlock = (target: EditTargetDescriptor) => {
    pushUndoSnapshot();

    if (
      target.kind === 'list-item' &&
      target.listKind &&
      target.listIndex !== undefined
    ) {
      if (target.listKind === 'envNegativePoints') {
        const origIdx = resolveOriginalListIndex(
          activeData.envNegativePoints,
          selections.envNegative,
          target.listIndex
        );
        handleUpdateActiveData({
          ...activeData,
          envNegativePoints: activeData.envNegativePoints.filter((_, i) => i !== origIdx),
        });
        setSelections((prev) => ({
          ...prev,
          envNegative: prev.envNegative.filter((_, i) => i !== origIdx),
        }));
      } else if (target.listKind === 'homeSchoolBenefits') {
        const origIdx = resolveOriginalListIndex(
          activeData.homeSchoolBenefits,
          selections.homeSchoolBenefits,
          target.listIndex
        );
        handleUpdateActiveData({
          ...activeData,
          homeSchoolBenefits: activeData.homeSchoolBenefits.filter((_, i) => i !== origIdx),
        });
        setSelections((prev) => ({
          ...prev,
          homeSchoolBenefits: prev.homeSchoolBenefits.filter((_, i) => i !== origIdx),
        }));
      } else if (target.listKind === 'recommendations') {
        const origIdx = resolveOriginalListIndex(
          activeData.recommendations,
          selections.recommendations,
          target.listIndex
        );
        handleUpdateActiveData({
          ...activeData,
          recommendations: activeData.recommendations.filter((_, i) => i !== origIdx),
        });
        setSelections((prev) => ({
          ...prev,
          recommendations: prev.recommendations.filter((_, i) => i !== origIdx),
        }));
      }
      showToast('تم حذف البند (يمكنك التراجع بزر تراجع)');
      return;
    }

    if (target.listKind === 'planGoals' && target.listIndex !== undefined) {
      setExtras((prev) => ({
        ...prev,
        planGoals: prev.planGoals.filter((_, i) => i !== target.listIndex),
      }));
      showToast('تم حذف هدف الخطة (يمكنك التراجع)');
      return;
    }

    if (target.listKind === 'charts' && target.listIndex !== undefined) {
      setExtras((prev) => ({
        ...prev,
        charts: prev.charts.filter((_, i) => i !== target.listIndex),
      }));
      showToast('تم حذف الرسم البياني (يمكنك التراجع)');
      return;
    }

    if (target.listKind === 'tables' && target.listIndex !== undefined) {
      setExtras((prev) => ({
        ...prev,
        tables: prev.tables.filter((_, i) => i !== target.listIndex),
      }));
      showToast('تم حذف الجدول (يمكنك التراجع)');
      return;
    }

    if (target.listKind === 'evaluations' && target.listIndex !== undefined) {
      setExtras((prev) => ({
        ...prev,
        selectedEvaluationForms: prev.selectedEvaluationForms.filter(
          (_, i) => i !== target.listIndex
        ),
      }));
      showToast('تم حذف الاستمارة (يمكنك التراجع)');
      return;
    }

    if (target.blockId === 'extras-summary') {
      setExtras((prev) => ({
        ...prev,
        extrasVisibility: { ...prev.extrasVisibility, summary: false },
      }));
      showToast('تم حذف الملخص من التقرير (يمكنك التراجع)');
      return;
    }

    if (target.blockId === 'extras-behavior') {
      setExtras((prev) => ({
        ...prev,
        extrasVisibility: { ...prev.extrasVisibility, behavior: false },
      }));
      showToast('تم حذف فقرة تعديل السلوك (يمكنك التراجع)');
      return;
    }

    if (target.sectionKey && target.blockId.startsWith('section-')) {
      setVisibility((prev) => ({
        ...prev,
        [target.sectionKey as ReportSectionKey]: false,
      }));
      showToast(`تم حذف ${target.label} (يمكنك التراجع بزر تراجع)`);
      return;
    }

    // Scalar text/quote/heading block: hide cleanly with full Undo support
    setExtras((prev) => ({
      ...prev,
      blockStyles: {
        ...(prev.blockStyles || {}),
        [target.blockId]: {
          ...((prev.blockStyles || {})[target.blockId] || {}),
          hidden: true,
        },
      },
    }));
    showToast(`تم حذف ${target.label} (يمكنك التراجع بزر تراجع)`);
  };

  const swapPair = <T,>(arr: T[], idxA: number, idxB: number): T[] => {
    const copy = [...arr];
    const tmp = copy[idxA];
    copy[idxA] = copy[idxB];
    copy[idxB] = tmp;
    return copy;
  };

  const getActiveSectionOrderGroup = (secKey: ReportSectionKey): ReportSectionKey[] => {
    const fullOrder = extras.sectionOrder?.length
      ? extras.sectionOrder
      : DEFAULT_SECTION_ORDER;
    if (viewFormat === 'a4' && layoutMode === 'two-page') {
      const page1Keys: ReportSectionKey[] = ['personal', 'background', 'environment', 'homeSchool'];
      const page2Keys: ReportSectionKey[] = ['recommendations', 'opinion'];
      const targetGroup = page1Keys.includes(secKey) ? page1Keys : page2Keys;
      return fullOrder.filter((k) => targetGroup.includes(k) && visibility[k]);
    }
    return fullOrder.filter((k) => visibility[k]);
  };

  const computeReorderCapabilities = (
    target: EditTargetDescriptor | null
  ): { canMoveUp: boolean; canMoveDown: boolean; reorderHint?: string } => {
    if (!target) return { canMoveUp: false, canMoveDown: false };

    if (target.listKind && target.listIndex !== undefined) {
      const total = target.listTotal ?? 0;
      if (total <= 1) {
        return {
          canMoveUp: false,
          canMoveDown: false,
          reorderHint: 'يوجد عنصر واحد فقط في هذه القائمة',
        };
      }
      return {
        canMoveUp: target.listIndex > 0,
        canMoveDown: target.listIndex < total - 1,
      };
    }

    if (target.sectionKey) {
      const group = getActiveSectionOrderGroup(target.sectionKey);
      const pos = group.indexOf(target.sectionKey);
      if (pos === -1 || group.length <= 1) {
        return {
          canMoveUp: false,
          canMoveDown: false,
          reorderHint: 'لا توجد أقسام مجاورة في نفس الصفحة لنقل هذا القسم',
        };
      }
      return {
        canMoveUp: pos > 0,
        canMoveDown: pos < group.length - 1,
      };
    }

    return {
      canMoveUp: false,
      canMoveDown: false,
      reorderHint: 'الترتيب متاح للأقسام الرئيسية والبنود والرسوم والجداول والأهداف',
    };
  };

  const handleMoveBlock = (target: EditTargetDescriptor, direction: 'up' | 'down') => {
    const delta = direction === 'up' ? -1 : 1;

    if (target.listKind && target.listIndex !== undefined) {
      const filteredIdx = target.listIndex;
      const targetFilteredIdx = filteredIdx + delta;

      if (target.listKind === 'envNegativePoints') {
        const visibleIndices = getFilteredIndicesInOrder(
          activeData.envNegativePoints,
          selections.envNegative
        );
        if (targetFilteredIdx < 0 || targetFilteredIdx >= visibleIndices.length) return;
        pushUndoSnapshot();
        const a = visibleIndices[filteredIdx];
        const b = visibleIndices[targetFilteredIdx];
        handleUpdateActiveData({
          ...activeData,
          envNegativePoints: swapPair(activeData.envNegativePoints, a, b),
        });
        setSelections((prev) => ({
          ...prev,
          envNegative: swapPair(prev.envNegative, a, b),
        }));
      } else if (target.listKind === 'homeSchoolBenefits') {
        const visibleIndices = getFilteredIndicesInOrder(
          activeData.homeSchoolBenefits,
          selections.homeSchoolBenefits
        );
        if (targetFilteredIdx < 0 || targetFilteredIdx >= visibleIndices.length) return;
        pushUndoSnapshot();
        const a = visibleIndices[filteredIdx];
        const b = visibleIndices[targetFilteredIdx];
        handleUpdateActiveData({
          ...activeData,
          homeSchoolBenefits: swapPair(activeData.homeSchoolBenefits, a, b),
        });
        setSelections((prev) => ({
          ...prev,
          homeSchoolBenefits: swapPair(prev.homeSchoolBenefits, a, b),
        }));
      } else if (target.listKind === 'recommendations') {
        const visibleIndices = getFilteredIndicesInOrder(
          activeData.recommendations,
          selections.recommendations
        );
        if (targetFilteredIdx < 0 || targetFilteredIdx >= visibleIndices.length) return;
        pushUndoSnapshot();
        const a = visibleIndices[filteredIdx];
        const b = visibleIndices[targetFilteredIdx];
        handleUpdateActiveData({
          ...activeData,
          recommendations: swapPair(activeData.recommendations, a, b),
        });
        setSelections((prev) => ({
          ...prev,
          recommendations: swapPair(prev.recommendations, a, b),
        }));
      } else if (target.listKind === 'planGoals') {
        if (targetFilteredIdx < 0 || targetFilteredIdx >= extras.planGoals.length) return;
        pushUndoSnapshot();
        setExtras((prev) => ({
          ...prev,
          planGoals: swapPair(prev.planGoals, filteredIdx, targetFilteredIdx),
        }));
      } else if (target.listKind === 'charts') {
        if (targetFilteredIdx < 0 || targetFilteredIdx >= extras.charts.length) return;
        pushUndoSnapshot();
        setExtras((prev) => ({
          ...prev,
          charts: swapPair(prev.charts, filteredIdx, targetFilteredIdx),
        }));
      } else if (target.listKind === 'tables') {
        if (targetFilteredIdx < 0 || targetFilteredIdx >= extras.tables.length) return;
        pushUndoSnapshot();
        setExtras((prev) => ({
          ...prev,
          tables: swapPair(prev.tables, filteredIdx, targetFilteredIdx),
        }));
      } else if (target.listKind === 'evaluations') {
        if (
          targetFilteredIdx < 0 ||
          targetFilteredIdx >= extras.selectedEvaluationForms.length
        )
          return;
        pushUndoSnapshot();
        setExtras((prev) => ({
          ...prev,
          selectedEvaluationForms: swapPair(
            prev.selectedEvaluationForms,
            filteredIdx,
            targetFilteredIdx
          ),
        }));
      }
      showToast(direction === 'up' ? 'تم نقل العنصر لأعلى' : 'تم نقل العنصر لأسفل');
      return;
    }

    if (target.sectionKey) {
      const group = getActiveSectionOrderGroup(target.sectionKey);
      const pos = group.indexOf(target.sectionKey);
      const swapPos = pos + delta;
      if (pos === -1 || swapPos < 0 || swapPos >= group.length) return;
      const partnerKey = group[swapPos];
      const baseOrder = [
        ...(extras.sectionOrder?.length ? extras.sectionOrder : DEFAULT_SECTION_ORDER),
      ];
      const idxA = baseOrder.indexOf(target.sectionKey);
      const idxB = baseOrder.indexOf(partnerKey);
      if (idxA === -1 || idxB === -1) return;
      pushUndoSnapshot();
      setExtras((prev) => ({
        ...prev,
        sectionOrder: swapPair(baseOrder, idxA, idxB),
      }));
      showToast(direction === 'up' ? 'تم نقل القسم لأعلى' : 'تم نقل القسم لأسفل');
    }
  };

  // Keyboard shortcuts: Ctrl+S, Ctrl+P, Ctrl+N, Ctrl+B, Ctrl+1..9, Ctrl+Z, Ctrl+Y
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      const activeTag = document.activeElement?.tagName;
      const isTyping =
        activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

      if (key === 'z' && !isTyping) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (key === 'y' && !isTyping) {
        e.preventDefault();
        handleRedo();
      } else if (key === 's') {
        e.preventDefault();
        setActiveModal('save-copy');
      } else if (key === 'p') {
        e.preventDefault();
        setActiveModal('confirm-print');
      } else if (key === 'n') {
        e.preventDefault();
        setActiveModal('new-report');
      } else if (key === 'b') {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      } else if (key >= '1' && key <= '9') {
        e.preventDefault();
        const idx = Number(key) - 1;
        const target = SIDEBAR_ORDER[idx];
        if (target) {
          handleSelectSidebarSection(target);
        }
      } else if (key === '0') {
        e.preventDefault();
        handleSelectSidebarSection('cv');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Compatibility Bridge exposing exact global names: libraryCards, openLibrary, renderLibrary, openCard, copyCard, togglePin
  const handleToggleLibraryPin = (id: string) => {
    const currentPinned = loadPinnedIds();
    const exists = currentPinned.includes(id);
    const nextPinned = exists ? currentPinned.filter((x) => x !== id) : [...currentPinned, id];
    savePinnedIds(nextPinned);
    setLibraryCards(loadMergedLibraryCards());
    showToast(exists ? 'تم إلغاء تثبيت البطاقة' : 'تم تثبيت البطاقة في مكتبتك');
  };

  const handleCopyLibraryCard = async (id: string): Promise<boolean> => {
    const ok = await copyCardByIdHelper(id, libraryCards);
    showToast(ok ? 'تم نسخ البطاقة بالكامل إلى الحافظة' : 'تعذر نسخ البطاقة');
    return ok;
  };

  useEffect(() => {
    registerWindowLibraryBridge({
      libraryCards,
      openLibrary: () => handleSelectSidebarSection('library', 'cards'),
      renderLibrary: () => setLibraryCards(loadMergedLibraryCards()),
      openCard: (id: string) => {
        setActiveLibraryCardId(id);
        handleSelectSidebarSection('library', 'cards');
      },
      copyCard: handleCopyLibraryCard,
      togglePin: handleToggleLibraryPin,
    });
  });

  useEffect(() => {
    const updateScale = () => {
      if (zoomPreference !== 'fit') {
        setStageScale(zoomPreference);
        return;
      }
      const container = stageContainerRef.current;
      if (!container) return;
      const availableWidth = container.clientWidth - 20;
      const nextScale = Math.min(1, Math.max(0.36, availableWidth / A4_WIDTH_PX));
      setStageScale(nextScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (stageContainerRef.current) {
      observer.observe(stageContainerRef.current);
    }
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [zoomPreference, showEditor, layoutMode, viewFormat, mobilePane, sidebarCollapsed, showSectionWorkspace]);

  const translateReport = async (
    sourceReport: ReportData,
    targetLang: ReportLanguage
  ): Promise<ReportData> => {
    const response = await fetch('/api/report/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report: sourceReport, targetLang }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'تعذر ترجمة التقرير.');
    }
    return {
      ...sourceReport,
      ...payload.report,
      phone: sourceReport.phone,
      referenceNumber: sourceReport.referenceNumber,
      reportDate: sourceReport.reportDate,
      signDate: sourceReport.signDate,
    };
  };

  const handleSwitchLanguage = async (targetLang: ReportLanguage) => {
    if (targetLang === language) return;
    setAiError('');

    if (targetLang === 'ar') {
      setLanguage('ar');
      showToast('تم التبديل إلى التقرير العربي');
      return;
    }

    if (targetLang === 'en' && enData) {
      setLanguage('en');
      showToast('Switched to English Report');
      return;
    }

    setAiBusy(true);
    try {
      const translated = await translateReport(arData, 'en');
      setEnData(translated);
      setLanguage('en');
      showToast('تمت ترجمة التقرير إلى الإنجليزية');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر الترجمة حالياً.';
      setAiError(msg);
      setShowEditor(true);
      setMobilePane('editor');
    } finally {
      setAiBusy(false);
    }
  };

  const handleGenerateFromComplaint = async (payload: {
    complaintText: string;
    childName: string;
    birthDate: string;
    age: string;
    targetPurpose: string;
    outputLanguage: ReportLanguage;
  }) => {
    setAiBusy(true);
    setAiError('');
    try {
      const response = await fetch('/api/report/from-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintText: payload.complaintText,
          childName: payload.childName,
          birthDate: payload.birthDate,
          age: payload.age,
          targetPurpose: payload.targetPurpose,
          language: payload.outputLanguage,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'تعذر توليد التقرير من الشكوى.');
      }
      const generated: ReportData = {
        ...activeData,
        ...result.report,
        phone: activeData.phone,
        referenceNumber: activeData.referenceNumber,
        reportDate: activeData.reportDate,
        signDate: activeData.signDate,
      };
      if (payload.outputLanguage === 'en') {
        setEnData(generated);
        setLanguage('en');
      } else {
        setArData(generated);
        setEnData(null);
        setLanguage('ar');
      }
      setSelections(createFullSelections(generated));
      setVisibility(DEFAULT_SECTION_VISIBILITY);
      setEditorTab('items');
      setMobilePane('preview');
      appendChangeLog('توليد من شكوى', `توليد تقرير: ${generated.childName}`);
      showToast('تم توليد التقرير من الشكوى بنجاح');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحليل الشكوى.');
    } finally {
      setAiBusy(false);
    }
  };

  const handleRunShortcut = async (mode: 'executive' | 'parent-brief' | 'school-memo') => {
    setAiBusy(true);
    setAiError('');
    try {
      const response = await fetch('/api/report/shortcut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: activeData, mode, language }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'تعذر تطبيق الاختصار الذكي.');
      }
      const updated: ReportData = {
        ...activeData,
        ...result.report,
        phone: activeData.phone,
        referenceNumber: activeData.referenceNumber,
        reportDate: activeData.reportDate,
        signDate: activeData.signDate,
      };
      if (language === 'en') {
        setEnData(updated);
      } else {
        setArData(updated);
        setEnData(null);
      }
      setSelections(createFullSelections(updated));
      setMobilePane('preview');
      showToast('تم تطبيق الاختصار الذكي بنجاح');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'حدث خطأ أثناء تنفيذ الاختصار.');
    } finally {
      setAiBusy(false);
    }
  };

  const handleApplyTemplate = (template: ReportTemplate) => {
    setArData(template.data);
    setEnData(template.englishData);
    setSelections(createFullSelections(template.data));
    setVisibility(DEFAULT_SECTION_VISIBILITY);
    setMobilePane('preview');
    showToast(`تم تطبيق قالب: ${template.name}`);
  };

  const triggerDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderNodeToPng = async (node: HTMLElement): Promise<string> => {
    await document.fonts.ready;
    return toPng(node, {
      width: A4_WIDTH_PX,
      height: Math.max(A4_HEIGHT_PX, node.scrollHeight),
      pixelRatio: 3,
      cacheBust: true,
      style: {
        transform: 'none',
        margin: '0',
      },
    });
  };

  const handleExportPng = async (mode: 'separate' | 'stitched' = 'separate') => {
    const p1 = viewFormat === 'a4' ? page1Ref.current : hiddenPage1Ref.current;
    const p2 = viewFormat === 'a4' ? page2Ref.current : hiddenPage2Ref.current;
    if (!p1) return;

    setExportState('exporting');
    try {
      const safeChildName = filteredData.childName.trim().replace(/\s+/g, '-') || 'student';

      if (layoutMode === 'single') {
        const pngUrl = await renderNodeToPng(p1);
        triggerDownload(pngUrl, `تقرير-${safeChildName}-${language}-A4.png`);
      } else if (mode === 'stitched' && p2) {
        const [url1, url2] = await Promise.all([renderNodeToPng(p1), renderNodeToPng(p2)]);
        const loadImg = (src: string) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          });
        const [img1, img2] = await Promise.all([loadImg(url1), loadImg(url2)]);
        const gap = 36;
        const canvas = document.createElement('canvas');
        canvas.width = img1.width;
        canvas.height = img1.height + img2.height + gap;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#EAE6DD';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img1, 0, 0);
          ctx.drawImage(img2, 0, img1.height + gap);
          triggerDownload(
            canvas.toDataURL('image/png'),
            `تقرير-${safeChildName}-${language}-كامل.png`
          );
        }
      } else {
        const url1 = await renderNodeToPng(p1);
        triggerDownload(url1, `تقرير-${safeChildName}-${language}-صفحة-1.png`);
        if (p2) {
          const url2 = await renderNodeToPng(p2);
          setTimeout(() => {
            triggerDownload(url2, `تقرير-${safeChildName}-${language}-صفحة-2.png`);
          }, 250);
        }
      }

      setExportState('done');
      showToast('تم تصدير الصورة بنجاح');
      setTimeout(() => setExportState('idle'), 2500);
    } catch {
      setExportState('error');
      showToast('تعذر تصدير الصورة');
      setTimeout(() => setExportState('idle'), 2500);
    }
  };

  const handleExportInfographicPng = async () => {
    const node =
      viewFormat === 'infographic' ? infographicRef.current : hiddenInfographicRef.current;
    if (!node) return;
    setExportState('exporting');
    try {
      const safeChildName = filteredData.childName.trim().replace(/\s+/g, '-') || 'student';
      const url = await renderNodeToPng(node);
      triggerDownload(url, `إنفوجراف-${safeChildName}-${language}.png`);
      setExportState('done');
      showToast('تم تصدير الإنفوجراف بنجاح');
      setTimeout(() => setExportState('idle'), 2500);
    } catch {
      setExportState('error');
      showToast('تعذر تصدير الإنفوجراف');
      setTimeout(() => setExportState('idle'), 2500);
    }
  };

  const runSilentPreExportFormat = (): {
    nextData: ReportData;
    nextExtras: ReportExtras;
  } => {
    if (!autoFormatSettings.formatOnExport) {
      return { nextData: filteredData, nextExtras: extras };
    }
    const analysis = analyzeAndBuildSmartFormat({
      scope: 'report',
      settings: autoFormatSettings,
      reportData: activeData,
      reportLanguage: language,
      reportExtras: extras,
      themeSettings,
    });
    const formattedData = analysis.formattedPayload.reportData || activeData;
    const formattedExtras = analysis.formattedPayload.reportExtras || extras;
    handleUpdateActiveData(formattedData);
    setExtras(formattedExtras);
    if (analysis.formattedPayload.themeSettings) {
      handleUpdateThemeSettings(analysis.formattedPayload.themeSettings, false);
    }
    return {
      nextData: getFilteredReportData(formattedData, selections),
      nextExtras: formattedExtras,
    };
  };

  const handleExportWord = async () => {
    setExportState('exporting');
    try {
      const { nextData, nextExtras } = runSilentPreExportFormat();
      await exportReportToWord(nextData, visibility, language, accentTheme, nextExtras);
      setExportState('done');
      showToast('تم تصدير ملف Word بنجاح');
      setTimeout(() => setExportState('idle'), 2500);
    } catch {
      setExportState('error');
      showToast('تعذر تصدير Word');
    }
  };

  const handleExportBilingualWord = async () => {
    setExportState('exporting');
    try {
      const { nextExtras } = runSilentPreExportFormat();
      const arFiltered = getFilteredReportData(arData, selections);
      await exportReportToWord(arFiltered, visibility, 'ar', accentTheme, nextExtras);
      let resolvedEn = enData;
      if (!resolvedEn) {
        resolvedEn = await translateReport(arData, 'en');
        setEnData(resolvedEn);
      }
      const enFiltered = getFilteredReportData(resolvedEn, selections);
      setTimeout(async () => {
        await exportReportToWord(enFiltered, visibility, 'en', accentTheme, nextExtras);
      }, 300);
      setExportState('done');
      showToast('تم تصدير النسختين العربية والإنجليزية (Word)');
      setTimeout(() => setExportState('idle'), 2500);
    } catch (err) {
      setExportState('error');
      setAiError(err instanceof Error ? err.message : 'تعذر تصدير النسخة الإنجليزية');
    }
  };

  const handleExportExcel = () => {
    exportReportToExcel(filteredData, visibility, language, extras);
    setExportState('done');
    showToast('تم تصدير ملف Excel بنجاح');
    setTimeout(() => setExportState('idle'), 2500);
  };

  const handlePrintPdf = () => {
    runSilentPreExportFormat();
    setTimeout(() => window.print(), 80);
  };

  // Feature A Helpers: Open Auto-Format Modal, Apply, and Undo
  const handleUpdateAutoFormatSettings = (next: AutoFormatSettings, persist: boolean) => {
    setAutoFormatSettings(next);
    if (persist) {
      saveAutoFormatSettings(next);
    }
  };

  const handleOpenAutoFormat = (
    scope: SmartFormatScope,
    cvPayload?: { cv: CvData; language: CvLanguage; templateId: CvTemplateId }
  ) => {
    const resolvedCv = cvPayload || cvSnapshotRef.current;
    const analysis = analyzeAndBuildSmartFormat({
      scope,
      settings: autoFormatSettings,
      reportData: activeData,
      reportLanguage: language,
      reportExtras: extras,
      themeSettings,
      cvData: resolvedCv.cv,
      cvLanguage: resolvedCv.language,
      cvTemplateId: resolvedCv.templateId,
    });
    setAutoFormatModalState({
      open: true,
      scope,
      analysis,
    });
  };

  const handleApplyAutoFormatPayload = (
    payload: SmartFormatBundlePayload,
    compactReportSpacing?: boolean,
    labelSuffix = 'تطبيق التنسيق الآلي الذكي'
  ) => {
    const scope = autoFormatModalState.scope;
    const analysis = autoFormatModalState.analysis;

    if (analysis) {
      setLastFormatUndoSnapshot({
        scope,
        payload: analysis.originalSnapshot,
        cvLang: cvSnapshotRef.current.language,
      });
    }

    if (autoFormatSettings.backupBeforeFormat) {
      const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      appendChangeLog(`نسخة قبل التنسيق الآلي - ${stamp}`, labelSuffix);
    }

    if (scope !== 'cv') {
      pushUndoSnapshot();
    }

    if (payload.reportData) {
      handleUpdateActiveData(payload.reportData);
    }
    if (payload.reportExtras) {
      setExtras(payload.reportExtras);
    } else if (payload.tasks || payload.evaluations) {
      setExtras((prev) => ({
        ...prev,
        weeklyTasks: payload.tasks ?? prev.weeklyTasks,
        selectedEvaluationForms: payload.evaluations ?? prev.selectedEvaluationForms,
      }));
    }

    if (compactReportSpacing) {
      handleUpdateThemeSettings(
        { ...themeSettings, density: 'compact', fontSize: 'small' },
        false
      );
    } else if (payload.themeSettings) {
      handleUpdateThemeSettings(payload.themeSettings, false);
    }

    if (payload.cvData) {
      const targetLang = cvSnapshotRef.current.language;
      setExternalCvOverride((prev) => ({
        ar: targetLang === 'ar' ? payload.cvData : undefined,
        en: targetLang === 'en' ? payload.cvData : undefined,
        lang: targetLang,
        seq: (prev?.seq || 0) + 1,
      }));
    }

    showToast('تم تطبيق التنسيق الآلي الذكي وحفظ نسخة احتياطية قبل التنسيق ✓');
  };

  const handleUndoAutoFormat = () => {
    if (!lastFormatUndoSnapshot) return;
    const { scope, payload, cvLang } = lastFormatUndoSnapshot;
    if (payload.reportData) {
      handleUpdateActiveData(payload.reportData);
    }
    if (payload.reportExtras) {
      setExtras(payload.reportExtras);
    }
    if (payload.themeSettings) {
      handleUpdateThemeSettings(payload.themeSettings, false);
    }
    if (scope === 'cv' && payload.cvData) {
      const targetLang = cvLang || 'ar';
      setExternalCvOverride((prev) => ({
        ar: targetLang === 'ar' ? payload.cvData : undefined,
        en: targetLang === 'en' ? payload.cvData : undefined,
        lang: targetLang,
        seq: (prev?.seq || 0) + 1,
      }));
    }
    setLastFormatUndoSnapshot(null);
    appendChangeLog('تراجع التنسيق الآلي', 'استعادة النسخة الأصلية قبل التنسيق الآلي');
    showToast('تم التراجع عن التنسيق الآلي واستعادة النسخة الأصلية ✓');
  };

  // Feature B Helpers: Unified Smart Add Modal Open, Drafts & Save
  const handleOpenSmartAdd = (kind: SmartAddKind, draft?: SmartAddDraftItem) => {
    setSmartAddModalState({
      open: true,
      kind,
      draft: draft ?? null,
    });
  };

  const handleSaveSmartAddDraft = (draft: SmartAddDraftItem) => {
    const next = [draft, ...smartAddDrafts.filter((d) => d.id !== draft.id)];
    setSmartAddDrafts(next);
    persistSmartAddDrafts(next);
    appendChangeLog('مسودة ذكية', `حفظ مسودة: ${draft.title}`);
    showToast('تم حفظ المسودة بنجاح ✓');
  };

  const handleDeleteSmartAddDraft = (id: string) => {
    const next = smartAddDrafts.filter((d) => d.id !== id);
    setSmartAddDrafts(next);
    persistSmartAddDrafts(next);
    showToast('تم حذف المسودة');
  };

  const handleSaveFromUnifiedSmartAdd = (payload: UnifiedSmartAddSavePayload) => {
    const { kind, fields, extraParts } = payload;
    const todayIso = new Date().toISOString().slice(0, 10).replace(/-/g, '/');

    const getSavedDraftPair = (): { ar: CvData; en: CvData } => {
      try {
        const raw = localStorage.getItem('shamel_active_cv_draft_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            ar: parsed?.ar || DEFAULT_AR_CV_DATA,
            en: parsed?.en || DEFAULT_EN_CV_DATA,
          };
        }
      } catch {
        // fallback to default
      }
      return { ar: DEFAULT_AR_CV_DATA, en: DEFAULT_EN_CV_DATA };
    };

    if (kind === 'report' || kind === 'case') {
      const nextRecs = fields.recommendations
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const nextReport: ReportData = {
        ...createBlankReportData('إلى من يهمه الأمر / [ ... ]'),
        reportTitle:
          kind === 'case'
            ? `ملف وتقييم حالة: ${fields.childName}`
            : `تقرير تربوي وتقييمي: ${fields.childName}`,
        childName: fields.childName || '[ ... ]',
        age: fields.age || '[ ... ]',
        diagnosis: fields.diagnosis || '[ ... ]',
        reportDate: fields.reportDate || todayIso,
        signDate: fields.reportDate || todayIso,
        phone: fields.phone || activeData.phone || '01069579757',
        backgroundParagraph1: fields.mainComplaint || '[ ... ]',
        opinionParagraph1: fields.evaluation || '[ ... ]',
        recommendations: nextRecs.length > 0 ? nextRecs : ['[ ... ]'],
        preparedBy: activeData.preparedBy,
        professionalTitle: activeData.professionalTitle,
        centerName: activeData.centerName,
        centerCity: activeData.centerCity,
      };

      const nextCustomCards: CustomCardItem[] = extraParts.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
      }));

      const nextGoals =
        fields.planGoal && fields.planGoal.trim() !== '[ ... ]'
          ? fields.planGoal
              .split('\n')
              .map((g, i) => ({
                id: `goal-${Date.now()}-${i}`,
                goal: g.trim(),
                targetDuration: '4 أسابيع',
                owner: 'الأسرة والأخصائي',
                progress: 'قيد التنفيذ',
              }))
              .filter((g) => g.goal)
          : [];

      const nextExtras: ReportExtras = {
        ...DEFAULT_REPORT_EXTRAS,
        caseProfile: {
          ...DEFAULT_CASE_PROFILE_META,
          guardianName: fields.guardianName || '[ ... ]',
          guardianPhone: fields.phone || '[ ... ]',
          mainComplaint: fields.mainComplaint || '[ ... ]',
        },
        planGoals: nextGoals,
        customCards: nextCustomCards,
        extrasVisibility: {
          ...DEFAULT_REPORT_EXTRAS.extrasVisibility,
          plan: nextGoals.length > 0,
        },
      };

      const nextSel = createFullSelections(nextReport);
      const recName = `${kind === 'case' ? 'حالة' : 'تقرير'} - ${nextReport.childName}`;
      const newRecord: SavedReportRecord = {
        id: `rep-${Date.now()}`,
        name: recName,
        isDraft: false,
        updatedAt: todayIso.replace(/\//g, '-'),
        language: 'ar',
        arData: nextReport,
        enData: null,
        visibility: DEFAULT_SECTION_VISIBILITY,
        selections: nextSel,
        extras: nextExtras,
      };

      const nextList = [newRecord, ...savedReports];
      setSavedReports(nextList);
      persistSavedReports(nextList);
      setActiveRecordId(newRecord.id);
      setArData(nextReport);
      setEnData(null);
      setLanguage('ar');
      setVisibility(DEFAULT_SECTION_VISIBILITY);
      setSelections(nextSel);
      setExtras(nextExtras);
      setMobilePane('preview');
      setSmartAddModalState({ open: false, kind, draft: null });
      appendChangeLog(
        kind === 'case' ? 'إضافة حالة ذكية' : 'إضافة تقرير ذكي',
        recName
      );
      showToast(`تم إضافة ${kind === 'case' ? 'الحالة' : 'التقرير'} بنجاح ✓`, {
        label: 'عرض المستند',
        onClick: () => {
          handleSelectSidebarSection('dashboard', 'all');
          setMobilePane('preview');
          setTimeout(
            () => previewAnchorRef.current?.scrollIntoView({ behavior: 'smooth' }),
            80
          );
        },
      });
      return;
    }

    if (kind === 'cv') {
      const pair = getSavedDraftPair();
      const baseCv = fields.cvFull
        ? {
            ...fields.cvFull,
            fullName: fields.fullName || fields.cvFull.fullName,
            phone: fields.phone || fields.cvFull.phone,
            email: fields.email || fields.cvFull.email,
            targetJobTitle: fields.targetJobTitle || fields.cvFull.targetJobTitle,
            location: fields.location || fields.cvFull.location,
            summary: fields.summary || fields.cvFull.summary,
          }
        : {
            ...pair.ar,
            fullName: fields.fullName || '[ ... ]',
            phone: fields.phone || '[ ... ]',
            email: fields.email || '[ ... ]',
            targetJobTitle: fields.targetJobTitle || '[ ... ]',
            location: fields.location || '[ ... ]',
            summary: fields.summary || '[ ... ]',
          };

      const newCvRec: SavedCvRecord = {
        id: `cv-${Date.now()}`,
        name: `${baseCv.fullName || 'سيرة ذاتية'} - ATS`,
        updatedAt: todayIso.replace(/\//g, '-'),
        language: 'ar',
        templateId: 'ats-classic',
        arData: baseCv,
        enData: pair.en,
      };
      handleSaveCvRecord(newCvRec);
      setExternalCvOverride((prev) => ({
        ar: baseCv,
        en: pair.en,
        lang: 'ar',
        seq: (prev?.seq || 0) + 1,
      }));
      handleSelectSidebarSection('cv', 'new-cv');
      setSmartAddModalState({ open: false, kind, draft: null });
      appendChangeLog('إضافة CV ذكي', newCvRec.name);
      showToast('تم إضافة CV بنجاح ✓', {
        label: 'عرض المستند',
        onClick: () => handleSelectSidebarSection('cv', 'new-cv'),
      });
      return;
    }

    if (kind === 'certificate') {
      const pair = getSavedDraftPair();
      const currentTarget =
        cvSnapshotRef.current.language === 'en' ? pair.en : pair.ar;
      const newCert = {
        id: `cert-${Date.now()}`,
        name: fields.certTitle || '[ ... ]',
        issuer: fields.certIssuer || '[ ... ]',
        date: fields.certDate || todayIso,
      };
      const updatedCv: CvData = {
        ...currentTarget,
        certifications: [...currentTarget.certifications, newCert],
        trainings: [
          ...currentTarget.trainings,
          {
            id: `trn-${Date.now()}`,
            title: `${fields.certTitle} — ${fields.certSummary3Lines.split('\n')[0] || ''}`.trim(),
            provider: fields.certIssuer || '[ ... ]',
            dateRange: fields.certDate || todayIso,
          },
        ],
      };
      setExternalCvOverride((prev) => ({
        ar: cvSnapshotRef.current.language === 'ar' ? updatedCv : undefined,
        en: cvSnapshotRef.current.language === 'en' ? updatedCv : undefined,
        lang: cvSnapshotRef.current.language,
        seq: (prev?.seq || 0) + 1,
      }));
      handleSelectSidebarSection('cv', 'new-cv');
      setSmartAddModalState({ open: false, kind, draft: null });
      appendChangeLog('إضافة شهادة ذكية', fields.certTitle || 'شهادة');
      showToast('تم إضافة الشهادة بنجاح ✓', {
        label: 'عرض المستند',
        onClick: () => handleSelectSidebarSection('cv', 'new-cv'),
      });
      return;
    }

    if (kind === 'evaluation') {
      const newEval: EvaluationFormEntry = {
        id: `eval-smart-${Date.now()}`,
        category: 'behavior',
        title: fields.evalTitle || 'استمارة تقييم جديدة',
        fields: [
          { label: 'الأعراض والملاحظات', value: fields.evalSymptoms || '[ ... ]' },
          { label: 'الدرجات والمستوى', value: fields.evalScores || '[ ... ]' },
          { label: 'نوع الجلسات المقترح', value: fields.evalSessionTypes || '[ ... ]' },
          { label: 'ملاحظات الأخصائي', value: fields.evalNotes || '[ ... ]' },
        ],
      };
      pushUndoSnapshot();
      setExtras((prev) => ({
        ...prev,
        selectedEvaluationForms: [...prev.selectedEvaluationForms, newEval],
        extrasVisibility: { ...prev.extrasVisibility, evaluations: true },
      }));
      handleSelectSidebarSection('evaluations', 'comprehensive');
      setSmartAddModalState({ open: false, kind, draft: null });
      appendChangeLog('إضافة تقييم ذكي', newEval.title);
      showToast('تم إضافة التقييم بنجاح ✓', {
        label: 'عرض المستند',
        onClick: () => {
          setMobilePane('preview');
          setTimeout(
            () => previewAnchorRef.current?.scrollIntoView({ behavior: 'smooth' }),
            80
          );
        },
      });
      return;
    }

    if (kind === 'task') {
      const newTask: WeeklyTaskItem = {
        id: `task-${Date.now()}`,
        day: fields.taskDay || 'الأحد',
        task: fields.taskText || '[ ... ]',
        owner: fields.taskOwner || 'الأخصائي',
        status: fields.taskStatus || 'لم يتم',
      };
      pushUndoSnapshot();
      setExtras((prev) => ({
        ...prev,
        weeklyTasks: [...(prev.weeklyTasks || []), newTask],
      }));
      handleSelectSidebarSection('dashboard', 'tasks');
      setSmartAddModalState({ open: false, kind, draft: null });
      appendChangeLog('إضافة مهمة ذكية', newTask.task);
      showToast('تم إضافة المهمة بنجاح ✓', {
        label: 'عرض المستند',
        onClick: () => handleSelectSidebarSection('dashboard', 'tasks'),
      });
      return;
    }

    // Single CV sections: experience, skill, education
    const pair = getSavedDraftPair();
    const targetLang = cvSnapshotRef.current.language;
    const baseCv = targetLang === 'en' ? pair.en : pair.ar;
    let updatedCv: CvData = baseCv;

    if (kind === 'experience') {
      updatedCv = {
        ...baseCv,
        experiences: [
          ...baseCv.experiences,
          {
            id: `exp-${Date.now()}`,
            jobTitle: fields.expJobTitle || '[ ... ]',
            company: fields.expCompany || '[ ... ]',
            location: '[ ... ]',
            dateRange: fields.expDateRange || todayIso,
            bullets: fields.expBullets
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean),
          },
        ],
      };
    } else if (kind === 'skill') {
      const names = fields.skillName
        .split(/[,،\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const additions = (names.length > 0 ? names : ['[ ... ]']).map((nm, i) => ({
        id: `sk-${Date.now()}-${i}`,
        name: nm,
        level: fields.skillLevel || 'متقدم',
      }));
      updatedCv = {
        ...baseCv,
        skills: [...baseCv.skills, ...additions],
      };
    } else if (kind === 'education') {
      updatedCv = {
        ...baseCv,
        education: [
          ...baseCv.education,
          {
            id: `edu-${Date.now()}`,
            degree: fields.eduDegree || '[ ... ]',
            institution: fields.eduInstitution || '[ ... ]',
            dateRange: fields.eduDateRange || todayIso,
            details: '',
          },
        ],
      };
    }

    setExternalCvOverride((prev) => ({
      ar: targetLang === 'ar' ? updatedCv : undefined,
      en: targetLang === 'en' ? updatedCv : undefined,
      lang: targetLang,
      seq: (prev?.seq || 0) + 1,
    }));
    handleSelectSidebarSection('cv', 'new-cv');
    setSmartAddModalState({ open: false, kind, draft: null });
    appendChangeLog('إضافة بند CV ذكي', `${kind}`);
    const kindWord =
      kind === 'experience' ? 'الخبرة' : kind === 'skill' ? 'المهارة' : 'التعليم';
    showToast(`تم إضافة ${kindWord} بنجاح ✓`, {
      label: 'عرض المستند',
      onClick: () => handleSelectSidebarSection('cv', 'new-cv'),
    });
  };

  // New Studio Handlers
  const handleSelectSidebarSection = (id: SidebarSectionId, targetTab?: string) => {
    if (id !== activeSidebarSection) {
      setSectionHistory((prev) => [...prev.slice(-9), activeSidebarSection]);
    }
    setActiveSidebarSection(id);
    setShowSectionWorkspace(true);
    setMobilePane('sections');
    setStudioPrefs((prev) => {
      const next: StudioNavigationPrefs = {
        activeSection: id,
        sectionTabs: targetTab
          ? { ...prev.sectionTabs, [id]: targetTab }
          : prev.sectionTabs,
      };
      saveStudioPrefs(next);
      return next;
    });
  };

  const handleTabChange = (section: SidebarSectionId, tabId: string) => {
    setStudioPrefs((prev) => {
      const next: StudioNavigationPrefs = {
        ...prev,
        sectionTabs: { ...prev.sectionTabs, [section]: tabId },
      };
      saveStudioPrefs(next);
      return next;
    });
  };

  const handleGoBack = () => {
    if (mobilePane !== 'preview') {
      setMobilePane('preview');
      return;
    }
    if (sectionHistory.length > 0) {
      const prevSec = sectionHistory[sectionHistory.length - 1];
      setSectionHistory((prev) => prev.slice(0, -1));
      setActiveSidebarSection(prevSec);
      setShowSectionWorkspace(true);
      setStudioPrefs((prev) => {
        const next: StudioNavigationPrefs = { ...prev, activeSection: prevSec };
        saveStudioPrefs(next);
        return next;
      });
      return;
    }
    previewAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
    showToast('أنت الآن في شاشة معاينة التقرير');
  };

  const handleUpdateContactSettings = (next: ContactSettings) => {
    setContactSettings(next);
    saveContactSettings(next);
  };

  const handleUpdateAddonsSettings = (next: AddonsSettings) => {
    setAddonsSettings(next);
    saveAddonsSettings(next);
  };

  const handleCreateNewReport = (opts: {
    mode: 'blank' | 'template';
    templateId: string;
    recipients: string[];
    reportName: string;
  }) => {
    const firstRecipient = opts.recipients[0] || 'مدرسة';
    const recipientObj = RECIPIENT_OPTIONS.find((r) => r.id === firstRecipient);
    const salutation = recipientObj?.salutation || 'إلى من يهمه الأمر / [ ... ]';

    let nextAr: ReportData;
    let nextEn: ReportData | null = null;
    if (opts.mode === 'blank') {
      nextAr = createBlankReportData(salutation);
    } else {
      const tpl =
        REPORT_TEMPLATES.find((t) => t.id === opts.templateId) || REPORT_TEMPLATES[0];
      nextAr = { ...tpl.data, schoolAddressee: salutation };
      nextEn = { ...tpl.englishData };
    }

    const nextExtras: ReportExtras = {
      ...DEFAULT_REPORT_EXTRAS,
      selectedRecipients: opts.recipients,
      activeRecipientCopy: firstRecipient,
    };
    const nextSel = createFullSelections(nextAr);

    const newRecord: SavedReportRecord = {
      id: `rep-${Date.now()}`,
      name: opts.reportName.trim() || 'تقرير جديد',
      isDraft: false,
      updatedAt: new Date().toISOString().slice(0, 10),
      language: 'ar',
      arData: nextAr,
      enData: nextEn,
      visibility: DEFAULT_SECTION_VISIBILITY,
      selections: nextSel,
      extras: nextExtras,
    };

    const nextList = [newRecord, ...savedReports];
    setSavedReports(nextList);
    persistSavedReports(nextList);

    setActiveRecordId(newRecord.id);
    setArData(nextAr);
    setEnData(nextEn);
    setLanguage('ar');
    setVisibility(DEFAULT_SECTION_VISIBILITY);
    setSelections(nextSel);
    setExtras(nextExtras);
    setMobilePane('preview');
    appendChangeLog('حالة جديدة', `إنشاء ملف: ${newRecord.name}`);
    showToast(`تم إنشاء: ${newRecord.name}`);
  };

  const handleSaveCopyToDevice = async (opts: {
    filename: string;
    formats: { html: boolean; pdf: boolean; json: boolean; word: boolean };
  }) => {
    const baseName = opts.filename.trim() || `نسخة-${arData.childName}`;
    // 1. Save in LocalStorage without deleting old data
    const savedCopy: SavedReportRecord = {
      id: `saved-${Date.now()}`,
      name: baseName,
      isDraft: false,
      updatedAt: new Date().toISOString().slice(0, 10),
      language,
      arData,
      enData,
      visibility,
      selections,
      extras,
    };
    const updatedList = [savedCopy, ...savedReports];
    setSavedReports(updatedList);
    persistSavedReports(updatedList);

    // 2. Download selected formats
    if (opts.formats.html) {
      exportReportToHtml(filteredData, extras, visibility, language, baseName);
    }
    if (opts.formats.json) {
      exportReportToJson(
        {
          name: baseName,
          language,
          arData,
          enData,
          visibility,
          selections,
          extras,
        },
        baseName
      );
    }
    if (opts.formats.word) {
      await exportReportToWord(filteredData, visibility, language, accentTheme, extras);
    }
    if (opts.formats.pdf) {
      setTimeout(() => window.print(), 250);
    }

    showToast('تم الحفظ بنجاح ولم يتم حذف أي بيانات قديمة');
  };

  const handleSaveDraft = (name: string) => {
    const draftRec: SavedReportRecord = {
      id: `draft-${Date.now()}`,
      name,
      isDraft: true,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      language,
      arData,
      enData,
      visibility,
      selections,
      extras,
    };
    const updatedList = [draftRec, ...savedReports];
    setSavedReports(updatedList);
    persistSavedReports(updatedList);
    appendChangeLog('مسودة', `حفظ مسودة: ${name}`);
    showToast('تم حفظ المسودة دون حذف البيانات القديمة');
  };

  const handleLoadRecord = (rec: SavedReportRecord) => {
    setActiveRecordId(rec.id);
    setArData(rec.arData);
    setEnData(rec.enData);
    setLanguage(rec.language);
    setVisibility(rec.visibility);
    setSelections(rec.selections);
    setExtras(rec.extras || DEFAULT_REPORT_EXTRAS);
    showToast(`تم فتح: ${rec.name}`);
  };

  const handleConfirmDeleteRecord = () => {
    if (!pendingDeleteRecord) return;
    const filtered = savedReports.filter((r) => r.id !== pendingDeleteRecord.id);
    setSavedReports(filtered);
    persistSavedReports(filtered);
    if (activeRecordId === pendingDeleteRecord.id && filtered[0]) {
      handleLoadRecord(filtered[0]);
    }
    showToast(`تم حذف: ${pendingDeleteRecord.name}`);
    setPendingDeleteRecord(null);
  };

  const handleSaveCvRecord = (rec: SavedCvRecord) => {
    const nextList = [rec, ...savedCvs.filter((item) => item.id !== rec.id)];
    setSavedCvs(nextList);
    persistSavedCvs(nextList);
  };

  const handleDeleteCvRecord = (id: string) => {
    const nextList = savedCvs.filter((item) => item.id !== id);
    setSavedCvs(nextList);
    persistSavedCvs(nextList);
  };

  const handleUpdateThemeSettings = (next: ThemeSettings, persist: boolean) => {
    setThemeSettings(next);
    if (persist) {
      saveThemeSettings(next);
    }
  };

  const handleImportBackup = (payload: ReportBackupPayload) => {
    const importedRec: SavedReportRecord = {
      id: `imp-${Date.now()}`,
      name: `${payload.name} (مستورد)`,
      isDraft: false,
      updatedAt: new Date().toISOString().slice(0, 10),
      language: payload.language,
      arData: payload.arData,
      enData: payload.enData,
      visibility: payload.visibility,
      selections: payload.selections,
      extras: payload.extras,
    };
    const updatedList = [importedRec, ...savedReports];
    setSavedReports(updatedList);
    persistSavedReports(updatedList);
    handleLoadRecord(importedRec);
    showToast('تم استيراد النسخة بنجاح ولم يتم حذف أي بيانات قديمة');
  };

  const openEditorTab = (tab: EditorTab) => {
    setShowEditor(true);
    setEditorTab(tab);
    setMobilePane('editor');
  };

  const totalPreviewHeight =
    viewFormat === 'infographic' || layoutMode === 'single'
      ? A4_HEIGHT_PX * stageScale
      : (A4_HEIGHT_PX * 2 + 32) * stageScale;

  const densityPadding = themeSettings.density === 'compact' ? 'py-2' : 'py-3';

  const hiddenBlocksCount = useMemo(
    () =>
      Object.values(extras.blockStyles || {}).filter((st) => st?.hidden === true)
        .length,
    [extras.blockStyles]
  );

  const reorderCaps = computeReorderCapabilities(activeEditTarget);

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#F2F4F8',
        color: '#0F172A',
      }}
    >
      {/* 1. Clean Top Header Bar (Mobile Drawer Trigger + Center + Active Case + Back + Theme + Smart Export) */}
      <header
        className={`no-print bg-white border-b border-[#E2E8F0] px-4 md:px-6 ${densityPadding}`}
      >
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Mobile Dark Navy Sidebar Trigger + Brand + Active Case Context */}
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className={`lg:hidden min-h-[38px] min-w-[38px] inline-flex items-center justify-center bg-[#0A1633] text-white hover:bg-[#13244D] transition-colors shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="فتح القائمة الجانبية"
              aria-label="فتح القائمة الجانبية"
            >
              <Menu className="w-5 h-5" />
            </button>
            <a
              href="#preview"
              onClick={() => setMobilePane('preview')}
              className="font-editorial text-base md:text-lg font-bold text-[#0F172A] whitespace-nowrap shrink-0"
            >
              {activeData.centerName || 'المركز الشامل لرعاية الطفل'}
            </a>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] font-semibold text-[#1E3A8A] truncate max-w-[320px]">
              <span>الحالة: {activeData.childName}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums-ar">ملف: {activeData.referenceNumber}</span>
            </span>
          </div>

          {/* Unified Top Controls: Back + Theme + Smart Multi Export */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGoBack}
              className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[#334155] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="رجوع للخطوة أو القسم السابق"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>رجوع</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('choose-theme')}
              className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[#1E3A8A] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="تغيير الثيم"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">الثيم: {activeLightTheme.name}</span>
              <span className="sm:hidden">الثيم</span>
            </button>

            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className={`min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0F172A] hover:bg-[#1E293B] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير ذكي متعدد</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. 8 Colored Rounded Quick Action Buttons Strip + Report View Controls */}
      <div className="no-print bg-[#F8FAFC] border-b border-[#E2E8F0] px-3 md:px-6 py-2.5">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Exact 8 Colored Quick Action Buttons (Zero Duplicates) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 lg:pb-0 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveModal('confirm-print')}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="طباعة تقرير أو حفظ PDF (Ctrl+P)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة تقرير</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('choose-template')}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="شهادة / قالب تقرير جاهز"
            >
              <Award className="w-3.5 h-3.5" />
              <span>شهادة / تقرير</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeSidebarSection === 'cv' || activeSidebarSection === 'library' || activeSidebarSection === 'certificates') {
                  handleSelectSidebarSection('dashboard', 'all');
                }
                setShowCaseProfileCard(true);
                setTimeout(() => {
                  caseProfileAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="الانتقال إلى بطاقة بيانات الحالة"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>بطاقة الحالة</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeSidebarSection === 'cv' || activeSidebarSection === 'library' || activeSidebarSection === 'certificates') {
                  handleSelectSidebarSection('dashboard', 'all');
                }
                setViewFormat('a4');
                setPreviewCollapsed(false);
                setMobilePane('preview');
                setTimeout(() => {
                  previewAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="عرض معاينة التقرير الشامل A4"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>تقرير شامل</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSidebarSection('dashboard', 'tasks')}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#D97706] hover:bg-[#B45309] shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="فتح جدول المهام الأسبوعي"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>جدول مهام</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSidebarSection('cv', 'new-cv')}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0EA5E9] hover:bg-[#0284C7] shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="توليد سيرة ذاتية متوافقة مع ATS (Ctrl+0)"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>توليد CV</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSidebarSection('certificates', 'main')}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#1A237E] hover:bg-[#1E3A8A] shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="استوديو الشهادات والإفادات الجماعية (16 قالباً + توليد 40 شهادة)"
            >
              <Award className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>🏆 الشهادات والإفادات</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSidebarSection('library', 'cards')}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0A1633] hover:bg-[#13244D] shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="المكتبة الذكية ومساعد الشكاوى ومحرك التفريغ"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>📚 مكتبتي ({libraryCards.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setParentReportInitialComplaint(
                  extras.caseProfile?.mainComplaint && extras.caseProfile.mainComplaint !== '[ ... ]'
                    ? extras.caseProfile.mainComplaint
                    : ''
                );
                setParentReportWizardOpen(true);
              }}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="توليد تقرير ولي أمر 15 قسم بمراجعة وتأكيد إلزامي"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>تقرير ولي أمر (15)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeSidebarSection === 'cv' || activeSidebarSection === 'library' || activeSidebarSection === 'certificates') {
                  handleSelectSidebarSection('dashboard', 'all');
                }
                setShowEditor((prev) => !prev);
                setMobilePane('editor');
              }}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#475569] hover:bg-[#334155] shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="إظهار / إخفاء محرر التقرير"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{showEditor ? 'تعديل (مفتوح)' : 'تعديل'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSidebarSection('dashboard', 'drafts')}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
              title="عرض أرشيف الحالات والمسودات"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>أرشيف</span>
            </button>
          </div>

          {/* Streamlined Language, Format & Stamp Controls (hidden in CV/Library/Certificates views to avoid clutter) */}
          {activeSidebarSection !== 'cv' &&
            activeSidebarSection !== 'library' &&
            activeSidebarSection !== 'certificates' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 lg:pb-0 no-scrollbar">
              {/* Bilingual Switch */}
              <div
                className={`flex items-center gap-1 p-0.5 bg-white border border-[#CBD5E1] shrink-0 ${buttonRadiusClass}`}
              >
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={() => handleSwitchLanguage('ar')}
                  className={`min-h-[32px] px-2.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: language === 'ar' ? '#2563EB' : 'transparent',
                    color: language === 'ar' ? '#FFFFFF' : '#334155',
                  }}
                >
                  تقرير عربي
                </button>
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={() => handleSwitchLanguage('en')}
                  className={`min-h-[32px] inline-flex items-center gap-1 px-2.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: language === 'en' ? '#2563EB' : 'transparent',
                    color: language === 'en' ? '#FFFFFF' : '#334155',
                  }}
                >
                  {aiBusy && language === 'ar' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Languages className="w-3.5 h-3.5" />
                  )}
                  <span>تقرير إنجليزي</span>
                </button>
              </div>

              {/* Format Switch */}
              <div
                className={`flex items-center gap-1 p-0.5 bg-white border border-[#CBD5E1] shrink-0 ${buttonRadiusClass}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setViewFormat('a4');
                    setMobilePane('preview');
                  }}
                  className={`min-h-[32px] px-2.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: viewFormat === 'a4' ? '#EFF6FF' : 'transparent',
                    color: viewFormat === 'a4' ? '#1E3A8A' : '#64748B',
                  }}
                >
                  A4
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewFormat('infographic');
                    setMobilePane('preview');
                  }}
                  className={`min-h-[32px] px-2.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: viewFormat === 'infographic' ? '#EFF6FF' : 'transparent',
                    color: viewFormat === 'infographic' ? '#1E3A8A' : '#64748B',
                  }}
                >
                  إنفوجراف
                </button>
              </div>

              {viewFormat === 'a4' && (
                <div
                  className={`flex items-center gap-1 p-0.5 bg-white border border-[#CBD5E1] shrink-0 ${buttonRadiusClass}`}
                >
                  <button
                    type="button"
                    onClick={() => setLayoutMode('single')}
                    className={`min-h-[32px] px-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: layoutMode === 'single' ? '#EFF6FF' : 'transparent',
                      color: layoutMode === 'single' ? '#1E3A8A' : '#64748B',
                    }}
                  >
                    صفحة
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode('two-page')}
                    className={`min-h-[32px] px-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: layoutMode === 'two-page' ? '#EFF6FF' : 'transparent',
                      color: layoutMode === 'two-page' ? '#1E3A8A' : '#64748B',
                    }}
                  >
                    صفحتان
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowStamp((prev) => !prev)}
                className={`min-h-[34px] inline-flex items-center gap-1 px-2.5 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
                style={{
                  backgroundColor: showStamp ? '#EFF6FF' : '#FFFFFF',
                  borderColor: showStamp ? '#BFDBFE' : '#CBD5E1',
                  color: showStamp ? '#1E3A8A' : '#475569',
                }}
              >
                <Stamp className="w-3.5 h-3.5" />
                <span>{showStamp ? 'الختم' : 'بدون ختم'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Feedback Toast Banner */}
      {toastMessage && (
        <div className="no-print fixed top-4 left-4 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[#14532D] text-xs font-bold shadow-lg rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
          {toastJumpAction && (
            <button
              type="button"
              onClick={() => {
                toastJumpAction.onClick();
                setToastMessage('');
                setToastJumpAction(null);
              }}
              className="px-2 py-0.5 rounded bg-[#059669] hover:bg-[#047857] text-white text-[11px] font-bold cursor-pointer"
            >
              {toastJumpAction.label}
            </button>
          )}
        </div>
      )}

      {/* Main Studio Flex Shell: Right Sidebar (Dark Navy) + Light Gray Workspace Canvas */}
      <div className="print-container flex-1 flex w-full max-w-[1600px] mx-auto">
        <RightSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          activeSection={activeSidebarSection}
          activeTab={studioPrefs.sectionTabs[activeSidebarSection]}
          onSelectSection={handleSelectSidebarSection}
          onTriggerCvMenuAction={(action) =>
            setPendingCvMenuAction((prev) => ({
              action,
              seq: (prev?.seq || 0) + 1,
            }))
          }
          onOpenNewReport={() => handleOpenSmartAdd('report')}
          onOpenParentReport={() => {
            setParentReportInitialComplaint(
              extras.caseProfile?.mainComplaint && extras.caseProfile.mainComplaint !== '[ ... ]'
                ? extras.caseProfile.mainComplaint
                : ''
            );
            setParentReportWizardOpen(true);
          }}
          libraryCardsCount={libraryCards.length}
          onOpenSmartAdd={(kind) => handleOpenSmartAdd(kind)}
          onFocusFollowUp={() => {
            if (activeSidebarSection === 'cv' || activeSidebarSection === 'library' || activeSidebarSection === 'certificates') {
              handleSelectSidebarSection('dashboard', 'all');
            }
            setShowCaseProfileCard(true);
            setFollowUpFocusSeq((n) => n + 1);
            setTimeout(() => {
              caseProfileAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 60);
          }}
          onOpenUtilityModal={(m) => setUtilityModal(m)}
          showAddonsButton={addonsSettings.enabled}
          onOpenAddons={() => setAddonsModalOpen(true)}
          centerName={activeData.centerName || 'المركز الشامل'}
          specialistName={activeData.preparedBy || activeData.directorName || 'أ/ أسامة الصماد'}
          specialistRole={activeData.professionalTitle || activeData.directorRole || 'المشرف العام'}
          theme={activeLightTheme}
          buttonRadiusClass={buttonRadiusClass}
        />

        {/* Main Content Canvas (Light Gray #F3F4F6, White Rounded Cards) */}
        <main
          id="preview"
          className="print-container flex-1 min-w-0 px-3 md:px-6 py-4 md:py-5 pb-28 lg:pb-16"
        >
          {/* Mobile Section Selector Chips & Mobile +Addons Button */}
          {mobilePane === 'sections' && (
            <div className="no-print lg:hidden mb-3 flex items-center gap-1.5 overflow-x-auto pb-1">
              {addonsSettings.enabled && (
                <button
                  type="button"
                  onClick={() => setAddonsModalOpen(true)}
                  className={`min-h-[38px] px-3 text-xs font-bold bg-[#0EA5E9] text-white inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافات</span>
                </button>
              )}
              {(
                [
                  ['dashboard', 'التقارير'],
                  ['library', `مكتبتي (${libraryCards.length})`],
                  ['cv', 'سيرة ATS'],
                  ['certificates', '🏆 الشهادات والإفادات'],
                  ['summary', 'الملخص'],
                  ['evaluations', 'التقييم'],
                  ['plan', 'الخطة'],
                  ['recommendations', 'توصيات'],
                  ['charts', 'رسوم'],
                  ['templates', 'قوالب'],
                  ['recipients', 'الجهات'],
                  ['settings', 'الإعدادات'],
                ] as [SidebarSectionId, string][]
              ).map(([sid, lbl]) => (
                <button
                  key={sid}
                  type="button"
                  onClick={() => handleSelectSidebarSection(sid)}
                  className={`min-h-[38px] px-3 text-xs font-semibold border whitespace-nowrap shrink-0 cursor-pointer ${buttonRadiusClass}`}
                  style={{
                    backgroundColor:
                      activeSidebarSection === sid ? '#2563EB' : '#FFFFFF',
                    color: activeSidebarSection === sid ? '#FFFFFF' : '#0F172A',
                    borderColor: activeSidebarSection === sid ? '#2563EB' : '#CBD5E1',
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          )}

          {activeSidebarSection === 'cv' ? (
            <CvAtsStudio
              activeTab={normalizeCvStudioTab(studioPrefs.sectionTabs.cv)}
              onTabChange={(t) => handleTabChange('cv', t)}
              buttonRadiusClass={buttonRadiusClass}
              savedCvs={savedCvs}
              onSaveCvRecord={handleSaveCvRecord}
              onDeleteCvRecord={handleDeleteCvRecord}
              onNotify={showToast}
              pendingMenuAction={pendingCvMenuAction}
              externalCvOverride={externalCvOverride}
              onActiveCvSnapshot={(snap) => {
                cvSnapshotRef.current = snap;
              }}
              onOpenCvAutoFormat={(payload) => handleOpenAutoFormat('cv', payload)}
              onOpenSmartAdd={(kind) => handleOpenSmartAdd(kind)}
            />
          ) : activeSidebarSection === 'certificates' ? (
            <CertificatesStatementsStudio
              buttonRadiusClass={buttonRadiusClass}
              onNotify={showToast}
            />
          ) : activeSidebarSection === 'library' ? (
            <SmartLibraryStudio
              buttonRadiusClass={buttonRadiusClass}
              libraryCards={libraryCards}
              activeCardId={activeLibraryCardId}
              backupsList={libraryBackups}
              onSetActiveCardId={setActiveLibraryCardId}
              onTogglePin={handleToggleLibraryPin}
              onCopyCard={handleCopyLibraryCard}
              onAddNewCard={(card) => {
                createAutomaticBackupSnapshot('نسخة احتياطية قبل إضافة بطاقة');
                const custom = loadCustomLibraryCards();
                saveCustomLibraryCards([card, ...custom.filter((c) => c.id !== card.id)]);
                setLibraryCards(loadMergedLibraryCards());
                setLibraryBackups(loadAutoBackupsList());
                appendChangeLog('المكتبة الذكية', `إضافة بطاقة جديدة: ${card.title}`);
                showToast(`تمت إضافة البطاقة "${card.title}" إلى مكتبتك`);
              }}
              onImportCardsBatch={(imported) => {
                createAutomaticBackupSnapshot('نسخة احتياطية قبل استيراد بطاقات JSON');
                const custom = loadCustomLibraryCards();
                const mergedMap = new Map(custom.map((c) => [c.id, c]));
                imported.forEach((c) => mergedMap.set(c.id, c));
                saveCustomLibraryCards(Array.from(mergedMap.values()));
                setLibraryCards(loadMergedLibraryCards());
                setLibraryBackups(loadAutoBackupsList());
                appendChangeLog('المكتبة الذكية', `استيراد ${imported.length} بطاقة JSON`);
                showToast(`تم استيراد ${imported.length} بطاقة بنجاح`);
              }}
              onCreateBackupNow={() => {
                createAutomaticBackupSnapshot('نسخة احتياطية يدوية للمكتبة والتقارير');
                setLibraryBackups(loadAutoBackupsList());
                showToast('تم حفظ نسخة احتياطية جديدة بنجاح');
              }}
              onRestoreOldBackup={(backupId) => {
                const res = restoreBackupSnapshotById(backupId);
                if (!res.restored) {
                  showToast('لا توجد نسخة احتياطية محفوظة للاستعادة');
                  return;
                }
                setLibraryCards(res.cards);
                setLibraryBackups(loadAutoBackupsList());
                showToast(`تمت الاستعادة من: ${res.snapshotLabel}`);
              }}
              onGenerateFullPlanIntoReport={(analysis, complaintText) => {
                pushUndoSnapshot();
                const newGoals = analysis.goalsSMART.map((g, i) => ({
                  id: `lib-goal-${Date.now()}-${i}`,
                  goal: g,
                  targetDuration: '6 أسابيع',
                  owner: 'الأسرة والأخصائي والمدرسة',
                  progress: 'قيد التنفيذ',
                }));
                const mergedRecs = Array.from(
                  new Set([
                    ...activeData.recommendations,
                    ...analysis.recommendationsFamily,
                    ...analysis.recommendationsSchool,
                  ])
                );
                handleUpdateActiveData({
                  ...activeData,
                  diagnosis: analysis.suggestedCondition,
                  backgroundParagraph1:
                    complaintText.trim() || activeData.backgroundParagraph1,
                  recommendations: mergedRecs,
                  coreGoalQuote: analysis.goalsSMART[0] || activeData.coreGoalQuote,
                });
                setSelections({
                  ...selections,
                  recommendations: mergedRecs.map(() => true),
                });
                setExtras((prev) => ({
                  ...prev,
                  planGoals: [...prev.planGoals, ...newGoals],
                  extrasVisibility: { ...prev.extrasVisibility, plan: true },
                }));
                appendChangeLog('المساعد الآلي', `توليد خطة كاملة: ${analysis.suggestedCondition}`);
                showToast('تم توليد الخطة الكاملة والأهداف والتوصيات داخل التقرير ✓', {
                  label: 'معاينة التقرير',
                  onClick: () => handleSelectSidebarSection('dashboard', 'all'),
                });
              }}
              onOpenParentReportWithComplaint={(complaint) => {
                setParentReportInitialComplaint(complaint);
                setParentReportWizardOpen(true);
              }}
              onInsertCardIntoReport={(card, mode) => {
                pushUndoSnapshot();
                if (mode === 'goals' || mode === 'full') {
                  const gItems = card.goalsSMART.map((g, i) => ({
                    id: `card-g-${Date.now()}-${i}`,
                    goal: g,
                    targetDuration: '4-6 أسابيع',
                    owner: 'الأخصائي والأسرة',
                    progress: 'مخطط',
                  }));
                  setExtras((prev) => ({
                    ...prev,
                    planGoals: [...prev.planGoals, ...gItems],
                    extrasVisibility: { ...prev.extrasVisibility, plan: true },
                  }));
                }
                if (mode === 'recs' || mode === 'full') {
                  const recAdds = [...card.recommendationsFamily, ...card.recommendationsSchool];
                  const merged = Array.from(new Set([...activeData.recommendations, ...recAdds]));
                  handleUpdateActiveData({ ...activeData, recommendations: merged });
                  setSelections((prev) => ({
                    ...prev,
                    recommendations: merged.map(() => true),
                  }));
                }
                if (mode === 'activities' || mode === 'full') {
                  const actLines = card.activities.map(
                    (a) => `${a.name} (${a.duration}): ${a.steps.join(' ← ')}`
                  );
                  const mergedBenefits = Array.from(
                    new Set([...activeData.homeSchoolBenefits, ...actLines])
                  );
                  handleUpdateActiveData({
                    ...activeData,
                    homeSchoolBenefits: mergedBenefits,
                  });
                  setSelections((prev) => ({
                    ...prev,
                    homeSchoolBenefits: mergedBenefits.map(() => true),
                  }));
                }
                appendChangeLog('إدراج من المكتبة', `${card.title} (${mode})`);
                showToast(`تم إدراج "${card.title}" في التقرير بنجاح ✓`, {
                  label: 'عرض التقرير',
                  onClick: () => handleSelectSidebarSection('dashboard', 'all'),
                });
              }}
              onNotify={showToast}
            />
          ) : (
            <>
              {/* Top Case Profile White Card */}
              {showCaseProfileCard && (
                <div ref={caseProfileAnchorRef}>
                  <CaseProfileCard
                    data={activeData}
                    caseProfile={extras.caseProfile || DEFAULT_CASE_PROFILE_META}
                    assignedSessions={extras.assignedSessions || []}
                    sessionLogs={extras.sessionLogs || []}
                    buttonRadiusClass={buttonRadiusClass}
                    followUpFocusSeq={followUpFocusSeq}
                    onUpdateData={(next) => {
                      pushUndoSnapshot();
                      handleUpdateActiveData(next);
                    }}
                    onUpdateCaseProfile={handleUpdateCaseProfile}
                    onNotify={showToast}
                  />
                </div>
              )}

              {/* Active Sidebar Section White Card */}
              {(showSectionWorkspace || mobilePane === 'sections') && (
                <div className={mobilePane === 'sections' ? 'block' : 'hidden lg:block'}>
              <WorkspaceSectionPanel
                activeSection={activeSidebarSection}
                activeTabOverride={studioPrefs.sectionTabs[activeSidebarSection]}
                onTabChange={handleTabChange}
                initialEvalCategory={initialEvalCategory}
                theme={activeLightTheme}
                buttonRadiusClass={buttonRadiusClass}
                data={activeData}
                language={language}
                viewFormat={viewFormat}
                layoutMode={layoutMode}
                visibility={visibility}
                extras={extras}
                showStamp={showStamp}
                savedReports={savedReports}
                themeSettings={themeSettings}
                contactSettings={contactSettings}
                addonsSettings={addonsSettings}
                aiBusy={aiBusy}
                onUpdateData={handleUpdateActiveData}
                onUpdateVisibility={setVisibility}
                onUpdateExtras={setExtras}
                onToggleStamp={() => setShowStamp((p) => !p)}
                onChangeView={(v, l) => {
                  setViewFormat(v);
                  setLayoutMode(l);
                }}
                onApplyTemplateById={(id) => {
                  const found = REPORT_TEMPLATES.find((t) => t.id === id);
                  if (found) handleApplyTemplate(found);
                }}
                onAddRecommendations={(items) => {
                  const merged = Array.from(new Set([...activeData.recommendations, ...items]));
                  handleUpdateActiveData({ ...activeData, recommendations: merged });
                  setSelections({
                    ...selections,
                    recommendations: merged.map(() => true),
                  });
                  showToast(`تمت إضافة ${items.length} توصيات إلى التقرير`);
                }}
                onSaveDraft={handleSaveDraft}
                onLoadRecord={handleLoadRecord}
                onRequestDeleteRecord={(rec) => {
                  setPendingDeleteRecord(rec);
                  setActiveModal('delete-report');
                }}
                onUpdateThemeSettings={handleUpdateThemeSettings}
                onUpdateContactSettings={handleUpdateContactSettings}
                onUpdateAddonsSettings={handleUpdateAddonsSettings}
                onOpenModal={setActiveModal}
                onOpenAddVisual={(kind) => {
                  setInitialVisualKind(kind);
                  setActiveModal('add-chart-table');
                }}
                onRunAiSummary={() => handleRunShortcut('executive')}
                onRunShortcut={handleRunShortcut}
                onJumpToPreview={() => {
                  setMobilePane('preview');
                  previewAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                onNotify={showToast}
                autoFormatSettings={autoFormatSettings}
                onUpdateAutoFormatSettings={handleUpdateAutoFormatSettings}
                onOpenAutoFormat={(scope) => handleOpenAutoFormat(scope)}
                onOpenSmartAdd={(kind, draft) => handleOpenSmartAdd(kind, draft)}
                smartAddDrafts={smartAddDrafts}
                onDeleteSmartAddDraft={handleDeleteSmartAddDraft}
              />
            </div>
          )}

          {/* Two-Pane Document Studio: Editor Card + Preview Card */}
          <div className="print-container flex flex-col lg:flex-row items-start gap-5">
            {/* Editor Sidebar White Card */}
            <div
              className={`no-print w-full lg:w-[350px] shrink-0 lg:sticky lg:top-4 ${
                mobilePane === 'editor' ? 'block' : 'hidden'
              } ${showEditor ? 'lg:block' : 'lg:hidden'}`}
            >
              <EditorPanel
                data={activeData}
                visibility={visibility}
                selections={selections}
                language={language}
                onChangeData={handleUpdateActiveData}
                onChangeVisibility={setVisibility}
                onChangeSelections={setSelections}
                onGenerateFromComplaint={handleGenerateFromComplaint}
                onReset={() => {
                  setArData(DEFAULT_REPORT_DATA);
                  setEnData(DEFAULT_ENGLISH_REPORT_DATA);
                  setLanguage('ar');
                  setVisibility(DEFAULT_SECTION_VISIBILITY);
                  setSelections(createFullSelections(DEFAULT_REPORT_DATA));
                  setExtras(DEFAULT_REPORT_EXTRAS);
                  setAiError('');
                  showToast('تمت استعادة البيانات الافتراضية');
                }}
                activeTab={editorTab}
                onTabChange={setEditorTab}
                onOpenTemplatesSection={() => handleSelectSidebarSection('templates', 'content')}
                aiBusy={aiBusy}
                aiError={aiError}
              />
            </div>

            {/* Document Preview Stage Wrapped in Crisp White Card */}
            <div
              ref={stageContainerRef}
              className={`print-container flex-1 w-full min-w-0 flex-col items-center ${
                mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <div
                ref={previewAnchorRef}
                className="print-container w-full bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden"
              >
                {/* Preview Card Header (Collapsible + Left Quick Action) */}
                <div className="no-print flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white border-b border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setPreviewCollapsed((c) => !c)}
                    className="flex items-center gap-2 text-right cursor-pointer group"
                    title={previewCollapsed ? 'توسيع المعاينة' : 'طي المعاينة'}
                  >
                    <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] group-hover:bg-[#DBEAFE]">
                      {previewCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </span>
                    <div>
                      <div className="font-editorial text-base font-bold text-[#0F172A] leading-tight">
                        {viewFormat === 'a4'
                          ? 'معاينة التقرير الرسمي (A4)'
                          : 'معاينة الإنفوجراف التلخيصي (A4)'}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {language === 'ar' ? 'النسخة العربية' : 'English Translation'} ·{' '}
                        {showStamp ? 'مُذيل بالختم الرسمي' : 'بدون ختم رقمي'}
                      </div>
                    </div>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAutoFormat('report')}
                      className={`min-h-[32px] px-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                      title="تنسيق آلي ذكي لإصلاح الإملاء والترقيم والخطوط والتواريخ والجداول"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>✨ تنسيق آلي ذكي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomPreference((z) => (z === 'fit' ? 1 : 'fit'))}
                      className={`lg:hidden min-h-[32px] px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] text-[11px] font-semibold text-[#0F172A] cursor-pointer ${buttonRadiusClass}`}
                    >
                      {zoomPreference === 'fit' ? 'تكبير 100%' : 'ملائمة الشاشة'}
                    </button>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#475569]">
                      {showStamp ? (
                        <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-[#94A3B8]" />
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSectionWorkspace((prev) => !prev)}
                      className={`min-h-[32px] px-3 border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{showSectionWorkspace ? 'إخفاء القسم النشط' : 'إظهار القسم النشط'}</span>
                    </button>
                  </div>
                </div>

                {!previewCollapsed && (
                  <div className="p-3 md:p-4 bg-[#F8FAFC] print-container">
                    {/* Click-to-Edit & Undo/Redo Bar */}
                    <div
                      className={`no-print w-full max-w-[794px] mx-auto mb-3 px-3 py-2 bg-white border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs ${buttonRadiusClass}`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setClickEditEnabled((p) => !p)}
                          className={`min-h-[34px] px-2.5 border font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${buttonRadiusClass}`}
                          style={{
                            backgroundColor: clickEditEnabled ? '#2563EB' : '#F8FAFC',
                            color: clickEditEnabled ? '#FFFFFF' : '#0F172A',
                            borderColor: clickEditEnabled ? '#2563EB' : '#CBD5E1',
                          }}
                        >
                          <MousePointerClick className="w-3.5 h-3.5" />
                          <span>
                            {clickEditEnabled ? 'التعديل بالضغط: مفعّل' : 'التعديل بالضغط: متوقف'}
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={undoStack.length === 0}
                          onClick={handleUndo}
                          title={
                            undoStack.length > 0
                              ? 'تراجع عن آخر تعديل (Ctrl+Z)'
                              : 'لا توجد تعديلات للتراجع عنها'
                          }
                          className={`min-h-[34px] px-2.5 border border-[#CBD5E1] bg-white font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-45 ${buttonRadiusClass}`}
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>تراجع{undoStack.length > 0 ? ` (${undoStack.length})` : ''}</span>
                        </button>

                        <button
                          type="button"
                          disabled={redoStack.length === 0}
                          onClick={handleRedo}
                          title={
                            redoStack.length > 0
                              ? 'إعادة التعديل (Ctrl+Y)'
                              : 'لا توجد تعديلات للإعادة'
                          }
                          className={`min-h-[34px] px-2.5 border border-[#CBD5E1] bg-white font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-45 ${buttonRadiusClass}`}
                        >
                          <Redo2 className="w-3.5 h-3.5" />
                          <span>إعادة{redoStack.length > 0 ? ` (${redoStack.length})` : ''}</span>
                        </button>

                        {hiddenBlocksCount > 0 && (
                          <button
                            type="button"
                            onClick={handleRestoreHiddenBlocks}
                            className={`min-h-[34px] px-2.5 border border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A] font-semibold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>استعادة المخفي ({hiddenBlocksCount})</span>
                          </button>
                        )}
                      </div>

                      <span className="text-[11px] text-[#64748B]">
                        {clickEditEnabled
                          ? 'اضغط على أي جزء في التقرير لتعديله أو تنسيقه مباشرة'
                          : 'فعّل «التعديل بالضغط» للنقر على أي جزء بالتقرير'}
                      </span>
                    </div>

                    {/* A4 / Infographic Pure White Paper Stage */}
                    <div
                      className="print-container w-full flex justify-center overflow-x-auto pb-2"
                      style={{
                        minHeight: `${Math.ceil(totalPreviewHeight) + 24}px`,
                      }}
                    >
                      <div
                        className="print-container origin-top transition-transform duration-150 ease-out"
                        style={{
                          width: `${A4_WIDTH_PX}px`,
                          transform: `scale(${stageScale})`,
                          transformOrigin: 'top center',
                        }}
                      >
                        {viewFormat === 'a4' ? (
                          <ReportDocument
                            data={filteredData}
                            layoutMode={layoutMode}
                            paperTone={paperTone}
                            accentTheme={accentTheme}
                            showStamp={showStamp}
                            visibility={visibility}
                            language={language}
                            extras={extras}
                            lightTheme={activeLightTheme}
                            fontSizeScale={themeSettings.fontSize}
                            page1Ref={page1Ref}
                            page2Ref={page2Ref}
                            clickEditEnabled={clickEditEnabled}
                            onSelectBlock={setActiveEditTarget}
                          />
                        ) : (
                          <InfographicDocument
                            data={filteredData}
                            paperTone={paperTone}
                            accentTheme={accentTheme}
                            showStamp={showStamp}
                            visibility={visibility}
                            language={language}
                            extras={extras}
                            lightTheme={activeLightTheme}
                            infographicRef={infographicRef}
                            clickEditEnabled={clickEditEnabled}
                            onSelectBlock={setActiveEditTarget}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

              {/* 3 Simplified Bottom White Cards: Assigned Sessions, Session Logs, Attendance Summary */}
              <div className="mt-5">
                <CaseOperationsCards
                  assignedSessions={extras.assignedSessions || []}
                  sessionLogs={extras.sessionLogs || []}
                  buttonRadiusClass={buttonRadiusClass}
                  onChangeAssignedSessions={handleChangeAssignedSessions}
                  onChangeSessionLogs={handleChangeSessionLogs}
                  onNotify={showToast}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Fixed Dark Navy Bottom Contact Bar (Desktop, Editable in Settings > Center) */}
      <footer className="no-print hidden lg:flex fixed bottom-0 left-0 right-0 z-30 h-11 bg-[#0A1633] border-t border-[#1E3A5F] px-6 items-center justify-between text-xs text-[#E2E8F0]">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <span className="font-bold text-white shrink-0">{activeData.centerName}</span>

          <button
            type="button"
            onClick={async () => {
              const ok = await copyTextToClipboard(contactSettings.phone);
              showToast(ok ? `تم نسخ الهاتف: ${contactSettings.phone}` : contactSettings.phone);
            }}
            className="inline-flex items-center gap-1.5 hover:text-[#60A5FA] cursor-pointer shrink-0"
          >
            <Phone className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>هاتف:</span>
            <span dir="ltr" className="font-semibold tabular-nums-ar text-white">
              {contactSettings.phone}
            </span>
          </button>

          <button
            type="button"
            onClick={async () => {
              const ok = await copyTextToClipboard(contactSettings.website);
              showToast(
                ok ? `تم نسخ الموقع: ${contactSettings.website}` : contactSettings.website
              );
            }}
            className="inline-flex items-center gap-1.5 hover:text-[#93C5FD] cursor-pointer shrink-0"
          >
            <Globe className="w-3.5 h-3.5 text-[#818CF8]" />
            <span>موقع:</span>
            <span dir="ltr" className="font-semibold text-white">
              {contactSettings.website}
            </span>
          </button>

          <button
            type="button"
            onClick={async () => {
              const val = contactSettings.youtube || '[ ... ]';
              const ok = await copyTextToClipboard(val);
              showToast(ok ? `تم نسخ يوتيوب: ${val}` : val);
            }}
            className="inline-flex items-center gap-1.5 hover:text-[#F87171] cursor-pointer shrink-0"
          >
            <Video className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>يوتيوب:</span>
            <span dir="ltr" className="font-semibold text-white max-w-[130px] truncate">
              {contactSettings.youtube || '[ ... ]'}
            </span>
          </button>

          <button
            type="button"
            onClick={async () => {
              const ok = await copyTextToClipboard(contactSettings.whatsapp);
              showToast(
                ok ? `تم نسخ رقم الواتساب: ${contactSettings.whatsapp}` : contactSettings.whatsapp
              );
            }}
            className="inline-flex items-center gap-1.5 hover:text-[#34D399] cursor-pointer shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#34D399]" />
            <span>واتساب:</span>
            <span dir="ltr" className="font-semibold tabular-nums-ar text-white">
              {contactSettings.whatsapp}
            </span>
          </button>

          <button
            type="button"
            onClick={async () => {
              const val = contactSettings.facebook || '[ ... ]';
              const ok = await copyTextToClipboard(val);
              showToast(ok ? `تم نسخ فيسبوك: ${val}` : val);
            }}
            className="inline-flex items-center gap-1.5 hover:text-[#60A5FA] cursor-pointer shrink-0"
          >
            <Share2 className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>فيسبوك:</span>
            <span dir="ltr" className="font-semibold text-white max-w-[140px] truncate">
              {contactSettings.facebook || '[ ... ]'}
            </span>
          </button>

          <button
            type="button"
            onClick={async () => {
              const val = contactSettings.instagram || '[ ... ]';
              const ok = await copyTextToClipboard(val);
              showToast(ok ? `تم نسخ انستجرام: ${val}` : val);
            }}
            className="inline-flex items-center gap-1.5 hover:text-[#F472B6] cursor-pointer shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#F472B6]" />
            <span>انستجرام:</span>
            <span dir="ltr" className="font-semibold text-white max-w-[140px] truncate">
              {contactSettings.instagram || '[ ... ]'}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleSelectSidebarSection('settings', 'center')}
          className="text-[11px] font-bold text-[#60A5FA] hover:text-white shrink-0 cursor-pointer"
        >
          تعديل بيانات التواصل
        </button>
      </footer>

      {/* Mobile Fixed Bottom Thumb Navigation Bar (5 destinations, 64px height <15% cap) */}
      <nav
        aria-label="التنقل السريع للجوال"
        className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] grid grid-cols-5 items-center px-1"
      >
        <button
          type="button"
          onClick={() => setMobilePane('preview')}
          className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer"
          style={{
            color: mobilePane === 'preview' ? '#2563EB' : '#64748B',
            fontWeight: mobilePane === 'preview' ? 700 : 500,
          }}
        >
          <Eye className="w-5 h-5" />
          <span className="text-[10.5px]">المعاينة</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobilePane('editor');
            if (editorTab === 'complaint') setEditorTab('school');
          }}
          className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer"
          style={{
            color: mobilePane === 'editor' && editorTab !== 'complaint' ? '#2563EB' : '#64748B',
            fontWeight: mobilePane === 'editor' && editorTab !== 'complaint' ? 700 : 500,
          }}
        >
          <Edit3 className="w-5 h-5" />
          <span className="text-[10.5px]">التحرير</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobilePane('sections');
            setMobileSidebarOpen(true);
          }}
          className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer"
          style={{
            color: mobilePane === 'sections' || mobileSidebarOpen ? '#2563EB' : '#64748B',
            fontWeight: mobilePane === 'sections' || mobileSidebarOpen ? 700 : 500,
          }}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10.5px]">القائمة</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEditorTab('complaint');
            setMobilePane('editor');
          }}
          className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer"
          style={{
            color: mobilePane === 'editor' && editorTab === 'complaint' ? '#2563EB' : '#64748B',
            fontWeight: mobilePane === 'editor' && editorTab === 'complaint' ? 700 : 500,
          }}
        >
          <MessageSquarePlus className="w-5 h-5" />
          <span className="text-[10.5px]">شكوى</span>
        </button>

        <button
          type="button"
          onClick={() => setExportModalOpen(true)}
          className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 font-semibold text-[#0F172A] cursor-pointer"
        >
          <Download className="w-5 h-5" />
          <span className="text-[10.5px]">تصدير</span>
        </button>
      </nav>

      {/* Off-screen hidden export mirrors */}
      {activeSidebarSection !== 'cv' &&
        activeSidebarSection !== 'library' &&
        activeSidebarSection !== 'certificates' && (
        <div aria-hidden="true" className="no-print fixed -left-[9999px] top-0 pointer-events-none">
          {viewFormat !== 'a4' && (
            <ReportDocument
              data={filteredData}
              layoutMode={layoutMode}
              paperTone={paperTone}
              accentTheme={accentTheme}
              showStamp={showStamp}
              visibility={visibility}
              language={language}
              extras={extras}
              lightTheme={activeLightTheme}
              fontSizeScale={themeSettings.fontSize}
              page1Ref={hiddenPage1Ref}
              page2Ref={hiddenPage2Ref}
            />
          )}
          {viewFormat !== 'infographic' && (
            <InfographicDocument
              data={filteredData}
              paperTone={paperTone}
              accentTheme={accentTheme}
              showStamp={showStamp}
              visibility={visibility}
              language={language}
              extras={extras}
              lightTheme={activeLightTheme}
              infographicRef={hiddenInfographicRef}
            />
          )}
        </div>
      )}

      {/* Multi-Purpose + Addons Modal */}
      <AddonsModal
        open={addonsModalOpen}
        onClose={() => setAddonsModalOpen(false)}
        theme={activeLightTheme}
        buttonRadiusClass={buttonRadiusClass}
        addonsSettings={addonsSettings}
        data={activeData}
        extras={extras}
        contactSettings={contactSettings}
        onNavigateSectionTab={(section, tab) => handleSelectSidebarSection(section, tab)}
        onOpenNewReport={() => handleOpenSmartAdd('report')}
        onOpenComplaintEditor={() => openEditorTab('complaint')}
        onSwitchToInfographic={() => {
          setViewFormat('infographic');
          setMobilePane('preview');
          showToast('تم التحويل إلى عرض الإنفوجراف');
        }}
        onOpenSpecialtyForm={(category) => {
          setInitialEvalCategory(category);
          handleSelectSidebarSection('evaluations', 'specialty');
        }}
        onExportPdf={() => setActiveModal('confirm-print')}
        onAddCustomCard={(card: CustomCardItem) => {
          pushUndoSnapshot();
          setExtras((prev) => ({
            ...prev,
            customCards: [...(prev.customCards || []), card],
          }));
          showToast(`تمت إضافة: ${card.title}`);
        }}
        onAddWeeklyTask={(task: WeeklyTaskItem) => {
          pushUndoSnapshot();
          setExtras((prev) => ({
            ...prev,
            weeklyTasks: [...(prev.weeklyTasks || []), task],
          }));
          showToast('تمت إضافة المهمة إلى الجدول الأسبوعي');
        }}
        onNotify={showToast}
      />

      {/* Smart Multi-Format Export Modal */}
      <SmartExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        language={language}
        layoutMode={layoutMode}
        viewFormat={viewFormat}
        busy={exportState === 'exporting'}
        onExportPng={handleExportPng}
        onExportInfographicPng={handleExportInfographicPng}
        onExportWord={handleExportWord}
        onExportExcel={handleExportExcel}
        onPrintPdf={() => setActiveModal('confirm-print')}
        onExportBilingualWord={handleExportBilingualWord}
        onOpenAutoFormat={() =>
          handleOpenAutoFormat(activeSidebarSection === 'cv' ? 'cv' : 'report')
        }
      />

      {/* All Studio Modals */}
      <StudioModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        theme={activeLightTheme}
        buttonRadiusClass={buttonRadiusClass}
        currentData={filteredData}
        language={language}
        layoutMode={layoutMode}
        viewFormat={viewFormat}
        visibility={visibility}
        themeSettings={themeSettings}
        deleteTargetName={pendingDeleteRecord?.name || ''}
        initialChartKind={initialVisualKind}
        onCreateNewReport={handleCreateNewReport}
        onSaveCopyToDevice={handleSaveCopyToDevice}
        onConfirmDeleteReport={handleConfirmDeleteRecord}
        onApplyTemplateChoice={(templateId, nextView, nextLayout) => {
          const found = REPORT_TEMPLATES.find((t) => t.id === templateId);
          if (found) handleApplyTemplate(found);
          setViewFormat(nextView);
          setLayoutMode(nextLayout);
        }}
        onApplyThemeChoice={(themeId: LightThemeId) => {
          handleUpdateThemeSettings(
            { ...themeSettings, screenTheme: themeId },
            true
          );
          showToast(`تم تطبيق وحفظ ثيم: ${LIGHT_THEMES[themeId].name}`);
        }}
        onInsertChart={(chart: CustomChartItem) => {
          setExtras({
            ...extras,
            charts: [...extras.charts, chart],
            extrasVisibility: { ...extras.extrasVisibility, charts: true },
          });
          showToast(`تم إدراج الرسم البياني: ${chart.title}`);
        }}
        onInsertTable={(table: CustomTableItem) => {
          setExtras({
            ...extras,
            tables: [...extras.tables, table],
            extrasVisibility: { ...extras.extrasVisibility, tables: true },
          });
          showToast(`تم إدراج الجدول: ${table.title}`);
        }}
        onImportBackup={handleImportBackup}
        onExecutePrint={handlePrintPdf}
        onOpenAutoFormat={() => handleOpenAutoFormat('report')}
      />

      {/* Feature A: Smart Auto-Formatting Engine Modal */}
      <SmartAutoFormatModal
        open={autoFormatModalState.open}
        onClose={() => setAutoFormatModalState((p) => ({ ...p, open: false }))}
        scope={autoFormatModalState.scope}
        analysis={autoFormatModalState.analysis}
        buttonRadiusClass={buttonRadiusClass}
        canUndoFormat={Boolean(lastFormatUndoSnapshot)}
        onApplyAll={(payload, compact) =>
          handleApplyAutoFormatPayload(payload, compact, 'تطبيق كافة الإصلاحات الآلية')
        }
        onApplySingleFix={(fixId, payload) =>
          handleApplyAutoFormatPayload(payload, false, `إصلاح محدد: ${fixId}`)
        }
        onUndoFormat={handleUndoAutoFormat}
      />

      {/* Feature B: Unified Smart Add Modal */}
      <UnifiedSmartAddModal
        open={smartAddModalState.open}
        kind={smartAddModalState.kind}
        cvLanguage={cvSnapshotRef.current.language}
        buttonRadiusClass={buttonRadiusClass}
        initialDraft={smartAddModalState.draft}
        onClose={() =>
          setSmartAddModalState((p) => ({ ...p, open: false, draft: null }))
        }
        onConfirmSave={handleSaveFromUnifiedSmartAdd}
        onSaveDraft={handleSaveSmartAddDraft}
        onNotify={(msg) => showToast(msg)}
      />

      {/* Click-to-Edit Modal */}
      <ClickToEditModal
        target={activeEditTarget}
        currentData={activeData}
        currentStyle={
          activeEditTarget
            ? (extras.blockStyles || {})[activeEditTarget.blockId]
            : undefined
        }
        theme={activeLightTheme}
        buttonRadiusClass={buttonRadiusClass}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        undoCount={undoStack.length}
        redoCount={redoStack.length}
        canMoveUp={reorderCaps.canMoveUp}
        canMoveDown={reorderCaps.canMoveDown}
        reorderHint={reorderCaps.reorderHint}
        onClose={() => setActiveEditTarget(null)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSaveTextAndStyle={handleSaveTextAndStyle}
        onApplyStyleOnly={handleApplyStyleOnly}
        onHideBlock={handleHideBlock}
        onDeleteBlock={handleDeleteBlock}
        onMoveBlock={handleMoveBlock}
      />

      {/* Utility Modals: Change Log, Communication/Alerts, Account Security */}
      <StudioUtilityModals
        modalType={utilityModal}
        onClose={() => setUtilityModal(null)}
        buttonRadiusClass={buttonRadiusClass}
        data={activeData}
        caseProfile={extras.caseProfile || DEFAULT_CASE_PROFILE_META}
        weeklyTasks={extras.weeklyTasks || []}
        assignedSessions={extras.assignedSessions || []}
        sessionLogs={extras.sessionLogs || []}
        contactSettings={contactSettings}
        changeLog={changeLog}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        accountSecurity={accountSecurity}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearChangeLog={() => {
          setChangeLog([]);
          persistChangeLog([]);
          showToast('تم مسح سجل التعديلات');
        }}
        onSavePasscode={(newPasscode) => {
          const nextCfg: AccountSecurityConfig = {
            passcode: newPasscode,
            locked: false,
          };
          setAccountSecurity(nextCfg);
          saveAccountSecurity(nextCfg);
          appendChangeLog('الأمان', newPasscode ? 'تعيين / تحديث رمز الحماية' : 'إلغاء رمز الحماية');
        }}
        onLockWorkspace={() => {
          if (!accountSecurity.passcode) {
            showToast('يرجى تعيين رمز حماية أولاً من "تغيير كلمة المرور"');
            setUtilityModal('account-password');
            return;
          }
          const lockedCfg: AccountSecurityConfig = { ...accountSecurity, locked: true };
          setAccountSecurity(lockedCfg);
          saveAccountSecurity(lockedCfg);
          setUnlockInput('');
          setUnlockError('');
          setUtilityModal(null);
        }}
        onUpdateSpecialist={(name, role) => {
          handleUpdateActiveData({
            ...activeData,
            preparedBy: name,
            professionalTitle: role,
          });
          appendChangeLog('الأخصائي', `تحديث بيانات الأخصائي: ${name}`);
        }}
        onJumpToTasks={() => handleSelectSidebarSection('dashboard', 'tasks')}
        onNotify={showToast}
      />

      {/* Workspace Lock Screen Overlay */}
      {accountSecurity.locked && accountSecurity.passcode && (
        <div
          dir="rtl"
          className="no-print fixed inset-0 z-50 bg-[#0F172A]/95 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">تم قفل مساحة العمل</h2>
              <p className="text-xs text-[#64748B] mt-1">
                أدخل رمز الحماية لمتابعة العمل على التقارير وملفات الحالات.
              </p>
            </div>
            <input
              type="password"
              value={unlockInput}
              onChange={(e) => {
                setUnlockInput(e.target.value);
                setUnlockError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (unlockInput === accountSecurity.passcode) {
                    const nextCfg = { ...accountSecurity, locked: false };
                    setAccountSecurity(nextCfg);
                    saveAccountSecurity(nextCfg);
                    setUnlockInput('');
                    setUnlockError('');
                    showToast('تم فتح مساحة العمل');
                  } else {
                    setUnlockError('رمز الحماية غير صحيح.');
                  }
                }
              }}
              placeholder="رمز الحماية..."
              className={`w-full min-h-[42px] px-3 text-center text-sm border border-[#CBD5E1] ${buttonRadiusClass}`}
            />
            {unlockError && (
              <div className="text-xs font-semibold text-[#DC2626]">{unlockError}</div>
            )}
            <button
              type="button"
              onClick={() => {
                if (unlockInput === accountSecurity.passcode) {
                  const nextCfg = { ...accountSecurity, locked: false };
                  setAccountSecurity(nextCfg);
                  saveAccountSecurity(nextCfg);
                  setUnlockInput('');
                  setUnlockError('');
                  showToast('تم فتح مساحة العمل');
                } else {
                  setUnlockError('رمز الحماية غير صحيح.');
                }
              }}
              className={`w-full min-h-[42px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer ${buttonRadiusClass}`}
            >
              فتح الجلسة
            </button>
          </div>
        </div>
      )}
      {/* Feature D: 15-Section Verified Parent Report Wizard Modal */}
      <ParentReportWizardModal
        open={parentReportWizardOpen}
        onClose={() => setParentReportWizardOpen(false)}
        buttonRadiusClass={buttonRadiusClass}
        libraryCards={libraryCards}
        centerName={activeData.centerName || 'المركز الشامل لرعاية الطفل'}
        specialistName={activeData.preparedBy || activeData.directorName || 'أ/ أسامة الصماد'}
        specialistRole={activeData.professionalTitle || activeData.directorRole || 'مدير فني المركز'}
        initialComplaint={parentReportInitialComplaint}
        initialChildName={activeData.childName !== 'Adnan A HEMIDA' ? '' : ''}
        initialGuardianName={
          extras.caseProfile?.guardianName && extras.caseProfile.guardianName !== '[ ... ]'
            ? extras.caseProfile.guardianName
            : ''
        }
        initialPhone={
          extras.caseProfile?.guardianPhone && extras.caseProfile.guardianPhone !== '[ ... ]'
            ? extras.caseProfile.guardianPhone
            : ''
        }
        onSaveAndStampReport={(doc: ParentReport15Document) => {
          createAutomaticBackupSnapshot('نسخة احتياطية قبل حفظ تقرير ولي أمر 15 قسم');
          const existingParentReps = loadSavedParentReports();
          persistSavedParentReports([doc, ...existingParentReps.filter((d) => d.id !== doc.id)]);

          const nextAr = {
            ...activeData,
            ...convertParentReport15ToReportData(doc, activeData),
          };
          const nextSel = createFullSelections(nextAr);
          const nextRec: SavedReportRecord = {
            id: `rep-parent-${doc.id}`,
            name: `تقرير ولي أمر (15 قسم): ${doc.childName}`,
            isDraft: false,
            updatedAt: new Date().toISOString().slice(0, 10),
            language: 'ar',
            arData: nextAr,
            enData: null,
            visibility: DEFAULT_SECTION_VISIBILITY,
            selections: nextSel,
            extras: {
              ...extras,
              caseProfile: {
                ...(extras.caseProfile || DEFAULT_CASE_PROFILE_META),
                guardianName: doc.guardianName,
                guardianPhone: doc.guardianPhone,
                mainComplaint: doc.complaintText,
              },
            },
          };
          const nextSaved = [nextRec, ...savedReports];
          setSavedReports(nextSaved);
          persistSavedReports(nextSaved);
          setActiveRecordId(nextRec.id);
          setArData(nextAr);
          setEnData(null);
          setLanguage('ar');
          setSelections(nextSel);
          setShowStamp(true);
          setLibraryBackups(loadAutoBackupsList());
          appendChangeLog('تقرير ولي أمر موثق', `اعتماد وختم 15 قسم للحالة: ${doc.childName}`);
          showToast(`تم حفظ وختم تقرير "${doc.childName}" في سجل التقارير ✓`);
        }}
        onPrintParentReport={(doc: ParentReport15Document) => {
          const nextAr = {
            ...activeData,
            ...convertParentReport15ToReportData(doc, activeData),
          };
          setArData(nextAr);
          setEnData(null);
          setLanguage('ar');
          setSelections(createFullSelections(nextAr));
          setShowStamp(true);
          setParentReportWizardOpen(false);
          handleSelectSidebarSection('dashboard', 'all');
          setTimeout(() => {
            setActiveModal('confirm-print');
          }, 180);
        }}
        onNotify={showToast}
      />
    </div>
  );
}
