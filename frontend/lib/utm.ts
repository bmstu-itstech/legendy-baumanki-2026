const UTM_SOURCE_KEY = "utm_source";
const UTM_CAMPAIGN_KEY = "utm_campaign";

/**
 * Сохраняет utm_source/utm_campaign из query-параметров текущего URL в
 * localStorage. Вызывается один раз при загрузке приложения (см.
 * components/layout/utm-capture.tsx), чтобы метки первого захода не
 * терялись при переходе на страницу регистрации без них в адресной
 * строке. Если параметра нет в текущем URL, ранее сохранённое значение
 * не трогаем.
 */
export function captureUtmParams(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const utmCampaign = params.get("utm_campaign");

  try {
    if (utmSource) window.localStorage.setItem(UTM_SOURCE_KEY, utmSource);
    if (utmCampaign) window.localStorage.setItem(UTM_CAMPAIGN_KEY, utmCampaign);
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — просто не сохраняем.
  }
}

/** Читает ранее сохранённые utm-метки — используется при регистрации. */
export function getStoredUtmParams(): { utmSource: string | null; utmCampaign: string | null } {
  if (typeof window === "undefined") {
    return { utmSource: null, utmCampaign: null };
  }

  try {
    return {
      utmSource: window.localStorage.getItem(UTM_SOURCE_KEY),
      utmCampaign: window.localStorage.getItem(UTM_CAMPAIGN_KEY),
    };
  } catch {
    return { utmSource: null, utmCampaign: null };
  }
}
