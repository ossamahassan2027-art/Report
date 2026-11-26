import React from 'react';
import { EditTargetDescriptor } from '../types/clickEdit';
import { ReportExtras } from '../types/studio';
import { EditableBlock } from './EditableBlock';

interface ReportExtrasRendererProps {
  extras: ReportExtras;
  primaryColor: string;
  secondaryColor: string;
  surfaceBg: string;
  borderColor: string;
  isRtl: boolean;
  compact?: boolean;
  clickEditEnabled?: boolean;
  onSelectBlock?: (target: EditTargetDescriptor) => void;
}

export const ReportExtrasRenderer: React.FC<ReportExtrasRendererProps> = ({
  extras,
  primaryColor,
  secondaryColor,
  surfaceBg,
  borderColor,
  isRtl,
  compact = false,
  clickEditEnabled = false,
  onSelectBlock,
}) => {
  const stylesMap = extras.blockStyles || {};
  const hasSummary =
    extras.extrasVisibility.summary &&
    (Boolean(extras.summaryText.trim()) || extras.quickSummaryLines.length > 0);
  const hasPlan = extras.extrasVisibility.plan && extras.planGoals.length > 0;
  const hasCharts = extras.extrasVisibility.charts && extras.charts.length > 0;
  const hasTables = extras.extrasVisibility.tables && extras.tables.length > 0;
  const hasBehavior =
    extras.extrasVisibility.behaviorTechniques &&
    extras.selectedBehaviorTechniques.length > 0;
  const hasEvaluations =
    extras.extrasVisibility.evaluations &&
    extras.selectedEvaluationForms.length > 0;
  const hasWeeklyTasks = (extras.weeklyTasks?.length || 0) > 0;
  const hasCustomCards = (extras.customCards?.length || 0) > 0;

  if (
    !hasSummary &&
    !hasPlan &&
    !hasCharts &&
    !hasTables &&
    !hasBehavior &&
    !hasEvaluations &&
    !hasWeeklyTasks &&
    !hasCustomCards
  ) {
    return null;
  }

  const textClass = compact ? 'text-[10px] leading-[1.45]' : 'text-[12px] leading-[1.6]';
  const headingClass = compact ? 'text-[13px]' : 'text-[15.5px]';

  return (
    <div className={compact ? 'space-y-2 mt-2' : 'space-y-4 mt-4'}>
      {/* Summary & 5-Line Summary */}
      {hasSummary && (
        <EditableBlock
          as="section"
          editable={clickEditEnabled}
          onSelect={onSelectBlock}
          override={stylesMap['extra-summary']}
          target={{
            blockId: 'extra-summary',
            label: 'ملخص التقرير التنفيذي',
            kind: 'summary',
            textValue: extras.summaryText.trim()
              ? extras.summaryText
              : extras.quickSummaryLines.join('\n'),
          }}
          className="border p-2.5"
          style={{ backgroundColor: surfaceBg, borderColor }}
        >
          <h3
            className={`font-editorial font-bold border-b pb-1 mb-1.5 ${headingClass}`}
            style={{ color: primaryColor, borderColor: `${primaryColor}22` }}
          >
            {isRtl ? 'ملخص التقرير التنفيذي' : 'Executive Summary'}
          </h3>
          {extras.summaryText.trim() && (
            <p className={`${textClass} text-[#1C1917] mb-1.5`}>{extras.summaryText}</p>
          )}
          {extras.quickSummaryLines.length > 0 && (
            <ul className={`space-y-0.5 ${textClass} text-[#292524]`}>
              {extras.quickSummaryLines.map((line, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="font-bold tabular-nums-ar" style={{ color: secondaryColor }}>
                    {i + 1}.
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
        </EditableBlock>
      )}

      {/* Behavior Modification Techniques */}
      {hasBehavior && (
        <EditableBlock
          as="section"
          editable={clickEditEnabled}
          onSelect={onSelectBlock}
          override={stylesMap['extra-behavior']}
          target={{
            blockId: 'extra-behavior',
            label: 'فنيات تعديل السلوك المعتمدة',
            kind: 'behavior',
            textValue: extras.selectedBehaviorTechniques.join(' · '),
          }}
          className="border p-2.5"
          style={{ borderColor }}
        >
          <h3
            className={`font-editorial font-bold border-b pb-1 mb-1.5 ${headingClass}`}
            style={{ color: primaryColor, borderColor: `${primaryColor}22` }}
          >
            {isRtl ? 'فنيات تعديل السلوك المعتمدة' : 'Selected Behavior Modification Techniques'}
          </h3>
          <p className={`${textClass} font-medium text-[#1C1917]`}>
            {extras.selectedBehaviorTechniques.join('  ·  ')}
          </p>
        </EditableBlock>
      )}

      {/* Plan & Goals Table */}
      {hasPlan && (
        <EditableBlock
          as="section"
          editable={clickEditEnabled}
          onSelect={onSelectBlock}
          override={stylesMap['extra-plan-section']}
          target={{
            blockId: 'extra-plan-section',
            label: 'خطة الأهداف (ملاحظات المتابعة)',
            kind: 'paragraph',
            textValue: extras.progressNotes,
          }}
        >
          <h3
            className={`font-editorial font-bold border-b pb-1 mb-1.5 ${headingClass}`}
            style={{ color: primaryColor, borderColor: `${primaryColor}22` }}
          >
            {isRtl ? 'الخطة التربوية وجدول الأهداف' : 'Educational Plan & Goals Matrix'}
          </h3>
          <table className={`w-full border-collapse border ${textClass}`} style={{ borderColor }}>
            <thead>
              <tr style={{ backgroundColor: surfaceBg }}>
                <th className="border p-1.5 text-start" style={{ borderColor }}>
                  {isRtl ? 'الهدف' : 'Goal'}
                </th>
                <th className="border p-1.5 text-start" style={{ borderColor }}>
                  {isRtl ? 'المدة' : 'Duration'}
                </th>
                <th className="border p-1.5 text-start" style={{ borderColor }}>
                  {isRtl ? 'المسؤول' : 'Owner'}
                </th>
                <th className="border p-1.5 text-start" style={{ borderColor }}>
                  {isRtl ? 'المتابعة' : 'Progress'}
                </th>
              </tr>
            </thead>
            <tbody>
              {extras.planGoals.map((g, gIdx) => {
                const gStyle = stylesMap[`plan-goal-${g.id}`];
                if (gStyle?.hidden) return null;
                return (
                  <tr
                    key={g.id}
                    onClick={
                      clickEditEnabled && onSelectBlock
                        ? (e) => {
                            e.stopPropagation();
                            onSelectBlock({
                              blockId: `plan-goal-${g.id}`,
                              label: `هدف خطة #${gIdx + 1}`,
                              kind: 'plan-goal',
                              textValue: g.goal,
                              listKind: 'planGoals',
                              listIndex: gIdx,
                              listTotal: extras.planGoals.length,
                              planGoalData: g,
                            });
                          }
                        : undefined
                    }
                    className={clickEditEnabled ? 'click-edit-target' : ''}
                    data-edit-label={clickEditEnabled ? `اضغط لتعديل هدف #${gIdx + 1}` : undefined}
                    style={
                      gStyle
                        ? {
                            backgroundColor: gStyle.bgColor,
                            color: gStyle.textColor,
                            fontWeight: gStyle.bold ? 700 : undefined,
                            fontStyle: gStyle.italic ? 'italic' : undefined,
                            fontSize: gStyle.fontSizePx ? `${gStyle.fontSizePx}px` : undefined,
                          }
                        : undefined
                    }
                  >
                    <td className="border p-1.5" style={{ borderColor }}>
                      {g.goal}
                    </td>
                    <td className="border p-1.5" style={{ borderColor }}>
                      {g.targetDuration}
                    </td>
                    <td className="border p-1.5" style={{ borderColor }}>
                      {g.owner}
                    </td>
                    <td className="border p-1.5" style={{ borderColor }}>
                      {g.progress}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {extras.progressNotes.trim() && (
            <p className={`${textClass} text-[#44403C] mt-1`}>
              <strong>{isRtl ? 'ملاحظات المتابعة: ' : 'Progress Notes: '}</strong>
              {extras.progressNotes}
            </p>
          )}
        </EditableBlock>
      )}

      {/* Custom Charts (User-entered values only) */}
      {hasCharts &&
        extras.charts.map((chart, cIdx) => {
          const maxVal = Math.max(1, ...chart.points.map((p) => p.value));
          return (
            <EditableBlock
              key={chart.id}
              as="section"
              editable={clickEditEnabled}
              onSelect={onSelectBlock}
              override={stylesMap[`chart-${chart.id}`]}
              target={{
                blockId: `chart-${chart.id}`,
                label: `رسم بياني: ${chart.title}`,
                kind: 'chart',
                textValue: chart.title,
                listKind: 'charts',
                listIndex: cIdx,
                listTotal: extras.charts.length,
                chartData: chart,
              }}
              className="border p-2.5"
              style={{ borderColor }}
            >
              <div className="flex items-center justify-between border-b pb-1 mb-2" style={{ borderColor: `${primaryColor}22` }}>
                <h3 className={`font-editorial font-bold ${headingClass}`} style={{ color: primaryColor }}>
                  {chart.title}
                </h3>
                {chart.unit && (
                  <span className="text-[10px] text-[#57534E]">{chart.unit}</span>
                )}
              </div>

              {chart.chartType === 'horizontal' ? (
                <div className="space-y-1.5">
                  {chart.points.map((pt, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[10.5px]">
                        <span className="font-medium text-[#1C1917]">{pt.label}</span>
                        <span className="font-bold tabular-nums-ar" style={{ color: primaryColor }}>
                          {pt.value} {chart.unit}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-[#E4E4E7] overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, (pt.value / maxVal) * 100))}%`,
                            backgroundColor: idx % 2 === 0 ? primaryColor : secondaryColor,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-end justify-around gap-2 pt-3 pb-1 border-b" style={{ borderColor, height: compact ? '95px' : '130px' }}>
                  {chart.points.map((pt, idx) => {
                    const pct = Math.min(100, Math.max(4, (pt.value / maxVal) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-[9.5px] font-bold tabular-nums-ar mb-0.5" style={{ color: primaryColor }}>
                          {pt.value}
                        </span>
                        <div
                          className="w-full max-w-[44px]"
                          style={{
                            height: `${pct * 0.72}%`,
                            backgroundColor: idx % 2 === 0 ? primaryColor : secondaryColor,
                          }}
                        />
                        <span className="text-[9.5px] text-[#44403C] mt-1 text-center truncate max-w-[70px]">
                          {pt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </EditableBlock>
          );
        })}

      {/* Custom Tables & Before/After Comparisons */}
      {hasTables &&
        extras.tables.map((tbl, tIdx) => (
          <EditableBlock
            key={tbl.id}
            as="section"
            editable={clickEditEnabled}
            onSelect={onSelectBlock}
            override={stylesMap[`table-${tbl.id}`]}
            target={{
              blockId: `table-${tbl.id}`,
              label: `جدول: ${tbl.title}`,
              kind: 'table',
              textValue: tbl.title,
              listKind: 'tables',
              listIndex: tIdx,
              listTotal: extras.tables.length,
              tableData: tbl,
            }}
          >
            <h3
              className={`font-editorial font-bold border-b pb-1 mb-1.5 ${headingClass}`}
              style={{ color: primaryColor, borderColor: `${primaryColor}22` }}
            >
              {tbl.title}
            </h3>
            <table className={`w-full border-collapse border ${textClass}`} style={{ borderColor }}>
              <thead>
                <tr style={{ backgroundColor: surfaceBg }}>
                  {tbl.headers.map((h, i) => (
                    <th key={i} className="border p-1.5 text-start" style={{ borderColor }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tbl.rows.map((r, rIdx) => (
                  <tr key={rIdx}>
                    {r.map((cell, cIdx) => (
                      <td key={cIdx} className="border p-1.5" style={{ borderColor }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </EditableBlock>
        ))}

      {/* Evaluation Forms */}
      {hasEvaluations && (
        <section className="space-y-2">
          <h3
            className={`font-editorial font-bold border-b pb-1 ${headingClass}`}
            style={{ color: primaryColor, borderColor: `${primaryColor}22` }}
          >
            {isRtl ? 'استمارات التقييم المرفقة' : 'Attached Assessment Forms'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {extras.selectedEvaluationForms.map((form, eIdx) => (
              <EditableBlock
                key={form.id}
                editable={clickEditEnabled}
                onSelect={onSelectBlock}
                override={stylesMap[`eval-${form.id}`]}
                target={{
                  blockId: `eval-${form.id}`,
                  label: form.title,
                  kind: 'evaluation',
                  textValue: form.title,
                  listKind: 'evaluations',
                  listIndex: eIdx,
                  listTotal: extras.selectedEvaluationForms.length,
                  evalData: form,
                }}
                className="border p-2"
                style={{ borderColor, backgroundColor: surfaceBg }}
              >
                <div className="font-bold text-[10.8px] mb-1 pb-0.5 border-b" style={{ color: primaryColor, borderColor: `${primaryColor}20` }}>
                  {form.title}
                </div>
                <div className={`space-y-0.5 ${textClass}`}>
                  {form.fields.map((fld, fIdx) => (
                    <div key={fIdx}>
                      <span className="text-[#57534E]">{fld.label}: </span>
                      <span className="font-medium text-[#1C1917]">{fld.value}</span>
                    </div>
                  ))}
                </div>
              </EditableBlock>
            ))}
          </div>
        </section>
      )}

      {/* Weekly Tasks Table */}
      {hasWeeklyTasks && (
        <section>
          <h3
            className={`font-editorial font-bold border-b pb-1 mb-1.5 ${headingClass}`}
            style={{ color: primaryColor, borderColor: `${primaryColor}22` }}
          >
            {isRtl ? 'جدول المهام الأسبوعي للحالة' : 'Weekly Tasks Schedule'}
          </h3>
          <table className={`w-full border-collapse border ${textClass}`} style={{ borderColor }}>
            <thead>
              <tr style={{ backgroundColor: surfaceBg }}>
                <th className="border p-1.5 text-start" style={{ borderColor }}>
                  {isRtl ? 'اليوم' : 'Day'}
                </th>
                <th className="border p-1.5 text-start" style={{ borderColor }}>
                  {isRtl ? 'المهمة / النشاط' : 'Task'}
                </th>
                <th className="border p-1.5 text-start" style={{ borderColor }}>
                  {isRtl ? 'المسؤول' : 'Owner'}
                </th>
                <th className="border p-1.5 text-start" style={{ borderColor }}>
                  {isRtl ? 'الحالة' : 'Status'}
                </th>
              </tr>
            </thead>
            <tbody>
              {(extras.weeklyTasks || []).map((t) => (
                <tr key={t.id}>
                  <td className="border p-1.5 font-semibold" style={{ borderColor }}>
                    {t.day}
                  </td>
                  <td className="border p-1.5" style={{ borderColor }}>
                    {t.task}
                  </td>
                  <td className="border p-1.5" style={{ borderColor }}>
                    {t.owner}
                  </td>
                  <td className="border p-1.5" style={{ borderColor }}>
                    {t.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Custom Cards & Extra Sections */}
      {hasCustomCards &&
        (extras.customCards || []).map((card) => (
          <EditableBlock
            key={card.id}
            as="section"
            editable={clickEditEnabled}
            onSelect={onSelectBlock}
            override={stylesMap[`custom-card-${card.id}`]}
            target={{
              blockId: `custom-card-${card.id}`,
              label: card.title,
              kind: 'paragraph',
              textValue: card.body,
            }}
            className="border p-2.5"
            style={{ backgroundColor: surfaceBg, borderColor }}
          >
            <h3
              className={`font-editorial font-bold border-b pb-1 mb-1.5 ${headingClass}`}
              style={{ color: primaryColor, borderColor: `${primaryColor}22` }}
            >
              {card.title}
            </h3>
            <p className={`${textClass} text-[#1C1917] whitespace-pre-line`}>{card.body}</p>
          </EditableBlock>
        ))}
    </div>
  );
};
