declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

let scriptLoaded = false;

export function initGoogleTranslate(): void {
  if (scriptLoaded) return;
  scriptLoaded = true;

  // Create container (can stay hidden)
  if (!document.getElementById('google_translate_element')) {
    const container = document.createElement('div');
    container.id = 'google_translate_element';
    container.style.position = 'fixed';
    container.style.bottom = '0';
    container.style.right = '0';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
  }

  window.googleTranslateElementInit = function () {
    // Initialize with only the required languages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TranslateElement: any = window.google?.translate?.TranslateElement;
    if (TranslateElement) {
      // pageLanguage 'en' and included 'en,hi,pa'
      new TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,hi,pa',
        autoDisplay: false,
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
      }, 'google_translate_element');
    }
  };

  const s = document.createElement('script');
  s.type = 'text/javascript';
  s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  document.head.appendChild(s);
}

const LABEL_TO_CODE: Record<'English' | 'Hindi' | 'Punjabi', 'en' | 'hi' | 'pa'> = {
  English: 'en',
  Hindi: 'hi',
  Punjabi: 'pa',
};

export function setLanguage(label: 'English' | 'Hindi' | 'Punjabi'): void {
  const lang = LABEL_TO_CODE[label];
  const base = '/en/' + lang;
  // Set cookies used by Google Translate
  const host = window.location.hostname;
  document.cookie = `googtrans=${base}; path=/`;
  document.cookie = `googtrans=${base}; domain=${host}; path=/`;
  // Soft refresh to let translator re-run
  // Using location.reload() is reliable; avoid full navigation changes
  window.location.reload();
}


