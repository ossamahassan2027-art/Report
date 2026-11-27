import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  FilePlus2,
  FolderOpen,
  GitCompare,
  History,
  Image as ImageIcon,
  Mic,
  MicOff,
  Pin,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import {
  LIBRARY_CATEGORIES,
  LIBRARY_CONDITIONS,
  LIBRARY_FOLDERS,
  LibraryCard,
  LibraryCategory,
  LibraryCondition,
  LibraryFolderId,
  SmartExtractionResult,
} from '../types/library';
import { prepareFileForExtraction } from '../utils/cvFileParser';
import { extractRawTextLocally, extractTextWithTesseract } from '../utils/cvLocalParser';
import {
  analyzeComplaintLocally,
  AssistantAnalysisResult,
  exportFolderCardsToHtml,
  exportLibraryToJson,
  exportPortableSingleFileHtml,
  extractActivitiesOnlyText,
  extractGoalsOnlyText,
  extractRecommendationsOnlyText,
  formatCardAsText,
  LibraryAutoBackupSnapshot,
  parseImportedLibraryJson,
  searchAndFilterLibraryCards,
} from '../utils/libraryEngine';
import {
  enhanceImageFileForOcr,
  FIXED_SCIENTIFIC_GLOSSARY,
  LearnedCorrectionEntry,
  loadLearnedCorrections,
  rebuildExtractionStatsFromLines,
  recordLearnedCorrection,
  runSmartAttachmentExtraction,
} from '../utils/smartLibraryExtractor';
import { copyTextToClipboard } from '../utils/storageAndBackup';

type LibrarySubTab = 'cards' | 'folders' | 'assistant' | 'extractor' | 'compare';

interface SmartLibraryStudioProps {
  buttonRadiusClass: string;
  libraryCards: LibraryCard[];
  activeCardId: string | null;
  backupsList: LibraryAutoBackupSnapshot[];
  onSetActiveCardId: (id: string | null) => void;
  onTogglePin: (id: string) => void;
  onCopyCard: (id: string) => Promise<boolean>;
  onAddNewCard: (card: LibraryCard) => void;
  onImportCardsBatch: (cards: LibraryCard[]) => void;
  onCreateBackupNow: () => void;
  onRestoreOldBackup: (backupId?: string) => void;
  onGenerateFullPlanIntoReport: (analysis: AssistantAnalysisResult, complaintText: string) => void;
  onOpenParentReportWithComplaint: (complaintText: string) => void;
  onInsertCardIntoReport: (card: LibraryCard, mode: 'full' | 'goals' | 'activities' | 'recs') => void;
  onNotify: (msg: string) => void;
}

