import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    
    // Error tracking
    capture_exceptions: true,
    
    // Performance monitoring
    capture_performance: {
      web_vitals: true,
      network_timing: true,
    },
    
    // Session recording - mask all sensitive content
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '*',
    },
    
    // Capture console logs for debugging (dev only)
    enable_recording_console_log: process.env.NODE_ENV === "development",
    
    // Debug mode in development
    debug: process.env.NODE_ENV === "development",
  });
}
