import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Lock,
  FileCheck,
  Building2,
  GraduationCap,
  School,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Loader2,
  X,
  Upload,
} from 'lucide-react';
import { SessionType, ReportStatus, AttendanceItemStatus } from '../types';

/* ==========================================================================
   DESIGN SYSTEM - TRƯỜNG THCS BẢN BO
   Theme: School Navy (#1e3a8a), Emerald Success, Amber Warning, Rose Danger
   ========================================================================== */

// 1. BUTTON COMPONENT
export interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  startIcon,
  endIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all select-none cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-[11px] gap-1.5',
    sm: 'px-3 py-2 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-xs sm:text-sm gap-2',
    lg: 'px-5 py-3 text-sm sm:text-base gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-blue-800 hover:bg-blue-900 text-white shadow-xs focus:ring-blue-500 border border-transparent',
    secondary:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs focus:ring-slate-400',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-emerald-500 border border-transparent',
    warning:
      'bg-amber-500 hover:bg-amber-600 text-amber-950 font-black shadow-xs focus:ring-amber-400 border border-transparent',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500 border border-transparent',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent focus:ring-slate-300',
    link:
      'bg-transparent text-blue-700 hover:text-blue-900 underline-offset-4 hover:underline p-0 h-auto font-semibold focus:ring-0 active:scale-100',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{loadingText || 'Đang xử lý...'}</span>
        </>
      ) : (
        <>
          {startIcon && <span className="shrink-0">{startIcon}</span>}
          <span>{children}</span>
          {endIcon && <span className="shrink-0">{endIcon}</span>}
        </>
      )}
    </button>
  );
};

// 2. INPUT COMPONENT
export interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  helperText,
  errorText,
  startIcon,
  endIcon,
  fullWidth = true,
  className = '',
  id,
  required,
  ...props
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`${fullWidth ? 'w-full' : ''} space-y-1`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
        >
          {label}
          {required && <span className="text-rose-600 ml-1 font-black">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-2xs">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {startIcon}
          </div>
        )}

        <input
          id={inputId}
          required={required}
          className={`block w-full rounded-xl border text-slate-900 bg-white placeholder-slate-400 transition-all text-xs sm:text-sm py-2.5 ${
            startIcon ? 'pl-9' : 'pl-3'
          } ${endIcon ? 'pr-9' : 'pr-3'} ${
            errorText
              ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
              : 'border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
          } ${className}`}
          {...props}
        />

        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
            {endIcon}
          </div>
        )}
      </div>

      {errorText && (
        <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorText}</span>
        </p>
      )}

      {!errorText && helperText && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

// 3. CARD COMPONENT
export interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  highlight?: 'none' | 'primary' | 'success' | 'warning' | 'danger';
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  highlight = 'none',
  className = '',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6',
  };

  const variantClasses = {
    default: 'bg-white border border-slate-200/90 rounded-2xl shadow-2xs',
    elevated: 'bg-white border border-slate-200/80 rounded-2xl shadow-md',
    bordered: 'bg-white border-2 border-slate-200 rounded-2xl shadow-none',
    flat: 'bg-slate-50 border border-slate-200 rounded-2xl shadow-none',
  };

  const highlightClasses = {
    none: '',
    primary: 'border-l-4 border-l-blue-700',
    success: 'border-l-4 border-l-emerald-600',
    warning: 'border-l-4 border-l-amber-500',
    danger: 'border-l-4 border-l-rose-600',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${highlightClasses[highlight]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// 4. STATUS BADGE COMPONENT
export interface StatusBadgeProps {
  status: ReportStatus | AttendanceItemStatus | string;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const normalized = (status || '').toString().toUpperCase();

  let label = 'Chưa xác định';
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let IconComponent: React.ComponentType<{ className?: string }> = HelpCircle;

  switch (normalized) {
    // Báo cáo sĩ số
    case 'NOT_SUBMITTED':
    case 'NOT_REPORTED':
      label = 'CHƯA BÁO CÁO';
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300 font-bold';
      IconComponent = Clock;
      break;

    case 'PENDING_APPROVAL':
    case 'SUBMITTED':
      label = 'CHỜ DUYỆT';
      badgeStyle = 'bg-amber-50 text-amber-900 border-amber-300 font-black';
      IconComponent = Clock;
      break;

    case 'REVISION_REQUIRED':
    case 'NEEDS_REVISION':
      label = 'CẦN CHỈNH SỬA';
      badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300 font-black';
      IconComponent = AlertTriangle;
      break;

    case 'APPROVED':
      label = 'ĐÃ DUYỆT';
      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black';
      IconComponent = CheckCircle2;
      break;

    case 'LOCKED':
      label = 'ĐÃ CHỐT';
      badgeStyle = 'bg-blue-900 text-white border-blue-950 font-black';
      IconComponent = Lock;
      break;

    case 'OVERDUE':
      label = 'QUÁ HẠN';
      badgeStyle = 'bg-red-100 text-red-900 border-red-300 font-black animate-pulse';
      IconComponent = AlertCircle;
      break;

    // Điểm danh từng học sinh
    case 'PRESENT':
      label = 'Có mặt';
      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
      IconComponent = CheckCircle2;
      break;

    case 'ABSENT_EXCUSED':
      label = 'Vắng có phép';
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
      IconComponent = AlertCircle;
      break;

    case 'ABSENT_UNEXCUSED':
      label = 'Vắng không phép';
      badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200 font-black';
      IconComponent = XCircle;
      break;

    case 'LATE':
      label = 'Đi muộn';
      badgeStyle = 'bg-purple-50 text-purple-800 border-purple-200 font-bold';
      IconComponent = Clock;
      break;

    case 'EARLY_LEAVE':
      label = 'Về sớm';
      badgeStyle = 'bg-indigo-50 text-indigo-800 border-indigo-200 font-bold';
      IconComponent = Clock;
      break;

    default:
      label = status;
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
      IconComponent = InfoIcon;
      break;
  }

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-[11px] px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3 py-1.5 gap-1.5',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border tracking-tight select-none ${badgeStyle} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <IconComponent className={`${iconSizes[size]} shrink-0`} />}
      <span>{label}</span>
    </span>
  );
};

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>•</span>
);

