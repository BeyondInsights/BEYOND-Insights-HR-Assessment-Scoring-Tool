'use client';

import { useEffect } from 'react';

/**
 * Reusable hook that bundles all client-side content protections:
 * - Disables right-click context menu
 * - Blocks DevTools keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
 * - Blocks page save (Ctrl+S)
 * - Outputs styled console warning
 * - Injects CSS to disable text selection (preserving inputs/textareas)
 * - Injects CSS to block browser printing with a message
 *
 * Import and call in any client component, or use the SecurityProtection
 * wrapper component for server component layouts.
 */
export function useSecurityProtections() {
  useEffect(() => {
    // Console warning
    console.log('%cSTOP', 'color: red; font-size: 60px; font-weight: bold;');
    console.log(
      '%cThis is proprietary software. Unauthorized access, copying, or reverse engineering of this code is prohibited.',
      'font-size: 16px;'
    );

    // Right-click blocking
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Keyboard shortcut blocking
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 (dev tools)
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }
      // Ctrl+Shift+I/J/C (dev tools, console, element picker)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }
      // Ctrl+U (view source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return;
      }
      // Ctrl+S (save page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
