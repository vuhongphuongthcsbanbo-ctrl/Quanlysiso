import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Loader2,
  ArrowLeft,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  readExcelFile,
  analyzeWorkbook,
  extractStudentsFromWorkbook,
  suggestColumnMapping,
  WorkbookAnalysis,
  ColumnMapping,
} from '../services/excelParserService';
import {
  ParsedStudentItem,
  OFFICIAL_CLASS_NAMES,
} from '../services/studentValidationService';
import {
  detectInternalDuplicates,
  DuplicateGroup,
} from '../services/studentDuplicateService';
import {
  excelImportService,
  ClassStudentBreakdown,
} from '../services/excelImportService';
import { supabaseService } from '../services/supabaseService';
import { WorkbookOverview } from '../components/admin/WorkbookOverview';
import { ColumnMappingStep } from '../components/admin/ColumnMappingStep';
import { ImportPreviewStep } from '../components/admin/ImportPreviewStep';
import { DuplicateReviewStep } from '../components/admin/DuplicateReviewStep';
import { BoardingAssignment } from '../components/admin/BoardingAssignment';
import { DatasetVerification } from '../components/admin/DatasetVerification';

type ImportStep =
  | 'SELECT_FILE'
  | 'WORKBOOK_OVERVIEW'
  | 'COLUMN_MAPPING'
  | 'DATA_PREVIEW'
  | 'DUPLICATE_REVIEW'
  | 'IMPORT_PROGRESS'
  | 'POST_IMPORT_BOARDING'
  | 'FINAL_VERIFY';

interface StudentImportPageProps {
  onNavigate?: (page: string) => void;
}

