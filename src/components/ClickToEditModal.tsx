import React, { useEffect, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Check,
  EyeOff,
  Italic,
  Minus,
  Palette,
  Plus,
  Redo2,
  RotateCcw,
  Trash2,
  Type,
  Undo2,
  X,
} from 'lucide-react';
import { ReportData } from '../types/report';
import {
  BlockBorderStyle,
  BlockFontFamily,
  BlockStyleOverride,
  EditTargetDescriptor,
  getBlockInlineStyle,
} from '../types/clickEdit';
import {
  CustomChartItem,
  CustomTableItem,
  EvaluationFormEntry,
  LightThemeDefinition,
  PlanGoalItem,
} from '../types/studio';

interface ClickToEditModalProps {
  target: EditTargetDescriptor | null;
  currentData: ReportData;
  currentStyle?: BlockStyleOverride;
  theme: LightThemeDefinition;
  buttonRadiusClass: string;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  reorderHint?: string;

  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSaveTextAndStyle: (payload: {
    target: EditTargetDescriptor;
    textValue: string;
    styleOverride: BlockStyleOverride;
    personalFields?: {
      childName: string;
      birthDate: string;
      age: string;
      diagnosis: string;
    };
    chartItem?: CustomChartItem;
    tableItem?: CustomTableItem;
    planGoalItem?: PlanGoalItem;
    evalItem?: EvaluationFormEntry;
  }) => void;
  onApplyStyleOnly: (blockId: string, styleOverride: BlockStyleOverride) => void;
  onHideBlock: (blockId: string) => void;
  onDeleteBlock: (target: EditTargetDescriptor) => void;
  onMoveBlock: (target: EditTargetDescriptor, direction: 'up' | 'down') => void;
}

const TEXT_COLOR_SWATCHES = [
  '#1C1917',
  '#1E3A8A',
  '#14532D',
  '#8C6D3F',
  '#9D174D',
  '#475569',
  '#DC2626',
];

const BG_COLOR_SWATCHES: { color: string; label: string }[] = [
  { color: '', label: 'افتراضي' },
  { color: '#FFFFFF', label: 'أبيض' },
  { color: '#F8FAFC', label: 'أزرق خفيف' },
  { color: '#F6FEF9', label: 'أخضر خفيف' },
  { color: '#FAF8F5', label: 'بيج دافئ' },
  { color: '#FDF2F8', label: 'وردي خفيف' },
  { color: '#F4F4F5', label: 'رمادي ناعم' },
];

