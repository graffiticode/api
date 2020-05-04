function noop(){}
export function buildPingPong({ getBaseUrlForLanguage, bent }) {
  const cache = new Map();

  async function pingPongInternal(lang) {
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

  return async function pingPong(lang, resume) {
    if (typeof resume !== 'function') {
      resume = noop;
    }

    if (!cache.has(lang)) {
      cache.set(lang, pingPongInternal(lang));
    }
    const pong = await cache.get(lang);
    console.log(pong);
    if (!pong) {
      cache.delete(lang);
    }

    resume(pong);
    return pong;
  };
}