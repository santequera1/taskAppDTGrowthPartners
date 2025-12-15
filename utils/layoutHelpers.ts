/**
 * Layout utility functions to maintain consistent header and content sizing
 */

/**
 * Calculates the optimal column width based on available space
 * @param containerWidth - Width of the main container
 * @param minColumns - Minimum number of columns to display
 * @param maxColumns - Maximum number of columns before scrolling
 * @returns Column width in pixels
 */
export const calculateOptimalColumnWidth = (
  containerWidth: number,
  minColumns: number = 3,
  maxColumns: number = 6
): number => {
  const padding = 48; // 6 * 8 (padding from both sides)
  const gap = 24; // 6 * 4 (gap between columns)
  const availableWidth = containerWidth - padding;
  
  // Calculate how many columns can fit
  const columnsThatFit = Math.floor(availableWidth / 280); // Base column width
  
  if (columnsThatFit >= maxColumns) {
    return 280; // Use standard width for more columns
  } else if (columnsThatFit >= minColumns) {
    // Distribute space evenly
    const optimalWidth = Math.floor((availableWidth - (gap * (columnsThatFit - 1))) / columnsThatFit);
    return Math.max(240, Math.min(320, optimalWidth)); // Constrain between 240-320px
  } else {
    // Force scrolling with standard width
    return 280;
  }
};

/**
 * Gets responsive breakpoints for different screen sizes
 */
export const getLayoutBreakpoints = () => ({
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1536,
});

/**
 * Validates if the layout should use horizontal scrolling
 * @param columnCount - Number of columns to display
 * @param containerWidth - Available container width
 * @returns Boolean indicating if horizontal scrolling should be enabled
 */
export const shouldEnableHorizontalScroll = (
  columnCount: number,
  containerWidth: number
): boolean => {
  const minColumnWidth = 280;
  const gapWidth = 24;
  const totalRequiredWidth = (columnCount * minColumnWidth) + ((columnCount - 1) * gapWidth);
  
  return totalRequiredWidth > containerWidth;
};

/**
 * Gets the appropriate CSS classes for the main layout container
 * @param isMobile - Whether the device is mobile
 * @param isSidebarCollapsed - Whether the sidebar is collapsed
 * @returns Object with CSS class strings
 */
export const getLayoutClasses = (
  isMobile: boolean,
  isSidebarCollapsed: boolean
) => {
  const sidebarWidth = isMobile ? 0 : (isSidebarCollapsed ? 80 : 288);
  const marginLeft = isMobile ? 'ml-0' : (isSidebarCollapsed ? 'ml-20' : 'ml-72');
  
  return {
    container: `flex flex-col ${isMobile ? 'md:flex-row' : ''} h-screen bg-slate-950 overflow-hidden text-slate-300`,
    mainContent: `flex-1 flex flex-col min-h-screen max-w-full transition-all duration-300 ease-in-out ${marginLeft}`,
    header: "border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-20 p-4 space-y-3",
    scrollContainer: "p-6 h-full overflow-x-auto custom-scrollbar",
    columnsContainer: "min-w-full flex flex-row gap-6 flex-nowrap"
  };
};