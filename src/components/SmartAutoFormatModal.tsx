import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Columns2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Undo2,
  X,
} from 'lucide-react';
import {
  SmartFormatAnalysisResult,
  SmartFormatBundlePayload,
  SmartFormatScope,
} from '../utils/smartAutoFormatter';

interface SmartAutoFormatModalProps {
  open: boolean;
  onClose: () => void;
  scope: SmartFormatScope;
  analysis: SmartFormatAnalysisResult | null;
  buttonRadiusClass: string;
  canUndoFormat: boolean;
  onApplyAll: (payload: SmartFormatBundlePayload, compactReportSpacing?: boolean) => void;
  onApplySingleFix: (fixId: string, payload: SmartFormatBundlePayload) => void;
  onUndoFormat: () => void;
}

const PROGRESS_STEPS = [
  'فحص إملائي',
  'فحص ترقيم',
  'توحيد خطوط',
  'توحيد تواريخ',
  'فحص جداول',
  'فحص طول',
];

const SCOPE_LABELS: Record<SmartFormatScope, string> = {
  report: 'التقرير الحالي بالكامل',
  cv: 'السيرة الذاتية (CV + ATS)',
  tasks: 'جدول المهام الأسبوعي',
  evaluations: 'استمارات التقييم',
  'plan-recs': 'الخطة والتوصيات',
};

