/**
 * CleanFlow v009 - Google Apps Script backend
 *
 * 【導入手順】
 * 1. 新しい Google スプレッドシートを作成します。
 * 2. 拡張機能 > Apps Script を開き、このファイルの内容を Code.gs に貼り付けます。
 * 3. setupCleanFlow() を1回実行し、権限を承認します。
 * 4. デプロイ > 新しいデプロイ > ウェブアプリ
 *    - 次のユーザーとして実行: 自分
 *    - アクセスできるユーザー: 全員
 * 5. 発行された /exec URL をフロント側 config.js の apiUrl に貼り付けます。
 * 6. 初期PINは必ず Users シートで変更してください。
 *
 * 初期アカウント:
 * - admin / 1234（管理者）
 * - yamada / 1111（スタッフ）
 * - sato / 2222（スタッフ）
 */

const CF = Object.freeze({
  SHEETS: {
    USERS: "Users",
    JOBS: "Jobs",
    CONFIG: "Config",
  },
  CONFIG_KEYS: {
    MASTER: "masterData",
    INVOICE: "invoiceSettings",
  },
  SESSION_HOURS: 24 * 14,
});

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = String(body.action || "");
    const payload = body.payload || {};
    const token = String(body.token || "");

    if (action === "login") return jsonOk_(login_(payload));

    const user = verifyToken_(token);
    if (action === "ping") return jsonOk_({ user: publicUser_(user), serverTime: new Date().toISOString() });
    if (action === "getSnapshot") return jsonOk_(getSnapshot_(user));
    if (action === "listUsers") return jsonOk_(listUsers_(user));
    if (action === "upsertUserAccount") return jsonOk_(upsertUserAccount_(user, payload));
    if (action === "changePin") return jsonOk_(changePin_(user, payload));
    if (action === "upsertJobs") return jsonOk_(upsertJobs_(user, payload.jobs));
    if (action === "saveMaster") return jsonOk_(saveConfig_(user, CF.CONFIG_KEYS.MASTER, payload.masterData));
    if (action === "saveInvoiceSettings") return jsonOk_(saveConfig_(user, CF.CONFIG_KEYS.INVOICE, payload.invoiceSettings));
    if (action === "uploadPhoto") return jsonOk_(uploadPhoto_(user, payload));

    throw new Error("不明な操作です");
  } catch (error) {
    return jsonError_(error && error.message ? error.message : "サーバーエラーが発生しました");
  }
}

function setupCleanFlow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("スプレッドシートに紐づけた Apps Script で実行してください");

  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", ss.getId());
  if (!PropertiesService.getScriptProperties().getProperty("APP_SECRET")) {
    PropertiesService.getScriptProperties().setProperty("APP_SECRET", Utilities.getUuid() + Utilities.getUuid());
  }

  const users = ensureSheet_(ss, CF.SHEETS.USERS, ["loginId", "name", "role", "pinHash", "active", "updatedAt"]);
  ensureSheet_(ss, CF.SHEETS.JOBS, ["id", "json", "updatedAt"]);
  ensureSheet_(ss, CF.SHEETS.CONFIG, ["key", "json", "updatedAt"]);

  if (users.getLastRow() <= 1) {
    const now = new Date().toISOString();
    users.getRange(2, 1, 3, 6).setValues([
      ["admin", "管理者", "admin", hash_("1234"), true, now],
      ["yamada", "山田", "staff", hash_("1111"), true, now],
      ["sato", "佐藤", "staff", hash_("2222"), true, now],
    ]);
  }

  let folderId = PropertiesService.getScriptProperties().getProperty("PHOTO_FOLDER_ID");
  if (!folderId) {
    const folder = DriveApp.createFolder("CleanFlow_作業写真");
    folderId = folder.getId();
    PropertiesService.getScriptProperties().setProperty("PHOTO_FOLDER_ID", folderId);
  }

  SpreadsheetApp.flush();
  return "初期設定が完了しました。Usersシートの初期PINを必ず変更してください。";
}

/** 管理者がApps ScriptエディタからPINを変更するための補助関数 */
function setUserPin(loginId, newPin) {
  if (!loginId || !newPin) throw new Error("loginId と newPin を指定してください");
  const sheet = getSpreadsheet_().getSheetByName(CF.SHEETS.USERS);
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues() : [];
  const index = rows.findIndex(row => String(row[0]).trim() === String(loginId).trim());
  if (index < 0) throw new Error("対象ユーザーが見つかりません");
  sheet.getRange(index + 2, 4).setValue(hash_(String(newPin)));
  sheet.getRange(index + 2, 6).setValue(new Date().toISOString());
  return "PINを変更しました";
}

