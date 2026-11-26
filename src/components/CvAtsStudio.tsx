import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Award,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Edit3,
  FileCheck2,
  FileImage,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  ImagePlus,
  Languages,
  Loader2,
  Menu,
  Paperclip,
  Plus,
  Printer,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ATS_CV_TEMPLATES,
  ATS_EXACT_HEADINGS,
  createBlankCvData,
  CvData,
  CvImportPresetFilter,
  CvLanguage,
  CvTemplateId,
  DEFAULT_AR_CV_DATA,
  DEFAULT_EN_CV_DATA,
  ExtractedCertificateSummary,
  SavedCvRecord,
} from '../types/cv';
import {
  applySafeAtsFixes,
  buildAtsPlainText,
  exportCvToAtsWord,
  extractJobDescriptionKeywords,
  normalizeDateString,
  runAtsComplianceAudit,
} from '../utils/cvAtsEngine';
import {
  prepareFileForExtraction,
  requestExtractJobAdFromServer,
} from '../utils/cvFileParser';
import { copyTextToClipboard } from '../utils/storageAndBackup';
import { AtsCheckModal } from './AtsCheckModal';
import { CvAtsDocument } from './CvAtsDocument';
import { CvCertificatesModal } from './CvCertificatesModal';
import { CvImportModal } from './CvImportModal';
import { CvPhotoModal } from './CvPhotoModal';
import { CvTargetSectorPanel } from './CvTargetSectorPanel';

export type CvStudioTab =
  | 'new-cv'
  | 'import-old'
  | 'templates'
  | 'saved'
  | 'export-pdf'
  | 'target-sector'
  | 'job-ad';

export function normalizeCvStudioTab(tab?: string): CvStudioTab {
  if (tab === 'editor' || tab === 'new-cv') return 'new-cv';
  if (tab === 'import-old') return 'import-old';
  if (tab === 'templates') return 'templates';
  if (tab === 'saved') return 'saved';
  if (tab === 'preview' || tab === 'export-pdf') return 'export-pdf';
  if (tab === 'target-sector') return 'target-sector';
  if (tab === 'keywords' || tab === 'job-ad') return 'job-ad';
  return 'new-cv';
}

export type CvMenuActionId =
  | 'import-cv'
  | 'import-certs'
  | 'import-photo'
  | 'attach-job-ad'
  | 'set-target-sector'
  | 'manual-edit'
  | 'import-word'
  | 'import-pdf'
  | 'import-image'
  | 'ats-check';

interface CvAtsStudioProps {
  activeTab: CvStudioTab;
  onTabChange: (tab: CvStudioTab) => void;
  buttonRadiusClass: string;
  savedCvs: SavedCvRecord[];
  onSaveCvRecord: (rec: SavedCvRecord) => void;
  onDeleteCvRecord: (id: string) => void;
  onNotify: (msg: string) => void;
  pendingMenuAction?: { action: CvMenuActionId; seq: number } | null;
}

const A4_WIDTH_PX = 794;

const LS_ACTIVE_CV_DRAFT_KEY = 'shamel_active_cv_draft_v1';

function loadSavedActiveCvDraft(): { ar: CvData; en: CvData } {
  try {
    const raw = localStorage.getItem(LS_ACTIVE_CV_DRAFT_KEY);
    if (!raw) return { ar: DEFAULT_AR_CV_DATA, en: DEFAULT_EN_CV_DATA };
    const parsed = JSON.parse(raw);
    return {
      ar: parsed?.ar ? parsed.ar : DEFAULT_AR_CV_DATA,
      en: parsed?.en ? parsed.en : DEFAULT_EN_CV_DATA,
    };
  } catch {
    return { ar: DEFAULT_AR_CV_DATA, en: DEFAULT_EN_CV_DATA };
  }
}

