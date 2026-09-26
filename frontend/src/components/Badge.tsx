import React from 'react';

interface BadgeProps {
  status: string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  let colorStyle = 'bg-gray-100 text-gray-800 border-gray-200';

  switch (status?.toUpperCase()) {
    case 'DONE':
    case 'NORMAL':
      colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'WAITING':
    case 'READY':
    case 'LOW_STOCK':
      colorStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'DRAFT':
      colorStyle = 'bg-slate-100 text-slate-700 border-slate-300';
      break;
    case 'CANCELED':
    case 'OUT_OF_STOCK':
      colorStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'RECEIPT':
      colorStyle = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'DELIVERY':
      colorStyle = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'TRANSFER':
      colorStyle = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      break;
    case 'ADJUSTMENT':
      colorStyle = 'bg-orange-50 text-orange-700 border-orange-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyle}`}>
      {status}
    </span>
  );
};
