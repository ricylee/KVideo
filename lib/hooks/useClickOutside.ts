/**
 * useClickOutside Hook
 * 点击外部关闭 Hook - 检测元素外部的点击事件
 * 
 * 遵循 Liquid Glass 设计系统原则：
 * - 可访问性优先（支持 Escape 键关闭）
 * - 性能优化（使用事件委托）
 * - 触摸设备友好
 */

'use client';

import { RefObject, useEffect } from 'react';

/**
 * 使用点击外部关闭 Hook
 * @param ref - 要监听的元素引用
 * @param handler - 点击外部时触发的回调函数
 * @param enabled - 是否启用监听（默认为 true）
 * 
 * @example
 * ```tsx
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const dropdownRef = useRef<HTMLDivElement>(null);
 * 
 *   useClickOutside(dropdownRef, () => {
 *     setIsOpen(false);
 *   });
 * 
 *   return (
 *     <div ref={dropdownRef}>
 *       <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
 *       {isOpen && <div>Dropdown Content</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    // 如果未启用或 ref 未挂载，则不执行
    if (!enabled || !ref.current) {
      return;
    }

    /**
     * 处理点击事件
     * 检查点击目标是否在元素外部
     */
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // 如果点击的目标不在 ref 元素内部，触发 handler
      if (ref.current && !ref.current.contains(target)) {
        handler();
      }
    };

    /**
     * 处理 Escape 键
     * 增强可访问性，允许键盘用户关闭
     */
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handler();
      }
    };

    // 延迟添加事件监听器，避免立即触发
    // 这样可以防止触发 handler 的同时又注册监听器导致立即关闭
    const timeoutId = setTimeout(() => {
      // 监听鼠标点击和触摸事件
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      // 监听 Escape 键
      document.addEventListener('keydown', handleEscapeKey);
    }, 0);

    // 清理函数
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [ref, handler, enabled]);
}

/**
 * 扩展版本：支持多个引用
 * 当需要排除多个元素时使用
 * 
 * @example
 * ```tsx
 * function DropdownWithTrigger() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const dropdownRef = useRef<HTMLDivElement>(null);
 *   const triggerRef = useRef<HTMLButtonElement>(null);
 * 
 *   useClickOutsideMultiple([dropdownRef, triggerRef], () => {
 *     setIsOpen(false);
 *   });
 * 
 *   return (
 *     <>
 *       <button ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
 *         Toggle
 *       </button>
 *       {isOpen && (
 *         <div ref={dropdownRef}>Dropdown Content</div>
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useClickOutsideMultiple<T extends HTMLElement = HTMLElement>(
  refs: RefObject<T>[],
  handler: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // 检查点击是否在任何一个 ref 元素内部
      const isClickInside = refs.some(ref => 
        ref.current && ref.current.contains(target)
      );
      
      // 如果点击在所有元素外部，触发 handler
      if (!isClickInside) {
        handler();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handler();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [refs, handler, enabled]);
}
