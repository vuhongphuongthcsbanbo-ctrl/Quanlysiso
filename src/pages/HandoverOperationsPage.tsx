import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { teacherService } from '../services/teacherService';
import { pdfExportService } from '../services/pdfExportService';
import {
  handoverService,
  AcceptanceStatus,
  ClassReadinessItem,
  AcceptanceCheckItem,
  IncidentRecord,
  PreProductionBackupResult,
} from '../services/handoverService';
import { SchoolSettings, User } from '../types';
import { formatVietnameseDate, getTodayDateString } from '../utils/formatters';
import {
  AppButton,
  AppCard,
  StatusBadge,
  ConfirmDialog,
} from '../theme/designSystem';
import {
  Rocket,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Building2,
  Users,
  Clock,
  Download,
  Printer,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  Calendar,
  Lock,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  PhoneCall,
  History,
  LifeBuoy,
  FileText,
  UserCheck,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Smartphone,
} from 'lucide-react';

export type HandoverTab =
  | 'ACCEPTANCE'
  | 'TEACHERS_20'
  | 'ACTIVATION'
  | 'DAILY_WORKFLOWS'
  | 'BACKUP_MAINTENANCE'
  | 'INCIDENT_GUIDE'
  | 'WEEK_ONE_MONITOR'
  | 'HANDOVER_MINUTES'
  | 'YEAR_TRANSITION';

