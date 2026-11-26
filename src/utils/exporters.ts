import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import * as XLSX from 'xlsx';
import {
  ACCENT_THEMES,
  AccentTheme,
  ReportData,
  ReportLanguage,
  SectionVisibility,
} from '../types/report';
import { ReportExtras } from '../types/studio';

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportReportToWord(
  data: ReportData,
  visibility: SectionVisibility,
  language: ReportLanguage,
  accentTheme: AccentTheme,
  extras?: ReportExtras
): Promise<void> {
  const isRtl = language === 'ar';
  const theme = ACCENT_THEMES[accentTheme];
  const primaryHex = theme.primary.replace('#', '');
  const secondaryHex = theme.secondary.replace('#', '');
  const align = isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT;
  const fontName = isRtl ? 'Arial' : 'Calibri';

  const makeHeading = (text: string) =>
    new Paragraph({
      bidirectional: isRtl,
      alignment: align,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 220, after: 100 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: primaryHex,
        },
      },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 26,
          color: primaryHex,
          font: fontName,
          rightToLeft: isRtl,
        }),
      ],
    });

  const makeBody = (text: string, bold = false) =>
    new Paragraph({
      bidirectional: isRtl,
      alignment: align,
      spacing: { after: 100, line: 300 },
      children: [
        new TextRun({
          text,
          bold,
          size: 22,
          color: '1C1917',
          font: fontName,
          rightToLeft: isRtl,
        }),
      ],
    });

  const makeBullet = (indexStr: string, text: string) =>
    new Paragraph({
      bidirectional: isRtl,
      alignment: align,
      spacing: { after: 70, line: 280 },
      children: [
        new TextRun({
          text: `${indexStr}  `,
          bold: true,
          size: 21,
          color: secondaryHex,
          font: fontName,
          rightToLeft: isRtl,
        }),
        new TextRun({
          text,
          size: 21,
          color: '1C1917',
          font: fontName,
          rightToLeft: isRtl,
        }),
      ],
    });

  const labels = isRtl
    ? {
        ref: 'المرجع',
        date: 'التاريخ',
        phone: 'الهاتف',
        to: 'موجه إلى',
        sec1: 'أولاً: البيانات الشخصية',
        name: 'الاسم',
        dob: 'تاريخ الميلاد',
        age: 'العمر',
        diag: 'التشخيص المذكور',
        sec2: 'ثانياً: الخلفية النمائية والسلوكية',
        sec3: 'ثالثاً: تأثير البيئة المحيطة على كفاءة التعلم',
        envPosTitle: 'البيئة الهادئة والمنظمة:',
        sec4: 'رابعاً: أهمية التعليم في بيئة منزلية منظمة',
        sec5: 'خامساً: التوصيات التعليمية',
        sec6: 'سادساً: الرأي والتوصية المهنية',
        prep: 'إعداد',
        role: 'الصفة المهنية',
        center: 'المركز',
        signDate: 'التاريخ',
      }
    : {
        ref: 'Reference',
        date: 'Date',
        phone: 'Phone',
        to: 'Addressed To',
        sec1: 'I. Personal Information',
        name: 'Student Name',
        dob: 'Date of Birth',
        age: 'Age',
        diag: 'Reported Diagnosis',
        sec2: 'II. Developmental & Behavioral Background',
        sec3: 'III. Environmental Impact on Learning Efficiency',
        envPosTitle: 'Calm & Structured Environment:',
        sec4: 'IV. Importance of Structured Home Schooling',
        sec5: 'V. Educational Recommendations',
        sec6: 'VI. Professional Opinion & Recommendation',
        prep: 'Prepared By',
        role: 'Professional Title',
        center: 'Center',
        signDate: 'Date',
      };

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      bidirectional: isRtl,
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `${data.centerName}${data.centerCity ? ` - ${data.centerCity}` : ''}`,
          bold: true,
          size: 32,
          color: primaryHex,
          font: fontName,
          rightToLeft: isRtl,
        }),
      ],
    }),
    new Paragraph({
      bidirectional: isRtl,
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: `${data.directorName} (${data.directorRole})  ·  ${labels.phone}: ${data.phone}  ·  ${labels.ref}: ${data.referenceNumber}  ·  ${labels.date}: ${data.reportDate}`,
          size: 19,
          color: '57534E',
          font: fontName,
          rightToLeft: isRtl,
        }),
      ],
    }),
    new Paragraph({
      bidirectional: isRtl,
      alignment: align,
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({
          text: `${labels.to}: ${data.schoolAddressee}`,
          bold: true,
          size: 23,
          color: '1C1917',
          font: fontName,
          rightToLeft: isRtl,
        }),
      ],
    }),
    new Paragraph({
      bidirectional: isRtl,
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 40 },
      children: [
        new TextRun({
          text: data.reportTitle,
          bold: true,
          size: 30,
          color: primaryHex,
          font: fontName,
          rightToLeft: isRtl,
        }),
      ],
    }),
    new Paragraph({
      bidirectional: isRtl,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: data.reportSubtitle,
          bold: true,
          size: 22,
          color: secondaryHex,
          font: fontName,
          rightToLeft: isRtl,
        }),
      ],
    }),
  ];

  if (visibility.personal) {
    children.push(makeHeading(labels.sec1));
    const personalTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      visuallyRightToLeft: isRtl,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [makeBody(`${labels.name}: ${data.childName}`, true)],
            }),
            new TableCell({
              children: [makeBody(`${labels.dob}: ${data.birthDate}`, true)],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [makeBody(`${labels.age}: ${data.age}`, true)],
            }),
            new TableCell({
              children: [makeBody(`${labels.diag}: ${data.diagnosis}`, true)],
            }),
          ],
        }),
      ],
    });
    children.push(personalTable);
  }

  if (visibility.background) {
    children.push(makeHeading(labels.sec2));
    children.push(makeBody(data.backgroundParagraph1));
    children.push(makeBody(data.backgroundParagraph2));
  }

  if (visibility.environment) {
    children.push(makeHeading(labels.sec3));
    children.push(makeBody(data.envIntro, true));
    children.push(makeBody(`${labels.envPosTitle} ${data.envPositive}`));
    if (data.envNegativePoints.length > 0) {
      children.push(makeBody(data.envNegativeIntro, true));
      data.envNegativePoints.forEach((pt, idx) => {
        children.push(makeBullet(`${idx + 1}.`, pt));
      });
    }
  }

  if (visibility.homeSchool && data.homeSchoolBenefits.length > 0) {
    children.push(makeHeading(labels.sec4));
    children.push(makeBody(data.homeSchoolIntro));
    data.homeSchoolBenefits.forEach((item, idx) => {
      children.push(makeBullet(String(idx + 1).padStart(2, '0'), item));
    });
  }

  if (visibility.recommendations && data.recommendations.length > 0) {
    children.push(makeHeading(labels.sec5));
    children.push(makeBody(data.recommendationsIntro));
    data.recommendations.forEach((rec, idx) => {
      children.push(makeBullet(String(idx + 1).padStart(2, '0'), rec));
    });
  }

  if (visibility.opinion) {
    children.push(makeHeading(labels.sec6));
    children.push(makeBody(data.opinionParagraph1));
    children.push(makeBody(data.opinionParagraph2));
    children.push(makeBody(data.opinionParagraph3));
    children.push(
      new Paragraph({
        bidirectional: isRtl,
        alignment: AlignmentType.CENTER,
        spacing: { before: 140, after: 140 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: secondaryHex },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: secondaryHex },
        },
        children: [
          new TextRun({
            text: `"${data.coreGoalQuote}"`,
            bold: true,
            size: 23,
            color: primaryHex,
            font: fontName,
            rightToLeft: isRtl,
          }),
        ],
      })
    );
  }

  if (extras) {
    if (
      extras.extrasVisibility.summary &&
      (extras.summaryText.trim() || extras.quickSummaryLines.length > 0)
    ) {
      children.push(makeHeading(isRtl ? 'ملخص التقرير التنفيذي' : 'Executive Summary'));
      if (extras.summaryText.trim()) children.push(makeBody(extras.summaryText));
      extras.quickSummaryLines.forEach((ln, idx) => {
        children.push(makeBullet(`${idx + 1}.`, ln));
      });
    }

    if (
      extras.extrasVisibility.behaviorTechniques &&
      extras.selectedBehaviorTechniques.length > 0
    ) {
      children.push(
        makeHeading(isRtl ? 'فنيات تعديل السلوك المختارة' : 'Selected Behavior Techniques')
      );
      children.push(makeBody(extras.selectedBehaviorTechniques.join('  ·  ')));
    }

    if (extras.extrasVisibility.plan && extras.planGoals.length > 0) {
      children.push(makeHeading(isRtl ? 'خطة الأهداف والمتابعة' : 'Action Plan & Goals'));
      const goalRows = [
        new TableRow({
          children: [
            new TableCell({ children: [makeBody(isRtl ? 'الهدف' : 'Goal', true)] }),
            new TableCell({ children: [makeBody(isRtl ? 'المدة' : 'Duration', true)] }),
            new TableCell({ children: [makeBody(isRtl ? 'المسؤول' : 'Owner', true)] }),
            new TableCell({ children: [makeBody(isRtl ? 'التقدم' : 'Progress', true)] }),
          ],
        }),
        ...extras.planGoals.map(
          (g) =>
            new TableRow({
              children: [
                new TableCell({ children: [makeBody(g.goal)] }),
                new TableCell({ children: [makeBody(g.targetDuration)] }),
                new TableCell({ children: [makeBody(g.owner)] }),
                new TableCell({ children: [makeBody(g.progress)] }),
              ],
            })
        ),
      ];
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          visuallyRightToLeft: isRtl,
          rows: goalRows,
        })
      );
      if (extras.progressNotes.trim()) {
        children.push(
          makeBody(
            `${isRtl ? 'ملاحظات المتابعة' : 'Progress Notes'}: ${extras.progressNotes}`
          )
        );
      }
    }

    if (extras.extrasVisibility.tables && extras.tables.length > 0) {
      extras.tables.forEach((tbl) => {
        children.push(makeHeading(tbl.title));
        const tblRows = [
          new TableRow({
            children: tbl.headers.map(
              (h) => new TableCell({ children: [makeBody(h, true)] })
            ),
          }),
          ...tbl.rows.map(
            (r) =>
              new TableRow({
                children: r.map(
                  (cell) => new TableCell({ children: [makeBody(cell)] })
                ),
              })
          ),
        ];
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: isRtl,
            rows: tblRows,
          })
        );
      });
    }

    if (extras.extrasVisibility.evaluations && extras.selectedEvaluationForms.length > 0) {
      children.push(makeHeading(isRtl ? 'استمارات التقييم المرفقة' : 'Attached Evaluations'));
      extras.selectedEvaluationForms.forEach((form) => {
        children.push(makeBody(form.title, true));
        form.fields.forEach((fld) => {
          children.push(makeBullet('•', `${fld.label}: ${fld.value}`));
        });
      });
    }
  }

  children.push(makeBody(data.closingSalutation, true));
  children.push(
    makeBody(
      `${labels.prep}: ${data.preparedBy}  |  ${labels.role}: ${data.professionalTitle}  |  ${labels.center}: ${data.signCenterName}  |  ${labels.signDate}: ${data.signDate}  |  ${labels.phone}: ${data.phone}`
    )
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 800, bottom: 800, left: 850, right: 850 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = data.childName.trim().replace(/\s+/g, '-') || 'report';
  triggerBlobDownload(blob, `تقرير-${safeName}-${language}.docx`);
}

