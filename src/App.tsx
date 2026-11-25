import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Languages,
  Loader2,
  MessageSquarePlus,
  PanelRightClose,
  PanelRightOpen,
  Printer,
  Stamp,
} from 'lucide-react';
import { EditorPanel, EditorTab } from './components/EditorPanel';
import { InfographicDocument } from './components/InfographicDocument';
import { ReportDocument } from './components/ReportDocument';
import { SmartExportModal } from './components/SmartExportModal';
import {
  ACCENT_THEMES,
  AccentTheme,
  createFullSelections,
  DEFAULT_ENGLISH_REPORT_DATA,
  DEFAULT_REPORT_DATA,
  DEFAULT_SECTION_VISIBILITY,
  getFilteredReportData,
  ItemSelections,
  LayoutMode,
  PaperTone,
  ReportData,
  ReportLanguage,
  ReportTemplate,
  SectionVisibility,
  ViewFormat,
} from './types/report';
import { exportReportToExcel, exportReportToWord } from './utils/exporters';

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

type MobilePane = 'preview' | 'editor';

export default function App() {
  const [arData, setArData] = useState<ReportData>(DEFAULT_REPORT_DATA);
  const [enData, setEnData] = useState<ReportData | null>(DEFAULT_ENGLISH_REPORT_DATA);
  const [language, setLanguage] = useState<ReportLanguage>('ar');
  const [visibility, setVisibility] = useState<SectionVisibility>(DEFAULT_SECTION_VISIBILITY);
  const [selections, setSelections] = useState<ItemSelections>(() =>
    createFullSelections(DEFAULT_REPORT_DATA)
  );

  const [viewFormat, setViewFormat] = useState<ViewFormat>('a4');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('single');
  const [paperTone, setPaperTone] = useState<PaperTone>('white');
  const [accentTheme, setAccentTheme] = useState<AccentTheme>('lapis');
  const [showStamp, setShowStamp] = useState<boolean>(true);
  const [showEditor, setShowEditor] = useState<boolean>(true);
  const [editorTab, setEditorTab] = useState<EditorTab>('school');
  const [mobilePane, setMobilePane] = useState<MobilePane>('preview');
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  const [aiBusy, setAiBusy] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');
  const [exportState, setExportState] = useState<'idle' | 'exporting' | 'done' | 'error'>('idle');
  const [exportMessage, setExportMessage] = useState<string>('');
  const [stageScale, setStageScale] = useState<number>(1);
  const [zoomPreference, setZoomPreference] = useState<'fit' | 0.75 | 1>('fit');

  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const page1Ref = useRef<HTMLDivElement | null>(null);
  const page2Ref = useRef<HTMLDivElement | null>(null);
  const infographicRef = useRef<HTMLDivElement | null>(null);

  const hiddenPage1Ref = useRef<HTMLDivElement | null>(null);
  const hiddenPage2Ref = useRef<HTMLDivElement | null>(null);
  const hiddenInfographicRef = useRef<HTMLDivElement | null>(null);

  const activeData = language === 'en' && enData ? enData : arData;

  const filteredData = useMemo(
    () => getFilteredReportData(activeData, selections),
    [activeData, selections]
  );

  const handleUpdateActiveData = (updated: ReportData) => {
    if (language === 'en') {
      setEnData(updated);
    } else {
      setArData(updated);
      setEnData(null);
    }
  };

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
  }, [zoomPreference, showEditor, layoutMode, viewFormat, mobilePane]);

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
      if (arData) {
        setLanguage('ar');
        return;
      }
    }

    if (targetLang === 'en' && enData) {
      setLanguage('en');
      return;
    }

    setAiBusy(true);
    try {
      const source = targetLang === 'en' ? arData : (enData ?? arData);
      const translated = await translateReport(source, targetLang);
      if (targetLang === 'en') {
        setEnData(translated);
      } else {
        setArData(translated);
      }
      setLanguage(targetLang);
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
    setExportMessage('');
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
      setExportMessage('تم تصدير الصورة بنجاح');
      setTimeout(() => {
        setExportState('idle');
        setExportMessage('');
      }, 3000);
    } catch {
      setExportState('error');
      setExportMessage('تعذر تصدير الصورة');
      setTimeout(() => {
        setExportState('idle');
        setExportMessage('');
      }, 3000);
    }
  };

  const handleExportInfographicPng = async () => {
    const node =
      viewFormat === 'infographic' ? infographicRef.current : hiddenInfographicRef.current;
    if (!node) return;
    setExportState('exporting');
    setExportMessage('');
    try {
      const safeChildName = filteredData.childName.trim().replace(/\s+/g, '-') || 'student';
      const url = await renderNodeToPng(node);
      triggerDownload(url, `إنفوجراف-${safeChildName}-${language}.png`);
      setExportState('done');
      setExportMessage('تم تصدير الإنفوجراف');
      setTimeout(() => {
        setExportState('idle');
        setExportMessage('');
      }, 3000);
    } catch {
      setExportState('error');
      setExportMessage('تعذر تصدير الإنفوجراف');
      setTimeout(() => {
        setExportState('idle');
        setExportMessage('');
      }, 3000);
    }
  };

  const handleExportWord = async () => {
    setExportState('exporting');
    try {
      await exportReportToWord(filteredData, visibility, language, accentTheme);
      setExportState('done');
      setExportMessage('تم تصدير ملف Word');
      setTimeout(() => {
        setExportState('idle');
        setExportMessage('');
      }, 2500);
    } catch {
      setExportState('error');
      setExportMessage('تعذر تصدير Word');
    }
  };

  const handleExportBilingualWord = async () => {
    setExportState('exporting');
    try {
      const arFiltered = getFilteredReportData(arData, selections);
      await exportReportToWord(arFiltered, visibility, 'ar', accentTheme);
      let resolvedEn = enData;
      if (!resolvedEn) {
        resolvedEn = await translateReport(arData, 'en');
        setEnData(resolvedEn);
      }
      const enFiltered = getFilteredReportData(resolvedEn, selections);
      setTimeout(async () => {
        await exportReportToWord(enFiltered, visibility, 'en', accentTheme);
      }, 300);
      setExportState('done');
      setExportMessage('تم تصدير النسختين العربية والإنجليزية');
      setTimeout(() => {
        setExportState('idle');
        setExportMessage('');
      }, 3000);
    } catch (err) {
      setExportState('error');
      setAiError(err instanceof Error ? err.message : 'تعذر تصدير النسخة الإنجليزية');
    }
  };

  const handleExportExcel = () => {
    exportReportToExcel(filteredData, visibility, language);
    setExportState('done');
    setExportMessage('تم تصدير ملف Excel');
    setTimeout(() => {
      setExportState('idle');
      setExportMessage('');
    }, 2500);
  };

  const handlePrintPdf = () => {
    window.print();
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

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-[#F4F1EA] text-[#1C1917]">
      {/* Top Bar: 3-Zone Contract (non-sticky on mobile so total sticky stays <15%) */}
      <header className="no-print bg-[#FBF9F5] border-b border-[#DDD5C7] px-4 md:px-6 py-3">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <a
            href="#preview"
            className="font-editorial text-lg md:text-xl font-bold text-[#1C1917] whitespace-nowrap shrink-0 truncate"
          >
            المركز الشامل لرعاية الطفل
          </a>

          {/* Zone 2: Clean single-line nav links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#57534E]">
            <a
              href="#preview"
              className="hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              عرض التقرير
            </a>
            <button
              type="button"
              onClick={() => openEditorTab('items')}
              className="hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              اختيارات البنود
            </button>
            <button
              type="button"
              onClick={() => openEditorTab('templates')}
              className="hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              القوالب والاختصارات
            </button>
            <button
              type="button"
              onClick={() => openEditorTab('complaint')}
              className="hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              توليد من شكوى
            </button>
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="min-h-[40px] inline-flex items-center gap-2 px-3.5 md:px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172E6E] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تصدير ذكي متعدد</span>
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Formatting & Language Bar */}
      <div className="no-print bg-[#EFEAE0] border-b border-[#DDD5C7] px-3 md:px-6 py-2">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          {/* Primary Controls: Scrollable horizontal row on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 lg:pb-0 no-scrollbar">
            {/* Explicit Bilingual Button Pair: تقرير عربي + تقرير إنجليزي اختياري */}
            <div className="flex items-center gap-1 p-1 bg-[#E5DEC9] rounded-lg shrink-0">
              <button
                type="button"
                disabled={aiBusy}
                onClick={() => handleSwitchLanguage('ar')}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  language === 'ar'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-[#1C1917] hover:bg-white/60'
                }`}
              >
                تقرير عربي
              </button>
              <button
                type="button"
                disabled={aiBusy}
                onClick={() => handleSwitchLanguage('en')}
                className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-[#1C1917] hover:bg-white/60'
                }`}
              >
                {aiBusy && language === 'ar' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Languages className="w-3.5 h-3.5" />
                )}
                <span>تقرير إنجليزي (اختياري)</span>
              </button>
            </div>

            {/* View Format Switcher: A4 vs Infographic */}
            <div className="flex items-center gap-1 p-1 bg-[#E5DEC9] rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => {
                  setViewFormat('a4');
                  setMobilePane('preview');
                }}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewFormat === 'a4'
                    ? 'bg-white text-[#1C1917] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                تقرير A4
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewFormat('infographic');
                  setMobilePane('preview');
                }}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewFormat === 'infographic'
                    ? 'bg-white text-[#1C1917] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                إنفوجراف
              </button>
            </div>

            {/* A4 Layout Mode */}
            {viewFormat === 'a4' && (
              <div className="flex items-center gap-1 p-1 bg-[#E5DEC9] rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setLayoutMode('single')}
                  className={`min-h-[38px] px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    layoutMode === 'single'
                      ? 'bg-white text-[#1C1917] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  صفحة واحدة
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('two-page')}
                  className={`min-h-[38px] px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    layoutMode === 'two-page'
                      ? 'bg-white text-[#1C1917] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  صفحتان
                </button>
              </div>
            )}

            {/* Paper & Accent */}
            <div className="flex items-center gap-1 p-1 bg-[#E5DEC9] rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setPaperTone((p) => (p === 'white' ? 'archival' : 'white'))}
                className="min-h-[38px] px-2.5 py-1.5 text-xs font-medium bg-white text-[#1C1917] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
              >
                {paperTone === 'white' ? 'أبيض' : 'أرشيفي'}
              </button>
              {(Object.keys(ACCENT_THEMES) as AccentTheme[]).map((themeKey) => {
                const cfg = ACCENT_THEMES[themeKey];
                const active = accentTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => setAccentTheme(themeKey)}
                    className={`min-h-[38px] min-w-[34px] inline-flex items-center justify-center px-2 py-1.5 rounded-md transition-colors shrink-0 cursor-pointer ${
                      active ? 'bg-white shadow-xs' : 'opacity-70 hover:opacity-100'
                    }`}
                    aria-label={cfg.label}
                    title={cfg.label}
                  >
                    <span
                      className="w-3 h-3 rounded-xs shrink-0"
                      style={{ backgroundColor: cfg.primary }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Stamp Toggle */}
            <button
              type="button"
              onClick={() => setShowStamp((prev) => !prev)}
              className={`min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showStamp
                  ? 'bg-white border-[#C8BFB0] text-[#1C1917]'
                  : 'bg-transparent border-[#C8BFB0] text-[#57534E]'
              }`}
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>{showStamp ? 'الختم مفعّل' : 'بدون ختم'}</span>
            </button>
          </div>

          {/* Desktop Quick Export Actions */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {exportMessage && (
              <span className="text-xs font-semibold text-[#14532D] px-2">{exportMessage}</span>
            )}

            <button
              type="button"
              disabled={exportState === 'exporting'}
              onClick={handleExportWord}
              className="min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-[#C8BFB0] hover:border-[#1E3A8A] text-[#1C1917] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Word</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-[#C8BFB0] hover:border-[#14532D] text-[#1C1917] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#14532D]" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              disabled={exportState === 'exporting'}
              onClick={() =>
                viewFormat === 'infographic'
                  ? handleExportInfographicPng()
                  : handleExportPng('separate')
              }
              className="min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-[#C8BFB0] hover:border-[#1C1917] text-[#1C1917] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>صورة</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-[#C8BFB0] hover:border-[#1C1917] text-[#1C1917] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <div className="flex items-center gap-1 p-1 bg-[#E5DEC9] rounded-md">
              <button
                type="button"
                onClick={() => setZoomPreference('fit')}
                className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap shrink-0 cursor-pointer ${
                  zoomPreference === 'fit' ? 'bg-white text-[#1C1917]' : 'text-[#57534E]'
                }`}
              >
                ملائم
              </button>
              <button
                type="button"
                onClick={() => setZoomPreference(1)}
                className={`px-2 py-1 text-xs font-medium rounded tabular-nums-ar whitespace-nowrap shrink-0 cursor-pointer ${
                  zoomPreference === 1 ? 'bg-white text-[#1C1917]' : 'text-[#57534E]'
                }`}
              >
                100%
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowEditor((prev) => !prev)}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#292524] text-white hover:bg-[#1C1917] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {showEditor ? (
                <>
                  <PanelRightClose className="w-3.5 h-3.5" />
                  <span>إخفاء المحرر</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-3.5 h-3.5" />
                  <span>تخصيص التقرير</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Status Toast on Mobile */}
      {exportMessage && (
        <div className="no-print lg:hidden mx-4 mt-3 px-3 py-2 bg-[#ECFDF5] border border-[#A7F3D0] text-[#14532D] text-xs font-semibold rounded-lg text-center">
          {exportMessage}
        </div>
      )}

      {/* Main Studio Area */}
      <main
        id="preview"
        className="print-container flex-1 max-w-[1440px] w-full mx-auto px-3 md:px-6 py-4 md:py-6 pb-24 lg:pb-8 flex flex-col lg:flex-row items-start gap-6"
      >
        {/* Editor Sidebar: Always shown on desktop when showEditor=true; shown on mobile when mobilePane='editor' */}
        <div
          className={`no-print w-full lg:w-[375px] shrink-0 lg:sticky lg:top-6 ${
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
            onApplyTemplate={handleApplyTemplate}
            onGenerateFromComplaint={handleGenerateFromComplaint}
            onRunShortcut={handleRunShortcut}
            onReset={() => {
              setArData(DEFAULT_REPORT_DATA);
              setEnData(DEFAULT_ENGLISH_REPORT_DATA);
              setLanguage('ar');
              setVisibility(DEFAULT_SECTION_VISIBILITY);
              setSelections(createFullSelections(DEFAULT_REPORT_DATA));
              setAiError('');
            }}
            activeTab={editorTab}
            onTabChange={setEditorTab}
            aiBusy={aiBusy}
            aiError={aiError}
          />
        </div>

        {/* Document Preview Stage: Always shown on desktop; shown on mobile when mobilePane='preview' */}
        <div
          ref={stageContainerRef}
          className={`print-container flex-1 w-full min-w-0 flex-col items-center ${
            mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="no-print w-full max-w-[794px] flex items-center justify-between text-xs text-[#57534E] mb-3 px-1">
            <div className="flex items-center gap-2">
              <span>
                {viewFormat === 'a4'
                  ? 'مستند A4 رسمي (210 × 297 مم)'
                  : 'إنفوجراف بصري تلخيصي (A4)'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{language === 'ar' ? 'النسخة العربية' : 'English Translation'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {showStamp ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {showStamp ? 'مُذيل بالختم الرسمي' : 'بدون ختم رقمي'}
              </span>
              <button
                type="button"
                onClick={() => setZoomPreference((z) => (z === 'fit' ? 1 : 'fit'))}
                className="lg:hidden px-2.5 py-1 bg-white border border-[#D6CEBE] rounded text-[11px] font-semibold text-[#1C1917] cursor-pointer"
              >
                {zoomPreference === 'fit' ? 'تكبير 100%' : 'ملائمة الشاشة'}
              </button>
            </div>
          </div>

          <div
            className="print-container w-full flex justify-center overflow-x-auto pb-4"
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
                  page1Ref={page1Ref}
                  page2Ref={page2Ref}
                />
              ) : (
                <InfographicDocument
                  data={filteredData}
                  paperTone={paperTone}
                  accentTheme={accentTheme}
                  showStamp={showStamp}
                  visibility={visibility}
                  language={language}
                  infographicRef={infographicRef}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Bottom Thumb Navigation Bar (15% Sticky Cap: 64px height) */}
      <nav
        aria-label="التنقل السريع للجوال"
        className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#FBF9F5]/95 backdrop-blur-md border-t border-[#DDD5C7] grid grid-cols-4 items-center px-1"
      >
        <button
          type="button"
          onClick={() => setMobilePane('preview')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            mobilePane === 'preview' ? 'text-[#1E3A8A] font-bold' : 'text-[#57534E]'
          }`}
        >
          <Eye className="w-5 h-5" />
          <span className="text-[11px]">المعاينة</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobilePane('editor');
            if (editorTab === 'complaint') setEditorTab('school');
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            mobilePane === 'editor' && editorTab !== 'complaint'
              ? 'text-[#1E3A8A] font-bold'
              : 'text-[#57534E]'
          }`}
        >
          <Edit3 className="w-5 h-5" />
          <span className="text-[11px]">التحرير والبنود</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEditorTab('complaint');
            setMobilePane('editor');
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            mobilePane === 'editor' && editorTab === 'complaint'
              ? 'text-[#1E3A8A] font-bold'
              : 'text-[#57534E]'
          }`}
        >
          <MessageSquarePlus className="w-5 h-5" />
          <span className="text-[11px]">شكوى ذكية</span>
        </button>

        <button
          type="button"
          onClick={() => setExportModalOpen(true)}
          className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-[#1E3A8A] font-semibold cursor-pointer"
        >
          <Download className="w-5 h-5" />
          <span className="text-[11px]">تصدير</span>
        </button>
      </nav>

      {/* Off-screen hidden export mirrors so batch export works seamlessly */}
      <div
        aria-hidden="true"
        className="no-print fixed -left-[9999px] top-0 pointer-events-none"
      >
        {viewFormat !== 'a4' && (
          <ReportDocument
            data={filteredData}
            layoutMode={layoutMode}
            paperTone={paperTone}
            accentTheme={accentTheme}
            showStamp={showStamp}
            visibility={visibility}
            language={language}
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
            infographicRef={hiddenInfographicRef}
          />
        )}
      </div>

      {/* Smart Multi-Format Export Modal / Mobile Bottom Sheet */}
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
        onPrintPdf={handlePrintPdf}
        onExportBilingualWord={handleExportBilingualWord}
      />
    </div>
  );
}
