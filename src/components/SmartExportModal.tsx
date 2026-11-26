import React, { useEffect, useState } from 'react';
import {
  Check,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Languages,
  Layers,
  Printer,
  X,
} from 'lucide-react';
import { LayoutMode, ReportLanguage, ViewFormat } from '../types/report';

interface SmartExportModalProps {
  open: boolean;
  onClose: () => void;
  language: ReportLanguage;
  layoutMode: LayoutMode;
  viewFormat: ViewFormat;
  busy: boolean;
  onExportPng: (mode: 'separate' | 'stitched') => Promise<void>;
  onExportInfographicPng: () => Promise<void>;
  onExportWord: () => Promise<void>;
  onExportExcel: () => void;
  onPrintPdf: () => void;
  onExportBilingualWord: () => Promise<void>;
}

export const SmartExportModal: React.FC<SmartExportModalProps> = ({
  open,
  onClose,
  language,
  layoutMode,
  busy,
  onExportPng,
  onExportInfographicPng,
  onExportWord,
  onExportExcel,
  onPrintPdf,
  onExportBilingualWord,
}) => {
  const [bundleWord, setBundleWord] = useState(true);
  const [bundleExcel, setBundleExcel] = useState(true);
  const [bundlePng, setBundlePng] = useState(true);
  const [bundleInfographic, setBundleInfographic] = useState(true);
  const [bundleDone, setBundleDone] = useState(false);

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

  const handleBatchExport = async () => {
    setBundleDone(false);
    if (bundleWord) await onExportWord();
    if (bundleExcel) onExportExcel();
    if (bundlePng) await onExportPng(layoutMode === 'two-page' ? 'stitched' : 'separate');
    if (bundleInfographic) await onExportInfographicPng();
    setBundleDone(true);
    setTimeout(() => setBundleDone(false), 3000);
  };

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-export-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FBF9F5] border border-[#D6CEBE] rounded-t-3xl sm:rounded-xl shadow-xl"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden w-10 h-1.5 bg-[#D6CEBE] rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5DEC9] bg-white">
          <div>
            <h2 id="smart-export-title" className="font-editorial text-xl font-bold text-[#1C1917]">
              مركز التصدير الذكي المتقدم
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">
              اللغة الحالية للتصدير: {language === 'ar' ? 'العربية الرسمية' : 'English Translation'} · العناصر المختارة فقط
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#57534E] hover:text-[#1C1917] hover:bg-[#EFEAE0] rounded-lg cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Single Format Grid */}
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => onExportPng('separate')}
              className="min-h-[60px] flex items-start gap-3 p-3.5 bg-white hover:bg-[#F1F5FB] border border-[#DDD5C7] hover:border-[#1E3A8A] rounded-lg text-right transition-colors cursor-pointer disabled:opacity-50"
            >
              <ImageIcon className="w-5 h-5 text-[#1E3A8A] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#1C1917]">صورة التقرير A4 (PNG)</div>
                <div className="text-[11px] text-[#57534E] mt-0.5">
                  دقة طباعة فائقة (2382×3369 بكسل) مناسبة للواتساب والطباعة
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={onExportInfographicPng}
              className="min-h-[60px] flex items-start gap-3 p-3.5 bg-white hover:bg-[#F1F5FB] border border-[#DDD5C7] hover:border-[#1E3A8A] rounded-lg text-right transition-colors cursor-pointer disabled:opacity-50"
            >
              <Layers className="w-5 h-5 text-[#8C6D3F] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#1C1917]">صورة الإنفوجراف التلخيصي (PNG)</div>
                <div className="text-[11px] text-[#57534E] mt-0.5">
                  ملصق بصري مقارن للبيئة والتوصيات قابل للمشاركة السريعة
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={onExportWord}
              className="min-h-[60px] flex items-start gap-3 p-3.5 bg-white hover:bg-[#F1F5FB] border border-[#DDD5C7] hover:border-[#1E3A8A] rounded-lg text-right transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-5 h-5 text-[#1E3A8A] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#1C1917]">مستند Word قابل للتعديل (.docx)</div>
                <div className="text-[11px] text-[#57534E] mt-0.5">
                  ملف وورد أصلي منسق بالكامل باللغة الحالية
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={onExportExcel}
              className="min-h-[60px] flex items-start gap-3 p-3.5 bg-white hover:bg-[#F1F5FB] border border-[#DDD5C7] hover:border-[#1E3A8A] rounded-lg text-right transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-5 h-5 text-[#14532D] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#1C1917]">مصنف Excel منظم (.xlsx)</div>
                <div className="text-[11px] text-[#57534E] mt-0.5">
                  ورقتا عمل: بيانات الحالة + مصفوفة التحليل والتوصيات
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={onExportBilingualWord}
              className="min-h-[56px] flex items-center justify-between p-3.5 bg-white hover:bg-[#F1F5FB] border border-[#DDD5C7] hover:border-[#1E3A8A] rounded-lg text-right transition-colors cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Languages className="w-5 h-5 text-[#1E3A8A] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#1C1917]">نسختا Word (عربي + إنجليزي)</div>
                  <div className="text-[11px] text-[#57534E]">تحميل النسختين العربية والإنجليزية معاً</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                setTimeout(onPrintPdf, 150);
              }}
              className="min-h-[56px] flex items-center justify-between p-3.5 bg-white hover:bg-[#EFEAE0] border border-[#DDD5C7] rounded-lg text-right transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5 text-[#292524] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#1C1917]">طباعة / حفظ كـ PDF A4</div>
                  <div className="text-[11px] text-[#57534E]">تنسيق طباعة متطابق بدون هوامش</div>
                </div>
              </div>
            </button>
          </div>

          {/* Smart Bundle Export */}
          <div className="border border-[#D6CEBE] bg-[#F4EFE6] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#1C1917]">
                تصدير الحزمة الذكية المتعددة (دفعة واحدة)
              </div>
              {bundleDone && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#14532D]">
                  <Check className="w-3.5 h-3.5" />
                  تم تصدير الحزمة
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <label className="min-h-[44px] flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-[#DDD5C7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={bundleWord}
                  onChange={(e) => setBundleWord(e.target.checked)}
                  className="w-4 h-4 accent-[#1E3A8A]"
                />
                <span>Word (.docx)</span>
              </label>
              <label className="min-h-[44px] flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-[#DDD5C7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={bundleExcel}
                  onChange={(e) => setBundleExcel(e.target.checked)}
                  className="w-4 h-4 accent-[#1E3A8A]"
                />
                <span>Excel (.xlsx)</span>
              </label>
              <label className="min-h-[44px] flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-[#DDD5C7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={bundlePng}
                  onChange={(e) => setBundlePng(e.target.checked)}
                  className="w-4 h-4 accent-[#1E3A8A]"
                />
                <span>تقرير PNG</span>
              </label>
              <label className="min-h-[44px] flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-[#DDD5C7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={bundleInfographic}
                  onChange={(e) => setBundleInfographic(e.target.checked)}
                  className="w-4 h-4 accent-[#1E3A8A]"
                />
                <span>إنفوجراف PNG</span>
              </label>
            </div>

            <button
              type="button"
              disabled={busy || (!bundleWord && !bundleExcel && !bundlePng && !bundleInfographic)}
              onClick={handleBatchExport}
              className="w-full min-h-[48px] py-2.5 px-4 bg-[#1E3A8A] hover:bg-[#172E6E] disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              {busy ? 'جاري التصدير...' : 'تصدير الملفات المحددة دفعة واحدة'}
            </button>
            {!bundleWord && !bundleExcel && !bundlePng && !bundleInfographic && (
              <p className="text-[11px] text-[#B91C1C] font-medium text-center">
                اختر صيغة واحدة على الأقل لتفعيل التصدير المتعدد.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