export const ClickToEditModal: React.FC<ClickToEditModalProps> = ({
  target,
  currentData,
  currentStyle,
  theme,
  buttonRadiusClass,
  canUndo,
  canRedo,
  undoCount,
  redoCount,
  canMoveUp,
  canMoveDown,
  reorderHint,
  onClose,
  onUndo,
  onRedo,
  onSaveTextAndStyle,
  onApplyStyleOnly,
  onHideBlock,
  onDeleteBlock,
  onMoveBlock,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'design'>('text');
  const [textDraft, setTextDraft] = useState('');
  const [styleDraft, setStyleDraft] = useState<BlockStyleOverride>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Structured editors for complex blocks
  const [personalDraft, setPersonalDraft] = useState({
    childName: '',
    birthDate: '',
    age: '',
    diagnosis: '',
  });
  const [chartDraft, setChartDraft] = useState<CustomChartItem | null>(null);
  const [tableDraft, setTableDraft] = useState<CustomTableItem | null>(null);
  const [planGoalDraft, setPlanGoalDraft] = useState<PlanGoalItem | null>(null);
  const [evalDraft, setEvalDraft] = useState<EvaluationFormEntry | null>(null);

  useEffect(() => {
    if (!target) return;
    setTextDraft(target.textValue);
    setStyleDraft(currentStyle ? { ...currentStyle } : {});
    setConfirmDeleteOpen(false);
    setPersonalDraft({
      childName: currentData.childName,
      birthDate: currentData.birthDate,
      age: currentData.age,
      diagnosis: currentData.diagnosis,
    });
    setChartDraft(
      target.chartData
        ? { ...target.chartData, points: target.chartData.points.map((p) => ({ ...p })) }
        : null
    );
    setTableDraft(
      target.tableData
        ? {
            ...target.tableData,
            headers: [...target.tableData.headers],
            rows: target.tableData.rows.map((r) => [...r]),
          }
        : null
    );
    setPlanGoalDraft(target.planGoalData ? { ...target.planGoalData } : null);
    setEvalDraft(
      target.evalData
        ? {
            ...target.evalData,
            fields: target.evalData.fields.map((f) => ({ ...f })),
          }
        : null
    );
  }, [target, currentStyle, currentData]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [target, onClose]);

  if (!target) return null;

  const currentFontPx = styleDraft.fontSizePx ?? 13;

  const handleStepFont = (delta: number) => {
    const next = Math.min(32, Math.max(9, currentFontPx + delta));
    setStyleDraft((prev) => ({ ...prev, fontSizePx: next }));
  };

  const handleSaveText = () => {
    onSaveTextAndStyle({
      target,
      textValue: textDraft,
      styleOverride: styleDraft,
      personalFields: target.kind === 'personal-table' ? personalDraft : undefined,
      chartItem: target.kind === 'chart' && chartDraft ? chartDraft : undefined,
      tableItem: target.kind === 'table' && tableDraft ? tableDraft : undefined,
      planGoalItem: target.kind === 'plan-goal' && planGoalDraft ? planGoalDraft : undefined,
      evalItem: target.kind === 'evaluation' && evalDraft ? evalDraft : undefined,
    });
    onClose();
  };

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`تعديل ${target.label}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[92vh] overflow-y-auto border shadow-2xl ${buttonRadiusClass}`}
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
          color: theme.textPrimary,
        }}
      >
        {/* Header with Undo / Redo / Close */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b"
          style={{ backgroundColor: theme.surfaceBg, borderColor: theme.borderColor }}
        >
          <div className="min-w-0">
            <div
              className="font-editorial text-base sm:text-lg font-bold truncate"
              style={{ color: theme.headingColor }}
            >
              تعديل: {target.label}
            </div>
            <div className="text-[11px]" style={{ color: theme.textMuted }}>
              التعديل يطبق على هذا الجزء المحدد فقط دون التأثير على باقي التقرير
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              title={canUndo ? 'تراجع عن آخر تعديل' : 'لا توجد تعديلات للتراجع عنها'}
              className={`min-h-[36px] px-2.5 border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-45 ${buttonRadiusClass}`}
              style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>تراجع{undoCount > 0 ? ` (${undoCount})` : ''}</span>
            </button>

            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              title={canRedo ? 'إعادة التعديل' : 'لا توجد تعديلات للإعادة'}
              className={`min-h-[36px] px-2.5 border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-45 ${buttonRadiusClass}`}
              style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span>إعادة{redoCount > 0 ? ` (${redoCount})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className={`min-h-[36px] min-w-[36px] flex items-center justify-center border cursor-pointer ${buttonRadiusClass}`}
              style={{ borderColor: theme.borderColor, color: theme.textMuted }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Two Functional Tabs */}
        <div
          className="flex items-center gap-2 px-4 py-2 border-b"
          style={{ backgroundColor: theme.accentSoft, borderColor: theme.borderColor }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`min-h-[38px] px-4 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${buttonRadiusClass}`}
            style={{
              backgroundColor: activeTab === 'text' ? theme.accentColor : theme.cardBg,
              color: activeTab === 'text' ? '#FFFFFF' : theme.headingColor,
              border: `1px solid ${activeTab === 'text' ? theme.accentColor : theme.borderColor}`,
            }}
          >
            <Type className="w-3.5 h-3.5" />
            <span>تعديل كتابة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('design')}
            className={`min-h-[38px] px-4 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${buttonRadiusClass}`}
            style={{
              backgroundColor: activeTab === 'design' ? theme.accentColor : theme.cardBg,
              color: activeTab === 'design' ? '#FFFFFF' : theme.headingColor,
              border: `1px solid ${activeTab === 'design' ? theme.accentColor : theme.borderColor}`,
            }}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>تعديل تصميم</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* TAB 1: TEXT EDIT */}
          {activeTab === 'text' && (
            <>
              {/* Quick Text Formatting Toolbar */}
              <div
                className={`p-2 border flex flex-wrap items-center gap-1.5 ${buttonRadiusClass}`}
                style={{ backgroundColor: theme.surfaceBg, borderColor: theme.borderColor }}
              >
                <button
                  type="button"
                  onClick={() => setStyleDraft((p) => ({ ...p, bold: !p.bold }))}
                  className={`min-h-[34px] px-2.5 border inline-flex items-center gap-1 font-semibold cursor-pointer ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: styleDraft.bold ? theme.accentColor : theme.cardBg,
                    color: styleDraft.bold ? '#FFFFFF' : theme.textPrimary,
                    borderColor: theme.borderColor,
                  }}
                >
                  <Bold className="w-3.5 h-3.5" />
                  <span>عريض</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStyleDraft((p) => ({ ...p, italic: !p.italic }))}
                  className={`min-h-[34px] px-2.5 border inline-flex items-center gap-1 font-semibold cursor-pointer ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: styleDraft.italic ? theme.accentColor : theme.cardBg,
                    color: styleDraft.italic ? '#FFFFFF' : theme.textPrimary,
                    borderColor: theme.borderColor,
                  }}
                >
                  <Italic className="w-3.5 h-3.5" />
                  <span>مائل</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStepFont(2)}
                  className={`min-h-[34px] px-2.5 border inline-flex items-center gap-1 font-semibold cursor-pointer ${buttonRadiusClass}`}
                  style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تكبير الخط</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStepFont(-2)}
                  className={`min-h-[34px] px-2.5 border inline-flex items-center gap-1 font-semibold cursor-pointer ${buttonRadiusClass}`}
                  style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>تصغير الخط</span>
                </button>

                {/* Text Color Picker */}
                <label
                  className={`min-h-[34px] px-2.5 border inline-flex items-center gap-1.5 font-semibold cursor-pointer ${buttonRadiusClass}`}
                  style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
                >
                  <span>تغيير اللون</span>
                  <input
                    type="color"
                    value={styleDraft.textColor || '#1C1917'}
                    onChange={(e) =>
                      setStyleDraft((p) => ({ ...p, textColor: e.target.value }))
                    }
                    className="w-5 h-5 border-0 bg-transparent cursor-pointer p-0"
                  />
                </label>

                {/* Alignment Buttons */}
                <div className="flex items-center gap-1 ms-auto">
                  {(
                    [
                      ['right', 'يمين', AlignRight],
                      ['center', 'وسط', AlignCenter],
                      ['left', 'يسار', AlignLeft],
                    ] as const
                  ).map(([al, lbl, Icon]) => {
                    const active = styleDraft.textAlign === al;
                    return (
                      <button
                        key={al}
                        type="button"
                        onClick={() => setStyleDraft((p) => ({ ...p, textAlign: al }))}
                        className={`min-h-[34px] px-2 border inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                        style={{
                          backgroundColor: active ? theme.accentColor : theme.cardBg,
                          color: active ? '#FFFFFF' : theme.textPrimary,
                          borderColor: theme.borderColor,
                        }}
                        title={`محاذاة ${lbl}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{lbl}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Editor Surface according to clicked block kind */}
              {target.kind === 'personal-table' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">اسم الطفل</label>
                    <input
                      type="text"
                      value={personalDraft.childName}
                      onChange={(e) =>
                        setPersonalDraft({ ...personalDraft, childName: e.target.value })
                      }
                      className={`w-full min-h-[38px] px-3 border ${buttonRadiusClass}`}
                      style={{ borderColor: theme.borderColor }}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">تاريخ الميلاد</label>
                    <input
                      type="text"
                      value={personalDraft.birthDate}
                      onChange={(e) =>
                        setPersonalDraft({ ...personalDraft, birthDate: e.target.value })
                      }
                      className={`w-full min-h-[38px] px-3 border ${buttonRadiusClass}`}
                      style={{ borderColor: theme.borderColor }}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">العمر</label>
                    <input
                      type="text"
                      value={personalDraft.age}
                      onChange={(e) =>
                        setPersonalDraft({ ...personalDraft, age: e.target.value })
                      }
                      className={`w-full min-h-[38px] px-3 border ${buttonRadiusClass}`}
                      style={{ borderColor: theme.borderColor }}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">التشخيص المذكور</label>
                    <input
                      type="text"
                      value={personalDraft.diagnosis}
                      onChange={(e) =>
                        setPersonalDraft({ ...personalDraft, diagnosis: e.target.value })
                      }
                      className={`w-full min-h-[38px] px-3 border ${buttonRadiusClass}`}
                      style={{ borderColor: theme.borderColor }}
                    />
                  </div>
                </div>
              ) : target.kind === 'chart' && chartDraft ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold mb-1">عنوان الرسم البياني</label>
                      <input
                        type="text"
                        value={chartDraft.title}
                        onChange={(e) =>
                          setChartDraft({ ...chartDraft, title: e.target.value })
                        }
                        className={`w-full min-h-[38px] px-3 border ${buttonRadiusClass}`}
                        style={{ borderColor: theme.borderColor }}
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">الوحدة</label>
                      <input
                        type="text"
                        value={chartDraft.unit}
                        onChange={(e) =>
                          setChartDraft({ ...chartDraft, unit: e.target.value })
                        }
                        className={`w-full min-h-[38px] px-3 border ${buttonRadiusClass}`}
                        style={{ borderColor: theme.borderColor }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-bold">بيانات الرسم:</label>
                    {chartDraft.points.map((pt, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2">
                        <input
                          type="text"
                          value={pt.label}
                          onChange={(e) => {
                            const nextPts = [...chartDraft.points];
                            nextPts[i] = { ...nextPts[i], label: e.target.value };
                            setChartDraft({ ...chartDraft, points: nextPts });
                          }}
                          className={`col-span-7 min-h-[36px] px-2.5 border ${buttonRadiusClass}`}
                          style={{ borderColor: theme.borderColor }}
                        />
                        <input
                          type="number"
                          value={pt.value}
                          onChange={(e) => {
                            const nextPts = [...chartDraft.points];
                            nextPts[i] = { ...nextPts[i], value: Number(e.target.value) || 0 };
                            setChartDraft({ ...chartDraft, points: nextPts });
                          }}
                          className={`col-span-4 min-h-[36px] px-2.5 border ${buttonRadiusClass}`}
                          style={{ borderColor: theme.borderColor }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setChartDraft({
                              ...chartDraft,
                              points: chartDraft.points.filter((_, idx) => idx !== i),
                            })
                          }
                          className="col-span-1 text-[#DC2626] font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setChartDraft({
                          ...chartDraft,
                          points: [...chartDraft.points, { label: '[ ... ]', value: 0 }],
                        })
                      }
                      className={`px-3 py-1.5 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                      style={{ borderColor: theme.borderColor }}
                    >
                      + إضافة بند جديد
                    </button>
                  </div>
                </div>
              ) : target.kind === 'table' && tableDraft ? (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold mb-1">عنوان الجدول</label>
                    <input
                      type="text"
                      value={tableDraft.title}
                      onChange={(e) =>
                        setTableDraft({ ...tableDraft, title: e.target.value })
                      }
                      className={`w-full min-h-[38px] px-3 border ${buttonRadiusClass}`}
                      style={{ borderColor: theme.borderColor }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {tableDraft.headers.map((h, i) => (
                      <input
                        key={i}
                        type="text"
                        value={h}
                        onChange={(e) => {
                          const nextH = [...tableDraft.headers];
                          nextH[i] = e.target.value;
                          setTableDraft({ ...tableDraft, headers: nextH });
                        }}
                        className={`min-h-[36px] px-2 border font-bold ${buttonRadiusClass}`}
                        style={{ borderColor: theme.borderColor, backgroundColor: theme.surfaceBg }}
                      />
                    ))}
                  </div>
                  {tableDraft.rows.map((row, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-3 gap-2">
                      {row.map((cell, cIdx) => (
                        <input
                          key={cIdx}
                          type="text"
                          value={cell}
                          onChange={(e) => {
                            const nextRows = tableDraft.rows.map((r) => [...r]);
                            nextRows[rIdx][cIdx] = e.target.value;
                            setTableDraft({ ...tableDraft, rows: nextRows });
                          }}
                          className={`min-h-[36px] px-2 border ${buttonRadiusClass}`}
                          style={{ borderColor: theme.borderColor }}
                        />
                      ))}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setTableDraft({
                        ...tableDraft,
                        rows: [
                          ...tableDraft.rows,
                          tableDraft.headers.map(() => '[ ... ]'),
                        ],
                      })
                    }
                    className={`px-3 py-1.5 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                    style={{ borderColor: theme.borderColor }}
                  >
                    + إضافة صف
                  </button>
                </div>
              ) : target.kind === 'plan-goal' && planGoalDraft ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold mb-1">نص الهدف</label>
                    <textarea
                      rows={3}
                      value={planGoalDraft.goal}
                      onChange={(e) =>
                        setPlanGoalDraft({ ...planGoalDraft, goal: e.target.value })
                      }
                      className={`w-full p-3 border ${buttonRadiusClass}`}
                      style={{ borderColor: theme.borderColor, ...getBlockInlineStyle(styleDraft) }}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">المدة المستهدفة</label>
                    <input
                      type="text"
                      value={planGoalDraft.targetDuration}
                      onChange={(e) =>
                        setPlanGoalDraft({ ...planGoalDraft, targetDuration: e.target.value })
                      }
                      className={`w-full min-h-[38px] px-3 border ${buttonRadiusClass}`}
                      style={{ borderColor: theme.borderColor }}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">المسؤول</label>
                    <input
                      type="text"
                      value={planGoalDraft.owner}
                      onChange={(e) =>
                        setPlanGoalDraft({ ...planGoalDraft, owner: e.target.value })
                      }
                      className={`w-full min-h-[38px] px-3 border ${buttonRadiusClass}`}
                      style={{ borderColor: theme.borderColor }}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold mb-1">مؤشر المتابعة</label>
                    <input
                      type="text"
                      value={planGoalDraft.progress}
                      onChange={(e) =>
                        setPlanGoalDraft({ ...planGoalDraft, progress: e.target.value })
                      }
                      className={`w-full min-h-[38px] px-3 border ${buttonRadiusClass}`}
                      style={{ borderColor: theme.borderColor }}
                    />
                  </div>
                </div>
              ) : target.kind === 'evaluation' && evalDraft ? (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold mb-1">عنوان الاستمارة</label>
                    <input
                      type="text"
                      value={evalDraft.title}
                      onChange={(e) =>
                        setEvalDraft({ ...evalDraft, title: e.target.value })
                      }
                      className={`w-full min-h-[38px] px-3 border ${buttonRadiusClass}`}
                      style={{ borderColor: theme.borderColor }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {evalDraft.fields.map((fld, idx) => (
                      <div key={idx}>
                        <label className="block text-[11px] font-semibold mb-1" style={{ color: theme.textMuted }}>
                          {fld.label}
                        </label>
                        <input
                          type="text"
                          value={fld.value}
                          onChange={(e) => {
                            const nextFields = evalDraft.fields.map((f, i) =>
                              i === idx ? { ...f, value: e.target.value } : f
                            );
                            setEvalDraft({ ...evalDraft, fields: nextFields });
                          }}
                          className={`w-full min-h-[36px] px-2.5 border ${buttonRadiusClass}`}
                          style={{ borderColor: theme.borderColor }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold mb-1.5">نص الجزء المحدد:</label>
                  <textarea
                    rows={5}
                    value={textDraft}
                    onChange={(e) => setTextDraft(e.target.value)}
                    className={`w-full p-3 border leading-relaxed ${buttonRadiusClass}`}
                    style={{
                      borderColor: theme.borderColor,
                      ...getBlockInlineStyle(styleDraft),
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                <button
                  type="button"
                  onClick={onClose}
                  className={`min-h-[40px] px-4 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                  style={{ borderColor: theme.borderColor }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveText}
                  className={`min-h-[40px] px-5 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                  style={{ backgroundColor: theme.accentColor }}
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التعديل</span>
                </button>
              </div>
            </>
          )}

          {/* TAB 2: DESIGN EDIT (Selected Part Only) */}
          {activeTab === 'design' && (
            <>
              {/* Background Color & Text Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5">لون الخلفية</label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {BG_COLOR_SWATCHES.map((sw) => {
                      const active = (styleDraft.bgColor || '') === sw.color;
                      return (
                        <button
                          key={sw.label}
                          type="button"
                          onClick={() =>
                            setStyleDraft((p) => ({
                              ...p,
                              bgColor: sw.color || undefined,
                            }))
                          }
                          title={sw.label}
                          className={`min-h-[32px] px-2.5 border text-[11px] font-medium cursor-pointer ${buttonRadiusClass}`}
                          style={{
                            backgroundColor: sw.color || '#FFFFFF',
                            borderColor: active ? theme.accentColor : theme.borderColor,
                            boxShadow: active ? `0 0 0 2px ${theme.accentColor}40` : 'none',
                          }}
                        >
                          {sw.label}
                        </button>
                      );
                    })}
                    <input
                      type="color"
                      value={styleDraft.bgColor || '#FFFFFF'}
                      onChange={(e) =>
                        setStyleDraft((p) => ({ ...p, bgColor: e.target.value }))
                      }
                      title="لون خلفية مخصص"
                      className="w-8 h-8 border cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1.5">لون النص</label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {TEXT_COLOR_SWATCHES.map((col) => {
                      const active = styleDraft.textColor === col;
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setStyleDraft((p) => ({ ...p, textColor: col }))}
                          className="w-7 h-7 rounded-full border cursor-pointer"
                          style={{
                            backgroundColor: col,
                            borderColor: active ? '#000000' : '#CBD5E1',
                            boxShadow: active ? `0 0 0 2px ${theme.accentColor}` : 'none',
                          }}
                          aria-label={`لون ${col}`}
                        />
                      );
                    })}
                    <input
                      type="color"
                      value={styleDraft.textColor || '#1C1917'}
                      onChange={(e) =>
                        setStyleDraft((p) => ({ ...p, textColor: e.target.value }))
                      }
                      title="لون نص مخصص"
                      className="w-8 h-8 border cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Font Size & Font Family */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: theme.borderColor }}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold">حجم الخط</label>
                    <span className="font-bold tabular-nums-ar" style={{ color: theme.headingColor }}>
                      {styleDraft.fontSizePx ? `${styleDraft.fontSizePx} px` : 'افتراضي'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={9}
                      max={30}
                      value={currentFontPx}
                      onChange={(e) =>
                        setStyleDraft((p) => ({
                          ...p,
                          fontSizePx: Number(e.target.value),
                        }))
                      }
                      className="flex-1 accent-[#1E3A8A] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setStyleDraft((p) => ({ ...p, fontSizePx: undefined }))
                      }
                      className={`px-2 py-1 border text-[11px] cursor-pointer ${buttonRadiusClass}`}
                      style={{ borderColor: theme.borderColor }}
                    >
                      افتراضي
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1.5">نوع الخط</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        ['default', 'الافتراضي'],
                        ['amiri', 'أميري (عناوين)'],
                        ['sans', 'نسخي واضح'],
                        ['tahoma', 'Tahoma'],
                      ] as [BlockFontFamily, string][]
                    ).map(([ff, lbl]) => {
                      const active = (styleDraft.fontFamily || 'default') === ff;
                      return (
                        <button
                          key={ff}
                          type="button"
                          onClick={() => setStyleDraft((p) => ({ ...p, fontFamily: ff }))}
                          className={`min-h-[34px] px-2 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                          style={{
                            backgroundColor: active ? theme.accentSoft : theme.cardBg,
                            borderColor: active ? theme.accentColor : theme.borderColor,
                          }}
                        >
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Border Shape */}
              <div className="pt-2 border-t" style={{ borderColor: theme.borderColor }}>
                <label className="block font-bold mb-1.5">شكل الإطار</label>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      ['none', 'بدون'],
                      ['thin', 'رفيع'],
                      ['thick', 'سميك'],
                      ['rounded', 'مستدير'],
                    ] as [BlockBorderStyle, string][]
                  ).map(([bs, lbl]) => {
                    const active = styleDraft.borderStyle === bs;
                    return (
                      <button
                        key={bs}
                        type="button"
                        onClick={() => setStyleDraft((p) => ({ ...p, borderStyle: bs }))}
                        className={`min-h-[38px] border font-semibold cursor-pointer ${buttonRadiusClass}`}
                        style={{
                          backgroundColor: active ? theme.accentSoft : theme.cardBg,
                          borderColor: active ? theme.accentColor : theme.borderColor,
                        }}
                      >
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reorder, Hide, Delete Actions */}
              <div
                className="p-3 border space-y-2.5"
                style={{ backgroundColor: theme.surfaceBg, borderColor: theme.borderColor }}
              >
                <div className="font-bold">ترتيب والتحكم في هذا الجزء فقط:</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!canMoveUp}
                    onClick={() => {
                      onMoveBlock(target, 'up');
                      onClose();
                    }}
                    className={`min-h-[38px] px-3 border font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-45 ${buttonRadiusClass}`}
                    style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
                    title={!canMoveUp ? reorderHint || 'لا يمكن النقل لأعلى' : 'نقل هذا الجزء لأعلى'}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>نقل لأعلى</span>
                  </button>

                  <button
                    type="button"
                    disabled={!canMoveDown}
                    onClick={() => {
                      onMoveBlock(target, 'down');
                      onClose();
                    }}
                    className={`min-h-[38px] px-3 border font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-45 ${buttonRadiusClass}`}
                    style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
                    title={!canMoveDown ? reorderHint || 'لا يمكن النقل لأسفل' : 'نقل هذا الجزء لأسفل'}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>نقل لأسفل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onHideBlock(target.blockId);
                      onClose();
                    }}
                    className={`min-h-[38px] px-3 border font-semibold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                    style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>إخفاء هذا الجزء</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    className={`min-h-[38px] px-3 border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] font-semibold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف هذا الجزء بعد تأكيد</span>
                  </button>
                </div>

                {!canMoveUp && !canMoveDown && reorderHint && (
                  <p className="text-[11px]" style={{ color: theme.textMuted }}>
                    ملاحظة النقل: {reorderHint}
                  </p>
                )}

                {confirmDeleteOpen && (
                  <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] space-y-2 rounded">
                    <div className="font-bold">
                      هل أنت متأكد من حذف «{target.label}»؟ يمكنك التراجع لاحقاً بزر تراجع.
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteBlock(target);
                          onClose();
                        }}
                        className={`min-h-[34px] px-3 bg-[#DC2626] text-white font-bold cursor-pointer ${buttonRadiusClass}`}
                      >
                        تأكيد الحذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteOpen(false)}
                        className={`min-h-[34px] px-3 bg-white border border-[#D4D4D8] text-[#1C1917] font-semibold cursor-pointer ${buttonRadiusClass}`}
                      >
                        تراجع عن الحذف
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                <button
                  type="button"
                  onClick={() => {
                    setStyleDraft({});
                    onApplyStyleOnly(target.blockId, {});
                    onClose();
                  }}
                  className={`min-h-[38px] px-3 border font-semibold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                  style={{ borderColor: theme.borderColor }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط تنسيق هذا الجزء</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`min-h-[40px] px-4 border font-semibold cursor-pointer ${buttonRadiusClass}`}
                    style={{ borderColor: theme.borderColor }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onApplyStyleOnly(target.blockId, styleDraft);
                      onClose();
                    }}
                    className={`min-h-[40px] px-5 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ التصميم</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
