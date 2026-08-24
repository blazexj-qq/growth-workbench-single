/**
 * 模块：五育综评对齐（comprehensive.js）— v0.5 升级
 * 顶部标题+描述 + 五育分布汇总卡 + 双栏（左录入 / 右记录表）+ 必填* + 彩色 tag
 * 字段对齐飞书「五育综评对齐表」：date / category / item / evidence / status / note
 * 只归集活动与佐证材料、对照综评口径查缺补漏，不做"某项不达标"结论。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  var CATS = ['德', '智', '体', '美', '劳']
  var CAT_TAG = { 德: 'tg-err', 智: 'tg-info', 体: 'tg-ok', 美: 'tg-pink', 劳: 'tg-orange' }
  var STATUS_TAG = { 进行中: 'tg-info', 已完成: 'tg-ok', 已归档: 'tg-gray' }

  function catTag(c) {
    return '<span class="tag ' + (CAT_TAG[c] || 'tg-gray') + '">' + App.esc(c) + '育</span>'
  }
  function statusTag(s) {
    return '<span class="tag ' + (STATUS_TAG[s] || 'tg-gray') + '">' + App.esc(s || '—') + '</span>'
  }

  App.pages.comprehensive = function (container) {
    var list = App.demo.list('comprehensive')

    function render() {
      var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">五育综评对齐</h2>' +
        '<p class="muted" style="margin:0 0 16px;font-size:13px;">只归集活动与佐证材料、对照综评口径查缺补漏，不做"某项不达标"的评判。</p>'

      // 五育分布汇总卡（全部记录）
      var sumHtml = '<div class="summary-grid">'
      if (list.length) {
        CATS.forEach(function (c) {
          var arr = list.filter(function (x) { return x.category === c })
          var done = arr.filter(function (x) { return x.status === '已完成' }).length
          sumHtml += '<div class="summary-card">' +
            '<div class="sum-name">' + c + '育</div>' +
            '<div class="sum-value">' + arr.length + '<span class="unit"> 项</span></div>' +
            '<div class="sum-tag"><span class="tag ' + (CAT_TAG[c] || 'tg-gray') + '">' + (done ? '已完成 ' + done : '无完成') + '</span></div></div>'
        })
      } else {
        sumHtml += '<div class="hint" style="grid-column:1/-1;">还没有五育记录，记录后会按德智体美劳分布显示。</div>'
      }
      sumHtml += '</div>'

      // 左栏表单
      var formHtml = App.ui.card('记录一项五育活动',
        '<div class="form-row required"><label>日期</label><div class="form-ctrl"><input id="cm-date" class="inp" type="date" value="' + App.todayStr() + '" placeholder="dd/mm/yyyy" /></div></div>' +
        '<div class="form-row"><label>类别</label><div class="form-ctrl"><select id="cm-cat" class="inp">' +
        CATS.map(function (x) { return '<option value="' + x + '">' + x + '育</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>项目/活动</label><div class="form-ctrl"><input id="cm-item" class="inp" placeholder="如 班级值日 / 校运动会 / 画展（可选）" /></div></div>' +
        '<div class="form-row"><label>佐证材料</label><div class="form-ctrl"><input id="cm-ev" class="inp" placeholder="证书/照片/记录（可选）" /></div></div>' +
        '<div class="form-row"><label>状态</label><div class="form-ctrl"><select id="cm-status" class="inp">' +
        ['进行中', '已完成', '已归档'].map(function (x) { return '<option value="' + x + '">' + x + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>备注</label><div class="form-ctrl"><input id="cm-note" class="inp" placeholder="可选" /></div></div>' +
        '<div style="margin-top:12px;">' + App.ui.btn('cm-add', '添加记录', 'primary') + '</div>' +
        '<div id="cm-msg" class="msg"></div>'
      )

      var pageHtml = '<div class="module-page"><div class="form-col">' + formHtml + '</div><div class="list-col"><div id="cm-list"></div></div></div>'

      container.innerHTML = headHtml + sumHtml + pageHtml
      bindAdd()
      renderList()
    }

    function bindAdd() {
      var btn = container.querySelector('#cm-add')
      if (!btn) return
      btn.addEventListener('click', function () {
        var date = container.querySelector('#cm-date').value
        if (!date) { var m = container.querySelector('#cm-msg'); m.textContent = '请选日期'; m.className = 'msg err'; return }
        var s = {
          id: App.uid(), date: date,
          category: container.querySelector('#cm-cat').value,
          item: container.querySelector('#cm-item').value.trim(),
          evidence: container.querySelector('#cm-ev').value.trim(),
          status: container.querySelector('#cm-status').value,
          note: container.querySelector('#cm-note').value.trim()
        }
        list.push(s)
        App.demo.write('comprehensive', list)
        var m = container.querySelector('#cm-msg'); m.textContent = '已添加 ✓'; m.className = 'msg ok'
        setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 2000)
        render()
      })
    }

    function renderList() {
      var el = container.querySelector('#cm-list')
      if (!el) return
      if (!list.length) { el.innerHTML = App.ui.empty('还没有五育记录，先在左侧记一项活动。'); return }
      var rows = list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 }).map(function (s) {
        return '<tr>' +
          '<td>' + App.esc(s.date || '') + '</td>' +
          '<td>' + catTag(s.category) + '</td>' +
          '<td>' + App.esc(s.item || '—') + '</td>' +
          '<td>' + App.esc(s.evidence || '—') + '</td>' +
          '<td>' + statusTag(s.status) + '</td>' +
          '<td><a class="link" data-del="' + App.esc(s.id) + '">删除</a></td>' +
          '</tr>'
      }).join('')
      el.innerHTML = '<table class="tbl"><thead><tr><th>日期</th><th>类别</th><th>项目</th><th>佐证</th><th>状态</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="hint">对照综评口径查缺补漏，别拿"少一育"给孩子压力。</div>'
      el.querySelectorAll('[data-del]').forEach(function (a) {
        a.addEventListener('click', function () {
          var id = a.getAttribute('data-del')
          list = list.filter(function (x) { return x.id !== id })
          App.demo.write('comprehensive', list)
          render()
        })
      })
    }

    render()
  }
})(window)
