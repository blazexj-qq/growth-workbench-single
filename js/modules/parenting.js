/**
 * 模块：亲子互动（parenting.js）— v0.5 升级
 * 顶部标题+描述 + 近 30 天互动概览汇总卡 + 双栏（左录入 / 右记录表）+ 必填* + 彩色 tag
 * 字段对齐飞书「亲子互动表」。只记客观互动与双方情绪趋势，不做家庭关系/心理诊断。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  var TYPE_TAG = { 深度谈话: 'tg-purple', 游戏: 'tg-pink', 运动: 'tg-ok', 陪伴作业: 'tg-info', 共同出游: 'tg-orange', 其他: 'tg-gray' }

  function typeTag(t) {
    return '<span class="tag ' + (TYPE_TAG[t] || 'tg-gray') + '">' + App.esc(t || '—') + '</span>'
  }
  function moodTag(v) {
    v = Number(v) || 0
    if (v >= 4) return '<span class="tag tg-ok">' + v + '</span>'
    if (v === 3) return '<span class="tag tg-info">' + v + '</span>'
    return '<span class="tag tg-err">' + v + '</span>'
  }

  App.pages.parenting = function (container) {
    var list = App.demo.list('parenting')

    function render() {
      var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">亲子关系管理</h2>' +
        '<p class="muted" style="margin:0 0 16px;font-size:13px;">只记客观互动与双方情绪趋势，不做任何"关系好/差"的评判。</p>'

      // 近 30 天互动概览
      var now = new Date()
      var d30 = new Date(now.getTime() - 30 * 86400000)
      var d30s = d30.getFullYear() + '-' + ('0' + (d30.getMonth() + 1)).slice(-2) + '-' + ('0' + d30.getDate()).slice(-2)
      var sumHtml = '<div class="summary-grid">'
      if (list.length) {
        var r30 = list.filter(function (x) { return x.date && x.date >= d30s })
        var totalMin = r30.reduce(function (a, x) { return a + (Number(x.durationMin) || 0) }, 0)
        var childVals = r30.map(function (x) { return Number(x.childMood) || 0 }).filter(Boolean)
        var parentVals = r30.map(function (x) { return Number(x.parentMood) || 0 }).filter(Boolean)
        var childAvg = childVals.length ? (childVals.reduce(function (a, b) { return a + b }, 0) / childVals.length).toFixed(1) : '—'
        var parentAvg = parentVals.length ? (parentVals.reduce(function (a, b) { return a + b }, 0) / parentVals.length).toFixed(1) : '—'
        sumHtml +=
          '<div class="summary-card"><div class="sum-name">近 30 天互动</div><div class="sum-value">' + r30.length + '<span class="unit"> 次</span></div><div class="sum-tag">' + (r30.length >= 8 ? '<span class="tag tg-ok">密度不错</span>' : '<span class="tag tg-warn tg-orange">可加码</span>') + '</div></div>' +
          '<div class="summary-card"><div class="sum-name">累计时长</div><div class="sum-value">' + totalMin + '<span class="unit"> min</span></div><div class="sum-tag"></div></div>' +
          '<div class="summary-card"><div class="sum-name">孩子情绪均值</div><div class="sum-value">' + childAvg + '</div><div class="sum-tag">' + (childAvg === '—' ? '' : moodTag(childAvg)) + '</div></div>' +
          '<div class="summary-card"><div class="sum-name">家长情绪均值</div><div class="sum-value">' + parentAvg + '</div><div class="sum-tag">' + (parentAvg === '—' ? '' : moodTag(parentAvg)) + '</div></div>'
      } else {
        sumHtml += '<div class="hint" style="grid-column:1/-1;">还没有亲子记录，记录后会显示近 30 天互动概览。</div>'
      }
      sumHtml += '</div>'

      // 左栏表单
      var formHtml = App.ui.card('记一次亲子互动',
        '<div class="form-row required"><label>日期</label><div class="form-ctrl"><input id="pt-date" class="inp" type="date" value="' + App.todayStr() + '" placeholder="dd/mm/yyyy" /></div></div>' +
        '<div class="form-row"><label>活动类型</label><div class="form-ctrl"><select id="pt-type" class="inp">' +
        ['深度谈话', '游戏', '运动', '陪伴作业', '共同出游', '其他'].map(function (x) { return '<option value="' + x + '">' + x + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>时长(分钟)</label><div class="form-ctrl"><input id="pt-dur" class="inp" type="number" min="0" placeholder="可选" /></div></div>' +
        '<div class="form-row"><label>孩子情绪(1-5)</label><div class="form-ctrl"><select id="pt-child" class="inp">' +
        [1, 2, 3, 4, 5].map(function (v) { return '<option value="' + v + '">' + v + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>家长情绪(1-5)</label><div class="form-ctrl"><select id="pt-parent" class="inp">' +
        [1, 2, 3, 4, 5].map(function (v) { return '<option value="' + v + '">' + v + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>沟通要点</label><div class="form-ctrl"><input id="pt-key" class="inp" placeholder="聊了什么、发现什么（可选）" /></div></div>' +
        '<div class="form-row"><label>备注</label><div class="form-ctrl"><input id="pt-note" class="inp" placeholder="可选" /></div></div>' +
        '<div style="margin-top:12px;">' + App.ui.btn('pt-add', '保存这次互动', 'primary') + '</div>' +
        '<div id="pt-msg" class="msg"></div>'
      )

      var pageHtml = '<div class="module-page"><div class="form-col">' + formHtml + '</div><div class="list-col"><div id="pt-list"></div></div></div>'

      container.innerHTML = headHtml + sumHtml + pageHtml
      bindAdd()
      renderList()
    }

    function bindAdd() {
      var btn = container.querySelector('#pt-add')
      if (!btn) return
      btn.addEventListener('click', function () {
        var date = container.querySelector('#pt-date').value
        if (!date) { var m = container.querySelector('#pt-msg'); m.textContent = '请选日期'; m.className = 'msg err'; return }
        var s = {
          id: App.uid(), date: date,
          type: container.querySelector('#pt-type').value,
          durationMin: Number(container.querySelector('#pt-dur').value) || null,
          childMood: Number(container.querySelector('#pt-child').value) || 3,
          parentMood: Number(container.querySelector('#pt-parent').value) || 3,
          keyPoint: container.querySelector('#pt-key').value.trim(),
          note: container.querySelector('#pt-note').value.trim()
        }
        list.push(s)
        App.demo.write('parenting', list)
        var m = container.querySelector('#pt-msg'); m.textContent = '已保存 ✓'; m.className = 'msg ok'
        setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 2000)
        render()
      })
    }

    function renderList() {
      var el = container.querySelector('#pt-list')
      if (!el) return
      if (!list.length) { el.innerHTML = App.ui.empty('还没有亲子记录，先在左侧记一次今天的相处。'); return }
      var rows = list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 }).map(function (s) {
        return '<tr>' +
          '<td>' + App.esc(s.date || '') + '</td>' +
          '<td>' + typeTag(s.type) + '</td>' +
          '<td>' + (s.durationMin ? App.esc(s.durationMin) + ' 分钟' : '—') + '</td>' +
          '<td>' + moodTag(s.childMood) + '</td>' +
          '<td>' + moodTag(s.parentMood) + '</td>' +
          '<td>' + App.esc(s.keyPoint || '—') + '</td>' +
          '<td><a class="link" data-del="' + App.esc(s.id) + '">删除</a></td>' +
          '</tr>'
      }).join('')
      el.innerHTML = '<table class="tbl"><thead><tr><th>日期</th><th>类型</th><th>时长</th><th>孩子情绪</th><th>家长情绪</th><th>沟通要点</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="hint">情绪 1 低落 → 5 愉悦。只看趋势，别拿单次下结论。</div>'
      el.querySelectorAll('[data-del]').forEach(function (a) {
        a.addEventListener('click', function () {
          var id = a.getAttribute('data-del')
          list = list.filter(function (x) { return x.id !== id })
          App.demo.write('parenting', list)
          render()
        })
      })
    }

    render()
  }
})(window)