/** 管理者がApps Scriptエディタから利用者を追加・更新するための補助関数 */
function upsertUser(loginId, name, role, pin, active) {
  if (!loginId || !name || !["admin", "staff"].includes(String(role))) throw new Error("ユーザー情報が正しくありません");
  const sheet = getSpreadsheet_().getSheetByName(CF.SHEETS.USERS);
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues() : [];
  const index = rows.findIndex(row => String(row[0]).trim() === String(loginId).trim());
  const existingHash = index >= 0 ? String(rows[index][3] || "") : "";
  const record = [String(loginId).trim(), String(name).trim(), String(role), pin ? hash_(String(pin)) : existingHash, active !== false, new Date().toISOString()];
  if (!record[3]) throw new Error("新規ユーザーにはPINが必要です");
  if (index >= 0) sheet.getRange(index + 2, 1, 1, 6).setValues([record]);
  else sheet.appendRow(record);
  return "ユーザーを保存しました";
}

function login_(payload) {
  const loginId = String(payload.loginId || "").trim();
  const pin = String(payload.pin || "");
  if (!loginId || !pin) throw new Error("ログインIDとPINを入力してください");

  const user = findUser_(loginId);
  if (!user || !user.active || user.pinHash !== hash_(pin)) throw new Error("ログインIDまたはPINが正しくありません");

  const exp = Date.now() + CF.SESSION_HOURS * 60 * 60 * 1000;
  const body = Utilities.base64EncodeWebSafe(JSON.stringify({ loginId: user.loginId, exp }));
  const signature = sign_(body);
  return { token: body + "." + signature, user: publicUser_(user), expiresAt: new Date(exp).toISOString() };
}

function verifyToken_(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2 || sign_(parts[0]) !== parts[1]) throw new Error("ログインの有効期限が切れました。再ログインしてください");

  let payload;
  try { payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()); }
  catch (_) { throw new Error("ログイン情報が正しくありません"); }

  if (!payload.exp || Date.now() > Number(payload.exp)) throw new Error("ログインの有効期限が切れました。再ログインしてください");
  const user = findUser_(payload.loginId);
  if (!user || !user.active) throw new Error("このアカウントは利用できません");
  return user;
}

function getSnapshot_(user) {
  const allJobs = readJobs_();
  const master = readConfig_(CF.CONFIG_KEYS.MASTER, null);
  const jobs = user.role === "admin"
    ? allJobs
    : allJobs.map(job => staffJobView_(job, user.name));
  return {
    user: publicUser_(user),
    jobs,
    masterData: user.role === "admin" ? master : staffMasterView_(master),
    invoiceSettings: user.role === "admin" ? readConfig_(CF.CONFIG_KEYS.INVOICE, null) : null,
    users: user.role === "admin" ? listUsers_(user) : null,
    apiVersion: "v009",
    serverTime: new Date().toISOString(),
  };
}

/**
 * スタッフには全案件の予定を共有しますが、請求額・支払額などの金額情報は返しません。
 * 担当外案件の写真・電話番号・問題報告も返さず、閲覧用の予定情報に限定します。
 */
function staffJobView_(job, staffName) {
  const own = String(job.worker || "") === String(staffName || "");
  return sanitizeJob_({
    id: job.id,
    date: job.date,
    start: job.start,
    end: job.end,
    client: job.client,
    site: job.site,
    address: job.address,
    phone: own ? job.phone : "",
    worker: job.worker,
    tasks: job.tasks,
    status: job.status,
    note: job.note,
    billing: 0,
    pay: 0,
    expense: own ? job.expense : 0,
    issue: own ? job.issue : false,
    issueText: own ? job.issueText : "",
    photos: own ? job.photos : { before: [], after: [] },
    completedAt: own ? job.completedAt : "",
    reviewedAt: "",
    updatedAt: job.updatedAt,
  });
}

function staffMasterView_(master) {
  const source = master && typeof master === "object" ? master : {};
  return {
    clients: Array.isArray(source.clients) ? source.clients.map(String) : [],
    staff: Array.isArray(source.staff) ? source.staff.map(String) : [],
    prices: {},
  };
}


