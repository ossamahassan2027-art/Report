import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck, Wand2, X } from 'lucide-react';
import { AtsAuditReport } from '../utils/cvAtsEngine';

interface AtsCheckModalProps {
  open: boolean;
  onClose: () => void;
  audit: AtsAuditReport;
  buttonRadiusClass: string;
  onApplySafeFixes: () => void;
  onGoToKeywordsTab: () => void;
}

export const AtsCheckModal: React.FC<AtsCheckModalProps> = ({
  open,
  onClose,
  audit,
  buttonRadiusClass,
  onApplySafeFixes,
  onGoToKeywordsTab,
}) => {
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

  if (!open) return null;

  const scoreColor =
    audit.score >= 90 ? '#059669' : audit.score >= 70 ? '#2563EB' : '#D97706';

  const canAutoFix =
    audit.hasInconsistentDates || audit.hasUnexpandedAbbreviations;

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="نتائج فحص التوافق مع أنظمة تتبع المتقدمين (ATS)"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-[#E2E8F0] shadow-2xl ${buttonRadiusClass}`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b"
          style={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#1E293B' }}
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#34D399]" />
            <div>
              <h3 className="font-editorial text-base font-bold">
                فحص التوافق مع أنظمة تتبع المتقدمين (ATS)
              </h3>
              <p className="text-[11px] text-[#CBD5E1]">
                مراجعة آلية شاملة للعناوين، التخطيط، التواريخ، الكلمات المفتاحية، وقابلية النسخ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة فحص ATS"
            className={`min-h-[36px] min-w-[36px] flex items-center justify-center border border-[#334155] text-[#CBD5E1] hover:text-white cursor-pointer ${buttonRadiusClass}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score + Progress Bar */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#0F172A]">نسبة التوافق الكلية مع ATS:</span>
              <span
                className="text-2xl font-bold tabular-nums-ar"
                style={{ color: scoreColor }}
              >
                {audit.score}%
              </span>
            </div>
            <div className="w-full h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${audit.score}%`,
                  backgroundColor: scoreColor,
                }}
              />
            </div>
            <p className="text-[11px] text-[#475569]">
              {audit.score === 100
                ? 'ممتاز! السيرة الذاتية متوافقة بنسبة 100% مع أنظمة تتبع المتقدمين (ATS) وجاهزة للتقديم.'
                : 'يمكنك رفع النسبة إلى 100% بمراجعة البنود غير المكتملة أدناه.'}
            </p>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <div className="font-bold text-[#0F172A]">قائمة الفحص التفصيلية:</div>
            <div className="grid grid-cols-1 gap-2">
              {audit.checks.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 border flex items-start gap-2.5 ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: item.passed ? '#F0FDF4' : '#FFFBEB',
                    borderColor: item.passed ? '#BBF7D0' : '#FDE68A',
                  }}
                >
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div
                      className="font-bold"
                      style={{ color: item.passed ? '#065F46' : '#92400E' }}
                    >
                      {item.passed ? '✓' : '!'} {item.label}
                    </div>
                    <div className="text-[11px] text-[#475569] mt-0.5">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Fix Buttons */}
          {(canAutoFix || audit.missingJobTitleInSummaryOrExp) && (
            <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-[#1E3A8A]">
                تحسينات سريعة متاحة للسيرة الذاتية:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {canAutoFix && (
                  <button
                    type="button"
                    onClick={onApplySafeFixes}
                    className={`min-h-[36px] px-3.5 bg-[#2563EB] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>توحيد التواريخ وتوضيح الاختصارات تلقائياً</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToKeywordsTab();
                  }}
                  className={`min-h-[36px] px-3.5 bg-white border border-[#BFDBFE] text-[#1E3A8A] font-bold cursor-pointer ${buttonRadiusClass}`}
                >
                  فتح مطابقة الكلمات المفتاحية
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[36px] px-5 bg-[#0F172A] text-white font-bold cursor-pointer ${buttonRadiusClass}`}
          >
            تأكيد وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
