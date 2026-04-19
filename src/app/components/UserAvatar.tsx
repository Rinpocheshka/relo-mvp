

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  isGuide?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  badgeClassName?: string;
  rounded?: string;
  children?: React.ReactNode;
}

const sizeClasses = {
  'xs': 'w-6 h-6 text-[10px]',
  'sm': 'w-8 h-8 text-xs',
  'md': 'w-10 h-10 text-sm',
  'lg': 'w-12 h-12 text-base',
  'xl': 'w-14 h-14 text-lg',
  '2xl': 'w-16 h-16 text-xl',
  '3xl': 'w-24 h-24 text-2xl',
};

const badgeSizeClasses = {
  'xs': 'w-3 h-3',
  'sm': 'w-4.5 h-4.5',
  'md': 'w-5.5 h-5.5',
  'lg': 'w-6.5 h-6.5',
  'xl': 'w-8 h-8',
  '2xl': 'w-10 h-10',
  '3xl': 'w-12 h-12',
};

export function UserAvatar({ 
  src, 
  name, 
  isGuide, 
  size = 'md', 
  className = '',
  badgeClassName = '',
  rounded = 'rounded-full',
  children
}: UserAvatarProps) {
  const initials = (name || 'U').charAt(0).toUpperCase();
  const currentSizeClass = sizeClasses[size];
  const currentBadgeSizeClass = badgeSizeClasses[size];

  return (
    <div className={`relative shrink-0 ${currentSizeClass} ${rounded} ${className} bg-transparent`}>
      <div className={`w-full h-full flex items-center justify-center overflow-hidden border border-border/10 shadow-sm ${rounded} ${!src ? 'bg-soft-sand font-black text-dusty-indigo' : 'bg-transparent'}`}>
        {src ? (
          <img 
            src={src} 
            alt={name || 'User'} 
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
        {children}
      </div>

      {isGuide && (
        <div className={`absolute -bottom-1 -right-1 flex items-center justify-center ${currentBadgeSizeClass} ${badgeClassName}`}>
          <img src="/assets/icons/custom/guide_badge.png" className="w-full h-full object-contain" alt="Guide" />
        </div>
      )}
    </div>
  );
}
