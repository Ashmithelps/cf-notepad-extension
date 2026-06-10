export function previewBody(body: string, max = 200): string {
  const trimmed = body.trim();
  if (trimmed.length === 0) return "";
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trimEnd() + "…";
}

export interface BannerVisibilityInputs {
  noteExists: boolean;
  dismissedThisSession: boolean;
  bannerEnabled: boolean;
  panelOpen: boolean;
}

export function shouldShowBanner(i: BannerVisibilityInputs): boolean {
  return (
    i.noteExists && !i.dismissedThisSession && i.bannerEnabled && !i.panelOpen
  );
}
