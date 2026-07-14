(() => {
  "use strict";

  const config = window.CLEANFLOW_CONFIG || {};

  async function request(action, payload = {}, token = "") {
    if (!config.apiUrl) throw new Error("CLOUD_NOT_CONFIGURED");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(config.requestTimeoutMs) || 25000);
    try {
      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, token, payload }),
        signal: controller.signal,
        redirect: "follow",
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error("サーバーから正しい応答を受け取れませんでした"); }
      if (!data?.ok) throw new Error(data?.message || "処理に失敗しました");
      return data.data;
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("通信がタイムアウトしました");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  window.CleanFlowAPI = Object.freeze({
    isConfigured: () => Boolean(config.apiUrl),
    login: (loginId, pin) => request("login", { loginId, pin }),
    getSnapshot: token => request("getSnapshot", {}, token),
    listUsers: token => request("listUsers", {}, token),
    upsertUserAccount: (token, account) => request("upsertUserAccount", account, token),
    changePin: (token, currentPin, newPin) => request("changePin", { currentPin, newPin }, token),
    upsertJobs: (token, jobs) => request("upsertJobs", { jobs }, token),
    saveMaster: (token, masterData) => request("saveMaster", { masterData }, token),
    saveInvoiceSettings: (token, invoiceSettings) => request("saveInvoiceSettings", { invoiceSettings }, token),
    uploadPhoto: (token, payload) => request("uploadPhoto", payload, token),
    ping: token => request("ping", {}, token),
  });
})();
