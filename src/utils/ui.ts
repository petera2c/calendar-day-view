import ModalPosition from '../types/ModalPosition';

interface ElementSize {
  width: number;
  height: number;
}

/**
 * Calculate the optimal position for the modal based on the clicked cell and window boundaries
 * Places the modal beside the cell rather than at the exact click position
 */
export const getOptimalModalPlacement = (
  position: ModalPosition,
  modalSize: ElementSize,
  margin: number = 15
): { top: number; left: number } => {
  const { cellRect, dayIndex } = position;
  const { width, height } = modalSize;

  // Default placement
  let left = 0;
  let top = 0;

  if (cellRect) {
    // Center the modal vertically with the cell
    top = cellRect.top + cellRect.height / 2;

    // Determine if we should place the modal to the left or right of the cell
    const isRightSide = typeof dayIndex === 'number' && dayIndex >= 3;

    if (isRightSide) {
      // Place modal to the left of the cell
      left = cellRect.left - width - margin;
    } else {
      // Place modal to the right of the cell
      left = cellRect.right + margin;
    }

    // If there's not enough space on the preferred side, try the other side
    if (left < margin) {
      left = cellRect.right + margin;
    } else if (left + width > window.innerWidth - margin) {
      left = cellRect.left - width - margin;
    }

    // If still no good positioning, center horizontally relative to cell
    if (left < margin || left + width > window.innerWidth - margin) {
      left = cellRect.left + (cellRect.width - width) / 2;
    }
  } else {
    // Fallback if no cell data, center in the viewport
    top = window.innerHeight / 2;
    left = (window.innerWidth - width) / 2;
  }

  // Check if the modal would extend beyond the top or bottom of the screen
  if (top - height / 2 < margin) {
    top = margin + height / 2;
  } else if (top + height / 2 > window.innerHeight - margin) {
    top = window.innerHeight - margin - height / 2;
  }

  return { top, left };
};
