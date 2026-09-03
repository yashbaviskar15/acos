import React from 'react';

export interface CardProps {
  className?: string;
  hover?: boolean;
  goldAccent?: boolean;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  className = '',
  hover = false,
  goldAccent = false,
  children,
}) => {
  return (
    <div
      className={[
        'bg-white dark:bg-brandObsidian-800 border',
        goldAccent
          ? 'border-brandGold-500/40'
          : 'border-slate-200 dark:border-brandObsidian-700',
        hover
          ? 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-brandGold-500/40'
          : 'shadow-card',
        'rounded-2xl',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  className?: string;
  children?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className = '',
  children,
}) => {
  return (
    <div
      className={['px-6 pt-6 pb-0', className].join(' ')}
    >
      {children}
    </div>
  );
};

export interface CardBodyProps {
  className?: string;
  children?: React.ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ({
  className = '',
  children,
}) => {
  return <div className={['p-6', className].join(' ')}>{children}</div>;
};

export interface CardFooterProps {
  className?: string;
  children?: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  className = '',
  children,
}) => {
  return (
    <div
      className={[
        'px-6 pb-6 pt-0',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
};
