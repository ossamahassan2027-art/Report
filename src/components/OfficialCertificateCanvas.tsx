import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Award,
  Bold,
  Copy,
  Italic,
  Layers,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  Underline,
  Unlock,
} from 'lucide-react';
import {
  BEHEIRA_YOUTH_LOGO_SVG,
  CENTER_REHAB_LOGO_SVG,
} from '../data/certificateTemplates';
import {
  CertCanvasElement,
  CertificateTemplateDef,
  CertRecipientRow,
} from '../types/certificates';
import { CV_FONT_OPTIONS } from '../types/cv';
import { getFontCssFamily } from '../utils/cvSmartSuite';
import { generateOfflineQrSvgDataUrl } from '../utils/qrOfflineGenerator';

interface OfficialCertificateCanvasProps {
  template: CertificateTemplateDef;
  recipient: CertRecipientRow;
  elements: CertCanvasElement[];
  selectedElementId: string | null;
  interactive?: boolean;
  showQrOnCard?: boolean;
  customSignatureImageUrl?: string;
  customStampImageUrl?: string;
  onSelectElement?: (id: string | null) => void;
  onUpdateElement?: (id: string, patch: Partial<CertCanvasElement>) => void;
  onDeleteElement?: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
  onReorderZIndex?: (id: string, delta: 1 | -1) => void;
  cardRef?: (el: HTMLDivElement | null) => void;
}