export const SmartAutoFormatModal: React.FC<SmartAutoFormatModalProps> = ({
  open,
  onClose,
  scope,
  analysis,
  buttonRadiusClass,
  canUndoFormat,
  onApplyAll,
  onApplySingleFix,
  onUndoFormat,
}) => {
  const [scanning, setScanning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [compactLongReport, setCompactLongReport] = useState<boolean | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [appliedAllDone, setAppliedAllDone] = useState(false);

  useEffect(() => {
    if (!open || !analysis) return;
    setScanning(true);
    setStepIdx(0);
    setShowSideBySide(false);
    setCompactLongReport(null);
    setAppliedIds([]);
    setAppliedAllDone(false);

    let idx = 0;
    const timer = window.setInterval(() => {
      idx += 1;
      if (idx >= PROGRESS_STEPS.length) {
        window.clearInterval(timer);
        setStepIdx(PROGRESS_STEPS.length - 1);
        setScanning(false);
      } else {
        setStepIdx(idx);
      }
    }, 115);

    return () => window.clearInterval(timer);
  }, [open, analysis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !analysis) return null;

  const progressPct = scanning
    ? Math.round(((stepIdx + 1) / PROGRESS_STEPS.length) * 100)
    : 100;

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="التنسيق الآلي الذكي"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border border-[#CBD5E1] shadow-2xl overflow-hidden ${buttonRadiusClass}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0A1633] text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-editorial text-base sm:text-lg font-bold truncate">
                تقرير التنسيق الآلي الذكي — {SCOPE_LABELS[scope]}
              </h2>
              <p className="text-[11px] text-[#94A3B8]">
                معالجة محلية ذكية بدون حذف أي بيانات — يُحفظ نسخ احتياطية في سجل التعديلات تلقائياً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="min-h-[36px] min-w-[36px] rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs bg-[#F8FAFC]">
          {/* Step Progress Bar */}
          <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                    <span>جاري التنسيق الذكي... ({PROGRESS_STEPS[stepIdx]})</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                    <span>
                      اكتمل الفحص الآلي — تم رصد {analysis.totalFixCount} تحسيناً جاهزاً للتطبيق
                    </span>
                  </>
                )}
              </div>
              <span className="font-bold text-[#2563EB] tabular-nums-ar">{progressPct}%</span>
            </div>

            <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] transition-all duration-150"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PROGRESS_STEPS.map((st, idx) => {
                const done = !scanning || idx < stepIdx;
                const active = scanning && idx === stepIdx;
                return (
                  <span
                    key={st}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-semibold border ${
                      done
                        ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
                        : active
                        ? 'bg-[#EFF6FF] border-[#93C5FD] text-[#1D4ED8]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    {done ? '✓ ' : ''}
                    {st}
                  </span>
                );
              })}
            </div>
          </div>

          {!scanning && (
            <>
              {/* CV ATS Score & Page Length Summary */}
              {scope === 'cv' && typeof analysis.atsScoreAfter === 'number' && (
                <div className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[#065F46] font-bold">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <div>
                      <div>
                        نسبة توافق ATS الجديدة المتوقعة:{' '}
                        <span className="tabular-nums-ar text-sm">
                          {analysis.atsScoreBefore}% ← {analysis.atsScoreAfter}%
                        </span>
                      </div>
                      <div className="text-[11px] font-normal text-[#047857]">
                        {analysis.cvPageRecommendation === 'single-page'
                          ? `الخبرة (${analysis.cvYearsDetected} سنوات < 10) — تنسيق مضغوط تلقائياً في صفحة واحدة`
                          : `الخبرة (${analysis.cvYearsDetected} سنوات >= 10) — تنسيق منظم في صفحتين كحد أقصى`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Long Document Prompt */}
              {analysis.isReportLong && (
                <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-[#92400E]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>المستند طويل، هل تريد تقليل المسافات تلقائياً؟</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCompactLongReport(true)}
                      className={`min-h-[32px] px-3 font-bold cursor-pointer ${buttonRadiusClass} ${
                        compactLongReport === true
                          ? 'bg-[#059669] text-white'
                          : 'bg-white border border-[#CBD5E1] text-[#0F172A]'
                      }`}
                    >
                      نعم {compactLongReport === true ? '✓' : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompactLongReport(false)}
                      className={`min-h-[32px] px-3 font-bold cursor-pointer ${buttonRadiusClass} ${
                        compactLongReport === false
                          ? 'bg-[#475569] text-white'
                          : 'bg-white border border-[#CBD5E1] text-[#0F172A]'
                      }`}
                    >
                      لا {compactLongReport === false ? '✓' : ''}
                    </button>
                  </div>
                </div>
              )}

              {/* Formatting Report Table */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-[#EFF6FF] border-b border-[#BFDBFE] font-bold text-[#1E3A8A] flex items-center justify-between">
                  <span>تقرير التنسيق والأخطاء المرصودة</span>
                  <span className="text-[11px] text-[#334155]">
                    لا يتم تغيير المعنى أو حذف أي بيانات مطلقاً
                  </span>
                </div>

                {analysis.fixes.length === 0 ? (
                  <div className="p-6 text-center text-[#047857] font-bold">
                    ✓ المستند منسق بشكل ممتاز ولا توجد أخطاء إضافية تتطلب التعديل.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#334155]">
                          <th className="py-2.5 px-3 font-bold">نوع الخطأ</th>
                          <th className="py-2.5 px-3 font-bold">العدد</th>
                          <th className="py-2.5 px-3 font-bold">مثال قبل / بعد</th>
                          <th className="py-2.5 px-3 font-bold">الحالة</th>
                          <th className="py-2.5 px-3 font-bold text-left">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {analysis.fixes.map((fix) => {
                          const isManual = fix.status === 'يحتاج مراجعة يدوية';
                          const singlePayload = analysis.perCategoryPayloads[fix.id];
                          const isRowApplied = appliedIds.includes(fix.id) || appliedAllDone;
                          return (
                            <tr key={fix.id} className="hover:bg-[#F8FAFC] align-top">
                              <td className="py-2.5 px-3 font-bold text-[#0F172A] whitespace-nowrap">
                                {fix.category}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-[#2563EB] tabular-nums-ar">
                                {fix.count}
                              </td>
                              <td className="py-2.5 px-3 space-y-1 max-w-[300px]">
                                <div className="text-[11px] text-[#B91C1C] bg-[#FEF2F2] px-2 py-0.5 rounded line-clamp-2">
                                  قبل: {fix.beforeExample}
                                </div>
                                <div className="text-[11px] text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded line-clamp-2">
                                  بعد: {fix.afterExample}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                                    isManual
                                      ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                                      : 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
                                  }`}
                                >
                                  {fix.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-left whitespace-nowrap">
                                {isManual || !singlePayload ? (
                                  <span className="text-[10.5px] text-[#B45309] font-semibold">
                                    مراجعة المستخدم
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isRowApplied}
                                    onClick={() => {
                                      onApplySingleFix(fix.id, singlePayload);
                                      setAppliedIds((p) => [...p, fix.id]);
                                    }}
                                    className={`min-h-[30px] px-2.5 text-[11px] font-bold border cursor-pointer disabled:opacity-55 ${buttonRadiusClass} ${
                                      isRowApplied
                                        ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
                                        : 'bg-white border-[#CBD5E1] hover:border-[#2563EB] text-[#1E3A8A]'
                                    }`}
                                  >
                                    {isRowApplied ? 'تم التطبيق ✓' : 'تطبيق إصلاح محدد فقط'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Side-by-Side Comparison Preview */}
              {showSideBySide && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border border-[#CBD5E1] rounded-xl p-3.5">
                  <div className="border border-[#FECACA] bg-[#FEF2F2]/40 rounded-lg p-3 space-y-2">
                    <div className="font-bold text-[#991B1B] border-b border-[#FECACA] pb-1">
                      الأصل (قبل التنسيق)
                    </div>
                    {analysis.previewOriginalLines.map((ln, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="text-[10.5px] font-bold text-[#64748B]">{ln.label}</div>
                        <div className="whitespace-pre-wrap text-[11px] text-[#334155]">
                          {ln.text || '[ ... ]'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border border-[#A7F3D0] bg-[#ECFDF5]/40 rounded-lg p-3 space-y-2">
                    <div className="font-bold text-[#065F46] border-b border-[#A7F3D0] pb-1">
                      بعد التنسيق الآلي الذكي
                    </div>
                    {analysis.previewFormattedLines.map((ln, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="text-[10.5px] font-bold text-[#047857]">{ln.label}</div>
                        <div className="whitespace-pre-wrap text-[11px] text-[#0F172A]">
                          {ln.text || '[ ... ]'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-white border-t border-[#E2E8F0] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={scanning}
              onClick={() => setShowSideBySide((p) => !p)}
              className={`min-h-[38px] px-3.5 border border-[#CBD5E1] bg-white hover:bg-[#EFF6FF] text-[#1E3A8A] font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
            >
              <Columns2 className="w-4 h-4" />
              <span>{showSideBySide ? 'إخفاء المعاينة المقارنة' : 'معاينة قبل التطبيق'}</span>
            </button>

            {canUndoFormat && (
              <button
                type="button"
                onClick={onUndoFormat}
                className={`min-h-[38px] px-3.5 border border-[#F59E0B] bg-[#FFFBEB] text-[#B45309] font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
              >
                <Undo2 className="w-4 h-4" />
                <span>تراجع عن التنسيق</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`min-h-[38px] px-4 border border-[#CBD5E1] font-semibold cursor-pointer ${buttonRadiusClass}`}
            >
              إغلاق
            </button>
            <button
              type="button"
              disabled={scanning || appliedAllDone}
              onClick={() => {
                onApplyAll(analysis.formattedPayload, compactLongReport === true);
                setAppliedAllDone(true);
              }}
              className={`min-h-[38px] px-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
            >
              <Check className="w-4 h-4" />
              <span>{appliedAllDone ? 'تم تطبيق الكل ✓' : 'تطبيق الكل'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
