import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { APP_CONFIG } from '../config';
import { cn } from '../lib/utils';

export const Logo: React.FC<{ className?: string }> = ({ className }) =>
  APP_CONFIG.logoUrl ? (
    <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.institution} className={cn('object-contain rounded-full', className)} />
  ) : (
    <div className={cn('rounded-md bg-primary-700 text-white flex items-center justify-center', className)}>
      <ShieldCheck className="w-3/5 h-3/5" strokeWidth={1.75} />
    </div>
  );

const BrandMark: React.FC<{ inverted?: boolean }> = ({ inverted = false }) => (
  <div className="flex items-center gap-3 min-w-0">
    <Logo className="w-9 h-9 flex-shrink-0" />
    <div className="min-w-0 leading-tight">
      <div className={cn('text-body-sm font-semibold truncate', inverted ? 'text-white' : 'text-neutral-900')}>
        {APP_CONFIG.appShortName}
      </div>
      <div className={cn('text-caption', inverted ? 'text-primary-200' : 'text-neutral-500')}>
        {APP_CONFIG.department}
      </div>
    </div>
  </div>
);

export default BrandMark;
