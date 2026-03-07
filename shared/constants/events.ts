export const CUSTOM_EVENTS = {
  TOOL_CHANGE: 'thinkix:toolchange',
} as const;

export type CustomEventName = (typeof CUSTOM_EVENTS)[keyof typeof CUSTOM_EVENTS];
