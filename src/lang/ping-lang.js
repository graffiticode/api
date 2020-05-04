function noop(){}
export function buildPingLang({ getBaseUrlForLanguage, bent }) {
  const cache = new Map();

  async function pingLangInternal(lang) {
    try {
      const baseUrl = getBaseUrlForLanguage(lang);
      const headLang = bent(baseUrl, 'HEAD');
      await headLang('/');
      return true;
    } catch(err) {
      console.log(`Failed to ping language ${lang}: ${err.message}`);
      return false;
    }
  }

  return async function pingLang(lang, resume) {
    if (typeof resume !== 'function') {
      resume = noop;
    }

    if (!cache.has(lang)) {
      cache.set(lang, pingLangInternal(lang));
    }
    const pong = await cache.get(lang);
    if (!pong) {
      cache.delete(lang);
    }

    resume(pong);
    return pong;
  };
}