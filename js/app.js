// SBARR Zorgsim: menu -> explore the room -> report to the doctor -> coach feedback.
(function () {
  "use strict";

  const ROOMS = window.ROOMS;
  const NURSE = window.NURSE;
  const { SCENARIOS: SC, DOCTORS: PE, ELEMENTS: EL, HINTS: HINT } = window.SBARR;

  const START_LOG = "Klik op een cirkel in de kamer. Je personage loopt er zelf naartoe.";
  const STAGE_W = 640, STAGE_H = 420;
  const TALK_ID = 6; // "found" id for the conversation with the patient (clues are 0-5)

  const freshMission = (pi) => ({
    screen: "explore", found: [], log: START_LOG, ai: 4.2, aj: 5.2, face: 0, frame: 0,
    menu: null, bubble: "", busy: false, f: { S: "", B: "", A: "", R: "" }, stage: 0, rb: "",
    docSays: PE[pi].intro, res: null
  });

  const state = Object.assign(freshMission(0), {
    screen: "menu", si: 0, pi: 0,
    Q: { S: 0.5, B: 0.5, A: 0.5, R: 0.5, X: 0.5 }, // coach's value per SBARR element
    QS: [0.5, 0.5, 0.5], // coach's value per scenario
    hist: [], total: 0, next: null
  });

  const root = document.getElementById("game");
  let walkTimer = null;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const elName = (k) => EL.find((e) => e[0] === k)[1];
  const shownLetter = (k) => (k === "X" ? "R" : k);

  function setState(patch) {
    Object.assign(state, patch);
    render();
  }

  // ---------- Scoring ----------
  function score(k, text) {
    const t = (text || "").toLowerCase(), hit = [], miss = [];
    SC[state.si][k].forEach((rule) => (new RegExp(rule[1]).test(t) ? hit : miss).push(rule[0]));
    return { s: hit.length / SC[state.si][k].length, hit, miss };
  }

  // ---------- Walking (A* on a 24x24 grid of 0.25-tile cells, then line-of-sight smoothing) ----------
  function findPath(si, a, b) {
    const G = ROOMS[si].blocked, N = 24, C = 0.25;
    const cell = (p) => [clamp(Math.floor(p[0] / C), 0, N - 1), clamp(Math.floor(p[1] / C), 0, N - 1)];
    const blk = (x, y) => { const ci = Math.floor(x / C), cj = Math.floor(y / C); return ci < 0 || cj < 0 || ci >= N || cj >= N || G[cj][ci] === "1"; };
    const los = (p, q) => {
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.ceil(d / 0.05));
      for (let k = 1; k <= n; k++) if (blk(p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n)) return false;
      return true;
    };
    const s = cell(a), t = cell(b), key = (c) => c[1] * N + c[0];
    const g = {}, par = {}, open = [[0, s]], seen = {};
    g[key(s)] = 0;
    while (open.length) {
      open.sort((x, y) => x[0] - y[0]);
      const cur = open.shift()[1], ck = key(cur);
      if (seen[ck]) continue;
      seen[ck] = 1;
      if (cur[0] === t[0] && cur[1] === t[1]) break;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const nx = cur[0] + dx, ny = cur[1] + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || G[ny][nx] === "1") continue;
        if (dx && dy && (G[cur[1]][nx] === "1" || G[ny][cur[0]] === "1")) continue;
        const nk = ny * N + nx, ng = g[ck] + Math.hypot(dx, dy);
        if (g[nk] === undefined || ng < g[nk]) { g[nk] = ng; par[nk] = cur; open.push([ng + Math.hypot(t[0] - nx, t[1] - ny), [nx, ny]]); }
      }
    }
    if (g[key(t)] === undefined) return [a, b];
    const cs = [];
    let c = t;
    while (c && key(c) !== key(s)) { cs.unshift([(c[0] + 0.5) * C, (c[1] + 0.5) * C]); c = par[key(c)]; }
    cs.unshift(a);
    cs[cs.length - 1] = b;
    const out = [cs[0]];
    let i = 0;
    while (i < cs.length - 1) {
      let j = cs.length - 1;
      while (j > i + 1 && !los(cs[i], cs[j])) j--;
      out.push(cs[j]);
      i = j;
    }
    return out;
  }

  // face: 0/1 = front (right/left), 2/3 = back (right/left)
  function faceTo(ci, cj) {
    const dx = ci - state.ai, dy = cj - state.aj;
    return (dx + dy < 0 ? 2 : 0) + (dx - dy < 0 ? 1 : 0);
  }

  function walkTo(target, done) {
    clearInterval(walkTimer);
    const path = findPath(state.si, [state.ai, state.aj], target);
    let k = 1, n = 0;
    walkTimer = setInterval(() => {
      if (k >= path.length) { clearInterval(walkTimer); state.frame = 0; updateActors(); if (done) done(); return; }
      const t = path[k], dx = t[0] - state.ai, dy = t[1] - state.aj, d = Math.hypot(dx, dy);
      if (d <= 0.1) { state.ai = t[0]; state.aj = t[1]; k++; } else { state.ai += dx / d * 0.1; state.aj += dy / d * 0.1; }
      n++;
      state.frame = 1 + (Math.floor(n / 4) % 2);
      if (d > 0.02) state.face = (dx + dy < 0 ? 2 : 0) + (dx - dy < 0 ? 1 : 0);
      updateActors();
    }, 40);
  }

  // Isometric screen position of the nurse's feet.
  const avatarScreen = () => [320 + (state.ai - state.aj) * 36, 150 + (state.ai + state.aj) * 18];

  // Furniture sorted back-to-front; each sprite sits in front of or behind the nurse.
  function sprites() {
    const objs = ROOMS[state.si].objs.slice().sort((a, b) => (a.fi + a.fw + a.fj + a.fd) - (b.fi + b.fw + b.fj + b.fd));
    return objs.map((o, k) => {
      const front = state.ai >= o.fi + o.fw - 0.001 || state.aj >= o.fj + o.fd - 0.001;
      return { o, z: (front ? 10 : 600) + k * 2 };
    });
  }

  function placeActors(avatar, shadow) {
    const [x, y] = avatarScreen();
    avatar.src = NURSE[state.face > 1 ? "b" : "f"][state.frame];
    avatar.classList.toggle("is-flipped", state.face % 2 === 1);
    avatar.style.left = (x - 35) + "px";
    avatar.style.top = (y - 104) + "px";
    shadow.style.left = (x - 20) + "px";
    shadow.style.top = (y - 6) + "px";
  }

  // Called every walk tick: move the nurse without rebuilding the screen.
  function updateActors() {
    const avatar = document.getElementById("avatar"), shadow = document.getElementById("shadow");
    if (!avatar || !shadow) return;
    placeActors(avatar, shadow);
    const els = root.querySelectorAll(".sprite");
    sprites().forEach((s, k) => { if (els[k]) els[k].style.zIndex = s.z; });
  }

  // ---------- Actions ----------
  function examine(i, mode) {
    if (state.busy) return;
    const sc = SC[state.si], c = sc.clues[i], room = ROOMS[state.si], ob = room.objs[i];
    const id = mode === "talk" ? TALK_ID : i;
    const txt = mode === "talk" ? sc.talk : c.t;
    setState({ busy: true, menu: null, bubble: "", found: state.found.includes(id) ? state.found : state.found.concat([id]), log: "Je loopt naar: " + c.n + "..." });
    walkTo(room.stands[i], () => setState({
      face: faceTo(ob.fi + ob.fw / 2, ob.fj + ob.fd / 2), busy: false, bubble: txt,
      log: mode === "talk" ? "Je voert een gesprek met de patiënt. Welke informatie geeft de patiënt zelf?" : c.n + " onderzocht. Wat hiervan hoort in welk onderdeel van je SBARR?"
    }));
  }

  const actions = {
    pickScenario: (i) => setState({ si: i }),
    pickDoctor: (i) => setState({ pi: i }),
    start: () => setState(freshMission(state.pi)),
    hotspot: (i) => {
      if (state.busy) return;
      if (i === 0) setState({ menu: 0 }); else examine(i);
    },
    look: () => examine(state.menu),
    talk: () => examine(state.menu, "talk"),
    closeMenu: () => setState({ menu: null }),
    closeBubble: () => setState({ bubble: "" }),
    call: () => { clearInterval(walkTimer); setState({ screen: "report", menu: null, bubble: "", busy: false, docSays: PE[state.pi].intro, stage: 0 }); },
    submitReport: () => {
      const pe = PE[state.pi], sc = SC[state.si];
      const miss = ["S", "B", "A", "R"].filter((k) => score(k, state.f[k]).s < 0.6);
      const lead = miss.length ? pe.ask + " " + elName(miss[0]).toLowerCase() + "? " : pe.good + " ";
      setState({ stage: 1, docSays: lead + "Dan mijn opdracht: " + sc.order });
    },
    submitRb: () => {
      const res = {};
      let tot = 0;
      EL.forEach(([k]) => { res[k] = score(k, k === "X" ? state.rb : state.f[k]); tot += res[k].s; });
      const total = tot / EL.length;
      // Q-learning style update: each value moves 40% toward this round's reward.
      const Q = Object.assign({}, state.Q);
      EL.forEach(([k]) => { Q[k] += 0.4 * (res[k].s - Q[k]); });
      const QS = state.QS.slice();
      QS[state.si] += 0.5 * (total - QS[state.si]);
      const avg = Object.keys(Q).reduce((a, k) => a + Q[k], 0) / 5;
      const others = [0, 1, 2].filter((i) => i !== state.si);
      let ni = others.slice().sort((a, b) => QS[a] - QS[b])[0];
      let np = avg < 0.5 ? 0 : avg < 0.7 ? 3 : avg < 0.85 ? 1 : 2;
      let why = "Je scoort het laagst op dit scenario, dus oefen je dat vaker.";
      if (Math.random() < 0.2) {
        ni = others[Math.floor(Math.random() * others.length)];
        np = Math.floor(Math.random() * 4);
        why = "Verkenning (20%): de coach probeert iets anders om te leren wat bij jou werkt.";
      }
      const weak = EL.slice().sort((a, b) => Q[a[0]] - Q[b[0]])[0][1];
      setState({
        screen: "feedback", res, total, Q, QS, hist: state.hist.concat([total]),
        next: { si: ni, pi: np, why: why + " Aandachtspunt: " + weak.toLowerCase() + ". Volgende arts: " + PE[np].name + " in " + SC[ni].ctx.toLowerCase() + "." }
      });
    },
    nextMission: () => setState(Object.assign({ si: state.next.si, pi: state.next.pi }, freshMission(state.next.pi))),
    toMenu: () => setState({ screen: "menu" })
  };

  // ---------- Views ----------
  const notesHTML = () => {
    const sc = SC[state.si];
    return state.found.map((i) => {
      const n = i === TALK_ID ? { name: "Gesprek", t: sc.talk } : { name: sc.clues[i].n, t: sc.clues[i].t };
      return `<div><span class="notes__name">${esc(n.name)}:</span> ${esc(n.t)}</div>`;
    }).join("");
  };

  const notesPanel = (extra = "") => `
    <section class="card panel notes ${extra}" aria-label="Notitieblok">
      <div class="lb">Notitieblok</div>
      <div class="notes__list">${notesHTML()}</div>
    </section>`;

  const barsHTML = (withPct) => EL.map(([k]) => {
    const q = state.Q[k], pct = Math.round(q * 100);
    const color = q < 0.4 ? "var(--bad)" : q < 0.7 ? "var(--warn)" : "var(--ok)";
    return `<div class="bar"><span class="bar__letter">${shownLetter(k)}</span>
      <div class="bar__track"><div class="bar__fill" style="width:${pct}%;background:${color}"></div></div>
      ${withPct ? `<span class="bar__pct">${pct}%</span>` : ""}</div>`;
  }).join("");

  function menuView() {
    const scenarios = SC.map((s, i) => `
      <button class="card${i === state.si ? " is-selected" : ""}" aria-pressed="${i === state.si}" data-action="pickScenario" data-arg="${i}">
        <img class="scenario__thumb" src="${ROOMS[i].thumb}" alt="">
        <div class="scenario__ctx">${esc(s.ctx)}</div>
        <div class="scenario__title">${esc(s.title)}</div>
        <div class="scenario__pat">${esc(s.pat)}</div>
      </button>`).join("");
    const doctors = PE.map((p, i) => `
      <button class="card${i === state.pi ? " is-selected" : ""}" aria-pressed="${i === state.pi}" data-action="pickDoctor" data-arg="${i}">
        <div class="doctor">
          <span class="portrait portrait--72"><img src="${p.img}" alt=""></span>
          <div><div class="doctor__name">${esc(p.name)}</div><div class="doctor__desc">${esc(p.desc)}</div></div>
        </div>
      </button>`).join("");
    return `
      <div class="menu">
        <div class="menu__head">
          <h1 class="menu__title">SBARR Zorgsim</h1>
          <p class="menu__sub">Verzamel de gegevens in de kamer en bel dan de arts.</p>
        </div>
        <div class="lb">1. Kies een locatie</div>
        <div class="menu__grid menu__grid--3">${scenarios}</div>
        <div class="lb">2. Kies de arts</div>
        <div class="menu__grid menu__grid--4">${doctors}</div>
        <div class="menu__foot">
          <p>Je coach leert mee: na elke ronde past hij de volgende kamer en arts aan op wat jij nog moet oefenen.</p>
          <button class="btn btn--go" data-action="start">Start missie</button>
        </div>
      </div>`;
  }

  const ICON_LOOK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="6"></circle><path d="M15 15l6 6"></path></svg>';
  const ICON_TALK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11h-9l-5 4v-4H4z"></path></svg>';

  function stageView() {
    const sc = SC[state.si], room = ROOMS[state.si];
    const [ax, ay] = avatarScreen();

    const spriteHTML = sprites().map(({ o, z }) =>
      `<img class="sprite" src="${o.u}" alt="" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;z-index:${z}">`).join("");

    const hotspots = sc.clues.map((c, i) => {
      const h = room.hot[i], done = state.found.includes(i);
      return `<button class="hotspot${done ? " is-done" : ""}" style="left:${h[0] - 28}px;top:${h[1] - 28}px" aria-label="${esc(c.n)}" data-action="hotspot" data-arg="${i}">
        <span class="hotspot__ring"></span><span class="hotspot__dot"></span></button>`;
    }).join("");

    let bubble = "";
    if (state.bubble) {
      const left = clamp(ax - 110, 6, STAGE_W - 226);
      const bottom = STAGE_H - (ay - 112) + 10;
      const tail = clamp(ax - left - 7, 12, 196);
      bubble = `<div class="bubble" style="left:${left}px;bottom:${bottom}px" data-action="closeBubble" title="Klik om te sluiten">
        <button class="bubble__close" aria-label="Sluit" data-action="closeBubble">×</button>
        <div class="bubble__text">${esc(state.bubble)}</div>
        <span class="bubble__tail" style="left:${tail}px"></span></div>`;
    }

    let menu = "";
    if (state.menu !== null) {
      const mh = room.hot[state.menu];
      const pie = [["Observeer", "look", -145, ICON_LOOK], ["Gesprek", "talk", -35, ICON_TALK]].map(([label, action, deg, icon]) => {
        const rad = deg * Math.PI / 180;
        const cx = clamp(mh[0] + 56 * Math.cos(rad), 24, STAGE_W - 24), cy = clamp(mh[1] + 56 * Math.sin(rad), 24, STAGE_H - 24);
        return `<button class="pie" style="left:${cx - 24}px;top:${cy - 24}px" aria-label="${label}" data-action="${action}">${icon}</button>
          <span class="pie__tag" style="left:${cx - 45}px;top:${cy + 27}px">${label}</span>`;
      }).join("");
      menu = `<button class="backdrop" aria-label="Sluit menu" data-action="closeMenu" tabindex="-1"></button>
        <div class="menu-title" style="left:${clamp(mh[0] - 60, 4, 520)}px;top:${Math.min(392, mh[1] + 38)}px">${esc(sc.clues[state.menu].n)}</div>${pie}`;
    }

    return `<div class="stage">
      <img class="stage__bg" src="${room.bg}" alt="Isometrische kamer">
      ${spriteHTML}${hotspots}
      <div class="shadow" id="shadow"></div>
      <img class="avatar" id="avatar" alt="Verpleegkundige">
      ${bubble}${menu}
    </div>`;
  }

  function exploreView() {
    const sc = SC[state.si];
    return `
      <div class="split">
        <div class="col explore__main">
          <div class="explore__head">
            <div class="explore__title">${esc(sc.ctx)} - ${esc(sc.pat)}</div>
            <div class="card counter">Onderzocht ${state.found.length}/7</div>
          </div>
          ${stageView()}
          <div class="card log" aria-live="polite">${esc(state.log)}</div>
        </div>
        <div class="col side">
          <section class="card panel bars" aria-label="Vaardigheden">
            <div class="lb">Vaardigheden (coach)</div>
            ${barsHTML(false)}
          </section>
          ${notesPanel()}
          <button class="btn btn--alert" data-action="call">Bel de arts</button>
        </div>
      </div>`;
  }

  function reportView() {
    const pe = PE[state.pi];
    let body;
    if (state.stage === 0) {
      const fields = ["S", "B", "A", "R"].map((k) => `
        <div class="field">
          <div class="letter" aria-hidden="true">${k}</div>
          <label class="field__body"><span class="field__hint">${esc(elName(k))}: ${esc(HINT[k])}</span>
            <textarea class="tx" data-field="${k}" aria-label="${esc(elName(k))}">${esc(state.f[k])}</textarea></label>
        </div>`).join("");
      body = `<div class="fields">${fields}</div>
        <button class="btn btn--go btn--end" data-action="submitReport">Rapporteer aan arts</button>`;
    } else {
      body = `<div class="readback">
          <p class="readback__hint"><b>Read-back:</b> herhaal de opdracht van de arts in je eigen woorden.</p>
          <textarea class="tx" data-field="rb" aria-label="Read-back">${esc(state.rb)}</textarea>
          <button class="btn btn--go btn--end" data-action="submitRb">Bevestig opdracht</button>
        </div>`;
    }
    return `
      <div class="split">
        <div class="col report__main">
          <div class="report__doc">
            <div class="card report__photo${state.stage === 0 ? " pop-in" : ""}"><img src="${pe.img}" alt="${esc(pe.name)}"></div>
            <div class="card speech" aria-live="polite">
              <div class="lb">${esc(pe.name)}</div>${esc(state.docSays)}
              <span class="speech__tail"></span>
            </div>
          </div>
          ${body}
        </div>
        ${notesPanel("side")}
      </div>`;
  }

  function feedbackView() {
    const pe = PE[state.pi], tot = state.total || 0, n5 = Math.round(tot * 5);
    const verdict = tot >= 0.85 ? "UITSTEKEND!" : tot >= 0.6 ? "GOED GEDAAN" : "NOG EVEN OEFENEN";
    const stars = [0, 1, 2, 3, 4].map((k) =>
      `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 7 7.5.6-5.7 5 1.8 7.4L12 18l-6.6 4 1.8-7.4-5.7-5L9 9z" fill="${k < n5 ? "#f7c548" : "#e3e9f3"}" stroke="#b3811f" stroke-width="1.2"></path></svg>`).join("");
    const results = EL.map(([k, title]) => {
      const r = state.res[k];
      return `<div class="card result">
        <div class="letter" aria-hidden="true">${shownLetter(k)}</div>
        <div class="result__body">
          <div class="result__title">${esc(title)} - ${Math.round(r.s * 100)}%</div>
          <div class="result__hit">${esc(r.hit.length ? "Genoemd: " + r.hit.join(", ") : "Niets genoemd.")}</div>
          <div class="result__miss">${esc(r.miss.length ? "Mist: " + r.miss.join(", ") : "Compleet.")}</div>
        </div></div>`;
    }).join("");
    return `
      <div class="split">
        <div class="col feedback__main">
          <div class="feedback__head">
            <h2 class="verdict">${verdict}</h2>
            <div class="stars" role="img" aria-label="${n5} van 5 sterren"><span class="stars__pct">${Math.round(tot * 100)}%</span>${stars}</div>
          </div>
          ${results}
          <div class="closing">
            <span class="portrait portrait--64"><img src="${pe.img}" alt=""></span>
            <div class="card"><span class="lb">${esc(pe.name)}: </span>${esc(tot >= 0.6 ? pe.good : pe.bad)}</div>
          </div>
        </div>
        <div class="col side">
          <section class="card panel bars bars--lg" aria-label="Coach">
            <div class="lb">Coach (leert mee)</div>
            ${barsHTML(true)}
            <div class="coach-note">Beloning = jouw score. De waarde per onderdeel schuift 40% richting die beloning (Q-learning).</div>
          </section>
          <div class="card coach-why">${esc(state.next ? state.next.why : "")}</div>
          <div class="feedback__actions">
            <button class="btn btn--go" data-action="nextMission">Volgende missie</button>
            <button class="btn" data-action="toMenu">Terug naar menu</button>
          </div>
        </div>
      </div>`;
  }

  const VIEWS = { menu: menuView, explore: exploreView, report: reportView, feedback: feedbackView };

  function render() {
    root.innerHTML = VIEWS[state.screen]();
    if (state.screen === "explore") updateActors();
  }

  // ---------- Events ----------
  root.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || !root.contains(el)) return;
    const fn = actions[el.dataset.action];
    if (fn) fn(el.dataset.arg === undefined ? undefined : Number(el.dataset.arg));
  });

  // Typing updates state without re-rendering, so the textarea keeps focus.
  root.addEventListener("input", (e) => {
    const k = e.target.dataset.field;
    if (k === "rb") state.rb = e.target.value;
    else if (k) state.f[k] = e.target.value;
  });

  // ---------- Fit the fixed 960x680 stage to the window ----------
  const viewport = document.getElementById("viewport");
  function fit() {
    const s = Math.min((window.innerWidth - 24) / 960, (window.innerHeight - 24) / 680, 1.5);
    root.style.transform = `scale(${s})`;
    viewport.style.width = 960 * s + "px";
    viewport.style.height = 680 * s + "px";
  }
  window.addEventListener("resize", fit);
  fit();
  render();
})();