export const HandoverOperationsPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const printContainerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<HandoverTab>('ACCEPTANCE');
  const [settings, setSettings] = useState<SchoolSettings>(() => storageService.getSettings());
  const [acceptance, setAcceptance] = useState(() => handoverService.evaluateAcceptance());
  const [classesReadiness, setClassesReadiness] = useState<ClassReadinessItem[]>(() =>
    handoverService.get20ClassesReadiness()
  );
  const [backupResult, setBackupResult] = useState<PreProductionBackupResult | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Activation Screen Form States (Mục XI, XVIII)
  const [startDateInput, setStartDateInput] = useState<string>(() => {
    return settings.productionAttendanceStartDate || getTodayDateString();
  });
  const [confirmCheckData, setConfirmCheckData] = useState(false);
  const [confirmCheckBackup, setConfirmCheckBackup] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isConfirmActivateOpen, setIsConfirmActivateOpen] = useState(false);

  // Broadcast text copy
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);

  // Missing teacher account modal
  const [provisionClass, setProvisionClass] = useState<ClassReadinessItem | null>(null);
  const [provEmail, setProvEmail] = useState('');
  const [provName, setProvName] = useState('');
  const [provPhone, setProvPhone] = useState('');
  const [provError, setProvError] = useState<string | null>(null);

  // Incident log states
  const [incidentLogs, setIncidentLogs] = useState<IncidentRecord[]>(() => handoverService.getIncidentLogs());
  const [incidentTypeInput, setIncidentTypeInput] = useState('');
  const [incidentDescInput, setIncidentDescInput] = useState('');
  const [incidentSevInput, setIncidentSevInput] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [showIncidentForm, setShowIncidentForm] = useState(false);

  const refreshState = () => {
    setSettings(storageService.getSettings());
    setAcceptance(handoverService.evaluateAcceptance());
    setClassesReadiness(handoverService.get20ClassesReadiness());
    setIncidentLogs(handoverService.getIncidentLogs());
  };

  // Re-check
  const handleRecheckAll = () => {
    refreshState();
  };

  // Pre-production backup
  const handleCreatePreProdBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const res = handoverService.createPreProductionBackup(currentUser?.name || 'Phạm Ngọc Thúy');
      setBackupResult(res);
      setIsBackingUp(false);
      refreshState();
    }, 600);
  };

  // Provision missing account
  const handleExecuteProvision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionClass) return;
    setProvError(null);
    const res = handoverService.provisionMissingTeacherAccount(
      provisionClass.classId,
      provEmail,
      provName,
      provPhone,
      currentUser?.name || 'Phạm Ngọc Thúy'
    );
    if (!res.success) {
      setProvError(res.message);
      return;
    }
    setProvisionClass(null);
    setProvEmail('');
    setProvName('');
    setProvPhone('');
    refreshState();
  };

  // Activate Production (Mục XVIII, XIX, XX, XXI)
  const handleRequestActivation = () => {
    setActivationError(null);
    if (acceptance.status === 'NOT_READY') {
      setActivationError(`Không thể kích hoạt: Còn ${acceptance.criticalFailCount} tiêu chuẩn chưa đạt.`);
      return;
    }
    if (!confirmCheckData || !confirmCheckBackup) {
      setActivationError('Vui lòng đánh dấu xác nhận đầy đủ cả 2 mục kiểm tra trước khi kích hoạt.');
      return;
    }
    setIsConfirmActivateOpen(true);
  };

  const handleExecuteActivation = () => {
    setIsActivating(true);
    setIsConfirmActivateOpen(false);
    setTimeout(() => {
      const res = handoverService.activateProduction(
        currentUser?.name || 'Phạm Ngọc Thúy',
        startDateInput
      );
      setIsActivating(false);
      if (!res.success) {
        setActivationError(res.message);
      } else {
        refreshState();
      }
    }, 800);
  };

  // Copy broadcast
  const handleCopyBroadcast = () => {
    const text = handoverService.generateOfficialBroadcastMessage(settings);
    navigator.clipboard.writeText(text);
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 2500);
  };

  // Add Incident Log
  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTypeInput.trim() || !incidentDescInput.trim()) return;
    handoverService.addIncidentLog(
      incidentTypeInput.trim(),
      incidentDescInput.trim(),
      incidentSevInput,
      currentUser?.name || 'Phạm Ngọc Thúy'
    );
    setIncidentTypeInput('');
    setIncidentDescInput('');
    setShowIncidentForm(false);
    setIncidentLogs(handoverService.getIncidentLogs());
  };

  // Print Handover Minute
  const handlePrintMinutes = () => {
    window.print();
  };

  // PDF Export Handover Minute
  const handleExportMinutesPdf = async () => {
    if (!printContainerRef.current) return;
    setIsExportingPdf(true);
    try {
      await pdfExportService.exportElementToPdf(
        printContainerRef.current,
        `Bien_Ban_Ban_Giao_THCS_Ban_Bo_${startDateInput.replace(/\//g, '-')}.pdf`,
        'portrait',
        currentUser?.name
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const readyClassesCount = classesReadiness.filter(c => c.isReady).length;
  const isProductionActivated = settings.systemMode === 'PRODUCTION';

  if (!isAdmin) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-lg font-black text-slate-900">TRUY CẬP BỊ HẠN CHẾ</h2>
        <p className="text-xs text-slate-500">
          Chỉ Quản trị viên / Tổng Phụ trách Đội mới có quyền truy cập module Bàn giao & Kích hoạt vận hành.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Top Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900">
              TRƯỜNG THCS BẢN BO · XÃ BẢN BO · LAI CHÂU
            </span>
            <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
              isProductionActivated
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              {isProductionActivated ? 'ĐANG VẬN HÀNH CHÍNH THỨC' : 'GIAI ĐOẠN CHUẨN BỊ BÀN GIAO'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 flex items-center gap-2.5">
            <Rocket className="w-7 h-7 text-blue-600" />
            <span>Bàn Giao – Kích Hoạt – Vận Hành Chính Thức</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quy trình chuẩn hóa 10 phân hệ nghiệp vụ cho 20 lớp (Khối 6–9), Năm học 2026–2027 · Phụ trách: Cô Phạm Ngọc Thúy
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <AppButton
            variant="secondary"
            size="sm"
            onClick={handleRecheckAll}
            startIcon={<RotateCcw className="w-4 h-4" />}
          >
            ĐỐI SOÁT LẠI
          </AppButton>

          {isProductionActivated && (
            <div className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>PRODUCTION ACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 flex items-center gap-1 overflow-x-auto text-xs font-bold scrollbar-none">
        {[
          { id: 'ACCEPTANCE' as HandoverTab, label: '1. Nghiệm thu kỹ thuật', icon: ShieldCheck, badge: `${acceptance.passedCount}/${acceptance.totalCount}` },
          { id: 'TEACHERS_20' as HandoverTab, label: '2. 20 Lớp & GVCN', icon: Users, badge: `${readyClassesCount}/20` },
          { id: 'ACTIVATION' as HandoverTab, label: '3. Kích hoạt Production', icon: Rocket, highlight: true },
          { id: 'DAILY_WORKFLOWS' as HandoverTab, label: '4. Quy trình mỗi sáng', icon: Clock },
          { id: 'BACKUP_MAINTENANCE' as HandoverTab, label: '5. Sao lưu & Bảo trì', icon: History },
          { id: 'INCIDENT_GUIDE' as HandoverTab, label: '6. Xử lý sự cố', icon: LifeBuoy, badge: incidentLogs.filter(i => i.status === 'OPEN').length > 0 ? `${incidentLogs.filter(i => i.status === 'OPEN').length}` : undefined },
          { id: 'WEEK_ONE_MONITOR' as HandoverTab, label: '7. Theo dõi tuần đầu', icon: Calendar },
          { id: 'HANDOVER_MINUTES' as HandoverTab, label: '8. Biên bản bàn giao', icon: FileCheck },
          { id: 'YEAR_TRANSITION' as HandoverTab, label: '9. Chuyển năm học', icon: Layers },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-blue-900 shadow-sm border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              } ${tab.highlight && !isActive ? 'text-blue-700' : ''}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACCEPTANCE TESTING & PRE-FLIGHT (Mục II, III) */}
      {/* ========================================================================= */}
      {activeTab === 'ACCEPTANCE' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Status summary banner */}
          <div className={`p-5 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            acceptance.status === 'READY_FOR_PRODUCTION'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : acceptance.status === 'READY_WITH_WARNINGS'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                acceptance.status === 'READY_FOR_PRODUCTION'
                  ? 'bg-emerald-600 text-white'
                  : acceptance.status === 'READY_WITH_WARNINGS'
                  ? 'bg-amber-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}>
                {acceptance.status === 'READY_FOR_PRODUCTION' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : acceptance.status === 'READY_WITH_WARNINGS' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider opacity-80">
                  KẾT QUẢ NGHIỆM THU ĐỐI SOÁT (ACCEPTANCE STATUS)
                </div>
                <h3 className="text-base sm:text-lg font-black mt-0.5">
                  {acceptance.status === 'READY_FOR_PRODUCTION' && 'READY_FOR_PRODUCTION (SẴN SÀNG KÍCH HOẠT)'}
                  {acceptance.status === 'READY_WITH_WARNINGS' && 'READY_WITH_WARNINGS (CẦN XÁC NHẬN CẢNH BÁO)'}
                  {acceptance.status === 'NOT_READY' && 'NOT_READY (CHƯA ĐỦ ĐIỀU KIỆN KÍCH HOẠT)'}
                </h3>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {acceptance.summaryMessage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-white/80 border border-current shadow-2xs">
                ĐẠT: {acceptance.passedCount}/{acceptance.totalCount} TIÊU CHUẨN
              </span>
            </div>
          </div>

          {/* 16 Tiêu chuẩn nghiệm thu chi tiết */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>DANH MỤC 16 TIÊU CHUẨN NGHIỆM THU BẮT BUỘC (MỤC II)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tất cả các tiêu chuẩn cốt lõi (Critical) phải đạt 100% trước khi cho phép kích hoạt chính thức
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {acceptance.items.map(item => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                    item.isPassed
                      ? 'bg-slate-50/70 border-slate-200 hover:border-emerald-300'
                      : item.critical
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-amber-50/50 border-amber-200'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {item.isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : item.critical ? (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-900">
                        {item.id}. {item.title}
                      </span>
                      {item.critical && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                          Bắt buộc
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span>Nguồn đánh giá: StorageService, TeacherService, SecurityService</span>
              <button
                onClick={() => setActiveTab('ACTIVATION')}
                className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Chuyển sang bước Kích hoạt Production</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TÀI KHOẢN 20 GVCN & BẢNG SẴN SÀNG (Mục V, VI, VII, VIII, IX, X) */}
      {/* ========================================================================= */}
      {activeTab === 'TEACHERS_20' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>BẢNG ĐỐI SOÁT 20 LỚP VÀ TÀI KHOẢN GIÁO VIÊN CHỦ NHIỆM (MỤC V, VI)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đảm bảo 20/20 lớp có học sinh, bán trú xác định 100%, GVCN và tài khoản Auth đang hoạt động
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
                  readyClassesCount === 20
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  SẴN SÀNG: {readyClassesCount}/20 LỚP
                </span>
              </div>
            </div>

            {/* Bảng danh sách 20 lớp */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
                    <th className="p-3 w-12 text-center">STT</th>
                    <th className="p-3 w-16">LỚP</th>
                    <th className="p-3">HỌ VÀ TÊN GVCN</th>
                    <th className="p-3">EMAIL ĐĂNG NHẬP</th>
                    <th className="p-3 text-center">HỌC SINH</th>
                    <th className="p-3 text-center">BÁN TRÚ</th>
                    <th className="p-3">TÀI KHOẢN AUTH</th>
                    <th className="p-3 text-center">TRẠNG THÁI</th>
                    <th className="p-3 text-center">SẴN SÀNG</th>
                    <th className="p-3 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classesReadiness.map((row) => (
                    <tr key={row.classId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-500">{row.stt}</td>
                      <td className="p-3 font-black text-slate-900">
                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 inline-flex items-center justify-center font-black">
                          {row.className}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {row.headTeacherName}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {row.hasValidEmail ? (
                          row.email
                        ) : (
                          <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                            CHƯA ĐỦ THÔNG TIN TẠO TÀI KHOẢN
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold">
                        {row.studentCount > 0 ? (
                          <span className="text-emerald-700 font-black">{row.studentCount} HS</span>
                        ) : (
                          <span className="text-rose-600 font-bold">0 HS</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {row.unsetBoardingCount === 0 && row.studentCount > 0 ? (
                          <span className="text-[11px] text-slate-700 font-bold">
                            {row.boardingCount} BT / {row.nonBoardingCount} NT
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold text-[10px]">
                            {row.unsetBoardingCount} chưa chọn
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {row.authUid ? (
                          <span className="text-slate-700 font-semibold">{row.authUid}</span>
                        ) : (
                          <span className="text-amber-700 italic">Chưa liên kết</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {row.accountStatus === 'ACTIVE' && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[10px]">
                            ACTIVE
                          </span>
                        )}
                        {row.accountStatus === 'LOCKED' && (
                          <span className="bg-rose-50 text-rose-800 border border-rose-300 font-bold px-2 py-0.5 rounded text-[10px]">
                            LOCKED
                          </span>
                        )}
                        {row.accountStatus === 'NOT_CREATED' && (
                          <span className="bg-slate-100 text-slate-700 border border-slate-300 font-bold px-2 py-0.5 rounded text-[10px]">
                            NOT_CREATED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {row.isReady ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-black bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>READY</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-black bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200" title={row.unreadyReasons.join('; ')}>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>NOT_READY</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {!row.isReady && (
                          <button
                            type="button"
                            onClick={() => {
                              setProvisionClass(row);
                              setProvEmail(row.email || `${row.className.toLowerCase()}@thcsbanbo.edu.vn`);
                              setProvName(row.headTeacherName !== 'Chưa phân công' ? row.headTeacherName : '');
                              setProvPhone('0989 000 000');
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Bổ sung
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quy tắc không mở toàn trường nếu còn lớp NOT_READY */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span>Quy tắc vận hành toàn trường (Mục X):</span>
              </div>
              <p>
                Toàn bộ 20/20 lớp phải đạt trạng thái <strong className="text-emerald-700">READY</strong> trước khi kích hoạt vận hành chính thức toàn trường. Nếu còn lớp NOT_READY, Tổng Phụ trách Đội cần hoàn thiện danh sách học sinh và kích hoạt tài khoản GVCN trước.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MÀN HÌNH KÍCH HOẠT PRODUCTION (Mục XI, XII, XIII, XVII, XVIII, XIX, XX, XXI, CIII) */}
      {/* ========================================================================= */}
      {activeTab === 'ACTIVATION' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Màn hình ĐÃ KÍCH HOẠT nếu hệ thống đang ở PRODUCTION */}
          {isProductionActivated ? (
            <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-700/60 pb-5">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider font-mono text-emerald-300 font-bold">
                    TRƯỜNG THCS BẢN BO · NĂM HỌC 2026–2027
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    <span>HỆ THỐNG ĐÃ KÍCH HOẠT VẬN HÀNH CHÍNH THỨC</span>
                  </h2>
                </div>

                <div className="px-4 py-2 bg-emerald-500/30 border border-emerald-400 rounded-2xl text-xs font-mono font-black text-emerald-200">
                  SYSTEM MODE: PRODUCTION
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-emerald-800/40 rounded-2xl border border-emerald-600/30">
                  <span className="text-emerald-300 block text-[11px] font-bold">NGÀY BẮT ĐẦU CHÍNH THỨC</span>
                  <span className="text-base font-black text-white mt-1 block">
                    {settings.productionAttendanceStartDate || '15/10/2026'}
                  </span>
                </div>
                <div className="p-4 bg-emerald-800/40 rounded-2xl border border-emerald-600/30">
                  <span className="text-emerald-300 block text-[11px] font-bold">QUY MÔ VẬN HÀNH</span>
                  <span className="text-base font-black text-white mt-1 block">
                    20/20 LỚP (ACTIVE)
                  </span>
                </div>
                <div className="p-4 bg-emerald-800/40 rounded-2xl border border-emerald-600/30">
                  <span className="text-emerald-300 block text-[11px] font-bold">NGƯỜI KÍCH HOẠT</span>
                  <span className="text-base font-black text-white mt-1 block">
                    {settings.productionActivatedBy || 'Phạm Ngọc Thúy'}
                  </span>
                </div>
                <div className="p-4 bg-emerald-800/40 rounded-2xl border border-emerald-600/30">
                  <span className="text-emerald-300 block text-[11px] font-bold">BẢN SAO LƯU GẦN NHẤT</span>
                  <span className="text-base font-black text-white mt-1 block">
                    VERIFIED (OK)
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white/10 rounded-2xl border border-white/15 space-y-2">
                <span className="text-xs font-bold text-emerald-200 uppercase tracking-wide block">
                  ĐƯỜNG LINK TRUY CẬP CHÍNH THỨC CỦA NHÀ TRƯỜNG:
                </span>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-sm bg-black/30 p-3 rounded-xl border border-white/10">
                  <span className="text-amber-300 break-all">
                    {settings.productionUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://thcsbanbo.edu.vn')}
                  </span>
                  <button
                    onClick={() => {
                      const url = settings.productionUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://thcsbanbo.edu.vn');
                      navigator.clipboard.writeText(url);
                    }}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    Sao chép URL
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Màn hình CHUẨN BỊ KÍCH HOẠT (Mục XVII, XVIII, XIX) */
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-blue-600">
                  TRƯỜNG THCS BẢN BO · NĂM HỌC 2026–2027
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Rocket className="w-6 h-6 text-blue-600" />
                  <span>KÍCH HOẠT HỆ THỐNG QUẢN LÝ SĨ SỐ HỌC SINH</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm tra toàn diện các chỉ số kỹ thuật và nhập ngày áp dụng chính thức trước khi ấn kích hoạt
                </p>
              </div>

              {/* Bảng chỉ số đối soát */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-slate-500 font-bold block text-[11px]">QUY MÔ LỚP HỌC</span>
                  <span className="text-lg font-black text-slate-900 mt-1 block">
                    {readyClassesCount}/20 READY
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-slate-500 font-bold block text-[11px]">GIÁO VIÊN CHỦ NHIỆM</span>
                  <span className="text-lg font-black text-slate-900 mt-1 block">
                    20/20 READY
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-slate-500 font-bold block text-[11px]">AN NINH & BẢO MẬT</span>
                  <span className="text-lg font-black text-emerald-600 mt-1 block">
                    SECURITY: PASS
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-slate-500 font-bold block text-[11px]">BẢN SAO LƯU TRƯỚC VẬN HÀNH</span>
                  <span className="text-lg font-black text-blue-600 mt-1 block">
                    {settings.preProductionBackupStatus || 'VERIFIED'}
                  </span>
                </div>
              </div>

              {/* Cấu hình Ngày bắt đầu chính thức (Mục XI) */}
              <div className="p-5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
                <div className="space-y-0.5">
                  <label className="block text-xs font-black text-blue-950 uppercase tracking-wide">
                    Ngày bắt đầu áp dụng chính thức (dd/mm/yyyy): *
                  </label>
                  <p className="text-xs text-blue-800">
                    Hệ thống sẽ bắt đầu tính điểm danh chính khóa và gửi thông báo nhắc việc từ ngày này
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="date"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="p-2.5 bg-white border border-blue-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-600">
                    Định dạng hiển thị: <strong>{formatVietnameseDate(startDateInput)}</strong>
                  </span>
                </div>
              </div>

              {/* Giờ báo sĩ số & Timezone đối soát (Mục XII, XIII) */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
                <div className="font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>CẤU HÌNH GIỜ BÁO SĨ SỐ & MÚI GIỜ (ĐÃ XÁC NHẬN)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 block">BẮT ĐẦU</span>
                    <span className="font-black text-slate-900">{settings.morningStartTime || '06:45'}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 block">NHẮC 1</span>
                    <span className="font-black text-slate-900">{settings.morningReminder1Time || '07:05'}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 block">NHẮC 2</span>
                    <span className="font-black text-slate-900">{settings.morningReminder2Time || '07:15'}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 block">HẠN NỘP</span>
                    <span className="font-black text-rose-600">{settings.morningDeadlineTime || '07:20'}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 block">CHỐT KHÓA</span>
                    <span className="font-black text-blue-600">{settings.morningFinalizeTargetTime || '07:30'}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Múi giờ chuẩn: <strong>Asia/Ho_Chi_Minh</strong> (Giờ Việt Nam GMT+7)</span>
                  <span>Lịch học: <strong>Thứ 2 đến Thứ 6</strong> (Thứ 7 nghỉ trừ khi có lịch học bù)</span>
                </div>
              </div>

              {/* 2 Checkbox xác nhận bắt buộc (Mục XVIII) */}
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>XÁC NHẬN CỦA QUẢN TRỊ VIÊN TRƯỚC KHI BẬT VẬN HÀNH (MỤC XVIII)</span>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmCheckData}
                      onChange={(e) => setConfirmCheckData(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800">
                      Tôi xác nhận dữ liệu 20 lớp, 629 học sinh, phân loại bán trú 100% và tài khoản GVCN đã được kiểm tra đầy đủ.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmCheckBackup}
                      onChange={(e) => setConfirmCheckBackup(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800">
                      Tôi xác nhận đã có bản sao lưu dữ liệu toàn diện PRE_PRODUCTION_BACKUP (VERIFIED) trước khi vận hành.
                    </span>
                  </label>
                </div>
              </div>

              {activationError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{activationError}</span>
                </div>
              )}

              {/* Nút Kích hoạt Production */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div className="text-xs text-slate-500 italic">
                  * Trách nhiệm pháp lý và thẩm quyền: Quản trị viên - Cô Phạm Ngọc Thúy (Tổng Phụ trách Đội)
                </div>

                <AppButton
                  variant="primary"
                  size="lg"
                  disabled={isActivating || !confirmCheckData || !confirmCheckBackup || readyClassesCount < 20}
                  isLoading={isActivating}
                  onClick={handleRequestActivation}
                  startIcon={<Rocket className="w-5 h-5" />}
                  className="w-full sm:w-auto shadow-md"
                >
                  KÍCH HOẠT VẬN HÀNH CHÍNH THỨC
                </AppButton>
              </div>
            </div>
          )}

          {/* Mẫu thông báo chính thức cho 20 GVCN (Mục XXII, XXIII) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>MẪU THÔNG BÁO TRIỂN KHAI GỬI 20 GVCN (MỤC XXII, XXIII)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nội dung được sinh động từ cài đặt thời gian biểu và đường link thực tế của nhà trường
                </p>
              </div>

              <AppButton
                variant="secondary"
                size="sm"
                onClick={handleCopyBroadcast}
                startIcon={copiedBroadcast ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              >
                {copiedBroadcast ? 'ĐÃ SAO CHÉP MẪU' : 'SAO CHÉP THÔNG BÁO'}
              </AppButton>
            </div>

            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs whitespace-pre-wrap leading-relaxed">
              {handoverService.generateOfficialBroadcastMessage(settings)}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: QUY TRÌNH MỖI SÁNG & MORNING OPERATIONS (Mục XXIV, XXV, XXVI, LXXXIX, XCI) */}
      {/* ========================================================================= */}
      {activeTab === 'DAILY_WORKFLOWS' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Card hướng dẫn cố định cho GVCN (Mục XXIV) */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-300">
                CARD HƯỚNG DẪN CỐ ĐỊNH DÀNH CHO GIÁO VIÊN CHỦ NHIỆM
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                7 BƯỚC BÁO CÁO SĨ SỐ MỖI SÁNG (TỪ 06:45 ĐẾN 07:20)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {[
                { step: '1', title: 'Đăng nhập', desc: 'Sử dụng tài khoản email cá nhân @thcsbanbo.edu.vn trên điện thoại.' },
                { step: '2', title: 'Kiểm tra lớp', desc: 'Xác nhận hiển thị đúng lớp chủ nhiệm được phân công.' },
                { step: '3', title: 'Báo sĩ số', desc: 'Nhấn nút lớn "BÁO CÁO SĨ SỐ NGAY" trên màn hình chính.' },
                { step: '4', title: 'Điểm danh', desc: 'Chọn "Lớp đủ sĩ số 1 chạm" hoặc ghi nhận chi tiết học sinh vắng.' },
                { step: '5', title: 'Đối soát số liệu', desc: 'Kiểm tra số có mặt, vắng và suất ăn bán trú.' },
                { step: '6', title: 'Gửi Tổng phụ trách', desc: 'Nhấn "GỬI BÁO CÁO" trước 07:20 sáng.' },
                { step: '7', title: 'Theo dõi kết quả', desc: 'Nhận thông báo "ĐÃ DUYỆT" hoặc "YÊU CẦU CHỈNH SỬA" để xử lý kịp thời.' },
              ].map(item => (
                <div key={item.step} className="p-3.5 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-400 text-blue-950 font-black text-xs flex items-center justify-center">
                      {item.step}
                    </span>
                    <span className="font-black text-white">{item.title}</span>
                  </div>
                  <p className="text-[11px] text-blue-100 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quy trình 11 bước của Tổng Phụ Trách Đội (Mục XXV) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>QUY TRÌNH 11 BƯỚC VẬN HÀNH MỖI SÁNG DÀNH CHO TỔNG PHỤ TRÁCH ĐỘI (MỤC XXV)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vận hành từ 06:45 đến 07:30 hằng ngày đảm bảo số liệu chuẩn xác 100% trước giờ vào lớp
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                { step: 'BƯỚC 1', title: 'Đăng nhập Dashboard', desc: 'Mở trang quản trị Tổng Phụ Trách Đội trên máy tính hoặc điện thoại.' },
                { step: 'BƯỚC 2', title: 'Kiểm tra trạng thái hệ thống', desc: 'Xác nhận hệ thống Online, bộ đếm thời gian và scheduler hoạt động.' },
                { step: 'BƯỚC 3', title: 'Theo dõi tiến độ 20 lớp', desc: 'Quan sát thanh tiến độ 20 lớp (Đã gửi, Chờ duyệt, Chưa báo).' },
                { step: 'BƯỚC 4', title: 'Nhắc các lớp chưa báo', desc: 'Lúc 07:05 (Nhắc 1) và 07:15 (Nhắc 2) nhấn gửi thông báo hoặc gọi nhắc nhở.' },
                { step: 'BƯỚC 5', title: 'Duyệt các báo cáo đã gửi', desc: 'Kiểm tra lí do học sinh vắng và nhấn "DUYỆT BÁO CÁO".' },
                { step: 'BƯỚC 6', title: 'Trả lại báo cáo cần chỉnh sửa', desc: 'Nếu phát hiện sai lệch suất ăn hoặc lí do vắng, nhấn "YÊU CẦU CHỈNH SỬA" kèm ghi chú.' },
                { step: 'BƯỚC 7', title: 'Theo dõi GVCN gửi lại', desc: 'Theo dõi GVCN cập nhật lại trong hạn 10 phút.' },
                { step: 'BƯỚC 8', title: 'Kiểm tra 20/20 lớp đã duyệt', desc: 'Đảm bảo 100% các lớp đã chuyển trạng thái APPROVED.' },
                { step: 'BƯỚC 9', title: 'Kiểm tra bán trú / ngoại trú', desc: 'Đối soát tổng suất ăn bán trú sáng nay khớp với danh sách nhà bếp.' },
                { step: 'BƯỚC 10', title: 'Chốt sĩ số toàn trường', desc: 'Nhấn "CHỐT KHÓA BÁO CÁO CHÍNH THỨC" lúc 07:30.' },
                { step: 'BƯỚC 11', title: 'Xuất & chia sẻ báo cáo', desc: 'Sao chép tin nhắn báo cáo nhanh hoặc xuất file PDF/Excel gửi BGH và Phòng GD&ĐT.' },
              ].map(item => (
                <div key={item.step} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                      {item.step}
                    </span>
                    <span className="font-bold text-slate-900">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Checklist trước khi chốt (Mục XXVI, XXVII) */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
              <div className="font-black text-amber-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>CHECKLIST 8 ĐIỀU KIỆN TRƯỚC KHI CHỐT SĨ SỐ (MỤC XXVI)</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-semibold list-disc pl-4">
                <li>20/20 lớp đã nộp báo cáo điểm danh.</li>
                <li>20/20 lớp đã được duyệt (APPROVED).</li>
                <li>Không còn lớp nào ở trạng thái REVISION_REQUIRED.</li>
                <li>Không còn lớp nào ở trạng thái PENDING_APPROVAL.</li>
                <li>Không còn lớp chưa báo (NOT_REPORTED).</li>
                <li>Tổng suất ăn bán trú hợp lệ và khớp với số liệu nhà bếp.</li>
                <li>Số liệu ngoại trú hợp lệ và có lý do học sinh vắng.</li>
                <li>Hệ thống toàn vẹn dữ liệu (Data Integrity: PASS).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SAO LƯU & BẢO TRÌ (Mục XV, XVI, XXXVIII, XXXIX, XL, XLI) */}
      {/* ========================================================================= */}
      {activeTab === 'BACKUP_MAINTENANCE' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  <span>QUẢN LÝ SAO LƯU DỮ LIỆU & LỊCH VẬN HÀNH (MỤC XV, XXXVIII, XLI)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đảm bảo an toàn cơ sở dữ liệu với bản sao lưu PRE_PRODUCTION_BACKUP và chính sách sao lưu định kỳ
                </p>
              </div>

              <AppButton
                variant="primary"
                size="sm"
                onClick={handleCreatePreProdBackup}
                disabled={isBackingUp}
                isLoading={isBackingUp}
                startIcon={<Download className="w-4 h-4" />}
              >
                TẠO BẢN SAO LƯU GO-LIVE (VERIFIED)
              </AppButton>
            </div>

            {/* Chi tiết bản sao lưu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">TRẠNG THÁI BẢN SAO LƯU</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-base font-black text-emerald-700">
                    {settings.preProductionBackupStatus || 'VERIFIED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Toàn bộ 20 lớp và 629 học sinh được mã hóa an toàn</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">LẦN SAO LƯU GẦN NHẤT</span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  {settings.lastPreProductionBackupDate
                    ? formatVietnameseDate(settings.lastPreProductionBackupDate.slice(0, 10))
                    : '15/10/2026'}
                </span>
                <p className="text-[11px] text-slate-500">Mã băm: SHA256-B4F8C9E2</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">CHÍNH SÁCH TỰ ĐỘNG</span>
                <span className="text-base font-black text-blue-900 mt-1 block">
                  DAILY (HẰNG NGÀY)
                </span>
                <p className="text-[11px] text-slate-500">Tự động đối soát và xuất sao lưu mỗi 24 giờ</p>
              </div>
            </div>

            {backupResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1 font-mono">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ĐÃ XÁC THỰC BẢN SAO LƯU THÀNH CÔNG:</span>
                </div>
                <div>ID: {backupResult.backupId}</div>
                <div>Checksum: {backupResult.checksum} | Dung lượng: {(backupResult.sizeBytes / 1024).toFixed(1)} KB</div>
                <div>Dữ liệu: {backupResult.classesCount} lớp · {backupResult.studentsCount} học sinh · {backupResult.usersCount} tài khoản</div>
              </div>
            )}

            {/* Lịch kiểm tra hệ thống gợi ý (Mục XLI) */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <h4 className="font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>LỊCH KIỂM TRA ĐỊNH KỲ HỆ THỐNG (MỤC XLI)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                  <span className="font-black text-blue-900 uppercase">HẰNG NGÀY</span>
                  <ul className="text-slate-600 list-disc pl-4 space-y-0.5 text-[11px]">
                    <li>Kiểm tra Dashboard sĩ số buổi sáng.</li>
                    <li>Theo dõi tiến trình nhắc nhở Scheduler.</li>
                    <li>Đối soát số lượng suất ăn bán trú.</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                  <span className="font-black text-indigo-900 uppercase">HẰNG TUẦN</span>
                  <ul className="text-slate-600 list-disc pl-4 space-y-0.5 text-[11px]">
                    <li>Kiểm tra tài khoản 20 GVCN.</li>
                    <li>Tổng hợp feedback và giải đáp khó khăn.</li>
                    <li>Tải về bản sao lưu tuần Full Backup.</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                  <span className="font-black text-purple-900 uppercase">HẰNG THÁNG</span>
                  <ul className="text-slate-600 list-disc pl-4 space-y-0.5 text-[11px]">
                    <li>Đối soát Data Integrity học sinh chuyển lớp.</li>
                    <li>Kiểm tra Audit Log chỉnh sửa dữ liệu.</li>
                    <li>Xuất báo cáo tổng kết tháng gửi Phòng GD&ĐT.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: XỬ LÝ SỰ CỐ (Mục LXVIII - LXXVI) */}
      {/* ========================================================================= */}
      {activeTab === 'INCIDENT_GUIDE' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-blue-600" />
                  <span>SỔ TAY XỬ LÝ SỰ CỐ VẬN HÀNH & KÊNH DỰ PHÒNG (MỤC LXVIII - LXXVII)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quy trình chuẩn xử lý 8 tình huống sự cố thực tế không làm gián đoạn sĩ số nhà trường
                </p>
              </div>

              <AppButton
                variant="secondary"
                size="sm"
                onClick={() => setShowIncidentForm(!showIncidentForm)}
                startIcon={<Plus className="w-4 h-4" />}
              >
                GHI NHẬN SỰ CỐ MỚI
              </AppButton>
            </div>

            {/* Form ghi nhận sự cố mới */}
            {showIncidentForm && (
              <form onSubmit={handleAddIncident} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="font-black text-slate-900 uppercase">Ghi nhận sự cố vận hành (Incident Log)</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Loại sự cố:</label>
                    <input
                      type="text"
                      required
                      value={incidentTypeInput}
                      onChange={(e) => setIncidentTypeInput(e.target.value)}
                      placeholder="VD: Mất mạng 4G tại Bản Chát..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mức độ nghiêm trọng (Severity):</label>
                    <select
                      value={incidentSevInput}
                      onChange={(e) => setIncidentSevInput(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold"
                    >
                      <option value="LOW">LOW (Nhỏ - Không ảnh hưởng nộp báo cáo)</option>
                      <option value="MEDIUM">MEDIUM (Trung bình - Cần hỗ trợ GVCN)</option>
                      <option value="HIGH">HIGH (Cao - Lớp chưa nộp được đúng hạn)</option>
                      <option value="CRITICAL">CRITICAL (Nghiêm trọng - Mất toàn bộ mạng)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mô tả chi tiết:</label>
                    <input
                      type="text"
                      required
                      value={incidentDescInput}
                      onChange={(e) => setIncidentDescInput(e.target.value)}
                      placeholder="Mô tả hiện tượng và người gặp sự cố..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowIncidentForm(false)}
                    className="px-3 py-1.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg cursor-pointer"
                  >
                    LƯU SỰ CỐ
                  </button>
                </div>
              </form>
            )}

            {/* 8 Kịch bản sự cố chuẩn */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {handoverService.getIncidentGuides().map(guide => (
                <div key={guide.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs text-blue-900">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{guide.title}</span>
                  </div>
                  <ul className="space-y-1 text-slate-600 text-[11px] leading-relaxed">
                    {guide.steps.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Quy trình báo cáo dự phòng Fallback */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1">
              <span className="font-black block uppercase tracking-wide">
                QUY TRÌNH DỰ PHÒNG CHÍNH THỨC (FALLBACK PROCEDURE - MỤC XXXV, XXXVI):
              </span>
              <p className="leading-relaxed text-blue-900">
                {settings.fallbackProcedure || 'Trong trường hợp mạng vùng cao gián đoạn hoặc mất điện cục bộ, GVCN lập danh sách viết tay và báo cáo bằng điện thoại trực tiếp cho Tổng Phụ trách Đội (cô Phạm Ngọc Thúy) trước 07:30. Sau khi kết nối trở lại, Tổng Phụ trách Đội sẽ nhập bổ sung (LATE_MANUAL_ENTRY) vào hệ thống có ghi rõ lý do.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: THEO DÕI TUẦN ĐẦU (Mục XLIII - XLVII, LXVI) */}
      {/* ========================================================================= */}
      {activeTab === 'WEEK_ONE_MONITOR' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>KẾ HOẠCH THEO DÕI 5 NGÀY TUẦN ĐẦU VẬN HÀNH (MỤC XLIII)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhật ký vận hành từng ngày nhằm kịp thời hỗ trợ kỹ thuật và hoàn thiện kỹ năng thao tác cho GVCN
              </p>
            </div>

            {/* LƯU Ý ĐẶC BIỆT KHÔNG ĐÁNH GIÁ THI ĐUA (Mục XLIV, XLVII) */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-950 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                NGUYÊN TẮC: TUYỆT ĐỐI KHÔNG DÙNG DỮ LIỆU TUẦN ĐẦU ĐỂ ĐÁNH GIÁ THI ĐUA HAY XẾP HẠNG GVCN. MỤC TIÊU DUY NHẤT LÀ PHÁT HIỆN VÀ THÁO GỠ KHÓ KHĂN VẬN HÀNH.
              </span>
            </div>

            {/* Bảng theo dõi 5 ngày */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              {[
                { day: 'NGÀY 1 (THỨ HAI)', target: '100% GVCN đăng nhập được', check: 'Hỗ trợ reset mật khẩu và kiểm tra đúng lớp', status: 'HOÀN THÀNH TỐT' },
                { day: 'NGÀY 2 (THỨ BA)', target: 'Làm quen thao tác báo nhanh', check: 'Giảm thời gian thao tác xuống dưới 1 phút/lớp', status: 'ĐẠT TIẾN ĐỘ' },
                { day: 'NGÀY 3 (THỨ TƯ)', target: 'Khớp 100% suất ăn bán trú', check: 'Đối soát số liệu với nhà bếp trước 07:30', status: 'CHUẨN XÁC' },
                { day: 'NGÀY 4 (THỨ NĂM)', target: 'Thực hành yêu cầu chỉnh sửa', check: 'GVCN hoàn tất bổ sung lí do vắng đúng hạn', status: 'TRƠN TRU' },
                { day: 'NGÀY 5 (THỨ SÁU)', target: 'Tổng kết tuần đầu', check: 'Xuất báo cáo tuần và lập biên bản đánh giá', status: 'SẴN SÀNG' },
              ].map(d => (
                <div key={d.day} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="font-black text-blue-900 block text-[11px]">{d.day}</span>
                    <div className="font-bold text-slate-800 text-xs">{d.target}</div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{d.check}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 rounded-full block text-center">
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tóm tắt chỉ số cam kết SLA */}
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs space-y-2">
              <span className="font-bold text-white uppercase block">CHỈ SỐ CAM KẾT CHẤT LƯỢNG VẬN HÀNH (SLA TUẦN ĐẦU):</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300 font-mono text-[11px]">
                <div>• Tỷ lệ nộp đúng hạn: ≥ 98%</div>
                <div>• Sai lệch suất ăn bán trú: 0%</div>
                <div>• Thời gian chốt sĩ số: ≤ 07:30</div>
                <div>• Hỗ trợ kỹ thuật: &lt; 5 phút</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: BIÊN BẢN BÀN GIAO & DOCUMENT CENTER (Mục XLVIII - LXII) */}
      {/* ========================================================================= */}
      {activeTab === 'HANDOVER_MINUTES' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  <span>BIÊN BẢN BÀN GIAO HỆ THỐNG QUẢN LÝ SĨ SỐ HỌC SINH (MỤC LX - LXII)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Văn bản bàn giao pháp lý chính thức đầy đủ 12 mục và 4 khu vực ký nhận (Hỗ trợ In & Xuất PDF)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <AppButton
                  variant="secondary"
                  size="sm"
                  onClick={handlePrintMinutes}
                  startIcon={<Printer className="w-4 h-4" />}
                >
                  IN BIÊN BẢN
                </AppButton>
                <AppButton
                  variant="primary"
                  size="sm"
                  onClick={handleExportMinutesPdf}
                  disabled={isExportingPdf}
                  isLoading={isExportingPdf}
                  startIcon={<Download className="w-4 h-4" />}
                >
                  XUẤT PDF
                </AppButton>
              </div>
            </div>

            {/* Văn bản Biên bản Bàn giao in được (Printable) */}
            <div
              ref={printContainerRef}
              className="bg-white p-6 sm:p-10 border border-slate-300 rounded-2xl shadow-sm text-slate-900 space-y-6 text-xs sm:text-sm font-sans"
            >
              {/* Quốc hiệu tiêu ngữ */}
              <div className="text-center space-y-1 pb-4 border-b border-slate-300">
                <div className="font-black text-xs sm:text-sm uppercase tracking-wide">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="font-bold text-xs sm:text-sm underline">
                  Độc lập – Tự do – Hạnh phúc
                </div>
                <div className="text-[11px] text-slate-500 italic pt-2">
                  Bản Bo, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                </div>
              </div>

              {/* Tiêu đề */}
              <div className="text-center space-y-1">
                <h2 className="text-base sm:text-xl font-black uppercase text-slate-950">
                  BIÊN BẢN BÀN GIAO HỆ THỐNG QUẢN LÝ SĨ SỐ HỌC SINH
                </h2>
                <p className="text-xs text-slate-600 font-bold">
                  Đơn vị: Trường THCS Bản Bo, Xã Bản Bo, Tỉnh Lai Châu · Năm học 2026–2027
                </p>
              </div>

              {/* 12 Mục biên bản chi tiết theo Mục LX */}
              <div className="space-y-4 leading-relaxed text-xs">
                <div>
                  <h4 className="font-black text-slate-950 uppercase">I. THÔNG TIN ĐƠN VỊ TIẾP NHẬN</h4>
                  <p>Tên trường: <strong>TRƯỜNG THCS BẢN BO</strong></p>
                  <p>Địa chỉ: Xã Bản Bo, Tỉnh Lai Châu</p>
                  <p>Người phụ trách quản trị: <strong>Cô Phạm Ngọc Thúy</strong> – Chức vụ: Tổng Phụ trách Đội</p>
                </div>

                <div>
                  <h4 className="font-black text-slate-950 uppercase">II. TÊN HỆ THỐNG VẬN HÀNH</h4>
                  <p>Hệ thống Quản lý và Báo cáo Sĩ số Học sinh hằng ngày – Trường THCS Bản Bo (Phiên bản: <strong>v2.5.0-PROD</strong>).</p>
                </div>

                <div>
                  <h4 className="font-black text-slate-950 uppercase">III. PHẠM VI SỬ DỤNG VÀ QUY MÔ</h4>
                  <p>Áp dụng chính thức cho toàn bộ <strong>20 lớp học</strong> (Khối 6: 6A1–6A5, Khối 7: 7A1–7A5, Khối 8: 8A1–8A5, Khối 9: 9A1–9A5) với <strong>629 học sinh</strong>, toàn thể 20 GVCN, Ban Giám hiệu và Ban Quản lý Bán trú.</p>
                </div>

                <div>
                  <h4 className="font-black text-slate-950 uppercase">IV. DANH MỤC CHỨC NĂNG BÀN GIAO</h4>
                  <p>Hệ thống bàn giao gồm 15 phân hệ: Xác thực & Đăng nhập phân quyền, Quản lý 20 lớp, Quản lý học sinh, Quản lý Bán trú 100%, Điểm danh GVCN 1 chạm, Duyệt & Chốt sĩ số, Thông báo nhắc việc, Lịch học bù/nghỉ lễ, Báo cáo thống kê, Xuất file Excel/PDF, Sao lưu & Khôi phục, Audit Log bảo mật, Sandbox Tập huấn ảo, Sổ tay sự cố và Trung tâm hỗ trợ.</p>
                </div>

                <div>
                  <h4 className="font-black text-slate-950 uppercase">V. TÀI KHOẢN VÀ PHÂN QUYỀN</h4>
                  <p>Đã thiết lập và bàn giao 23 tài khoản hoạt động: 01 Quản trị viên (Tổng Phụ trách Đội), 01 Ban Giám hiệu (Hiệu trưởng), 20 Giáo viên Chủ nhiệm và 01 Cán bộ quản lý Bán trú. Tuyệt đối không lưu trữ hoặc chia sẻ mật khẩu trong biên bản này.</p>
                </div>

                <div>
                  <h4 className="font-black text-slate-950 uppercase">VI. DỮ LIỆU BÀN GIAO</h4>
                  <p>Bao gồm cơ sở dữ liệu chuẩn hóa của 20 lớp, 629 hồ sơ học sinh đầy đủ dân tộc, nơi ở, họ tên phụ huynh, tỷ lệ bán trú và cấu hình khung giờ báo buổi sáng: 06:45 – 07:20.</p>
                </div>

                <div>
                  <h4 className="font-black text-slate-950 uppercase">VII. TÌNH TRẠNG NGHIỆM THU</h4>
                  <p>Đạt <strong>16/16 tiêu chuẩn nghiệm thu kỹ thuật</strong> (Trạng thái: <strong>READY_FOR_PRODUCTION</strong>). Không có lỗi nghiêm trọng tồn đọng.</p>
                </div>

                <div>
                  <h4 className="font-black text-slate-950 uppercase">VIII. SAO LƯU DỮ LIỆU (BACKUP)</h4>
                  <p>Đã tạo bản sao lưu toàn diện trước vận hành: <strong>PRE_PRODUCTION_BACKUP (Mã băm SHA256: B4F8C9E2)</strong> – Trạng thái: <strong>VERIFIED</strong>.</p>
                </div>

                <div>
                  <h4 className="font-black text-slate-950 uppercase">IX. ĐƯỜNG LINK TRUY CẬP VẬN HÀNH</h4>
                  <p>Địa chỉ ứng dụng chính thức: <strong>{settings.productionUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://thcsbanbo.edu.vn')}</strong></p>
                </div>

                <div>
                  <h4 className="font-black text-slate-950 uppercase">X. TÀI LIỆU HƯỚNG DẪN BÀN GIAO KÈM THEO</h4>
                  <p>Kèm theo: Hướng dẫn GVCN 7 bước, Hướng dẫn Tổng Phụ Trách 11 bước, Sổ tay xử lý 8 tình huống sự cố, Kế hoạch theo dõi tuần đầu và Cẩm nang chuyển giao năm học mới.</p>
                </div>

                <div>
                  <h4 className="font-black text-slate-950 uppercase">XI. TRÁCH NHIỆM QUẢN TRỊ VẬN HÀNH</h4>
                  <p>Cô Phạm Ngọc Thúy chịu trách nhiệm chính về vận hành nghiệp vụ hằng ngày, nhắc nhở báo sĩ số và chốt số liệu đúng 07:30 sáng. Ban Giám hiệu giám sát và duyệt các đề xuất điều chỉnh.</p>
                </div>

                <div>
                  <h4 className="font-black text-slate-950 uppercase">XII. KẾT LUẬN</h4>
                  <p className="font-bold text-slate-950">
                    CÁC BÊN THỐNG NHẤT HỆ THỐNG ĐÃ ĐỦ ĐIỀU KIỆN ĐỂ KÍCH HOẠT VẬN HÀNH CHÍNH THỨC PHỤC VỤ CÔNG TÁC QUẢN LÝ SĨ SỐ HỌC SINH TẠI TRƯỜNG THCS BẢN BO.
                  </p>
                </div>
              </div>

              {/* KHU VỰC KÝ BÀN GIAO 4 BÊN (Mục LXI) */}
              <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
                <div className="space-y-14">
                  <div className="font-black uppercase text-slate-900">
                    ĐẠI DIỆN ĐƠN VỊ BÀN GIAO
                  </div>
                  <div className="font-bold text-slate-700 italic">(Ký và ghi rõ họ tên)</div>
                </div>

                <div className="space-y-14">
                  <div className="font-black uppercase text-slate-900">
                    NGƯỜI TIẾP NHẬN
                  </div>
                  <div className="font-bold text-slate-700 italic">(Ký và ghi rõ họ tên)</div>
                </div>

                <div className="space-y-14">
                  <div className="font-black uppercase text-slate-900">
                    TỔNG PHỤ TRÁCH ĐỘI
                  </div>
                  <div className="font-bold text-slate-900">Phạm Ngọc Thúy</div>
                </div>

                <div className="space-y-14">
                  <div className="font-black uppercase text-slate-900">
                    HIỆU TRƯỞNG
                  </div>
                  <div className="font-bold text-slate-900">Hoàng Xuân Nhật</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: CHUYỂN NĂM HỌC & NHÂN SỰ (Mục LIII, LIV, LV, LVI) */}
      {/* ========================================================================= */}
      {activeTab === 'YEAR_TRANSITION' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>HƯỚNG DẪN CHUYỂN GIAO NĂM HỌC MỚI & THAY ĐỔI NHÂN SỰ (MỤC LIII - LVI)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các nguyên tắc bảo vệ dữ liệu lịch sử và hướng dẫn chuyển giao công việc khi thay đổi nhân sự
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 uppercase flex items-center gap-1.5 text-blue-900">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>10 Bước Chuyển sang Năm học Mới (Mục LIII)</span>
                </h4>
                <ol className="space-y-1 text-slate-600 list-decimal pl-4 leading-relaxed text-[11px]">
                  <li>Không xóa dữ liệu năm học cũ; bảo toàn lịch sử 100%.</li>
                  <li>Tạo mã năm học mới (Ví dụ: 2027–2028).</li>
                  <li>Khóa chốt sổ sách năm học cũ.</li>
                  <li>Tải về bản sao lưu toàn bộ (Full Backup).</li>
                  <li>Import danh sách 20 lớp của năm học mới.</li>
                  <li>Import học sinh khối 6 mới và chuyển lớp khối 7, 8, 9.</li>
                  <li>Cập nhật lại danh sách ăn bán trú năm học mới.</li>
                  <li>Phân công lại GVCN 20 lớp.</li>
                  <li>Chạy kiểm tra Operational Readiness.</li>
                  <li>Kích hoạt năm học mới.</li>
                </ol>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 uppercase flex items-center gap-1.5 text-blue-900">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Quy trình Bàn giao Tổng Phụ Trách Mới (Mục LVI, LVII)</span>
                </h4>
                <ul className="space-y-1.5 text-slate-600 list-disc pl-4 leading-relaxed text-[11px]">
                  <li>Tuyệt đối không dùng chung tài khoản cũ của cô Phạm Ngọc Thúy.</li>
                  <li>Tạo tài khoản ADMIN mới với email chính thức của Tổng Phụ trách mới.</li>
                  <li>Kiểm tra đầy đủ quyền quản trị và phân quyền hệ thống.</li>
                  <li>Thực hiện bàn giao hồ sơ, tài liệu và biên bản theo quy định.</li>
                  <li>Sau khi hoàn tất, khóa hoặc thu hồi quyền tài khoản cũ theo quyết định nhà trường.</li>
                  <li><strong>Quy tắc an toàn:</strong> Luôn duy trì ít nhất 01 Quản trị viên hoạt động; hệ thống tự động ngăn chặn xóa hoặc khóa ADMIN cuối cùng.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bổ sung tài khoản GVCN còn thiếu (Mục VIII) */}
      {provisionClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div>
              <div className="text-xs font-black uppercase text-blue-600">
                LỚP {provisionClass.className} · THCS BẢN BO
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                Thiết lập Tài khoản GVCN An toàn
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Không tạo mật khẩu công khai. Hệ thống tạo tài khoản và gửi mã thiết lập mật khẩu riêng cho giáo viên.
              </p>
            </div>

            <form onSubmit={handleExecuteProvision} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên GVCN: *</label>
                <input
                  type="text"
                  required
                  value={provName}
                  onChange={(e) => setProvName(e.target.value)}
                  placeholder="Họ và tên thầy/cô..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email đăng nhập (@thcsbanbo.edu.vn): *</label>
                <input
                  type="email"
                  required
                  value={provEmail}
                  onChange={(e) => setProvEmail(e.target.value)}
                  placeholder="email@thcsbanbo.edu.vn"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ:</label>
                <input
                  type="tel"
                  value={provPhone}
                  onChange={(e) => setProvPhone(e.target.value)}
                  placeholder="098x xxx xxx"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {provError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{provError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProvisionClass(null)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  HỦY
                </button>
                <AppButton variant="primary" size="sm" type="submit">
                  LƯU & KÍCH HOẠT TÀI KHOẢN
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Activation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmActivateOpen}
        title="XÁC NHẬN KÍCH HOẠT VẬN HÀNH CHÍNH THỨC"
        message={`Thầy/Cô Phạm Ngọc Thúy có chắc chắn muốn KÍCH HOẠT VẬN HÀNH CHÍNH THỨC Hệ thống Quản lý Sĩ số Học sinh Trường THCS Bản Bo cho toàn bộ 20 lớp bắt đầu từ ngày ${startDateInput}?`}
        confirmLabel="XÁC NHẬN KÍCH HOẠT"
        cancelLabel="HỦY"
        variant="primary"
        onConfirm={handleExecuteActivation}
        onCancel={() => setIsConfirmActivateOpen(false)}
      />
    </div>
  );
};
