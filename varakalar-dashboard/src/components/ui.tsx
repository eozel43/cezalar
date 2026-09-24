import React from 'react';
import { cn } from '../lib/utils';

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn('bg-background-surface rounded-lg border border-neutral-200 shadow-sm', className)}>
    {children}
  </div>
);

interface CardHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, description, actions }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-neutral-200">
    <div>
      <h3 className="text-heading-sm text-neutral-900">{title}</h3>
      {description && <p className="text-body-sm text-neutral-500 mt-0.5">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 no-print">{actions}</div>}
  </div>
);

export const SourceNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="px-5 py-3 border-t border-neutral-100 text-caption text-neutral-500">{children}</p>
);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 border border-primary-600',
  secondary: 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300',
  ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 border border-transparent',
  danger: 'bg-white text-semantic-error hover:bg-red-50 border border-neutral-300',
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md' }
> = ({ variant = 'secondary', size = 'md', className, ...props }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      size === 'sm' ? 'h-8 px-3 text-body-sm' : 'h-9 px-4 text-body',
      buttonVariants[variant],
      className
    )}
    {...props}
  />
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-md bg-neutral-200/70', className)} />
);

export const PageHeader: React.FC<{ title: string; description?: string; actions?: React.ReactNode }> = ({
  title,
  description,
  actions,
}) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
    <div>
      <h1 className="text-heading-lg text-neutral-900">{title}</h1>
      {description && <p className="text-body text-neutral-500 mt-1">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 no-print">{actions}</div>}
  </div>
);

export const EmptyState: React.FC<{ title: string; description?: string; icon?: React.ReactNode }> = ({
  title,
  description,
  icon,
}) => (
  <div className="py-12 text-center">
    {icon && <div className="mx-auto mb-3 w-10 h-10 text-neutral-400 flex items-center justify-center">{icon}</div>}
    <p className="text-body font-medium text-neutral-700">{title}</p>
    {description && <p className="text-body-sm text-neutral-500 mt-1">{description}</p>}
  </div>
);
