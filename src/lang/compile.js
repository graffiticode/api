export function buildCompile({ getBaseUrlForLanguage, bent }) {
  return async function compile(lang, req) {
    const baseUrl = getBaseUrlForLanguage(lang);
    const compilePost = bent(baseUrl, 'POST', 'json');
    return await compilePost('/compile', req);
  };
}