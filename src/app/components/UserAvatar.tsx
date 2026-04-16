import { Star } from 'lucide-react';

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
  'xs': 'w-2.5 h-2.5 p-0.5',
  'sm': 'w-3.5 h-3.5 p-0.5',
  'md': 'w-4 h-4 p-0.5',
  'lg': 'w-4.5 h-4.5 p-0.5',
  'xl': 'w-5 h-5 p-0.5',
  '2xl': 'w-6 h-6 p-1',
  '3xl': 'w-8 h-8 p-1',
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
        <div className={`absolute -bottom-0.5 -right-0.5 rounded-full bg-white shadow-md border border-border/10 flex items-center justify-center ${currentBadgeSizeClass} ${badgeClassName}`}>
          <Star className="w-full h-full text-yellow-500 fill-yellow-500" />
        </div>
      )}
    </div>
  );
}
