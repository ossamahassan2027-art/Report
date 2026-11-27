import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { CvData, CvImportPresetFilter, CvLanguage } from '../types/cv';
import {
  ExtractedCvResult,
  PreparedUploadedFile,
  prepareFileForExtraction,
} from '../utils/cvFileParser';
import {
  CvExtractionMethodId,
  runCv4MethodExtraction,
} from '../utils/cvSmartExtractor4Methods';

interface CvImportModalProps {
  open: boolean;
  onClose: () => void;
  presetFilter: CvImportPresetFilter;
  language: CvLanguage;
  currentCv: CvData;
  buttonRadiusClass: string;
  onApplyExtractedCv: (cvData: CvData, extractedCount: number, missingFields: string[]) => void;
}

interface ReviewRowItem {
  key: string;
  label: string;
  value: string;
  confirmed: boolean;
  confidence: 'confirmed' | 'review' | 'missing';
  editing: boolean;
  kind: 'scalar' | 'experiences' | 'education' | 'skills' | 'certifications' | 'languages' | 'trainings';
}

const ACCEPT_BY_FILTER: Record<CvImportPresetFilter, string> = {
  all: '.pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.txt,.md',
  pdf: '.pdf,application/pdf',
  word: '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  image: '.png,.jpg,.jpeg,.webp,image/*',
  text: '.txt,.md,text/plain',
};

const EXTRACTION_METHOD_CARDS: {
  id: CvExtractionMethodId;
  title: string;
  desc: string;
}[] = [
  {
    id: 'method-1-pdfjs-text',
    title: 'طريقة 1: استخراج نص مباشر (PDF.js / Word)',
    desc: 'استخراج فوري للنصوص المدمجة في ملفات PDF وWord (.docx).',
  },
  {
    id: 'method-2-pdf-300dpi-ocr',
    title: 'طريقة 2: PDF → صور 300 DPI + OCR',
    desc: 'للملفات المصورة الممسوحة ضوئياً (ara + eng) بدقة عالية.',
  },
  {
    id: 'method-3-image-3settings',
    title: 'طريقة 3: صورة بـ 3 إعدادات تباين',
    desc: 'تجربة أبيض/أسود، تكبير حاد 2.8x، وقياسي واختيار الأوضح تلقائياً.',
  },
  {
    id: 'method-4-manual-voice',
    title: 'طريقة 4: إدخال يدوي + لصق + صوت',
    desc: 'لصق مباشر أو إملاء صوتي بالمايكروفون بدون أي أخطاء.',
  },
];

function sanitizeUserError(err: unknown): string {
  const raw = err instanceof Error ? err.message : '';
  if (!raw || raw.includes('{') || raw.includes('503') || raw.includes('UNAVAILABLE')) {
    return 'تعذر قراءة الملف تلقائياً — جرب الطريقة 2 (300 DPI) أو الطريقة 4 (اللصق اليدوي/الصوت).';
  }
  return raw;
}

export const CvImportModal: React.FC<CvImportModalProps> = ({
  open,
  onClose,
  presetFilter,
  language,
  currentCv,
  buttonRadiusClass,
  onApplyExtractedCv,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<CvImportPresetFilter>(presetFilter);
  const [selectedMethod, setSelectedMethod] =
    useState<CvExtractionMethodId>('method-1-pdfjs-text');
  const [methodUsedLabel, setMethodUsedLabel] = useState<string>('');
  const [preparedFile, setPreparedFile] = useState<PreparedUploadedFile | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [manualPasteVisible, setManualPasteVisible] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStage, setProgressStage] = useState('جاري قراءة الملف');
  const [errorMsg, setErrorMsg] = useState('');
  const [extractionResult, setExtractionResult] = useState<ExtractedCvResult | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRows, setReviewRows] = useState<ReviewRowItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const manualTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const speechRecRef = useRef<{ stop?: () => void } | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedFilter(presetFilter);
    setSelectedMethod(
      presetFilter === 'image'
        ? 'method-3-image-3settings'
        : presetFilter === 'text'
        ? 'method-4-manual-voice'
        : 'method-1-pdfjs-text'
    );
    setMethodUsedLabel('');
    setPreparedFile(null);
    setPastedText('');
    setManualPasteVisible(presetFilter === 'text');
    setVoiceActive(false);
    setErrorMsg('');
    setProgressPercent(0);
    setProgressStage('جاري قراءة الملف محلياً');
    setExtractionResult(null);
    setReviewOpen(false);
    setReviewRows([]);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        speechRecRef.current?.stop?.();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      speechRecRef.current?.stop?.();
      window.removeEventListener('keydown', onKey);
    };
  }, [open, presetFilter, onClose]);

  if (!open) return null;

  const handleToggleVoiceDictation = () => {
    if (voiceActive) {
      speechRecRef.current?.stop?.();
      setVoiceActive(false);
      return;
    }
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: (ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: (ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setManualPasteVisible(true);
      setErrorMsg('المتصفح الحالي لا يدعم الإملاء الصوتي المباشر — استخدم خانة اللصق اليدوي.');
      return;
    }
    const rec = new SpeechRec();
    rec.lang = language === 'en' ? 'en-US' : 'ar-EG';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += `${event.results[i][0].transcript} `;
      }
      setManualPasteVisible(true);
      setPastedText((prev) => `${prev ? `${prev}\n` : ''}${transcript.trim()}`);
    };
    rec.onerror = () => setVoiceActive(false);
    rec.onend = () => setVoiceActive(false);
    speechRecRef.current = rec;
    setSelectedMethod('method-4-manual-voice');
    setManualPasteVisible(true);
    setVoiceActive(true);
    rec.start();
  };

  const handleChooseFile = async (file: File) => {
    setErrorMsg('');
    setExtractionResult(null);
    setReviewOpen(false);
    setProgressPercent(0);
    try {
      const prepared = await prepareFileForExtraction(file);
      setPreparedFile(prepared);
      if (prepared.kind === 'image') {
        setSelectedMethod('method-3-image-3settings');
      } else if (prepared.kind === 'pdf') {
        setSelectedMethod('method-1-pdfjs-text');
      } else if (prepared.kind === 'text') {
        setSelectedMethod('method-4-manual-voice');
      }
    } catch (err) {
      setErrorMsg(sanitizeUserError(err));
    }
  };

  const getConfidence = (val: string, listLen?: number): 'confirmed' | 'review' | 'missing' => {
    if (typeof listLen === 'number') {
      if (listLen === 0) return 'missing';
      return val.includes('[ غير موجود ]') || val.includes('[ ... ]') ? 'review' : 'confirmed';
    }
    const clean = val.trim();
    if (!clean || clean === '[ ... ]' || clean === '[ غير موجود ]') return 'missing';
    if (clean.length < 4 || /\?{2,}|~/.test(clean)) return 'review';
    return 'confirmed';
  };

  const buildReviewRows = (cv: CvData): ReviewRowItem[] => [
    {
      key: 'fullName',
      label: 'الاسم الكامل',
      value: cv.fullName,
      confirmed: !cv.fullName.includes('['),
      confidence: getConfidence(cv.fullName),
      editing: false,
      kind: 'scalar',
    },
    {
      key: 'targetJobTitle',
      label: 'المسمى الوظيفي',
      value: cv.targetJobTitle,
      confirmed: !cv.targetJobTitle.includes('['),
      confidence: getConfidence(cv.targetJobTitle),
      editing: false,
      kind: 'scalar',
    },
    {
      key: 'phone',
      label: 'الهاتف',
      value: cv.phone,
      confirmed: !cv.phone.includes('['),
      confidence: getConfidence(cv.phone),
      editing: false,
      kind: 'scalar',
    },
    {
      key: 'email',
      label: 'البريد الإلكتروني',
      value: cv.email,
      confirmed: !cv.email.includes('['),
      confidence: getConfidence(cv.email),
      editing: false,
      kind: 'scalar',
    },
    {
      key: 'location',
      label: 'العنوان / الموقع',
      value: cv.location,
      confirmed: !cv.location.includes('['),
      confidence: getConfidence(cv.location),
      editing: false,
      kind: 'scalar',
    },
    {
      key: 'summary',
      label: 'الملخص المهني',
      value: cv.summary,
      confirmed: !cv.summary.includes('['),
      confidence: getConfidence(cv.summary),
      editing: false,
      kind: 'scalar',
    },
    {
      key: 'experiences',
      label: `الخبرات العملية (${cv.experiences.length})`,
      value:
        cv.experiences.length > 0
          ? cv.experiences
              .map((e) => `${e.jobTitle} | ${e.company} | ${e.dateRange} :: ${e.bullets.join('؛ ')}`)
              .join('\n')
          : '[ غير موجود ]',
      confirmed: cv.experiences.length > 0,
      confidence: getConfidence(cv.experiences[0]?.jobTitle || '', cv.experiences.length),
      editing: false,
      kind: 'experiences',
    },
    {
      key: 'education',
      label: `التعليم (${cv.education.length})`,
      value:
        cv.education.length > 0
          ? cv.education.map((e) => `${e.degree} — ${e.institution} (${e.dateRange})`).join('\n')
          : '[ غير موجود ]',
      confirmed: cv.education.length > 0,
      confidence: getConfidence(cv.education[0]?.degree || '', cv.education.length),
      editing: false,
      kind: 'education',
    },
    {
      key: 'skills',
      label: `المهارات (${cv.skills.length})`,
      value:
        cv.skills.length > 0
          ? cv.skills.map((s) => (s.level ? `${s.name} - ${s.level}` : s.name)).join('، ')
          : '[ غير موجود ]',
      confirmed: cv.skills.length > 0,
      confidence: getConfidence(cv.skills[0]?.name || '', cv.skills.length),
      editing: false,
      kind: 'skills',
    },
    {
      key: 'certifications',
      label: `الشهادات (${cv.certifications.length})`,
      value:
        cv.certifications.length > 0
          ? cv.certifications.map((c) => `${c.name} — ${c.issuer} (${c.date})`).join('\n')
          : '[ غير موجود ]',
      confirmed: cv.certifications.length > 0,
      confidence: getConfidence(cv.certifications[0]?.name || '', cv.certifications.length),
      editing: false,
      kind: 'certifications',
    },
    {
      key: 'languages',
      label: `اللغات (${cv.languages.length})`,
      value:
        cv.languages.length > 0
          ? cv.languages
              .map((l) => (l.proficiency && !l.proficiency.includes('[') ? `${l.name} - ${l.proficiency}` : l.name))
              .join('، ')
          : '[ غير موجود ]',
      confirmed: cv.languages.length > 0,
      confidence: getConfidence(cv.languages[0]?.name || '', cv.languages.length),
      editing: false,
      kind: 'languages',
    },
  ];

  const handleExtractNow = async () => {
    setErrorMsg('');
    const useManualText = pastedText.trim().length > 0;
    if (!preparedFile && !useManualText) {
      setErrorMsg('يرجى اختيار ملف أو لصق / إملاء نص السيرة الذاتية أولاً.');
      return;
    }

    setBusy(true);
    setProgressPercent(5);
    setProgressStage('تشغيل الاستخراج المحلي 100% (بدون سيرفر خارجي)');

    try {
      const targetPayload: PreparedUploadedFile | null =
        useManualText && !preparedFile
          ? {
              id: `txt-${Date.now()}`,
              fileName: 'نص-السيرة-الذاتية.txt',
              sizeBytes: pastedText.length,
              sizeLabel: `${pastedText.length} حرف`,
              kind: 'text',
              mimeType: 'text/plain',
              plainText: pastedText,
              previewSnippet: pastedText.slice(0, 200),
            }
          : preparedFile;

      const res = await runCv4MethodExtraction({
        method: useManualText && !preparedFile ? 'method-4-manual-voice' : selectedMethod,
        preparedFile: targetPayload,
        manualText: pastedText,
        language,
        currentCv,
        onProgress: (pct, stage) => {
          setProgressPercent(pct);
          setProgressStage(stage);
        },
      });

      setMethodUsedLabel(res.methodUsedLabel);
      setExtractionResult(res);
      setReviewRows(buildReviewRows(res.cvData));
      setReviewOpen(true);
    } catch (err) {
      setErrorMsg(sanitizeUserError(err));
    } finally {
      setBusy(false);
    }
  };

  const applyRowEditsToCv = (baseCv: CvData): { cv: CvData; count: number; missing: string[] } => {
    const next: CvData = { ...baseCv };
    reviewRows.forEach((row) => {
      const val = row.value.trim();
      if (row.key === 'fullName') next.fullName = val || '[ ... ]';
      else if (row.key === 'targetJobTitle') next.targetJobTitle = val || '[ ... ]';
      else if (row.key === 'phone') next.phone = val || '[ ... ]';
      else if (row.key === 'email') next.email = val || '[ ... ]';
      else if (row.key === 'location') next.location = val || '[ ... ]';
      else if (row.key === 'summary') next.summary = val || '[ ... ]';
      else if (row.key === 'experiences' && val && val !== '[ ... ]') {
        next.experiences = val
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .map((line, idx) => {
            const [headPart, bulletsPart] = line.split('::');
            const cols = (headPart || '').split('|').map((s) => s.trim());
            const bullets = bulletsPart
              ? bulletsPart.split(/[؛;]+/).map((b) => b.trim()).filter(Boolean)
              : ['[ ... ]'];
            return {
              id: `exp-rev-${Date.now()}-${idx}`,
              jobTitle: cols[0] || '[ ... ]',
              company: cols[1] || '[ ... ]',
              location: '[ ... ]',
              dateRange: cols[2] || '[ ... ]',
              bullets: bullets.length > 0 ? bullets : ['[ ... ]'],
            };
          });
      } else if (row.key === 'education' && val && val !== '[ ... ]') {
        next.education = val
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .map((line, idx) => {
            const parts = line.split(/\s*[—\-]\s*/);
            const yrMatch = line.match(/\(([^)]+)\)/);
            return {
              id: `edu-rev-${Date.now()}-${idx}`,
              degree: parts[0]?.trim() || line,
              institution: parts[1]?.replace(/\([^)]*\)/g, '').trim() || '[ ... ]',
              dateRange: yrMatch ? yrMatch[1].trim() : '[ ... ]',
              details: '',
            };
          });
      } else if (row.key === 'skills' && val && val !== '[ ... ]') {
        next.skills = val
          .split(/[،,\n]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((entry, idx) => {
            const parts = entry.split(' - ');
            return {
              id: `sk-rev-${Date.now()}-${idx}`,
              name: parts[0].trim(),
              level: parts[1]?.trim() || '',
            };
          });
      } else if (row.key === 'certifications' && val && val !== '[ ... ]') {
        next.certifications = val
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .map((line, idx) => {
            const parts = line.split(/\s*[—\-]\s*/);
            const yrMatch = line.match(/\(([^)]+)\)/);
            return {
              id: `cert-rev-${Date.now()}-${idx}`,
              name: parts[0]?.trim() || line,
              issuer: parts[1]?.replace(/\([^)]*\)/g, '').trim() || '[ ... ]',
              date: yrMatch ? yrMatch[1].trim() : '[ ... ]',
            };
          });
      } else if (row.key === 'languages' && val && val !== '[ ... ]') {
        next.languages = val
          .split(/[،,\n]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((entry, idx) => {
            const parts = entry.split(' - ');
            return {
              id: `lang-rev-${Date.now()}-${idx}`,
              name: parts[0].trim(),
              proficiency: parts[1]?.trim() || '[ ... ]',
            };
          });
      }
    });

    const missing: string[] = [];
    let count = 0;
    const checks: [string, string][] = [
      [next.fullName, 'الاسم الكامل'],
      [next.targetJobTitle, 'المسمى الوظيفي'],
      [next.phone, 'الهاتف'],
      [next.email, 'البريد الإلكتروني'],
      [next.location, 'العنوان / الموقع'],
      [next.summary, 'الملخص المهني'],
    ];
    checks.forEach(([v, lbl]) => {
      if (v && !v.includes('[')) count += 1;
      else missing.push(lbl);
    });
    if (next.experiences.length > 0) count += next.experiences.length;
    else missing.push('الخبرات العملية');
    if (next.education.length > 0) count += next.education.length;
    else missing.push('التعليم');
    if (next.skills.length > 0) count += next.skills.length;
    else missing.push('المهارات');
    if (next.certifications.length > 0) count += next.certifications.length;
    if (next.languages.length > 0) count += next.languages.length;

    return { cv: next, count, missing };
  };

  const handleConfirmAll = () => {
    if (!extractionResult) return;
    const { cv, count, missing } = applyRowEditsToCv(extractionResult.cvData);
    onApplyExtractedCv(cv, count, missing);
    onClose();
  };

  const filterChips: { id: CvImportPresetFilter; label: string }[] = [
    { id: 'all', label: 'الكل' },
    { id: 'pdf', label: 'PDF' },
    { id: 'word', label: 'Word' },
    { id: 'image', label: 'صورة' },
    { id: 'text', label: 'نص' },
  ];

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="استيراد CV قديم وإفراغ بياناته"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-3xl max-h-[92vh] flex flex-col bg-white border border-[#CBD5E1] shadow-2xl overflow-hidden ${buttonRadiusClass}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0A1633] text-white border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <Upload className="w-5 h-5 text-[#60A5FA]" />
            <div>
              <h3 className="font-editorial text-base font-bold">
                استيراد CV قديم وإفراغ بياناته محلياً
              </h3>
              <p className="text-[11px] text-[#CBD5E1]">
                قراءة محلية 100% داخل المتصفح لملفات PDF وWord (.docx) والصور والنصوص — بدون أي سيرفر خارجي
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className={`min-h-[34px] min-w-[34px] flex items-center justify-center border border-[#334155] text-[#CBD5E1] hover:text-white cursor-pointer ${buttonRadiusClass}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* 4 Selectable Local Extraction Methods */}
          <div className="space-y-1.5">
            <div className="font-bold text-[#1E3A8A]">اختر طريقة الاستخراج المحلية (بدون أي سيرفر خارجي):</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXTRACTION_METHOD_CARDS.map((m) => {
                const active = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(m.id);
                      if (m.id === 'method-4-manual-voice') {
                        setManualPasteVisible(true);
                        setTimeout(() => manualTextareaRef.current?.focus(), 60);
                      }
                    }}
                    className={`p-2.5 border text-right cursor-pointer transition-colors ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: active ? '#EFF6FF' : '#F8FAFC',
                      borderColor: active ? '#2563EB' : '#CBD5E1',
                    }}
                  >
                    <div className="font-bold text-[#0F172A] text-[11.5px]">{m.title}</div>
                    <div className="text-[10.5px] text-[#64748B] mt-0.5">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format Filter Chips + Voice Dictation + Manual Paste */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-[#334155] ml-1">نوع الملف:</span>
              {filterChips.map((chip) => {
                const active = selectedFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setSelectedFilter(chip.id);
                      if (chip.id === 'text') setManualPasteVisible(true);
                    }}
                    className={`min-h-[32px] px-3 border font-bold cursor-pointer transition-colors ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: active ? '#2563EB' : '#F8FAFC',
                      color: active ? '#FFFFFF' : '#1E3A8A',
                      borderColor: active ? '#2563EB' : '#CBD5E1',
                    }}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleVoiceDictation}
                className={`min-h-[32px] px-3 border font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                style={{
                  backgroundColor: voiceActive ? '#DC2626' : '#F5F3FF',
                  borderColor: voiceActive ? '#DC2626' : '#DDD6FE',
                  color: voiceActive ? '#FFFFFF' : '#5B21B6',
                }}
              >
                {voiceActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{voiceActive ? 'إيقاف المايك' : 'إملاء بالصوت'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualPasteVisible(true);
                  setTimeout(() => manualTextareaRef.current?.focus(), 60);
                }}
                className={`min-h-[32px] px-3 border border-[#CBD5E1] bg-white hover:bg-[#EFF6FF] text-[#1E3A8A] font-bold cursor-pointer ${buttonRadiusClass}`}
              >
                الصق النص يدوياً
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_BY_FILTER[selectedFilter]}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleChooseFile(f);
              e.target.value = '';
            }}
          />

          {/* Dropzone (unless text mode only) */}
          {selectedFilter !== 'text' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleChooseFile(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 border-2 border-dashed text-center cursor-pointer transition-colors ${buttonRadiusClass}`}
              style={{
                borderColor: dragging ? '#2563EB' : '#CBD5E1',
                backgroundColor: dragging ? '#EFF6FF' : '#F8FAFC',
              }}
            >
              <Upload className="w-7 h-7 mx-auto mb-2 text-[#2563EB]" />
              <div className="font-bold text-sm text-[#0F172A]">
                اسحب الملف هنا أو اضغط للاختيار (PDF / Word / صورة / نص)
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">
                يعمل محلياً بالكامل داخل المتصفح — الحد الأقصى 10 ميجابايت
              </div>
            </div>
          )}

          {/* Manual Paste Textarea */}
          {(manualPasteVisible || selectedFilter === 'text' || !preparedFile) && (
            <div className="space-y-1.5">
              <label className="block font-bold text-[#334155]">
                لصق أو إملاء نص الـ CV يدوياً (يعمل فوراً بدون انتظار):
              </label>
              <textarea
                ref={manualTextareaRef}
                rows={selectedFilter === 'text' || manualPasteVisible ? 6 : 3}
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  setExtractionResult(null);
                  setErrorMsg('');
                }}
                placeholder="الصق هنا محتوى السيرة الذاتية القديمة (الاسم، الهاتف، الخبرات، التعليم، المهارات، الشهادات، اللغات)..."
                className={`w-full p-2.5 border border-[#CBD5E1] bg-white leading-relaxed ${buttonRadiusClass}`}
              />
            </div>
          )}

          {/* Selected File Summary Card */}
          {preparedFile && (
            <div
              className={`p-3.5 border border-[#BFDBFE] bg-[#EFF6FF]/60 space-y-2.5 ${buttonRadiusClass}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {preparedFile.kind === 'image' ? (
                    <FileImage className="w-5 h-5 text-[#7C3AED] shrink-0" />
                  ) : preparedFile.kind === 'word' ? (
                    <FileSpreadsheet className="w-5 h-5 text-[#2563EB] shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-[#059669] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-[#0F172A] truncate">{preparedFile.fileName}</div>
                    <div className="text-[11px] text-[#475569]">
                      الحجم: {preparedFile.sizeLabel} · النوع: {preparedFile.kind.toUpperCase()}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreparedFile(null);
                    setExtractionResult(null);
                    setErrorMsg('');
                  }}
                  className="text-[#DC2626] font-bold hover:underline cursor-pointer"
                >
                  تغيير الملف
                </button>
              </div>

              {preparedFile.previewDataUrl ? (
                <div className="flex justify-center bg-white border border-[#DBEAFE] rounded-lg p-2">
                  <img
                    src={preparedFile.previewDataUrl}
                    alt={preparedFile.fileName}
                    className="max-h-40 object-contain rounded"
                  />
                </div>
              ) : (
                <div className="p-2.5 bg-white border border-[#DBEAFE] rounded-lg text-[11px] text-[#334155] whitespace-pre-wrap max-h-28 overflow-y-auto">
                  {preparedFile.previewSnippet}
                </div>
              )}
            </div>
          )}

          {/* Local Progress Bar */}
          {busy && (
            <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] space-y-2">
              <div className="flex items-center justify-between font-bold text-[#1E3A8A]">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progressStage} ... {progressPercent}%</span>
                </span>
                <span className="tabular-nums-ar">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-[#DBEAFE] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Extract Now Action */}
          {!extractionResult && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy || (!preparedFile && !pastedText.trim())}
                onClick={handleExtractNow}
                className={`min-h-[40px] px-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{progressStage} ... {progressPercent}%</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>استخراج البيانات الآن (محلي 100%)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Clean Arabic Error Box with Retry + Paste Manually */}
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] space-y-2.5">
              <div className="font-bold">{errorMsg}</div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleExtractNow}
                  className={`min-h-[34px] px-3.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة المحاولة</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManualPasteVisible(true);
                    setSelectedMethod('method-4-manual-voice');
                    setErrorMsg('');
                    setTimeout(() => manualTextareaRef.current?.focus(), 60);
                  }}
                  className={`min-h-[34px] px-3.5 bg-white border border-[#FCA5A5] text-[#991B1B] font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>الصق النص يدوياً</span>
                </button>
              </div>
            </div>
          )}

          {/* Extraction Complete + Review Table Immediately Open */}
          {extractionResult && (
            <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
              <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>
                      تم استخراج [{extractionResult.extractedFieldCount}] حقل بنجاح مع تصحيح النصوص العربية.
                    </span>
                  </div>
                  {methodUsedLabel && (
                    <div className="text-[10.5px] text-[#047857] font-semibold">
                      {methodUsedLabel}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewOpen((prev) => !prev)}
                    className={`min-h-[34px] px-3 bg-white border border-[#10B981] text-[#065F46] font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>{reviewOpen ? 'إخفاء جدول المراجعة' : 'مراجعة البيانات المستخرجة'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAll}
                    className={`min-h-[34px] px-4 bg-[#059669] hover:bg-[#047857] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>تأكيد وملء CV</span>
                  </button>
                </div>
              </div>

              {extractionResult.missingFields.length > 0 && (
                <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
                  <span>
                    حقول غير متوفرة بالملف [{extractionResult.missingFields.join('، ')}] — تم تمييزها بالأصفر بـ{' '}
                    <span className="bg-[#FEF08A] text-[#854D0E] px-1 rounded font-bold">[ غير موجود ]</span>{' '}
                    لتعديلها فوراً.
                  </span>
                </div>
              )}

              {/* Review Table with ✅/⚠️/❌ Confidence Badges */}
              {reviewOpen && (
                <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#EFF6FF] text-[#1E3A8A] border-b border-[#BFDBFE]">
                        <th className="py-2 px-3 font-bold w-36">الحقل</th>
                        <th className="py-2 px-3 font-bold">القيمة المستخرجة</th>
                        <th className="py-2 px-3 font-bold w-32">الثقة</th>
                        <th className="py-2 px-3 font-bold w-24 text-left">تعديل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {reviewRows.map((row, idx) => {
                        const isMissing =
                          row.confidence === 'missing' ||
                          !row.value.trim() ||
                          row.value.trim() === '[ غير موجود ]' ||
                          row.value.trim() === '[ ... ]';
                        return (
                          <tr
                            key={row.key}
                            className={`align-top ${
                              isMissing
                                ? 'bg-[#FEFCE8]'
                                : idx % 2 === 1
                                ? 'bg-[#F8FAFC]/70'
                                : 'bg-white'
                            }`}
                          >
                            <td className="py-2 px-3 font-bold text-[#0F172A]">{row.label}</td>
                            <td className="py-2 px-3 text-[#334155]">
                              {row.editing ? (
                                <textarea
                                  rows={row.kind === 'scalar' && row.key !== 'summary' ? 1 : 3}
                                  value={row.value}
                                  onChange={(e) =>
                                    setReviewRows((prev) =>
                                      prev.map((r) =>
                                        r.key === row.key ? { ...r, value: e.target.value } : r
                                      )
                                    )
                                  }
                                  className={`w-full p-2 border border-[#2563EB] bg-white ${buttonRadiusClass}`}
                                />
                              ) : (
                                <div className="whitespace-pre-wrap text-[11.5px] leading-relaxed">
                                  {isMissing ? (
                                    <span className="bg-[#FEF08A] text-[#854D0E] px-1.5 py-0.5 rounded font-bold">
                                      [ غير موجود ]
                                    </span>
                                  ) : (
                                    row.value
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {row.confidence === 'confirmed' && !isMissing ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] font-bold text-[10.5px]">
                                  ✅ مؤكد
                                </span>
                              ) : row.confidence === 'review' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#FFFBEB] text-[#B45309] font-bold text-[10.5px]">
                                  ⚠️ للمراجعة
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#FEF08A] text-[#854D0E] font-bold text-[10.5px]">
                                  ❌ غير موجود
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-left">
                              <button
                                type="button"
                                onClick={() =>
                                  setReviewRows((prev) =>
                                    prev.map((r) =>
                                      r.key === row.key ? { ...r, editing: !r.editing } : r
                                    )
                                  )
                                }
                                className={`px-2 py-1 border border-[#CBD5E1] bg-white text-[#1E3A8A] font-semibold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>{row.editing ? 'حفظ' : 'تعديل'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[36px] px-4 border border-[#CBD5E1] bg-white font-semibold cursor-pointer ${buttonRadiusClass}`}
          >
            إلغاء
          </button>

          {extractionResult && (
            <button
              type="button"
              onClick={handleConfirmAll}
              className={`min-h-[36px] px-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
            >
              <Check className="w-4 h-4" />
              <span>تأكيد وملء CV</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
