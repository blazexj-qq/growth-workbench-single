/**
 * 模块：职业体验（experience.js）— v0.5 升级
 * 顶部标题+描述 + 体验概览汇总卡 + 双栏（左录入 / 右记录表）+ 必填* + 彩色 tag
 * 字段对齐飞书「职业体验表」：date / title / type / location / duration / content / harvest / rating / status / note
 * 红线：参观、访谈、夏令营等体验，留痕为主，绝不据此评估能力。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  var TYPE_TAG = { 参观: 'tg-cyan', 访谈: 'tg-purple', 夏令营: 'tg-orange', 课程: 'tg-info', 实习: 'tg-ok', 志愿服务: 'tg-pink', 其他: 'tg-gray' }
  var STATUS_TAG = { 已完成: 'tg-ok', 报名中: 'tg-info', 想尝试: 'tg-orange', 暂缓: 'tg-gray' }

  function typeTag(t) {
    return '<span class="tag ' + (TYPE_TAG[t] || 'tg-gray') + '">' + App.esc(t || '—') + '</span>'
  }
  function statusTag(s) {
    return '<span class="tag ' + (STATUS_TAG[s] || 'tg-gray') + '">' + App.esc(s || '—') + '</span>'
  }
  function stars(n) {
    n = Number(n) || 0
    n = Math.max(0, Math.min(5, n))
    return '<span style="color:#f59e0b;letter-spacing:1px;">' + '★'.repeat(n) + '☆'.repeat(5 - n) + '</span>'
  }

  App.pages.experience = function (container) {
    var list = App.demo.list('experience')

    function render() {
      var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">职业体验库</h2>' +
        '<p class="muted" style="margin:0 0 16px;font-size:13px;">记录走过的路、看过的世界，不评估能力。</p>'

      // 体验概览汇总卡
      var sumHtml = '<div class="summary-grid">'
      if (list.length) {
        var done = list.filter(function (x) { return x.status === '已完成' }).length
        var plan = list.filter(function (x) { return x.status === '报名中' || x.status === '想尝试' }).length
        var rated = list.map(function (x) { return Number(x.rating) || 0 }).filter(function (v) { return v > 0 })
        var avg = rated.length ? (rated.reduce(function (a, b) { return a + b }, 0) / rated.length).toFixed(1) : '—'
        sumHtml +=
          '<div class="summary-card"><div class="sum-name">体验总数</div><div class="sum-value">' + list.length + '<span class="unit"> 次</span></div><div class="sum-tag"></div></div>' +
          '<div class="summary-card"><div class="sum-name">已完成</div><div class="sum-value">' + done + '<span class="unit"> 次</span></div><div class="sum-tag"><span class="tag tg-ok">有留痕</span></div></div>' +
          '<div class="summary-card"><div class="sum-name">计划中</div><div class="sum-value">' + plan + '<span class="unit"> 次</span></div><div class="sum-tag"><span class="tag tg-info">待安排</span></div></div>' +
          '<div class="summary-card"><div class="sum-name">平均喜爱度</div><div class="sum-value">' + avg + '</div><div class="sum-tag">' + (avg === '—' ? '' : stars(avg)) + '</div></div>'
      } else {
        sumHtml += '<div class="hint" style="grid-column:1/-1;">还没有体验记录，记录后会显示体验概览。</div>'
      }
      sumHtml += '</div>'

      // 左栏表单
      var formHtml = App.ui.card('记一次体验（参观 / 访谈 / 实习 / 课程）',
        '<div class="form-row required"><label>日期</label><div class="form-ctrl"><input id="ex-date" class="inp" type="date" value="' + App.todayStr() + '" placeholder="dd/mm/yyyy" /></div></div>' +
        '<div class="form-row required"><label>体验主题</label><div class="form-ctrl"><input id="ex-title" class="inp" placeholder="如 参观消防站 / 访谈医生" /></div></div>' +
        '<div class="form-row"><label>类型</label><div class="form-ctrl"><select id="ex-type" class="inp">' +
        ['参观', '访谈', '夏令营', '课程', '实习', '志愿服务', '其他'].map(function (x) { return '<option value="' + x + '">' + x + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>地点/单位</label><div class="form-ctrl"><input id="ex-location" class="inp" placeholder="如 南京消防支队 / 中山医院" /></div></div>' +
        '<div class="form-row"><label>时长</label><div class="form-ctrl"><input id="ex-duration" class="inp" placeholder="如 半天 / 2 小时" /></div></div>' +
        '<div class="form-row"><label>做了什么</label><div class="form-ctrl"><input id="ex-content" class="inp" placeholder="看到了什么、做了什么（可选）" /></div></div>' +
        '<div class="form-row"><label>收获</label><div class="form-ctrl"><input id="ex-harvest" class="inp" placeholder="孩子的感受、新发现（可选）" /></div></div>' +
        '<div class="form-row"><label>喜爱度(1-5)</label><div class="form-ctrl"><select id="ex-rating" class="inp">' +
        [1, 2, 3, 4, 5].map(function (v) { return '<option value="' + v + '"' + (v === 3 ? ' selected' : '') + '>' + v + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>状态</label><div class="form-ctrl"><select id="ex-status" class="inp">' +
        ['已完成', '报名中', '想尝试', '暂缓'].map(function (x) { return '<option value="' + x + '">' + x + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>备注</label><div class="form-ctrl"><input id="ex-note" class="inp" placeholder="可选" /></div></div>' +
        '<div style="margin-top:12px;">' + App.ui.btn('ex-add', '保存体验', 'primary') + '</div>' +
        '<div id="ex-msg" class="msg"></div>'
      )

      var pageHtml = '<div class="module-page"><div class="form-col">' + formHtml + '</div><div class="list-col"><div id="ex-list"></div></div></div>'

      container.innerHTML = headHtml + sumHtml + pageHtml
      bindAdd()
      renderList()
    }

    function bindAdd() {
      var btn = container.querySelector('#ex-add')
      if (!btn) return
      btn.addEventListener('click', function () {
        var date = container.querySelector('#ex-date').value
        var title = container.querySelector('#ex-title').value.trim()
        if (!date || !title) { var m = container.querySelector('#ex-msg'); m.textContent = '请填日期和体验主题'; m.className = 'msg err'; return }
        var s = {
          id: App.uid(), date: date, title: title,
          type: container.querySelector('#ex-type').value,
          location: container.querySelector('#ex-location').value.trim(),
          duration: container.querySelector('#ex-duration').value.trim(),
          content: container.querySelector('#ex-content').value.trim(),
          harvest: container.querySelector('#ex-harvest').value.trim(),
          rating: Number(container.querySelector('#ex-rating').value) || 0,
          status: container.querySelector('#ex-status').value,
          note: container.querySelector('#ex-note').value.trim()
        }
        list.push(s)
        App.demo.write('experience', list)
        var m = container.querySelector('#ex-msg'); m.textContent = '已保存 ✓'; m.className = 'msg ok'
        setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 2000)
        render()
      })
    }

    function renderList() {
      var el = container.querySelector('#ex-list')
      if (!el) return
      if (!list.length) { el.innerHTML = App.ui.empty('还没有体验记录，先在左侧记一次走过的世界。'); return }
      var rows = list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 }).map(function (s) {
        return '<tr>' +
          '<td>' + App.esc(s.date || '') + '</td>' +
          '<td>' + App.esc(s.title || '') + '</td>' +
          '<td>' + typeTag(s.type) + '</td>' +
          '<td>' + App.esc(s.location || '—') + '</td>' +
          '<td>' + App.esc(s.duration || '—') + '</td>' +
          '<td>' + App.esc(s.harvest || '—') + '</td>' +
          '<td>' + stars(s.rating) + '</td>' +
          '<td>' + statusTag(s.status) + '</td>' +
          '<td><a class="link" data-del="' + App.esc(s.id) + '">删除</a></td>' +
          '</tr>'
      }).join('')
      el.innerHTML = '<table class="tbl"><thead><tr><th>日期</th><th>主题</th><th>类型</th><th>地点</th><th>时长</th><th>收获</th><th>喜爱度</th><th>状态</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="hint">体验是留痕，不是简历；别拿次数和评级给孩子施压。</div>'
      el.querySelectorAll('[data-del]').forEach(function (a) {
        a.addEventListener('click', function () {
          var id = a.getAttribute('data-del')
          list = list.filter(function (x) { return x.id !== id })
          App.demo.write('experience', list)
          render()
        })
      })
    }

    render()
  }
})(window)