export const StudentImportPage: React.FC<StudentImportPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States quy trình
  const [currentStep, setCurrentStep] = useState<ImportStep>('SELECT_FILE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [analysis, setAnalysis] = useState<WorkbookAnalysis | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({ fullName: '' });

  // Dữ liệu học sinh
  const [parsedItems, setParsedItems] = useState<ParsedStudentItem[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [classBreakdowns, setClassBreakdowns] = useState<ClassStudentBreakdown[]>([]);

  // Tiến trình và thông báo
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [importResult, setImportResult] = useState<{ count: number; message: string } | null>(null);

  // Xử lý chọn file (.xls & .xlsx)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xls' && ext !== 'xlsx') {
      setErrorMessage('Chỉ hỗ trợ file Excel (.xls và .xlsx). Vui lòng chọn đúng file.');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);
    setIsLoading(true);
    setStatusMessage('Đang phân tích cấu trúc file Excel...');

    try {
      const wb = await readExcelFile(file);
      setWorkbook(wb);

      const ana = analyzeWorkbook(wb, file);
      setAnalysis(ana);
      setColumnMapping(ana.suggestedMapping);

      setIsLoading(false);
      setCurrentStep('WORKBOOK_OVERVIEW');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(`Không thể đọc file: ${err?.message || 'File hỏng hoặc không đúng định dạng'}`);
    }
  };

  // Chọn sheet khác nếu file có nhiều sheet
  const handleSelectSheet = (sheetName: string) => {
    if (!workbook || !selectedFile) return;
    const ana = analyzeWorkbook(workbook, selectedFile, sheetName);
    setAnalysis(ana);
    setColumnMapping(ana.suggestedMapping);
  };

  // Sau khi xem cấu trúc file, chuyển sang Bước Ánh xạ cột
  const handleProceedToMapping = () => {
    setCurrentStep('COLUMN_MAPPING');
  };

  // Sau khi hoàn thành ánh xạ, bắt đầu trích xuất học sinh & kiểm tra trùng
  const handleProceedToPreview = () => {
    if (!workbook || !analysis) return;

    setIsLoading(true);
    setStatusMessage('Đang đọc danh sách học sinh và kiểm tra hợp lệ...');

    setTimeout(() => {
      try {
        const items = extractStudentsFromWorkbook(
          workbook,
          columnMapping,
          '2026-2027',
          analysis.activeSheetName
        );

        // Kiểm tra trùng nội bộ
        setStatusMessage('Đang quét phát hiện trùng lặp...');
        const { duplicateGroups: dups, updatedItems } = detectInternalDuplicates(items);

        // Tính thống kê theo lớp
        const breakdowns = excelImportService.calculateClassBreakdowns(updatedItems);

        setParsedItems(updatedItems);
        setDuplicateGroups(dups);
        setClassBreakdowns(breakdowns);

        setIsLoading(false);
        setCurrentStep('DATA_PREVIEW');
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(`Lỗi phân tích dữ liệu: ${err?.message || 'Không xác định'}`);
      }
    }, 100);
  };

  // Cập nhật một học sinh sửa tay
  const handleUpdateItem = (updated: ParsedStudentItem) => {
    setParsedItems(prev => prev.map(it => (it.tempId === updated.tempId ? updated : it)));
    // Cập nhật lại thống kê các lớp
    const updatedAll = parsedItems.map(it => (it.tempId === updated.tempId ? updated : it));
    setClassBreakdowns(excelImportService.calculateClassBreakdowns(updatedAll));
  };

  // Xử lý các nhóm trùng
  const handleResolveDuplicateGroup = (
    groupId: string,
    res: 'KEEP_FIRST' | 'KEEP_SECOND' | 'KEEP_ALL' | 'SKIP_ALL'
  ) => {
    const group = duplicateGroups.find(g => g.id === groupId);
    if (!group) return;

    setParsedItems(prev => {
      return prev.map(item => {
        const inGroup = group.items.find(gi => gi.tempId === item.tempId);
        if (!inGroup) return item;

        const itemIndexInGroup = group.items.findIndex(gi => gi.tempId === item.tempId);

        if (res === 'KEEP_FIRST') {
          return itemIndexInGroup === 0
            ? { ...item, status: 'VALID', warnings: ['Đã giữ bản ghi 1 theo yêu cầu'] }
            : { ...item, status: 'ERROR', errors: ['Bản ghi trùng bị bỏ qua theo chỉ định'] };
        } else if (res === 'KEEP_SECOND') {
          return itemIndexInGroup === 1
            ? { ...item, status: 'VALID', warnings: ['Đã giữ bản ghi 2 theo yêu cầu'] }
            : { ...item, status: 'ERROR', errors: ['Bản ghi trùng bị bỏ qua theo chỉ định'] };
        } else if (res === 'KEEP_ALL') {
          return { ...item, status: 'VALID', warnings: ['Đã giữ cả hai theo yêu cầu ADMIN'] };
        } else {
          return { ...item, status: 'ERROR', errors: ['Đã bỏ qua cả hai bản ghi nghi trùng'] };
        }
      });
    });
  };

  // Bắt đầu ghi vào cơ sở dữ liệu (Atomic import)
  const handleExecuteImport = () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setStatusMessage('Đang lưu học sinh vào hệ thống...');

    const batch = {
      id: `batch_${Date.now()}`,
      fileName: selectedFile.name,
      schoolYearId: '2026-2027',
      uploadedBy: currentUser?.name || 'Phạm Ngọc Thúy',
      uploadedAt: new Date().toISOString(),
      totalRows: parsedItems.length,
      validRows: parsedItems.filter(it => it.status === 'VALID').length,
      warningRows: parsedItems.filter(it => it.status === 'WARNING').length,
      errorRows: parsedItems.filter(
        it => it.status === 'ERROR' || it.status === 'INVALID_CLASS' || it.status === 'INVALID_DOB'
      ).length,
      importedRows: 0,
      status: 'COMPLETED' as const,
    };

    setTimeout(() => {
      const res = excelImportService.commitImportStudents(
        parsedItems,
        batch,
        currentUser?.id || 'admin_tpt',
        currentUser?.name || 'Phạm Ngọc Thúy',
        'REPLACE_ALL'
      );

      setIsLoading(false);
      if (res.success) {
        setImportResult({ count: res.importedCount, message: res.message });

        // Tự động đồng bộ ngay lên Supabase đám mây
        supabaseService.pushAllToSupabase().catch(err => console.warn('Lỗi đồng bộ Supabase:', err));

        // Nếu còn học sinh chưa xác định diện Bán trú, chuyển sang bước Bán trú
        const hasUnset = parsedItems.some(it => it.boardingType === 'UNSET');
        if (hasUnset) {
          setCurrentStep('POST_IMPORT_BOARDING');
        } else {
          setCurrentStep('FINAL_VERIFY');
        }
      } else {
        setErrorMessage(res.message);
      }
    }, 300);
  };

  // Nạp nhanh bộ dữ liệu mẫu 20 lớp và chuyển ngay sang bước xác nhận & kích hoạt
  const handleLoadSampleDatasetAndVerify = () => {
    setIsLoading(true);
    setStatusMessage('Đang nạp bộ dữ liệu mẫu chuẩn 20 lớp (60 học sinh)...');
    setTimeout(() => {
      const res = excelImportService.loadSampleDatasetDirectly(
        currentUser?.id || 'admin_tpt',
        currentUser?.name || 'Phạm Ngọc Thúy'
      );
      setIsLoading(false);
      if (res.success) {
        setImportResult({ count: res.count, message: `Đã nạp thành công ${res.count} học sinh mẫu cho 20 lớp chính thức!` });
        // Tự động đồng bộ ngay lên Supabase đám mây
        supabaseService.pushAllToSupabase().catch(err => console.warn('Lỗi đồng bộ Supabase:', err));
        setCurrentStep('FINAL_VERIFY');
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Quản trị Dữ liệu · Trường THCS Bản Bo
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Nhập Danh Sách Học Sinh Thật Từ File Excel
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Hỗ trợ đầy đủ định dạng <strong>.xls</strong> (Excel cũ) và <strong>.xlsx</strong>. Tự động kiểm tra
              20 lớp, không tự đoán mò thông tin, đảm bảo an toàn dữ liệu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleLoadSampleDatasetAndVerify}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
              title="Nạp trực tiếp 60 học sinh mẫu cho 20 lớp để kiểm tra quy trình kích hoạt"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Nạp Thử 60 HS (20 Lớp)</span>
            </button>

            <button
              type="button"
              onClick={() => excelImportService.downloadSampleTemplate()}
              className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Tải File Excel Mẫu (20 Lớp)</span>
            </button>
          </div>
        </div>

        {/* Workflow Breadcrumbs */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          {[
            { id: 'SELECT_FILE', label: '1. Chọn file Excel' },
            { id: 'WORKBOOK_OVERVIEW', label: '2. Phân tích cấu trúc' },
            { id: 'COLUMN_MAPPING', label: '3. Ánh xạ cột' },
            { id: 'DATA_PREVIEW', label: '4. Xem trước & Kiểm tra' },
            { id: 'POST_IMPORT_BOARDING', label: '5. Thiết lập Bán trú' },
            { id: 'FINAL_VERIFY', label: '6. Kích hoạt chính thức' },
          ].map((step, idx) => {
            const isActive = currentStep === step.id;
            return (
              <React.Fragment key={step.id}>
                {idx > 0 && <span className="text-slate-300">/</span>}
                <span
                  className={`px-2.5 py-1 rounded font-semibold ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {step.label}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading Modal / State */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-blue-200 p-8 shadow-xs text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-800">{statusMessage}</p>
          <p className="text-xs text-slate-400">Vui lòng đợi giây lát, hệ thống đang xử lý...</p>
        </div>
      )}

      {/* STEP 1: SELECT FILE */}
      {currentStep === 'SELECT_FILE' && !isLoading && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8 text-center">
          <div className="max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Tải lên file danh sách học sinh toàn trường
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tương thích hoàn hảo với file <strong>“học sinh toàn trường.xls”</strong> hoặc bất kỳ file
                <strong> .xls / .xlsx</strong> nào của Trường THCS Bản Bo.
              </p>
            </div>

            {/* Drag & Drop Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/60 rounded-xl p-8 cursor-pointer transition-all space-y-3"
            >
              <Upload className="w-8 h-8 text-blue-500 mx-auto" />
              <div>
                <span className="text-sm font-bold text-blue-700">Nhấn vào đây để CHỌN FILE EXCEL</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Định dạng hỗ trợ: .xls, .xlsx</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Quick Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => excelImportService.downloadSampleTemplate()}
                className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Tải File Excel Mẫu (20 Lớp THCS Bản Bo)</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSampleDatasetAndVerify}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Nạp thử 60 học sinh mẫu 20 lớp & Kích hoạt</span>
              </button>
            </div>

            {/* Quick Principles Info */}
            <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Quy trình đảm bảo chuẩn xác dữ liệu:</span>
              </div>
              <div>• Không tự đoán tên, ngày sinh, giới tính hay diện bán trú.</div>
              <div>• Tự động quét và đối soát đủ 20 lớp (Khối 6, 7, 8, 9).</div>
              <div>• Cho phép xem trước, sửa lỗi và đối soát nghi trùng trước khi nhập chính thức.</div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: WORKBOOK OVERVIEW */}
      {currentStep === 'WORKBOOK_OVERVIEW' && analysis && !isLoading && (
        <WorkbookOverview
          analysis={analysis}
          onSelectSheet={handleSelectSheet}
          onProceed={handleProceedToMapping}
        />
      )}

      {/* STEP 3: COLUMN MAPPING */}
      {currentStep === 'COLUMN_MAPPING' && analysis && !isLoading && (
        <ColumnMappingStep
          headers={analysis.headers}
          mapping={columnMapping}
          onUpdateMapping={setColumnMapping}
          onBack={() => setCurrentStep('WORKBOOK_OVERVIEW')}
          onNext={handleProceedToPreview}
        />
      )}

      {/* STEP 4: DATA PREVIEW & VALIDATION */}
      {currentStep === 'DATA_PREVIEW' && !isLoading && (
        <ImportPreviewStep
          items={parsedItems}
          classBreakdowns={classBreakdowns}
          onUpdateItem={handleUpdateItem}
          onBack={() => setCurrentStep('COLUMN_MAPPING')}
          onProceedToConfirmation={() => {
            if (duplicateGroups.length > 0) {
              setCurrentStep('DUPLICATE_REVIEW');
            } else {
              handleExecuteImport();
            }
          }}
        />
      )}

      {/* DUPLICATE CANDIDATE REVIEW */}
      {currentStep === 'DUPLICATE_REVIEW' && !isLoading && (
        <DuplicateReviewStep
          groups={duplicateGroups}
          onResolveGroup={handleResolveDuplicateGroup}
          onProceed={handleExecuteImport}
          onBack={() => setCurrentStep('DATA_PREVIEW')}
        />
      )}

      {/* STEP 5: POST IMPORT BOARDING ASSIGNMENT */}
      {currentStep === 'POST_IMPORT_BOARDING' && !isLoading && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {importResult?.message || 'Đã nhập thành công học sinh vào cơ sở dữ liệu!'} Tiếp theo, vui lòng
                thiết lập học sinh Bán trú theo danh sách được duyệt.
              </span>
            </div>
            <button
              onClick={() => setCurrentStep('FINAL_VERIFY')}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs cursor-pointer"
            >
              Chuyển sang Bước Kích hoạt →
            </button>
          </div>

          <BoardingAssignment onCompleted={() => {}} />
        </div>
      )}

      {/* STEP 6: FINAL VERIFY & DATASET ACTIVATION */}
      {currentStep === 'FINAL_VERIFY' && !isLoading && (
        <DatasetVerification
          key={`dataset_verify_${importResult?.count || 'fresh'}`}
          onDatasetActivated={() => {
            if (onNavigate) {
              setTimeout(() => {
                onNavigate('students');
              }, 1600);
            }
          }}
          onNavigateToImport={() => setCurrentStep('SELECT_FILE')}
        />
      )}
    </div>
  );
};
