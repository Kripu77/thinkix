export function MindMapIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
    >
      <path d="M14.5,1.5 C15.3284271,1.5 16,2.17157288 16,3 L16,4.5 C16,5.32842712 15.3284271,6 14.5,6 L10.5,6 C9.70541385,6 9.05512881,5.38217354 9.00332687,4.60070262 L7.75,4.6 C6.70187486,4.6 5.75693372,5.0417832 5.09122946,5.7492967 L5.5,5.75 C6.32842712,5.75 7,6.42157288 7,7.25 L7,8.75 C7,9.57842712 6.32842712,10.25 5.5,10.25 L4.69703093,10.2512226 C5.3493111,11.2442937 6.47308134,11.9 7.75,11.9 L9.004,11.9 L9.00686658,11.85554 C9.07955132,11.0948881 9.72030388,10.5 10.5,10.5 L14.5,10.5 C15.3284271,10.5 16,11.1715729 16,12 L16,13.5 C16,14.3284271 15.3284271,15 14.5,15 L10.5,15 C9.67157288,15 9,14.3284271 9,13.5 L9,13.1 L7.75,13.1 C5.78479628,13.1 4.09258608,11.9311758 3.33061658,10.2507745 L1.5,10.25 C0.671572875,10.25 0,9.57842712 0,8.75 L0,7.25 C0,6.42157288 0.671572875,5.75 1.5,5.75 L3.5932906,5.74973863 C4.44206161,4.34167555 5.98606075,3.4 7.75,3.4 L9,3.4 L9,3 C9,2.17157288 9.67157288,1.5 10.5,1.5 L14.5,1.5 Z M14.5,11.7 L10.5,11.7 C10.3343146,11.7 10.2,11.8343146 10.2,12 L10.2,13.5 C10.2,13.6656854 10.3343146,13.8 10.5,13.8 L14.5,13.8 C14.6656854,13.8 14.8,13.6656854 14.8,13.5 L14.8,12 C14.8,11.8343146 14.6656854,11.7 14.5,11.7 Z M5.5,6.95 L1.5,6.95 C1.33431458,6.95 1.2,7.08431458 1.2,7.25 L1.2,8.75 C1.2,8.91568542 1.33431458,9.05 1.5,9.05 L5.5,9.05 C5.66568542,9.05 5.8,8.91568542 5.8,8.75 L5.8,7.25 C5.8,7.08431458 5.66568542,6.95 5.5,6.95 Z M14.5,2.7 L10.5,2.7 C10.3343146,2.7 10.2,2.83431458 10.2,3 L10.2,4.5 C10.2,4.66568542 10.3343146,4.8 10.5,4.8 L14.5,4.8 C14.6656854,4.8 14.8,4.66568542 14.8,4.5 L14.8,3 C14.8,2.83431458 14.6656854,2.7 14.5,2.7 Z" />
    </svg>
  );
}

export function SolidLineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

export function DashedLineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="6 3" />
    </svg>
  );
}

export function DottedLineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="2 4" />
    </svg>
  );
}

export function StraightArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  );
}

export function CurvedArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 19 Q 12 5, 19 19" />
    </svg>
  );
}

export function ElbowArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 19 L 5 12 L 19 12 L 19 5" />
    </svg>
  );
}

export function StartArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="12 5, 5 12, 12 19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function SolidFillIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

export function HachureFillIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <line x1="4" y1="20" x2="20" y2="4" />
      <line x1="8" y1="20" x2="20" y2="8" />
      <line x1="12" y1="20" x2="20" y2="12" />
      <line x1="16" y1="20" x2="20" y2="16" />
      <line x1="4" y1="16" x2="8" y2="20" />
      <line x1="4" y1="12" x2="12" y2="20" />
      <line x1="4" y1="8" x2="16" y2="20" />
    </svg>
  );
}

export function ZigzagFillIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 8 L6 6 L8 8 L10 6 L12 8 L14 6 L16 8 L18 6 L20 8" />
      <path d="M4 13 L6 11 L8 13 L10 11 L12 13 L14 11 L16 13 L18 11 L20 13" />
      <path d="M4 18 L6 16 L8 18 L10 16 L12 18 L14 16 L16 18 L18 16 L20 18" />
    </svg>
  );
}

export function CrossHatchFillIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <line x1="4" y1="20" x2="20" y2="4" />
      <line x1="8" y1="20" x2="20" y2="8" />
      <line x1="12" y1="20" x2="20" y2="12" />
      <line x1="16" y1="20" x2="20" y2="16" />
      <line x1="4" y1="16" x2="16" y2="4" />
      <line x1="4" y1="12" x2="12" y2="4" />
      <line x1="4" y1="8" x2="8" y2="4" />
      <line x1="4" y1="4" x2="20" y2="20" />
      <line x1="8" y1="4" x2="20" y2="16" />
      <line x1="12" y1="4" x2="20" y2="12" />
      <line x1="16" y1="4" x2="20" y2="8" />
    </svg>
  );
}

export function DotsFillIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="12" cy="8" r="1.5" />
      <circle cx="16" cy="8" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="16" cy="12" r="1.5" />
      <circle cx="8" cy="16" r="1.5" />
      <circle cx="12" cy="16" r="1.5" />
      <circle cx="16" cy="16" r="1.5" />
    </svg>
  );
}

export function DashedFillIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <line x1="4" y1="8" x2="20" y2="8" strokeDasharray="3 2" />
      <line x1="4" y1="12" x2="20" y2="12" strokeDasharray="3 2" />
      <line x1="4" y1="16" x2="20" y2="16" strokeDasharray="3 2" />
    </svg>
  );
}