export function exportReportToExcel(
  data: ReportData,
  visibility: SectionVisibility,
  language: ReportLanguage,
  extras?: ReportExtras
): void {
  const isRtl = language === 'ar';
  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: isRtl }] };

  const overviewRows: (string | number)[][] = [
    [isRtl ? 'البند' : 'Field', isRtl ? 'القيمة' : 'Value'],
    [isRtl ? 'المركز' : 'Center', `${data.centerName} - ${data.centerCity}`],
    [isRtl ? 'المدير الفني' : 'Technical Director', data.directorName],
    [isRtl ? 'الصفة المهنية' : 'Title', data.directorRole],
    [isRtl ? 'الهاتف' : 'Phone', data.phone],
    [isRtl ? 'رقم المرجع' : 'Reference', data.referenceNumber],
    [isRtl ? 'تاريخ التقرير' : 'Date', data.reportDate],
    [isRtl ? 'الجهة الموجه إليها' : 'Addressed To', data.schoolAddressee],
    [isRtl ? 'عنوان التقرير' : 'Report Title', data.reportTitle],
    [isRtl ? 'الغرض' : 'Subtitle', data.reportSubtitle],
  ];

  if (visibility.personal) {
    overviewRows.push(
      [isRtl ? 'اسم الطفل' : 'Child Name', data.childName],
      [isRtl ? 'تاريخ الميلاد' : 'Date of Birth', data.birthDate],
      [isRtl ? 'العمر' : 'Age', data.age],
      [isRtl ? 'التشخيص المذكور' : 'Reported Diagnosis', data.diagnosis]
    );
  }

  if (visibility.background) {
    overviewRows.push(
      [isRtl ? 'الخلفية النمائية (1)' : 'Background (1)', data.backgroundParagraph1],
      [isRtl ? 'الخلفية النمائية (2)' : 'Background (2)', data.backgroundParagraph2]
    );
  }

  if (visibility.opinion) {
    overviewRows.push(
      [isRtl ? 'الرأي المهني (1)' : 'Professional Opinion (1)', data.opinionParagraph1],
      [isRtl ? 'الرأي المهني (2)' : 'Professional Opinion (2)', data.opinionParagraph2],
      [isRtl ? 'الرأي المهني (3)' : 'Professional Opinion (3)', data.opinionParagraph3],
      [isRtl ? 'الهدف الأساسي' : 'Core Goal', data.coreGoalQuote]
    );
  }

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 28 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(
    wb,
    wsOverview,
    isRtl ? 'بيانات الحالة والتقرير' : 'Case Overview'
  );

  const itemsRows: (string | number)[][] = [
    [
      isRtl ? 'م' : '#',
      isRtl ? 'القسم' : 'Section',
      isRtl ? 'البند / التوصية' : 'Item / Recommendation',
      isRtl ? 'الحالة' : 'Status',
    ],
  ];

  let seq = 1;
  if (visibility.environment) {
    itemsRows.push([
      seq++,
      isRtl ? 'البيئة الهادئة والمنظمة' : 'Calm Structured Environment',
      data.envPositive,
      isRtl ? 'داعم للتعلم' : 'Supportive',
    ]);
    data.envNegativePoints.forEach((pt) => {
      itemsRows.push([
        seq++,
        isRtl ? 'تأثير البيئة المزدحمة' : 'Overstimulating Environment Risk',
        pt,
        isRtl ? 'تحدي بيئي' : 'Risk Factor',
      ]);
    });
  }

  if (visibility.homeSchool) {
    data.homeSchoolBenefits.forEach((item) => {
      itemsRows.push([
        seq++,
        isRtl ? 'مزايا التعليم المنزلي / الترتيبات' : 'Structured / Home Schooling Benefit',
        item,
        isRtl ? 'مُدرج بالتقرير' : 'Included',
      ]);
    });
  }

  if (visibility.recommendations) {
    data.recommendations.forEach((rec) => {
      itemsRows.push([
        seq++,
        isRtl ? 'التوصيات التعليمية' : 'Educational Recommendation',
        rec,
        isRtl ? 'توصية معتمدة' : 'Recommended',
      ]);
    });
  }

  if (extras && extras.extrasVisibility.behaviorTechniques && extras.selectedBehaviorTechniques.length > 0) {
    itemsRows.push([
      seq++,
      isRtl ? 'فنيات تعديل السلوك' : 'Behavior Techniques',
      extras.selectedBehaviorTechniques.join(' · '),
      isRtl ? 'مُدرج بالتقرير' : 'Included',
    ]);
  }

  const wsItems = XLSX.utils.aoa_to_sheet(itemsRows);
  wsItems['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 76 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(
    wb,
    wsItems,
    isRtl ? 'التحليل والتوصيات' : 'Matrix & Recommendations'
  );

  if (extras && (extras.planGoals.length > 0 || extras.selectedEvaluationForms.length > 0 || extras.tables.length > 0)) {
    const extraSheetRows: (string | number)[][] = [
      [isRtl ? 'القسم' : 'Section', isRtl ? 'البند' : 'Item', isRtl ? 'التفاصيل' : 'Details', isRtl ? 'ملاحظات' : 'Notes'],
    ];
    extras.planGoals.forEach((g) => {
      extraSheetRows.push([
        isRtl ? 'خطة الأهداف' : 'Plan Goal',
        g.goal,
        `${g.targetDuration} · ${g.owner}`,
        g.progress,
      ]);
    });
    extras.selectedEvaluationForms.forEach((form) => {
      form.fields.forEach((fld) => {
        extraSheetRows.push([form.title, fld.label, fld.value, '']);
      });
    });
    extras.tables.forEach((tbl) => {
      tbl.rows.forEach((r) => {
        extraSheetRows.push([tbl.title, r[0] || '', r[1] || '', r[2] || '']);
      });
    });
    const wsExtras = XLSX.utils.aoa_to_sheet(extraSheetRows);
    wsExtras['!cols'] = [{ wch: 24 }, { wch: 34 }, { wch: 40 }, { wch: 26 }];
    XLSX.utils.book_append_sheet(
      wb,
      wsExtras,
      isRtl ? 'الخطة والاستمارات' : 'Plan & Forms'
    );
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const safeName = data.childName.trim().replace(/\s+/g, '-') || 'report';
  triggerBlobDownload(blob, `تقرير-${safeName}-${language}.xlsx`);
}
