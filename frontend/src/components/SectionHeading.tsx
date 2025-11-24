import React from 'react';

interface SectionHeadingProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  gradient?: boolean;
  className?: string;
}

// Standardized heading component for consistent typography & optional brand gradient
// Usage: <SectionHeading gradient>Title</SectionHeading>
// Sizes: Top-level pages can wrap in parent with desired spacing.
export const SectionHeading: React.FC<SectionHeadingProps> = ({
  children,
  as = 'h2',
  gradient = false,
  className = ''
}) => {
  const Tag = as as any;
  const base = 'font-bold tracking-tight';
  const size = as === 'h1' ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl';
  const gradientClass = gradient ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent' : 'text-neutral-900 dark:text-neutral-100';

  return <Tag className={`${base} ${size} ${gradientClass} ${className}`.trim()}>{children}</Tag>;
};

export default SectionHeading;
