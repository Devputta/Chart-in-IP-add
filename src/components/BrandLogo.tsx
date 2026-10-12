import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withBorder?: boolean;
}

const LOCAL_LOGO = '/cipherlink-logo.jpg';
const REMOTE_LOGO =
  'https://raw.githubusercontent.com/Devputta/Drafts-might-be-needed-/main/LOGO/Gemini_Generated_Image_1ppnm1ppnm1ppnm1%20(1).jfif';

const sizeMap = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  withBorder = true,
}) => {
  const [src, setSrc] = useState(LOCAL_LOGO);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (src !== REMOTE_LOGO) {
      setSrc(REMOTE_LOGO);
    } else {
      setHasError(true);
    }
  };

  const dimensionClass = sizeMap[size] || sizeMap.md;
  const borderClass = withBorder
    ? 'ring-1 ring-[#27323F] shadow-sm'
    : '';

  if (hasError) {
    return (
      <div
        className={`${dimensionClass} rounded-lg bg-[#10B981] text-[#022c22] flex items-center justify-center font-mono font-bold text-xs uppercase tracking-wider ${borderClass} ${className}`}
      >
        CL
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="CipherLink Logo"
      onError={handleError}
      className={`${dimensionClass} rounded-lg object-cover bg-[#151B22] ${borderClass} ${className}`}
      loading="eager"
    />
  );
};
