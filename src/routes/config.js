export default function buildConfigHandler({ getConfig }) {
  return function configHandler(req, res) {
    res.status(200).json(getConfig());
  };
}