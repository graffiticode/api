import url, { URL, URLSearchParams } from 'url';

const BODY_METHOD_BLACKLIST = ['HEAD', 'GET'];

export default function buildProxyHandler({ httpAgent, httpsAgent, log, getConfig, fetch, uuid }) {
  return async function proxyHandler(req, res, next) {
    next();
    const config = getConfig();
    if (!config ||
      !config.proxy ||
      !Array.isArray(config.proxy.targets) ||
      config.proxy.targets.length <= 0) {
      return;
    }
    const requestUrl = url.parse(req.originalUrl || req.url);
    const requestSearchParams = new URLSearchParams(requestUrl.query);
    const requestId = uuid.v4();
    await Promise.all(config.proxy.targets.map(async (target) => {
      const targetUrl = new URL(target);
      targetUrl.pathname += requestUrl.pathname;
      if (targetUrl.pathname.startsWith('//')) {
        targetUrl.pathname = targetUrl.pathname.substring(1);
      }
      requestSearchParams.forEach((value, key) => targetUrl.searchParams.append(key, value));
      const init = {
        method: req.method,
        headers: {
          'accepts': req.get('accepts'),
          'content-type': req.get('Content-Type'),
          'x-graffiticode-request-id': requestId,
        },
        body: null,
        agent: httpsAgent
      }
      if (!BODY_METHOD_BLACKLIST.includes(req.method.toUpperCase())) {
        if (typeof req.body === 'string') {
          init.body = req.body;
        } else {
          init.body = JSON.stringify(req.body);
        }
      }
      if (targetUrl.protocol === 'http:') {
        init.agent = httpAgent;
      }
      const start = process.hrtime();
      try {
        const targetRes = await fetch(targetUrl.toString(), init);
        const body = await targetRes.text();
        const diff = process.hrtime(start);
        const duration = (diff[0] * 1e9 + diff[1]) / 1e6;
        log(`${requestId} ${req.method} ${targetUrl.toString()} ${targetRes.status} ${duration.toFixed(3)}ms - ${body.length}`);
      } catch (err) {
        const diff = process.hrtime(start);
        const duration = (diff[0] * 1e9 + diff[1]) / 1e6;
        log(`${requestId} ${req.method} ${targetUrl.toString()} ERROR ${duration.toFixed(3)}ms - ${err.message}`);
      }
    }));
  };
}