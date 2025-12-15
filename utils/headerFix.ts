/**
 * Simple utility function to fix header width and enable horizontal scrolling
 * Call this function whenever you add or remove columns to maintain proper layout
 */

export const fixHeaderWidth = () => {
  // Force layout recalculation
  const mainContent = document.querySelector('main');
  const header = document.querySelector('header');
  
  if (mainContent && header) {
    // Add a small delay to ensure DOM updates are complete
    setTimeout(() => {
      // Trigger a layout recalculation by accessing computed styles
      const computedStyle = window.getComputedStyle(mainContent);
      
      // Ensure the main content doesn't expand beyond viewport
      mainContent.style.maxWidth = '100%';
      mainContent.style.overflowX = 'auto';
      
      // Ensure header stays fixed at the top
      header.style.position = 'sticky';
      header.style.top = '0';
      header.style.zIndex = '20';
      
      // Force horizontal scroll if columns overflow
      const columnsContainer = mainContent.querySelector('[data-column]')?.parentElement;
      if (columnsContainer) {
        columnsContainer.style.display = 'flex';
        columnsContainer.style.flexDirection = 'row';
        columnsContainer.style.gap = '1.5rem'; // 24px
        columnsContainer.style.flexWrap = 'nowrap';
        columnsContainer.style.minWidth = '100%';
      }
      
      console.log('✅ Header width fixed and horizontal scrolling enabled');
    }, 100);
  }
};

/**
 * Automatically detect when columns are added/removed and apply the fix
 */
export const setupAutoHeaderFix = () => {
  const observer = new MutationObserver((mutations) => {
    let shouldFix = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Check if columns were added or removed
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE && (node as Element).hasAttribute?.('data-column')) {
            shouldFix = true;
          }
        });
        
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE && (node as Element).hasAttribute?.('data-column')) {
            shouldFix = true;
          }
        });
      }
    });
    
    if (shouldFix) {
      fixHeaderWidth();
    }
  });
  
  // Start observing the main content area
  const mainContent = document.querySelector('main');
  if (mainContent) {
    observer.observe(mainContent, {
      childList: true,
      subtree: true
    });
  }
  
  return observer; // Return observer so it can be disconnected when needed
};

/**
 * Simple function to call after adding a new column
 * Usage: after creating a new column, call: fixHeaderAfterColumnChange()
 */
export const fixHeaderAfterColumnChange = () => {
  fixHeaderWidth();
};