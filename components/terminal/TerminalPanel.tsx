import React from 'react';

interface TerminalPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional Tailwind classes to apply. The component already includes
   * the base styles required for the Terminal Mono design system:
   *   - `bg-surface` for background
   *   - `border border-outline-dim` for the 1px border
   *   - `rounded-none` for zero radius
   *   - `text-text-main` for default text color
   */
  className?: string;
  children: React.ReactNode;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ className = '', children, ...rest }) => {
  const baseClasses =
    'bg-surface border border-outline-dim rounded-none p-4 text-text-main';
  return (
    <div className={`${baseClasses} ${className}`} {...rest}>
      {children}
    </div>
  );
};
