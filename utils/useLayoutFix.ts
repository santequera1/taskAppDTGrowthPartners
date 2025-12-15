import { useEffect, useState, useCallback } from 'react';
import { getLayoutClasses } from './layoutHelpers';

/**
 * Custom hook to fix layout issues with header width and horizontal scrolling
 * Ensures the header stays fixed while content scrolls horizontally
 */
export const useLayoutFix = (isMobile: boolean, isSidebarCollapsed: boolean) => {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [shouldScroll, setShouldScroll] = useState<boolean>(false);

  // Update container width
  const updateContainerWidth = useCallback(() => {
    if (typeof window !== 'undefined') {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        const width = mainElement.clientWidth;
        setContainerWidth(width);
        
        // Check if horizontal scrolling should be enabled
        const columns = document.querySelectorAll('[data-column]');
        const columnCount = columns.length;
        const minColumnWidth = 280;
        const gapWidth = 24;
        const totalRequiredWidth = (columnCount * minColumnWidth) + ((columnCount - 1) * gapWidth);
        
        setShouldScroll(totalRequiredWidth > width);
      }
    }
  }, []);

  useEffect(() => {
    // Initial measurement
    updateContainerWidth();

    // Listen for resize events
    window.addEventListener('resize', updateContainerWidth);
    
    // Listen for column count changes (when new columns are added)
    const observer = new MutationObserver(() => {
      setTimeout(updateContainerWidth, 100); // Small delay to allow DOM updates
    });

    // Observe the main content area for column additions
    const mainElement = document.querySelector('main');
    if (mainElement) {
      observer.observe(mainElement, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener('resize', updateContainerWidth);
      observer.disconnect();
    };
  }, [updateContainerWidth]);

  // Force re-layout when mobile state or sidebar state changes
  useEffect(() => {
    setTimeout(updateContainerWidth, 100);
  }, [isMobile, isSidebarCollapsed, updateContainerWidth]);

  // Get layout classes
  const layoutClasses = getLayoutClasses(isMobile, isSidebarCollapsed);

  // Function to force header refresh (useful after adding columns)
  const refreshLayout = useCallback(() => {
    // Force a layout recalculation
    const header = document.querySelector('header');
    if (header) {
      header.style.transform = 'translateZ(0)'; // Trigger GPU acceleration
      setTimeout(() => {
        header.style.transform = '';
      }, 10);
    }
    
    // Update container measurements
    updateContainerWidth();
  }, [updateContainerWidth]);

  return {
    containerWidth,
    shouldScroll,
    layoutClasses,
    refreshLayout
  };
};

export default useLayoutFix;