export const SmartLibraryStudio: React.FC<SmartLibraryStudioProps> = ({
  buttonRadiusClass,
  libraryCards,
  activeCardId,
  backupsList,
  onSetActiveCardId,
  onTogglePin,
  onCopyCard,
  onAddNewCard,
  onImportCardsBatch,
  onCreateBackupNow,
  onRestoreOldBackup,
  onGenerateFullPlanIntoReport,
  onOpenParentReportWithComplaint,
  onInsertCardIntoReport,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<LibrarySubTab>('cards');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'الكل' | LibraryCategory>('الكل');
  const [conditionFilter, setConditionFilter] = useState<'الكل' | LibraryCondition>('الكل');
  const [pinnedOnly, setPinnedOnly] = useState(false);

  // Active Folder Detail view
  const [selectedFolder, setSelectedFolder] = useState<LibraryFolderId | null>(null);

  // Assistant State
  const [complaintInput, setComplaintInput] = useState('');
  const [assistantMode, setAssistantMode] = useState<'professional' | 'simplified'>('professional');
  const [assistantResult, setAssistantResult] = useState<AssistantAnalysisResult | null>(null);

  // Compare Two Cards State
  const [compareLeftId, setCompareLeftId] = useState<string>(libraryCards[0]?.id || 'lib-01');
  const [compareRightId, setCompareRightId] = useState<string>(libraryCards[9]?.id || 'lib-10');

  // Quick New Card Modal (directly from Library or inside a Folder)
  const [quickNewModalOpen, setQuickNewModalOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickFolder, setQuickFolder] = useState<LibraryFolderId>('speech');
  const [quickCategory, setQuickCategory] = useState<LibraryCategory>('حالة');
  const [quickCondition, setQuickCondition] = useState<LibraryCondition>('تخاطب');
  const [quickAge, setQuickAge] = useState('3 - 10 سنوات');
  const [quickDefinition, setQuickDefinition] = useState('');
  const [quickGoals, setQuickGoals] = useState('');
  const [quickRecs, setQuickRecs] = useState('');
  const [quickImage, setQuickImage] = useState<string | undefined>(undefined);

  // 5-Stage SMART EXTRACTION State
  const [extractRawText, setExtractRawText] = useState('');
  const [extractFileName, setExtractFileName] = useState('');
  const [extractImagePreview, setExtractImagePreview] = useState<string | undefined>(undefined);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [extractBusy, setExtractBusy] = useState(false);
  const [extractionResult, setExtractionResult] = useState<SmartExtractionResult | null>(null);
  const [learnedRules, setLearnedRules] = useState<LearnedCorrectionEntry[]>(() =>
    loadLearnedCorrections()
  );
  const [dictating, setDictating] = useState(false);

  const importJsonInputRef = useRef<HTMLInputElement | null>(null);
  const extractFileInputRef = useRef<HTMLInputElement | null>(null);
  const quickImageInputRef = useRef<HTMLInputElement | null>(null);
  const speechRecRef = useRef<{ stop: () => void } | null>(null);

  const filteredCards = useMemo(
    () =>
      searchAndFilterLibraryCards(libraryCards, {
        query,
        category: categoryFilter,
        condition: conditionFilter,
        folder: selectedFolder || 'all',
        pinnedOnly,
      }),
    [libraryCards, query, categoryFilter, conditionFilter, selectedFolder, pinnedOnly]
  );

  const pinnedCount = useMemo(
    () => libraryCards.filter((c) => c.pinned).length,
    [libraryCards]
  );

  const activeModalCard = useMemo(
    () => (activeCardId ? libraryCards.find((c) => c.id === activeCardId) || null : null),
    [activeCardId, libraryCards]
  );

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    LIBRARY_FOLDERS.forEach((f) => {
      counts[f.id] = 0;
    });
    libraryCards.forEach((c) => {
      counts[c.folder] = (counts[c.folder] || 0) + 1;
    });
    return counts;
  }, [libraryCards]);

  // =========================================================================
  // Handlers: Assistant / Import JSON / Backup / Quick New Card
  // =========================================================================
  const handleAnalyzeComplaint = () => {
    if (!complaintInput.trim()) {
      onNotify('يرجى كتابة الشكوى أو الملاحظات السلوكية أولاً.');
      return;
    }
    const res = analyzeComplaintLocally(complaintInput, libraryCards);
    setAssistantResult(res);
    onNotify(`تم تحليل الشكوى ومطابقة أفضل ${res.top5.length} بطاقات بنسبة توافق تصل إلى ${res.top5[0]?.score || 0}%`);
  };

  const handleImportJsonFile = async (file: File) => {
    try {
      const txt = await file.text();
      const imported = parseImportedLibraryJson(txt);
      if (imported.length === 0) {
        onNotify('لم يتم العثور على بطاقات صالحة داخل الملف.');
        return;
      }
      onImportCardsBatch(imported);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'تعذر استيراد ملف المكتبة JSON.');
    }
  };

  const handleSaveQuickCard = () => {
    if (!quickTitle.trim() || !quickDefinition.trim()) {
      onNotify('يرجى إدخال عنوان البطاقة والتعريف على الأقل.');
      return;
    }
    const newCard: LibraryCard = {
      id: `lib-custom-${Date.now()}`,
      title: quickTitle.trim(),
      category: quickCategory,
      condition: quickCondition,
      folder: quickFolder,
      ageRange: quickAge.trim() || '3 - 14 سنة',
      definition: quickDefinition.trim(),
      symptoms: quickDefinition
        .split(/[.\n،]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 4)
        .slice(0, 4),
      causes: ['بيانات مدخلة وموثقة من الأخصائي'],
      differential: ['تُراعى الفروق الفردية والبيئية للحالة'],
      goals: quickGoals
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      goalsSMART: quickGoals
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      activities: [
        {
          name: `نشاط تطبيقي: ${quickTitle.trim().slice(0, 35)}`,
          tools: 'أدوات الجلسة المتاحة والبطاقات البصرية',
          steps: ['توضيح المطلوب بهدوء', 'تطبيق خطوة بخطوة مع تعزيز فوري'],
          duration: '20 دقيقة',
          success: 'تحقيق نسبة إتقان 80% عبر جلستين',
        },
      ],
      recommendationsFamily: quickRecs
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      recommendationsSchool: ['توفير تيسيرات مناسبة وبيئة صفية هادئة'],
      recommendationsSpecialist: ['متابعة التقدم كل 4 أسابيع وتحديث الأهداف'],
      measurement: 'نسبة التحقق الأسبوعي للأهداف المحددة',
      keywords: [quickCondition, quickCategory, quickTitle.trim()],
      relatedIds: [],
      source: 'بطاقة مضافة يدوياً بالمكتبة',
      image: quickImage,
      pinned: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onAddNewCard(newCard);
    setQuickNewModalOpen(false);
    setQuickTitle('');
    setQuickDefinition('');
    setQuickGoals('');
    setQuickRecs('');
    setQuickImage(undefined);
  };

  // =========================================================================
  // Handlers: 5-Stage SMART EXTRACTION
  // =========================================================================
  const processAttachmentFile = async (file: File) => {
    setLastUploadedFile(file);
    setExtractFileName(file.name);
    setExtractBusy(true);
    try {
      const prepared = await prepareFileForExtraction(file);
      let rawText = '';

      if (prepared.plainText && prepared.plainText.trim().length > 0) {
        rawText = prepared.plainText;
      } else if (prepared.kind === 'image') {
        const { previewDataUrl } = await enhanceImageFileForOcr(file);
        const ocrSrc = previewDataUrl || prepared.previewDataUrl || '';
        setExtractImagePreview(ocrSrc);
        rawText = ocrSrc ? await extractTextWithTesseract(ocrSrc) : '';
      } else {
        rawText = await extractRawTextLocally(prepared);
      }

      if (!rawText || rawText.trim().length < 5) {
        onNotify('تمت قراءة الملف، ويمكنك كتابة أو إكمال النص يدوياً بالأسفل.');
        rawText = extractRawText || '';
      }
      setExtractRawText(rawText);
      const res = runSmartAttachmentExtraction({
        rawText,
        sourceLabel: file.name,
        sourceImagePreview: prepared.previewDataUrl || extractImagePreview,
        existingCards: libraryCards,
      });
      setExtractionResult(res);
      onNotify(`اكتمل التفريغ والتحليل 5 مراحل (${res.lines.length} سطراً)`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'تعذر تفريغ الملف.');
    } finally {
      setExtractBusy(false);
    }
  };

  const handleRunTextExtraction5Stages = () => {
    if (!extractRawText.trim()) {
      onNotify('يرجى لصق النص أو رفع ملف مرفق أولاً.');
      return;
    }
    const res = runSmartAttachmentExtraction({
      rawText: extractRawText,
      sourceLabel: extractFileName || 'نص ملصق / إملاء صوتي',
      sourceImagePreview: extractImagePreview,
      existingCards: libraryCards,
    });
    setExtractionResult(res);
    onNotify('تم تمرير النص على المراحل الخمس للتنظيف وفحص الجودة');
  };

  const handleToggleVoiceDictation = () => {
    if (dictating && speechRecRef.current) {
      speechRecRef.current.stop();
      setDictating(false);
      return;
    }
    const SR =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SR) {
      onNotify('المتصفح الحالي لا يدعم الإملاء الصوتي التلقائي؛ يمكنك الكتابة أو رفع الملف.');
      return;
    }
    const rec = new SR() as {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: (ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
    rec.lang = 'ar-EG';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (ev) => {
      let chunk = '';
      for (let i = 0; i < ev.results.length; i++) {
        chunk += `${ev.results[i][0].transcript}\n`;
      }
      setExtractRawText((prev) => `${prev ? `${prev}\n` : ''}${chunk.trim()}`);
    };
    rec.onerror = () => setDictating(false);
    rec.onend = () => setDictating(false);
    speechRecRef.current = rec;
    setDictating(true);
    rec.start();
    onNotify('بدأ الإملاء الصوتي بالعربية... تحدث الآن');
  };

  const handleEditExtractedLine = (lineId: string, newCleaned: string) => {
    if (!extractionResult) return;
    const prevLine = extractionResult.lines.find((l) => l.id === lineId);
    if (prevLine && prevLine.cleanedText !== newCleaned.trim() && newCleaned.trim()) {
      const updatedLog = recordLearnedCorrection(prevLine.cleanedText, newCleaned.trim());
      setLearnedRules(updatedLog);
    }
    const nextLines = extractionResult.lines.map((l) =>
      l.id === lineId
        ? {
            ...l,
            cleanedText: newCleaned,
            confidence: newCleaned.trim().length >= 3 ? ('confirmed' as const) : ('unclear' as const),
            accepted: true,
          }
        : l
    );
    const stats = rebuildExtractionStatsFromLines(nextLines);
    setExtractionResult({
      ...extractionResult,
      lines: nextLines,
      ...stats,
    });
  };

  const handleSaveExtractedCard = () => {
    if (!extractionResult) return;
    if (extractionResult.qualityBlocked) {
      onNotify(
        `بوابة الجودة: يوجد ${extractionResult.unclearCount} سطور غير واضحة (أكثر من 3). يرجى مراجعتها وتصحيحها قبل الحفظ.`
      );
      return;
    }
    const cleanCard: LibraryCard = {
      ...extractionResult.suggestedCard,
      id: `lib-ext-${Date.now()}`,
      image: extractionResult.sourceImagePreview,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onAddNewCard(cleanCard);
    setExtractionResult(null);
    setExtractRawText('');
    setExtractFileName('');
    setExtractImagePreview(undefined);
    setSubTab('cards');
  };

  const compareCardA = libraryCards.find((c) => c.id === compareLeftId) || libraryCards[0];
  const compareCardB = libraryCards.find((c) => c.id === compareRightId) || libraryCards[1];

  return (
    <div className="space-y-4">
      {/* Top Library Banner & Live Counter + Backup Controls */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-[#0A1633] text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-editorial text-lg font-bold text-[#0F172A]">
                  📚 المكتبة الذكية التخصصية
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-[#DBEAFE] text-[#1E3A8A] text-xs font-extrabold">
                  عندك {libraryCards.length} بطاقة
                </span>
                {pinnedCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] text-xs font-bold inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>مثبتة: {pinnedCount}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B]">
                بحث شامل في كل سطر · 8 ملفات تخصصية مستقلة · مساعد آلي بمرادفات عامية · محرك تفريغ مرفقات 5 مراحل · تقارير موثقة
              </p>
            </div>
          </div>

          {/* Primary Action Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenParentReportWithComplaint(complaintInput)}
              className={`min-h-[36px] px-3 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>📄 تقرير جديد (15 قسم)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setQuickFolder(selectedFolder || 'speech');
                setQuickNewModalOpen(true);
              }}
              className={`min-h-[36px] px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة بطاقة</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('extractor')}
              className={`min-h-[36px] px-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>تفريغ مرفق (5 مراحل)</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Navigation + JSON Export / Import / Restore Backup */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['cards', `البطاقات (${libraryCards.length})`, BookOpen],
                ['folders', 'ملفات التخصصات (8)', FolderOpen],
                ['assistant', 'المساعد الآلي والشكوى', Sparkles],
                ['extractor', 'تفريغ وتصحيح المرفقات', Wand2],
                ['compare', 'مقارنة بطاقتين', GitCompare],
              ] as [LibrarySubTab, string, React.ComponentType<{ className?: string }>][]
            ).map(([tid, lbl, Icon]) => {
              const active = subTab === tid;
              return (
                <button
                  key={tid}
                  type="button"
                  onClick={() => setSubTab(tid)}
                  className={`min-h-[36px] px-3 text-xs font-bold border inline-flex items-center gap-1.5 cursor-pointer transition-colors ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: active ? '#0A1633' : '#F8FAFC',
                    color: active ? '#FFFFFF' : '#1E293B',
                    borderColor: active ? '#0A1633' : '#CBD5E1',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{lbl}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => exportLibraryToJson(libraryCards)}
              className={`min-h-[32px] px-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0F172A] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
              title="تصدير كافة البطاقات بصيغة JSON"
            >
              <Download className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>تصدير JSON</span>
            </button>

            <button
              type="button"
              onClick={() => importJsonInputRef.current?.click()}
              className={`min-h-[32px] px-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0F172A] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
              title="استيراد بطاقات JSON وإضافتها للمكتبة"
            >
              <Upload className="w-3.5 h-3.5 text-[#059669]" />
              <span>استيراد JSON</span>
            </button>
            <input
              ref={importJsonInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportJsonFile(f);
                e.currentTarget.value = '';
              }}
            />

            <button
              type="button"
              onClick={() => exportPortableSingleFileHtml(libraryCards)}
              className={`min-h-[32px] px-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0F172A] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
              title="تنزيل المكتبة التفاعلية في ملف HTML واحد يعمل بدون إنترنت"
            >
              <Download className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>ملف واحد HTML</span>
            </button>

            <button
              type="button"
              onClick={onCreateBackupNow}
              className={`min-h-[32px] px-2.5 bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-[#DBEAFE] text-[#1E3A8A] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
              title="حفظ نسخة احتياطية فورية في المتصفح"
            >
              <Save className="w-3.5 h-3.5" />
              <span>نسخ احتياطي</span>
            </button>

            <button
              type="button"
              onClick={() => onRestoreOldBackup(backupsList[0]?.id)}
              className={`min-h-[32px] px-2.5 bg-[#FFFBEB] border border-[#FCD34D] hover:bg-[#FEF3C7] text-[#92400E] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
              title="استعادة النسخة القديمة المحفوظة تلقائياً قبل التعديل"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة النسخة القديمة</span>
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: CARDS BROWSER + SEARCH + ALL CATEGORY & CONDITION FILTERS    */}
      {/* =================================================================== */}
      {subTab === 'cards' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-4 md:p-5 space-y-3.5">
          {selectedFolder && (
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-[#1E3A8A]">
                ملف التخصص النشط: {LIBRARY_FOLDERS.find((f) => f.id === selectedFolder)?.title}
              </div>
              <button
                type="button"
                onClick={() => setSelectedFolder(null)}
                className={`px-3 py-1 bg-white border border-[#93C5FD] text-[#1E3A8A] text-[11px] font-bold cursor-pointer ${buttonRadiusClass}`}
              >
                عرض كل الملفات (81+)
              </button>
            </div>
          )}

          {/* Instant Full-Card Search Box */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-[#64748B] absolute right-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث فوري في أي سطر داخل أي بطاقة (أعراض، أسباب، SMART، نشاط، توصية، مقياس، مصدر)..."
                className={`w-full min-h-[38px] pr-9 pl-8 text-xs bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white focus:outline-none ${buttonRadiusClass}`}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="مسح البحث"
                  className="absolute left-2.5 top-2.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPinnedOnly((p) => !p)}
              className={`min-h-[38px] px-3 text-xs font-bold border inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
              style={{
                backgroundColor: pinnedOnly ? '#FEF3C7' : '#FFFFFF',
                borderColor: pinnedOnly ? '#F59E0B' : '#CBD5E1',
                color: pinnedOnly ? '#92400E' : '#334155',
              }}
            >
              <Star className={`w-3.5 h-3.5 ${pinnedOnly ? 'fill-current' : ''}`} />
              <span>المثبتة فقط ({pinnedCount})</span>
            </button>
          </div>

          {/* Category Filters */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-[#475569]">تصفية حسب التصنيف:</div>
            <div className="flex flex-wrap gap-1.5">
              {(['الكل', ...LIBRARY_CATEGORIES] as ('الكل' | LibraryCategory)[]).map((cat) => {
                const active = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-[11px] font-bold border cursor-pointer transition-colors ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: active ? '#2563EB' : '#F8FAFC',
                      color: active ? '#FFFFFF' : '#334155',
                      borderColor: active ? '#2563EB' : '#CBD5E1',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condition Filters */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-[#475569]">تصفية حسب الحالة:</div>
            <div className="flex flex-wrap gap-1.5">
              {(['الكل', ...LIBRARY_CONDITIONS] as ('الكل' | LibraryCondition)[]).map((cond) => {
                const active = conditionFilter === cond;
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setConditionFilter(cond)}
                    className={`px-2.5 py-1 text-[11px] font-bold border cursor-pointer transition-colors ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: active ? '#059669' : '#F8FAFC',
                      color: active ? '#FFFFFF' : '#334155',
                      borderColor: active ? '#059669' : '#CBD5E1',
                    }}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Count Bar */}
          <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
            <span>
              النتائج المعروضة: <strong className="text-[#0F172A]">{filteredCards.length}</strong> من أصل{' '}
              <strong>{libraryCards.length}</strong> بطاقة
            </span>
            {(query || categoryFilter !== 'الكل' || conditionFilter !== 'الكل' || selectedFolder || pinnedOnly) && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategoryFilter('الكل');
                  setConditionFilter('الكل');
                  setSelectedFolder(null);
                  setPinnedOnly(false);
                }}
                className="text-[#2563EB] hover:underline font-bold cursor-pointer"
              >
                إعادة ضبط جميع الفلاتر
              </button>
            )}
          </div>

          {/* Cards Grid */}
          {filteredCards.length === 0 ? (
            <div className="p-8 text-center bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1] text-xs text-[#64748B]">
              لا توجد بطاقات مطابقة للبحث الحالي. جرّب مسح بعض الفلاتر أو كتابة كلمة أبسط.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className={`p-3.5 border rounded-xl bg-white hover:shadow-md transition-all flex flex-col justify-between gap-3 ${
                    card.pinned ? 'border-[#F59E0B] bg-[#FFFBEB]/30' : 'border-[#E2E8F0]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSetActiveCardId(card.id)}
                        className="text-right font-bold text-sm text-[#1E3A8A] hover:underline cursor-pointer leading-snug"
                      >
                        {card.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => onTogglePin(card.id)}
                        aria-label={card.pinned ? 'إلغاء التثبيت' : 'تثبيت البطاقة'}
                        title={card.pinned ? 'إلغاء التثبيت ⭐' : 'تثبيت ⭐'}
                        className="p-1 rounded hover:bg-[#FEF3C7] text-[#D97706] shrink-0 cursor-pointer"
                      >
                        <Star className={`w-4 h-4 ${card.pinned ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 text-[10.5px]">
                      <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-bold">
                        {card.category}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] font-bold">
                        {card.condition}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] font-semibold">
                        {card.ageRange}
                      </span>
                    </div>

                    <p className="text-xs text-[#334155] line-clamp-3 leading-relaxed">
                      {card.definition}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[10px] text-[#64748B] truncate max-w-[150px]">
                      {card.source}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onCopyCard(card.id)}
                        className={`px-2 py-1 bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[11px] font-bold text-[#0F172A] inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                      >
                        <Copy className="w-3 h-3" />
                        <span>نسخ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSetActiveCardId(card.id)}
                        className={`px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-bold cursor-pointer ${buttonRadiusClass}`}
                      >
                        فتح البطاقة
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: 8 INDEPENDENT SPECIALTY FOLDERS (COVER + COUNT + EXPORT + ADD)*/}
      {/* =================================================================== */}
      {subTab === 'folders' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-4 md:p-5 space-y-4">
          {!selectedFolder ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {LIBRARY_FOLDERS.map((folder) => {
                const count = folderCounts[folder.id] || 0;
                return (
                  <div
                    key={folder.id}
                    className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    {/* Cover Header */}
                    <div
                      className="p-4 border-b border-[#E2E8F0]"
                      style={{ backgroundColor: folder.bgSoft }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className="text-xs font-extrabold px-2.5 py-0.5 rounded-md text-white"
                          style={{ backgroundColor: folder.accentColor }}
                        >
                          {count} بطاقة
                        </span>
                        <FolderOpen
                          className="w-5 h-5"
                          style={{ color: folder.accentColor }}
                        />
                      </div>
                      <h3 className="text-base font-extrabold text-[#0F172A]">
                        {folder.title}
                      </h3>
                      <p className="text-[11px] text-[#334155] mt-0.5">
                        {folder.coverTagline}
                      </p>
                    </div>

                    <div className="p-3.5 space-y-3">
                      <p className="text-[11.5px] text-[#475569] leading-relaxed">
                        {folder.subtitle}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedFolder(folder.id)}
                          className={`flex-1 min-h-[34px] px-2.5 text-white text-xs font-bold cursor-pointer ${buttonRadiusClass}`}
                          style={{ backgroundColor: folder.accentColor }}
                        >
                          فتح الملف
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            exportFolderCardsToHtml(folder.id, libraryCards);
                            onNotify(`تم تصدير ملف (${folder.title}) بنجاح`);
                          }}
                          className={`min-h-[34px] px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-bold cursor-pointer ${buttonRadiusClass}`}
                          title="تصدير الملف بالكامل"
                        >
                          تصدير
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickFolder(folder.id);
                            setQuickNewModalOpen(true);
                          }}
                          className={`min-h-[34px] px-2.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] text-xs font-bold cursor-pointer ${buttonRadiusClass}`}
                          title="إضافة بطاقة جديدة لهذا التخصص"
                        >
                          + بطاقة
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            (() => {
              const activeMeta = LIBRARY_FOLDERS.find((f) => f.id === selectedFolder)!;
              const folderList = libraryCards.filter((c) => c.folder === selectedFolder);
              return (
                <div className="space-y-4">
                  {/* Cover Banner inside Selected Folder */}
                  <div
                    className="p-5 rounded-2xl border border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3"
                    style={{ backgroundColor: activeMeta.bgSoft }}
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedFolder(null)}
                        className="text-xs font-bold text-[#1E3A8A] inline-flex items-center gap-1 hover:underline mb-1 cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>رجوع لكل ملفات التخصصات</span>
                      </button>
                      <h3 className="text-lg font-extrabold text-[#0F172A]">
                        ملف تخصص: {activeMeta.title} ({folderList.length} بطاقة)
                      </h3>
                      <p className="text-xs text-[#334155]">{activeMeta.subtitle}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          exportFolderCardsToHtml(activeMeta.id, libraryCards);
                          onNotify(`تم تصدير ملف ${activeMeta.title} بصيغة HTML`);
                        }}
                        className={`min-h-[36px] px-3 bg-white border border-[#CBD5E1] text-[#0F172A] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير الملف HTML</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          exportLibraryToJson(folderList, `ملف-${activeMeta.title}`);
                          onNotify(`تم تصدير ${folderList.length} بطاقة من الملف JSON`);
                        }}
                        className={`min-h-[36px] px-3 bg-white border border-[#CBD5E1] text-[#0F172A] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير JSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickFolder(activeMeta.id);
                          setQuickNewModalOpen(true);
                        }}
                        className={`min-h-[36px] px-3 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                        style={{ backgroundColor: activeMeta.accentColor }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة بطاقة للملف</span>
                      </button>
                    </div>
                  </div>

                  {/* Folder Cards List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {folderList.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 border border-[#E2E8F0] rounded-xl bg-white flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => onSetActiveCardId(c.id)}
                              className="text-right font-bold text-sm text-[#1E3A8A] hover:underline cursor-pointer"
                            >
                              {c.title}
                            </button>
                            <button
                              type="button"
                              onClick={() => onTogglePin(c.id)}
                              className="text-[#D97706] cursor-pointer"
                            >
                              <Star className={`w-4 h-4 ${c.pinned ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-1">
                            {c.category} · {c.condition} · {c.ageRange}
                          </div>
                          <p className="text-xs text-[#334155] mt-1.5 line-clamp-2">{c.definition}</p>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-2 border-t border-[#F1F5F9]">
                          <button
                            type="button"
                            onClick={() => onCopyCard(c.id)}
                            className={`px-2.5 py-1 bg-[#F8FAFC] border border-[#CBD5E1] text-[11px] font-bold cursor-pointer ${buttonRadiusClass}`}
                          >
                            نسخ
                          </button>
                          <button
                            type="button"
                            onClick={() => onSetActiveCardId(c.id)}
                            className={`px-2.5 py-1 bg-[#2563EB] text-white text-[11px] font-bold cursor-pointer ${buttonRadiusClass}`}
                          >
                            عرض كامل
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: SMART ASSISTANT (COMPLAINT -> TOP 5 -> FULL PLAN -> RED ALERT)*/}
      {/* =================================================================== */}
      {subTab === 'assistant' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-4 md:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                🤖 المساعد التأهيلي الآلي وتحليل الشكوى
              </h3>
              <p className="text-xs text-[#64748B]">
                يفهم العامية والمرادفات، يحسب نسبة التطابق 0–100%، يعرض أفضل 5 بطاقات، ويحذر من مؤشرات الخطر.
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-xl">
              <button
                type="button"
                onClick={() => setAssistantMode('professional')}
                className={`px-3 py-1 text-xs font-bold cursor-pointer ${buttonRadiusClass}`}
                style={{
                  backgroundColor: assistantMode === 'professional' ? '#0A1633' : 'transparent',
                  color: assistantMode === 'professional' ? '#FFFFFF' : '#334155',
                }}
              >
                وضع مهني
              </button>
              <button
                type="button"
                onClick={() => setAssistantMode('simplified')}
                className={`px-3 py-1 text-xs font-bold cursor-pointer ${buttonRadiusClass}`}
                style={{
                  backgroundColor: assistantMode === 'simplified' ? '#059669' : 'transparent',
                  color: assistantMode === 'simplified' ? '#FFFFFF' : '#334155',
                }}
              >
                وضع مبسط لولي الأمر
              </button>
            </div>
          </div>

          <textarea
            rows={4}
            value={complaintInput}
            onChange={(e) => setComplaintInput(e.target.value)}
            placeholder="اكتب الشكوى هنا... مثال: ابني عمره 7 سنين بيتحرك كتير ومبيقعدش في الحصة ونساي ومبيخلصش الواجب وبيلدغ في حرف الراء"
            className={`w-full p-3 text-xs bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white focus:outline-none ${buttonRadiusClass}`}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAnalyzeComplaint}
              className={`min-h-[40px] px-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
            >
              <Sparkles className="w-4 h-4" />
              <span>حلل واقترح الآن</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenParentReportWithComplaint(complaintInput)}
              className={`min-h-[40px] px-4 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
            >
              <FilePlus2 className="w-4 h-4" />
              <span>توليد تقرير ولي أمر موثق (15 قسم)</span>
            </button>
          </div>

          {assistantResult && (
            <div className="space-y-4 pt-2">
              {/* Red Warning Alert for Danger Signs */}
              {assistantResult.redFlags.length > 0 && (
                <div className="p-4 bg-[#FEF2F2] border-2 border-[#EF4444] rounded-xl text-xs text-[#991B1B] space-y-1.5">
                  <div className="font-extrabold flex items-center gap-1.5 text-sm text-[#DC2626]">
                    <ShieldAlert className="w-5 h-5" />
                    <span>تنبيه أحمر هام — علامات تستدعي تقييماً طبياً أو تدخلاً عاجلاً!</span>
                  </div>
                  {assistantResult.redFlags.map((rf) => (
                    <div key={rf} className="font-semibold">
                      • {rf}
                    </div>
                  ))}
                </div>
              )}

              {/* Suggested Hypothesis Summary */}
              <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#1E3A8A]">
                    التشخيص المبدئي المقترح / المحور الغالب: {assistantResult.suggestedCondition}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onGenerateFullPlanIntoReport(assistantResult, complaintInput)
                    }
                    className={`min-h-[34px] px-4 bg-[#0A1633] hover:bg-[#1E293B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>✨ توليد خطة كاملة وإدراجها في التقرير</span>
                  </button>
                </div>
                <p className="text-xs text-[#0F172A] leading-relaxed">
                  {assistantMode === 'professional'
                    ? assistantResult.summaryProfessional
                    : assistantResult.summarySimplified}
                </p>
              </div>

              {/* Top 5 Matching Cards */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#0F172A]">
                  أفضل 5 بطاقات متطابقة من المكتبة ({assistantResult.top5.length}):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {assistantResult.top5.map((m) => (
                    <div
                      key={m.card.id}
                      className="p-3 border border-[#CBD5E1] rounded-xl bg-white space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#DBEAFE] text-[#1E40AF] text-[11px] font-extrabold">
                          تطابق {m.score}%
                        </span>
                        <span className="text-[10.5px] text-[#64748B]">{m.card.condition}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSetActiveCardId(m.card.id)}
                        className="text-right font-bold text-xs text-[#1E3A8A] hover:underline block cursor-pointer"
                      >
                        {m.card.title}
                      </button>
                      <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB]"
                          style={{ width: `${m.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goals SMART + Activities + 3 Recommendations Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-[#1E3A8A]">🎯 أهداف SMART المقترحة:</div>
                  <ul className="space-y-1 text-xs text-[#334155]">
                    {assistantResult.goalsSMART.map((g, idx) => (
                      <li key={idx}>• {g}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-[#047857]">🧩 الأنشطة التنفيذية المقترحة:</div>
                  <ul className="space-y-1 text-xs text-[#334155]">
                    {assistantResult.activitiesSummary.map((a, idx) => (
                      <li key={idx}>• {a}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 border border-[#DBEAFE] bg-[#EFF6FF]/60 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-[#1E40AF]">🏠 توصيات البيت:</div>
                  {assistantResult.recommendationsFamily.map((r, i) => (
                    <div key={i} className="text-[11.5px] text-[#334155]">
                      • {r}
                    </div>
                  ))}
                </div>
                <div className="p-3 border border-[#D1FAE5] bg-[#ECFDF5]/60 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-[#065F46]">🏫 توصيات المدرسة:</div>
                  {assistantResult.recommendationsSchool.map((r, i) => (
                    <div key={i} className="text-[11.5px] text-[#334155]">
                      • {r}
                    </div>
                  ))}
                </div>
                <div className="p-3 border border-[#EDE9FE] bg-[#F5F3FF]/60 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-[#5B21B6]">🩺 توصيات الأخصائي:</div>
                  {assistantResult.recommendationsSpecialist.map((r, i) => (
                    <div key={i} className="text-[11.5px] text-[#334155]">
                      • {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: SMART EXTRACTION (5 STAGES FOR ATTACHMENTS)                  */}
      {/* =================================================================== */}
      {subTab === 'extractor' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-4 md:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                🛠️ محرك تفريغ وتصحيح المرفقات الذكي (5 مراحل — SMART EXTRACTION)
              </h3>
              <p className="text-xs text-[#64748B]">
                يدعم الصور، السكرين شوت، PDF، DOCX، Excel، TXT، وCV — مع تحسين الصورة قبل OCR، تنظيف، درجة ثقة، وقاموس علمي يتعلم من تصحيحاتك.
              </p>
            </div>
            <div className="text-[11px] font-bold px-2.5 py-1 rounded bg-[#F5F3FF] text-[#6D28D9]">
              تصحيحات متعلّمة محفوظة: {learnedRules.length}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={extractBusy}
              onClick={() => extractFileInputRef.current?.click()}
              className={`min-h-[38px] px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 ${buttonRadiusClass}`}
            >
              <Upload className="w-4 h-4" />
              <span>
                {extractBusy
                  ? 'جاري تحسين الصورة والتفريغ...'
                  : 'رفع صورة / PDF / Word / Excel / TXT / سكرين شوت'}
              </span>
            </button>
            <input
              ref={extractFileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.xlsx,.xls,.csv,image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processAttachmentFile(f);
                e.currentTarget.value = '';
              }}
            />

            <button
              type="button"
              onClick={handleToggleVoiceDictation}
              className={`min-h-[38px] px-3.5 text-xs font-bold border inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
              style={{
                backgroundColor: dictating ? '#DC2626' : '#FFFFFF',
                color: dictating ? '#FFFFFF' : '#0F172A',
                borderColor: dictating ? '#DC2626' : '#CBD5E1',
              }}
            >
              {dictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{dictating ? 'إيقاف الإملاء الصوتي' : 'إملاء صوتي مباشر'}</span>
            </button>

            {lastUploadedFile && (
              <button
                type="button"
                disabled={extractBusy}
                onClick={() => processAttachmentFile(lastUploadedFile)}
                className={`min-h-[38px] px-3 bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة التفريغ</span>
              </button>
            )}
          </div>

          <textarea
            rows={5}
            value={extractRawText}
            onChange={(e) => setExtractRawText(e.target.value)}
            placeholder="أو الصق النص المنسوخ من صورة / Chat / PDF / ملف قديم هنا لتشغيل المراحل الخمس..."
            className={`w-full p-3 text-xs bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#7C3AED] focus:bg-white focus:outline-none ${buttonRadiusClass}`}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-[#64748B]">
              قاموس المصطلحات العلمية المحمية: {FIXED_SCIENTIFIC_GLOSSARY.slice(0, 10).join(' · ')} ...
            </div>
            <button
              type="button"
              onClick={handleRunTextExtraction5Stages}
              className={`min-h-[38px] px-4 bg-[#0A1633] hover:bg-[#1E293B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
            >
              <Wand2 className="w-4 h-4" />
              <span>تشغيل الـ 5 مراحل للتفريغ والتصحيح الآن</span>
            </button>
          </div>

          {extractionResult && (
            <div className="space-y-4 pt-3 border-t border-[#E2E8F0]">
              {/* Confidence Summary & Quality Gate */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-lg bg-[#DCFCE7] text-[#166534] font-bold">
                  ✅ مؤكد: {extractionResult.confirmedCount}
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#FEF3C7] text-[#92400E] font-bold">
                  ⚠️ يحتاج مراجعة: {extractionResult.reviewCount}
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#FEE2E2] text-[#991B1B] font-bold">
                  ❌ غير واضح: {extractionResult.unclearCount}
                </span>
                {extractionResult.appliedLearnedRulesCount > 0 && (
                  <span className="px-3 py-1 rounded-lg bg-[#F5F3FF] text-[#6D28D9] font-bold">
                    تطبيق {extractionResult.appliedLearnedRulesCount} تصحيحاً متعلّماً تلقائياً
                  </span>
                )}
              </div>

              {extractionResult.qualityBlocked && (
                <div className="p-3 bg-[#FEF2F2] border-2 border-[#DC2626] rounded-xl text-xs font-bold text-[#991B1B] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>
                    بوابة فحص الجودة (المرحلة E): الحفظ موقوف مؤقتاً لأن عدد السطور غير الواضحة (❌) هو{' '}
                    {extractionResult.unclearCount} (أكثر من 3). عدّل السطور غير الواضحة في الجدول أدناه لتفعيل زر الحفظ.
                  </span>
                </div>
              )}

              {extractionResult.sensitiveFindings.length > 0 && (
                <div className="p-3 bg-[#FFFBEB] border border-[#F59E0B] rounded-xl text-xs text-[#92400E] space-y-1">
                  <div className="font-bold">⚠️ تنبيه بيانات حساسة:</div>
                  <div>
                    {extractionResult.sensitiveFindings.map((f) => f.label).join(' · ')}
                  </div>
                </div>
              )}

              {extractionResult.errorReport.length > 0 && (
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[11px] text-[#475569] space-y-1">
                  <div className="font-bold text-[#0F172A]">تقرير التنظيف والأخطاء التلقائي:</div>
                  {extractionResult.errorReport.slice(0, 5).map((e, i) => (
                    <div key={i}>• {e}</div>
                  ))}
                </div>
              )}

              {/* Original Image Preview Reference */}
              {extractionResult.sourceImagePreview && (
                <div className="p-3 border border-[#CBD5E1] rounded-xl bg-[#F8FAFC] flex items-center gap-3">
                  <img
                    src={extractionResult.sourceImagePreview}
                    alt="المرجع الأصلي للمرفق"
                    className="w-20 h-20 object-cover rounded-lg border border-[#CBD5E1]"
                  />
                  <div className="text-xs text-[#334155]">
                    <div className="font-bold">صورة الأصل محفوظة كمرجع للمقارنة</div>
                    <div className="text-[11px] text-[#64748B]">ستُحفظ مع البطاقة في سجل المكتبة عند الاعتماد.</div>
                  </div>
                </div>
              )}

              {/* Side-by-Side Original vs Cleaned Line Review Table */}
              <div className="border border-[#CBD5E1] rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 bg-[#F1F5F9] px-3 py-2 text-[11px] font-bold text-[#0F172A] border-b border-[#CBD5E1]">
                  <div className="col-span-2">الحالة</div>
                  <div className="col-span-4">النص الأصلي (للمقارنة)</div>
                  <div className="col-span-6">النص المصحح والمنسق (اضغط للتعديل والتعلم)</div>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#E2E8F0]">
                  {extractionResult.lines.map((line) => (
                    <div
                      key={line.id}
                      className="grid grid-cols-12 gap-2 px-3 py-2 items-start text-xs"
                    >
                      <div className="col-span-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold ${
                            line.confidence === 'confirmed'
                              ? 'bg-[#DCFCE7] text-[#166534]'
                              : line.confidence === 'needs-review'
                              ? 'bg-[#FEF3C7] text-[#92400E]'
                              : 'bg-[#FEE2E2] text-[#991B1B]'
                          }`}
                        >
                          {line.confidence === 'confirmed'
                            ? '✅ مؤكد'
                            : line.confidence === 'needs-review'
                            ? '⚠️ مراجعة'
                            : '❌ غير واضح'}
                        </span>
                      </div>
                      <div className="col-span-4 text-[11px] text-[#64748B] break-words">
                        {line.originalText}
                      </div>
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={line.cleanedText}
                          onChange={(e) => handleEditExtractedLine(line.id, e.target.value)}
                          className={`w-full px-2 py-1 text-xs border border-[#CBD5E1] focus:border-[#2563EB] ${buttonRadiusClass}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage D Suggested Card Metadata + Stage E Save */}
              <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl space-y-3">
                <div className="text-xs font-extrabold text-[#1E3A8A]">
                  الاقتراح التلقائي للبطاقة المنسقة (المرحلة D):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold mb-1">عنوان البطاقة</label>
                    <input
                      type="text"
                      value={extractionResult.suggestedCard.title}
                      onChange={(e) =>
                        setExtractionResult((prev) =>
                          prev
                            ? {
                                ...prev,
                                suggestedCard: { ...prev.suggestedCard, title: e.target.value },
                              }
                            : prev
                        )
                      }
                      className={`w-full px-2.5 py-1.5 bg-white border border-[#93C5FD] ${buttonRadiusClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">ملف التخصص المقترح</label>
                    <select
                      value={extractionResult.suggestedCard.folder}
                      onChange={(e) =>
                        setExtractionResult((prev) =>
                          prev
                            ? {
                                ...prev,
                                suggestedCard: {
                                  ...prev.suggestedCard,
                                  folder: e.target.value as LibraryFolderId,
                                },
                              }
                            : prev
                        )
                      }
                      className={`w-full px-2.5 py-1.5 bg-white border border-[#93C5FD] ${buttonRadiusClass}`}
                    >
                      {LIBRARY_FOLDERS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">التصنيف والحالة</label>
                    <select
                      value={extractionResult.suggestedCard.condition}
                      onChange={(e) =>
                        setExtractionResult((prev) =>
                          prev
                            ? {
                                ...prev,
                                suggestedCard: {
                                  ...prev.suggestedCard,
                                  condition: e.target.value as LibraryCondition,
                                },
                              }
                            : prev
                        )
                      }
                      className={`w-full px-2.5 py-1.5 bg-white border border-[#93C5FD] ${buttonRadiusClass}`}
                    >
                      {LIBRARY_CONDITIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={extractionResult.qualityBlocked}
                    onClick={handleSaveExtractedCard}
                    className={`min-h-[40px] px-5 text-white text-xs font-bold inline-flex items-center gap-2 ${buttonRadiusClass} ${
                      extractionResult.qualityBlocked
                        ? 'bg-[#94A3B8] cursor-not-allowed'
                        : 'bg-[#059669] hover:bg-[#047857] cursor-pointer'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حفظ البطاقة بعد المراجعة وتحديث فهرس المكتبة</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: COMPARE TWO CARDS SIDE BY SIDE                               */}
      {/* =================================================================== */}
      {subTab === 'compare' && compareCardA && compareCardB && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-4 md:p-5 space-y-4">
          <h3 className="text-base font-bold text-[#0F172A]">
            ⚖️ مقارنة تفصيلية بين بطاقتين من المكتبة
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E3A8A] mb-1">البطاقة الأولى:</label>
              <select
                value={compareCardA.id}
                onChange={(e) => setCompareLeftId(e.target.value)}
                className={`w-full min-h-[38px] px-3 text-xs border border-[#CBD5E1] ${buttonRadiusClass}`}
              >
                {libraryCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.condition})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#047857] mb-1">البطاقة الثانية:</label>
              <select
                value={compareCardB.id}
                onChange={(e) => setCompareRightId(e.target.value)}
                className={`w-full min-h-[38px] px-3 text-xs border border-[#CBD5E1] ${buttonRadiusClass}`}
              >
                {libraryCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.condition})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[compareCardA, compareCardB].map((card, idx) => (
              <div
                key={card.id + idx}
                className={`p-4 rounded-xl border space-y-2.5 text-xs ${
                  idx === 0
                    ? 'border-[#BFDBFE] bg-[#EFF6FF]/40'
                    : 'border-[#A7F3D0] bg-[#ECFDF5]/40'
                }`}
              >
                <div className="font-extrabold text-sm text-[#0F172A]">{card.title}</div>
                <div className="text-[11px] text-[#475569]">
                  {card.category} · {card.condition} · {card.ageRange}
                </div>
                <div>
                  <strong>التعريف:</strong> {card.definition}
                </div>
                <div>
                  <strong>الأعراض:</strong>
                  <ul className="mt-1 space-y-0.5">
                    {card.symptoms.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>الفروق التشخيصية:</strong>
                  <ul className="mt-1 space-y-0.5">
                    {card.differential.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>أهداف SMART:</strong>
                  <ul className="mt-1 space-y-0.5">
                    {card.goalsSMART.map((g, i) => (
                      <li key={i}>• {g}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>القياس:</strong> {card.measurement}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CARD DETAIL MODAL (openCard)                                        */}
      {/* =================================================================== */}
      {activeModalCard && (
        <div
          dir="rtl"
          className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-3 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={activeModalCard.title}
        >
          <div className="w-full max-w-4xl bg-white border border-[#CBD5E1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-[#0A1633] text-white flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold truncate">{activeModalCard.title}</h3>
                  <span className="px-2 py-0.5 rounded bg-[#2563EB] text-[11px] font-bold">
                    {activeModalCard.category}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#059669] text-[11px] font-bold">
                    {activeModalCard.condition}
                  </span>
                </div>
                <div className="text-[11px] text-[#93C5FD] mt-0.5">
                  العمر: {activeModalCard.ageRange} · المصدر: {activeModalCard.source}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onTogglePin(activeModalCard.id)}
                  className={`px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: activeModalCard.pinned ? '#F59E0B' : '#1E293B',
                    color: '#FFFFFF',
                  }}
                >
                  <Star className={`w-3.5 h-3.5 ${activeModalCard.pinned ? 'fill-current' : ''}`} />
                  <span>{activeModalCard.pinned ? 'مثبتة' : 'تثبيت'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onCopyCard(activeModalCard.id)}
                  className={`px-2.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ البطاقة</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetActiveCardId(null)}
                  className={`p-1.5 bg-[#1E293B] hover:bg-[#334155] text-white cursor-pointer ${buttonRadiusClass}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Extract Specific Sections Strip */}
            <div className="px-5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={async () => {
                  await copyTextToClipboard(extractGoalsOnlyText(activeModalCard));
                  onInsertCardIntoReport(activeModalCard, 'goals');
                }}
                className={`px-3 py-1.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] font-bold cursor-pointer ${buttonRadiusClass}`}
              >
                🎯 استخراج وإدراج الأهداف فقط
              </button>
              <button
                type="button"
                onClick={async () => {
                  await copyTextToClipboard(extractActivitiesOnlyText(activeModalCard));
                  onInsertCardIntoReport(activeModalCard, 'activities');
                }}
                className={`px-3 py-1.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] font-bold cursor-pointer ${buttonRadiusClass}`}
              >
                🧩 استخراج الأنشطة فقط
              </button>
              <button
                type="button"
                onClick={async () => {
                  await copyTextToClipboard(extractRecommendationsOnlyText(activeModalCard));
                  onInsertCardIntoReport(activeModalCard, 'recs');
                }}
                className={`px-3 py-1.5 bg-[#FEF3C7] border border-[#FCD34D] text-[#92400E] font-bold cursor-pointer ${buttonRadiusClass}`}
              >
                📝 استخراج وإدراج التوصيات فقط
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompareLeftId(activeModalCard.id);
                  setSubTab('compare');
                  onSetActiveCardId(null);
                }}
                className={`px-3 py-1.5 bg-white border border-[#CBD5E1] text-[#0F172A] font-bold cursor-pointer ${buttonRadiusClass}`}
              >
                ⚖️ مقارنة مع بطاقة أخرى
              </button>
            </div>

            {/* Full Card Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#1E293B] leading-relaxed">
              {activeModalCard.image && (
                <img
                  src={activeModalCard.image}
                  alt={activeModalCard.title}
                  className="max-h-56 rounded-xl border border-[#CBD5E1] object-contain"
                />
              )}

              <div className="p-3.5 bg-[#EFF6FF]/60 border border-[#DBEAFE] rounded-xl">
                <div className="font-bold text-[#1E3A8A] mb-1">التعريف المهني:</div>
                <p>{activeModalCard.definition}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 border border-[#E2E8F0] rounded-xl">
                  <div className="font-bold text-[#0F172A] mb-1">الأعراض والمؤشرات:</div>
                  <ul className="space-y-1">
                    {activeModalCard.symptoms.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 border border-[#E2E8F0] rounded-xl">
                  <div className="font-bold text-[#0F172A] mb-1">الأسباب والعوامل:</div>
                  <ul className="space-y-1">
                    {activeModalCard.causes.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 border border-[#E2E8F0] rounded-xl">
                  <div className="font-bold text-[#0F172A] mb-1">التشخيص الفارقي:</div>
                  <ul className="space-y-1">
                    {activeModalCard.differential.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-3.5 border border-[#DBEAFE] rounded-xl space-y-1.5">
                <div className="font-bold text-[#1E3A8A]">الأهداف العامة وأهداف SMART:</div>
                {activeModalCard.goals.map((g, i) => (
                  <div key={i}>• {g}</div>
                ))}
                <div className="pt-1 font-bold text-[#059669]">أهداف SMART القابلة للقياس:</div>
                {activeModalCard.goalsSMART.map((g, i) => (
                  <div key={i} className="font-semibold">
                    {i + 1}. {g}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="font-bold text-[#0F172A]">الأنشطة التنفيذية التفصيلية:</div>
                {activeModalCard.activities.map((a, i) => (
                  <div key={i} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
                    <div className="font-bold text-[#1E3A8A]">
                      {a.name} ({a.duration})
                    </div>
                    <div>
                      <strong>الأدوات:</strong> {a.tools}
                    </div>
                    <div>
                      <strong>الخطوات:</strong> {a.steps.join(' ← ')}
                    </div>
                    <div>
                      <strong>معيار النجاح:</strong> {a.success}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-[#EFF6FF]/50 border border-[#DBEAFE] rounded-xl">
                  <div className="font-bold text-[#1E40AF] mb-1">توصيات الأسرة:</div>
                  {activeModalCard.recommendationsFamily.map((r, i) => (
                    <div key={i}>• {r}</div>
                  ))}
                </div>
                <div className="p-3 bg-[#ECFDF5]/50 border border-[#D1FAE5] rounded-xl">
                  <div className="font-bold text-[#065F46] mb-1">توصيات المدرسة:</div>
                  {activeModalCard.recommendationsSchool.map((r, i) => (
                    <div key={i}>• {r}</div>
                  ))}
                </div>
                <div className="p-3 bg-[#F5F3FF]/50 border border-[#EDE9FE] rounded-xl">
                  <div className="font-bold text-[#5B21B6] mb-1">توصيات الأخصائي:</div>
                  {activeModalCard.recommendationsSpecialist.map((r, i) => (
                    <div key={i}>• {r}</div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-wrap justify-between gap-2">
                <span>
                  <strong>معيار القياس:</strong> {activeModalCard.measurement}
                </span>
                <span>
                  <strong>الكلمات المفتاحية:</strong> {activeModalCard.keywords.join('، ')}
                </span>
              </div>

              {activeModalCard.relatedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold">بطاقات ذات صلة:</span>
                  {activeModalCard.relatedIds.map((rid) => {
                    const rel = libraryCards.find((c) => c.id === rid);
                    if (!rel) return null;
                    return (
                      <button
                        key={rid}
                        type="button"
                        onClick={() => onSetActiveCardId(rid)}
                        className="px-2.5 py-1 rounded bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E40AF] text-[11px] font-bold cursor-pointer"
                      >
                        {rel.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* QUICK ADD NEW CARD MODAL (MANUAL OR WITH IMAGE ATTACHMENT)          */}
      {/* =================================================================== */}
      {quickNewModalOpen && (
        <div
          dir="rtl"
          className="no-print fixed inset-0 z-50 bg-black/55 backdrop-blur-[1px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-white border border-[#CBD5E1] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-[#0A1633] text-white flex items-center justify-between">
              <span className="text-sm font-bold">➕ إضافة بطاقة جديدة إلى المكتبة الذكية</span>
              <button
                type="button"
                onClick={() => setQuickNewModalOpen(false)}
                className="text-white hover:text-[#93C5FD] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-bold mb-1">عنوان البطاقة *</label>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className={`w-full min-h-[36px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold mb-1">ملف التخصص</label>
                  <select
                    value={quickFolder}
                    onChange={(e) => setQuickFolder(e.target.value as LibraryFolderId)}
                    className={`w-full min-h-[36px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                  >
                    {LIBRARY_FOLDERS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">التصنيف</label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value as LibraryCategory)}
                    className={`w-full min-h-[36px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                  >
                    {LIBRARY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">الحالة</label>
                  <select
                    value={quickCondition}
                    onChange={(e) => setQuickCondition(e.target.value as LibraryCondition)}
                    className={`w-full min-h-[36px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                  >
                    {LIBRARY_CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">الفئة العمرية</label>
                  <input
                    type="text"
                    value={quickAge}
                    onChange={(e) => setQuickAge(e.target.value)}
                    className={`w-full min-h-[36px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">التعريف والمؤشرات *</label>
                <textarea
                  rows={3}
                  value={quickDefinition}
                  onChange={(e) => setQuickDefinition(e.target.value)}
                  className={`w-full p-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">الأهداف الذكية (سطر لكل هدف)</label>
                <textarea
                  rows={2}
                  value={quickGoals}
                  onChange={(e) => setQuickGoals(e.target.value)}
                  className={`w-full p-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">التوصيات العملية (سطر لكل توصية)</label>
                <textarea
                  rows={2}
                  value={quickRecs}
                  onChange={(e) => setQuickRecs(e.target.value)}
                  className={`w-full p-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => quickImageInputRef.current?.click()}
                  className={`px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{quickImage ? 'تغيير الصورة المرفقة ✓' : 'إرفاق صورة للبطاقة'}</span>
                </button>
                <input
                  ref={quickImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = () => {
                        if (typeof r.result === 'string') setQuickImage(r.result);
                      };
                      r.readAsDataURL(f);
                    }
                    e.currentTarget.value = '';
                  }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickNewModalOpen(false)}
                  className={`px-4 py-2 bg-[#E2E8F0] font-bold cursor-pointer ${buttonRadiusClass}`}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickCard}
                  className={`px-4 py-2 bg-[#059669] text-white font-bold cursor-pointer ${buttonRadiusClass}`}
                >
                  حفظ البطاقة الجديدة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
