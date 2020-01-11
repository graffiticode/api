export default function buildGetConfig({ global }) {
  return function getConfig() {
    return global.config;
  };
}