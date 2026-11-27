import { INITIAL_LIBRARY_CARDS_81 } from '../data/libraryCards81';
import {
  LIBRARY_FOLDERS,
  LibraryCard,
  LibraryCategory,
  LibraryCondition,
  LibraryFolderId,
  ParentReport15Document,
} from '../types/library';
import { copyTextToClipboard } from './storageAndBackup';

const LS_LIBRARY_CUSTOM_KEY = 'shamel_library_custom_cards_v1';
const LS_LIBRARY_PINNED_KEY = 'shamel_library_pinned_ids_v1';
const LS_LIBRARY_BACKUP_KEY = 'shamel_pre_upgrade_backup_v1';
const LS_PARENT_REPORTS_KEY = 'shamel_verified_parent_reports_v1';

export interface LibraryAutoBackupSnapshot {
  id: string;
  createdAt: string;
  label: string;
  customCards: LibraryCard[];
  pinnedIds: string[];
  parentReports: ParentReport15Document[];
  totalCardsCount: number;
}

export function loadPinnedIds(): string[] {
  try {
    const raw = localStorage.getItem(LS_LIBRARY_PINNED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePinnedIds(ids: string[]): void {
  localStorage.setItem(LS_LIBRARY_PINNED_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export function loadCustomLibraryCards(): LibraryCard[] {
  try {
    const raw = localStorage.getItem(LS_LIBRARY_CUSTOM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomLibraryCards(cards: LibraryCard[]): void {
  localStorage.setItem(LS_LIBRARY_CUSTOM_KEY, JSON.stringify(cards));
}

export function loadMergedLibraryCards(): LibraryCard[] {
  const pinnedSet = new Set(loadPinnedIds());
  const custom = loadCustomLibraryCards();
  const baseIds = new Set(INITIAL_LIBRARY_CARDS_81.map((c) => c.id));
  const customMap = new Map(custom.map((c) => [c.id, c]));

  const mergedBase = INITIAL_LIBRARY_CARDS_81.map((c) => {
    const override = customMap.get(c.id);
    const card = override ? { ...c, ...override } : { ...c };
    return { ...card, pinned: pinnedSet.has(card.id) };
  });

  const extraAdded = custom
    .filter((c) => !baseIds.has(c.id))
    .map((c) => ({ ...c, pinned: pinnedSet.has(c.id) }));

  return [...extraAdded, ...mergedBase];
}

export function loadSavedParentReports(): ParentReport15Document[] {
  try {
    const raw = localStorage.getItem(LS_PARENT_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedParentReports(list: ParentReport15Document[]): void {
  localStorage.setItem(LS_PARENT_REPORTS_KEY, JSON.stringify(list.slice(0, 60)));
}

export function createAutomaticBackupSnapshot(label = 'نسخة احتياطية تلقائية'): LibraryAutoBackupSnapshot {
  const customCards = loadCustomLibraryCards();
  const pinnedIds = loadPinnedIds();
  const parentReports = loadSavedParentReports();
  const snapshot: LibraryAutoBackupSnapshot = {
    id: `bak-${Date.now()}`,
    createdAt: new Date().toISOString(),
    label,
    customCards,
    pinnedIds,
    parentReports,
    totalCardsCount: loadMergedLibraryCards().length,
  };
  try {
    const existingRaw = localStorage.getItem(LS_LIBRARY_BACKUP_KEY);
    const existing: LibraryAutoBackupSnapshot[] = existingRaw ? JSON.parse(existingRaw) : [];
    const next = [snapshot, ...(Array.isArray(existing) ? existing : [])].slice(0, 12);
    localStorage.setItem(LS_LIBRARY_BACKUP_KEY, JSON.stringify(next));
  } catch {
    localStorage.setItem(LS_LIBRARY_BACKUP_KEY, JSON.stringify([snapshot]));
  }
  return snapshot;
}

export function ensureInitialPreUpgradeBackup(): LibraryAutoBackupSnapshot {
  try {
    const raw = localStorage.getItem(LS_LIBRARY_BACKUP_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0];
    }
  } catch {
    // create fresh
  }
  return createAutomaticBackupSnapshot('النسخة الاحتياطية الأولية التلقائية (قبل الإضافة)');
}

export function loadAutoBackupsList(): LibraryAutoBackupSnapshot[] {
  try {
    const raw = localStorage.getItem(LS_LIBRARY_BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function restoreBackupSnapshotById(backupId?: string): {
  restored: boolean;
  cards: LibraryCard[];
  pinnedIds: string[];
  parentReports: ParentReport15Document[];
  snapshotLabel: string;
} {
  const list = loadAutoBackupsList();
  if (list.length === 0) {
    return {
      restored: false,
      cards: loadMergedLibraryCards(),
      pinnedIds: loadPinnedIds(),
      parentReports: loadSavedParentReports(),
      snapshotLabel: '',
    };
  }
  const target = backupId ? list.find((b) => b.id === backupId) || list[0] : list[0];
  saveCustomLibraryCards(target.customCards || []);
  savePinnedIds(target.pinnedIds || []);
  persistSavedParentReports(target.parentReports || []);
  return {
    restored: true,
    cards: loadMergedLibraryCards(),
    pinnedIds: target.pinnedIds || [],
    parentReports: target.parentReports || [],
    snapshotLabel: target.label,
  };
}

export function cardFullSearchBlob(card: LibraryCard): string {
  return [
    card.id,
    card.title,
    card.category,
    card.condition,
    card.folder,
    card.ageRange,
    card.definition,
    ...card.symptoms,
    ...card.causes,
    ...card.differential,
    ...card.goals,
    ...card.goalsSMART,
    ...card.activities.flatMap((a) => [a.name, a.tools, ...a.steps, a.duration, a.success]),
    ...card.recommendationsFamily,
    ...card.recommendationsSchool,
    ...card.recommendationsSpecialist,
    card.measurement,
    ...card.keywords,
    card.source,
  ]
    .join(' ')
    .toLowerCase();
}

export function searchAndFilterLibraryCards(
  cards: LibraryCard[],
  opts: {
    query?: string;
    category?: 'الكل' | LibraryCategory;
    condition?: 'الكل' | LibraryCondition;
    folder?: 'all' | LibraryFolderId;
    pinnedOnly?: boolean;
  }
): LibraryCard[] {
  const q = (opts.query || '').trim().toLowerCase();
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

  return cards.filter((card) => {
    if (opts.pinnedOnly && !card.pinned) return false;
    if (opts.category && opts.category !== 'الكل' && card.category !== opts.category) return false;
    if (opts.condition && opts.condition !== 'الكل' && card.condition !== opts.condition) return false;
    if (opts.folder && opts.folder !== 'all' && card.folder !== opts.folder) return false;

    if (tokens.length > 0) {
      const blob = cardFullSearchBlob(card);
      return tokens.every((tok) => blob.includes(tok));
    }
    return true;
  });
}

// =========================================================================
// Colloquial Egyptian/Arabic Synonyms + Red Flag Detector + Top-5 Scoring
// =========================================================================
const COLLOQUIAL_SYNONYMS: [RegExp, string[]][] = [
  [
    /(شقي|بيتحرك كتير|مبيقعدش|ما بيقعدش|مبهدل الدنيا|طالع نازل|هايبر|عفريت|نشيط زيادة|فرك)/g,
    ['ADHD', 'فرط حركة', 'تشتت انتباه', 'اندفاعية', 'روتين'],
  ],
  [
    /(سرحان|بينسى|نساي|مشتت|تركيزه ضعيف|مش مركز|تايه|بيفقد حاجاته)/g,
    ['نقص انتباه', 'ADHD', 'ذاكرة عاملة', 'تشتت'],
  ],
  [
    /(مش بيتكلم|مبيتكلمش|متأخر في الكلام|لسه مبيقولش|كلامه قليل|بيشاور بس|سحب الإيد)/g,
    ['تأخر لغوي', 'تخاطب', 'بناء جملة', 'تحفيز كلام'],
  ],
  [
    /(لدغة|بيلدغ|بيقول الراء|بينطق غلط|كلامه مش واضح|مكسر|تأتأة|بيتأتأ|بيتهته)/g,
    ['لدغة', 'مخارج حروف', 'تلعثم', 'تأتأة', 'تخاطب'],
  ],
  [
    /(مش بيعرف يقرأ|مبيعرفش يقرأ|بيغلط في الإملاء|خطه وحش|بيعكس الحروف|ديسلكسيا|حساب صعب)/g,
    ['ديسلكسيا', 'عسر قراءة', 'عسر كتابة', 'عسر حساب', 'صعوبات تعلم', 'وعي صوتي'],
  ],
  [
    /(بيرفرف|بيبصش في العين|مبيبصش|منعزل|مبيلعبش مع حد|روتيني|بيصطف الألعاب|انطوائي|مبيردش على اسمه)/g,
    ['توحد', 'طيف توحد', 'تواصل بصري', 'تواصل بديل', 'PECS'],
  ],
  [
    /(بيسد ودانه|بيخاف من الصوت|خلاط|مكنسة|ملمس اللبس|مبيأكلش إلا|انتقائي في الأكل|حساس)/g,
    ['تكامل حسي', 'حساسية سمعية', 'انهيار حسي', 'انتقائية طعام'],
  ],
  [
    /(خايف|قلقان|مبيعرفش ينام لوحده|بيعيط الصبح|مش عايز يروح المدرسة|متوتر|مكسوف|ساكت في المدرسة)/g,
    ['قلق', 'قلق انفصال', 'قلق عام', 'صمت اختياري', 'مخاوف نوم'],
  ],
  [
    /(بيغسل ايده كتير|بيعيد الحاجة|وسواس|بيعد|ترتيب بزيادة|أفكار غريبة|طقوس)/g,
    ['وسواس', 'وسواس قهري', 'OCD', 'ERP'],
  ],
  [
    /(عصبي|بيعند|عنيد|بيضرب|بيعض|بيرمي نفسه|نوبة غضب|بيصوت|زعيق)/g,
    ['تعديل سلوك', 'نوبات غضب', 'عناد', 'عدوان', 'تعزيز إيجابي'],
  ],
  [
    /(موبايل|شاشات|تلفزيون|يوتيوب|ألعاب طول اليوم)/g,
    ['شاشات', 'انتباه', 'نطق'],
  ],
];

const RED_FLAG_PATTERNS: { pattern: RegExp; warning: string }[] = [
  {
    pattern: /(انتحار|يموت نفسه|ينتحر|إيذاء نفس|يأذي نفس|بيأذي نفس|يعور نفسه|بيعور نفسه|يجرح نفسه|بيجرح نفسه|يضرب دماغه|بيخبط راسه)/i,
    warning: 'مؤشر خطر عاجل: ذكر سلوك إيذاء النفس أو أفكار خطيرة — يلزم تقييم طبي ونفسي طارئ فوراً وإبلاغ ولي الأمر.',
  },
  {
    pattern: /(تشنج|تشنجات|صرع|بيغيب عن الوعي|سرحان مع إغماء|سقوط مفاجئ)/i,
    warning: 'مؤشر طبي عاجل: الاشتباه في نوبات تشنج أو فقدان وعي — يلزم تحويل فوري لطبيب المخ والأعصاب للأطفال.',
  },
  {
    pattern: /(فقد الكلام فجأة|كان بيتكلم وسكت|انتكاس|فقد مهاراته|تراجع مفاجئ)/i,
    warning: 'مؤشر خطر نمائي: فقدان مهارات مكتسبة سابقاً يستوجب فحصاً طبياً وسمعياً وعصبياً عاجلاً قبل الاكتفاء بالتدريب.',
  },
  {
    pattern: /(لا يسمع|مبيسمعش|لا يلتفت للأصوات العالية|حول مفاجئ|فقد بصر)/i,
    warning: 'تنبيه حسي طبي: يلزم إجراء فحص سمعي أو بصري طبي متخصص أولاً لاستبعاد أي قصور عضوي.',
  },
];

export interface AssistantCardMatch {
  card: LibraryCard;
  score: number;
  matchedTerms: string[];
}

export interface AssistantAnalysisResult {
  expandedKeywords: string[];
  redFlags: string[];
  top5: AssistantCardMatch[];
  suggestedCondition: LibraryCondition;
  summaryProfessional: string;
  summarySimplified: string;
  goalsSMART: string[];
  activitiesSummary: string[];
  recommendationsFamily: string[];
  recommendationsSchool: string[];
  recommendationsSpecialist: string[];
}

export function analyzeComplaintLocally(
  rawComplaint: string,
  cards: LibraryCard[]
): AssistantAnalysisResult {
  const input = (rawComplaint || '').trim();
  const expanded = new Set<string>();

  input
    .split(/[\s،,.;:!?()]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2)
    .forEach((w) => expanded.add(w));

  COLLOQUIAL_SYNONYMS.forEach(([re, synonyms]) => {
    re.lastIndex = 0;
    if (re.test(input)) {
      synonyms.forEach((s) => expanded.add(s.toLowerCase()));
    }
  });

  const redFlags = RED_FLAG_PATTERNS.filter((rf) => rf.pattern.test(input)).map(
    (rf) => rf.warning
  );

  const expandedList = Array.from(expanded);

  const scored: AssistantCardMatch[] = cards
    .map((card) => {
      const titleLower = card.title.toLowerCase();
      const kwLower = card.keywords.map((k) => k.toLowerCase());
      const blob = cardFullSearchBlob(card);

      let points = 0;
      const matchedTerms: string[] = [];

      expandedList.forEach((term) => {
        if (titleLower.includes(term)) {
          points += 24;
          matchedTerms.push(term);
        } else if (kwLower.some((k) => k.includes(term) || term.includes(k))) {
          points += 18;
          matchedTerms.push(term);
        } else if (blob.includes(term)) {
          points += 7;
          matchedTerms.push(term);
        }
      });

      const score = Math.min(98, Math.max(points > 0 ? 18 : 0, Math.round(points * 1.15)));
      return {
        card,
        score,
        matchedTerms: Array.from(new Set(matchedTerms)).slice(0, 6),
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  const top5 =
    scored.length > 0
      ? scored.slice(0, 5)
      : cards.slice(0, 5).map((card, i) => ({
          card,
          score: 35 - i * 4,
          matchedTerms: [],
        }));

  const primary = top5[0].card;

  return {
    expandedKeywords: expandedList.slice(0, 14),
    redFlags,
    top5,
    suggestedCondition: primary.condition,
    summaryProfessional: `انطباع تقييمي مبدئي موجّه (غير دوائي): تشير المعطيات السلوكية إلى تقاطع أعلى مع محور "${primary.title}" (${primary.condition} - توافق ${top5[0].score}%). يوصى بالتحقق الميداني عبر ${primary.measurement}`,
    summarySimplified: `ببساطة يا ولي الأمر: أكثر ما يناسب الملاحظات المكتوبة هو محور "${primary.title}". الخطوة العملية الأولى تبدأ بتقسيم المطلوب لخطوات صغيرة واضحة، وتهدئة المحيط، وتطبيق الأنشطة اليومية البسيطة أدناه مع المتابعة الدورية بالأخصائي.`,
    goalsSMART: Array.from(new Set(top5.slice(0, 3).flatMap((m) => m.card.goalsSMART))).slice(0, 5),
    activitiesSummary: top5
      .slice(0, 3)
      .flatMap((m) =>
        m.card.activities.map((a) => `${a.name} (${a.duration}): ${a.steps.join(' ← ')}`)
      )
      .slice(0, 4),
    recommendationsFamily: Array.from(
      new Set(top5.slice(0, 3).flatMap((m) => m.card.recommendationsFamily))
    ).slice(0, 5),
    recommendationsSchool: Array.from(
      new Set(top5.slice(0, 3).flatMap((m) => m.card.recommendationsSchool))
    ).slice(0, 5),
    recommendationsSpecialist: Array.from(
      new Set(top5.slice(0, 3).flatMap((m) => m.card.recommendationsSpecialist))
    ).slice(0, 5),
  };
}

// =========================================================================
// Text Formatting & Extraction Helpers per Card
// =========================================================================
export function formatCardAsText(card: LibraryCard): string {
  return [
    `📌 ${card.title} [${card.category} · ${card.condition}]`,
    `الفئة العمرية: ${card.ageRange}`,
    `التعريف: ${card.definition}`,
    '',
    '• الأعراض والمؤشرات:',
    ...card.symptoms.map((s) => `  - ${s}`),
    '',
    '• الأسباب المحتملة:',
    ...card.causes.map((c) => `  - ${c}`),
    '',
    '• الأهداف الذكية (SMART):',
    ...card.goalsSMART.map((g, i) => `  ${i + 1}. ${g}`),
    '',
    '• الأنشطة التطبيقية:',
    ...card.activities.map(
      (a) =>
        `  - ${a.name} (${a.duration}) | الأدوات: ${a.tools} | الخطوات: ${a.steps.join(' ← ')} | النجاح: ${a.success}`
    ),
    '',
    '• توصيات الأسرة:',
    ...card.recommendationsFamily.map((r) => `  - ${r}`),
    '• توصيات المدرسة:',
    ...card.recommendationsSchool.map((r) => `  - ${r}`),
    '• توصيات الأخصائي:',
    ...card.recommendationsSpecialist.map((r) => `  - ${r}`),
    '',
    `القياس: ${card.measurement}`,
    `المصدر: ${card.source}`,
  ].join('\n');
}

export function extractGoalsOnlyText(card: LibraryCard): string {
  return [
    `🎯 أهداف (${card.title}):`,
    ...card.goals.map((g) => `• ${g}`),
    '',
    'أهداف SMART:',
    ...card.goalsSMART.map((g, i) => `${i + 1}. ${g}`),
  ].join('\n');
}

export function extractActivitiesOnlyText(card: LibraryCard): string {
  return [
    `🧩 أنشطة (${card.title}):`,
    ...card.activities.map(
      (a, i) =>
        `${i + 1}. ${a.name} (${a.duration})\n   الأدوات: ${a.tools}\n   الخطوات: ${a.steps.join(' ← ')}\n   معيار النجاح: ${a.success}`
    ),
  ].join('\n\n');
}

export function extractRecommendationsOnlyText(card: LibraryCard): string {
  return [
    `📝 توصيات (${card.title}):`,
    'للأسرة:',
    ...card.recommendationsFamily.map((r) => `• ${r}`),
    'للمدرسة:',
    ...card.recommendationsSchool.map((r) => `• ${r}`),
    'للأخصائي:',
    ...card.recommendationsSpecialist.map((r) => `• ${r}`),
  ].join('\n');
}

// =========================================================================
// Export JSON / Folder HTML / Standalone Portable Single-File HTML
// =========================================================================
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function esc(val: string): string {
  return String(val || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function exportLibraryToJson(cards: LibraryCard[], filename = 'smart-library-cards'): void {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    count: cards.length,
    cards,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerDownload(blob, `${filename}-${cards.length}.json`);
}

export function parseImportedLibraryJson(rawText: string): LibraryCard[] {
  const parsed = JSON.parse(rawText);
  const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.cards) ? parsed.cards : null;
  if (!arr) {
    throw new Error('صيغة ملف JSON غير صالحة للمكتبة.');
  }
  return arr
    .filter((item: unknown) => item && typeof item === 'object' && (item as LibraryCard).title)
    .map((rawItem: LibraryCard, idx: number) => ({
      id: rawItem.id || `imp-lib-${Date.now()}-${idx}`,
      title: String(rawItem.title),
      category: rawItem.category || 'حالة',
      condition: rawItem.condition || 'كل الحالات',
      folder: rawItem.folder || 'awareness',
      ageRange: rawItem.ageRange || '3 - 14 سنة',
      definition: rawItem.definition || '[ ... ]',
      symptoms: Array.isArray(rawItem.symptoms) ? rawItem.symptoms : [],
      causes: Array.isArray(rawItem.causes) ? rawItem.causes : [],
      differential: Array.isArray(rawItem.differential) ? rawItem.differential : [],
      goals: Array.isArray(rawItem.goals) ? rawItem.goals : [],
      goalsSMART: Array.isArray(rawItem.goalsSMART) ? rawItem.goalsSMART : [],
      activities: Array.isArray(rawItem.activities) ? rawItem.activities : [],
      recommendationsFamily: Array.isArray(rawItem.recommendationsFamily)
        ? rawItem.recommendationsFamily
        : [],
      recommendationsSchool: Array.isArray(rawItem.recommendationsSchool)
        ? rawItem.recommendationsSchool
        : [],
      recommendationsSpecialist: Array.isArray(rawItem.recommendationsSpecialist)
        ? rawItem.recommendationsSpecialist
        : [],
      measurement: rawItem.measurement || '[ ... ]',
      keywords: Array.isArray(rawItem.keywords) ? rawItem.keywords : [],
      relatedIds: Array.isArray(rawItem.relatedIds) ? rawItem.relatedIds : [],
      source: rawItem.source || 'بطاقة مستوردة',
      image: rawItem.image,
      pinned: Boolean(rawItem.pinned),
      createdAt: rawItem.createdAt || new Date().toISOString().slice(0, 10),
    }));
}

export function exportFolderCardsToHtml(
  folderId: LibraryFolderId,
  cards: LibraryCard[]
): void {
  const meta = LIBRARY_FOLDERS.find((f) => f.id === folderId);
  const folderCards = cards.filter((c) => c.folder === folderId);
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>${esc(meta?.title || folderId)}</title>
  <style>body{font-family:Tahoma,Arial,sans-serif;background:#F8FAFC;color:#0F172A;padding:24px;line-height:1.7}
  .cover{background:#0A1633;color:#fff;padding:20px;border-radius:12px;margin-bottom:20px}
  .card{background:#fff;border:1px solid #CBD5E1;border-radius:10px;padding:16px;margin-bottom:14px}
  h2{margin:0 0 8px;color:#1E3A8A;font-size:17px} .badge{display:inline-block;background:#EFF6FF;color:#1D4ED8;padding:2px 8px;border-radius:6px;font-size:12px;margin-left:6px}</style></head>
  <body><div class="cover"><h1>ملف تخصص: ${esc(meta?.title || folderId)} (${folderCards.length} بطاقة)</h1><p>${esc(meta?.subtitle || '')}</p></div>
  ${folderCards
    .map(
      (c) => `<div class="card"><h2>${esc(c.title)}</h2><div><span class="badge">${esc(c.category)}</span><span class="badge">${esc(c.condition)}</span><span class="badge">${esc(c.ageRange)}</span></div>
      <p><strong>التعريف:</strong> ${esc(c.definition)}</p>
      <p><strong>الأهداف الذكية:</strong> ${c.goalsSMART.map(esc).join(' · ')}</p>
      <p><strong>توصيات الأسرة والمدرسة:</strong> ${[...c.recommendationsFamily, ...c.recommendationsSchool].map(esc).join(' · ')}</p>
      <small>المصدر: ${esc(c.source)}</small></div>`
    )
    .join('')}</body></html>`;

  triggerDownload(
    new Blob([html], { type: 'text/html;charset=utf-8' }),
    `ملف-${meta?.title || folderId}-${folderCards.length}.html`
  );
}

export function exportPortableSingleFileHtml(cards: LibraryCard[]): void {
  const safeJson = JSON.stringify(cards).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>المكتبة الذكية (${cards.length} بطاقة) - نسخة ملف واحد</title>
  <style>body{font-family:Tahoma,Arial,sans-serif;background:#F3F4F6;color:#0F172A;margin:0;padding:20px;line-height:1.6}
  .top{background:#0A1633;color:#fff;padding:18px;border-radius:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
  input,select{padding:8px 12px;border-radius:8px;border:1px solid #CBD5E1;font-size:13px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
  .card{background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:14px}
  .card h3{margin:0 0 6px;color:#1E3A8A;font-size:15px}
  .tag{display:inline-block;background:#EFF6FF;color:#1D4ED8;padding:2px 8px;border-radius:6px;font-size:11px;margin:2px}</style></head>
  <body><div class="top"><div><strong>📚 المكتبة الذكية التفاعلية المستقلة — <span id="cnt">${cards.length}</span> بطاقة</strong></div>
  <div><input id="q" placeholder="ابحث في كل البطاقات..." oninput="renderLibrary()"/></div></div>
  <div id="grid" class="grid"></div>
  <script>
  window.libraryCards = ${safeJson};
  function renderLibrary(){
    var q = (document.getElementById('q').value||'').trim().toLowerCase();
    var list = window.libraryCards.filter(function(c){ return !q || JSON.stringify(c).toLowerCase().indexOf(q) !== -1; });
    document.getElementById('cnt').textContent = list.length;
    document.getElementById('grid').innerHTML = list.map(function(c){
      return '<div class="card"><h3>'+c.title+'</h3><span class="tag">'+c.category+'</span><span class="tag">'+c.condition+'</span><p>'+c.definition+'</p><small>'+c.source+'</small></div>';
    }).join('');
  }
  window.renderLibrary = renderLibrary;
  renderLibrary();
  </script></body></html>`;

  triggerDownload(
    new Blob([html], { type: 'text/html;charset=utf-8' }),
    `المكتبة-الذكية-ملف-واحد-${cards.length}.html`
  );
}

// =========================================================================
// Required Global Compatibility Bridge (libraryCards, openLibrary, renderLibrary, openCard, copyCard, togglePin)
// =========================================================================
export interface WindowLibraryBridgeCallbacks {
  libraryCards: LibraryCard[];
  openLibrary: () => void;
  renderLibrary: () => void;
  openCard: (id: string) => void;
  copyCard: (id: string) => Promise<boolean>;
  togglePin: (id: string) => void;
}

declare global {
  interface Window {
    libraryCards?: LibraryCard[];
    openLibrary?: () => void;
    renderLibrary?: () => void;
    openCard?: (id: string) => void;
    copyCard?: (id: string) => Promise<boolean>;
    togglePin?: (id: string) => void;
  }
}

export function registerWindowLibraryBridge(cb: WindowLibraryBridgeCallbacks): void {
  if (typeof window === 'undefined') return;
  window.libraryCards = cb.libraryCards;
  window.openLibrary = cb.openLibrary;
  window.renderLibrary = cb.renderLibrary;
  window.openCard = cb.openCard;
  window.copyCard = cb.copyCard;
  window.togglePin = cb.togglePin;
}

export async function copyCardByIdHelper(
  id: string,
  cards: LibraryCard[]
): Promise<boolean> {
  const found = cards.find((c) => c.id === id);
  if (!found) return false;
  return copyTextToClipboard(formatCardAsText(found));
}
