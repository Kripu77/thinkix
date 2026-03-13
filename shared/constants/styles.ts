import { THEME } from './theme';

/**
 * @deprecated Use THEME.toolbar.button instead
 */
export const TOOLBAR_ITEM_CLASS = THEME.toolbar.button;

/**
 * @deprecated Use THEME.toolbar.button instead
 */
export const BUTTON_CLASS = THEME.toolbar.button;

/**
 * @deprecated Use THEME.toolbar.buttonSelected instead
 */
export const SELECTED_BUTTON_CLASS = THEME.toolbar.buttonSelected;

/**
 * @deprecated Use THEME.dropdown.icon instead
 */
export const DROPDOWN_ICON_CLASS = THEME.dropdown.icon;

/**
 * Z-index values for layered UI elements
 */
export const Z_INDEX = {
  MODAL_OVERLAY: 50,
  POPOVER: 40,
  DIALOG: 60,
  TOAST: 70,
  TOOLTIP: 80,
} as const;

/**
 * Theme tokens for all UI components
 */
export { THEME };
