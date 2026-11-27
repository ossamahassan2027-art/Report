import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  FileText,
  Lightbulb,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Palette,
  Paperclip,
  PenLine,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react';
import { CvLanguage } from '../types/cv';
import { SmartAddDraftItem, SmartAddKind } from '../types/studio';
import {
  prepareFileForExtraction,
  PreparedUploadedFile,
} from '../utils/cvFileParser';
import { extractRawTextLocally, extractTextWithTesseract } from '../utils/cvLocalParser';
import {
  analyzeSmartAddErrorsAndSuggestions,
  createInitialSmartAddFields,
  extractStructuredByKindLocally,
  getThreeFieldSuggestions,
  SmartAddErrorIssue,
  SmartAddOptionalSuggestion,
  SmartAddStructuredFields,
} from '../utils/smartAddExtractor';
import { formatSingleTextBlock } from '../utils/smartAutoFormatter';

interface BlockMiniDesign {
  fontSizePx?: number;
  textColor?: string;
  textAlign?: 'right' | 'center' | 'left';
  bold?: boolean;
}

interface ExtraBlockPart {
  id: string;
  title: string;
  body: string;
  design?: BlockMiniDesign;
}

export interface UnifiedSmartAddSavePayload {
  kind: SmartAddKind;
  rawText: string;
  fields: SmartAddStructuredFields;
  extraParts: ExtraBlockPart[];
  appliedOptionalAdditions: SmartAddOptionalSuggestion[];
}

interface UnifiedSmartAddModalProps {
  open: boolean;
  kind: SmartAddKind;
  cvLanguage?: CvLanguage;
  buttonRadiusClass: string;
  initialDraft?: SmartAddDraftItem | null;
  onClose: () => void;
  onConfirmSave: (payload: UnifiedSmartAddSavePayload) => void;
  onSaveDraft: (draft: SmartAddDraftItem) => void;
  onNotify: (msg: string) => void;
}

const KIND_TITLES: Record<SmartAddKind, { header: string; noun: string }> = {
  report: { header: 'إضافة تقرير جديد ذكي', noun: 'تقرير' },
  cv: { header: 'إضافة سيرة ذاتية جديدة (CV)', noun: 'CV' },
  certificate: { header: 'إضافة شهادة أو وثيقة مهنية', noun: 'شهادة' },
  evaluation: { header: 'إضافة استمارة تقييم جديدة', noun: 'تقييم' },
  case: { header: 'إضافة ملف حالة جديد', noun: 'حالة' },
  task: { header: 'إضافة مهمة أسبوعية جديدة', noun: 'مهمة' },
  experience: { header: 'إضافة خبرة عملية جديدة', noun: 'خبرة' },
  skill: { header: 'إضافة مهارة جديدة للـ CV', noun: 'مهارة' },
  education: { header: 'إضافة مؤهل تعليمي جديد', noun: 'تعليم' },
};

type InputTab = 'text' | 'files' | 'voice-cam';

