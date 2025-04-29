const FIRST_COLUMN_WIDTH = 80;

/**
 * Creates a CSS grid-template-columns value with appropriate sizing
 */
export interface GridTemplateColumnsOptions {
  hasFirstColumn: boolean;
  numColumns: number;
  timeColumnWidth?: string;
}

export const createGridTemplateColumns = ({
  hasFirstColumn,
  numColumns,
  timeColumnWidth = '80px',
}: GridTemplateColumnsOptions): string => {
  // For exact alignment, use calc() with percentage-based columns

  if (hasFirstColumn) {
    // Calculate the percentage width for each day column
    // We need to account for the fixed width first column
    // Each column gets equal share of the remaining space:
    // (100% - fixed_width) / numColumns

    // For multiple columns, we use calc to ensure precise division
    if (numColumns > 1) {
      const dayColumns = Array(numColumns)
        .fill(`calc((100% - ${timeColumnWidth}) / ${numColumns})`)
        .join(' ');

      return `${timeColumnWidth} ${dayColumns}`;
    }
    // Special case for a single column
    else {
      return `${timeColumnWidth} calc(100% - ${timeColumnWidth})`;
    }
  } else {
    // If there's no first column, all columns are evenly sized percentages
    // We use calc to ensure the total is exactly 100%
    if (numColumns > 1) {
      const columnCalc = `calc(100% / ${numColumns})`;
      return Array(numColumns).fill(columnCalc).join(' ');
    } else {
      return '100%'; // Single column case
    }
  }
};

/**
 * Get the width of the browser's scrollbar
 * This helps with grid alignment when one grid has a scrollbar and another doesn't
 */
export const getScrollbarWidth = (): number => {
  // Create a temporary div with scrollbar
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);

  // Create an inner div that fills the outer div
  const inner = document.createElement('div');
  outer.appendChild(inner);

  // Calculate the scrollbar width
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  // Clean up
  if (outer.parentNode) {
    outer.parentNode.removeChild(outer);
  }

  return scrollbarWidth;
};

/**
 * Creates a CSS adjustments string to compensate for scrollbar
 * Returns either a padding-right or width reduction based on preference
 */
export const getScrollbarCompensation = (preferPadding = true): string => {
  // For SSR safety
  if (typeof window === 'undefined') {
    return preferPadding ? 'padding-right: 17px;' : 'width: calc(100% - 17px);';
  }

  const scrollbarWidth = getScrollbarWidth();
  return preferPadding
    ? `padding-right: ${scrollbarWidth}px;`
    : `width: calc(100% - ${scrollbarWidth}px);`;
};