export const OfficialCertificateCanvas: React.FC<OfficialCertificateCanvasProps> = ({
  template,
  recipient,
  elements,
  selectedElementId,
  interactive = false,
  showQrOnCard = true,
  customSignatureImageUrl,
  customStampImageUrl,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderZIndex,
  cardRef,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    mode: 'move' | 'resize';
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    origW: number;
  } | null>(null);

  const style = template.style;
  const isOfficialBeheira = style.variant === 'official-beheira-statement';
  const titleText = recipient.perCardTitleOverride || template.headerTitle;
  const introText = recipient.perCardIntroOverride || template.introLine;

  // Dynamic font-size auto-shrink to prevent long names from ever clipping/overflowing
  const cleanName = recipient.fullName?.trim() || '[ الاسم الكامل ]';
  const nameFontSizePx = Math.max(
    18,
    Math.round(30 - Math.max(0, cleanName.length - 20) * 0.48)
  );
  const roleFontSizePx = Math.max(
    15,
    Math.round(21 - Math.max(0, (recipient.roleOrCourse || '').length - 28) * 0.25)
  );

  useEffect(() => {
    if (!dragState || !interactive) return;

    const handlePointerMove = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container || !onUpdateElement) return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dxPercent = ((e.clientX - dragState.startClientX) / rect.width) * 100;
      const dyPercent = ((e.clientY - dragState.startClientY) / rect.height) * 100;

      if (dragState.mode === 'move') {
        const nextX = Math.max(2, Math.min(92, dragState.origX + dxPercent));
        const nextY = Math.max(2, Math.min(94, dragState.origY + dyPercent));
        onUpdateElement(dragState.id, {
          xPercent: Number(nextX.toFixed(2)),
          yPercent: Number(nextY.toFixed(2)),
        });
      } else {
        const nextW = Math.max(8, Math.min(90, dragState.origW + Math.abs(dxPercent)));
        onUpdateElement(dragState.id, {
          widthPercent: Number(nextW.toFixed(2)),
        });
      }
    };

    const handlePointerUp = () => {
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, interactive, onUpdateElement]);

  const qrSvgDataUrl = showQrOnCard
    ? generateOfflineQrSvgDataUrl(
        `CERT:${recipient.serial}|NAME:${cleanName}|ROLE:${recipient.roleOrCourse}|DATE:${recipient.dateStr}`
      )
    : '';

  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  const renderElementDynamicText = (el: CertCanvasElement): string => {
    if (el.kind === 'name') {
      return el.text.includes('[الاسم]')
        ? el.text.replace('[الاسم]', cleanName)
        : el.text || cleanName;
    }
    if (el.kind === 'date') {
      return el.text.includes('[التاريخ]')
        ? el.text.replace('[التاريخ]', recipient.dateStr)
        : el.text || recipient.dateStr;
    }
    if (el.kind === 'serial') {
      return el.text.includes('[التسلسلي]')
        ? el.text.replace('[التسلسلي]', recipient.serial)
        : el.text || recipient.serial;
    }
    return el.text;
  };

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (cardRef) cardRef(node);
      }}
      dir="rtl"
      onClick={() => {
        if (interactive) {
          onSelectElement?.(null);
          setEditingId(null);
        }
      }}
      className="relative bg-white select-none overflow-hidden shadow-md"
      style={{
        width: '1123px',
        height: '794px',
        boxSizing: 'border-box',
        fontFamily: "'Cairo', 'Amiri', Arial, sans-serif",
      }}
    >
      {/* Outer Thin Frame */}
      <div
        className="absolute inset-[10px] pointer-events-none"
        style={{
          border: `2px solid ${style.outerBorderColor}`,
        }}
      />

      {/* 4 Colorful Geometric Corner Triangle Clusters (Beheira / Classic Gold / Child Star / Honor / Rehab) */}
      {style.showCornerTriangles && (
        <>
          {/* Top Right Cluster */}
          <svg
            width="150"
            height="150"
            viewBox="0 0 150 150"
            className="absolute top-[12px] right-[12px] pointer-events-none"
          >
            <polygon points="150,0 150,140 10,0" fill={style.innerBorderColor} />
            <polygon points="150,0 150,105 45,0" fill={style.accentColor} />
            <polygon points="150,0 150,70 80,0" fill={style.secondaryAccent} />
            <polygon points="150,0 150,38 112,0" fill="#38BDF8" />
          </svg>
          {/* Top Left Cluster */}
          <svg
            width="150"
            height="150"
            viewBox="0 0 150 150"
            className="absolute top-[12px] left-[12px] pointer-events-none"
          >
            <polygon points="0,0 140,0 0,140" fill={style.innerBorderColor} />
            <polygon points="0,0 105,0 0,105" fill={style.accentColor} />
            <polygon points="0,0 70,0 0,70" fill={style.secondaryAccent} />
            <polygon points="0,0 38,0 0,38" fill="#38BDF8" />
          </svg>
          {/* Bottom Right Cluster */}
          <svg
            width="150"
            height="150"
            viewBox="0 0 150 150"
            className="absolute bottom-[12px] right-[12px] pointer-events-none"
          >
            <polygon points="150,150 150,10 10,150" fill={style.innerBorderColor} />
            <polygon points="150,150 150,45 45,150" fill={style.accentColor} />
            <polygon points="150,150 150,80 80,150" fill={style.secondaryAccent} />
            <polygon points="150,150 150,112 112,150" fill="#38BDF8" />
          </svg>
          {/* Bottom Left Cluster */}
          <svg
            width="150"
            height="150"
            viewBox="0 0 150 150"
            className="absolute bottom-[12px] left-[12px] pointer-events-none"
          >
            <polygon points="0,150 140,150 0,10" fill={style.innerBorderColor} />
            <polygon points="0,150 105,150 0,45" fill={style.accentColor} />
            <polygon points="0,150 70,150 0,80" fill={style.secondaryAccent} />
            <polygon points="0,150 38,150 0,112" fill="#38BDF8" />
          </svg>
        </>
      )}

      {/* Inner Rounded Frame */}
      <div
        className="absolute inset-[28px] bg-white flex flex-col justify-between px-12 py-8"
        style={{
          border: `4px solid ${style.innerBorderColor}`,
          borderRadius: `${style.roundedInnerPx}px`,
          boxShadow: isOfficialBeheira
            ? 'inset 0 0 0 2px rgba(255,152,0,0.22)'
            : `inset 0 0 0 2px ${style.accentColor}30`,
        }}
      >
        {/* Header Row: Right Logo + Title + Left Logo */}
        <header className="flex items-start justify-between gap-6">
          {/* Right Entity Block */}
          <div className="w-[215px] flex flex-col items-center text-center shrink-0">
            <img
              src={template.rightLogoDataUrl || BEHEIRA_YOUTH_LOGO_SVG}
              alt={template.rightEntityTitle}
              className="w-[92px] h-[92px] object-contain"
            />
            <div
              className="mt-1 text-[12px] font-extrabold leading-tight"
              style={{ color: style.titleColor }}
            >
              {template.rightEntityTitle}
            </div>
            {template.rightEntitySub && (
              <div className="text-[11px] font-bold text-[#B71C1C]">
                {template.rightEntitySub}
              </div>
            )}
          </div>

          {/* Center Main Title + Stars */}
          <div className="flex-1 flex flex-col items-center justify-center text-center pt-1">
            {template.kind === 'certificate' && (
              <div
                className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-[11px] font-bold mb-1.5"
                style={{
                  backgroundColor: `${style.accentColor}1A`,
                  color: style.titleColor,
                  border: `1px solid ${style.accentColor}66`,
                }}
              >
                <Award className="w-3.5 h-3.5" />
                <span>وثيقة تكريم وتميّز رسمية</span>
              </div>
            )}
            <h1
              className="m-0 font-black tracking-wide leading-tight"
              style={{
                fontSize: isOfficialBeheira ? '44px' : '38px',
                color: style.titleColor,
                fontFamily: "'Amiri', 'Cairo', serif",
              }}
            >
              {titleText}
            </h1>
            {template.subtitle && (
              <p className="mt-1 text-[13px] font-bold text-[#475569] m-0">
                {template.subtitle}
              </p>
            )}
            {style.showStarsRow && style.starsCount > 0 && (
              <div
                className="mt-1.5 flex items-center justify-center gap-2 text-[22px] leading-none"
                style={{ color: '#F59E0B' }}
              >
                {Array.from({ length: style.starsCount }).map((_, idx) => (
                  <span key={idx}>★</span>
                ))}
              </div>
            )}
            <div
              className="w-48 h-[3px] rounded-full mt-2"
              style={{
                background: `linear-gradient(90deg, transparent, ${style.accentColor}, transparent)`,
              }}
            />
          </div>

          {/* Left Entity Block */}
          <div className="w-[215px] flex flex-col items-center text-center shrink-0">
            <img
              src={template.leftLogoDataUrl || CENTER_REHAB_LOGO_SVG}
              alt={template.leftEntityTitle}
              className="w-[92px] h-[92px] object-contain"
            />
            <div
              className="mt-1 text-[12px] font-extrabold leading-tight"
              style={{ color: style.titleColor }}
            >
              {template.leftEntityTitle}
            </div>
            {template.leftEntitySub && (
              <div className="text-[11px] font-bold text-[#0288D1]">
                {template.leftEntitySub}
              </div>
            )}
          </div>
        </header>

        {/* Center Formal Body */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 space-y-3">
          <p
            className="text-[20px] font-bold m-0"
            style={{ color: style.bodyTextColor }}
          >
            {introText}
          </p>

          {/* Recipient Full Name (Bold Black, Dynamic Auto-Shrink) */}
          <div className="py-1 px-6 max-w-full">
            <div
              className="font-black text-black leading-tight break-words"
              style={{
                fontSize: `${nameFontSizePx}px`,
                fontFamily: "'Cairo', 'Amiri', sans-serif",
              }}
            >
              الأستاذ / {cleanName}
            </div>
            <div
              className="mx-auto mt-1 h-[2px] w-72"
              style={{ backgroundColor: `${style.innerBorderColor}55` }}
            />
          </div>

          {/* Entity & Role Line */}
          <div className="space-y-1.5 max-w-[860px]">
            <p
              className="text-[19px] font-bold m-0 leading-relaxed"
              style={{ color: style.bodyTextColor }}
            >
              {template.bodyParagraphBeforeName}
            </p>
            <p
              className="font-extrabold text-black m-0 leading-snug"
              style={{ fontSize: `${roleFontSizePx}px` }}
            >
              {template.kind === 'statement'
                ? `بوظيفة: ${recipient.roleOrCourse || 'أخصائي تأهيل'}  —  تاريخ بداية العمل: ${recipient.dateStr || '—'}`
                : `${recipient.roleOrCourse || 'برنامج التأهيل المتخصص'}  (بتقدير: ${recipient.grade || 'امتياز'})  —  بتاريخ: ${recipient.dateStr || '—'}`}
            </p>
          </div>

          {/* Multi-line Framework / Zayed Authority & Beheira Directorate Collaboration */}
          <div
            className="text-[17px] font-bold leading-[1.65] whitespace-pre-line max-w-[850px]"
            style={{ color: style.bodyTextColor }}
          >
            {template.bodyParagraphAfterRole}
          </div>

          <p
            className="text-[18px] font-extrabold pt-1 m-0"
            style={{ color: style.bodyTextColor }}
          >
            {template.closingLine}
            {template.kind === 'certificate' && recipient.dateStr
              ? ` ${recipient.dateStr}`
              : ''}
          </p>
        </main>

        {/* Bottom Row: Right Serial + QR, Left Signature & Stamp */}
        <footer className="flex items-end justify-between gap-6 pt-2">
          {/* Bottom Right: Serial + Offline QR */}
          <div className="flex items-center gap-3 min-w-[230px]">
            {showQrOnCard && qrSvgDataUrl && (
              <img
                src={qrSvgDataUrl}
                alt="QR"
                className="w-[64px] h-[64px] border border-[#CBD5E1] rounded p-0.5 bg-white"
              />
            )}
            <div className="text-right space-y-0.5">
              <div className="text-[10.5px] font-bold text-[#475569]">
                الرقم التسلسلي الموثق
              </div>
              <div
                dir="ltr"
                className="text-[12px] font-black tracking-wide"
                style={{ color: style.titleColor }}
              >
                {recipient.serial}
              </div>
              {recipient.grade && template.kind === 'statement' && (
                <div className="text-[10px] font-semibold text-[#64748B]">
                  التقدير / الحالة: {recipient.grade}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Center Optional Stamp */}
          <div className="flex items-center justify-center">
            {customStampImageUrl ? (
              <img
                src={customStampImageUrl}
                alt="الختم الرسمي"
                className="w-[88px] h-[88px] object-contain opacity-90"
              />
            ) : (
              <div
                className="w-[82px] h-[82px] rounded-full border-2 border-dashed flex flex-col items-center justify-center text-center opacity-75"
                style={{
                  borderColor: style.innerBorderColor,
                  color: style.innerBorderColor,
                }}
              >
                <span className="text-[9px] font-black leading-tight">
                  {template.rightEntityTitle.split(' ').slice(0, 2).join(' ')}
                </span>
                <span className="text-[8px] font-bold mt-0.5">معتمد ومختوم</span>
              </div>
            )}
          </div>

          {/* Bottom Left Signer */}
          <div className="min-w-[250px] text-center space-y-1">
            <div
              className="text-[16px] font-black"
              style={{ color: style.titleColor }}
            >
              {template.signerTitle}
            </div>
            {customSignatureImageUrl && (
              <img
                src={customSignatureImageUrl}
                alt="توقيع"
                className="h-[38px] mx-auto object-contain"
              />
            )}
            <div
              className="text-[18px] font-black"
              style={{ color: style.titleColor }}
            >
              {template.signerName}
            </div>
          </div>
        </footer>
      </div>

      {/* Free Canvas Interactive Elements Layer (Drag & Drop + Resize + Rotate + Double-Click Inline Edit) */}
      {sortedElements.map((el) => {
        const isSelected = interactive && selectedElementId === el.id;
        const isEditing = interactive && editingId === el.id;
        const resolvedFont = getFontCssFamily(el.fontId);
        const displayText = renderElementDynamicText(el);

        return (
          <div
            key={el.id}
            onClick={(e) => {
              if (!interactive) return;
              e.stopPropagation();
              onSelectElement?.(el.id);
            }}
            onDoubleClick={(e) => {
              if (!interactive || el.locked) return;
              e.stopPropagation();
              if (
                el.kind !== 'divider' &&
                el.kind !== 'qr' &&
                el.kind !== 'logo' &&
                el.kind !== 'photo'
              ) {
                setEditingId(el.id);
              }
            }}
            onPointerDown={(e) => {
              if (!interactive || el.locked || isEditing) return;
              e.stopPropagation();
              onSelectElement?.(el.id);
              setDragState({
                id: el.id,
                mode: 'move',
                startClientX: e.clientX,
                startClientY: e.clientY,
                origX: el.xPercent,
                origY: el.yPercent,
                origW: el.widthPercent,
              });
            }}
            style={{
              position: 'absolute',
              left: `${el.xPercent}%`,
              top: `${el.yPercent}%`,
              width: `${el.widthPercent}%`,
              transform: `translate(-50%, -50%) rotate(${el.rotationDeg}deg)`,
              zIndex: el.zIndex,
              cursor: interactive
                ? el.locked
                  ? 'not-allowed'
                  : 'move'
                : 'default',
              outline: isSelected ? '2px dashed #2563EB' : 'none',
              outlineOffset: '3px',
              backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
              padding: '3px 6px',
              borderRadius: '4px',
            }}
          >
            {el.kind === 'divider' ? (
              <div
                style={{
                  height: '3px',
                  width: '100%',
                  backgroundColor: el.color || '#1E3A8A',
                  borderRadius: '99px',
                }}
              />
            ) : el.kind === 'qr' ? (
              <div className="flex flex-col items-center">
                <img
                  src={generateOfflineQrSvgDataUrl(
                    `${recipient.serial} | ${cleanName} | ${recipient.dateStr}`
                  )}
                  alt="QR"
                  className="w-16 h-16 bg-white p-0.5 border border-[#CBD5E1]"
                />
              </div>
            ) : (el.kind === 'logo' || el.kind === 'photo' || el.kind === 'stamp' || el.kind === 'signature') &&
              el.imageDataUrl ? (
              <img
                src={el.imageDataUrl}
                alt={el.label}
                className="w-full max-h-[110px] object-contain mx-auto pointer-events-none"
              />
            ) : el.kind === 'stamp' ? (
              <div
                className="mx-auto w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center text-center font-bold"
                style={{
                  borderColor: el.color || '#B71C1C',
                  color: el.color || '#B71C1C',
                  fontSize: `${Math.max(10, el.fontSizePx - 4)}px`,
                }}
              >
                {displayText || 'ختم رسمي'}
              </div>
            ) : isEditing ? (
              <textarea
                autoFocus
                rows={2}
                value={el.text}
                onChange={(e) => onUpdateElement?.(el.id, { text: e.target.value })}
                onBlur={() => setEditingId(null)}
                onClick={(e) => e.stopPropagation()}
                className="w-full p-1 bg-white border border-[#2563EB] rounded text-center focus:outline-none"
                style={{
                  fontFamily: resolvedFont,
                  fontSize: `${el.fontSizePx}px`,
                  color: el.color,
                  fontWeight: el.bold ? 700 : 400,
                  fontStyle: el.italic ? 'italic' : 'normal',
                  textDecoration: el.underline ? 'underline' : 'none',
                  textAlign: el.align,
                }}
              />
            ) : (
              <div
                className="whitespace-pre-wrap break-words leading-snug"
                style={{
                  fontFamily: resolvedFont,
                  fontSize: `${el.fontSizePx}px`,
                  color: el.color,
                  fontWeight: el.bold ? 700 : 400,
                  fontStyle: el.italic ? 'italic' : 'normal',
                  textDecoration: el.underline ? 'underline' : 'none',
                  textAlign: el.align,
                }}
              >
                {displayText}
              </div>
            )}

            {/* Resize Handle on Selected Element */}
            {isSelected && !el.locked && (
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setDragState({
                    id: el.id,
                    mode: 'resize',
                    startClientX: e.clientX,
                    startClientY: e.clientY,
                    origX: el.xPercent,
                    origY: el.yPercent,
                    origW: el.widthPercent,
                  });
                }}
                title="سحب لتغيير الحجم والعرض"
                className="no-print absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-[#2563EB] border-2 border-white shadow cursor-nwse-resize"
              />
            )}
          </div>
        );
      })}

      {/* Floating Miniature Formatting Toolbar when an element is selected in interactive mode */}
      {interactive && selectedElement && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="no-print absolute z-50 bg-[#0F172A] text-white rounded-xl shadow-2xl px-2.5 py-1.5 flex flex-wrap items-center gap-1.5 text-[11px]"
          style={{
            left: `${Math.min(72, Math.max(28, selectedElement.xPercent))}%`,
            top:
              selectedElement.yPercent < 18
                ? `${selectedElement.yPercent + 10}%`
                : `${selectedElement.yPercent - 9}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <select
            value={selectedElement.fontId}
            onChange={(e) =>
              onUpdateElement?.(selectedElement.id, {
                fontId: e.target.value as CertCanvasElement['fontId'],
              })
            }
            className="bg-[#1E293B] text-white px-1.5 py-1 rounded border border-[#334155] text-[11px]"
          >
            {CV_FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              onUpdateElement?.(selectedElement.id, {
                fontSizePx: Math.max(10, selectedElement.fontSizePx - 2),
              })
            }
            className="p-1 hover:bg-[#334155] rounded cursor-pointer"
            title="تصغير الخط"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="font-bold min-w-[22px] text-center">
            {selectedElement.fontSizePx}
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdateElement?.(selectedElement.id, {
                fontSizePx: Math.min(72, selectedElement.fontSizePx + 2),
              })
            }
            className="p-1 hover:bg-[#334155] rounded cursor-pointer"
            title="تكبير الخط"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <input
            type="color"
            value={selectedElement.color}
            onChange={(e) =>
              onUpdateElement?.(selectedElement.id, { color: e.target.value })
            }
            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
            title="لون العنصر"
          />

          <button
            type="button"
            onClick={() =>
              onUpdateElement?.(selectedElement.id, {
                bold: !selectedElement.bold,
              })
            }
            className={`p-1 rounded cursor-pointer ${
              selectedElement.bold ? 'bg-[#2563EB]' : 'hover:bg-[#334155]'
            }`}
            title="عريض"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateElement?.(selectedElement.id, {
                italic: !selectedElement.italic,
              })
            }
            className={`p-1 rounded cursor-pointer ${
              selectedElement.italic ? 'bg-[#2563EB]' : 'hover:bg-[#334155]'
            }`}
            title="مائل"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateElement?.(selectedElement.id, {
                underline: !selectedElement.underline,
              })
            }
            className={`p-1 rounded cursor-pointer ${
              selectedElement.underline ? 'bg-[#2563EB]' : 'hover:bg-[#334155]'
            }`}
            title="تسطير"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onUpdateElement?.(selectedElement.id, { align: 'right' })}
            className={`p-1 rounded cursor-pointer ${
              selectedElement.align === 'right' ? 'bg-[#2563EB]' : 'hover:bg-[#334155]'
            }`}
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateElement?.(selectedElement.id, { align: 'center' })}
            className={`p-1 rounded cursor-pointer ${
              selectedElement.align === 'center' ? 'bg-[#2563EB]' : 'hover:bg-[#334155]'
            }`}
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateElement?.(selectedElement.id, { align: 'left' })}
            className={`p-1 rounded cursor-pointer ${
              selectedElement.align === 'left' ? 'bg-[#2563EB]' : 'hover:bg-[#334155]'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateElement?.(selectedElement.id, {
                rotationDeg: selectedElement.rotationDeg - 15,
              })
            }
            className="p-1 hover:bg-[#334155] rounded cursor-pointer"
            title="تدوير يمين"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateElement?.(selectedElement.id, {
                rotationDeg: selectedElement.rotationDeg + 15,
              })
            }
            className="p-1 hover:bg-[#334155] rounded cursor-pointer"
            title="تدوير يسار"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onReorderZIndex?.(selectedElement.id, 1)}
            className="p-1 hover:bg-[#334155] rounded cursor-pointer"
            title="تقديم للأمام"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDuplicateElement?.(selectedElement.id)}
            className="p-1 hover:bg-[#334155] rounded cursor-pointer"
            title="تكرار العنصر"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateElement?.(selectedElement.id, {
                locked: !selectedElement.locked,
              })
            }
            className={`p-1 rounded cursor-pointer ${
              selectedElement.locked ? 'bg-[#F59E0B] text-black' : 'hover:bg-[#334155]'
            }`}
            title={selectedElement.locked ? 'إلغاء القفل' : 'قفل المكان'}
          >
            {selectedElement.locked ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onDeleteElement?.(selectedElement.id)}
            className="p-1 hover:bg-[#DC2626] rounded cursor-pointer text-[#FCA5A5] hover:text-white"
            title="حذف العنصر"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