function listUsers_(user) {
  requireAdmin_(user);
  const sheet = getSpreadsheet_().getSheetByName(CF.SHEETS.USERS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues().map(row => ({
    loginId: String(row[0] || ""),
    name: String(row[1] || ""),
    role: String(row[2] || "staff"),
    active: row[4] === true || String(row[4]).toLowerCase() === "true",
    updatedAt: String(row[5] || ""),
  })).filter(account => account.loginId);
}

function upsertUserAccount_(user, payload) {
  requireAdmin_(user);
  const loginId = String(payload.loginId || "").trim();
  const name = String(payload.name || "").trim();
  const role = String(payload.role || "staff");
  const pin = String(payload.pin || "");
  const active = payload.active !== false;

  if (!/^[A-Za-z0-9._-]{3,40}$/.test(loginId)) throw new Error("ログインIDは半角英数字・記号（._-）で3〜40文字にしてください");
  if (!name) throw new Error("表示名を入力してください");
  if (!["admin", "staff"].includes(role)) throw new Error("権限が正しくありません");
  if (pin && !/^\d{4,12}$/.test(pin)) throw new Error("PINは4〜12桁の数字にしてください");
  if (loginId === user.loginId && (!active || role !== "admin")) throw new Error("現在ログイン中の管理者アカウントは無効化・権限変更できません");

  const sheet = getSpreadsheet_().getSheetByName(CF.SHEETS.USERS);
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues() : [];
  const index = rows.findIndex(row => String(row[0]).trim() === loginId);
  const existingHash = index >= 0 ? String(rows[index][3] || "") : "";
  if (index < 0 && !pin) throw new Error("新しいアカウントにはPINが必要です");
  const pinHash = pin ? hash_(pin) : existingHash;
  if (!pinHash) throw new Error("PINを設定してください");
  const record = [loginId, name, role, pinHash, active, new Date().toISOString()];
  if (index >= 0) sheet.getRange(index + 2, 1, 1, 6).setValues([record]);
  else sheet.appendRow(record);
  SpreadsheetApp.flush();
  return { loginId, name, role, active, updatedAt: record[5] };
}

function changePin_(user, payload) {
  const currentPin = String(payload.currentPin || "");
  const newPin = String(payload.newPin || "");
  if (!currentPin || user.pinHash !== hash_(currentPin)) throw new Error("現在のPINが正しくありません");
  if (!/^\d{4,12}$/.test(newPin)) throw new Error("新しいPINは4〜12桁の数字にしてください");
  if (currentPin === newPin) throw new Error("現在とは異なるPINを設定してください");

  const sheet = getSpreadsheet_().getSheetByName(CF.SHEETS.USERS);
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues() : [];
  const index = rows.findIndex(row => String(row[0]).trim() === user.loginId);
  if (index < 0) throw new Error("アカウントが見つかりません");
  sheet.getRange(index + 2, 4).setValue(hash_(newPin));
  sheet.getRange(index + 2, 6).setValue(new Date().toISOString());
  SpreadsheetApp.flush();
  return { changed: true };
}

function upsertJobs_(user, incoming) {
  if (!Array.isArray(incoming)) throw new Error("案件データが正しくありません");
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CF.SHEETS.JOBS);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const values = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues() : [];
    const rowById = new Map(values.map((row, index) => [String(row[0]), index + 2]));
    const existingById = new Map(values.map(row => {
      try { return [String(row[0]), JSON.parse(String(row[1] || "{}"))]; }
      catch (_) { return [String(row[0]), {}]; }
    }));

    incoming.forEach(raw => {
      if (!raw || !raw.id) return;
      const id = String(raw.id);
      const existing = existingById.get(id) || {};
      let job;
      if (user.role === "admin") {
        job = sanitizeJob_(raw);
      } else {
        if (!existing.id || String(existing.worker || "") !== user.name) throw new Error("担当外の案件は更新できません");
        job = Object.assign({}, existing, {
          status: ["planned", "progress", "done"].includes(raw.status) ? raw.status : existing.status,
          issue: Boolean(raw.issue),
          issueText: String(raw.issueText || ""),
          expense: Number(raw.expense) || 0,
          photos: sanitizePhotos_(raw.photos),
          completedAt: String(raw.completedAt || ""),
          updatedAt: String(raw.updatedAt || new Date().toISOString()),
        });
      }

      const updatedAt = String(job.updatedAt || new Date().toISOString());
      const row = [id, JSON.stringify(job), updatedAt];
      if (rowById.has(id)) sheet.getRange(rowById.get(id), 1, 1, 3).setValues([row]);
      else {
        sheet.appendRow(row);
        rowById.set(id, sheet.getLastRow());
      }
    });
    SpreadsheetApp.flush();
    return { saved: incoming.length, serverTime: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

function saveConfig_(user, key, value) {
  requireAdmin_(user);
  if (!value || typeof value !== "object") throw new Error("設定データが正しくありません");
  const sheet = getSpreadsheet_().getSheetByName(CF.SHEETS.CONFIG);
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues() : [];
  const index = rows.findIndex(row => String(row[0]) === key);
  const record = [key, JSON.stringify(value), new Date().toISOString()];
  if (index >= 0) sheet.getRange(index + 2, 1, 1, 3).setValues([record]);
  else sheet.appendRow(record);
  return { saved: true };
}

function uploadPhoto_(user, payload) {
  const jobId = String(payload.jobId || "");
  const kind = String(payload.kind || "");
  const dataUrl = String(payload.dataUrl || "");
  if (!jobId || !["before", "after", "issue"].includes(kind)) throw new Error("写真情報が正しくありません");
  if (!dataUrl.startsWith("data:image/")) throw new Error("画像形式が正しくありません");

  const job = readJobs_().find(item => String(item.id) === jobId);
  if (!job) throw new Error("案件が見つかりません");
  if (user.role !== "admin" && String(job.worker || "") !== user.name) throw new Error("担当外の案件へ写真を登録できません");

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("画像データを読み取れません");
  const bytes = Utilities.base64Decode(match[2]);
  if (bytes.length > 6 * 1024 * 1024) throw new Error("画像サイズが大きすぎます");

  const ext = match[1].includes("png") ? "png" : "jpg";
  const filename = [jobId, kind, Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Tokyo", "yyyyMMdd_HHmmss"), Utilities.getUuid().slice(0, 8)].join("_") + "." + ext;
  const folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty("PHOTO_FOLDER_ID"));
  const file = folder.createFile(Utilities.newBlob(bytes, match[1], filename));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {
    fileId: file.getId(),
    url: "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1600",
    name: filename,
  };
}

function readJobs_() {
  const sheet = getSpreadsheet_().getSheetByName(CF.SHEETS.JOBS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues().map(row => {
    try { return sanitizeJob_(JSON.parse(String(row[1] || "{}"))); }
    catch (_) { return null; }
  }).filter(Boolean);
}

function readConfig_(key, fallback) {
  const sheet = getSpreadsheet_().getSheetByName(CF.SHEETS.CONFIG);
  if (!sheet || sheet.getLastRow() <= 1) return fallback;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  const row = rows.find(item => String(item[0]) === key);
  if (!row) return fallback;
  try { return JSON.parse(String(row[1] || "null")); }
  catch (_) { return fallback; }
}

function findUser_(loginId) {
  const sheet = getSpreadsheet_().getSheetByName(CF.SHEETS.USERS);
  if (!sheet || sheet.getLastRow() <= 1) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  const row = rows.find(item => String(item[0]).trim() === String(loginId).trim());
  if (!row) return null;
  return { loginId: String(row[0]), name: String(row[1]), role: String(row[2]), pinHash: String(row[3]), active: row[4] === true || String(row[4]).toLowerCase() === "true" };
}

function sanitizeJob_(job) {
  return {
    id: String(job.id || ""),
    date: String(job.date || ""),
    start: String(job.start || ""),
    end: String(job.end || ""),
    client: String(job.client || ""),
    site: String(job.site || ""),
    address: String(job.address || ""),
    phone: String(job.phone || ""),
    worker: String(job.worker || "未設定"),
    tasks: Array.isArray(job.tasks) ? job.tasks.map(String) : [],
    status: String(job.status || "planned"),
    note: String(job.note || ""),
    billing: Number(job.billing) || 0,
    pay: Number(job.pay) || 0,
    expense: Number(job.expense) || 0,
    issue: Boolean(job.issue),
    issueText: String(job.issueText || ""),
    photos: sanitizePhotos_(job.photos),
    completedAt: String(job.completedAt || ""),
    reviewedAt: String(job.reviewedAt || ""),
    updatedAt: String(job.updatedAt || new Date().toISOString()),
  };
}

function sanitizePhotos_(photos) {
  return {
    before: Array.isArray(photos && photos.before) ? photos.before.map(String).slice(0, 8) : [],
    after: Array.isArray(photos && photos.after) ? photos.after.map(String).slice(0, 8) : [],
  };
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("setupCleanFlow() を先に実行してください");
  return SpreadsheetApp.openById(id);
}

function publicUser_(user) { return { loginId: user.loginId, name: user.name, role: user.role }; }
function requireAdmin_(user) { if (user.role !== "admin") throw new Error("管理者のみ実行できます"); }
function hash_(value) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value))); }
function sign_(value) {
  const secret = PropertiesService.getScriptProperties().getProperty("APP_SECRET");
  if (!secret) throw new Error("setupCleanFlow() を先に実行してください");
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value, secret));
}
function jsonOk_(data) { return ContentService.createTextOutput(JSON.stringify({ ok: true, data })).setMimeType(ContentService.MimeType.JSON); }
function jsonError_(message) { return ContentService.createTextOutput(JSON.stringify({ ok: false, message })).setMimeType(ContentService.MimeType.JSON); }
