export type Theme = "auto" | "light" | "dark";

export interface AppSettings {
  theme: Theme;
  bannerEnabled: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "auto",
  bannerEnabled: true,
};

const KEY = "settings";

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const out = await chrome.storage.local.get(KEY);
    const v = out[KEY];
    if (v && typeof v === "object") {
      return { ...DEFAULT_APP_SETTINGS, ...(v as Partial<AppSettings>) };
    }
    return DEFAULT_APP_SETTINGS;
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export async function setAppSettings(
  patch: Partial<AppSettings>,
): Promise<AppSettings> {
  const cur = await getAppSettings();
  const next: AppSettings = { ...cur, ...patch };
  await chrome.storage.local.set({ [KEY]: next });
  return next;
}

/** Back-compat for M3 banner code paths. */
export async function getBannerEnabled(): Promise<boolean> {
  return (await getAppSettings()).bannerEnabled;
}
