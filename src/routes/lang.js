function getLangIdFromRequest(req) {
  const [, base] = req.baseUrl.split('/');
  let id = Number.parseInt(req.query.id);
  if (base === 'lang' && Number.isInteger(id)) {
    return id;
  }
  id = Number.parseInt(base.slice(1));
  if (base.indexOf('L') === 0 && Number.isInteger(id)) {
    return id;
  }
  const err = new Error('must provide lang');
  err.statusCode = 400;
  throw err;
}

export function buildLangRouter({ newRouter, pingLang, getAsset, isNonEmptyString }) {
  const router = newRouter();
  router.get('/', async (req, res, next) => {
    try {
      const langId = getLangIdFromRequest(req);
      const lang = `L${langId}`;
      const [, , path] = req.baseUrl.split('/');
      const pong = await pingLang(lang);
      if (!pong) {
        res.sendStatus(404);
      } else if (isNonEmptyString(path)) {
        const asset = await getAsset(lang, `/${path}`);
        res.status(200).send(asset);
      } else {
        res.sendStatus(200);
      }
    } catch(err) {
      next(err);
    }
  });
  return router;
}
