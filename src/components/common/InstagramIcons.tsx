import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  fill?: string;
  variant?: 'outline' | 'filled' | 'gradient';
}

/**
 * Authentic Instagram Camera Glyph Icon
 * The iconic squircle with center lens circle and top-right flash dot.
 */
export const InstagramCameraIcon: React.FC<IconProps> = ({
  size = 24,
  className = '',
  variant = 'outline',
}) => {
  if (variant === 'gradient') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="instaIconGradient" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="5.5"
          stroke="url(#instaIconGradient)"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="12"
          r="4.2"
          stroke="url(#instaIconGradient)"
          strokeWidth="2"
        />
        <circle cx="17.5" cy="6.5" r="1.2" fill="url(#instaIconGradient)" />
      </svg>
    );
  }

  if (variant === 'filled') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="6"
          fill="currentColor"
        />
        <circle
          cx="12"
          cy="12"
          r="4.2"
          stroke="currentColor"
          strokeWidth="2"
          className="stroke-white dark:stroke-black"
        />
        <circle
          cx="17.5"
          cy="6.5"
          r="1.2"
          className="fill-white dark:fill-black"
        />
      </svg>
    );
  }

  // Outline variant (classic stroke)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" />
    </svg>
  );
};

/**
 * Instagram Script Wordmark
 * Rendered using authentic fluid typography and vector styling
 */
export const InstagramWordmark: React.FC<{
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ text = '100gram', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <span
      className={`font-insta-logo select-none tracking-tight font-normal leading-none inline-block ${sizeClasses[size]} ${className}`}
      style={{
        fontFamily: "'Grand Hotel', 'Billabong', cursive, sans-serif",
      }}
    >
      {text}
    </span>
  );
};

/**
 * Instagram Verified Blue Badge Checkmark
 */
export const InstagramVerifiedBadge: React.FC<{ size?: number; className?: string }> = ({
  size = 14,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 ${className}`}
    >
      <path
        d="M12 2L14.28 4.28L17.5 4.5L18.25 7.62L21.03 9.47L20.25 12.62L21.84 15.44L19.5 17.5L18.5 20.62L15.38 21.03L13.53 23.81L10.38 23.03L7.56 24.62L5.5 22.28L2.38 21.28L2.79 18.16L0 16.31L1.59 13.47L0.81 10.32L3.15 8.25L4.15 5.13L7.27 4.72L9.12 1.94L12 2Z"
        fill="#0095F6"
      />
      <path
        d="M9.5 16.2L5.8 12.5L7.2 11.1L9.5 13.4L16.8 6.1L18.2 7.5L9.5 16.2Z"
        fill="white"
      />
    </svg>
  );
};
