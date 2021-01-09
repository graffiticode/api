function getLangIdFromRequest(req) {
  const [, base] = req.baseUrl.split('/');
  let id = Number.parseInt(req.query.id);
  if (base === 'lang' && Number.isInteger(id)) {
    return id;
  }
  const re = new RegExp('^[Ll](\\d+)$');
  const match = re.exec(base);
  if (!match) {
    const err = new Error('must provide a language identifier');
    err.statusCode = 400;
    throw err;
  }
  id = Number.parseInt(match[1]);
  if (!Number.isInteger(id)) {
    const err = new Error('should not be possible');
    err.statusCode = 500;
    throw err;
  }
  return id;
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
