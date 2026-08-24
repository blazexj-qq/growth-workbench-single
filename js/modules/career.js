/**
 * 模块：生涯探索（career.js）— v0.5 升级
 * 顶部标题+描述 + 兴趣方向概览汇总卡 + 双栏（左录入 / 右记录表）+ 必填* + 彩色 tag
 * 字段对齐飞书「生涯探索表」：date / title / domain / source / thought / status / note
 * 只记录兴趣萌芽与职业好奇，绝不据此做职业适配或能力定论。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  var DOMAIN_TAG = { 自然科学: 'tg-cyan', 工程技术: 'tg-info', 医学健康: 'tg-err', 人文社科: 'tg-purple', 艺术体育: 'tg-pink', 商业: 'tg-orange', 其他: 'tg-gray' }
  var STATUS_TAG = { 萌芽: 'tg-gray', 感兴趣: 'tg-info', 持续关注: 'tg-ok', 暂放: 'tg-orange' }

  function domainTag(d) {
    return '<span class="tag ' + (DOMAIN_TAG[d] || 'tg-gray') + '">' + App.esc(d || '—') + '</span>'
  }
  function statusTag(s) {
    return '<span class="tag ' + (STATUS_TAG[s] || 'tg-gray') + '">' + App.esc(s || '—') + '</span>'
  }

  App.pages.career = function (container) {
    var list = App.demo.list('career')

    function render() {
      var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">生涯启蒙探索</h2>' +
        '<p class="muted" style="margin:0 0 16px;font-size:13px;">只记录兴趣萌芽与职业好奇，是"兴趣记录"不是"职业定论"。</p>'

      // 兴趣方向概览汇总卡
      var sumHtml = '<div class="summary-grid">'
      if (list.length) {
        var seedN = list.filter(function (x) { return x.status === '萌芽' }).length
        var keepN = list.filter(function (x) { return x.status === '感兴趣' || x.status === '持续关注' }).length
        var pauseN = list.filter(function (x) { return x.status === '暂放' }).length
        sumHtml +=
          '<div class="summary-card"><div class="sum-name">兴趣方向记录</div><div class="sum-value">' + list.length + '<span class="unit"> 个</span></div><div class="sum-tag"></div></div>' +
          '<div class="summary-card"><div class="sum-name">萌芽期</div><div class="sum-value">' + seedN + '<span class="unit"> 个</span></div><div class="sum-tag"><span class="tag tg-gray">刚冒头</span></div></div>' +
          '<div class="summary-card"><div class="sum-name">感兴趣/持续关注</div><div class="sum-value">' + keepN + '<span class="unit"> 个</span></div><div class="sum-tag"><span class="tag tg-ok">可深耕</span></div></div>' +
          '<div class="summary-card"><div class="sum-name">暂放</div><div class="sum-value">' + pauseN + '<span class="unit"> 个</span></div><div class="sum-tag"><span class="tag tg-orange">不勉强</span></div></div>'
      } else {
        sumHtml += '<div class="hint" style="grid-column:1/-1;">还没有生涯记录，记录后会显示兴趣方向概览。</div>'
      }
      sumHtml += '</div>'

      // 左栏表单
      var formHtml = App.ui.card('记录一个兴趣萌芽',
        '<div class="form-row required"><label>日期</label><div class="form-ctrl"><input id="cr-date" class="inp" type="date" value="' + App.todayStr() + '" placeholder="dd/mm/yyyy" /></div></div>' +
        '<div class="form-row required"><label>主题方向</label><div class="form-ctrl"><input id="cr-title" class="inp" placeholder="如 想当医生 / 对火箭好奇" /></div></div>' +
        '<div class="form-row"><label>方向领域</label><div class="form-ctrl"><select id="cr-domain" class="inp">' +
        ['自然科学', '工程技术', '医学健康', '人文社科', '艺术体育', '商业', '其他'].map(function (x) { return '<option value="' + x + '">' + x + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>触发来源</label><div class="form-ctrl"><select id="cr-source" class="inp">' +
        ['阅读', '视频', '家庭讨论', '学校活动', '亲身体验', '其他'].map(function (x) { return '<option value="' + x + '">' + x + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>想法描述</label><div class="form-ctrl"><input id="cr-thought" class="inp" placeholder="孩子怎么说的、为什么好奇（可选）" /></div></div>' +
        '<div class="form-row"><label>状态</label><div class="form-ctrl"><select id="cr-status" class="inp">' +
        ['萌芽', '感兴趣', '持续关注', '暂放'].map(function (x) { return '<option value="' + x + '">' + x + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>备注</label><div class="form-ctrl"><input id="cr-note" class="inp" placeholder="可选" /></div></div>' +
        '<div style="margin-top:12px;">' + App.ui.btn('cr-add', '保存', 'primary') + '</div>' +
        '<div id="cr-msg" class="msg"></div>'
      )

      var pageHtml = '<div class="module-page"><div class="form-col">' + formHtml + '</div><div class="list-col"><div id="cr-list"></div></div></div>'

      container.innerHTML = headHtml + sumHtml + pageHtml
      bindAdd()
      renderList()
    }

    function bindAdd() {
      var btn = container.querySelector('#cr-add')
      if (!btn) return
      btn.addEventListener('click', function () {
        var date = container.querySelector('#cr-date').value
        var title = container.querySelector('#cr-title').value.trim()
        if (!date || !title) { var m = container.querySelector('#cr-msg'); m.textContent = '请填日期和主题方向'; m.className = 'msg err'; return }
        var s = {
          id: App.uid(), date: date, title: title,
          domain: container.querySelector('#cr-domain').value,
          source: container.querySelector('#cr-source').value,
          thought: container.querySelector('#cr-thought').value.trim(),
          status: container.querySelector('#cr-status').value,
          note: container.querySelector('#cr-note').value.trim()
        }
        list.push(s)
        App.demo.write('career', list)
        var m = container.querySelector('#cr-msg'); m.textContent = '已保存 ✓'; m.className = 'msg ok'
        setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 2000)
        render()
      })
    }

    function renderList() {
      var el = container.querySelector('#cr-list')
      if (!el) return
      if (!list.length) { el.innerHTML = App.ui.empty('还没有生涯记录，先在左侧记一个孩子的好奇心。'); return }
      var rows = list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 }).map(function (s) {
        return '<tr>' +
          '<td>' + App.esc(s.date || '') + '</td>' +
          '<td>' + App.esc(s.title || '') + '</td>' +
          '<td>' + domainTag(s.domain) + '</td>' +
          '<td>' + App.esc(s.source || '—') + '</td>' +
          '<td>' + App.esc(s.thought || '—') + '</td>' +
          '<td>' + statusTag(s.status) + '</td>' +
          '<td><a class="link" data-del="' + App.esc(s.id) + '">删除</a></td>' +
          '</tr>'
      }).join('')
      el.innerHTML = '<table class="tbl"><thead><tr><th>日期</th><th>主题</th><th>领域</th><th>来源</th><th>想法</th><th>状态</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="hint">只看好奇心怎么来的、怎么发展的，不贴"将来适合当什么"的标签。</div>'
      el.querySelectorAll('[data-del]').forEach(function (a) {
        a.addEventListener('click', function () {
          var id = a.getAttribute('data-del')
          list = list.filter(function (x) { return x.id !== id })
          App.demo.write('career', list)
          render()
        })
      })
    }

    render()
  }
})(window)
