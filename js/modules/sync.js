/**
 * 模块：同步 / 备份（sync.js）— 模块 S
 * ① 飞书整包云备份（上传 / 恢复，HMAC-SHA256 鉴权，整包覆盖式）
 * ② 本机备份（导出 / 导入 JSON，复用 App.backup）
 * ③ GitHub 私有仓库备份（上传前强制校验私有 + PAT 加密存储)
 * ④ 出厂「数据保全引导」弹窗 App.showGuide()
 *
 * 红线：样例数据（键名以 sample 或 seed: 开头）绝不备份 / 上传；不排名、不贴焦虑标签。
 * 经典 <script> 写法，挂 window.App，严禁 ES module import/export。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  // ---------- 小工具 ----------
  function q(root, sel) { return root.querySelector(sel) }
  function setMsg(el, text, cls) { if (!el) return; el.textContent = text; el.className = 'msg' + (cls ? ' ' + cls : '') }
  function ymd() {
    var d = new Date()
    return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2)
  }
  function b64encodeUnicode(str) { return btoa(unescape(encodeURIComponent(str))) }

  // ---------- 加密工具（Web Crypto，需安全上下文；Chrome 双击 file:// 即为安全上下文） ----------
  function hasCrypto() { return !!(global.crypto && global.crypto.subtle) }
  function bufToHex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2) }).join('')
  }
  function hmacHex(secret, msg) {
    var enc = new TextEncoder()
    return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then(function (key) { return crypto.subtle.sign('HMAC', key, enc.encode(msg)) })
      .then(bufToHex)
  }
  function deriveKey(pass, salt) {
    var enc = new TextEncoder()
    return crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey'])
      .then(function (k) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
          k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
      })
  }
  function hexToBytes(hex) {
    var arr = hex.match(/.{2}/g)
    return new Uint8Array(arr.map(function (h) { return parseInt(h, 16) }))
  }
  function encryptToken(pass, plaintext) {
    var salt = crypto.getRandomValues(new Uint8Array(16))
    var iv = crypto.getRandomValues(new Uint8Array(12))
    return deriveKey(pass, salt).then(function (key) {
      var enc = new TextEncoder()
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(plaintext))
        .then(function (ct) { return { salt: bufToHex(salt), iv: bufToHex(iv), ct: bufToHex(ct) } })
    })
  }
  function decryptToken(pass, blob) {
    return deriveKey(pass, hexToBytes(blob.salt)).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: hexToBytes(blob.iv) }, key, hexToBytes(blob.ct))
        .then(function (pt) { return new TextDecoder().decode(pt) })
    })
  }

  // ---------- 数据导出（过滤样例） ----------
  function deviceId() {
    var id = App.store.get('deviceId', null)
    if (!id) { id = App.uid(); App.store.set('deviceId', id) }
    return id
  }
  function exportClean() {
    var all = App.store.exportAll()
    var out = {}
    for (var k in all) {
      if (!Object.prototype.hasOwnProperty.call(all, k)) continue
      if (k.indexOf('sample') === 0 || k.indexOf('seed:') === 0) continue // 红线：样例 / 演示种子不备份
      // 元数据键（一次性标记 / 设备 ID）不备份；恢复后本机会重新生成
      if (k === 'demo:bootstrapped' || k === 'seenGuide' || k === 'deviceId' || k === 'ghOwner' || k === 'ghRepo' || k === 'ghTokenEnc') continue
      out[k] = all[k]
    }
    return out
  }
  // 带 HMAC 签名的 POST（飞书代理用）
  function signPost(url, bodyObj) {
    var body = JSON.stringify(bodyObj)
    return hmacHex(App.store.get('syncConfig', {}).secret || '', bodyObj.ts + bodyObj.nonce + body)
      .then(function (sign) {
        return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Sign': sign }, body: body })
      })
  }

  // ---------- GPT 风格文案：飞书整包云备份 ----------
  function fsUpload(root) {
    var cfg = App.store.get('syncConfig', {})
    var msg = q(root, '#fs-msg')
    if (!cfg.url) { setMsg(msg, '请先填飞书代理地址', 'err'); return }
    if (!hasCrypto()) { setMsg(msg, '当前浏览器不支持签名，请用 Chrome 打开本页', 'err'); return }
    var payload = { ts: Date.now(), nonce: App.uid(), deviceId: deviceId(), data: exportClean() }
    setMsg(msg, '正在上传到飞书…', '')
    signPost(cfg.url, payload)
      .then(function (r) { return r.text().then(function (t) { return { status: r.status, t: t } }) })
      .then(function (o) { if (o.status >= 200 && o.status < 300) setMsg(msg, '✅ 已上传到飞书云备份', 'ok'); else setMsg(msg, '上传失败(' + o.status + ')：' + o.t, 'err') })
      .catch(function (e) { setMsg(msg, '上传出错：' + e.message, 'err') })
  }
  function fsDownload(root) {
    var cfg = App.store.get('syncConfig', {})
    var msg = q(root, '#fs-msg')
    if (!cfg.url) { setMsg(msg, '请先填飞书代理地址', 'err'); return }
    if (!hasCrypto()) { setMsg(msg, '当前浏览器不支持签名，请用 Chrome 打开本页', 'err'); return }
    var payload = { action: 'download', ts: Date.now(), nonce: App.uid(), deviceId: deviceId() }
    setMsg(msg, '正在从飞书恢复…', '')
    signPost(cfg.url, payload)
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j } }) })
      .then(function (o) {
        if (o.status >= 200 && o.status < 300 && o.j && o.j.ok && o.j.data) {
          var n = App.store.importAll(o.j.data)
          setMsg(msg, '✅ 已从飞书恢复 ' + n + ' 个数据项（整包覆盖，本机被替换）', 'ok')
          App.show('sync')
        } else { setMsg(msg, '恢复失败(' + o.status + ')：' + ((o.j && o.j.error) || ''), 'err') }
      })
      .catch(function (e) { setMsg(msg, '恢复出错：' + e.message, 'err') })
  }

  // ---------- GitHub 私有仓库备份 ----------
  function ghHeaders(pat) {
    return { 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + pat, 'X-GitHub-Api-Version': '2022-11-28' }
  }
  function doGhUpload(owner, repo, pat, msg) {
    setMsg(msg, '正在校验仓库是否为私有…', '')
    fetch('https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo), { headers: ghHeaders(pat) })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j } }) })
      .then(function (o) {
        if (o.status !== 200) { setMsg(msg, '读取仓库失败(' + o.status + ')：' + (o.j.message || '检查 owner/repo/PAT'), 'err'); return }
        if (o.j.private !== true) { setMsg(msg, '⚠️ 该仓库不是私有仓库，已拒绝上传以保护孩子数据。请改用私有仓库。', 'err'); return }
        setMsg(msg, '仓库为私有 ✓，正在上传备份…', '')
        var path = 'growth-workbench-备份-' + ymd() + '.json'
        var encPath = encodeURIComponent(path)
        fetch('https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + encPath, { headers: ghHeaders(pat) })
          .then(function (r) { return r.status === 200 ? r.json() : null })
          .then(function (existing) {
            var content = b64encodeUnicode(JSON.stringify(exportClean()))
            var body = { message: '成长工作台备份 ' + new Date().toISOString(), content: content }
            if (existing && existing.sha) body.sha = existing.sha
            return fetch('https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + encPath, {
              method: 'PUT', headers: ghHeaders(pat), body: JSON.stringify(body)
            }).then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j } }) })
          })
          .then(function (o2) {
            if (o2.status >= 200 && o2.status < 300) setMsg(msg, '✅ 已上传到 GitHub 私有仓库：' + path, 'ok')
            else setMsg(msg, '上传失败(' + o2.status + ')：' + (o2.j.message || ''), 'err')
          })
          .catch(function (e) { setMsg(msg, '上传出错：' + e.message, 'err') })
      })
      .catch(function (e) { setMsg(msg, '校验出错：' + e.message, 'err') })
  }
  function ghUpload(root) {
    var owner = q(root, '#gh-owner').value.trim()
    var repo = q(root, '#gh-repo').value.trim()
    var pat = q(root, '#gh-pat').value.trim()
    var msg = q(root, '#gh-msg')
    if (!owner || !repo) { setMsg(msg, '请填 owner / repo', 'err'); return }
    if (!hasCrypto()) { setMsg(msg, '当前浏览器不支持加密校验，请用 Chrome 打开', 'err'); return }
    var enc = App.store.get('ghTokenEnc', null)
    if (!pat && enc) {
      // 用已加密保存的令牌：填口令解密
      var pass = q(root, '#gh-pass').value
      if (!pass) { setMsg(msg, '请填加密口令以解密已保存的令牌', 'err'); return }
      decryptToken(pass, enc)
        .then(function (realPat) { doGhUpload(owner, repo, realPat, msg) })
        .catch(function (e) { setMsg(msg, '解密失败（口令错？）：' + e.message, 'err') })
      return
    }
    if (!pat) { setMsg(msg, '请填 PAT（或先用「保存令牌(加密)」存好再用口令解密）', 'err'); return }
    doGhUpload(owner, repo, pat, msg)
  }
  function ghSaveEnc(root) {
    var pat = q(root, '#gh-pat').value.trim()
    var pass = q(root, '#gh-pass').value
    var msg = q(root, '#gh-msg')
    if (!pat) { setMsg(msg, '先填 PAT 再保存', 'err'); return }
    if (!pass) { setMsg(msg, '请填加密口令（用于本机加密保存 PAT）', 'err'); return }
    if (!hasCrypto()) { setMsg(msg, '当前浏览器不支持加密，请用 Chrome', 'err'); return }
    encryptToken(pass, pat)
      .then(function (blob) {
        App.store.set('ghTokenEnc', blob)
        App.store.set('ghOwner', q(root, '#gh-owner').value.trim())
        App.store.set('ghRepo', q(root, '#gh-repo').value.trim())
        setMsg(msg, '✅ PAT 已加密保存（密文存本机）。下次上传填口令即可解密使用。', 'ok')
      })
      .catch(function (e) { setMsg(msg, '加密失败：' + e.message, 'err') })
  }

  // ---------- 本机导入（隐藏 file input，backup.importData 为回调式） ----------
  function bindImport(root) {
    var input = q(root, '#local-file')
    input.addEventListener('change', function () {
      var f = input.files && input.files[0]
      if (!f) return
      App.backup.importData(f, function (err, n) {
        if (err) setMsg(q(root, '#local-msg'), '导入失败：' + err.message, 'err')
        else setMsg(q(root, '#local-msg'), '✅ 已导入 ' + n + ' 个数据项', 'ok')
      })
    })
  }

  // ---------- 页面渲染 ----------
  App.pages.sync = function (container) {
    var cfg = App.store.get('syncConfig', {})
    var enc = App.store.get('ghTokenEnc', null)

    // 页面标题 + 描述（对齐 v0.5 风格）
    var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">同步与备份</h2>' +
      '<p class="muted" style="margin:0 0 16px;font-size:13px;">本地数据三保险：本机导出 JSON + 飞书整包云备份 + GitHub 私有仓库备份。演示数据永远不进备份。</p>'

    // 备份状态总览卡
    var hasSeed = (App.demo && App.demo.seedKeys) ? App.demo.seedKeys().some(function (k) { return App.store.get(k, null) !== null }) : false
    var fsReady = !!(cfg.url && cfg.secret)
    var ghReady = !!App.store.get('ghRepo', '')
    var sumHtml = '<div class="summary-grid">' +
      '<div class="summary-card"><div class="sum-name">本机备份</div><div class="sum-value small">随时可用</div><div class="sum-tag"><span class="tag tg-ok">推荐先留</span></div></div>' +
      '<div class="summary-card"><div class="sum-name">飞书云备份</div><div class="sum-value small">' + (fsReady ? '已配置' : '未配置') + '</div><div class="sum-tag">' + (fsReady ? '<span class="tag tg-ok">就绪</span>' : '<span class="tag tg-gray">待配置</span>') + '</div></div>' +
      '<div class="summary-card"><div class="sum-name">GitHub 私有备份</div><div class="sum-value small">' + (ghReady ? '已配置' : '未配置') + '</div><div class="sum-tag">' + (ghReady ? '<span class="tag tg-ok">就绪</span>' : '<span class="tag tg-gray">待配置</span>') + '</div></div>' +
      '<div class="summary-card"><div class="sum-name">演示数据</div><div class="sum-value small">' + (hasSeed ? '已插入' : '无') + '</div><div class="sum-tag">' + (hasSeed ? '<span class="tag tg-orange">不进备份</span>' : '<span class="tag tg-gray">无</span>') + '</div></div>' +
      '</div>'

    var fsHtml = App.ui.card('飞书云备份（整包）',
      App.ui.row('代理地址', '<input id="fs-url" class="inp" placeholder="https://你的FC地址" value="' + App.esc(cfg.url || '') + '" />') +
      App.ui.row('共享密钥', '<input id="fs-secret" class="inp" type="password" placeholder="与云端代理一致的密钥" value="' + App.esc(cfg.secret || '') + '" />') +
      '<div style="margin-top:12px;">' + App.ui.btn('fs-save', '保存配置', 'primary') + ' ' +
      App.ui.btn('fs-up', '上传到飞书', 'primary') + ' ' + App.ui.btn('fs-down', '从飞书恢复', '') + '</div>' +
      '<div id="fs-msg" class="msg"></div>' +
      '<div class="muted" style="margin-top:8px;">整包覆盖式：恢复会用云端数据整体替换本机，不自动合并。建议先在「本机备份」留一份再恢复。</div>')

    var localHtml = App.ui.card('本机备份（推荐先留这一份）',
      '<div>' + App.ui.btn('local-out', '导出本机备份(JSON)', 'primary') + ' ' +
      App.ui.btn('local-in', '导入本机备份', '') + '</div>' +
      '<input id="local-file" type="file" accept="application/json" style="display:none;" />' +
      '<div id="local-msg" class="msg"></div>' +
      '<div class="muted" style="margin-top:8px;">导出是一个 JSON 文件，存到电脑/网盘即可。换电脑或清缓存前务必先导出。</div>')

    var ghHtml = App.ui.card('GitHub 私有备份（进阶）',
      App.ui.row('仓库 owner', '<input id="gh-owner" class="inp" placeholder="如 blazexj-qq" value="' + App.esc(App.store.get('ghOwner', '') || '') + '" />') +
      App.ui.row('仓库名', '<input id="gh-repo" class="inp" placeholder="如 growth-workbench-backup" value="' + App.esc(App.store.get('ghRepo', '') || '') + '" />') +
      App.ui.row('细粒度 PAT', '<input id="gh-pat" class="inp" type="password" placeholder="仅授权该私有库 contents:write" />') +
      App.ui.row('加密口令', '<input id="gh-pass" class="inp" type="password" placeholder="用于本机加密保存 PAT" />') +
      '<div style="margin-top:12px;">' + App.ui.btn('gh-up', '校验并上传', 'primary') + ' ' + App.ui.btn('gh-save', '保存令牌(加密)', '') + '</div>' +
      '<div id="gh-msg" class="msg"></div>' +
      (enc ? '<div class="muted" style="margin-top:8px;">检测到已加密保存的令牌，上传时填「加密口令」即可解密使用。</div>' : '') +
      '<div class="muted" style="margin-top:8px;">⚠️ 仅允许私有仓库；公开仓库会被直接拒绝。PAT 默认加密存本机，不会明文落盘。</div>')

    var guideHtml = App.ui.card('数据保全说明',
      '<div class="muted">数据只存在「这台电脑这个浏览器」里。防丢三招：① 定期导出本机备份；② 开启飞书云备份；③ 或用 GitHub 私有备份。</div>' +
      '<div style="margin-top:12px;">' + App.ui.btn('guide-open', '查看数据保全说明', '') + '</div>')

    // 演示数据开关：仅插入种子，让老徐看清 v0.5 双栏效果；同步备份/上传时会自动过滤
    var demoHtml = App.ui.card('演示数据（看清双栏效果）',
      '<div class="muted">从空模块看上去只是空白表格，难看出 v0.5 的整体效果。点「插入演示数据」会自动塞一批贴近真实场景的样例记录到「目标 / 学习能力 / 阅读 / 生涯 / 体验 / 亲子 / 营养 / 五育 / 家校」9 个模块——下次进入对应模块页就能直接看到。</div>' +
      '<div style="margin-top:12px;">' + App.ui.btn('demo-fill', hasSeed ? '重新插入演示数据' : '插入演示数据（看清效果）', 'primary') + ' ' +
      App.ui.btn('demo-clear', '清空演示数据', '') + '</div>' +
      '<div id="demo-msg" class="msg"></div>' +
      '<div class="muted" style="margin-top:8px;">🔒 演示数据存在「seed:」键，自动加进同步备份的「红线」——飞书 / GitHub / 导出的本机备份里都不会包含。</div>')

    // 双列设置布局：飞书 / 本机 / GitHub 三张主卡并排，演示数据与说明整宽
    var settingsHtml = '<div class="settings-grid">' + fsHtml + localHtml + ghHtml + '</div>' + demoHtml + guideHtml

    container.innerHTML = headHtml + sumHtml + settingsHtml

    // 飞书配置保存
    q(container, '#fs-save').addEventListener('click', function () {
      var nc = { url: q(container, '#fs-url').value.trim(), secret: q(container, '#fs-secret').value }
      App.store.set('syncConfig', nc)
      setMsg(q(container, '#fs-msg'), '✅ 配置已保存', 'ok')
    })
    q(container, '#fs-up').addEventListener('click', function () { fsUpload(container) })
    q(container, '#fs-down').addEventListener('click', function () { fsDownload(container) })

    // 本机备份
    q(container, '#local-out').addEventListener('click', function () { App.backup.exportData() })
    q(container, '#local-in').addEventListener('click', function () { q(container, '#local-file').click() })
    bindImport(container)

    // GitHub
    q(container, '#gh-up').addEventListener('click', function () { ghUpload(container) })
    q(container, '#gh-save').addEventListener('click', function () { ghSaveEnc(container) })

    // 引导
    q(container, '#guide-open').addEventListener('click', function () { App.showGuide(true) })

    // 演示数据开关
    q(container, '#demo-fill').addEventListener('click', function () {
      var n = App.demo.fill()
      setMsg(q(container, '#demo-msg'), '✅ 已插入 ' + n + ' 条演示记录（同步备份/上传会自动过滤）', 'ok')
    })
    q(container, '#demo-clear').addEventListener('click', function () {
      if (!confirm('清空全部演示数据？清空后 6 个模块会回到空状态（真实数据不受影响）。')) return
      var n = App.demo.clear()
      setMsg(q(container, '#demo-msg'), '✅ 已清空 ' + n + ' 类演示数据', 'ok')
    })
  }

  // ---------- 出厂数据保全引导（首次打开弹窗） ----------
  App.showGuide = function (force) {
    if (!force && App.store.get('seenGuide', false)) return
    var mask = document.createElement('div')
    mask.className = 'guide-mask'
    mask.innerHTML =
      '<div class="guide-card">' +
      '<h3>🌱 欢迎使用成长·升学工作台</h3>' +
      '<p>你的数据只存在 <b>这台电脑、这个浏览器</b> 里。下面三件事，记住就不怕丢：</p>' +
      '<ol>' +
      '<li><b>定期导出本机备份</b>：在「同步」页点「导出本机备份」，得到一个 JSON 文件，存到电脑或网盘。</li>' +
      '<li><b>开启飞书云备份</b>：配置好代理后点「上传到飞书」，数据多一份云端兜底。</li>' +
      '<li><b>或用 GitHub 私有备份</b>：把备份存进你自己的私有仓库（公开仓库会被拒绝）。</li>' +
      '</ol>' +
      '<p class="muted">⚠️ 不要清浏览器缓存、不要换电脑不备份——那样数据就真没了。也不要把备份文件发到公开地方。</p>' +
      '<div style="text-align:right;margin-top:12px;">' + App.ui.btn('guide-ok', '我明白了，开始使用', 'primary') + '</div>' +
      '</div>'
    document.body.appendChild(mask)
    mask.querySelector('#guide-ok').addEventListener('click', function () {
      App.store.set('seenGuide', true)
      if (mask.parentNode) mask.parentNode.removeChild(mask)
    })
  }
})(window)
