const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;

let initialized = false;

export const initOneSignal = async () => {
  if (initialized || typeof window === "undefined" || !appId?.trim()) {
    return;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("OneSignal SDK failed to load"));
      document.head.appendChild(script);
    });

    const OneSignal = (window as Window & { OneSignal?: { init: (config: object) => void } })
      .OneSignal;

    OneSignal?.init({
      appId: appId.trim(),
      allowLocalhostAsSecureOrigin: import.meta.env.DEV,
    });

    initialized = true;
  } catch (error) {
    console.warn("[OneSignal] init skipped:", error);
  }
};
