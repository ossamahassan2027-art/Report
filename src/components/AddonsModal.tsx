import React, { useEffect, useState } from 'react';
import {
  Bell,
  CalendarDays,
  Check,
  ClipboardCheck,
  Copy,
  FileCheck2,
  FilePlus2,
  LayoutGrid,
  Link2,
  ListChecks,
  Plus,
  Printer,
  Send,
  Settings,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { ReportData } from '../types/report';
import {
  ADDON_CATALOG,
  ADDON_CATEGORIES,
  AddonCategoryId,
  AddonsSettings,
  ContactSettings,
  CustomCardItem,
  EvaluationFormEntry,
  LightThemeDefinition,
  ReportExtras,
  SidebarSectionId,
  WeeklyTaskItem,
} from '../types/studio';
import { copyTextToClipboard } from '../utils/storageAndBackup';

interface AddonsModalProps {
  open: boolean;
  onClose: () => void;
  theme: LightThemeDefinition;
  buttonRadiusClass: string;
  addonsSettings: AddonsSettings;
  data: ReportData;
  extras: ReportExtras;
  contactSettings: ContactSettings;

  onNavigateSectionTab: (section: SidebarSectionId, tab?: string) => void;
  onOpenNewReport: () => void;
  onOpenComplaintEditor: () => void;
  onSwitchToInfographic: () => void;
  onOpenSpecialtyForm: (category: EvaluationFormEntry['category']) => void;
  onExportPdf: () => void;
  onAddCustomCard: (card: CustomCardItem) => void;
  onAddWeeklyTask: (task: WeeklyTaskItem) => void;
  onNotify: (msg: string) => void;
}

type InlineAddonForm =
  | null
  | 'send-schedule'
  | 'send-reminder'
  | 'custom-card'
  | 'add-task'
  | 'add-section';

export const AddonsModal: React.FC<AddonsModalProps> = ({
  open,
  onClose,
  theme,
  buttonRadiusClass,
  addonsSettings,
  data,
  extras,
  contactSettings,
  onNavigateSectionTab,
  onOpenNewReport,
  onOpenComplaintEditor,
  onSwitchToInfographic,
  onOpenSpecialtyForm,
  onExportPdf,
  onAddCustomCard,
  onAddWeeklyTask,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<AddonCategoryId>('quick');
  const [inlineForm, setInlineForm] = useState<InlineAddonForm>(null);

  // Custom Card / New Section fields
  const [cardTitle, setCardTitle] = useState('');
  const [cardBody, setCardBody] = useState('');

  // Add Task fields
  const [taskDay, setTaskDay] = useState('الأحد');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskOwner, setTaskOwner] = useState('ولي الأمر / الأخصائي');
  const [taskStatus, setTaskStatus] = useState('مجدول');

  // Reminder draft
  const [reminderText, setReminderText] = useState('');

  useEffect(() => {
    if (!open) return;
    setInlineForm(null);
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

  const visibleItems = ADDON_CATALOG.filter(
    (item) =>
      item.category === activeTab && addonsSettings.visibleIds.includes(item.id)
  );

  const buildScheduleShareText = () => {
    const tasks = extras.weeklyTasks || [];
    if (tasks.length === 0) {
      return `جدول المهام الأسبوعي للحالة: ${data.childName}\nلا توجد مهام مضافة حتى الآن — يمكنك إضافة مهام من تبويب «جدول مهام» أو «إضافة مهمة».\nللتواصل: ${contactSettings.phone}`;
    }
    const lines = tasks.map(
      (t, i) => `${i + 1}. [${t.day}] ${t.task} — (${t.owner}) [${t.status}]`
    );
    return `جدول المهام الأسبوعي للحالة: ${data.childName}\n${lines.join('\n')}\n— ${data.centerName} · هاتف: ${contactSettings.phone}`;
  };

  const handleTriggerAddon = async (id: string) => {
    switch (id) {
      case 'new-report':
        onClose();
        onOpenNewReport();
        break;
      case 'cv-builder':
        onClose();
        onNavigateSectionTab('cv', 'editor');
        break;
      case 'weekly-tasks':
        onClose();
        onNavigateSectionTab('dashboard', 'tasks');
        break;
      case 'comprehensive-eval':
        onClose();
        onNavigateSectionTab('evaluations', 'comprehensive');
        break;
      case 'gen-plan':
        onClose();
        onNavigateSectionTab('plan', 'create');
        break;
      case 'gen-recommendations':
        onClose();
        onNavigateSectionTab('recommendations', 'school');
        break;
      case 'gen-report':
        onClose();
        onOpenComplaintEditor();
        break;
      case 'gen-infographic':
        onClose();
        onSwitchToInfographic();
        break;
      case 'form-speech':
        onClose();
        onOpenSpecialtyForm('speech');
        break;
      case 'form-behavior':
        onClose();
        onOpenSpecialtyForm('behavior');
        break;
      case 'form-sensory':
        onClose();
        onOpenSpecialtyForm('sensory');
        break;
      case 'form-learning':
        onClose();
        onOpenSpecialtyForm('learning');
        break;
      case 'form-iq':
        onClose();
        onOpenSpecialtyForm('iq');
        break;
      case 'form-family':
        onClose();
        onOpenSpecialtyForm('family');
        break;
      case 'send-schedule':
        setInlineForm('send-schedule');
        break;
      case 'send-reminder':
        setReminderText(
          `تذكير متابعة للحالة (${data.childName}): يرجى مراجعة التوصيات والخطة المقررة والتواصل عند الحاجة على ${contactSettings.phone}.`
        );
        setInlineForm('send-reminder');
        break;
      case 'export-pdf':
        onClose();
        onExportPdf();
        break;
      case 'copy-link': {
        const ok = await copyTextToClipboard(window.location.href);
        onNotify(ok ? 'تم نسخ رابط البرنامج إلى الحافظة' : 'تعذر نسخ الرابط');
        onClose();
        break;
      }
      case 'custom-card':
        setCardTitle('');
        setCardBody('');
        setInlineForm('custom-card');
        break;
      case 'add-task':
        setTaskDay('الأحد');
        setTaskTitle('');
        setTaskOwner('ولي الأمر / الأخصائي');
        setTaskStatus('مجدول');
        setInlineForm('add-task');
        break;
      case 'add-section':
        setCardTitle('');
        setCardBody('');
        setInlineForm('add-section');
        break;
      default:
        break;
    }
  };

  const renderIconForAddon = (id: string) => {
    if (id === 'new-report') return <FilePlus2 className="w-4 h-4 text-[#059669]" />;
    if (id === 'cv-builder') return <FileCheck2 className="w-4 h-4 text-[#1E3A8A]" />;
    if (id === 'weekly-tasks' || id === 'add-task')
      return <CalendarDays className="w-4 h-4 text-[#2563EB]" />;
    if (id.startsWith('form-') || id === 'comprehensive-eval')
      return <ClipboardCheck className="w-4 h-4 text-[#1D4ED8]" />;
    if (id === 'gen-plan') return <Target className="w-4 h-4 text-[#0F766E]" />;
    if (id === 'gen-recommendations') return <ListChecks className="w-4 h-4 text-[#0F766E]" />;
    if (id === 'gen-report' || id === 'gen-infographic')
      return <Sparkles className="w-4 h-4 text-[#7C3AED]" />;
    if (id === 'send-schedule') return <Send className="w-4 h-4 text-[#2563EB]" />;
    if (id === 'send-reminder') return <Bell className="w-4 h-4 text-[#D97706]" />;
    if (id === 'export-pdf') return <Printer className="w-4 h-4 text-[#4F46E5]" />;
    if (id === 'copy-link') return <Link2 className="w-4 h-4 text-[#0F766E]" />;
    return <Plus className="w-4 h-4 text-[#1E3A8A]" />;
  };

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="إضافات البرنامج السريعة"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto border shadow-2xl ${buttonRadiusClass}`}
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
          color: theme.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b"
          style={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#1E293B' }}
        >
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="w-5 h-5 text-[#60A5FA]" />
            <div>
              <h3 className="font-editorial text-base font-bold">+ إضافات متعددة الاستخدام</h3>
              <p className="text-[11px] text-[#CBD5E1]">
                أدوات وصول سريعة لإدارة التقارير والاستمارات والإرسال والتخصيص
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة الإضافات"
            className={`min-h-[36px] min-w-[36px] flex items-center justify-center border border-[#334155] text-[#CBD5E1] hover:text-white cursor-pointer ${buttonRadiusClass}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5 Smart Tabs */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto px-4 py-2.5 border-b"
          style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}
        >
          {ADDON_CATEGORIES.map((cat) => {
            const active = activeTab === cat.id;
            const countInTab = ADDON_CATALOG.filter(
              (a) => a.category === cat.id && addonsSettings.visibleIds.includes(a.id)
            ).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveTab(cat.id);
                  setInlineForm(null);
                }}
                className={`min-h-[36px] px-3.5 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${buttonRadiusClass}`}
                style={{
                  backgroundColor: active ? '#2563EB' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#1E3A8A',
                  border: active ? '1px solid #2563EB' : '1px solid #BFDBFE',
                }}
              >
                {cat.label} ({countInTab})
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {visibleItems.length === 0 ? (
            <div
              className={`p-5 border text-center space-y-2 ${buttonRadiusClass}`}
              style={{ borderColor: theme.borderColor, backgroundColor: theme.surfaceBg }}
            >
              <p className="font-bold">تم إخفاء جميع عناصر هذا التبويب من الإعدادات.</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateSectionTab('settings', 'addons');
                }}
                className={`min-h-[36px] px-3.5 text-white font-semibold cursor-pointer ${buttonRadiusClass}`}
                style={{ backgroundColor: '#2563EB' }}
              >
                تفعيل العناصر من الإعدادات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTriggerAddon(item.id)}
                  className={`p-3 border text-right flex items-start gap-3 hover:border-[#2563EB] hover:bg-[#EFF6FF]/60 transition-colors cursor-pointer ${buttonRadiusClass}`}
                  style={{
                    borderColor: theme.borderColor,
                    backgroundColor: theme.surfaceBg,
                  }}
                >
                  <div className="p-2 bg-white border border-[#DBEAFE] rounded-lg shrink-0">
                    {renderIconForAddon(item.id)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[#0F172A]">{item.label}</div>
                    <div className="text-[11px] text-[#475569] mt-0.5">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Inline Functional Sub-Forms when needed */}
          {inlineForm === 'send-schedule' && (
            <div
              className={`p-4 border space-y-2.5 ${buttonRadiusClass}`}
              style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}
            >
              <div className="font-bold text-[#1E3A8A]">رسالة جدول المهام للحالة الجاهزة للإرسال:</div>
              <textarea
                rows={4}
                readOnly
                value={buildScheduleShareText()}
                className={`w-full p-2.5 bg-white border border-[#BFDBFE] text-xs ${buttonRadiusClass}`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyTextToClipboard(buildScheduleShareText());
                    onNotify(ok ? 'تم نسخ الجدول للإرسال' : 'تعذر النسخ');
                  }}
                  className={`min-h-[36px] px-4 bg-[#2563EB] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ رسالة الجدول</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateSectionTab('dashboard', 'tasks');
                  }}
                  className={`min-h-[36px] px-3 bg-white border border-[#BFDBFE] text-[#1E3A8A] font-semibold cursor-pointer ${buttonRadiusClass}`}
                >
                  تعديل جدول المهام
                </button>
              </div>
            </div>
          )}

          {inlineForm === 'send-reminder' && (
            <div
              className={`p-4 border space-y-2.5 ${buttonRadiusClass}`}
              style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}
            >
              <div className="font-bold text-[#1E3A8A]">نص التذكير القابل للتعديل والإرسال:</div>
              <textarea
                rows={3}
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                className={`w-full p-2.5 bg-white border border-[#BFDBFE] text-xs ${buttonRadiusClass}`}
              />
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyTextToClipboard(reminderText);
                  onNotify(ok ? 'تم نسخ رسالة التذكير بنجاح' : 'تعذر النسخ');
                }}
                className={`min-h-[36px] px-4 bg-[#2563EB] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ التذكير للإرسال</span>
              </button>
            </div>
          )}

          {(inlineForm === 'custom-card' || inlineForm === 'add-section') && (
            <div
              className={`p-4 border space-y-2.5 ${buttonRadiusClass}`}
              style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}
            >
              <div className="font-bold text-[#1E3A8A]">
                {inlineForm === 'custom-card'
                  ? 'إضافة بطاقة مخصصة إلى التقرير:'
                  : 'إضافة قسم جديد إلى التقرير:'}
              </div>
              <input
                type="text"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                placeholder={
                  inlineForm === 'custom-card'
                    ? 'عنوان البطاقة (مثال: ملاحظات الجلسة الفردية)'
                    : 'عنوان القسم الجديد...'
                }
                className={`w-full min-h-[38px] px-3 bg-white border border-[#BFDBFE] ${buttonRadiusClass}`}
              />
              <textarea
                rows={3}
                value={cardBody}
                onChange={(e) => setCardBody(e.target.value)}
                placeholder="المحتوى النصي (أو اتركه [ ... ] للتعبئة لاحقاً)..."
                className={`w-full p-2.5 bg-white border border-[#BFDBFE] ${buttonRadiusClass}`}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!cardTitle.trim()}
                  onClick={() => {
                    onAddCustomCard({
                      id: `card-${Date.now()}`,
                      title: cardTitle.trim(),
                      body: cardBody.trim() || '[ ... ]',
                    });
                    onClose();
                  }}
                  className={`min-h-[36px] px-4 bg-[#2563EB] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>إدراج في التقرير</span>
                </button>
                {!cardTitle.trim() && (
                  <span className="text-[11px] text-[#475569]">أدخل العنوان أولاً</span>
                )}
              </div>
            </div>
          )}

          {inlineForm === 'add-task' && (
            <div
              className={`p-4 border space-y-2.5 ${buttonRadiusClass}`}
              style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}
            >
              <div className="font-bold text-[#1E3A8A]">إضافة مهمة إلى الجدول الأسبوعي:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={taskDay}
                  onChange={(e) => setTaskDay(e.target.value)}
                  className={`min-h-[38px] px-2.5 bg-white border border-[#BFDBFE] ${buttonRadiusClass}`}
                >
                  {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'يومي'].map(
                    (d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    )
                  )}
                </select>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="وصف المهمة أو النشاط..."
                  className={`min-h-[38px] px-3 bg-white border border-[#BFDBFE] ${buttonRadiusClass}`}
                />
                <input
                  type="text"
                  value={taskOwner}
                  onChange={(e) => setTaskOwner(e.target.value)}
                  placeholder="المسؤول عن التنفيذ..."
                  className={`min-h-[38px] px-3 bg-white border border-[#BFDBFE] ${buttonRadiusClass}`}
                />
                <input
                  type="text"
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  placeholder="الحالة..."
                  className={`min-h-[38px] px-3 bg-white border border-[#BFDBFE] ${buttonRadiusClass}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!taskTitle.trim()}
                  onClick={() => {
                    onAddWeeklyTask({
                      id: `task-${Date.now()}`,
                      day: taskDay,
                      task: taskTitle.trim(),
                      owner: taskOwner.trim() || '[ ... ]',
                      status: taskStatus.trim() || 'مجدول',
                    });
                    onClose();
                    onNavigateSectionTab('dashboard', 'tasks');
                  }}
                  className={`min-h-[36px] px-4 bg-[#2563EB] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة المهمة للجدول</span>
                </button>
                {!taskTitle.trim() && (
                  <span className="text-[11px] text-[#475569]">أدخل وصف المهمة أولاً</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs"
          style={{ backgroundColor: theme.surfaceBg, borderColor: theme.borderColor }}
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateSectionTab('settings', 'addons');
            }}
            className="inline-flex items-center gap-1.5 text-[#2563EB] font-semibold hover:underline cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>إظهار / إخفاء الإضافات من الإعدادات</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className={`min-h-[36px] px-4 border font-semibold cursor-pointer ${buttonRadiusClass}`}
            style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
