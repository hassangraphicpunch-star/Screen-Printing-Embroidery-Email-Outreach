import React from 'react';
import { Users, CheckCircle, AlertTriangle, Send, Clock } from 'lucide-react';
import { BusinessContact } from '../types';

interface StatsCardsProps {
  contacts: BusinessContact[];
  activeFilter: string;
  onFilterChange: (filter: 'all' | 'valid' | 'invalid' | 'sent' | 'pending') => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  contacts,
  activeFilter,
  onFilterChange,
}) => {
  const total = contacts.length;
  const valid = contacts.filter((c) => c.isValidEmail).length;
  const invalid = contacts.filter((c) => !c.isValidEmail).length;
  const sent = contacts.filter((c) => c.sendStatus === 'sent').length;
  const pending = contacts.filter((c) => c.isValidEmail && c.sendStatus !== 'sent').length;

  const cards = [
    {
      id: 'all',
      title: 'Total Businesses',
      value: total,
      icon: Users,
      color: 'text-slate-700 dark:text-slate-200',
      bgColor: 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700',
      activeBorder: 'ring-2 ring-indigo-500',
      description: 'Imported from Excel',
    },
    {
      id: 'valid',
      title: 'Valid Email Addresses',
      value: valid,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40',
      activeBorder: 'ring-2 ring-emerald-500',
      description: 'Ready for outreach',
    },
    {
      id: 'invalid',
      title: 'Missing / Invalid Email',
      value: invalid,
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40',
      activeBorder: 'ring-2 ring-amber-500',
      description: 'Needs email verification',
    },
    {
      id: 'sent',
      title: 'Emails Sent',
      value: sent,
      icon: Send,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40',
      activeBorder: 'ring-2 ring-blue-500',
      description: 'Successfully delivered',
    },
    {
      id: 'pending',
      title: 'Pending Queue',
      value: pending,
      icon: Clock,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/40',
      activeBorder: 'ring-2 ring-indigo-500',
      description: 'Ready to send',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            id={`stat-card-${card.id}`}
            onClick={() => onFilterChange(card.id as any)}
            className={`p-3.5 rounded-xl border text-left transition-all ${card.bgColor} ${
              isActive ? `${card.activeBorder} shadow-md` : 'hover:border-slate-400 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-2xl font-black tracking-tight ${card.color}`}>{card.value}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {card.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};
