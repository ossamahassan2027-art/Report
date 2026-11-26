import type React from 'react';
import {
  ItemSelections,
  ReportData,
  ReportLanguage,
  SectionVisibility,
} from './report';
import type {
  CustomChartItem,
  CustomTableItem,
  EvaluationFormEntry,
  PlanGoalItem,
  ReportExtras,
} from './studio';

export type ReportSectionKey =
  | 'personal'
  | 'background'
  | 'environment'
  | 'homeSchool'
  | 'recommendations'
  | 'opinion';

export const DEFAULT_SECTION_ORDER: ReportSectionKey[] = [
  'personal',
  'background',
  'environment',
  'homeSchool',
  'recommendations',
  'opinion',
];

export type BlockFontFamily = 'default' | 'amiri' | 'sans' | 'tahoma';
export type BlockBorderStyle = 'none' | 'thin' | 'thick' | 'rounded';
export type BlockTextAlign = 'right' | 'center' | 'left';

export interface BlockStyleOverride {
  bold?: boolean;
  italic?: boolean;
  fontSizePx?: number;
  textColor?: string;
  bgColor?: string;
  textAlign?: BlockTextAlign;
  fontFamily?: BlockFontFamily;
  borderStyle?: BlockBorderStyle;
  hidden?: boolean;
}

export type EditTargetKind =
  | 'heading'
  | 'paragraph'
  | 'quote'
  | 'personal-table'
  | 'list-item'
  | 'plan-goal'
  | 'chart'
  | 'table'
  | 'evaluation'
  | 'summary'
  | 'behavior'
  | 'header-meta';

export type EditListKind =
  | 'envNegativePoints'
  | 'homeSchoolBenefits'
  | 'recommendations'
  | 'planGoals'
  | 'charts'
  | 'tables'
  | 'evaluations';

export interface EditTargetDescriptor {
  blockId: string;
  label: string;
  kind: EditTargetKind;
  textValue: string;
  dataField?: keyof ReportData;
  sectionKey?: ReportSectionKey;
  listKind?: EditListKind;
  listIndex?: number;
  listTotal?: number;
  chartData?: CustomChartItem;
  tableData?: CustomTableItem;
  planGoalData?: PlanGoalItem;
  evalData?: EvaluationFormEntry;
}

export interface ReportHistorySnapshot {
  arData: ReportData;
  enData: ReportData | null;
  language: ReportLanguage;
  visibility: SectionVisibility;
  selections: ItemSelections;
  extras: ReportExtras;
}

export function getBlockInlineStyle(
  override?: BlockStyleOverride
): React.CSSProperties {
  if (!override) return {};
  const style: React.CSSProperties = {};
  if (override.bold !== undefined) {
    style.fontWeight = override.bold ? 700 : 400;
  }
  if (override.italic !== undefined) {
    style.fontStyle = override.italic ? 'italic' : 'normal';
  }
  if (override.fontSizePx !== undefined && override.fontSizePx > 0) {
    style.fontSize = `${override.fontSizePx}px`;
  }
  if (override.textColor) {
    style.color = override.textColor;
  }
  if (override.bgColor) {
    style.backgroundColor = override.bgColor;
  }
  if (override.textAlign) {
    style.textAlign = override.textAlign;
  }
  if (override.fontFamily && override.fontFamily !== 'default') {
    if (override.fontFamily === 'amiri') {
      style.fontFamily = "'Amiri', Georgia, serif";
    } else if (override.fontFamily === 'sans') {
      style.fontFamily = "'IBM Plex Sans Arabic', system-ui, sans-serif";
    } else if (override.fontFamily === 'tahoma') {
      style.fontFamily = 'Tahoma, Arial, sans-serif';
    }
  }
  if (override.borderStyle) {
    if (override.borderStyle === 'none') {
      style.borderStyle = 'none';
      style.borderWidth = 0;
    } else if (override.borderStyle === 'thin') {
      style.borderStyle = 'solid';
      style.borderWidth = '1px';
      style.borderColor = '#CBD5E1';
      style.padding = style.padding ?? '4px 8px';
    } else if (override.borderStyle === 'thick') {
      style.borderStyle = 'solid';
      style.borderWidth = '2.5px';
      style.borderColor = '#1E3A8A';
      style.padding = style.padding ?? '6px 10px';
    } else if (override.borderStyle === 'rounded') {
      style.borderStyle = 'solid';
      style.borderWidth = '1px';
      style.borderColor = '#94A3B8';
      style.borderRadius = '10px';
      style.padding = style.padding ?? '6px 10px';
    }
  }
  return style;
}
