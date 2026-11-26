import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  FileImage,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { CvLanguage, ExtractedCertificateSummary } from '../types/cv';
import {
  PreparedUploadedFile,
  prepareFileForExtraction,
  requestExtractCertificateFromServer,
} from '../utils/cvFileParser';

interface CertificateQueueItem {
  id: string;
  file: PreparedUploadedFile;
  status: 'pending' | 'extracting' | 'extracted' | 'added' | 'ignored' | 'error';
  summary?: ExtractedCertificateSummary;
  errorMsg?: string;
}

interface CvCertificatesModalProps {
  open: boolean;
  onClose: () => void;
  language: CvLanguage;
  buttonRadiusClass: string;
  onAddCertificateToCv: (summary: ExtractedCertificateSummary) => void;
}

export const CvCertificatesModal: React.FC<CvCertificatesModalProps> = ({
  open,
  onClose,
  language,
  buttonRadiusClass,
  onAddCertificateToCv,
}) => {
  const [queue, setQueue] = useState<CertificateQueueItem[]>([]);
  const [addedCount, setAddedCount] = useState<number>(0);
  const [dragging, setDragging] = useState(false);
  const [batchBusy, setBatchBusy] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setGlobalError('');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleFilesSelected = async (files: FileList | File[]) => {
    setGlobalError('');
    const list = Array.from(files);
    const nextItems: CertificateQueueItem[] = [];

    for (const file of list) {
      try {
        const prepared = await prepareFileForExtraction(file);
        nextItems.push({
          id: prepared.id,
          file: prepared,
          status: 'pending',
        });
      } catch (err) {
        setGlobalError(
          err instanceof Error ? err.message : `تعذر قراءة الملف ${file.name}`
        );
      }
    }

    if (nextItems.length > 0) {
      setQueue((prev) => [...prev, ...nextItems]);
    }
  };

  const extractAndAddOne = async (itemId: string) => {
    const target = queue.find((q) => q.id === itemId);
    if (!target || target.status === 'added' || target.status === 'ignored') return;

    // If user already edited extracted summary before adding
    if (target.status === 'extracted' && target.summary) {
      onAddCertificateToCv(target.summary);
      setQueue((prev) =>
        prev.map((q) => (q.id === itemId ? { ...q, status: 'added' } : q))
      );
      setAddedCount((c) => c + 1);
      return;
    }

    setQueue((prev) =>
      prev.map((q) =>
        q.id === itemId ? { ...q, status: 'extracting', errorMsg: undefined } : q
      )
    );

    try {
      const summary = await requestExtractCertificateFromServer(
        target.file,
        language
      );
      onAddCertificateToCv(summary);
      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId ? { ...q, status: 'added', summary } : q
        )
      );
      setAddedCount((c) => c + 1);
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      const cleanErr =
        !raw || raw.includes('{') || raw.includes('503') || raw.includes('UNAVAILABLE')
          ? 'تعذر قراءة الملف، برجاء تجربة ملف أوضح.'
          : raw;
      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId
            ? {
                ...q,
                status: 'error',
                errorMsg: cleanErr,
              }
            : q
        )
      );
    }
  };

  const handleAddAllCertificates = async () => {
    const targets = queue.filter(
      (q) => q.status === 'pending' || q.status === 'extracted' || q.status === 'error'
    );
    if (targets.length === 0) return;
    setBatchBusy(true);
    for (const item of targets) {
      await extractAndAddOne(item.id);
    }
    setBatchBusy(false);
  };

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="استيراد شهادات ووثائق للـ CV"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-3xl max-h-[92vh] flex flex-col bg-white border border-[#CBD5E1] shadow-2xl overflow-hidden ${buttonRadiusClass}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0F172A] text-white border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-[#60A5FA]" />
            <div>
              <h3 className="font-editorial text-base font-bold">استيراد شهادات ووثائق وإضافتها للـ CV</h3>
              <p className="text-[11px] text-[#CBD5E1]">
                ارفع أكثر من شهادة أو دورة أو خطاب خبرة (صور / PDF / Word) لإدراج ملخصها وكلماتها المفتاحية تلقائياً
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
          {/* Added Counter Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]">
            <div className="flex items-center gap-2 font-bold text-[#1E3A8A]">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
              <span>تمت إضافة [{addedCount}] شهادة / وثيقة إلى السيرة الذاتية</span>
            </div>
            {queue.some((q) => q.status === 'pending' || q.status === 'extracted' || q.status === 'error') && (
              <button
                type="button"
                disabled={batchBusy}
                onClick={handleAddAllCertificates}
                className={`min-h-[34px] px-3.5 bg-[#059669] hover:bg-[#047857] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
              >
                {batchBusy ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري معالجة الكل...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>إضافة كل الشهادات للـ CV</span>
                  </>
                )}
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFilesSelected(e.target.files);
              e.target.value = '';
            }}
          />

          {/* Multi-file Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`p-5 border-2 border-dashed text-center cursor-pointer transition-colors ${buttonRadiusClass}`}
            style={{
              borderColor: dragging ? '#2563EB' : '#CBD5E1',
              backgroundColor: dragging ? '#EFF6FF' : '#F8FAFC',
            }}
          >
            <Upload className="w-6 h-6 mx-auto mb-2 text-[#2563EB]" />
            <div className="font-bold text-[#0F172A]">
              اضغط لاختيار ملفات متعددة أو اسحب الشهادات والوثائق هنا
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">
              صور (PNG / JPG) · ملفات PDF · ملفات Word (.docx)
            </div>
          </div>

          {globalError && (
            <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] font-semibold">
              {globalError}
            </div>
          )}

          {/* Uploaded Certificate Cards */}
          {queue.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 border bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${buttonRadiusClass}`}
                  style={{
                    borderColor:
                      item.status === 'added'
                        ? '#A7F3D0'
                        : item.status === 'ignored'
                        ? '#E2E8F0'
                        : '#CBD5E1',
                    backgroundColor:
                      item.status === 'added'
                        ? '#F0FDF4'
                        : item.status === 'ignored'
                        ? '#F8FAFC'
                        : '#FFFFFF',
                    opacity: item.status === 'ignored' ? 0.65 : 1,
                  }}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {item.file.previewDataUrl ? (
                      <img
                        src={item.file.previewDataUrl}
                        alt={item.file.fileName}
                        className="w-14 h-14 object-cover rounded border border-[#CBD5E1] shrink-0 bg-white"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded border border-[#DBEAFE] bg-[#EFF6FF] flex flex-col items-center justify-center shrink-0 text-[#1E3A8A] font-bold">
                        {item.file.kind === 'image' ? (
                          <FileImage className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                        <span className="text-[9px] mt-0.5">{item.file.kind.toUpperCase()}</span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="font-bold text-[#0F172A] truncate">
                        {item.file.fileName}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        الحجم: {item.file.sizeLabel}
                      </div>

                      {item.summary && (
                        <div className="mt-1.5 p-2 rounded bg-white border border-[#D1FAE5] text-[11px] space-y-0.5">
                          <div>
                            <strong>النوع:</strong> {item.summary.docType} ·{' '}
                            <strong>السنة:</strong> {item.summary.year}
                          </div>
                          <div>
                            <strong>الاسم:</strong> {item.summary.title} —{' '}
                            <strong>الجهة:</strong> {item.summary.issuer}
                          </div>
                          <div className="text-[#047857]">
                            <strong>المهارة المستفادة:</strong> {item.summary.keywordSkill}
                          </div>
                        </div>
                      )}

                      {item.errorMsg && (
                        <div className="text-[11px] text-[#DC2626] font-semibold">
                          {item.errorMsg}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {item.status === 'added' ? (
                      <span className="px-2.5 py-1.5 rounded-lg bg-[#DCFCE7] text-[#065F46] font-bold inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>تمت الإضافة</span>
                      </span>
                    ) : item.status === 'ignored' ? (
                      <button
                        type="button"
                        onClick={() =>
                          setQueue((prev) =>
                            prev.map((q) =>
                              q.id === item.id ? { ...q, status: 'pending' } : q
                            )
                          )
                        }
                        className={`px-2.5 py-1.5 border border-[#CBD5E1] bg-white text-[#475569] font-semibold cursor-pointer ${buttonRadiusClass}`}
                      >
                        استعادة
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={item.status === 'extracting' || batchBusy}
                          onClick={() => extractAndAddOne(item.id)}
                          className={`min-h-[34px] px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
                        >
                          {item.status === 'extracting' ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري الاستخراج...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>استخراج وإضافة للـ CV</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setQueue((prev) =>
                              prev.map((q) =>
                                q.id === item.id ? { ...q, status: 'ignored' } : q
                              )
                            )
                          }
                          className={`min-h-[34px] px-2.5 border border-[#CBD5E1] bg-[#F8FAFC] text-[#475569] font-semibold cursor-pointer ${buttonRadiusClass}`}
                        >
                          تجاهل
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      aria-label="حذف الملف"
                      onClick={() =>
                        setQueue((prev) => prev.filter((q) => q.id !== item.id))
                      }
                      className={`min-h-[34px] px-2 border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] cursor-pointer ${buttonRadiusClass}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between gap-2 text-xs">
          <span className="text-[11px] text-[#64748B]">
            تُضاف الشهادات والدورات والمهارات بصيغة مختصرة وكلمات مفتاحية متوافقة مع ATS.
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[36px] px-4 bg-[#0F172A] text-white font-bold cursor-pointer ${buttonRadiusClass}`}
          >
            تم وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
