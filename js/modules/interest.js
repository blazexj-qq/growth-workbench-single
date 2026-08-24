/**
 * 模块：兴趣阅读（interest.js）— v0.5 升级
 * 顶部标题+描述 + 近 7 天阅读概览汇总卡 + 双栏（左录入 / 右记录表）+ 必填* + 彩色 tag
 * 字段对齐飞书「兴趣与阅读表」：date / book / readMode / durationMin / amount / comprehension / interest / parentObs / note
 * 只记录阅读事实与兴趣，不做任何评价结论。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  var MODE_TAG = { 自主: 'tg-info', 亲子共读: 'tg-purple', 听读: 'tg-cyan', 读伴伴读: 'tg-pink' }

  function modeTag(m) {
    return '<span class="tag ' + (MODE_TAG[m] || 'tg-gray') + '">' + App.esc(m || '—') + '</span>'
  }
  function scoreTag(v) {
    v = Number(v) || 0
    if (v >= 4) return '<span class="tag tg-ok">' + v + '</span>'
    if (v === 3) return '<span class="tag tg-info">' + v + '</span>'
    return '<span class="tag tg-gray">' + v + '</span>'
  }

  App.pages.interest = function (container) {
    var list = App.demo.list('interest')

    // 兼容旧种子字段（title/minutes）与现行字段（book/durationMin）
    function norm(s) {
      return {
        date: s.date,
        book: s.book || s.title || '',
        readMode: s.readMode || '',
        durationMin: s.durationMin != null ? s.durationMin : (s.minutes != null ? s.minutes : null),
        amount: s.amount || '',
        comprehension: s.comprehension != null ? s.comprehension : 3,
        interest: s.interest != null ? s.interest : 3,
        parentObs: s.parentObs || s.note || '',
        note: s.note || ''
      }
    }

    function render() {
      var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">兴趣阅读</h2>' +
        '<p class="muted" style="margin:0 0 16px;font-size:13px;">只记录阅读事实与兴趣趋势，不评判"读得好不好"。</p>'

      // 近 7 天阅读概览
      var now = new Date()
      var d7 = new Date(now.getTime() - 7 * 86400000)
      var d7s = d7.getFullYear() + '-' + ('0' + (d7.getMonth() + 1)).slice(-2) + '-' + ('0' + d7.getDate()).slice(-2)
      var sumHtml = '<div class="summary-grid">'
      if (list.length) {
        var r7 = list.filter(function (x) { return x.date && x.date >= d7s })
        var totalMin = r7.reduce(function (a, x) { return a + (Number(x.durationMin) || 0) }, 0)
        var intVals = r7.map(function (x) { return Number(x.interest) || 0 }).filter(Boolean)
        var compVals = r7.map(function (x) { return Number(x.comprehension) || 0 }).filter(Boolean)
        var intAvg = intVals.length ? (intVals.reduce(function (a, b) { return a + b }, 0) / intVals.length).toFixed(1) : '—'
        var compAvg = compVals.length ? (compVals.reduce(function (a, b) { return a + b }, 0) / compVals.length).toFixed(1) : '—'
        sumHtml +=
          '<div class="summary-card"><div class="sum-name">近 7 天阅读</div><div class="sum-value">' + r7.length + '<span class="unit"> 次</span></div><div class="sum-tag">' + (r7.length >= 4 ? '<span class="tag tg-ok">习惯养成中</span>' : '<span class="tag tg-orange">继续加油</span>') + '</div></div>' +
          '<div class="summary-card"><div class="sum-name">近 7 天总时长</div><div class="sum-value">' + totalMin + '<span class="unit"> min</span></div><div class="sum-tag"></div></div>' +
          '<div class="summary-card"><div class="sum-name">兴趣度均值</div><div class="sum-value">' + intAvg + '</div><div class="sum-tag">' + (intAvg === '—' ? '' : scoreTag(intAvg)) + '</div></div>' +
          '<div class="summary-card"><div class="sum-name">理解自评均值</div><div class="sum-value">' + compAvg + '</div><div class="sum-tag">' + (compAvg === '—' ? '' : scoreTag(compAvg)) + '</div></div>'
      } else {
        sumHtml += '<div class="hint" style="grid-column:1/-1;">还没有阅读记录，记录后会显示近 7 天阅读概览。</div>'
      }
      sumHtml += '</div>'

      // 左栏表单
      var formHtml = App.ui.card('记一次阅读',
        '<div class="form-row required"><label>日期</label><div class="form-ctrl"><input id="it-date" class="inp" type="date" value="' + App.todayStr() + '" placeholder="dd/mm/yyyy" /></div></div>' +
        '<div class="form-row required"><label>书名</label><div class="form-ctrl"><input id="it-book" class="inp" placeholder="如《夏洛的网》" /></div></div>' +
        '<div class="form-row"><label>阅读方式</label><div class="form-ctrl"><select id="it-mode" class="inp">' +
        ['自主', '亲子共读', '听读', '读伴伴读'].map(function (x) { return '<option value="' + x + '">' + x + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>时长(分钟)</label><div class="form-ctrl"><input id="it-dur" class="inp" type="number" min="0" placeholder="可选" /></div></div>' +
        '<div class="form-row"><label>阅读量</label><div class="form-ctrl"><input id="it-amount" class="inp" placeholder="如 第 3-5 章 / 20 页（可选）" /></div></div>' +
        '<div class="form-row"><label>理解自评(1-5)</label><div class="form-ctrl"><select id="it-comp" class="inp">' +
        [1, 2, 3, 4, 5].map(function (v) { return '<option value="' + v + '">' + v + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>兴趣度(1-5)</label><div class="form-ctrl"><select id="it-int" class="inp">' +
        [1, 2, 3, 4, 5].map(function (v) { return '<option value="' + v + '">' + v + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>家长观察</label><div class="form-ctrl"><input id="it-obs" class="inp" placeholder="读了多久、状态如何（可选）" /></div></div>' +
        '<div class="form-row"><label>备注</label><div class="form-ctrl"><input id="it-note" class="inp" placeholder="可选" /></div></div>' +
        '<div style="margin-top:12px;">' + App.ui.btn('it-add', '保存这次阅读', 'primary') + '</div>' +
        '<div id="it-msg" class="msg"></div>'
      )

      var pageHtml = '<div class="module-page"><div class="form-col">' + formHtml + '</div><div class="list-col"><div id="it-list"></div></div></div>'

      container.innerHTML = headHtml + sumHtml + pageHtml
      bindAdd()
      renderList()
    }

    function bindAdd() {
      var btn = container.querySelector('#it-add')
      if (!btn) return
      btn.addEventListener('click', function () {
        var date = container.querySelector('#it-date').value
        var book = container.querySelector('#it-book').value.trim()
        if (!date || !book) { var m = container.querySelector('#it-msg'); m.textContent = '请填日期和书名'; m.className = 'msg err'; return }
        var s = {
          id: App.uid(), date: date, book: book,
          readMode: container.querySelector('#it-mode').value,
          durationMin: Number(container.querySelector('#it-dur').value) || null,
          amount: container.querySelector('#it-amount').value.trim(),
          comprehension: Number(container.querySelector('#it-comp').value) || 3,
          interest: Number(container.querySelector('#it-int').value) || 3,
          parentObs: container.querySelector('#it-obs').value.trim(),
          note: container.querySelector('#it-note').value.trim()
        }
        list.push(s)
        App.demo.write('interest', list)
        var m = container.querySelector('#it-msg'); m.textContent = '已保存 ✓'; m.className = 'msg ok'
        setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 2000)
        render()
      })
    }

    function renderList() {
      var el = container.querySelector('#it-list')
      if (!el) return
      if (!list.length) { el.innerHTML = App.ui.empty('还没有阅读记录，先在左侧记一次。'); return }
      var rows = list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 }).map(function (raw) {
        var s = norm(raw)
        return '<tr>' +
          '<td>' + App.esc(s.date || '') + '</td>' +
          '<td>' + App.esc(s.book) + '</td>' +
          '<td>' + modeTag(s.readMode) + '</td>' +
          '<td>' + (s.durationMin != null ? App.esc(s.durationMin) + ' 分' : '—') + '</td>' +
          '<td>' + scoreTag(s.comprehension) + '</td>' +
          '<td>' + scoreTag(s.interest) + '</td>' +
          '<td><a class="link" data-del="' + App.esc(raw.id) + '">删除</a></td>' +
          '</tr>'
      }).join('')
      el.innerHTML = '<table class="tbl"><thead><tr><th>日期</th><th>书名</th><th>方式</th><th>时长</th><th>理解</th><th>兴趣</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="hint">理解度/兴趣度是孩子自评，只记趋势，不评判"读得好不好"。</div>'
      el.querySelectorAll('[data-del]').forEach(function (a) {
        a.addEventListener('click', function () {
          var id = a.getAttribute('data-del')
          list = list.filter(function (x) { return x.id !== id })
          App.demo.write('interest', list)
          render()
        })
      })
    }

    render()
  }
})(window)