// 5. CONFIRM DIALOG COMPONENT
export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'XÁC NHẬN',
  cancelLabel = 'HỦY',
  variant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const iconMap = {
    danger: <XCircle className="w-10 h-10 text-rose-600 mx-auto" />,
    warning: <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />,
    primary: <CheckCircle2 className="w-10 h-10 text-blue-600 mx-auto" />,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm sm:max-w-md w-full p-5 sm:p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
        <div className="p-3 bg-slate-50 rounded-2xl inline-block border border-slate-100">
          {iconMap[variant]}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase">
            {title}
          </h3>
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {message}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2.5 pt-2">
          <AppButton
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </AppButton>
          <AppButton
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmLabel}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

// 6. EMPTY STATE COMPONENT
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success';
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="p-8 text-center space-y-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center mx-auto">
        {icon || <Building2 className="w-6 h-6" />}
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
      </div>
      {action && (
        <div className="pt-1">
          <AppButton
            size="sm"
            variant={action.variant || 'primary'}
            onClick={action.onClick}
          >
            {action.label}
          </AppButton>
        </div>
      )}
    </div>
  );
};

// 7. ERROR STATE COMPONENT
export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Không thể tải dữ liệu',
  message = 'Đã có sự cố khi kết nối tới hệ thống. Vui lòng thử lại.',
  onRetry,
}) => {
  return (
    <div className="p-8 text-center space-y-3 bg-rose-50/50 rounded-2xl border border-rose-200 shadow-2xs max-w-md mx-auto my-6">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-rose-900">{title}</h4>
        <p className="text-xs text-rose-700 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <div className="pt-2">
          <AppButton size="sm" variant="danger" onClick={onRetry}>
            THỬ LẠI
          </AppButton>
        </div>
      )}
    </div>
  );
};

// 8. SKELETON LOADING COMPONENT
export interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'kpi' | 'list';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'card',
  count = 3,
}) => {
  const items = Array.from({ length: count });

  if (type === 'kpi') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 animate-pulse">
        {items.map((_, i) => (
          <div key={i} className="bg-slate-200 rounded-2xl h-24" />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl" />
        {items.map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-pulse">
      {items.map((_, i) => (
        <div key={i} className="bg-slate-100 rounded-2xl p-4 space-y-2 border border-slate-200">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-200 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
};

// 9. SCHOOL LOGO COMPONENT
export interface SchoolLogoProps {
  logoUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  logoUrl,
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Logo Trường THCS Bản Bo"
        className={`object-contain bg-white shadow-2xs border border-slate-200 ${sizeMap[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-blue-900 to-indigo-950 text-amber-300 flex items-center justify-center font-bold shadow-2xs border border-white/20 shrink-0 ${sizeMap[size]} ${className}`}
      title="Biểu trưng giáo dục Trường THCS Bản Bo"
    >
      <School className={iconSizes[size]} />
    </div>
  );
};
