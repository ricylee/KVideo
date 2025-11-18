/**
 * Watch History Sidebar Component
 * 观看历史侧边栏组件 - Main layout and state management
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useHistoryStore } from '@/lib/store/history-store';
import { Icons } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { HistoryItem } from './HistoryItem';
import { HistoryEmptyState } from './HistoryEmptyState';
import { trapFocus } from '@/lib/accessibility/focus-trap';

export function WatchHistorySidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { viewingHistory, removeFromHistory, clearHistory } = useHistoryStore();
  const sidebarRef = useRef<HTMLElement>(null);
  const cleanupFocusTrapRef = useRef<(() => void) | null>(null);

  // Setup focus trap when sidebar opens
  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      cleanupFocusTrapRef.current = trapFocus(sidebarRef.current);
    }

    return () => {
      if (cleanupFocusTrapRef.current) {
        cleanupFocusTrapRef.current();
        cleanupFocusTrapRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 bg-[var(--glass-bg)] backdrop-blur-[25px] saturate-[180%] border border-[var(--glass-border)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-md)] p-3 hover:scale-105 transition-all will-change-transform"
        style={{ transform: 'translate(0, -50%) translateZ(0)' }}
        aria-label="打开观看历史"
      >
        <Icons.History size={24} className="text-[var(--text-color)]" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[1999] bg-black/30 backdrop-blur-[5px] opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]"
          style={{ transform: 'translateZ(0)' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        role="complementary"
        aria-labelledby="history-sidebar-title"
        aria-hidden={!isOpen}
        style={{ 
          transform: isOpen ? 'translateX(0) translateZ(0)' : 'translateX(100%) translateZ(0)'
        }}
        className={`fixed top-0 right-0 bottom-0 w-[85%] sm:w-[90%] max-w-[420px] z-[2000] bg-[var(--glass-bg)] backdrop-blur-[25px] saturate-[180%] border-l border-[var(--glass-border)] rounded-tl-[var(--radius-2xl)] rounded-bl-[var(--radius-2xl)] p-6 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-transform duration-[400ms] cubic-bezier(0.2,0.8,0.2,1)`}
      >
        {/* Header */}
        <header className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-3">
            <Icons.History size={24} className="text-[var(--accent-color)]" />
            <h2 
              id="history-sidebar-title"
              className="text-xl font-semibold text-[var(--text-color)]"
            >
              观看历史
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-[var(--glass-bg)] rounded-full transition-colors"
            aria-label="关闭"
          >
            <Icons.X size={24} className="text-[var(--text-color-secondary)]" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {viewingHistory.length === 0 ? (
            <HistoryEmptyState />
          ) : (
            <div className="space-y-3">
              {viewingHistory.map((item) => (
                <HistoryItem
                  key={`${item.videoId}-${item.source}-${item.timestamp}`}
                  videoId={item.videoId}
                  source={item.source}
                  title={item.title}
                  poster={item.poster}
                  episodeIndex={item.episodeIndex}
                  episodes={item.episodes}
                  playbackPosition={item.playbackPosition}
                  duration={item.duration}
                  timestamp={item.timestamp}
                  onRemove={() => removeFromHistory(item.videoId, item.source)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {viewingHistory.length > 0 && (
          <footer className="mt-4 pt-4 border-t border-[var(--glass-border)]">
            <Button
              variant="secondary"
              onClick={clearHistory}
              className="w-full flex items-center justify-center gap-2"
            >
              <Icons.Trash size={18} />
              清空历史
            </Button>
          </footer>
        )}
      </aside>
    </>
  );
}
