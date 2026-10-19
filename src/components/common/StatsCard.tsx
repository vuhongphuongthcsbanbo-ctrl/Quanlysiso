import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  subValue?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate' | 'indigo';
  onClick?: () => void;
  highlight?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subValue,
  icon: Icon,
  variant = 'blue',
  onClick,
  highlight,
}) => {
  const variantStyles = {
    blue: {
      border: 'border-blue-100 hover:border-blue-200',
      iconBg: 'bg-blue-50 text-blue-700',
      valueColor: 'text-blue-950',
    },
    emerald: {
      border: 'border-emerald-100 hover:border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-700',
      valueColor: 'text-emerald-950',
    },
    amber: {
      border: 'border-amber-100 hover:border-amber-200',
      iconBg: 'bg-amber-50 text-amber-700',
      valueColor: 'text-amber-950',
    },
    rose: {
      border: 'border-rose-100 hover:border-rose-200',
      iconBg: 'bg-rose-50 text-rose-700',
      valueColor: 'text-rose-950',
    },
    purple: {
      border: 'border-purple-100 hover:border-purple-200',
      iconBg: 'bg-purple-50 text-purple-700',
      valueColor: 'text-purple-950',
    },
    indigo: {
      border: 'border-indigo-100 hover:border-indigo-200',
      iconBg: 'bg-indigo-50 text-indigo-700',
      valueColor: 'text-indigo-950',
    },
    slate: {
      border: 'border-slate-100 hover:border-slate-200',
      iconBg: 'bg-slate-100 text-slate-700',
      valueColor: 'text-slate-900',
    },
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-3.5 sm:p-4 border shadow-xs transition-all ${
        variantStyles.border
      } ${onClick ? 'cursor-pointer hover:shadow-md active:scale-99' : ''} ${
        highlight ? 'ring-2 ring-rose-500 bg-rose-50/20' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider line-clamp-1">
          {title}
        </span>
        <div className={`p-2 rounded-lg shrink-0 ${variantStyles.iconBg}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${variantStyles.valueColor}`}>
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-slate-500 font-medium">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};
