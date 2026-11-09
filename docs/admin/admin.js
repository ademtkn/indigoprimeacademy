// Indigo Prime Academy — admin panel.
// Reads content/*.json from the GitHub repository, lets editors change texts (in three languages),
// the menu, staff, news, extra pages and pictures, and saves everything as one commit.
// The "Build and publish site" GitHub Action then rebuilds the site and publishes it.
(function () {
  'use strict';
  var REPO = (window.ADMIN_CONFIG && window.ADMIN_CONFIG.repo) || 'ademtkn/indigoprimeacademy';
  var BRANCH = (window.ADMIN_CONFIG && window.ADMIN_CONFIG.branch) || 'main';
  var API = 'https://api.github.com/repos/' + REPO;
  var LANGS = [['en', 'EN'], ['ky', 'KG'], ['ru', 'RU']];
  var FILES = ['site', 'en', 'ky', 'ru', 'staff', 'news', 'pages', 'images'];
  var TOKEN_KEY = 'ipa-admin-token';
  var ICONS = 'book globe heart shield spark palette music flask code trophy run chat sun calendar phone pin clock users doc star leaf needle mic cambridge bars cubes target compass grad pair lab map'.split(' ');
  var HIDDEN = { code: 1, htmlLang: 1, label: 1, langName: 1, ogLocale: 1 };
  var BUILTIN = { about: 'Hakkımızda', academics: 'Programlar', method: 'Cambridge & Singapur', admissions: 'Kabul', life: 'Okul hayatı', staff: 'Öğretmenler', news: 'Haberler', contact: 'İletişim' };
  var TEXT_PAGES = [
    ['home', 'Ana sayfa'], ['about', 'Hakkımızda'], ['academics', 'Programlar'], ['method', 'Cambridge & Singapur'],
    ['admissions', 'Kabul'], ['life', 'Okul hayatı'], ['staff', 'Öğretmenler sayfası'], ['news', 'Haberler sayfası'],
    ['contact', 'İletişim'], ['common', 'Ortak metinler'], ['nav', 'Menü ve düğmeler'], ['brand', 'Marka'],
    ['ai', 'Asistan'], ['root', 'Dil seçim sayfası'],
  ];
  var LABELS = {
    title: 'Başlık', descr: 'Google açıklaması', lead: 'Giriş metni', eyebrow: 'Küçük üst başlık', body: 'Metin', items: 'Öğeler',
    t: 'Başlık', d: 'Açıklama / gün', q: 'Soru', a: 'Cevap', k: 'Ad', g: 'Sınıflar', list: 'Madde listesi', sign: 'İmza',
    link: 'Bağlantı metni', cta: 'Düğme metni', cta1: '1. düğme', cta2: '2. düğme', chips: 'Etiketler', icon: 'Simge',
    hero: 'Üst bölüm', welcome: 'Karşılama', pillars: 'Neden biz kartları', stats: 'Rakamlar', n: 'Sayı', l: 'Açıklama',
    life: 'Okul hayatı bölümü', visitBand: 'Ziyaret bandı (mor şerit)', social: 'Instagram bölümü', badges: 'Rozetler', sub: 'Alt başlık',
    pathway: 'Cambridge yolu', method: 'İki yöntem', story: 'Hikayemiz', mission: 'Misyon', vision: 'Vizyon', values: 'Değerler',
    director: 'Müdürün mesajı', coed: 'Karma eğitim', network: 'Indigo Academy ağı', overview: 'Genel bakış', stages: 'Kademeler',
    subjects: 'Dersler', groups: 'Ders grupları', languages: 'Diller', assessment: 'Değerlendirme', exam: 'Sınav', age: 'Büyük numara',
    long: 'Uzun açıklama', cambridge: 'Cambridge', learner: 'Cambridge öğrencisi', singapore: 'Singapur metodu',
    cpa: 'Somut → resimli → soyut', tag: 'Etiket', structures: 'Öğrenme yapıları', together: 'Ders akışı', steps: 'Adımlar',
    docs: 'Belgeler', note: 'Not', fees: 'Ücretler', faq: 'Sık sorulan sorular', day: 'Günlük program', time: 'Saat',
    clubs: 'Kulüpler', traditions: 'Gelenekler', care: 'Öğrenci bakımı', depts: 'Bölüm adları', filterAll: '"Tümü" düğmesi',
    namePh: 'İsim girilmemişse görünen yazı', join: 'Ekibimize katılın', channels: 'Kanallar', calendar: 'Takvim', m: 'Ay',
    s: 'Açıklama', form: 'İletişim formu', mapTitle: 'Harita başlığı', mapBody: 'Harita metni', roles: 'Görevler',
    suggestions: 'Önerilen sorular', address: 'Adres (uzun)', addressShort: 'Adres (kısa)', hoursVal: 'Çalışma saatleri',
    top: 'Üst satır', name: 'Ad', bottom: 'Alt satır', full: 'Tam ad', apply: 'Başvuru düğmesi', welcomeLine: 'Karşılama',
    pick: '"Dil seçin" yazısı', cont: 'Devam düğmesi',
  };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var S = { token: '', head: '', files: {}, existing: {}, built: {}, uploads: {}, view: 'home', textPage: 'home', publishing: null };
  var $ = function (id) { return document.getElementById(id); };

  // ---------- GitHub API ----------
  function gh(method, url, body) {
    return fetch(url.indexOf('http') === 0 ? url : API + url, {
      method: method,
      headers: { Authorization: 'Bearer ' + S.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      if (r.status === 204) return null;
      return r.json().then(function (j) {
        if (!r.ok) { var e = new Error(j.message || ('HTTP ' + r.status)); e.status = r.status; throw e; }
        return j;
      });
    });
  }
  function b64ToText(b64) {
    var bin = atob(b64.replace(/\n/g, '')); var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  var json = function (data) { return JSON.stringify(data, null, 2) + '\n'; };
  var path = function (f) { return 'content/' + f + '.json'; };

  function load() {
    return gh('GET', '/git/ref/heads/' + BRANCH).then(function (ref) {
      S.head = ref.object.sha;
      return gh('GET', '/git/commits/' + S.head);
    }).then(function (c) {
      return gh('GET', '/git/trees/' + c.tree.sha + '?recursive=1');
    }).then(function (tree) {
      S.existing = {}; S.built = {};
      var blobs = {};
      tree.tree.forEach(function (e) {
        if (e.type !== 'blob') return;
        if (e.path.indexOf('assets/img/') === 0) S.existing[e.path] = true;
        if (e.path.indexOf('docs/') === 0 || e.path === 'server/knowledge.json') S.built[e.path] = e.sha;
        blobs[e.path] = e.sha;
      });
      return Promise.all(FILES.map(function (f) {
        if (!blobs[path(f)]) return Promise.resolve([f, f === 'site' || /^(en|ky|ru)$/.test(f) ? null : '[]\n']);
        return gh('GET', '/git/blobs/' + blobs[path(f)]).then(function (b) { return [f, b64ToText(b.content)]; });
      }));
    }).then(function (list) {
      list.forEach(function (x) {
        if (x[1] == null) throw new Error(path(x[0]) + ' bulunamadı');
        var data = JSON.parse(x[1]);
        // Compare against our own formatting so an untouched file never counts as changed
        S.files[x[0]] = { text: json(data), data: data };
      });
      S.uploads = {};
    });
  }

  function dirty() {
    var n = [];
    FILES.forEach(function (f) { if (json(S.files[f].data) !== S.files[f].text) n.push(f); });
    return { files: n, uploads: Object.keys(S.uploads) };
  }

  function save() {
    var d = dirty(); if (!d.files.length && !d.uploads.length) return;
    var btn = $('save'); btn.disabled = true; btn.textContent = 'Kaydediliyor…';
    var base, built, entries = [];
    d.files.forEach(function (f) { entries.push({ path: path(f), mode: '100644', type: 'blob', content: json(S.files[f].data) }); });
    gh('GET', '/git/ref/heads/' + BRANCH).then(function (ref) {
      base = ref.object.sha;
      if (base !== S.head && !confirm('Site siz bu sayfayı açtıktan sonra başka bir yerden değiştirilmiş. Kaydederseniz aynı bölümlerdeki o değişikliklerin üzerine yazılabilir. Devam edilsin mi?')) throw new Error('İptal edildi');
      // Upload pictures as blobs first (into assets/ and the published copy in docs/assets/)
      return Promise.all(d.uploads.map(function (p) {
        var u = S.uploads[p];
        if (u === null) { if (S.existing[p]) entries.push(gone(p), gone('docs/' + p)); return null; }
        return gh('POST', '/git/blobs', { content: u.b64, encoding: 'base64' }).then(function (b) {
          entries.push({ path: p, mode: '100644', type: 'blob', sha: b.sha }, { path: 'docs/' + p, mode: '100644', type: 'blob', sha: b.sha });
        });
      }));
    }).then(rebuild).then(function (pages) { built = pages; entries = entries.concat(pages.entries); return gh('GET', '/git/commits/' + base); })
      .then(function (c) { return gh('POST', '/git/trees', { base_tree: c.tree.sha, tree: entries }); })
      .then(function (t) { return gh('POST', '/git/commits', { message: 'Yönetim panelinden güncelleme: ' + summary(d), tree: t.sha, parents: [base] }); })
      .then(function (c) { return gh('PATCH', '/git/refs/heads/' + BRANCH, { sha: c.sha }).then(function () { return c.sha; }); })
      .then(function (sha) {
        S.head = sha;
        d.files.forEach(function (f) { S.files[f].text = json(S.files[f].data); });
        d.uploads.forEach(function (p) { if (S.uploads[p] === null) delete S.existing[p]; else S.existing[p] = true; });
        Object.keys(built.shas).forEach(function (p) { if (built.shas[p]) S.built[p] = built.shas[p]; else delete S.built[p]; });
        S.uploads = {};
        toast('Kaydedildi. Site 1–2 dakika içinde güncellenecek.');
        watchPublish(sha);
        render();
      })
      .catch(function (e) {
        if (e.message !== 'İptal edildi') alert('Kaydedilemedi: ' + explain(e));
      })
      .then(function () { btn.textContent = 'Kaydet ve yayınla'; updateBar(); });
  }
  // ---------- rebuilding the published site (docs/) in the browser ----------
  // GitHub Pages serves main /docs, so every save also commits the regenerated pages.
  var gone = function (p) { return { path: p, mode: '100644', type: 'blob', sha: null }; };
  function gitSha(text) {
    var body = new TextEncoder().encode(text), head = new TextEncoder().encode('blob ' + body.length + '\0');
    var all = new Uint8Array(head.length + body.length); all.set(head); all.set(body, head.length);
    return crypto.subtle.digest('SHA-1', all).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function rebuild() {
    return import('./lib/site.mjs?v=' + Date.now()).then(function (mod) {
      var content = {};
      ['site', 'en', 'ky', 'ru', 'staff', 'news', 'pages'].forEach(function (f) { content[f] = S.files[f].data; });
      var exists = function (p) {
        if (Object.prototype.hasOwnProperty.call(S.uploads, p)) return S.uploads[p] !== null;
        return !!S.existing[p];
      };
      var out = mod.generate({ content: content, exists: exists });
      var paths = Object.keys(out), shas = {}, entries = [];
      return Promise.all(paths.map(function (p) { return gitSha(out[p]).then(function (h) { shas[p] = h; }); })).then(function () {
        paths.forEach(function (p) { if (S.built[p] !== shas[p]) entries.push({ path: p, mode: '100644', type: 'blob', content: out[p] }); });
        // Pages that no longer exist (deleted news or extra pages, a removed CNAME)
        Object.keys(S.built).forEach(function (p) {
          if (/^docs\/(en|ky|ru)\/[^/]+\.html$|^docs\/CNAME$/.test(p) && !Object.prototype.hasOwnProperty.call(out, p)) { entries.push(gone(p)); shas[p] = null; }
        });
        return { entries: entries, shas: shas };
      });
    });
  }

  function summary(d) {
    var names = { site: 'ayarlar/menü', en: 'metinler', ky: 'metinler', ru: 'metinler', staff: 'öğretmenler', news: 'haberler', pages: 'sayfalar', images: 'resim listesi' };
    var out = [];
    d.files.forEach(function (f) { if (out.indexOf(names[f]) < 0) out.push(names[f]); });
    if (d.uploads.length) out.push(d.uploads.length + ' resim');
    return out.join(', ');
  }
  function explain(e) {
    if (e.status === 401) return 'Erişim anahtarı geçersiz ya da süresi dolmuş.';
    if (e.status === 403 || e.status === 404) return 'Anahtarın bu depoya yazma izni yok (Contents: Read and write gerekli).';
    if (e.status === 409 || e.status === 422) return 'Depo aynı anda değişti. Sayfayı yenileyip tekrar deneyin. (' + e.message + ')';
    return e.message;
  }

  // Follow the GitHub Action that rebuilds the site after a save
  function watchPublish(sha) {
    S.publishing = { sha: sha, state: 'wait', since: Date.now() };
    var tick = function () {
      if (!S.publishing || S.publishing.sha !== sha) return;
      gh('GET', '/actions/runs?head_sha=' + sha + '&per_page=1').then(function (r) {
        var run = r.workflow_runs && r.workflow_runs[0];
        if (run && run.status === 'completed') {
          S.publishing.state = run.conclusion === 'success' ? 'done' : 'fail';
          S.publishing.url = run.html_url;
          updateBar(); return;
        }
        S.publishing.state = run ? 'run' : 'wait';
        updateBar();
        if (Date.now() - S.publishing.since < 10 * 60 * 1000) setTimeout(tick, 6000);
      }).catch(function () { S.publishing.state = 'unknown'; updateBar(); });
    };
    setTimeout(tick, 4000);
  }

  function updateBar() {
    var d = dirty(), n = d.files.length + d.uploads.length;
    $('save').disabled = !n; $('discard').disabled = !n;
    var msg = n ? '<strong>Kaydedilmemiş değişiklik var</strong> (' + esc(summary(d)) + ')' : 'Tüm değişiklikler kaydedildi.';
    var p = S.publishing;
    if (p && !n) {
      msg = {
        wait: '<span class="warn">Yayın sırası bekleniyor…</span>',
        run: '<span class="warn">Site yeniden oluşturuluyor…</span> (yaklaşık 1 dakika)',
        done: '<span class="ok">✓ Yayınlandı.</span> Değişiklikleri görmek için siteyi yenileyin (gerekirse 1 dakika bekleyin).',
        fail: '<span class="err">Yayınlama başarısız oldu.</span> <a href="' + esc(p.url) + '" target="_blank" rel="noopener">Ayrıntılar</a>',
        unknown: 'Kaydedildi. Site 1–2 dakika içinde güncellenecek.',
      }[p.state];
    }
    $('status').innerHTML = msg;
  }

  // ---------- small DOM helpers ----------
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else if (v !== false && v != null) el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      [].concat(c).forEach(function (x) { if (x != null && x !== false) el.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
    }
    return el;
  }
  function toast(t) { var el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 4000); }
  function rerender() { var y = window.scrollY; render(); window.scrollTo(0, y); }
  var label = function (k) { return LABELS[k] || k; };

  // A text value in three languages. get(lang) / set(lang, value)
  function tri(title, get, set, opts) {
    opts = opts || {};
    var long = opts.long || LANGS.some(function (l) { var v = get(l[0]) || ''; return v.length > 70 || v.indexOf('\n') >= 0; });
    return h('div', { class: 'field' }, title ? h('label', null, title, opts.hint ? h('span', { class: 'hint' }, opts.hint) : null) : null,
      h('div', { class: 'tri' }, LANGS.map(function (l) {
        var input = h(long ? 'textarea' : 'input', { rows: opts.rows || (long ? 3 : null), lang: l[0] === 'ky' ? 'ky' : l[0], placeholder: opts.placeholder || '' });
        input.value = get(l[0]) || '';
        input.addEventListener('input', function () { set(l[0], input.value); updateBar(); });
        return h('div', null, h('span', { class: 'lang ' + l[0] }, l[1]), input);
      })));
  }
  function single(title, get, set, opts) {
    opts = opts || {};
    var input = h(opts.textarea ? 'textarea' : 'input', { type: opts.type || 'text', placeholder: opts.placeholder || '' });
    input.value = get() == null ? '' : get();
    input.addEventListener('input', function () { set(input.value); updateBar(); });
    return h('div', { class: 'field' }, h('label', null, title, opts.hint ? h('span', { class: 'hint' }, opts.hint) : null), input);
  }
  function tools(arr, i, onChange, opts) {
    opts = opts || {};
    var mv = function (d) { return function () { var j = i + d; var x = arr[i]; arr[i] = arr[j]; arr[j] = x; if (opts.mirror) opts.mirror(function (a) { var y = a[i]; a[i] = a[j]; a[j] = y; }); onChange(); }; };
    return h('div', { class: 'tools' },
      h('button', { type: 'button', title: 'Yukarı taşı', disabled: i === 0, onclick: mv(-1) }, '↑'),
      h('button', { type: 'button', title: 'Aşağı taşı', disabled: i === arr.length - 1, onclick: mv(1) }, '↓'),
      opts.noDelete ? null : h('button', { type: 'button', class: 'del', title: 'Sil', disabled: opts.keepOne && arr.length < 2, onclick: function () {
        if (!confirm('Bu öğe silinsin mi?')) return;
        if (opts.beforeDelete) opts.beforeDelete(arr[i]);
        arr.splice(i, 1); if (opts.mirror) opts.mirror(function (a) { a.splice(i, 1); }); onChange();
      } }, '✕'));
  }

  // ---------- picture handling ----------
  function rawUrl(p) { return 'https://raw.githubusercontent.com/' + REPO + '/' + S.head + '/' + p; }
  function imgState(p) {
    if (Object.prototype.hasOwnProperty.call(S.uploads, p)) return S.uploads[p] ? { url: S.uploads[p].url, isNew: true } : null;
    return S.existing[p] ? { url: rawUrl(p) } : null;
  }
  function pickImage(p, max, done) {
    var input = h('input', { type: 'file', accept: 'image/*' });
    input.onchange = function () {
      var file = input.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var scale = Math.min(1, max / Math.max(img.width, img.height));
          var c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
          var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
          var url = c.toDataURL('image/jpeg', 0.85);
          S.uploads[p] = { url: url, b64: url.split(',')[1] };
          updateBar(); (done || rerender)();
        };
        img.onerror = function () { alert('Bu dosya resim olarak açılamadı.'); };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }
  function removeImage(p) { if (S.existing[p]) S.uploads[p] = null; else delete S.uploads[p]; }
  function imageBox(p, opts) {
    opts = opts || {};
    var st = imgState(p);
    return h('div', { class: 'imgbox' },
      h('div', { class: 'thumb' + (opts.portrait ? ' portrait' : '') + (st && st.isNew ? ' new' : '') }, st ? h('img', { src: st.url, alt: '' }) : 'Resim yok'),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn btn--ghost btn--sm', onclick: function () { pickImage(p, opts.max || 1600); } }, st ? 'Değiştir' : 'Resim yükle'),
        st ? h('button', { type: 'button', class: 'btn btn--danger btn--sm', onclick: function () { removeImage(p); updateBar(); rerender(); } }, 'Kaldır') : null));
  }

  // ---------- generic three-language tree editor for content/<lang>.json ----------
  var L = function (code) { return S.files[code].data; };
  function at(obj, p) { for (var i = 0; i < p.length; i++) { if (obj == null) return undefined; obj = obj[p[i]]; } return obj; }
  function setAt(obj, p, v) { for (var i = 0; i < p.length - 1; i++) { if (obj[p[i]] == null) obj[p[i]] = typeof p[i + 1] === 'number' ? [] : {}; obj = obj[p[i]]; } obj[p[p.length - 1]] = v; }
  function blank(x) {
    if (typeof x === 'string') return '';
    if (Array.isArray(x)) return x.length && typeof x[0] === 'string' ? [''] : x.map(blank);
    if (x && typeof x === 'object') { var o = {}; Object.keys(x).forEach(function (k) { o[k] = k === 'icon' ? x[k] : blank(x[k]); }); return o; }
    return x;
  }
  function firstText(x) {
    if (typeof x === 'string') return x;
    if (x && typeof x === 'object') for (var k in x) { if (k !== 'icon') { var v = firstText(x[k]); if (v) return v; } }
    return '';
  }
  function editNode(p, key, depth) {
    var v = at(L('en'), p);
    if (typeof v === 'string') {
      if (key === 'icon') {
        var sel = h('select', null, ICONS.map(function (n) { return h('option', { value: n, selected: n === v }, n); }));
        sel.onchange = function () { LANGS.forEach(function (l) { setAt(L(l[0]), p, sel.value); }); updateBar(); };
        return h('div', { class: 'field' }, h('label', null, label(key)), sel);
      }
      return tri(label(key), function (lang) { return at(L(lang), p); }, function (lang, val) { setAt(L(lang), p, val); });
    }
    if (Array.isArray(v)) {
      var mirror = function (fn) { LANGS.slice(1).forEach(function (l) { var a = at(L(l[0]), p); if (Array.isArray(a)) fn(a); }); };
      var list = h('div', { class: 'group' }, h('h3', null, label(key)));
      v.forEach(function (item, i) {
        var t = tools(v, i, rerender, { mirror: mirror, keepOne: true });
        if (typeof item === 'string') {
          list.appendChild(h('div', { class: 'item' }, h('div', { class: 'item-head' }, h('span', { class: 'num' }, String(i + 1)), h('span', { class: 'ttl' }, ''), t),
            tri('', function (lang) { return at(L(lang), p.concat(i)); }, function (lang, val) { setAt(L(lang), p.concat(i), val); })));
        } else {
          var body = h('div');
          Object.keys(item).forEach(function (k) { body.appendChild(editNode(p.concat(i, k), k, depth + 1)); });
          list.appendChild(h('div', { class: 'item' }, h('div', { class: 'item-head' }, h('span', { class: 'num' }, String(i + 1)), h('span', { class: 'ttl' }, firstText(item)), t), body));
        }
      });
      list.appendChild(h('button', { type: 'button', class: 'btn btn--ghost btn--sm add', onclick: function () {
        var tpl = blank(v[v.length - 1]);
        LANGS.forEach(function (l) { var a = at(L(l[0]), p); if (!Array.isArray(a)) { a = []; setAt(L(l[0]), p, a); } a.push(JSON.parse(JSON.stringify(tpl))); });
        rerender();
      } }, '+ Yeni öğe ekle'));
      return list;
    }
    if (v && typeof v === 'object') {
      var g = h('div', { class: 'group lvl' + depth }, depth ? h('h3', null, label(key)) : null);
      Object.keys(v).forEach(function (k) { if (!HIDDEN[k]) g.appendChild(editNode(p.concat(k), k, depth + 1)); });
      return g;
    }
    return h('span');
  }

  // ---------- views ----------
  var VIEWS = [
    ['home', 'Başlangıç'], ['texts', 'Sayfa metinleri'], ['menu', 'Menü'], ['staff', 'Öğretmenler'], ['news', 'Haberler'],
    ['pages', 'Ek sayfalar'], ['images', 'Resimler'], ['settings', 'İletişim ve ayarlar'],
  ];
  function nav() {
    var n = $('side-nav'); n.innerHTML = '';
    VIEWS.forEach(function (v) {
      n.appendChild(h('button', { type: 'button', 'aria-current': S.view === v[0] ? 'true' : 'false', onclick: function () { go(v[0]); } }, h('span', { class: 'dot' }), v[1]));
    });
  }
  function go(v) { S.view = v; document.body.classList.remove('side-open'); render(); window.scrollTo(0, 0); }

  function render() {
    nav(); updateBar();
    var view = $('view'); view.innerHTML = '';
    view.appendChild(R[S.view]());
  }

  var R = {
    home: function () {
      var tile = function (v, t, d) { return h('button', { type: 'button', class: 'tile', onclick: function () { go(v); } }, h('strong', null, t), h('span', null, d)); };
      return h('div', null,
        h('h1', null, 'Hoş geldiniz'),
        h('p', { class: 'lead' }, 'Buradan sitenin her şeyini değiştirebilirsiniz. Değişiklikler önce bu panelde tutulur; sağ üstteki “Kaydet ve yayınla” düğmesine bastığınızda site 1–2 dakika içinde güncellenir.'),
        h('div', { class: 'tiles' },
          tile('texts', 'Sayfa metinleri', 'Tüm sayfalardaki başlıklar, yazılar, SSS, kulüpler, takvim… üç dilde.'),
          tile('menu', 'Menü', 'Menüdeki sayfaların sırası, adı, gösterilip gizlenmesi.'),
          tile('staff', 'Öğretmenler', 'Ad, görev, bölüm ve fotoğraf; yeni öğretmen ekleme.'),
          tile('news', 'Haberler', 'Fotoğraflı haber ve duyuru yazma.'),
          tile('pages', 'Ek sayfalar', 'Menüye yeni sayfa ekleme (ör. Yaz okulu, Burslar).'),
          tile('images', 'Resimler', 'Sayfalardaki fotoğrafları yükleme ve değiştirme.'),
          tile('settings', 'İletişim ve ayarlar', 'Telefon, WhatsApp, adres, Instagram, harita bağlantısı.')),
        h('div', { class: 'card', style: 'margin-top:1.4rem' }, h('h2', null, 'Nasıl çalışır?'),
          h('ol', { class: 'steps-help' },
            h('li', null, 'Soldaki menüden bir bölüm seçin ve değişikliklerinizi yapın. Her metnin EN / KG / RU olmak üzere üç kutusu vardır.'),
            h('li', null, 'Bir paragrafı ayırmak için arada boş bir satır bırakın. Kalın yazı için **iki yıldız** arasına alın.'),
            h('li', null, '“Kaydet ve yayınla”ya basın. Üst çubukta “✓ Yayınlandı” yazınca siteyi yenileyin.'),
            h('li', null, 'Kaydetmeden önce vazgeçerseniz “Geri al” ile son kaydedilen hale dönebilirsiniz.'))));
    },

    texts: function () {
      var tabs = h('div', { class: 'tabs' }, TEXT_PAGES.map(function (t) {
        return h('button', { type: 'button', 'aria-current': S.textPage === t[0] ? 'true' : 'false', onclick: function () { S.textPage = t[0]; rerender(); } }, t[1]);
      }));
      return h('div', null, h('h1', null, 'Sayfa metinleri'),
        h('p', { class: 'lead' }, 'Bir sayfa seçin. Her alanın İngilizce (EN), Kırgızca (KG) ve Rusça (RU) karşılığı yan yana durur. Listelere öğe ekleyebilir, sırasını değiştirebilir veya silebilirsiniz.'),
        tabs, h('div', { class: 'card' }, editNode([S.textPage], S.textPage, 0)));
    },

    menu: function () {
      var site = S.files.site.data, pages = S.files.pages.data;
      // Make sure every page has a menu entry
      Object.keys(BUILTIN).forEach(function (k) { if (!site.menu.some(function (m) { return m.key === k; })) site.menu.push({ key: k, show: false }); });
      pages.forEach(function (pg) { if (!site.menu.some(function (m) { return m.key === 'p:' + pg.slug; })) site.menu.push({ key: 'p:' + pg.slug, show: true }); });
      site.menu = site.menu.filter(function (m) { return BUILTIN[m.key] || pages.some(function (pg) { return 'p:' + pg.slug === m.key; }); });
      var list = h('div');
      site.menu.forEach(function (m, i) {
        var custom = m.key.indexOf('p:') === 0;
        var pg = custom && pages.filter(function (x) { return 'p:' + x.slug === m.key; })[0];
        var sw = h('input', { type: 'checkbox', checked: m.show !== false });
        sw.onchange = function () { m.show = sw.checked; updateBar(); };
        list.appendChild(h('div', { class: 'item' },
          h('div', { class: 'menu-row' },
            h('span', { class: 'num', style: 'width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#442F90;color:#fff;font-weight:800;font-size:.78rem' }, String(i + 1)),
            h('div', null, h('strong', null, custom ? 'Ek sayfa' : BUILTIN[m.key]), ' ', h('span', { class: 'badge' + (custom ? ' custom' : '') }, custom ? 'page-' + pg.slug + '.html' : m.key),
              ' ', h('label', { class: 'switch' }, sw, 'Menüde göster')),
            tools(site.menu, i, rerender, { noDelete: true })),
          custom
            ? tri('Menüdeki adı (sayfa başlığı)', function (l) { return (pg.title || {})[l]; }, function (l, v) { pg.title = pg.title || {}; pg.title[l] = v; })
            : tri('Menüdeki adı', function (l) { return L(l).nav[m.key]; }, function (l, v) { L(l).nav[m.key] = v; })));
      });
      return h('div', null, h('h1', null, 'Menü'),
        h('p', { class: 'lead' }, 'Sayfaların menüdeki sırasını oklarla değiştirin. “Menüde göster” işaretini kaldırdığınız sayfa menüden kalkar ama sitede bağlantılarla ulaşılabilir kalır. Ana sayfa her zaman logodadır. Yeni sayfa eklemek için “Ek sayfalar” bölümünü kullanın.'),
        h('div', { class: 'card' }, list,
          tri('Sağ üstteki başvuru düğmesi', function (l) { return L(l).nav.apply; }, function (l, v) { L(l).nav.apply = v; })));
    },

    staff: function () {
      var staff = S.files.staff.data, depts = L('en').staff.depts;
      var list = h('div');
      staff.forEach(function (m, i) {
        var sel = h('select', null, Object.keys(depts).map(function (k) { return h('option', { value: k, selected: m.dept === k }, depts[k] + ' / ' + (L('ru').staff.depts[k] || '')); }));
        sel.onchange = function () { m.dept = sel.value; updateBar(); };
        m.name = m.name || {}; m.role = m.role || {};
        list.appendChild(h('div', { class: 'item' },
          h('div', { class: 'item-head' }, h('span', { class: 'num' }, String(i + 1)), h('span', { class: 'ttl' }, m.name.en || m.name.ru || m.role.en || ''),
            tools(staff, i, rerender, { beforeDelete: function (x) { removeImage('assets/img/staff/' + x.id + '.jpg'); } })),
          h('div', { class: 'person' },
            imageBox('assets/img/staff/' + m.id + '.jpg', { portrait: true, max: 800 }),
            h('div', null,
              tri('Ad soyad', function (l) { return m.name[l]; }, function (l, v) { m.name[l] = v; }, { hint: 'Boş bırakılırsa “Ad Soyad” görünür' }),
              tri('Görevi / dersi', function (l) { return m.role[l]; }, function (l, v) { m.role[l] = v; }),
              h('div', { class: 'field' }, h('label', null, 'Bölüm'), sel)))));
      });
      return h('div', null, h('h1', null, 'Öğretmenler'),
        h('p', { class: 'lead' }, 'Fotoğraf için kare veya dikey, yüzün ortada olduğu bir resim seçin; otomatik küçültülür. Bölüm adlarını “Sayfa metinleri → Öğretmenler sayfası → Bölüm adları”ndan değiştirebilirsiniz.'),
        list,
        h('button', { type: 'button', class: 'btn btn--primary', onclick: function () {
          staff.push({ id: 'staff-' + Date.now().toString(36), dept: Object.keys(depts)[1] || 'lead', name: { en: '', ky: '', ru: '' }, role: { en: '', ky: '', ru: '' } });
          rerender(); window.scrollTo(0, document.body.scrollHeight);
        } }, '+ Yeni öğretmen ekle'));
    },

    news: function () {
      var news = S.files.news.data;
      var list = h('div');
      news.forEach(function (n, i) {
        var sw = h('input', { type: 'checkbox', checked: n.show !== false });
        sw.onchange = function () { n.show = sw.checked; updateBar(); };
        list.appendChild(h('div', { class: 'item' },
          h('div', { class: 'item-head' }, h('span', { class: 'num' }, String(i + 1)), h('span', { class: 'ttl' }, (n.date || '') + ' · ' + (n.title.en || n.title.ru || n.title.ky || 'Yeni haber')),
            tools(news, i, rerender, { beforeDelete: function (x) { removeImage('assets/img/news/' + x.id + '.jpg'); } })),
          h('div', { class: 'person' },
            imageBox('assets/img/news/' + n.id + '.jpg', { max: 1600 }),
            h('div', null,
              h('div', { class: 'grid2' }, single('Tarih', function () { return n.date; }, function (v) { n.date = v; }, { type: 'date' }),
                h('div', { class: 'field' }, h('label', null, 'Yayın'), h('label', { class: 'switch' }, sw, 'Sitede göster'))),
              tri('Başlık', function (l) { return n.title[l]; }, function (l, v) { n.title[l] = v; }),
              tri('Kısa özet', function (l) { return n.summary[l]; }, function (l, v) { n.summary[l] = v; }, { long: true, rows: 2, hint: 'Kartta görünür' }),
              tri('Haber metni', function (l) { return n.body[l]; }, function (l, v) { n.body[l] = v; }, { long: true, rows: 8, hint: 'Paragraflar arasında boş satır bırakın' })))));
      });
      return h('div', null, h('h1', null, 'Haberler'),
        h('p', { class: 'lead' }, 'Haberler en yeni tarih en üstte olacak şekilde Haberler sayfasında, son üç haber de ana sayfada görünür. Her haberin kendi sayfası olur.'),
        h('button', { type: 'button', class: 'btn btn--primary', style: 'margin-bottom:1rem', onclick: function () {
          var d = new Date().toISOString().slice(0, 10);
          news.unshift({ id: d + '-' + Math.random().toString(36).slice(2, 6), date: d, show: true, title: { en: '', ky: '', ru: '' }, summary: { en: '', ky: '', ru: '' }, body: { en: '', ky: '', ru: '' } });
          rerender();
        } }, '+ Yeni haber yaz'),
        news.length ? list : h('div', { class: 'card muted' }, 'Henüz haber yok.'));
    },

    pages: function () {
      var pages = S.files.pages.data, site = S.files.site.data;
      var list = h('div');
      pages.forEach(function (pg, i) {
        list.appendChild(h('div', { class: 'item' },
          h('div', { class: 'item-head' }, h('span', { class: 'num' }, String(i + 1)), h('span', { class: 'ttl' }, (pg.title.en || pg.title.ru || 'Yeni sayfa') + ' — page-' + pg.slug + '.html'),
            tools(pages, i, rerender, { beforeDelete: function (x) {
              removeImage('assets/img/pages/' + x.slug + '.jpg');
              site.menu = site.menu.filter(function (m) { return m.key !== 'p:' + x.slug; });
            } })),
          h('div', { class: 'person' },
            imageBox('assets/img/pages/' + pg.slug + '.jpg', { max: 1600 }),
            h('div', null,
              tri('Sayfa başlığı (menüde de bu görünür)', function (l) { return pg.title[l]; }, function (l, v) { pg.title[l] = v; }),
              tri('Giriş metni', function (l) { return pg.lead[l]; }, function (l, v) { pg.lead[l] = v; }, { long: true, rows: 2 }),
              tri('Sayfa metni', function (l) { return pg.body[l]; }, function (l, v) { pg.body[l] = v; }, { long: true, rows: 10, hint: 'Paragraflar arasında boş satır; **kalın**; [bağlantı](https://…)' })))));
      });
      return h('div', null, h('h1', null, 'Ek sayfalar'),
        h('p', { class: 'lead' }, 'Kendi sayfalarınızı oluşturun (ör. Burslar, Yaz okulu, Velilere duyuru). Yeni sayfa menünün sonuna eklenir; sırasını ve görünürlüğünü “Menü” bölümünden değiştirebilirsiniz.'),
        h('button', { type: 'button', class: 'btn btn--primary', style: 'margin-bottom:1rem', onclick: function () {
          var name = prompt('Sayfanın adresinde kullanılacak kısa ad (Latin harfleri, ör. “scholarships”):', '');
          if (name == null) return;
          var slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('page-' + Date.now().toString(36));
          if (pages.some(function (x) { return x.slug === slug; })) { alert('Bu adla bir sayfa zaten var.'); return; }
          pages.push({ slug: slug, title: { en: '', ky: '', ru: '' }, lead: { en: '', ky: '', ru: '' }, body: { en: '', ky: '', ru: '' } });
          site.menu.push({ key: 'p:' + slug, show: true });
          rerender(); window.scrollTo(0, document.body.scrollHeight);
        } }, '+ Yeni sayfa oluştur'),
        pages.length ? list : h('div', { class: 'card muted' }, 'Henüz ek sayfa yok.'));
    },

    images: function () {
      var slots = S.files.images.data;
      return h('div', null, h('h1', null, 'Resimler'),
        h('p', { class: 'lead' }, 'Her kutu sitedeki bir fotoğraf alanıdır. Resim yüklenmemiş alanlarda sitede renkli bir desen görünür. Büyük fotoğraflar otomatik küçültülür. Öğretmen, haber ve ek sayfa fotoğrafları kendi bölümlerindedir.'),
        h('div', { class: 'imgs' }, slots.map(function (s) {
          return h('div', { class: 'img-card' }, h('span', { class: 'label' }, s.label), imageBox('assets/img/' + s.file, { max: 1800 }));
        })));
    },

    settings: function () {
      var site = S.files.site.data;
      var phones = h('div', { class: 'group lvl0' });
      site.phones.forEach(function (p, i) {
        phones.appendChild(h('div', { class: 'row', style: 'margin-bottom:.5rem;flex-wrap:nowrap' },
          (function () { var x = h('input', { placeholder: '+996 700 00 00 00' }); x.value = p.label; x.oninput = function () { p.label = x.value; p.tel = '+' + x.value.replace(/\D/g, ''); updateBar(); }; return x; })(),
          tools(site.phones, i, rerender)));
      });
      phones.appendChild(h('button', { type: 'button', class: 'btn btn--ghost btn--sm add', onclick: function () { site.phones.push({ label: '', tel: '' }); rerender(); } }, '+ Telefon ekle'));
      var common = function (k, t, o) { return tri(t, function (l) { return L(l).common[k]; }, function (l, v) { L(l).common[k] = v; }, o); };
      return h('div', null, h('h1', null, 'İletişim ve ayarlar'),
        h('p', { class: 'lead' }, 'Bu bilgiler sitenin altındaki bölümde, İletişim sayfasında ve düğmelerde kullanılır.'),
        h('div', { class: 'card' }, h('h2', null, 'Telefonlar'), phones),
        h('div', { class: 'card' }, h('h2', null, 'WhatsApp'),
          single('WhatsApp numarası', function () { return site.whatsapp; }, function (v) { site.whatsapp = v.replace(/\D/g, ''); }, { placeholder: '996700000000', hint: 'Yalnızca rakam, başında 996. Boş bırakılırsa form ve düğmeler Instagram mesajını açar.' })),
        h('div', { class: 'card' }, h('h2', null, 'Adres ve saatler'),
          common('address', 'Adres (uzun)'), common('addressShort', 'Adres (kısa)'), common('hoursVal', 'Çalışma saatleri'),
          single('2GIS harita bağlantısı', function () { return site.map; }, function (v) { site.map = v.trim(); })),
        h('div', { class: 'card' }, h('h2', null, 'Sosyal medya ve bağlantılar'),
          h('div', { class: 'grid2' },
            single('Instagram adresi', function () { return site.instagram; }, function (v) { site.instagram = v.trim(); }),
            single('Instagram kullanıcı adı', function () { return site.handle; }, function (v) { site.handle = v.trim(); }),
            single('Instagram mesaj bağlantısı', function () { return site.dm; }, function (v) { site.dm = v.trim(); }, { hint: 'ig.me/m/kullanıcıadı' }),
            single('Indigo Academy sitesi', function () { return site.network; }, function (v) { site.network = v.trim(); }))),
        h('div', { class: 'card' }, h('h2', null, 'Gelişmiş'),
          h('div', { class: 'grid2' },
            single('Sitenin adresi', function () { return site.url; }, function (v) { site.url = v.trim().replace(/\/$/, ''); }, { hint: 'Google ve paylaşımlar için' }),
            single('Özel alan adı', function () { return site.customDomain; }, function (v) { site.customDomain = v.trim(); }, { hint: 'ör. indigoprime.edu.kg — DNS ayarı da gerekir' }),
            single('Asistan sunucusu', function () { return site.aiEndpoint; }, function (v) { site.aiEndpoint = v.trim(); }, { hint: 'Boşsa asistan sitedeki metinlerden arar' }))));
    },
  };

  // ---------- start ----------
  function start() {
    $('loading').hidden = false;
    load().then(function () {
      $('login').hidden = true; $('app').hidden = false; $('loading').hidden = true; render();
    }).catch(function (e) {
      $('loading').hidden = true; $('app').hidden = true; $('login').hidden = false;
      var err = $('login-error'); err.hidden = false;
      err.textContent = e.status === 401 ? 'Erişim anahtarı geçersiz ya da süresi dolmuş.' : e.status === 404 || e.status === 403 ? 'Bu anahtarla depoya erişilemiyor. Depo izni ve “Contents” iznini kontrol edin.' : 'Yüklenemedi: ' + e.message;
      try { localStorage.removeItem(TOKEN_KEY); } catch (x) {}
    });
  }
  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    S.token = $('token').value.trim(); if (!S.token) return;
    try { if ($('remember').checked) localStorage.setItem(TOKEN_KEY, S.token); else localStorage.removeItem(TOKEN_KEY); } catch (x) {}
    $('login-error').hidden = true; start();
  });
  $('logout').addEventListener('click', function () {
    if (dirty().files.length + dirty().uploads.length && !confirm('Kaydedilmemiş değişiklikler kaybolacak. Çıkılsın mı?')) return;
    try { localStorage.removeItem(TOKEN_KEY); } catch (x) {}
    location.reload();
  });
  $('save').addEventListener('click', save);
  $('discard').addEventListener('click', function () {
    if (!confirm('Kaydedilmemiş tüm değişiklikler silinsin mi?')) return;
    FILES.forEach(function (f) { S.files[f].data = JSON.parse(S.files[f].text); });
    S.uploads = {}; render();
  });
  $('menu-btn').addEventListener('click', function () { document.body.classList.toggle('side-open'); });
  window.addEventListener('beforeunload', function (e) {
    if (!S.files.site) return;
    var d = dirty(); if (d.files.length || d.uploads.length) { e.preventDefault(); e.returnValue = ''; }
  });

  try { S.token = localStorage.getItem(TOKEN_KEY) || ''; } catch (x) {}
  if (S.token) start(); else { $('loading').hidden = true; $('login').hidden = false; }
})();
