/**
 * CleanFlow v006 公開環境設定
 *
 * 1. GAS のウェブアプリURLを apiUrl に貼り付けると、複数端末共有モードになります。
 * 2. 空欄のままでは、端末内だけに保存するデモモードで動作します。
 * 3. 本番公開時は allowLocalDemo を false にすることを推奨します。
 */
window.CLEANFLOW_CONFIG = Object.freeze({
  appVersion: "v006",
  apiUrl: "",
  requireLogin: true,
  allowLocalDemo: true,
  requestTimeoutMs: 25000,
});