export const UnifiedSmartAddModal: React.FC<UnifiedSmartAddModalProps> = ({
  open,
  kind,
  cvLanguage = 'ar',
  buttonRadiusClass,
  initialDraft,
  onClose,
  onConfirmSave,
  onSaveDraft,
  onNotify,
}) => {
  const [minimized, setMinimized] = useState(false);
  const [inputTab, setInputTab] = useState<InputTab>('text');
  const [rawText, setRawText] = useState('');
  const [confirmClearText, setConfirmClearText] = useState(false);

  const [files, setFiles] = useState<PreparedUploadedFile[]>([]);
  const [previewingFile, setPreviewingFile] = useState<PreparedUploadedFile | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Voice & Camera state
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const camFallbackInputRef = useRef<HTMLInputElement | null>(null);

  // Extraction state
  const [busy, setBusy] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [extractError, setExtractError] = useState('');
  const [extractedFieldCount, setExtractedFieldCount] = useState<number | null>(null);

  // Structured editable fields
  const [fields, setFields] = useState<SmartAddStructuredFields>(createInitialSmartAddFields);
  const [extraParts, setExtraParts] = useState<ExtraBlockPart[]>([]);
  const [blockDesigns, setBlockDesigns] = useState<Record<string, BlockMiniDesign>>({});
  const [dirty, setDirty] = useState(false);
  const [confirmCloseDraft, setConfirmCloseDraft] = useState(false);

  // Smart Review & Optional Additions
  const [ignoredIssueIds, setIgnoredIssueIds] = useState<string[]>([]);
  const [ignoredSuggestionIds, setIgnoredSuggestionIds] = useState<string[]>([]);
  const [appliedOptional, setAppliedOptional] = useState<SmartAddOptionalSuggestion[]>([]);

  // Inline Click-to-Edit Overlay for any field/block inside modal
  const [miniEditTarget, setMiniEditTarget] = useState<{
    key: string;
    label: string;
    value: string;
    isExtraPart?: boolean;
  } | null>(null);
  const [miniEditTab, setMiniEditTab] = useState<'text' | 'design' | 'suggestions'>('text');
  const [miniEditTextDraft, setMiniEditTextDraft] = useState('');
  const [miniEditDesignDraft, setMiniEditDesignDraft] = useState<BlockMiniDesign>({});
  const [miniConfirmDelete, setMiniConfirmDelete] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      return;
    }
    setMinimized(false);
    setConfirmCloseDraft(false);
    setConfirmClearText(false);
    setExtractError('');
    setExtractedFieldCount(null);
    setIgnoredIssueIds([]);
    setIgnoredSuggestionIds([]);
    setAppliedOptional([]);
    setMiniEditTarget(null);

    if (initialDraft && initialDraft.kind === kind) {
      setRawText(initialDraft.rawText || '');
      setFields({
        ...createInitialSmartAddFields(),
        ...(initialDraft.payload as Partial<SmartAddStructuredFields>),
      });
      setDirty(false);
    } else {
      setRawText('');
      setFiles([]);
      setFields(createInitialSmartAddFields());
      setExtraParts([]);
      setBlockDesigns({});
      setDirty(false);
    }
  }, [open, kind, initialDraft]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const wordCount = useMemo(() => {
    const clean = rawText.trim();
    return clean ? clean.split(/\s+/).length : 0;
  }, [rawText]);

  const { issues, suggestions } = useMemo(
    () => analyzeSmartAddErrorsAndSuggestions(fields, kind, rawText),
    [fields, kind, rawText]
  );

  const visibleIssues = issues.filter((i) => !ignoredIssueIds.includes(i.id));
  const visibleSuggestions = suggestions.filter(
    (s) =>
      !ignoredSuggestionIds.includes(s.id) &&
      !appliedOptional.some((a) => a.id === s.id)
  );

  if (!open) return null;

  const meta = KIND_TITLES[kind];

  const handleRequestClose = () => {
    if (dirty) {
      setConfirmCloseDraft(true);
    } else {
      onClose();
    }
  };

  const handleFilesAdded = async (fileList: FileList | File[]) => {
    setExtractError('');
    const arr = Array.from(fileList);
    for (const f of arr) {
      try {
        const prepared = await prepareFileForExtraction(f);
        setFiles((prev) => [...prev, prepared]);
        setDirty(true);
      } catch (err) {
        setExtractError(
          err instanceof Error
            ? err.message
            : 'تعذر قراءة الملف، برجاء تجربة ملف أوضح أو الصق النص يدوياً.'
        );
      }
    }
  };

  const handleToggleVoice = () => {
    setVoiceNote('');
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: (ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: (ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
    };

    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      setVoiceNote(
        'متصفحك الحالي لا يدعم الإملاء الصوتي المباشر — يمكنك لصق النص في التبويب الأول أو استخدام لوحة مفاتيح الجوال الصوتية.'
      );
      return;
    }

    try {
      const recog = new SR();
      recog.lang = 'ar-EG';
      recog.continuous = true;
      recog.interimResults = false;
      recog.onresult = (ev) => {
        let added = '';
        for (let i = 0; i < ev.results.length; i++) {
          if (ev.results[i].isFinal) {
            added += `${ev.results[i][0].transcript} `;
          }
        }
        if (added.trim()) {
          setRawText((prev) => `${prev ? `${prev.trim()} ` : ''}${added.trim()}`);
          setDirty(true);
        }
      };
      recog.onerror = () => {
        setListening(false);
        setVoiceNote('توقف التسجيل الصوتي — تأكد من منح إذن الميكروفون للمتصفح.');
      };
      recog.onend = () => setListening(false);
      recog.start();
      recognitionRef.current = recog;
      setListening(true);
    } catch {
      setVoiceNote('تعذر تشغيل الميكروفون في هذا المتصفح.');
    }
  };

  const handleOpenCamera = async () => {
    setVoiceNote('');
    if (!navigator.mediaDevices?.getUserMedia) {
      camFallbackInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      camFallbackInputRef.current?.click();
    }
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1024;
    canvas.height = videoRef.current.videoHeight || 768;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedPhotoUrl(dataUrl);
    stopCamera();
    setDirty(true);

    // Run local OCR immediately
    setBusy(true);
    setProgressPct(15);
    setProgressLabel('جاري قراءة الصورة الملتقطة');
    try {
      const ocrText = await extractTextWithTesseract(dataUrl, (pct, lbl) => {
        setProgressPct(pct);
        setProgressLabel(lbl);
      });
      const merged = `${rawText ? `${rawText}\n` : ''}${ocrText}`.trim();
      setRawText(merged);
      const outcome = extractStructuredByKindLocally(merged, kind, cvLanguage);
      setFields(outcome.fields);
      setExtractedFieldCount(outcome.extractedCount);
      onNotify(`تم استخراج ${outcome.extractedCount} حقل من الصورة الملتقطة بنجاح`);
    } catch {
      setExtractError('تعذر قراءة الصورة، برجاء التقاط صورة أوضح أو الصق النص يدوياً.');
    } finally {
      setBusy(false);
    }
  };

  const handleRunSmartAutoFill = async () => {
    setExtractError('');
    setBusy(true);
    setProgressPct(10);
    setProgressLabel('جاري القراءة المحلية');

    try {
      const textChunks: string[] = [];
      if (rawText.trim()) textChunks.push(rawText.trim());

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgressLabel(`جاري قراءة ${file.fileName}`);
        const text = await extractRawTextLocally(file, (pct) => {
          const overall = Math.round(((i + pct / 100) / Math.max(1, files.length)) * 90);
          setProgressPct(Math.max(12, overall));
        });
        if (text) textChunks.push(text);
      }

      if (capturedPhotoUrl && !rawText.trim() && files.length === 0) {
        const ocrText = await extractTextWithTesseract(capturedPhotoUrl, (pct, lbl) => {
          setProgressPct(pct);
          setProgressLabel(lbl);
        });
        if (ocrText) textChunks.push(ocrText);
      }

      const combinedText = textChunks.join('\n\n').trim();
      if (!combinedText) {
        throw new Error('يرجى كتابة نص أو إرفاق ملف (Word / Excel / PDF / صورة) أولاً.');
      }

      setRawText(combinedText);
      setProgressPct(95);
      setProgressLabel('جاري استخراج الحقول وتنظيمها');
      const outcome = extractStructuredByKindLocally(combinedText, kind, cvLanguage);
      setFields(outcome.fields);
      setExtractedFieldCount(outcome.extractedCount);
      setDirty(true);
      setProgressPct(100);
      setProgressLabel('اكتمل الاستخراج المحلي بنجاح');
    } catch (err) {
      setExtractError(
        err instanceof Error
          ? err.message
          : 'تعذر قراءة الملف، برجاء تجربة ملف أوضح أو الصق النص يدوياً.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleAutoFormatDraft = () => {
    const updated: SmartAddStructuredFields = { ...fields };
    (Object.keys(updated) as (keyof SmartAddStructuredFields)[]).forEach((k) => {
      const v = updated[k];
      if (typeof v === 'string' && v.trim() && v !== '[ ... ]') {
        (updated as unknown as Record<string, unknown>)[k] = formatSingleTextBlock(v).formatted;
      }
    });
    setFields(updated);
    setDirty(true);
    onNotify('تم تطبيق التنسيق الآلي الذكي على الحقول المستخرجة');
  };

  const handleApplyIssueFix = (issue: SmartAddErrorIssue) => {
    if (issue.fixValue) {
      setFields((prev) => ({
        ...prev,
        [issue.fieldKey]: issue.fixValue,
      }));
      setDirty(true);
      onNotify(`تم إصلاح حقل «${issue.fieldLabel}»`);
    } else {
      openMiniEditor(
        issue.fieldKey,
        issue.fieldLabel,
        String((fields as unknown as Record<string, unknown>)[issue.fieldKey] || '')
      );
    }
  };

  const openMiniEditor = (key: string, label: string, value: string, isExtraPart = false) => {
    setMiniEditTarget({ key, label, value, isExtraPart });
    setMiniEditTab('text');
    setMiniEditTextDraft(value);
    setMiniEditDesignDraft(blockDesigns[key] || {});
    setMiniConfirmDelete(false);
  };

  const handleSaveMiniEdit = () => {
    if (!miniEditTarget) return;
    if (miniEditTarget.isExtraPart) {
      setExtraParts((prev) =>
        prev.map((p) =>
          p.id === miniEditTarget.key
            ? { ...p, body: miniEditTextDraft, design: miniEditDesignDraft }
            : p
        )
      );
    } else {
      setFields((prev) => ({
        ...prev,
        [miniEditTarget.key]: miniEditTextDraft,
      }));
    }
    setBlockDesigns((prev) => ({
      ...prev,
      [miniEditTarget.key]: miniEditDesignDraft,
    }));
    setDirty(true);
    setMiniEditTarget(null);
  };

  const handleSaveDraftNow = () => {
    const titleVal =
      kind === 'cv'
        ? fields.fullName
        : kind === 'certificate'
        ? fields.certTitle
        : kind === 'evaluation'
        ? fields.evalTitle
        : kind === 'task'
        ? fields.taskText
        : fields.childName;
    const draft: SmartAddDraftItem = {
      id: initialDraft?.id || `draft-add-${Date.now()}`,
      kind,
      title: `${meta.noun}: ${titleVal && titleVal !== '[ ... ]' ? titleVal : 'مسودة بدون اسم'}`,
      updatedAt: new Date().toISOString().slice(0, 10),
      rawText,
      payload: fields as unknown as Record<string, unknown>,
    };
    onSaveDraft(draft);
    setDirty(false);
    setConfirmCloseDraft(false);
    onClose();
  };

  // Minimized floating bar
  if (minimized) {
    return (
      <div
        dir="rtl"
        className="no-print fixed bottom-20 lg:bottom-14 left-4 z-50 bg-[#0A1633] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-[#2563EB] flex items-center gap-3 text-xs"
      >
        <Sparkles className="w-4 h-4 text-[#60A5FA]" />
        <span className="font-bold">{meta.header} (مصغرة)</span>
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="px-2.5 py-1 rounded bg-[#2563EB] hover:bg-[#1D4ED8] font-bold inline-flex items-center gap-1 cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>تكبير</span>
        </button>
        <button
          type="button"
          onClick={handleRequestClose}
          className="p-1 rounded hover:bg-white/15 cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Render editable field grid according to `kind`
  const renderFieldsGrid = () => {
    const fieldItems: { key: keyof SmartAddStructuredFields; label: string; multiline?: boolean }[] =
      kind === 'report' || kind === 'case'
        ? [
            { key: 'childName', label: 'اسم الحالة' },
            { key: 'age', label: 'العمر' },
            { key: 'reportDate', label: 'التاريخ' },
            { key: 'phone', label: 'رقم الهاتف' },
            { key: 'guardianName', label: 'ولي الأمر' },
            { key: 'diagnosis', label: 'التشخيص المذكور' },
            { key: 'mainComplaint', label: 'الشكوى الرئيسية', multiline: true },
            { key: 'evaluation', label: 'التقييم والملاحظات', multiline: true },
            { key: 'planGoal', label: 'الخطة والأهداف', multiline: true },
            { key: 'recommendations', label: 'التوصيات', multiline: true },
          ]
        : kind === 'cv'
        ? [
            { key: 'fullName', label: 'الاسم الكامل' },
            { key: 'targetJobTitle', label: 'المسمى الوظيفي' },
            { key: 'phone', label: 'رقم الهاتف' },
            { key: 'email', label: 'البريد الإلكتروني' },
            { key: 'location', label: 'العنوان / الموقع' },
            { key: 'summary', label: 'الملخص المهني', multiline: true },
          ]
        : kind === 'certificate'
        ? [
            { key: 'certTitle', label: 'اسم الشهادة' },
            { key: 'certIssuer', label: 'الجهة المانحة' },
            { key: 'certDate', label: 'التاريخ' },
            { key: 'certNumber', label: 'رقم الشهادة' },
            { key: 'certHolder', label: 'اسم الحاصل عليها' },
            { key: 'certKeywords', label: 'الكلمات المفتاحية' },
            { key: 'certSummary3Lines', label: 'الملخص القياسي (3 سطور)', multiline: true },
          ]
        : kind === 'evaluation'
        ? [
            { key: 'evalTitle', label: 'عنوان استمارة التقييم' },
            { key: 'evalSymptoms', label: 'الأعراض المختارة / الملاحظة' },
            { key: 'evalScores', label: 'الدرجات / المؤشرات' },
            { key: 'evalSessionTypes', label: 'التوصية المقترحة بأنواع الجلسات' },
            { key: 'evalNotes', label: 'الملاحظات التقييمية', multiline: true },
          ]
        : kind === 'task'
        ? [
            { key: 'taskDay', label: 'اليوم' },
            { key: 'taskOwner', label: 'المسؤول' },
            { key: 'taskStatus', label: 'الحالة (تم / لم يتم / جزئي)' },
            { key: 'taskText', label: 'وصف المهمة', multiline: true },
          ]
        : kind === 'experience'
        ? [
            { key: 'expJobTitle', label: 'المسمى الوظيفي' },
            { key: 'expCompany', label: 'جهة العمل / المركز' },
            { key: 'expDateRange', label: 'الفترة الزمنية' },
            { key: 'expBullets', label: 'أبرز الإنجازات والمهام', multiline: true },
          ]
        : kind === 'skill'
        ? [
            { key: 'skillName', label: 'اسم المهارة' },
            { key: 'skillLevel', label: 'المستوى' },
          ]
        : [
            { key: 'eduDegree', label: 'الدرجة العلمية' },
            { key: 'eduInstitution', label: 'الجامعة / المؤسسة' },
            { key: 'eduDateRange', label: 'الفترة / سنة التخرج' },
          ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fieldItems.map((item) => {
          const val = String(fields[item.key] ?? '[ ... ]');
          const d = blockDesigns[String(item.key)] || {};
          return (
            <div
              key={String(item.key)}
              className={`p-2.5 bg-white border border-[#E2E8F0] hover:border-[#2563EB] transition-colors ${
                item.multiline ? 'sm:col-span-2' : ''
              } ${buttonRadiusClass}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="font-bold text-[#1E3A8A]">{item.label}</label>
                <button
                  type="button"
                  onClick={() => openMiniEditor(String(item.key), item.label, val)}
                  className="text-[10.5px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                >
                  تعديل وتنسيق ومقترحات ↗
                </button>
              </div>
              {item.multiline ? (
                <textarea
                  rows={2}
                  value={val}
                  onChange={(e) => {
                    setFields((prev) => ({ ...prev, [item.key]: e.target.value }));
                    setDirty(true);
                  }}
                  style={{
                    fontSize: d.fontSizePx ? `${d.fontSizePx}px` : undefined,
                    color: d.textColor,
                    textAlign: d.textAlign,
                    fontWeight: d.bold ? 700 : undefined,
                  }}
                  className={`w-full p-2 border border-[#CBD5E1] text-xs ${buttonRadiusClass}`}
                />
              ) : (
                <input
                  type="text"
                  value={val}
                  onChange={(e) => {
                    setFields((prev) => ({ ...prev, [item.key]: e.target.value }));
                    setDirty(true);
                  }}
                  style={{
                    fontSize: d.fontSizePx ? `${d.fontSizePx}px` : undefined,
                    color: d.textColor,
                    textAlign: d.textAlign,
                    fontWeight: d.bold ? 700 : undefined,
                  }}
                  className={`w-full min-h-[34px] px-2.5 border border-[#CBD5E1] text-xs ${buttonRadiusClass}`}
                />
              )}
            </div>
          );
        })}

        {extraParts.map((part) => (
          <div
            key={part.id}
            onClick={() => openMiniEditor(part.id, part.title, part.body, true)}
            className={`sm:col-span-2 p-2.5 bg-[#EFF6FF]/60 border border-[#BFDBFE] cursor-pointer ${buttonRadiusClass}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[#1E3A8A]">{part.title}</span>
              <span className="text-[10.5px] text-[#2563EB] font-bold">اضغط للتعديل</span>
            </div>
            <div
              className="whitespace-pre-wrap text-xs"
              style={{
                fontSize: part.design?.fontSizePx ? `${part.design.fontSizePx}px` : undefined,
                color: part.design?.textColor,
                textAlign: part.design?.textAlign,
                fontWeight: part.design?.bold ? 700 : undefined,
              }}
            >
              {part.body}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      dir="rtl"
      onClick={handleRequestClose}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={meta.header}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-white border border-[#CBD5E1] shadow-2xl overflow-hidden ${buttonRadiusClass}`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 bg-[#0A1633] text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-[11px] font-bold shrink-0">
              إضافة {meta.noun}
            </span>
            <div className="min-w-0">
              <h2 className="font-editorial text-sm sm:text-base font-bold truncate">
                {meta.header}
              </h2>
              <p className="text-[10.5px] text-[#94A3B8]">
                استخراج محلي 100% داخل المتصفح (يعمل بدون إنترنت — Word / Excel / PDF / صورة / صوت)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setMinimized(true)}
              title="تصغير النافذة"
              aria-label="تصغير"
              className="min-h-[34px] min-w-[34px] rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRequestClose}
              title="إغلاق"
              aria-label="إغلاق"
              className="min-h-[34px] min-w-[34px] rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs bg-[#F8FAFC]">
          {/* 3 Input Method Tabs */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#F1F5F9] border-b border-[#E2E8F0]">
              {(
                [
                  ['text', '✍️ كتابة نص', PenLine],
                  ['files', '📎 إرفاق ملف', Paperclip],
                  ['voice-cam', '🎤 تسجيل صوتي / صورة بالكاميرا', Mic],
                ] as const
              ).map(([tabId, label, Icon]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setInputTab(tabId)}
                  className={`min-h-[36px] px-3.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: inputTab === tabId ? '#2563EB' : '#FFFFFF',
                    color: inputTab === tabId ? '#FFFFFF' : '#334155',
                    border: `1px solid ${inputTab === tabId ? '#2563EB' : '#CBD5E1'}`,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="p-3.5 space-y-3">
              {/* TAB 1: TEXT */}
              {inputTab === 'text' && (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={rawText}
                    onChange={(e) => {
                      setRawText(e.target.value);
                      setDirty(true);
                    }}
                    placeholder="الصق أو اكتب المحتوى هنا (يدعم النسخ واللصق المباشر من Word وواتساب)..."
                    className={`w-full p-3 border border-[#CBD5E1] bg-[#FFFFFF] leading-relaxed ${buttonRadiusClass}`}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#475569]">
                    <span className="font-bold">
                      عدد الكلمات:{' '}
                      <span className="tabular-nums-ar text-[#1E3A8A]">
                        {wordCount > 0 ? wordCount : '[ ... ]'}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      {!confirmClearText ? (
                        <button
                          type="button"
                          disabled={!rawText.trim()}
                          onClick={() => setConfirmClearText(true)}
                          className={`px-2.5 py-1 border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] font-bold cursor-pointer disabled:opacity-45 ${buttonRadiusClass}`}
                        >
                          مسح النص
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-[#FEF2F2] px-2.5 py-1 rounded border border-[#FECACA]">
                          <span className="font-bold text-[#991B1B]">تأكيد المسح؟</span>
                          <button
                            type="button"
                            onClick={() => {
                              setRawText('');
                              setConfirmClearText(false);
                            }}
                            className="px-2 py-0.5 bg-[#DC2626] text-white rounded font-bold cursor-pointer"
                          >
                            نعم
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmClearText(false)}
                            className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded cursor-pointer"
                          >
                            لا
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FILES */}
              {inputTab === 'files' && (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      if (e.dataTransfer.files?.length) {
                        void handleFilesAdded(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-5 border-2 border-dashed text-center cursor-pointer transition-colors ${buttonRadiusClass} ${
                      dragOver
                        ? 'border-[#2563EB] bg-[#EFF6FF]'
                        : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#2563EB]'
                    }`}
                  >
                    <Upload className="w-7 h-7 mx-auto text-[#2563EB] mb-1.5" />
                    <div className="font-bold text-[#0F172A]">
                      اسحب الملف هنا أو اضغط للرفع (متعدد الملفات)
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      يقبل: Word (.docx) · Excel (.xlsx) · PDF (.pdf) · صور (.jpg / .png)
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".docx,.xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png,.webp,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          void handleFilesAdded(e.target.files);
                        }
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-1.5">
                      {files.map((f) => (
                        <div
                          key={f.id}
                          className={`p-2.5 border border-[#E2E8F0] bg-[#FFFFFF] flex flex-wrap items-center justify-between gap-2 ${buttonRadiusClass}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {f.kind === 'excel' ? (
                              <FileSpreadsheet className="w-4 h-4 text-[#059669] shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                            )}
                            <span className="font-bold truncate">{f.fileName}</span>
                            <span className="text-[11px] text-[#64748B] shrink-0">
                              ({f.sizeLabel})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewingFile(previewingFile?.id === f.id ? null : f)
                              }
                              className={`px-2.5 py-1 border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>معاينة الملف</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFiles((prev) => prev.filter((x) => x.id !== f.id));
                                if (previewingFile?.id === f.id) setPreviewingFile(null);
                              }}
                              className={`px-2.5 py-1 border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف الملف</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {previewingFile && (
                    <div className="p-3 border border-[#CBD5E1] bg-white rounded-xl space-y-2">
                      <div className="flex items-center justify-between font-bold text-[#1E3A8A]">
                        <span>معاينة: {previewingFile.fileName}</span>
                        <button
                          type="button"
                          onClick={() => setPreviewingFile(null)}
                          className="text-xs underline cursor-pointer"
                        >
                          إغلاق المعاينة
                        </button>
                      </div>
                      {previewingFile.previewDataUrl ? (
                        <img
                          src={previewingFile.previewDataUrl}
                          alt={previewingFile.fileName}
                          className="max-h-48 mx-auto rounded border border-[#E2E8F0]"
                        />
                      ) : (
                        <p className="text-[11px] text-[#334155] whitespace-pre-wrap">
                          {previewingFile.previewSnippet}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: VOICE & CAMERA */}
              {inputTab === 'voice-cam' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleToggleVoice}
                      className={`min-h-[40px] px-4 font-bold inline-flex items-center gap-2 cursor-pointer ${buttonRadiusClass} ${
                        listening
                          ? 'bg-[#DC2626] text-white'
                          : 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A]'
                      }`}
                    >
                      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{listening ? 'إيقاف التسجيل الصوتي' : 'تسجيل صوتي (إملاء مباشر)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenCamera}
                      className={`min-h-[40px] px-4 bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] font-bold inline-flex items-center gap-2 cursor-pointer ${buttonRadiusClass}`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>التقاط صورة بالكاميرا</span>
                    </button>
                    <input
                      ref={camFallbackInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          void handleFilesAdded(e.target.files);
                          setInputTab('files');
                        }
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {voiceNote && (
                    <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] rounded-lg">
                      {voiceNote}
                    </div>
                  )}

                  {cameraOpen && (
                    <div className="p-3 bg-black rounded-xl space-y-2 text-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-h-56 mx-auto rounded"
                      />
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleCapturePhoto}
                          className="px-4 py-2 bg-[#059669] text-white font-bold rounded-lg cursor-pointer"
                        >
                          التقاط وقراءة الصورة الآن
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-4 py-2 bg-white text-[#0F172A] font-bold rounded-lg cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  {rawText && (
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[11px] whitespace-pre-wrap">
                      {rawText}
                    </div>
                  )}
                </div>
              )}

              {/* Primary Auto-Fill CTA */}
              <button
                type="button"
                disabled={busy}
                onClick={handleRunSmartAutoFill}
                className={`w-full min-h-[42px] px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60 ${buttonRadiusClass}`}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{busy ? `${progressLabel}... (${progressPct}%)` : 'ملء تلقائي ذكي الآن'}</span>
              </button>

              {busy && (
                <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] transition-all duration-150"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}

              {extractError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded-lg font-semibold">
                  {extractError}
                </div>
              )}

              {extractedFieldCount !== null && !busy && (
                <div className="p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] rounded-lg font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    تم استخراج <span className="tabular-nums-ar">{extractedFieldCount}</span> حقل بنجاح
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Extracted / Editable Structured Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#0F172A]">
                الحقول المستخرجة (اضغط على أي حقل للتعديل أو التنسيق أو المراجعة):
              </span>
              <button
                type="button"
                onClick={() => {
                  const newId = `extra-part-${Date.now()}`;
                  setExtraParts((p) => [...p, { id: newId, title: 'بند إضافي', body: '[ ... ]' }]);
                  openMiniEditor(newId, 'بند إضافي', '[ ... ]', true);
                }}
                className={`px-2.5 py-1 border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة جزء مخصص</span>
              </button>
            </div>
            {renderFieldsGrid()}
          </div>

          {/* Section A: Smart Error Review */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-[#FFFBEB] border-b border-[#FDE68A] font-bold text-[#92400E] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>مراجعة ذكية للأخطاء ({visibleIssues.length})</span>
            </div>
            {visibleIssues.length === 0 ? (
              <div className="p-3 text-center text-[#047857] font-semibold">
                ✓ لا توجد أخطاء مكتشفة في الحقول الحالية.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="py-2 px-3 font-bold">الحقل</th>
                      <th className="py-2 px-3 font-bold">المشكلة</th>
                      <th className="py-2 px-3 font-bold">الاقتراح</th>
                      <th className="py-2 px-3 font-bold text-left">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {visibleIssues.map((iss) => (
                      <tr key={iss.id}>
                        <td className="py-2 px-3 font-bold">{iss.fieldLabel}</td>
                        <td className="py-2 px-3 text-[#B91C1C]">{iss.problem}</td>
                        <td className="py-2 px-3 text-[#047857]">{iss.suggestion}</td>
                        <td className="py-2 px-3 text-left whitespace-nowrap space-x-1 space-x-reverse">
                          <button
                            type="button"
                            onClick={() => handleApplyIssueFix(iss)}
                            className="px-2.5 py-1 bg-[#2563EB] text-white rounded font-bold cursor-pointer"
                          >
                            إصلاح
                          </button>
                          <button
                            type="button"
                            onClick={() => setIgnoredIssueIds((p) => [...p, iss.id])}
                            className="px-2.5 py-1 border border-[#CBD5E1] rounded font-semibold cursor-pointer"
                          >
                            تجاهل
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section B: Optional Additions */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-[#EFF6FF] border-b border-[#BFDBFE] font-bold text-[#1E3A8A] flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              <span>إضافات مقترحة اختيارية ({visibleSuggestions.length})</span>
            </div>
            <div className="p-3 space-y-2">
              {visibleSuggestions.length === 0 ? (
                <div className="text-center text-[#64748B]">تمت مراجعة كافة المقترحات الاختيارية.</div>
              ) : (
                visibleSuggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className={`p-2.5 border border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-2 ${buttonRadiusClass}`}
                  >
                    <span className="font-semibold text-[#0F172A]">{sug.label}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedOptional((p) => [...p, sug]);
                          setDirty(true);
                          onNotify('تمت إضافة المقترح إلى بيانات المستند');
                        }}
                        className="px-3 py-1 bg-[#059669] text-white rounded font-bold cursor-pointer"
                      >
                        إضافة
                      </button>
                      <button
                        type="button"
                        onClick={() => setIgnoredSuggestionIds((p) => [...p, sug.id])}
                        className="px-3 py-1 border border-[#CBD5E1] bg-white rounded font-semibold cursor-pointer"
                      >
                        تجاهل
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section C: Quick Preview + Auto-Format Button */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-[#ECFDF5] border-b border-[#A7F3D0] flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-[#065F46] flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>معاينة سريعة للمستند قبل الحفظ</span>
              </span>
              <button
                type="button"
                onClick={handleAutoFormatDraft}
                className={`min-h-[32px] px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تنسيق آلي ذكي</span>
              </button>
            </div>
            <div className="p-3.5 text-xs space-y-2 bg-white">
              {kind === 'report' || kind === 'case' ? (
                <>
                  <div
                    onClick={() => openMiniEditor('childName', 'اسم الحالة', fields.childName)}
                    className="font-bold text-sm text-[#1E3A8A] cursor-pointer hover:bg-[#EFF6FF] p-1 rounded"
                  >
                    الحالة: {fields.childName} ({fields.age}) — {fields.reportDate}
                  </div>
                  <div
                    onClick={() => openMiniEditor('mainComplaint', 'الشكوى الرئيسية', fields.mainComplaint)}
                    className="cursor-pointer hover:bg-[#EFF6FF] p-1 rounded"
                  >
                    <strong>الشكوى / الملاحظة:</strong> {fields.mainComplaint}
                  </div>
                  <div
                    onClick={() => openMiniEditor('evaluation', 'التقييم', fields.evaluation)}
                    className="cursor-pointer hover:bg-[#EFF6FF] p-1 rounded"
                  >
                    <strong>التقييم:</strong> {fields.evaluation}
                  </div>
                  <div
                    onClick={() => openMiniEditor('recommendations', 'التوصيات', fields.recommendations)}
                    className="cursor-pointer hover:bg-[#EFF6FF] p-1 rounded whitespace-pre-wrap"
                  >
                    <strong>التوصيات:</strong> {fields.recommendations}
                  </div>
                </>
              ) : kind === 'cv' ? (
                <>
                  <div
                    onClick={() => openMiniEditor('fullName', 'الاسم الكامل', fields.fullName)}
                    className="font-bold text-sm text-[#0F172A] cursor-pointer hover:bg-[#EFF6FF] p-1 rounded"
                  >
                    {fields.fullName} — {fields.targetJobTitle}
                  </div>
                  <div className="text-[#475569]">
                    {fields.phone} | {fields.email} | {fields.location}
                  </div>
                  <div
                    onClick={() => openMiniEditor('summary', 'الملخص المهني', fields.summary)}
                    className="cursor-pointer hover:bg-[#EFF6FF] p-1 rounded"
                  >
                    <strong>الملخص المهني:</strong> {fields.summary}
                  </div>
                </>
              ) : kind === 'certificate' ? (
                <div
                  onClick={() => openMiniEditor('certSummary3Lines', 'ملخص الشهادة', fields.certSummary3Lines)}
                  className="whitespace-pre-wrap cursor-pointer hover:bg-[#EFF6FF] p-1.5 rounded"
                >
                  {fields.certSummary3Lines}
                </div>
              ) : (
                <div className="text-[#334155]">
                  جاهز للإدراج المباشر في القسم المختص بالضغط على «حفظ وإدراج» بالأسفل.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="px-4 sm:px-5 py-3 bg-white border-t border-[#E2E8F0] space-y-2 text-xs">
          {confirmCloseDraft && (
            <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-[#92400E]">
                هل تريد حفظ التعديلات غير المحفوظة كمسودة قبل الإغلاق؟
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraftNow}
                  className="px-3 py-1 bg-[#2563EB] text-white rounded font-bold cursor-pointer"
                >
                  نعم، احفظ كمسودة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmCloseDraft(false);
                    onClose();
                  }}
                  className="px-3 py-1 bg-[#DC2626] text-white rounded font-bold cursor-pointer"
                >
                  لا، إغلاق بدون حفظ
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleRequestClose}
              className={`min-h-[38px] px-4 border border-[#CBD5E1] font-semibold cursor-pointer ${buttonRadiusClass}`}
            >
              إلغاء
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraftNow}
                className={`min-h-[38px] px-4 border border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A] font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ كمسودة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onConfirmSave({
                    kind,
                    rawText,
                    fields,
                    extraParts,
                    appliedOptionalAdditions: appliedOptional,
                  });
                  setDirty(false);
                }}
                className={`min-h-[38px] px-5 bg-[#059669] hover:bg-[#047857] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
              >
                <Check className="w-4 h-4" />
                <span>حفظ وإدراج</span>
              </button>
            </div>
          </div>
        </div>

        {/* Inline Mini Click-to-Edit Overlay Inside Modal */}
        {miniEditTarget && (
          <div
            onClick={() => setMiniEditTarget(null)}
            className="absolute inset-0 z-20 bg-black/45 flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg bg-white border border-[#CBD5E1] shadow-2xl overflow-hidden text-xs ${buttonRadiusClass}`}
            >
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0A1633] text-white">
                <span className="font-bold">تعديل: {miniEditTarget.label}</span>
                <button
                  type="button"
                  onClick={() => setMiniEditTarget(null)}
                  className="p-1 rounded hover:bg-white/15 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {(
                  [
                    ['text', '✏️ تعديل كتابة', Type],
                    ['design', '🎨 تعديل تصميم', Palette],
                    ['suggestions', '💡 مقترحات ذكية لهذا الجزء', Lightbulb],
                  ] as const
                ).map(([tId, lbl, Icon]) => (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => setMiniEditTab(tId)}
                    className={`min-h-[32px] px-2.5 font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: miniEditTab === tId ? '#2563EB' : '#FFFFFF',
                      color: miniEditTab === tId ? '#FFFFFF' : '#334155',
                      border: `1px solid ${miniEditTab === tId ? '#2563EB' : '#CBD5E1'}`,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{lbl}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-3">
                {miniEditTab === 'text' && (
                  <textarea
                    rows={4}
                    value={miniEditTextDraft}
                    onChange={(e) => setMiniEditTextDraft(e.target.value)}
                    className={`w-full p-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                )}

                {miniEditTab === 'design' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setMiniEditDesignDraft((d) => ({ ...d, bold: !d.bold }))
                        }
                        className={`px-3 py-1.5 border font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass} ${
                          miniEditDesignDraft.bold
                            ? 'bg-[#2563EB] text-white border-[#2563EB]'
                            : 'bg-white border-[#CBD5E1]'
                        }`}
                      >
                        <Bold className="w-3.5 h-3.5" />
                        <span>عريض</span>
                      </button>

                      <select
                        value={miniEditDesignDraft.fontSizePx || 12}
                        onChange={(e) =>
                          setMiniEditDesignDraft((d) => ({
                            ...d,
                            fontSizePx: Number(e.target.value),
                          }))
                        }
                        className={`min-h-[32px] px-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
                      >
                        {[11, 12, 14, 16, 18].map((sz) => (
                          <option key={sz} value={sz}>
                            حجم الخط: {sz}px
                          </option>
                        ))}
                      </select>

                      <input
                        type="color"
                        value={miniEditDesignDraft.textColor || '#0F172A'}
                        onChange={(e) =>
                          setMiniEditDesignDraft((d) => ({ ...d, textColor: e.target.value }))
                        }
                        title="لون النص"
                        className="w-8 h-8 border cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(
                        [
                          ['right', 'يمين', AlignRight],
                          ['center', 'وسط', AlignCenter],
                          ['left', 'يسار', AlignLeft],
                        ] as const
                      ).map(([al, lbl, Icon]) => (
                        <button
                          key={al}
                          type="button"
                          onClick={() =>
                            setMiniEditDesignDraft((d) => ({ ...d, textAlign: al }))
                          }
                          className={`px-3 py-1 border inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass} ${
                            miniEditDesignDraft.textAlign === al
                              ? 'bg-[#2563EB] text-white border-[#2563EB]'
                              : 'bg-white border-[#CBD5E1]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{lbl}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {miniEditTab === 'suggestions' && (
                  <div className="space-y-2">
                    {getThreeFieldSuggestions(miniEditTarget.label, miniEditTextDraft).map(
                      (sug, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 border border-[#E2E8F0] bg-[#F8FAFC] space-y-1.5 ${buttonRadiusClass}`}
                        >
                          <div className="font-bold text-[#1E3A8A]">{sug.title}</div>
                          <div className="text-[11px] text-[#334155]">{sug.preview}</div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setMiniEditTextDraft(sug.preview);
                                setMiniEditTab('text');
                              }}
                              className="px-2.5 py-1 bg-[#2563EB] text-white rounded font-bold cursor-pointer"
                            >
                              تطبيق
                            </button>
                            <button
                              type="button"
                              onClick={() => setMiniEditTab('text')}
                              className="px-2.5 py-1 border border-[#CBD5E1] bg-white rounded cursor-pointer"
                            >
                              تجاهل
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
                  <div className="flex items-center gap-1.5">
                    {!miniConfirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setMiniConfirmDelete(true)}
                        className="px-2.5 py-1.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] rounded font-bold cursor-pointer"
                      >
                        حذف هذا الجزء
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (miniEditTarget.isExtraPart) {
                            setExtraParts((p) => p.filter((x) => x.id !== miniEditTarget.key));
                          } else {
                            setFields((p) => ({ ...p, [miniEditTarget.key]: '[ ... ]' }));
                          }
                          setMiniEditTarget(null);
                        }}
                        className="px-2.5 py-1.5 bg-[#DC2626] text-white rounded font-bold cursor-pointer"
                      >
                        تأكيد الحذف
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const newId = `extra-after-${Date.now()}`;
                        setExtraParts((p) => [
                          ...p,
                          { id: newId, title: `متابعة بعد ${miniEditTarget.label}`, body: '[ ... ]' },
                        ]);
                        setMiniEditTarget(null);
                      }}
                      className="px-2.5 py-1.5 border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A] rounded font-bold cursor-pointer"
                    >
                      + إضافة جزء بعد هذا
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveMiniEdit}
                    className={`px-4 py-1.5 bg-[#2563EB] text-white font-bold cursor-pointer ${buttonRadiusClass}`}
                  >
                    حفظ التعديل
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
