'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icon';

interface TypeBadge {
  type: string;
  count: number;
}

interface TypeBadgesProps {
  badges: TypeBadge[];
  selectedTypes: Set<string>;
  onToggleType: (type: string) => void;
  className?: string;
}

/**
 * TypeBadges - Displays collected type badges from search results
 * Auto-collects unique type_name values and shows counts
 * Badges disappear when all videos of that type are removed
 */
export function TypeBadges({ 
  badges, 
  selectedTypes,
  onToggleType,
  className = '' 
}: TypeBadgesProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <Card 
      hover={false} 
      className={`p-4 animate-fade-in ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <Icons.Tag size={16} className="text-[var(--accent-color)]" />
          <span className="text-sm font-semibold text-[var(--text-color)]">
            分类标签 ({badges.length}):
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {badges.map((badge) => {
            const isSelected = selectedTypes.has(badge.type);
            
            return (
              <button
                key={badge.type}
                onClick={() => onToggleType(badge.type)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 
                  border border-[var(--glass-border)]
                  text-xs font-medium
                  transition-all duration-[var(--transition-fluid)]
                  hover:scale-105 hover:shadow-[var(--shadow-sm)]
                  active:scale-95
                  ${isSelected 
                    ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)]' 
                    : 'bg-[var(--glass-bg)] text-[var(--text-color)] backdrop-blur-[10px]'
                  }
                `}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                <span>{badge.type}</span>
                <span className={`
                  px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                  ${isSelected 
                    ? 'bg-white/20 text-white' 
                    : 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]'
                  }
                `}>
                  {badge.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {selectedTypes.size > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--glass-border)]">
          <button
            onClick={() => selectedTypes.forEach(type => onToggleType(type))}
            className="text-xs text-[var(--text-color-secondary)] hover:text-[var(--accent-color)] 
                     flex items-center gap-1 transition-colors"
          >
            <Icons.X size={12} />
            清除筛选 ({selectedTypes.size})
          </button>
        </div>
      )}
    </Card>
  );
}
