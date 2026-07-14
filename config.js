/**
 * CleanFlow v009 公開環境設定
 *
 * GAS 接続を標準にした実運用テスト版です。
 * データは指定した Google スプレッドシート／Drive と同期します。
 */
window.CLEANFLOW_CONFIG = Object.freeze({
  appVersion: "v009",
  apiUrl: "https://script.google.com/macros/s/AKfycbweJF9k2R2UI0PfoyGI0icKcZV7uAGGQsJGqIndOhoRlPbG7liWB66Ef50MqqP_2yft/exec",
  requireLogin: true,
  allowLocalDemo: false,
  cloudOnly: true,
  requestTimeoutMs: 25000,
  autoRefreshMs: 120000,
});