export const CvAtsStudio: React.FC<CvAtsStudioProps> = ({
  activeTab,
  onTabChange,
  buttonRadiusClass,
  savedCvs,
  onSaveCvRecord,
  onDeleteCvRecord,
  onNotify,
  pendingMenuAction,
}) => {
  const [cvLanguage, setCvLanguage] = useState<CvLanguage>('ar');
  const [templateId, setTemplateId] = useState<CvTemplateId>('ats-classic');
  const [arCv, setArCv] = useState<CvData>(() => loadSavedActiveCvDraft().ar);
  const [enCv, setEnCv] = useState<CvData>(() => loadSavedActiveCvDraft().en);

  const [atsModalOpen, setAtsModalOpen] = useState(false);
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [cvImportModalOpen, setCvImportModalOpen] = useState(false);
  const [cvImportFilter, setCvImportFilter] = useState<CvImportPresetFilter>('all');
  const [certsModalOpen, setCertsModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{
    extractedCount: number;
    missingFields: string[];
  } | null>(null);

  const [confirmedJdKeywords, setConfirmedJdKeywords] = useState<string[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('متقدم');
  const [jobAdFileBusy, setJobAdFileBusy] = useState(false);
  const [jobAdFileName, setJobAdFileName] = useState('');
  const [jobAdFileError, setJobAdFileError] = useState('');
  const [jobAdExtractedKeywords, setJobAdExtractedKeywords] = useState<string[]>([]);

  const previewStageRef = useRef<HTMLDivElement | null>(null);
  const cvDocRef = useRef<HTMLDivElement | null>(null);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);
  const fullNameInputRef = useRef<HTMLInputElement | null>(null);
  const jobAdFileInputRef = useRef<HTMLInputElement | null>(null);
  const jobAdTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const activeCv = cvLanguage === 'ar' ? arCv : enCv;
  const persistCvDraft = (nextAr: CvData, nextEn: CvData) => {
    try {
      localStorage.setItem(
        LS_ACTIVE_CV_DRAFT_KEY,
        JSON.stringify({ ar: nextAr, en: nextEn })
      );
    } catch {
      // ignore storage quota errors
    }
  };
  const updateActiveCv = (next: CvData) => {
    if (cvLanguage === 'ar') {
      setArCv(next);
      persistCvDraft(next, enCv);
    } else {
      setEnCv(next);
      persistCvDraft(arCv, next);
    }
  };

  const renderFieldStatusBadge = (val: string) => {
    if (!importFeedback) return null;
    const filled = Boolean(val.trim()) && val.trim() !== '[ ... ]';
    return filled ? (
      <span className="mr-1.5 px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">
        تم الملء تلقائياً ✓
      </span>
    ) : (
      <span className="mr-1.5 px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#B45309] text-[10px] font-semibold">
        يحتاج إدخال يدوي
      </span>
    );
  };

  const swapOrder = <T,>(arr: T[], idx: number, dir: -1 | 1): T[] => {
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return arr;
    const copy = [...arr];
    const tmp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = tmp;
    return copy;
  };

  const triggerMenuAction = (action: CvMenuActionId) => {
    setImportMenuOpen(false);
    if (action === 'import-cv') {
      setCvImportFilter('all');
      setCvImportModalOpen(true);
    } else if (action === 'import-word') {
      setCvImportFilter('word');
      setCvImportModalOpen(true);
    } else if (action === 'import-pdf') {
      setCvImportFilter('pdf');
      setCvImportModalOpen(true);
    } else if (action === 'import-image') {
      setCvImportFilter('image');
      setCvImportModalOpen(true);
    } else if (action === 'import-certs') {
      setCertsModalOpen(true);
    } else if (action === 'import-photo') {
      setPhotoModalOpen(true);
    } else if (action === 'attach-job-ad') {
      onTabChange('job-ad');
      setTimeout(() => jobAdTextareaRef.current?.focus(), 60);
    } else if (action === 'set-target-sector') {
      onTabChange('target-sector');
    } else if (action === 'manual-edit') {
      onTabChange('new-cv');
      setTimeout(() => fullNameInputRef.current?.focus(), 60);
    } else if (action === 'ats-check') {
      setAtsModalOpen(true);
    }
  };

  useEffect(() => {
    if (!pendingMenuAction) return;
    triggerMenuAction(pendingMenuAction.action);
  }, [pendingMenuAction]);

  // Close dropdown on click outside or Esc
  useEffect(() => {
    if (!importMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(e.target as Node)
      ) {
        setImportMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setImportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [importMenuOpen]);

  useEffect(() => {
    const updateScale = () => {
      const el = previewStageRef.current;
      if (!el) return;
      const available = el.clientWidth - 20;
      setPreviewScale(Math.min(1, Math.max(0.36, available / A4_WIDTH_PX)));
    };
    updateScale();
    const obs = new ResizeObserver(updateScale);
    if (previewStageRef.current) obs.observe(previewStageRef.current);
    window.addEventListener('resize', updateScale);
    return () => {
      obs.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [activeTab]);

  const atsAudit = useMemo(
    () => runAtsComplianceAudit(activeCv, cvLanguage, templateId),
    [activeCv, cvLanguage, templateId]
  );

  const keywordAnalysis = useMemo(
    () => extractJobDescriptionKeywords(activeCv.jobDescriptionText, activeCv),
    [activeCv]
  );

  const headings = ATS_EXACT_HEADINGS[cvLanguage];

  const handleApplyTemplate = (tplId: CvTemplateId) => {
    const found = ATS_CV_TEMPLATES.find((t) => t.id === tplId);
    if (!found) return;
    setTemplateId(tplId);
    setArCv(found.arPreset);
    setEnCv(found.enPreset);
    onNotify(`تم تطبيق ${found.nameAr} المتوافق 100% مع ATS`);
  };

  const handleCopyPlainText = async () => {
    const txt = buildAtsPlainText(activeCv, cvLanguage);
    const ok = await copyTextToClipboard(txt);
    onNotify(ok ? 'تم نسخ نص السيرة الذاتية بالكامل بصيغة ATS' : 'تعذر النسخ إلى الحافظة');
  };

  const handleExportTxt = () => {
    const txt = buildAtsPlainText(activeCv, cvLanguage);
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = activeCv.fullName.trim().replace(/\s+/g, '-') || 'cv';
    link.href = url;
    link.download = `CV-ATS-${safeName}-${cvLanguage}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotify('تم حفظ السيرة الذاتية كملف نصي قياسي (TXT)');
  };

  const handleExportWord = async () => {
    await exportCvToAtsWord(activeCv, cvLanguage);
    onNotify('تم تصدير السيرة الذاتية بصيغة Word متوافقة مع ATS');
  };

  const handleSaveCurrentCv = () => {
    const rec: SavedCvRecord = {
      id: `cv-${Date.now()}`,
      name: `${activeCv.fullName || 'سيرة ذاتية'} — ${activeCv.targetJobTitle || 'ATS'}`,
      updatedAt: new Date().toISOString().slice(0, 10),
      language: cvLanguage,
      templateId,
      arData: arCv,
      enData: enCv,
    };
    onSaveCvRecord(rec);
    onNotify('تم حفظ السيرة الذاتية في المتصفح دون حذف أي بيانات قديمة');
  };

  const handleAddConfirmedKeywords = () => {
    if (confirmedJdKeywords.length === 0) return;
    const defaultLevel = cvLanguage === 'ar' ? 'متقدم' : 'Advanced';
    const existingLower = new Set(activeCv.skills.map((s) => s.name.trim().toLowerCase()));
    const toAdd = confirmedJdKeywords
      .filter((kw) => !existingLower.has(kw.toLowerCase()))
      .map((kw, idx) => ({
        id: `sk-jd-${Date.now()}-${idx}`,
        name: kw,
        level: defaultLevel,
      }));
    updateActiveCv({
      ...activeCv,
      skills: [...activeCv.skills, ...toAdd],
    });
    setConfirmedJdKeywords([]);
    onNotify(`تمت إضافة ${toAdd.length} مهارة مؤكدة إلى قسم [${headings.skills}]`);
  };

  const handleEnsureJobTitleInSummary = () => {
    const title = activeCv.targetJobTitle.trim();
    if (!title || title.includes('[')) return;
    if (!activeCv.summary.toLowerCase().includes(title.toLowerCase())) {
      updateActiveCv({
        ...activeCv,
        summary: `${title} — ${activeCv.summary}`,
      });
      onNotify('تم إدراج المسمى الوظيفي الرسمي في الملخص المهني');
    }
  };

  const handleUploadJobAdFile = async (file: File) => {
    setJobAdFileError('');
    setJobAdFileBusy(true);
    try {
      const prepared = await prepareFileForExtraction(file);
      setJobAdFileName(`${prepared.fileName} (${prepared.sizeLabel})`);
      const extracted = await requestExtractJobAdFromServer(prepared, cvLanguage);
      setJobAdExtractedKeywords(extracted.keywords);
      updateActiveCv({
        ...activeCv,
        jobDescriptionText: extracted.cleanedText || prepared.previewSnippet,
        targetJobTitle: extracted.jobTitle || activeCv.targetJobTitle,
        targetOrganization: extracted.organization || activeCv.targetOrganization,
        targetSector: extracted.sector || activeCv.targetSector,
      });
      onNotify(`تم تحليل إعلان الوظيفة «${prepared.fileName}» واستخراج الكلمات المفتاحية`);
    } catch (err) {
      setJobAdFileError(
        err instanceof Error ? err.message : 'تعذر قراءة ملف إعلان الوظيفة.'
      );
    } finally {
      setJobAdFileBusy(false);
    }
  };

  const handleDownloadCvJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      language: cvLanguage,
      templateId,
      arData: arCv,
      enData: enCv,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = activeCv.fullName.trim().replace(/\s+/g, '-') || 'cv';
    link.href = url;
    link.download = `CV-Backup-${safeName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotify('تم تحميل نسخة JSON للسيرة الذاتية');
  };

  const handleAddCertificateToCv = (summary: ExtractedCertificateSummary) => {
    const nowId = Date.now();
    const docLower = summary.docType.toLowerCase();
    const nextSkills = [...activeCv.skills];
    const cleanSkill = summary.keywordSkill.trim();

    if (
      cleanSkill &&
      cleanSkill !== '[ ... ]' &&
      !nextSkills.some((s) => s.name.trim().toLowerCase() === cleanSkill.toLowerCase())
    ) {
      nextSkills.push({
        id: `sk-cert-${nowId}`,
        name: cleanSkill,
        level: cvLanguage === 'ar' ? 'متقدم' : 'Advanced',
      });
    }

    if (docLower.includes('دورة') || docLower.includes('training')) {
      updateActiveCv({
        ...activeCv,
        skills: nextSkills,
        trainings: [
          ...activeCv.trainings,
          {
            id: `trn-imp-${nowId}`,
            title: summary.title,
            provider: summary.issuer,
            dateRange: summary.year,
          },
        ],
      });
    } else if (docLower.includes('خبرة') || docLower.includes('experience')) {
      updateActiveCv({
        ...activeCv,
        skills: nextSkills,
        experiences: [
          ...activeCv.experiences,
          {
            id: `exp-cert-${nowId}`,
            jobTitle: summary.title,
            company: summary.issuer,
            location: '[ ... ]',
            dateRange: summary.year,
            bullets: [
              cleanSkill && cleanSkill !== '[ ... ]'
                ? cleanSkill
                : '[ ... ]',
            ],
          },
        ],
      });
    } else {
      updateActiveCv({
        ...activeCv,
        skills: nextSkills,
        certifications: [
          ...activeCv.certifications,
          {
            id: `cert-imp-${nowId}`,
            name: summary.title,
            issuer: summary.issuer,
            date: summary.year,
          },
        ],
      });
    }

    onNotify(`تمت إضافة «${summary.title}» بصيغة ATS إلى السيرة الذاتية`);
  };

  return (
    <div dir="rtl" className="space-y-4">
      {/* Top Studio Control Card (Hidden on Print) — Streamlined Single Dropdown */}
      <section className="no-print bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-visible">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="font-editorial text-lg font-bold text-[#0F172A]">
              منشئ السيرة الذاتية المتوافق 100% مع أنظمة تتبع المتقدمين (ATS)
            </h2>
            <p className="text-[11.5px] text-[#64748B]">
              عمود واحد قياسي · عناوين صريحة · استيراد ذكي من Word / PDF / صورة · خط واضح قابل للنسخ
            </p>
          </div>

          {/* Uncluttered Controls: AR/EN + ATS Score + Single [ ☰ استيراد وإضافة ▾ ] Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Language Switcher */}
            <div
              className={`flex items-center gap-1 p-0.5 bg-[#F8FAFC] border border-[#CBD5E1] ${buttonRadiusClass}`}
            >
              <button
                type="button"
                onClick={() => setCvLanguage('ar')}
                className={`min-h-[34px] px-3 text-xs font-bold cursor-pointer ${buttonRadiusClass}`}
                style={{
                  backgroundColor: cvLanguage === 'ar' ? '#2563EB' : 'transparent',
                  color: cvLanguage === 'ar' ? '#FFFFFF' : '#334155',
                }}
              >
                CV عربي
              </button>
              <button
                type="button"
                onClick={() => setCvLanguage('en')}
                className={`min-h-[34px] px-3 text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                style={{
                  backgroundColor: cvLanguage === 'en' ? '#2563EB' : 'transparent',
                  color: cvLanguage === 'en' ? '#FFFFFF' : '#334155',
                }}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>CV English</span>
              </button>
            </div>

            {/* Required [ فحص ATS ] Button */}
            <button
              type="button"
              onClick={() => setAtsModalOpen(true)}
              className={`min-h-[36px] px-3.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer ${buttonRadiusClass}`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>فحص ATS ({atsAudit.score}%)</span>
            </button>

            {/* Primary Unified Dropdown Button [ ☰ استيراد وإضافة ] */}
            <div ref={dropdownContainerRef} className="relative">
              <button
                type="button"
                onClick={() => setImportMenuOpen((p) => !p)}
                aria-expanded={importMenuOpen}
                aria-haspopup="menu"
                className={`min-h-[36px] px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer ${buttonRadiusClass}`}
              >
                <Menu className="w-4 h-4" />
                <span>استيراد وإضافة</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    importMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Desktop Dropdown Menu (hidden on mobile, where Bottom Sheet renders below) */}
              {importMenuOpen && (
                <div
                  role="menu"
                  className={`hidden sm:block absolute left-0 top-full mt-1.5 w-72 bg-white border border-[#CBD5E1] shadow-2xl z-50 overflow-hidden text-xs ${buttonRadiusClass}`}
                >
                  <div className="px-3 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0] font-bold text-[#1E3A8A]">
                    استيراد وإضافة بيانات CV
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => triggerMenuAction('import-cv')}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <span>استيراد CV قديم</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerMenuAction('import-certs')}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-[#059669] shrink-0" />
                      <span>استيراد شهادات ووثائق</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerMenuAction('import-photo')}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <ImagePlus className="w-4 h-4 text-[#7C3AED] shrink-0" />
                      <span>استيراد صورة شخصية للـ CV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerMenuAction('attach-job-ad')}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <span>إرفاق إعلان الوظيفة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerMenuAction('set-target-sector')}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-[#059669] shrink-0" />
                      <span>تحديد الجهة والمجال</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerMenuAction('manual-edit')}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-[#0F766E] shrink-0" />
                      <span>إضافة بيانات يدوية</span>
                    </button>
                    <div className="my-1 border-t border-[#E2E8F0]" />
                    <button
                      type="button"
                      onClick={() => triggerMenuAction('import-word')}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <span>استيراد من ملف Word</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerMenuAction('import-pdf')}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-[#DC2626] shrink-0" />
                      <span>استيراد من ملف PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerMenuAction('import-image')}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileImage className="w-4 h-4 text-[#D97706] shrink-0" />
                      <span>استيراد من صورة</span>
                    </button>
                  </div>

                  {/* All Existing CV Actions Preserved Without Header Clutter */}
                  <div className="px-3 py-2 bg-[#F8FAFC] border-y border-[#E2E8F0] font-bold text-[#1E3A8A]">
                    الحفظ والتصدير والطباعة
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setImportMenuOpen(false);
                        handleSaveCurrentCv();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <span>حفظ CV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImportMenuOpen(false);
                        handleExportWord();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-[#1E3A8A] shrink-0" />
                      <span>تصدير Word ATS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImportMenuOpen(false);
                        handleExportTxt();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-[#475569] shrink-0" />
                      <span>تصدير نص قياسي (TXT)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImportMenuOpen(false);
                        handleCopyPlainText();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-[#0F766E] shrink-0" />
                      <span>نسخ النص بالكامل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImportMenuOpen(false);
                        window.print();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#EFF6FF] text-[#0F172A] font-semibold flex items-center gap-2.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-[#4F46E5] shrink-0" />
                      <span>طباعة / تصدير PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 7 Smart Tabs Under [ توليد CV ] */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 bg-[#F8FAFC]">
          {(
            [
              ['new-cv', 'CV جديد'],
              ['import-old', 'استيراد CV قديم'],
              ['templates', 'قوالب CV'],
              ['saved', 'سيرتي المحفوظة'],
              ['export-pdf', 'تصدير PDF'],
              ['target-sector', 'الجهة والمجال'],
              ['job-ad', 'إعلان الوظيفة'],
            ] as [CvStudioTab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`min-h-[36px] px-3.5 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${buttonRadiusClass}`}
              style={{
                backgroundColor: activeTab === id ? '#2563EB' : 'transparent',
                color: activeTab === id ? '#FFFFFF' : '#475569',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Split Body: Clean White Card + Live ATS A4 Preview */}
      <div className="print-container flex flex-col lg:flex-row items-start gap-5">
        <div className="no-print w-full lg:w-[440px] shrink-0 bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 space-y-4 text-xs lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto">
          {/* TAB 1: NEW CV / FULL EDITOR */}
          {activeTab === 'new-cv' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
                <span className="font-bold text-[#0F172A]">محرر السيرة الذاتية ATS</span>
                <button
                  type="button"
                  onClick={() => {
                    setArCv(createBlankCvData('ar'));
                    setEnCv(createBlankCvData('en'));
                    setImportFeedback(null);
                    onNotify('تم إنشاء نموذج CV جديد فارغ متوافق مع ATS');
                  }}
                  className={`min-h-[32px] px-2.5 bg-[#059669] hover:bg-[#047857] text-white font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                >
                  <FilePlus2 className="w-3.5 h-3.5" />
                  <span>بدء CV فارغ</span>
                </button>
              </div>
                {importFeedback && (
                  <div className="p-2.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>
                        تم استخراج [{importFeedback.extractedCount}] حقل بنجاح — اضغط على أي حقل للتعديل أو الترتيب.
                      </span>
                      <button
                        type="button"
                        onClick={() => setImportFeedback(null)}
                        className="text-[#047857] cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                    {importFeedback.missingFields.length > 0 && (
                      <div className="text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded p-1.5">
                        لم يتم التعرف على [{importFeedback.missingFields.join('، ')}]، برجاء إدخاله يدوياً.
                      </div>
                    )}
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] text-[11px]">
                  بيانات التواصل تُعرض كنص صريح بدون أيقونات أو صور لضمان قراءة 100% من أنظمة تتبع المتقدمين (ATS).
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block font-bold mb-1">
                      <span>الاسم الكامل</span>
                      {renderFieldStatusBadge(activeCv.fullName)}
                    </label>
                    <input
                      ref={fullNameInputRef}
                      type="text"
                      value={activeCv.fullName}
                      onChange={(e) =>
                        updateActiveCv({ ...activeCv, fullName: e.target.value })
                      }
                      className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      <span>المسمى الوظيفي المطلوب (يُستخدم في التطابق)</span>
                      {renderFieldStatusBadge(activeCv.targetJobTitle)}
                    </label>
                    <input
                      type="text"
                      value={activeCv.targetJobTitle}
                      onChange={(e) =>
                        updateActiveCv({ ...activeCv, targetJobTitle: e.target.value })
                      }
                      className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold mb-1">
                        <span>الهاتف</span>
                        {renderFieldStatusBadge(activeCv.phone)}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={activeCv.phone}
                        onChange={(e) =>
                          updateActiveCv({ ...activeCv, phone: e.target.value })
                        }
                        className={`w-full min-h-[36px] px-2.5 border border-[#CBD5E1] text-right ${buttonRadiusClass}`}
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">
                        <span>البريد الإلكتروني</span>
                        {renderFieldStatusBadge(activeCv.email)}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={activeCv.email}
                        onChange={(e) =>
                          updateActiveCv({ ...activeCv, email: e.target.value })
                        }
                        className={`w-full min-h-[36px] px-2.5 border border-[#CBD5E1] text-right ${buttonRadiusClass}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold mb-1">
                        <span>الموقع / المدينة</span>
                        {renderFieldStatusBadge(activeCv.location)}
                      </label>
                      <input
                        type="text"
                        value={activeCv.location}
                        onChange={(e) =>
                          updateActiveCv({ ...activeCv, location: e.target.value })
                        }
                        className={`w-full min-h-[36px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">رابط ملف / موقع (اختياري)</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={activeCv.websiteOrLink}
                        onChange={(e) =>
                          updateActiveCv({ ...activeCv, websiteOrLink: e.target.value })
                        }
                        className={`w-full min-h-[36px] px-2.5 border border-[#CBD5E1] text-right ${buttonRadiusClass}`}
                      />
                    </div>
                  </div>
                </div>

                {/* 1. Summary */}
                <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1E3A8A]">{headings.summary}</span>
                    <button
                      type="button"
                      onClick={handleEnsureJobTitleInSummary}
                      className="text-[11px] text-[#2563EB] underline cursor-pointer"
                    >
                      تضمين المسمى الوظيفي
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={activeCv.summary}
                    onChange={(e) => updateActiveCv({ ...activeCv, summary: e.target.value })}
                    className={`w-full p-2.5 border border-[#CBD5E1] leading-relaxed ${buttonRadiusClass}`}
                  />
                </div>

                {/* 2. Work Experience */}
                <div className="pt-3 border-t border-[#E2E8F0] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1E3A8A]">{headings.experience}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveCv({
                          ...activeCv,
                          experiences: [
                            ...activeCv.experiences,
                            {
                              id: `exp-${Date.now()}`,
                              jobTitle: activeCv.targetJobTitle || '[ ... ]',
                              company: '[ ... ]',
                              location: '[ ... ]',
                              dateRange:
                                cvLanguage === 'ar'
                                  ? '01/2023 - حتى الآن'
                                  : '01/2023 - Present',
                              bullets: ['[ ... ]'],
                            },
                          ],
                        })
                      }
                      className={`px-2.5 py-1 bg-[#EFF6FF] text-[#1E3A8A] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة خبرة</span>
                    </button>
                  </div>

                  {activeCv.experiences.map((exp, idx) => (
                    <div
                      key={exp.id}
                      className={`p-3 border border-[#E2E8F0] bg-[#F8FAFC] space-y-2 ${buttonRadiusClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">خبرة #{idx + 1}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() =>
                              updateActiveCv({
                                ...activeCv,
                                experiences: swapOrder(activeCv.experiences, idx, -1),
                              })
                            }
                            title="نقل لأعلى"
                            className="p-1 text-[#475569] hover:text-[#2563EB] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === activeCv.experiences.length - 1}
                            onClick={() =>
                              updateActiveCv({
                                ...activeCv,
                                experiences: swapOrder(activeCv.experiences, idx, 1),
                              })
                            }
                            title="نقل لأسفل"
                            className="p-1 text-[#475569] hover:text-[#2563EB] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateActiveCv({
                                ...activeCv,
                                experiences: activeCv.experiences.filter((x) => x.id !== exp.id),
                              })
                            }
                            className="text-[#DC2626] font-bold cursor-pointer"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={exp.jobTitle}
                        onChange={(e) =>
                          updateActiveCv({
                            ...activeCv,
                            experiences: activeCv.experiences.map((x) =>
                              x.id === exp.id ? { ...x, jobTitle: e.target.value } : x
                            ),
                          })
                        }
                        placeholder="المسمى الوظيفي..."
                        className={`w-full min-h-[34px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) =>
                            updateActiveCv({
                              ...activeCv,
                              experiences: activeCv.experiences.map((x) =>
                                x.id === exp.id ? { ...x, company: e.target.value } : x
                              ),
                            })
                          }
                          placeholder="اسم الجهة / الشركة..."
                          className={`min-h-[34px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                        />
                        <input
                          type="text"
                          value={exp.dateRange}
                          onBlur={(e) =>
                            updateActiveCv({
                              ...activeCv,
                              experiences: activeCv.experiences.map((x) =>
                                x.id === exp.id
                                  ? {
                                      ...x,
                                      dateRange: normalizeDateString(e.target.value, cvLanguage),
                                    }
                                  : x
                              ),
                            })
                          }
                          onChange={(e) =>
                            updateActiveCv({
                              ...activeCv,
                              experiences: activeCv.experiences.map((x) =>
                                x.id === exp.id ? { ...x, dateRange: e.target.value } : x
                              ),
                            })
                          }
                          placeholder="01/2022 - 05/2024"
                          className={`min-h-[34px] px-2.5 bg-white border border-[#CBD5E1] tabular-nums-ar ${buttonRadiusClass}`}
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={exp.bullets.join('\n')}
                        onChange={(e) =>
                          updateActiveCv({
                            ...activeCv,
                            experiences: activeCv.experiences.map((x) =>
                              x.id === exp.id
                                ? { ...x, bullets: e.target.value.split('\n') }
                                : x
                            ),
                          })
                        }
                        placeholder="كل إنجاز أو مهمة في سطر منفصل..."
                        className={`w-full p-2 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                    </div>
                  ))}
                </div>

                {/* 3. Education */}
                <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1E3A8A]">{headings.education}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveCv({
                          ...activeCv,
                          education: [
                            ...activeCv.education,
                            {
                              id: `edu-${Date.now()}`,
                              degree: '[ ... ]',
                              institution: '[ ... ]',
                              dateRange: '09/2018 - 06/2022',
                              details: '',
                            },
                          ],
                        })
                      }
                      className={`px-2.5 py-1 bg-[#EFF6FF] text-[#1E3A8A] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة مؤهل</span>
                    </button>
                  </div>
                  {activeCv.education.map((edu, eduIdx) => (
                    <div
                      key={edu.id}
                      className={`p-2.5 border border-[#E2E8F0] bg-[#F8FAFC] space-y-1.5 ${buttonRadiusClass}`}
                    >
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) =>
                            updateActiveCv({
                              ...activeCv,
                              education: activeCv.education.map((x) =>
                                x.id === edu.id ? { ...x, degree: e.target.value } : x
                              ),
                            })
                          }
                          placeholder="الدرجة العلمية..."
                          className={`flex-1 min-h-[34px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                        />
                        <button
                          type="button"
                          disabled={eduIdx === 0}
                          onClick={() =>
                            updateActiveCv({
                              ...activeCv,
                              education: swapOrder(activeCv.education, eduIdx, -1),
                            })
                          }
                          className="p-1 text-[#475569] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={eduIdx === activeCv.education.length - 1}
                          onClick={() =>
                            updateActiveCv({
                              ...activeCv,
                              education: swapOrder(activeCv.education, eduIdx, 1),
                            })
                          }
                          className="p-1 text-[#475569] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveCv({
                              ...activeCv,
                              education: activeCv.education.filter((x) => x.id !== edu.id),
                            })
                          }
                          className="text-[#DC2626] px-2 font-bold cursor-pointer"
                        >
                          حذف
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) =>
                            updateActiveCv({
                              ...activeCv,
                              education: activeCv.education.map((x) =>
                                x.id === edu.id ? { ...x, institution: e.target.value } : x
                              ),
                            })
                          }
                          placeholder="الجامعة / المؤسسة..."
                          className={`min-h-[34px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                        />
                        <input
                          type="text"
                          value={edu.dateRange}
                          onBlur={(e) =>
                            updateActiveCv({
                              ...activeCv,
                              education: activeCv.education.map((x) =>
                                x.id === edu.id
                                  ? {
                                      ...x,
                                      dateRange: normalizeDateString(e.target.value, cvLanguage),
                                    }
                                  : x
                              ),
                            })
                          }
                          onChange={(e) =>
                            updateActiveCv({
                              ...activeCv,
                              education: activeCv.education.map((x) =>
                                x.id === edu.id ? { ...x, dateRange: e.target.value } : x
                              ),
                            })
                          }
                          placeholder="09/2014 - 06/2018"
                          className={`min-h-[34px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 4. Skills (Plain Text + Level) */}
                <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                  <span className="font-bold text-[#1E3A8A] block">
                    {headings.skills} (نص مفصول بفواصل — بدون أشرطة نسب)
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="مثال: Excel"
                      className={`flex-1 min-h-[34px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                    />
                    <input
                      type="text"
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(e.target.value)}
                      placeholder="متقدم"
                      className={`w-24 min-h-[34px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                    />
                    <button
                      type="button"
                      disabled={!newSkillName.trim()}
                      onClick={() => {
                        updateActiveCv({
                          ...activeCv,
                          skills: [
                            ...activeCv.skills,
                            {
                              id: `sk-${Date.now()}`,
                              name: newSkillName.trim(),
                              level: newSkillLevel.trim(),
                            },
                          ],
                        });
                        setNewSkillName('');
                      }}
                      className={`min-h-[34px] px-3 bg-[#2563EB] text-white font-bold cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
                    >
                      إضافة
                    </button>
                  </div>
                  <div className="space-y-1">
                    {activeCv.skills.map((sk, skIdx) => (
                      <div
                        key={sk.id}
                        className={`px-2 py-1 border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-1.5 ${buttonRadiusClass}`}
                      >
                        <input
                          type="text"
                          value={sk.name}
                          onChange={(e) =>
                            updateActiveCv({
                              ...activeCv,
                              skills: activeCv.skills.map((x) =>
                                x.id === sk.id ? { ...x, name: e.target.value } : x
                              ),
                            })
                          }
                          className="flex-1 min-h-[28px] px-2 bg-white border border-[#CBD5E1] rounded"
                        />
                        <input
                          type="text"
                          value={sk.level}
                          onChange={(e) =>
                            updateActiveCv({
                              ...activeCv,
                              skills: activeCv.skills.map((x) =>
                                x.id === sk.id ? { ...x, level: e.target.value } : x
                              ),
                            })
                          }
                          placeholder="المستوى"
                          className="w-20 min-h-[28px] px-1.5 bg-white border border-[#CBD5E1] rounded"
                        />
                        <button
                          type="button"
                          disabled={skIdx === 0}
                          onClick={() =>
                            updateActiveCv({
                              ...activeCv,
                              skills: swapOrder(activeCv.skills, skIdx, -1),
                            })
                          }
                          className="p-0.5 text-[#475569] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={skIdx === activeCv.skills.length - 1}
                          onClick={() =>
                            updateActiveCv({
                              ...activeCv,
                              skills: swapOrder(activeCv.skills, skIdx, 1),
                            })
                          }
                          className="p-0.5 text-[#475569] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveCv({
                              ...activeCv,
                              skills: activeCv.skills.filter((x) => x.id !== sk.id),
                            })
                          }
                          className="text-[#DC2626] font-bold px-1 cursor-pointer"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5 & 6 & 7: Certifications, Languages, Trainings */}
                <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1E3A8A]">{headings.certifications}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveCv({
                          ...activeCv,
                          certifications: [
                            ...activeCv.certifications,
                            {
                              id: `cert-${Date.now()}`,
                              name: '[ ... ]',
                              issuer: '[ ... ]',
                              date: '01/2024',
                            },
                          ],
                        })
                      }
                      className="text-[#2563EB] font-bold cursor-pointer"
                    >
                      + إضافة شهادة
                    </button>
                  </div>
                  {activeCv.certifications.map((c, cIdx) => (
                    <div key={c.id} className="grid grid-cols-12 gap-1 items-center">
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) =>
                          updateActiveCv({
                            ...activeCv,
                            certifications: activeCv.certifications.map((x) =>
                              x.id === c.id ? { ...x, name: e.target.value } : x
                            ),
                          })
                        }
                        className={`col-span-4 min-h-[34px] px-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                      <input
                        type="text"
                        value={c.issuer}
                        onChange={(e) =>
                          updateActiveCv({
                            ...activeCv,
                            certifications: activeCv.certifications.map((x) =>
                              x.id === c.id ? { ...x, issuer: e.target.value } : x
                            ),
                          })
                        }
                        className={`col-span-3 min-h-[34px] px-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                      <input
                        type="text"
                        value={c.date}
                        onChange={(e) =>
                          updateActiveCv({
                            ...activeCv,
                            certifications: activeCv.certifications.map((x) =>
                              x.id === c.id ? { ...x, date: e.target.value } : x
                            ),
                          })
                        }
                        className={`col-span-2 min-h-[34px] px-1.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                      <button
                        type="button"
                        disabled={cIdx === 0}
                        onClick={() =>
                          updateActiveCv({
                            ...activeCv,
                            certifications: swapOrder(activeCv.certifications, cIdx, -1),
                          })
                        }
                        title="أعلى"
                        className="col-span-1 p-1 text-[#475569] disabled:opacity-30 cursor-pointer flex justify-center"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={cIdx === activeCv.certifications.length - 1}
                        onClick={() =>
                          updateActiveCv({
                            ...activeCv,
                            certifications: swapOrder(activeCv.certifications, cIdx, 1),
                          })
                        }
                        title="أسفل"
                        className="col-span-1 p-1 text-[#475569] disabled:opacity-30 cursor-pointer flex justify-center"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateActiveCv({
                            ...activeCv,
                            certifications: activeCv.certifications.filter((x) => x.id !== c.id),
                          })
                        }
                        className="col-span-1 text-[#DC2626] font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <span className="font-bold text-[#1E3A8A]">{headings.languages}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveCv({
                          ...activeCv,
                          languages: [
                            ...activeCv.languages,
                            { id: `lang-${Date.now()}`, name: '[ ... ]', proficiency: 'جيد' },
                          ],
                        })
                      }
                      className="text-[#2563EB] font-bold cursor-pointer"
                    >
                      + إضافة لغة
                    </button>
                  </div>
                  {activeCv.languages.map((l, lIdx) => (
                    <div key={l.id} className="grid grid-cols-12 gap-1 items-center">
                      <input
                        type="text"
                        value={l.name}
                        onChange={(e) =>
                          updateActiveCv({
                            ...activeCv,
                            languages: activeCv.languages.map((x) =>
                              x.id === l.id ? { ...x, name: e.target.value } : x
                            ),
                          })
                        }
                        className={`col-span-5 min-h-[34px] px-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                      <input
                        type="text"
                        value={l.proficiency}
                        onChange={(e) =>
                          updateActiveCv({
                            ...activeCv,
                            languages: activeCv.languages.map((x) =>
                              x.id === l.id ? { ...x, proficiency: e.target.value } : x
                            ),
                          })
                        }
                        className={`col-span-4 min-h-[34px] px-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                      <button
                        type="button"
                        disabled={lIdx === 0}
                        onClick={() =>
                          updateActiveCv({
                            ...activeCv,
                            languages: swapOrder(activeCv.languages, lIdx, -1),
                          })
                        }
                        title="أعلى"
                        className="col-span-1 p-1 text-[#475569] disabled:opacity-30 cursor-pointer flex justify-center"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={lIdx === activeCv.languages.length - 1}
                        onClick={() =>
                          updateActiveCv({
                            ...activeCv,
                            languages: swapOrder(activeCv.languages, lIdx, 1),
                          })
                        }
                        title="أسفل"
                        className="col-span-1 p-1 text-[#475569] disabled:opacity-30 cursor-pointer flex justify-center"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateActiveCv({
                            ...activeCv,
                            languages: activeCv.languages.filter((x) => x.id !== l.id),
                          })
                        }
                        className="col-span-1 text-[#DC2626] font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <span className="font-bold text-[#1E3A8A]">{headings.training}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveCv({
                          ...activeCv,
                          trainings: [
                            ...activeCv.trainings,
                            {
                              id: `trn-${Date.now()}`,
                              title: '[ ... ]',
                              provider: '[ ... ]',
                              dateRange: '01/2024 - 02/2024',
                            },
                          ],
                        })
                      }
                      className="text-[#2563EB] font-bold cursor-pointer"
                    >
                      + إضافة دورة
                    </button>
                  </div>
                  {activeCv.trainings.map((t, tIdx) => (
                    <div key={t.id} className="grid grid-cols-12 gap-1 items-center">
                      <input
                        type="text"
                        value={t.title}
                        onChange={(e) =>
                          updateActiveCv({
                            ...activeCv,
                            trainings: activeCv.trainings.map((x) =>
                              x.id === t.id ? { ...x, title: e.target.value } : x
                            ),
                          })
                        }
                        className={`col-span-4 min-h-[34px] px-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                      <input
                        type="text"
                        value={t.provider}
                        onChange={(e) =>
                          updateActiveCv({
                            ...activeCv,
                            trainings: activeCv.trainings.map((x) =>
                              x.id === t.id ? { ...x, provider: e.target.value } : x
                            ),
                          })
                        }
                        className={`col-span-3 min-h-[34px] px-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                      <input
                        type="text"
                        value={t.dateRange}
                        onChange={(e) =>
                          updateActiveCv({
                            ...activeCv,
                            trainings: activeCv.trainings.map((x) =>
                              x.id === t.id ? { ...x, dateRange: e.target.value } : x
                            ),
                          })
                        }
                        className={`col-span-2 min-h-[34px] px-1.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      />
                      <button
                        type="button"
                        disabled={tIdx === 0}
                        onClick={() =>
                          updateActiveCv({
                            ...activeCv,
                            trainings: swapOrder(activeCv.trainings, tIdx, -1),
                          })
                        }
                        title="أعلى"
                        className="col-span-1 p-1 text-[#475569] disabled:opacity-30 cursor-pointer flex justify-center"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={tIdx === activeCv.trainings.length - 1}
                        onClick={() =>
                          updateActiveCv({
                            ...activeCv,
                            trainings: swapOrder(activeCv.trainings, tIdx, 1),
                          })
                        }
                        title="أسفل"
                        className="col-span-1 p-1 text-[#475569] disabled:opacity-30 cursor-pointer flex justify-center"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateActiveCv({
                            ...activeCv,
                            trainings: activeCv.trainings.filter((x) => x.id !== t.id),
                          })
                        }
                        className="col-span-1 text-[#DC2626] font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: IMPORT OLD CV (CLEAN WHITE CARD) */}
            {activeTab === 'import-old' && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] text-[11.5px] leading-relaxed">
                  ارفع سيرتك الذاتية القديمة (PDF، Word، صورة واضحة، أو نص منسوخ) لاستخراج جميع
                  البيانات تلقائياً وتعبئة الحقول، مع مراجعة البيانات وتأكيدها قبل التطبيق.
                </div>

                {importFeedback && (
                  <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] space-y-1.5">
                    <div className="font-bold">
                      تم استخراج [{importFeedback.extractedCount}] حقل بنجاح من الملف السابق.
                    </div>
                    {importFeedback.missingFields.length > 0 && (
                      <div className="text-[11px] text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded p-2">
                        لم يتم التعرف على [{importFeedback.missingFields.join('، ')}]، برجاء إدخاله يدوياً.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => onTabChange('new-cv')}
                      className={`min-h-[32px] px-3 bg-[#059669] text-white font-bold cursor-pointer ${buttonRadiusClass}`}
                    >
                      تعديل الحقول المستخرجة الآن
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => triggerMenuAction('import-cv')}
                  className={`w-full min-h-[46px] px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer ${buttonRadiusClass}`}
                >
                  <Upload className="w-4 h-4" />
                  <span>رفع واستيراد سيرة ذاتية قديمة</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => triggerMenuAction('import-pdf')}
                    className={`min-h-[40px] px-3 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[#0F172A] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <FileText className="w-4 h-4 text-[#DC2626]" />
                    <span>من ملف PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerMenuAction('import-word')}
                    className={`min-h-[40px] px-3 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[#0F172A] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
                    <span>من ملف Word</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerMenuAction('import-image')}
                    className={`min-h-[40px] px-3 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[#0F172A] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <FileImage className="w-4 h-4 text-[#D97706]" />
                    <span>من صورة CV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerMenuAction('import-certs')}
                    className={`min-h-[40px] px-3 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[#0F172A] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <Award className="w-4 h-4 text-[#059669]" />
                    <span>شهادات ووثائق</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => triggerMenuAction('import-photo')}
                  className={`w-full min-h-[38px] px-3 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#334155] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                >
                  <ImagePlus className="w-4 h-4 text-[#7C3AED]" />
                  <span>إدارة الصورة الشخصية (اختياري)</span>
                </button>
              </div>
            )}

            {/* TAB 3: ATS TEMPLATES */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E3A8A]">
                    جميع قوالب CV مطبّق عليها ATS 100%
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setArCv(createBlankCvData('ar'));
                      setEnCv(createBlankCvData('en'));
                      onNotify('تم إنشاء سيرة ذاتية فارغة متوافقة مع ATS');
                    }}
                    className={`min-h-[32px] px-2.5 bg-[#059669] text-white font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <FilePlus2 className="w-3.5 h-3.5" />
                    <span>نموذج فارغ [ ... ]</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {ATS_CV_TEMPLATES.map((tpl) => {
                    const active = templateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl.id)}
                        className={`w-full p-3 border text-right cursor-pointer transition-colors ${buttonRadiusClass}`}
                        style={{
                          backgroundColor: active ? '#EFF6FF' : '#F8FAFC',
                          borderColor: active ? '#2563EB' : '#CBD5E1',
                        }}
                      >
                        <div className="flex items-center justify-between font-bold text-[#0F172A]">
                          <span>{tpl.nameAr}</span>
                          {active && <Check className="w-4 h-4 text-[#2563EB]" />}
                        </div>
                        <div className="text-[11px] text-[#475569] mt-0.5">
                          {tpl.descriptionAr}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: SAVED CVs */}
            {activeTab === 'saved' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-[#0F172A]">
                    سيرتي المحفوظة ({savedCvs.length})
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSaveCurrentCv}
                      className={`min-h-[34px] px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ CV الحالي</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCvJson}
                      title="تصدير نسخة احتياطية JSON"
                      className={`min-h-[34px] px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] text-[#334155] font-semibold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>JSON</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#EFF6FF] text-[#1E3A8A] border-b border-[#BFDBFE]">
                        <th className="py-2 px-2.5 font-bold">الاسم / المسمى</th>
                        <th className="py-2 px-2.5 font-bold">التاريخ</th>
                        <th className="py-2 px-2.5 font-bold text-left">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {savedCvs.map((rec) => (
                        <tr key={rec.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-2 px-2.5 font-semibold">{rec.name}</td>
                          <td className="py-2 px-2.5 text-[#64748B]">{rec.updatedAt}</td>
                          <td className="py-2 px-2.5 text-left">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setArCv(rec.arData);
                                  setEnCv(rec.enData);
                                  setTemplateId(rec.templateId);
                                  setCvLanguage(rec.language);
                                  onNotify(`تم فتح: ${rec.name}`);
                                }}
                                className="px-2 py-1 bg-[#EFF6FF] text-[#1E3A8A] rounded font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <FolderOpen className="w-3 h-3" />
                                <span>فتح</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteCvRecord(rec.id)}
                                title="حذف السيرة المحفوظة"
                                className="px-1.5 py-1 text-[#DC2626] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {savedCvs.length === 0 && (
                    <div className="p-4 text-center text-[#64748B]">
                      لا توجد نسخ محفوظة بعد — اضغط «حفظ CV الحالي» لحفظ نسختك هنا بأمان.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: EXPORT PDF & ATS FORMATS */}
            {activeTab === 'export-pdf' && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4" />
                    <span>جاهز للتصدير والطباعة بنظام ATS ({atsAudit.score}%)</span>
                  </div>
                  <div className="text-[11px]">
                    تُصدَّر السيرة الذاتية بعمود واحد وخط قياسي واضح وقابل للنسخ والفرز التلقائي.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className={`w-full min-h-[44px] px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer ${buttonRadiusClass}`}
                >
                  <Printer className="w-4 h-4" />
                  <span>تصدير PDF / طباعة A4 الآن</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportWord}
                  className={`w-full min-h-[40px] px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center justify-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                >
                  <FileText className="w-4 h-4" />
                  <span>تصدير Word متوافق مع ATS (.docx)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleExportTxt}
                    className={`min-h-[38px] px-3 bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <FileText className="w-3.5 h-3.5 text-[#475569]" />
                    <span>ملف نصي (TXT)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPlainText}
                    className={`min-h-[38px] px-3 bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <Copy className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>نسخ النص بالكامل</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setAtsModalOpen(true)}
                  className={`w-full min-h-[38px] px-3 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>عرض تقرير فحص ATS التفصيلي</span>
                </button>
              </div>
            )}

            {/* TAB 6: TARGET ORGANIZATION & CAREER SECTOR */}
            {activeTab === 'target-sector' && (
              <CvTargetSectorPanel
                cv={activeCv}
                language={cvLanguage}
                buttonRadiusClass={buttonRadiusClass}
                onUpdateCv={updateActiveCv}
                onNotify={onNotify}
              />
            )}

            {/* TAB 7: JOB ADVERTISEMENT ATTACHMENT & KEYWORD MATCHING */}
            {activeTab === 'job-ad' && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] text-[11px] leading-relaxed">
                  أرفق ملف إعلان الوظيفة (PDF / Word / صورة / نص) أو ألصق الوصف الوظيفي لاستخراج
                  الكلمات المفتاحية ومطابقتها مع مهاراتك الحقيقية فقط — لن يتم اختراع أي مهارة غير مؤكدة منك.
                </div>

                {/* Job Ad File Upload */}
                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-dashed border-[#93C5FD] space-y-2">
                  <input
                    ref={jobAdFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.txt,.md"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadJobAdFile(f);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>إرفاق ملف إعلان الوظيفة</span>
                    </span>
                    <button
                      type="button"
                      disabled={jobAdFileBusy}
                      onClick={() => jobAdFileInputRef.current?.click()}
                      className={`min-h-[34px] px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${buttonRadiusClass}`}
                    >
                      {jobAdFileBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>رفع ملف الإعلان</span>
                    </button>
                  </div>
                  {jobAdFileName && (
                    <div className="text-[11px] text-[#047857] font-semibold">
                      الملف المرفق: {jobAdFileName}
                    </div>
                  )}
                  {jobAdFileError && (
                    <div className="text-[11px] text-[#B91C1C] font-semibold">
                      {jobAdFileError}
                    </div>
                  )}
                  {jobAdExtractedKeywords.length > 0 && (
                    <div className="text-[11px] text-[#1E3A8A]">
                      كلمات مستخرجة من الإعلان: {jobAdExtractedKeywords.join(' ، ')}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold mb-1">نص إعلان الوظيفة (Job Description)</label>
                  <textarea
                    ref={jobAdTextareaRef}
                    rows={5}
                    value={activeCv.jobDescriptionText}
                    onChange={(e) =>
                      updateActiveCv({ ...activeCv, jobDescriptionText: e.target.value })
                    }
                    placeholder="ألصق نص الإعلان الوظيفي أو المتطلبات هنا (عربي أو إنجليزي)..."
                    className={`w-full p-2.5 border border-[#CBD5E1] leading-relaxed ${buttonRadiusClass}`}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="font-bold text-[#0F172A]">
                    المسمى الوظيفي: {activeCv.targetJobTitle || '[ ... ]'}
                  </span>
                  <button
                    type="button"
                    onClick={handleEnsureJobTitleInSummary}
                    className={`min-h-[32px] px-3 bg-[#2563EB] text-white font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>تأكيد المسمى بالملخص</span>
                  </button>
                </div>

                {keywordAnalysis.extractedCount > 0 && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
                      <div className="font-bold text-[#065F46] mb-1.5">
                        متطابق بالفعل مع سيرتك ({keywordAnalysis.matchedInCv.length}):
                      </div>
                      <p className="text-[11.5px] text-[#047857]">
                        {keywordAnalysis.matchedInCv.length > 0
                          ? keywordAnalysis.matchedInCv.join(' ، ')
                          : 'لا توجد كلمات متطابقة بعد.'}
                      </p>
                    </div>

                    {keywordAnalysis.unmatchedFromJd.length > 0 && (
                      <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] space-y-2">
                        <div className="font-bold text-[#92400E]">
                          كلمات من الوصف الوظيفي — حدد فقط المهارات التي تمتلكها فعلاً:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {keywordAnalysis.unmatchedFromJd.map((kw) => {
                            const checked = confirmedJdKeywords.includes(kw);
                            return (
                              <label
                                key={kw}
                                className={`px-2.5 py-1 border inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                                style={{
                                  backgroundColor: checked ? '#EFF6FF' : '#FFFFFF',
                                  borderColor: checked ? '#2563EB' : '#FCD34D',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    setConfirmedJdKeywords((prev) =>
                                      prev.includes(kw)
                                        ? prev.filter((x) => x !== kw)
                                        : [...prev, kw]
                                    )
                                  }
                                  className="accent-[#2563EB]"
                                />
                                <span>{kw}</span>
                              </label>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          disabled={confirmedJdKeywords.length === 0}
                          onClick={handleAddConfirmedKeywords}
                          className={`min-h-[36px] px-3.5 bg-[#2563EB] text-white font-bold cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
                        >
                          إضافة المهارات المؤكدة لقسم المهارات ({confirmedJdKeywords.length})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Right/Left A4 ATS Preview Stage */}
        <div
          ref={previewStageRef}
          className="print-container flex-1 w-full min-w-0 bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-3 md:p-5 flex flex-col items-center"
        >
          <div className="no-print w-full max-w-[794px] mb-3 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="w-4 h-4"
                style={{ color: atsAudit.score >= 90 ? '#059669' : '#2563EB' }}
              />
              <span className="font-bold text-[#0F172A]">
                حالة التوافق مع أنظمة ATS: {atsAudit.score}%
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAtsModalOpen(true)}
              className="font-bold text-[#2563EB] hover:underline cursor-pointer"
            >
              عرض تفاصيل فحص ATS الكامل
            </button>
          </div>

          <div
            className="print-container w-full flex justify-center overflow-x-auto pb-2"
            style={{
              minHeight: `${Math.ceil(1123 * previewScale) + 24}px`,
            }}
          >
            <div
              className="print-container origin-top transition-transform duration-150 ease-out"
              style={{
                width: `${A4_WIDTH_PX}px`,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top center',
              }}
            >
              <CvAtsDocument
                cv={activeCv}
                language={cvLanguage}
                templateId={templateId}
                docRef={cvDocRef}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet for [ ☰ استيراد وإضافة ] */}
      {importMenuOpen && (
        <div
          onClick={() => setImportMenuOpen(false)}
          className="no-print sm:hidden fixed inset-0 z-50 bg-black/45 flex items-end justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white rounded-t-2xl border-t border-[#CBD5E1] shadow-2xl p-4 pb-6 space-y-2 max-h-[82vh] overflow-y-auto text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <span className="font-editorial font-bold text-sm text-[#0F172A]">
                استيراد وإضافة وتصدير CV
              </span>
              <button
                type="button"
                onClick={() => setImportMenuOpen(false)}
                className="p-1.5 rounded-lg bg-[#F1F5F9] text-[#334155]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {(
              [
                ['import-cv', 'استيراد CV قديم', Upload],
                ['import-certs', 'استيراد شهادات ووثائق', Award],
                ['import-photo', 'استيراد صورة شخصية للـ CV', ImagePlus],
                ['attach-job-ad', 'إرفاق إعلان الوظيفة', Paperclip],
                ['set-target-sector', 'تحديد الجهة والمجال', Building2],
                ['manual-edit', 'إضافة بيانات يدوية', Edit3],
                ['import-word', 'استيراد من ملف Word', FileSpreadsheet],
                ['import-pdf', 'استيراد من ملف PDF', FileText],
                ['import-image', 'استيراد من صورة', FileImage],
              ] as [CvMenuActionId, string, React.ComponentType<{ className?: string }>][]
            ).map(([actionId, label, Icon]) => (
              <button
                key={actionId}
                type="button"
                onClick={() => triggerMenuAction(actionId)}
                className="w-full min-h-[42px] px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-bold flex items-center gap-2.5"
              >
                <Icon className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>{label}</span>
              </button>
            ))}
            <div className="pt-2 border-t border-[#E2E8F0] grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportMenuOpen(false);
                  handleSaveCurrentCv();
                }}
                className="min-h-[40px] px-3 rounded-lg bg-[#2563EB] text-white font-bold"
              >
                حفظ CV
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportMenuOpen(false);
                  handleExportWord();
                }}
                className="min-h-[40px] px-3 rounded-lg bg-[#EFF6FF] text-[#1E3A8A] border border-[#BFDBFE] font-bold"
              >
                تصدير Word ATS
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportMenuOpen(false);
                  handleCopyPlainText();
                }}
                className="min-h-[40px] px-3 rounded-lg bg-white text-[#0F172A] border border-[#CBD5E1] font-bold"
              >
                نسخ النص
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportMenuOpen(false);
                  window.print();
                }}
                className="min-h-[40px] px-3 rounded-lg bg-[#4F46E5] text-white font-bold"
              >
                طباعة / PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATS Check Popup Modal */}
      <AtsCheckModal
        open={atsModalOpen}
        onClose={() => setAtsModalOpen(false)}
        audit={atsAudit}
        buttonRadiusClass={buttonRadiusClass}
        onApplySafeFixes={() => {
          updateActiveCv(applySafeAtsFixes(activeCv, cvLanguage));
          onNotify('تم توحيد صيغة التواريخ وتوضيح الاختصارات وإخفاء الصور بنجاح');
        }}
        onGoToKeywordsTab={() => onTabChange('job-ad')}
      />

      {/* Old CV Import & Auto-Fill Modal */}
      <CvImportModal
        open={cvImportModalOpen}
        onClose={() => setCvImportModalOpen(false)}
        presetFilter={cvImportFilter}
        language={cvLanguage}
        currentCv={activeCv}
        buttonRadiusClass={buttonRadiusClass}
        onApplyExtractedCv={(cvData, extractedCount, missingFields) => {
          updateActiveCv(cvData);
          setImportFeedback({ extractedCount, missingFields });
          onTabChange('new-cv');
          onNotify(`تم استخراج [${extractedCount}] حقل وملء CV بنجاح`);
          setTimeout(() => {
            previewStageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 120);
        }}
      />

      {/* Multi-Certificate & Documents Import Modal */}
      <CvCertificatesModal
        open={certsModalOpen}
        onClose={() => setCertsModalOpen(false)}
        language={cvLanguage}
        buttonRadiusClass={buttonRadiusClass}
        onAddCertificateToCv={handleAddCertificateToCv}
      />

      {/* Optional Personal Photo Import Modal */}
      <CvPhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        currentPhotoUrl={activeCv.personalPhotoDataUrl}
        currentShowPhoto={Boolean(activeCv.showPhotoInCv)}
        buttonRadiusClass={buttonRadiusClass}
        onSavePhoto={(photoUrl, showInCv) => {
          updateActiveCv({
            ...activeCv,
            personalPhotoDataUrl: photoUrl,
            showPhotoInCv: showInCv,
          });
          onNotify(
            photoUrl
              ? showInCv
                ? 'تم حفظ وإظهار الصورة الشخصية في المعاينة'
                : 'تم حفظ الصورة وإخفاؤها للتوافق التام مع ATS'
              : 'تمت إزالة الصورة الشخصية'
          );
        }}
      />
    </div>
  );
};
