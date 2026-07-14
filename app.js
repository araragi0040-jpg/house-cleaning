(() => {
  "use strict";

  const TODAY = "2026-07-14";
  const STORAGE_KEY = "cleanflow-v001-jobs";
  const state = {
    mode: "admin",
    view: "dashboard",
    staffView: "today",
    selectedJobId: null,
    selectedManualId: null,
    manualFromJob: false,
    weekOffset: 0,
    billingMonth: "2026-07",
  };

  const manuals = [
    {
      id: "vacant",
      name: "空室清掃",
      icon: "空",
      file: "manuals/空室清掃の流れ.pdf",
      summary: "空室全体の作業順と、窓・居室・収納・玄関の要点を確認します。",
      important: ["水回り・エアコンは個別マニュアルも確認", "窓は角度を変えて拭きムラを確認", "指でなぞられそうな箇所まで拭き上げる"],
      steps: [
        ["窓・網戸・バルコニー", "網戸は濡れタオルで上から下へ。窓は濡れ拭き後に乾拭きし、角度を変えてムラを確認。バルコニーはゴミを除去し、ケミクールとブラシで洗浄する。"],
        ["水回り・エアコン", "キッチン、浴室、トイレ、洗面台、エアコンはそれぞれの個別マニュアルを参照する。"],
        ["居室・収納・設備", "桟、サッシ、コンセント上縁などのホコリを除去。照明、クローゼット、棚を清掃し、床は掃除機後に拭き上げる。"],
        ["玄関", "床、ドアポスト、下駄箱の内部まで拭き上げる。"],
      ],
    },
    {
      id: "kitchen",
      name: "キッチン・換気扇",
      icon: "換",
      file: "manuals/キッチン・換気扇清掃マニュアル.pdf",
      summary: "漬け置き時間を活かして、換気扇とキッチンを効率よく進めます。",
      important: ["網状部品は洗剤による変色・塗装剥がれを端でテスト", "漬け置き中にキッチン全体を進める", "最後に蛇口の向きまで整える"],
      steps: [
        ["お湯の準備", "バケツ8割程度の水を湯沸かし器で温める。完了まで他の作業を進める。"],
        ["換気扇の取り外し", "整流板、網状フタ、円形カバー、シロッコファンなどを丁寧に取り外す。"],
        ["漬け置き", "お湯にケミクールを入れ、ファン、ネジ、カバー、五徳を漬け置く。"],
        ["キッチン全体", "ケミクールとタオルで拭き上げ、隅や溝はスクレーパー、焦げは焦げ落としを使う。"],
        ["部品磨き", "五徳やシロッコファンをブラシ等で磨く。"],
        ["シンク・蛇口・仕上げ", "油、水垢、石鹸カスを落とし、排水口部品も清掃。最後に拭き上げる。"],
      ],
    },
    {
      id: "bath",
      name: "お風呂",
      icon: "浴",
      file: "manuals/お風呂清掃マニュアル.pdf",
      summary: "カビ取りと水垢・石鹸カスの除去を、素材に注意しながら進めます。",
      important: ["塩素系洗剤と他洗剤を混ぜない", "コーティング面に焦げ落としを使わない", "ダイヤ研磨剤は立てず、優しく使う"],
      steps: [
        ["換気扇", "フタを外し、手の届く範囲を清掃。フィルターは手洗いする。"],
        ["カビ取り", "カビの種類と箇所に合わせて洗剤を塗り、30分以上置く。他の洗剤と混ざらないよう注意する。"],
        ["浴室全体", "ヌリッパーを少量でくまなく塗り、素材に合った道具で汚れを落とす。"],
        ["排水口・鏡・ドア", "排水口部品、鏡、ドア、隙間を順に清掃する。"],
        ["仕上げ", "全体を拭き上げ、カビ残り、水気、蛇口やシャワーの向きを確認する。"],
      ],
    },
    {
      id: "aircon",
      name: "エアコン",
      icon: "AC",
      file: "manuals/エアコン清掃マニュアル.pdf",
      summary: "破損と水濡れを防ぎながら、解体・養生・高圧洗浄・復旧を行います。",
      important: ["絶対に力ずくで部品を外さない", "作業前に動作と破損箇所を撮影", "水は中央方向へ噴霧し、両端へかけない"],
      steps: [
        ["事前確認・解体", "冷房動作、ルーバー、破損箇所を確認して撮影。ネジやツメを確認しながら丁寧に解体する。"],
        ["養生", "壁面、本体周辺、コンセント、基板を保護し、ホッパーと排水ホースを設置する。"],
        ["高圧洗浄", "洗浄液を噴霧し、水が透明になるまで洗浄する。両端を避け中央へ向けて噴霧する。"],
        ["乾燥・部品清掃・復旧", "冷房・風量MAXで乾燥。カバーを洗い、内部を拭き上げ、組み立て後に動作確認と撮影を行う。"],
      ],
    },
    {
      id: "washbasin",
      name: "洗面台",
      icon: "洗",
      file: "manuals/洗面台清掃マニュアル.pdf",
      summary: "他の水洗い作業後、上から下へ短時間で仕上げます。",
      important: ["他の清掃で水を使い終えた最後に実施", "基本は上から下へ", "仕上げは水気を残さない"],
      steps: [
        ["棚・上部", "取り外せる棚は外して水洗いする。"],
        ["鏡", "濡れタオルの後、乾いたタオルで円を描くように拭く。"],
        ["蛇口・洗面", "ヌリッパーと焦げ落としを中心に、細部はスクレーパーやブラシを使う。"],
        ["仕上げ", "乾いたタオルですべての水気を取る。"],
      ],
    },
    {
      id: "toilet",
      name: "トイレ",
      icon: "便",
      file: "manuals/トイレ清掃マニュアル.pdf",
      summary: "上から下へ、便器内部と床・境界まで確認します。",
      important: ["基本は上から下へ", "便器上縁の裏側を覗いて確認", "床と便器の境目の汚れを残さない"],
      steps: [
        ["換気扇・棚", "換気扇のホコリと棚の汚れを除去する。"],
        ["タンク・便座外側", "水垢、便座外側、ウォシュレット裏、フィルターを清掃する。"],
        ["便器内部", "ヌリッパーを塗布して擦り、落ちない場合はサンポール等を検討する。"],
        ["床・仕上げ", "床と便器の境、ドアノブ、壁、ホルダーまで拭き上げる。"],
      ],
    },
  ];

  const initialJobs = [
    { id:"J001", date:"2026-07-14", start:"09:00", end:"12:00", client:"A管理会社", site:"メゾン北浜 203号室", address:"大阪市中央区北浜2-1-3", phone:"06-0000-0001", worker:"山田", tasks:["vacant","aircon"], status:"planned", note:"鍵は管理人室。駐車場は建物裏3番。", billing:30000, pay:18000, expense:0, issue:false, photos:{before:[],after:[]} },
    { id:"J002", date:"2026-07-14", start:"14:00", end:"16:00", client:"B不動産", site:"田中様宅", address:"大阪市北区中崎3-2-1", phone:"090-0000-0002", worker:"佐藤", tasks:["bath"], status:"planned", note:"ペットあり。玄関開閉時に注意。", billing:12000, pay:7000, expense:0, issue:false, photos:{before:[],after:[]} },
    { id:"J003", date:"2026-07-15", start:"10:00", end:"12:00", client:"A管理会社", site:"グリーンハイツ 105号室", address:"吹田市江坂町1-1-1", phone:"06-0000-0003", worker:"未設定", tasks:["kitchen"], status:"planned", note:"換気扇の型番を作業前に撮影。", billing:15000, pay:8500, expense:0, issue:false, photos:{before:[],after:[]} },
    { id:"J004", date:"2026-07-13", start:"09:30", end:"11:00", client:"B不動産", site:"山本様宅", address:"豊中市本町4-3-2", phone:"090-0000-0004", worker:"山田", tasks:["aircon"], status:"done", note:"室外機清掃なし。", billing:8500, pay:5000, expense:800, issue:false, photos:{before:[],after:[]} },
    { id:"J005", date:"2026-07-16", start:"13:00", end:"17:00", client:"A管理会社", site:"サンライズ江坂 401号室", address:"吹田市広芝町8-9", phone:"06-0000-0005", worker:"佐藤", tasks:["vacant"], status:"planned", note:"鍵はキーボックス。番号は管理者に確認。", billing:24000, pay:14000, expense:0, issue:false, photos:{before:[],after:[]} },
    { id:"J006", date:"2026-07-10", start:"10:00", end:"13:00", client:"A管理会社", site:"コーポ梅田 302号室", address:"大阪市北区梅田3-1-1", phone:"06-0000-0006", worker:"山田", tasks:["bath","toilet","washbasin"], status:"billing", note:"駐車場代実費請求。", billing:22000, pay:12500, expense:1200, issue:false, photos:{before:[],after:[]} },
    { id:"J007", date:"2026-07-08", start:"09:00", end:"11:00", client:"B不動産", site:"中村様宅", address:"大阪市福島区福島5-2-4", phone:"090-0000-0007", worker:"佐藤", tasks:["kitchen"], status:"billed", note:"", billing:14500, pay:8000, expense:0, issue:false, photos:{before:[],after:[]} },
  ];

  const el = {
    app: document.getElementById("app"),
    content: document.getElementById("content"),
    title: document.getElementById("pageTitle"),
    subtitle: document.getElementById("pageSubtitle"),
    nav: document.getElementById("adminNav"),
    modeSwitch: document.getElementById("modeSwitch"),
    addJobTop: document.getElementById("addJobTop"),
    modalBackdrop: document.getElementById("modalBackdrop"),
    modal: document.getElementById("modal"),
    toast: document.getElementById("toast"),
    mobileMenuBtn: document.getElementById("mobileMenuBtn"),
    mobileOverlay: document.getElementById("mobileOverlay"),
    todayLabel: document.getElementById("todayLabel"),
  };

  let jobs = loadJobs();

  function loadJobs() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(stored) ? stored : structuredClone(initialJobs);
    } catch { return structuredClone(initialJobs); }
  }
  function saveJobs() { localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs)); }
  function esc(value) { return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
  function yen(value) { return new Intl.NumberFormat("ja-JP", { style:"currency", currency:"JPY", maximumFractionDigits:0 }).format(Number(value)||0); }
  function jpDate(dateStr, includeYear=false) {
    const d = new Date(`${dateStr}T00:00:00`);
    return new Intl.DateTimeFormat("ja-JP", { year:includeYear?"numeric":undefined, month:"long", day:"numeric", weekday:"short" }).format(d);
  }
  function getManual(id) { return manuals.find(m => m.id === id); }
  function taskNames(job) { return job.tasks.map(id => getManual(id)?.name || id).join("・"); }
  function statusLabel(status) { return ({planned:"予定",progress:"作業中",done:"完了",billing:"請求対象",billed:"請求済み"})[status] || status; }
  function monthOf(date) { return date.slice(0,7); }
  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => el.toast.classList.remove("show"), 2200);
  }

  function setHeader(title, subtitle="") {
    el.title.textContent = title;
    el.subtitle.textContent = subtitle;
  }

  function render() {
    el.todayLabel.textContent = jpDate(TODAY, true);
    el.app.classList.toggle("staff-mode", state.mode === "staff");
    el.app.classList.remove("menu-open");

    if (state.mode === "staff") renderStaff();
    else renderAdmin();
  }

  function renderAdmin() {
    document.querySelectorAll(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.view === state.view));
    el.modeSwitch.innerHTML = '<span class="mode-icon">▣</span><span><b>スタッフ画面へ</b><small>表示を切り替え</small></span>';
    el.addJobTop.style.display = "inline-flex";

    const routes = {
      dashboard: ["ホーム", "今日の状況と対応事項を確認します", renderDashboard],
      calendar: ["カレンダー", "案件と担当者の予定を確認します", renderCalendar],
      jobs: ["案件", "登録済みの案件を一覧で確認します", renderJobs],
      billing: ["請求・支払", "完了案件から月次金額を確認します", renderBilling],
      manuals: ["手順書", "現場で使用するマニュアルを管理します", renderManuals],
      detail: ["案件詳細", "予定・報告・金額をまとめて確認します", renderJobDetail],
      manualDetail: ["手順書詳細", "重要事項と作業の流れを確認します", renderManualDetail],
    };
    const [title, sub, fn] = routes[state.view] || routes.dashboard;
    setHeader(title, sub);
    el.content.innerHTML = fn();
    bindSharedContentActions();
  }

  function renderDashboard() {
    const todayJobs = jobs.filter(j => j.date === TODAY);
    const unassigned = jobs.filter(j => j.worker === "未設定" && j.status === "planned");
    const overdue = jobs.filter(j => j.date < TODAY && j.status === "planned");
    const unbilled = jobs.filter(j => monthOf(j.date) === state.billingMonth && ["done","billing"].includes(j.status));
    const billingTotal = jobs.filter(j => monthOf(j.date) === state.billingMonth && ["done","billing","billed"].includes(j.status)).reduce((s,j)=>s+j.billing+j.expense,0);
    return `
      <div class="section-grid">
        <div class="metrics-grid">
          ${metric("今日の案件", `${todayJobs.length}件`, "本")}
          ${metric("担当者未設定", `${unassigned.length}件`, "!", unassigned.length?"warning":"")}
          ${metric("完了・確認待ち", `${jobs.filter(j=>j.status==="done").length}件`, "✓")}
          ${metric("今月の請求予定", yen(billingTotal), "¥")}
        </div>
        <div class="dashboard-grid">
          <section class="panel">
            <div class="panel-header"><h2>今日の予定</h2><button class="text-link" data-go="calendar">カレンダーを見る</button></div>
            <div class="panel-body">
              <div class="schedule-list">
                ${todayJobs.length ? todayJobs.sort((a,b)=>a.start.localeCompare(b.start)).map(scheduleRow).join("") : '<div class="empty-state"><b>本日の案件はありません</b>予定が追加されるとここに表示されます。</div>'}
              </div>
            </div>
          </section>
          <section class="panel">
            <div class="panel-header"><h2>対応が必要</h2></div>
            <div class="panel-body"><div class="attention-list">
              ${unassigned.length ? attention(`担当者未設定の案件が ${unassigned.length}件あります。`, true) : ""}
              ${overdue.length ? attention(`作業日を過ぎた未完了案件が ${overdue.length}件あります。`, true) : ""}
              ${unbilled.length ? attention(`今月の完了・未請求案件が ${unbilled.length}件あります。`) : ""}
              ${(!unassigned.length && !overdue.length && !unbilled.length) ? attention("現在、優先して対応する項目はありません。") : ""}
            </div></div>
          </section>
        </div>
      </div>`;
  }

  function metric(label, value, icon, cls="") { return `<article class="metric-card ${cls}"><div><div class="label">${label}</div><div class="value">${value}</div></div><div class="metric-icon">${icon}</div></article>`; }
  function attention(text, danger=false) { return `<div class="attention-item ${danger?"danger":""}"><span class="attention-icon">${danger?"!":"●"}</span><p>${esc(text)}</p></div>`; }
  function scheduleRow(job) {
    const assigned = job.worker !== "未設定";
    return `<button class="schedule-row row-button" data-job-id="${job.id}" style="width:100%;color:inherit;text-align:left;">
      <span class="schedule-time">${esc(job.start)}</span>
      <span class="schedule-main"><strong>${esc(job.site)}</strong><small>${esc(taskNames(job))}</small></span>
      <span class="person-chip ${assigned?"":"unassigned"}">${esc(job.worker)}</span>
    </button>`;
  }

  function getWeekDates(offset=0) {
    const base = new Date(`${TODAY}T00:00:00`);
    const day = base.getDay();
    const mondayDiff = (day + 6) % 7;
    base.setDate(base.getDate() - mondayDiff + offset*7);
    return Array.from({length:7}, (_,i)=>{ const d=new Date(base); d.setDate(base.getDate()+i); return d.toISOString().slice(0,10); });
  }

  function renderCalendar() {
    const dates = getWeekDates(state.weekOffset);
    return `
      <div class="toolbar">
        <div class="toolbar-group">
          <button class="ghost-btn" data-week="-1">‹ 前週</button>
          <strong>${jpDate(dates[0])} 〜 ${jpDate(dates[6])}</strong>
          <button class="ghost-btn" data-week="1">次週 ›</button>
        </div>
        <div class="toolbar-group">
          <select id="workerFilter" class="filter-select"><option value="all">全担当者</option><option>山田</option><option>佐藤</option><option>未設定</option></select>
          <button class="primary-btn" data-add-job>＋ 案件追加</button>
        </div>
      </div>
      <div class="calendar-wrap">
        <div class="calendar-grid">
          ${dates.map(date => {
            const dayJobs = jobs.filter(j=>j.date===date).sort((a,b)=>a.start.localeCompare(b.start));
            return `<div class="calendar-day" data-date="${date}">
              <div class="calendar-head ${date===TODAY?"today":""}">${jpDate(date)}</div>
              <div class="calendar-body">${dayJobs.map(calendarJob).join("")}</div>
            </div>`;
          }).join("")}
        </div>
      </div>`;
  }
  function calendarJob(job) { return `<button class="calendar-job ${job.worker==="未設定"?"unassigned":""} ${job.status==="done"?"done":""}" data-job-id="${job.id}" data-worker="${esc(job.worker)}"><time>${esc(job.start)}</time><strong>${esc(job.site)}</strong><small>${esc(taskNames(job))}</small><small>${esc(job.worker)}</small></button>`; }

  function renderJobs() {
    const rows = [...jobs].sort((a,b)=>b.date.localeCompare(a.date)||a.start.localeCompare(b.start));
    return `
      <div class="toolbar">
        <div class="toolbar-group">
          <input id="jobSearch" class="form-control" placeholder="現場名・元請け・担当者で検索" style="min-width:280px" />
          <select id="statusFilter" class="filter-select"><option value="all">全ステータス</option><option value="planned">予定</option><option value="done">完了</option><option value="billing">請求対象</option><option value="billed">請求済み</option></select>
        </div>
        <button class="primary-btn" data-add-job>＋ 案件追加</button>
      </div>
      <div class="table-card">
        <table>
          <thead><tr><th>作業日</th><th>現場</th><th>元請け</th><th>作業内容</th><th>担当者</th><th>状態</th><th></th></tr></thead>
          <tbody id="jobTableBody">${rows.map(jobRow).join("")}</tbody>
        </table>
      </div>`;
  }
  function jobRow(job) { return `<tr data-search="${esc([job.site,job.client,job.worker,taskNames(job)].join(" ").toLowerCase())}" data-status="${job.status}"><td>${jpDate(job.date)}</td><td><strong>${esc(job.site)}</strong><br><small>${esc(job.start)}〜${esc(job.end||"")}</small></td><td>${esc(job.client)}</td><td>${esc(taskNames(job))}</td><td>${esc(job.worker)}</td><td><span class="status-chip ${job.status}">${statusLabel(job.status)}</span></td><td><button class="row-button" data-job-id="${job.id}">詳細</button></td></tr>`; }

  function renderJobDetail() {
    const job = jobs.find(j=>j.id===state.selectedJobId);
    if (!job) return '<div class="empty-state"><b>案件が見つかりません</b></div>';
    return `
      <div class="toolbar"><button class="ghost-btn" data-go="jobs">‹ 案件一覧へ</button><div class="toolbar-group"><button class="secondary-btn" data-edit-job="${job.id}">編集</button><button class="ghost-btn" data-staff-preview="${job.id}">スタッフ画面を確認</button></div></div>
      <div class="job-detail-grid">
        <section class="panel">
          <div class="panel-header"><div><h2>${esc(job.site)}</h2><small>${jpDate(job.date,true)} ${esc(job.start)}〜${esc(job.end||"")}</small></div><span class="status-chip ${job.status}">${statusLabel(job.status)}</span></div>
          <div class="panel-body"><dl class="detail-list">
            ${detail("元請け",job.client)}${detail("担当者",job.worker)}${detail("住所",`${job.address}　<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}" target="_blank" rel="noopener">地図を開く</a>`,true)}${detail("電話番号",job.phone||"未登録")}${detail("作業内容",taskNames(job))}${detail("注意事項",job.note||"なし")}
          </dl></div>
        </section>
        <div class="section-grid">
          <section class="panel"><div class="panel-header"><h2>作業状況</h2></div><div class="panel-body"><dl class="detail-list">${detail("作業状態",statusLabel(job.status))}${detail("作業前写真",`${job.photos?.before?.length||0}枚`)}${detail("作業後写真",`${job.photos?.after?.length||0}枚`)}${detail("問題報告",job.issue?"あり":"なし")}</dl><div class="action-row"><button class="secondary-btn" data-status-next="${job.id}">状態を進める</button></div></div></section>
          <section class="panel"><div class="panel-header"><h2>金額</h2></div><div class="panel-body"><div class="money-box"><small>元請けへの請求予定</small><strong>${yen(job.billing+job.expense)}</strong></div><dl class="detail-list" style="margin-top:10px">${detail("作業単価",yen(job.billing))}${detail("経費",yen(job.expense))}${detail("担当者支払",yen(job.pay))}</dl></div></section>
        </div>
      </div>`;
  }
  function detail(label,value,html=false) { return `<div class="detail-row"><dt>${esc(label)}</dt><dd>${html?value:esc(value)}</dd></div>`; }

  function renderBilling() {
    const monthJobs = jobs.filter(j=>monthOf(j.date)===state.billingMonth && ["done","billing","billed"].includes(j.status));
    const clients = groupBy(monthJobs, "client");
    const workers = groupBy(monthJobs.filter(j=>j.worker!=="未設定"), "worker");
    return `
      <div class="toolbar"><div class="toolbar-group"><label for="billingMonth"><strong>対象月</strong></label><input id="billingMonth" class="form-control" type="month" value="${state.billingMonth}" /></div><button class="ghost-btn" id="resetDemo">デモデータを初期化</button></div>
      <div class="billing-summary">
        <section class="panel"><div class="panel-header"><h2>元請けへの請求</h2></div><div class="panel-body billing-list">
          ${Object.keys(clients).length ? Object.entries(clients).map(([name,list])=>billingRow(name,list.length,list.reduce((s,j)=>s+j.billing+j.expense,0),"client")).join("") : '<div class="empty-state"><b>対象案件がありません</b></div>'}
        </div></section>
        <section class="panel"><div class="panel-header"><h2>担当者への支払</h2></div><div class="panel-body billing-list">
          ${Object.keys(workers).length ? Object.entries(workers).map(([name,list])=>billingRow(name,list.length,list.reduce((s,j)=>s+j.pay,0),"worker")).join("") : '<div class="empty-state"><b>対象案件がありません</b></div>'}
        </div></section>
      </div>`;
  }
  function groupBy(list,key) { return list.reduce((acc,item)=>{ (acc[item[key]] ||= []).push(item); return acc; },{}); }
  function billingRow(name,count,amount,type) { return `<div class="billing-row"><div><strong>${esc(name)}</strong><br><small>${count}件</small></div><span class="billing-amount">${yen(amount)}</span><button class="secondary-btn" data-billing-detail="${type}|${esc(name)}">確認</button></div>`; }

  function renderManuals() {
    return `<div class="manual-grid">${manuals.map(m=>`<article class="manual-card"><div class="manual-icon">${esc(m.icon)}</div><h3>${esc(m.name)}</h3><p>${esc(m.summary)}</p><div class="manual-actions"><button class="secondary-btn" data-manual-id="${m.id}">要点を見る</button><a class="ghost-btn" href="${encodeURI(m.file)}" target="_blank" rel="noopener" style="text-decoration:none">PDF</a></div></article>`).join("")}</div>`;
  }

  function renderManualDetail() {
    const m = getManual(state.selectedManualId);
    if (!m) return '<div class="empty-state"><b>手順書が見つかりません</b></div>';
    return `<div class="toolbar"><button class="ghost-btn" data-manual-back>‹ 戻る</button><a class="primary-btn" href="${encodeURI(m.file)}" target="_blank" rel="noopener" style="text-decoration:none">元のPDFを開く</a></div>${manualDetailMarkup(m)}`;
  }
  function manualDetailMarkup(m) { return `<div class="manual-detail section-grid"><section class="panel"><div class="panel-body"><h2>${esc(m.name)}清掃</h2><p class="lead">${esc(m.summary)}</p><div class="notice-box" style="margin-top:16px"><strong>重要事項</strong><ul class="important-list">${m.important.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></div></section><section><h3>作業の流れ</h3>${m.steps.map((s,i)=>`<details class="step" ${i===0?"open":""}><summary>${i+1}. ${esc(s[0])}</summary><div class="step-body">${esc(s[1])}</div></details>`).join("")}</section></div>`; }

  function renderStaff() {
    el.modeSwitch.innerHTML = '<span class="mode-icon">⌂</span><span><b>管理者画面へ</b><small>表示を切り替え</small></span>';
    const titles = { today:"今日の案件", upcoming:"今後の案件", manuals:"手順書", detail:"案件詳細", complete:"作業完了", manualDetail:"手順書" };
    setHeader(titles[state.staffView] || "今日の案件", "");
    let html = "";
    if (state.staffView === "today") html = renderStaffJobs(true);
    else if (state.staffView === "upcoming") html = renderStaffJobs(false);
    else if (state.staffView === "manuals") html = renderStaffManuals();
    else if (state.staffView === "detail") html = renderStaffDetail();
    else if (state.staffView === "complete") html = renderComplete();
    else if (state.staffView === "manualDetail") html = renderStaffManualDetail();
    el.content.innerHTML = html + renderStaffNav();
    bindSharedContentActions();
  }

  function staffJobs() { return jobs.filter(j=>j.worker==="山田"); }
  function renderStaffJobs(todayOnly) {
    const list = staffJobs().filter(j=>todayOnly?j.date===TODAY:j.date>TODAY).sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start));
    return `<div class="staff-job-list">${list.length?list.map(j=>`<article class="staff-job-card"><div class="time">${todayOnly?esc(j.start):jpDate(j.date)} ${!todayOnly?esc(j.start):""}</div><h3>${esc(j.site)}</h3><p>${esc(taskNames(j))}</p><button class="primary-btn" data-staff-job="${j.id}">案件を開く</button></article>`).join(""):'<div class="empty-state"><b>該当する案件はありません</b></div>'}</div>`;
  }
  function renderStaffNav() { return `<nav class="staff-bottom-nav"><button data-staff-go="today" class="${state.staffView==="today"?"active":""}"><span>⌂</span>今日</button><button data-staff-go="upcoming" class="${state.staffView==="upcoming"?"active":""}"><span>▦</span>今後</button><button data-staff-go="manuals" class="${state.staffView==="manuals"?"active":""}"><span>▧</span>手順書</button><button id="staffAdminSwitch"><span>⚙</span>管理</button></nav>`; }

  function renderStaffDetail() {
    const job = jobs.find(j=>j.id===state.selectedJobId);
    if (!job) return '<div class="empty-state"><b>案件が見つかりません</b></div>';
    return `<button class="ghost-btn" data-staff-go="today" style="margin-bottom:12px">‹ 戻る</button>
      <section class="staff-detail-hero"><small>${jpDate(job.date,true)} ${esc(job.start)}〜${esc(job.end||"")}</small><h2>${esc(job.site)}</h2><p>${esc(taskNames(job))}</p></section>
      <section class="staff-section"><h3>現場情報</h3><div class="staff-section-body"><p style="margin-top:0"><strong>${esc(job.address)}</strong></p><a class="secondary-btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none">地図を開く</a></div></section>
      <section class="staff-section"><h3>注意事項</h3><div class="staff-section-body"><div class="notice-box">${esc(job.note||"特別な注意事項はありません。")}</div></div></section>
      <section class="staff-section"><h3>作業手順</h3><div class="staff-section-body"><div class="manual-link-list">${job.tasks.map(id=>{const m=getManual(id);return `<button class="manual-link-btn" data-staff-manual="${id}"><span>${esc(m.name)}の手順を見る</span><span>›</span></button>`;}).join("")}</div></div></section>
      <section class="staff-section"><h3>写真</h3><div class="staff-section-body"><div class="photo-grid"><label class="photo-btn"><input type="file" accept="image/*" capture="environment" data-photo="before" hidden><span>＋<br>作業前写真</span></label><label class="photo-btn"><input type="file" accept="image/*" capture="environment" data-photo="after" hidden><span>＋<br>作業後写真</span></label></div></div></section>
      <div class="sticky-complete"><button class="primary-btn" data-complete-job="${job.id}">作業完了へ進む</button></div>`;
  }

  function renderComplete() {
    const job = jobs.find(j=>j.id===state.selectedJobId);
    return `<form id="completeForm">
      <button type="button" class="ghost-btn" data-staff-back-detail style="margin-bottom:12px">‹ 案件へ戻る</button>
      <section class="panel"><div class="panel-header"><h2>最終確認</h2></div><div class="panel-body">
        <div class="section-grid" style="gap:10px">
          ${["必要な清掃作業が完了している","指定された作業前後の写真を登録した","破損・異常・未完了箇所がない","洗剤・道具・忘れ物が残っていない"].map((x,i)=>`<label class="checkbox-card"><input required type="checkbox" name="check${i}"><span>${x}</span></label>`).join("")}
          ${job.tasks.includes("aircon")?'<label class="checkbox-card"><input required type="checkbox"><span>組み立て後の動作と水漏れを確認した</span></label>':""}
        </div>
        <div class="form-group" style="margin-top:18px"><label>問題はありましたか？</label><select id="issueSelect" class="form-control" required><option value="no">なし</option><option value="yes">あり</option></select></div>
        <div id="issueFields" hidden style="margin-top:12px"><div class="form-group"><label>問題内容</label><textarea id="issueText" class="form-control" placeholder="未完了箇所や破損状況を入力"></textarea></div></div>
        <div class="form-group" style="margin-top:14px"><label>駐車場代など（任意）</label><input id="expenseInput" class="form-control" type="number" min="0" step="1" value="${job.expense||0}"></div>
        <button class="primary-btn" type="submit" style="width:100%;margin-top:18px;min-height:50px">作業完了を登録</button>
      </div></section>
    </form>`;
  }

  function renderStaffManuals() { return `<div class="manual-link-list">${manuals.map(m=>`<button class="manual-link-btn" data-staff-manual="${m.id}"><span>${esc(m.name)}</span><span>›</span></button>`).join("")}</div>`; }
  function renderStaffManualDetail() { const m=getManual(state.selectedManualId); return `<button class="ghost-btn" data-staff-manual-back style="margin-bottom:12px">‹ 戻る</button>${manualDetailMarkup(m)}<a class="primary-btn" href="${encodeURI(m.file)}" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;margin-top:16px">元のPDFを開く</a>`; }

  function bindSharedContentActions() {
    el.content.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{state.view=b.dataset.go;render();}));
    el.content.querySelectorAll("[data-job-id]").forEach(b=>b.addEventListener("click",()=>{state.selectedJobId=b.dataset.jobId;state.view="detail";render();}));
    el.content.querySelectorAll("[data-manual-id]").forEach(b=>b.addEventListener("click",()=>{state.selectedManualId=b.dataset.manualId;state.view="manualDetail";render();}));
    el.content.querySelectorAll("[data-add-job]").forEach(b=>b.addEventListener("click",()=>openJobModal()));
    el.content.querySelectorAll("[data-week]").forEach(b=>b.addEventListener("click",()=>{state.weekOffset+=Number(b.dataset.week);render();}));

    const workerFilter = document.getElementById("workerFilter");
    workerFilter?.addEventListener("change",()=>document.querySelectorAll(".calendar-job").forEach(card=>card.hidden=workerFilter.value!=="all"&&card.dataset.worker!==workerFilter.value));
    const jobSearch = document.getElementById("jobSearch"); const statusFilter=document.getElementById("statusFilter");
    const filterRows=()=>document.querySelectorAll("#jobTableBody tr").forEach(row=>{const q=(jobSearch?.value||"").toLowerCase();const st=statusFilter?.value||"all";row.hidden=!(row.dataset.search.includes(q)&&(st==="all"||row.dataset.status===st));});
    jobSearch?.addEventListener("input",filterRows); statusFilter?.addEventListener("change",filterRows);
    document.getElementById("billingMonth")?.addEventListener("change",e=>{state.billingMonth=e.target.value;render();});
    document.getElementById("resetDemo")?.addEventListener("click",()=>{localStorage.removeItem(STORAGE_KEY);jobs=structuredClone(initialJobs);render();showToast("デモデータを初期化しました");});

    el.content.querySelectorAll("[data-edit-job]").forEach(b=>b.addEventListener("click",()=>openJobModal(jobs.find(j=>j.id===b.dataset.editJob))));
    el.content.querySelectorAll("[data-staff-preview]").forEach(b=>b.addEventListener("click",()=>{state.selectedJobId=b.dataset.staffPreview;state.mode="staff";state.staffView="detail";render();}));
    el.content.querySelectorAll("[data-status-next]").forEach(b=>b.addEventListener("click",()=>advanceStatus(b.dataset.statusNext)));
    el.content.querySelectorAll("[data-billing-detail]").forEach(b=>b.addEventListener("click",()=>openBillingDetail(...b.dataset.billingDetail.split("|"))));
    el.content.querySelector("[data-manual-back]")?.addEventListener("click",()=>{state.view="manuals";render();});

    el.content.querySelectorAll("[data-staff-go]").forEach(b=>b.addEventListener("click",()=>{state.staffView=b.dataset.staffGo;if(state.staffView==="manuals"){state.selectedJobId=null;state.manualFromJob=false;}render();}));
    el.content.querySelectorAll("[data-staff-job]").forEach(b=>b.addEventListener("click",()=>{state.selectedJobId=b.dataset.staffJob;state.staffView="detail";render();}));
    el.content.querySelectorAll("[data-staff-manual]").forEach(b=>b.addEventListener("click",()=>{state.manualFromJob=state.staffView==="detail";state.selectedManualId=b.dataset.staffManual;state.staffView="manualDetail";render();}));
    el.content.querySelector("[data-staff-manual-back]")?.addEventListener("click",()=>{state.staffView=state.manualFromJob?"detail":"manuals";state.manualFromJob=false;render();});
    el.content.querySelector("[data-complete-job]")?.addEventListener("click",()=>{state.staffView="complete";render();});
    el.content.querySelector("[data-staff-back-detail]")?.addEventListener("click",()=>{state.staffView="detail";render();});
    document.getElementById("staffAdminSwitch")?.addEventListener("click",switchMode);
    el.content.querySelectorAll("input[data-photo]").forEach(input=>input.addEventListener("change",handlePhoto));
    const issueSelect=document.getElementById("issueSelect"); issueSelect?.addEventListener("change",()=>{document.getElementById("issueFields").hidden=issueSelect.value!=="yes";});
    document.getElementById("completeForm")?.addEventListener("submit",completeJob);
  }

  function handlePhoto(event) {
    const input=event.target; const file=input.files?.[0]; if(!file)return;
    const label=input.closest("label"); const reader=new FileReader();
    reader.onload=()=>{label.innerHTML=`<input type="file" accept="image/*" capture="environment" data-photo="${input.dataset.photo}" hidden><img alt="登録写真" src="${reader.result}">`;label.querySelector("input").addEventListener("change",handlePhoto);const job=jobs.find(j=>j.id===state.selectedJobId);job.photos ||= {before:[],after:[]};job.photos[input.dataset.photo]=["demo-photo"];saveJobs();};
    reader.readAsDataURL(file);
  }

  function completeJob(e) {
    e.preventDefault(); const job=jobs.find(j=>j.id===state.selectedJobId); job.status="done";job.issue=document.getElementById("issueSelect").value==="yes";job.issueText=document.getElementById("issueText")?.value||"";job.expense=Number(document.getElementById("expenseInput").value)||0;saveJobs();showToast("作業完了を登録しました");state.staffView="today";render();
  }

  function advanceStatus(id) {
    const order=["planned","progress","done","billing","billed"]; const job=jobs.find(j=>j.id===id); const i=order.indexOf(job.status); job.status=order[Math.min(i+1,order.length-1)];saveJobs();render();showToast(`状態を「${statusLabel(job.status)}」に変更しました`);
  }

  function openJobModal(job=null) {
    const edit=Boolean(job); const today=TODAY;
    el.modal.innerHTML=`<form id="jobForm"><div class="modal-header"><h2 id="modalTitle">${edit?"案件を編集":"新しい案件"}</h2><button class="close-btn" type="button" data-close>×</button></div><div class="modal-body"><div class="form-grid">
      <div class="form-group"><label>元請け *</label><select name="client" class="form-control" required><option value="">選択してください</option>${["A管理会社","B不動産","その他"].map(x=>`<option ${job?.client===x?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="form-group"><label>担当者 *</label><select name="worker" class="form-control" required>${["未設定","山田","佐藤"].map(x=>`<option ${job?.worker===x?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="form-group"><label>作業日 *</label><input name="date" type="date" class="form-control" value="${job?.date||today}" required></div>
      <div class="form-group"><label>時間 *</label><div style="display:flex;gap:8px"><input name="start" type="time" class="form-control" value="${job?.start||"09:00"}" required><input name="end" type="time" class="form-control" value="${job?.end||""}"></div></div>
      <div class="form-group full"><label>現場名 *</label><input name="site" class="form-control" value="${esc(job?.site||"")}" placeholder="例：〇〇マンション 203号室" required></div>
      <div class="form-group full"><label>住所 *</label><input name="address" class="form-control" value="${esc(job?.address||"")}" required></div>
      <div class="form-group"><label>電話番号</label><input name="phone" class="form-control" value="${esc(job?.phone||"")}"></div>
      <div class="form-group"><label>元請け請求予定額</label><input name="billing" type="number" min="0" class="form-control" value="${job?.billing||0}"></div>
      <div class="form-group full"><label>作業内容 *</label><div class="checkbox-grid">${manuals.map(m=>`<label class="checkbox-card"><input type="checkbox" name="tasks" value="${m.id}" ${job?.tasks.includes(m.id)?"checked":""}><span>${esc(m.name)}</span></label>`).join("")}</div></div>
      <div class="form-group"><label>担当者支払予定額</label><input name="pay" type="number" min="0" class="form-control" value="${job?.pay||0}"></div>
      <div class="form-group"><label>経費</label><input name="expense" type="number" min="0" class="form-control" value="${job?.expense||0}"></div>
      <div class="form-group full"><label>注意事項</label><textarea name="note" class="form-control">${esc(job?.note||"")}</textarea></div>
      </div></div><div class="modal-footer"><button type="button" class="ghost-btn" data-close>キャンセル</button><button class="primary-btn" type="submit">${edit?"保存":"案件を登録"}</button></div></form>`;
    openModal();
    el.modal.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",closeModal));
    document.getElementById("jobForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const tasks=fd.getAll("tasks");if(!tasks.length){showToast("作業内容を1つ以上選択してください");return;}const payload={id:job?.id||`J${Date.now()}`,date:fd.get("date"),start:fd.get("start"),end:fd.get("end"),client:fd.get("client"),site:fd.get("site"),address:fd.get("address"),phone:fd.get("phone"),worker:fd.get("worker"),tasks,status:job?.status||"planned",note:fd.get("note"),billing:Number(fd.get("billing"))||0,pay:Number(fd.get("pay"))||0,expense:Number(fd.get("expense"))||0,issue:job?.issue||false,photos:job?.photos||{before:[],after:[]}};if(edit)jobs=jobs.map(j=>j.id===job.id?payload:j);else jobs.push(payload);saveJobs();closeModal();state.view="jobs";render();showToast(edit?"案件を更新しました":"案件を登録しました");});
  }

  function openBillingDetail(type,name) {
    const list=jobs.filter(j=>monthOf(j.date)===state.billingMonth && ["done","billing","billed"].includes(j.status) && j[type]===name);
    const isClient=type==="client";
    el.modal.innerHTML=`<div class="modal-header"><h2 id="modalTitle">${esc(name)}・${state.billingMonth.replace("-","年")}月分</h2><button class="close-btn" data-close>×</button></div><div class="modal-body"><div class="table-card" style="box-shadow:none"><table style="min-width:620px"><thead><tr><th>作業日</th><th>現場</th><th>作業内容</th><th>金額</th></tr></thead><tbody>${list.map(j=>`<tr><td>${jpDate(j.date)}</td><td>${esc(j.site)}</td><td>${esc(taskNames(j))}</td><td>${yen(isClient?j.billing+j.expense:j.pay)}</td></tr>`).join("")}</tbody></table></div><div class="money-box" style="margin-top:16px"><small>合計</small><strong>${yen(list.reduce((s,j)=>s+(isClient?j.billing+j.expense:j.pay),0))}</strong></div></div><div class="modal-footer"><button class="ghost-btn" data-close>閉じる</button>${isClient?'<button class="primary-btn" id="createInvoiceDemo">請求書PDF作成（次段階）</button>':""}</div>`;
    openModal();el.modal.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",closeModal));document.getElementById("createInvoiceDemo")?.addEventListener("click",()=>showToast("PDF発行機能は次段階で接続します"));
  }

  function openModal(){el.modalBackdrop.hidden=false;document.body.style.overflow="hidden";}
  function closeModal(){el.modalBackdrop.hidden=true;document.body.style.overflow="";}
  function switchMode(){state.mode=state.mode==="admin"?"staff":"admin";if(state.mode==="admin"){state.view="dashboard";}else{state.staffView="today";state.selectedJobId=null;}render();}

  el.nav.addEventListener("click",e=>{const btn=e.target.closest("[data-view]");if(!btn)return;state.view=btn.dataset.view;render();});
  el.modeSwitch.addEventListener("click",switchMode);
  el.addJobTop.addEventListener("click",()=>openJobModal());
  el.modalBackdrop.addEventListener("click",e=>{if(e.target===el.modalBackdrop)closeModal();});
  el.mobileMenuBtn.addEventListener("click",()=>el.app.classList.toggle("menu-open"));
  el.mobileOverlay.addEventListener("click",()=>el.app.classList.remove("menu-open"));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!el.modalBackdrop.hidden)closeModal();});

  render();
})();
