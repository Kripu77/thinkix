import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | boolean | null)[]) {
  return twMerge(clsx(inputs));
}

/**
 * Design system theme tokens for Thinkix UI components.
 * All class strings use CSS custom properties (--tx-*) for sizing and typography.
 *
 * Tokens are organized by component type:
 * - toolbar: Main drawing toolbar
 * - control: Zoom, undo/redo controls
 * - dropdown: Menu dropdowns
 * - dialog: Modal dialogs
 * - input: Form inputs
 * - button: Button variants
 * - collab: Collaboration UI
 * - tip: Information callouts
 */
export const THEME = {
  /**
   * Toolbar button styles (36px square, 18px icons)
   * Used for: BoardToolbar, AppMenu trigger
   */
  toolbar: {
    container: cn(
      'inline-flex items-center gap-1.5',
      'rounded-lg border bg-background/95 backdrop-blur',
      'px-2 py-2',
      'shadow-[var(--tx-shadow-toolbar)]'
    ),
    button: cn(
      'h-[var(--tx-toolbar-btn)] w-[var(--tx-toolbar-btn)]',
      'flex items-center justify-center',
      'rounded-md p-0 cursor-pointer',
      'transition-colors',
      'hover:bg-accent hover:text-accent-foreground',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-30'
    ),
    buttonSelected: cn(
      'bg-accent text-accent-foreground'
    ),
    separator: 'mx-1.5 h-6 w-px bg-border',
    mobileSeparator: 'mx-1 h-5 w-px bg-border',
    // Mobile-specific button size
    mobileButton: cn(
      'h-[var(--tx-toolbar-btn-mobile)] w-[var(--tx-toolbar-btn-mobile)]'
    ),
  },

  /**
   * Control button styles (28px square, 15px icons)
   * Used for: ZoomToolbar, UndoRedoButtons
   */
  control: {
    container: cn(
      'inline-flex items-center gap-0.5',
      'rounded-lg border bg-background/95 backdrop-blur',
      'px-1 py-1',
      'shadow-[var(--tx-shadow-toolbar)]'
    ),
    button: cn(
      'h-[var(--tx-control-btn)] w-[var(--tx-control-btn)]',
      'flex items-center justify-center',
      'rounded-md p-0',
      'transition-colors',
      'hover:bg-accent hover:text-accent-foreground',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-30'
    ),
    percentage: cn(
      'h-[var(--tx-control-btn)] min-w-[60px] px-2',
      'text-center font-medium',
      'text-[var(--tx-font-label)]',
      'hover:bg-accent hover:text-accent-foreground',
      'rounded-md transition-colors cursor-pointer'
    ),
  },

  /**
   * Dropdown menu styles
   */
  dropdown: {
    content: cn(
      'min-w-[180px] z-50',
      'overflow-hidden rounded-lg border',
      'bg-popover text-popover-foreground',
      'p-1',
      'shadow-[var(--tx-shadow-dropdown)]'
    ),
    item: cn(
      'relative flex cursor-pointer select-none items-center gap-2',
      'rounded-sm px-2.5 py-2',
      'text-[var(--tx-font-body)]',
      'outline-none transition-colors',
      'hover:bg-accent hover:text-accent-foreground',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-30'
    ),
    itemSelected: 'bg-accent text-accent-foreground',
    itemDestructive: cn(
      'text-destructive',
      'hover:bg-destructive/10 hover:text-destructive',
      'focus:bg-destructive/10 focus:text-destructive'
    ),
    icon: cn(
      'h-4 w-4',
      'shrink-0',
      'flex items-center justify-center'
    ),
    label: cn(
      'px-2 py-1',
      'text-[var(--tx-font-label)] font-medium',
      'text-muted-foreground'
    ),
    shortcut: cn(
      'ml-auto text-[var(--tx-font-shortcut)]',
      'text-muted-foreground'
    ),
    separator: '-mx-1 my-1 h-px bg-border',
  },

  /**
   * Dialog styles
   */
  dialog: {
    overlay: cn(
      'fixed inset-0 z-50',
      'bg-[var(--tx-backdrop-overlay)]',
      'backdrop-blur-[var(--tx-backdrop-blur)]',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
    ),
    content: cn(
      'fixed left-[50%] top-[50%] z-50',
      'translate-x-[-50%] translate-y-[-50%]',
      'w-full max-w-lg',
      'border bg-background',
      'rounded-lg shadow-[var(--tx-shadow-dialog)]',
      'p-6',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
      'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]'
    ),
    contentSm: 'sm:rounded-lg',
    inner: 'rounded-sm',
    header: 'flex flex-col space-y-1.5 text-center sm:text-left',
    title: 'text-lg font-semibold leading-none tracking-tight',
    description: 'text-sm text-muted-foreground',
    footer: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2',
    close: cn(
      'absolute right-4 top-4 rounded-sm opacity-70',
      'transition-opacity hover:opacity-100',
      'focus:outline-none focus:ring-1 focus:ring-ring',
      'disabled:pointer-events-none'
    ),
  },

  /**
   * Input styles
   */
  input: cn(
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1',
    'text-[var(--tx-font-body)] shadow-sm transition-colors',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50'
  ),

  /**
   * Button variants
   */
  button: {
    primary: cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium',
      'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      'bg-primary text-primary-foreground shadow hover:bg-primary/90'
    ),
    secondary: cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium',
      'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'
    ),
    outline: cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium',
      'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
    ),
    ghost: cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium',
      'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      'hover:bg-accent hover:text-accent-foreground'
    ),
    destructive: cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium',
      'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90'
    ),
  },

  /**
   * Collaboration status bar
   */
  collab: {
    container: cn(
      'hidden lg:flex items-center gap-2',
      'rounded-lg border bg-background/95 backdrop-blur',
      'px-2 py-1.5 shadow-sm'
    ),
    statusDot: 'h-2 w-2 rounded-full',
    statusConnected: 'bg-green-500',
    statusDisconnected: 'bg-red-500',
    statusReconnecting: cn(
      'h-2 w-2 animate-pulse rounded-full bg-yellow-400'
    ),
    text: cn(
      'text-[var(--tx-font-label)] text-muted-foreground'
    ),
    closeButton: cn(
      'h-6 w-6 p-0 text-muted-foreground',
      'hover:text-foreground transition-colors'
    ),
  },

  /**
   * Tip/info callout box
   */
  tip: cn(
    'rounded-lg p-3',
    'bg-primary/5 border border-primary/10',
    'text-[var(--tx-font-body)] text-foreground'
  ),
} as const;

export type ThemeTokens = typeof THEME;
