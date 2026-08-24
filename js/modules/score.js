/**
 * 模块：成绩管理（score.js）— v0.5 升级
 * 顶部标题+描述 + 3 科目汇总卡 + Tab 切换（录入与记录/趋势分析）+ 双栏布局 + 必填 * + 彩色科目 tag
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  function rate(s) {
    var score = Number(s.score)
    var full = Number(s.fullScore)
    if (!score || !full) return null
    return Math.round((score / full) * 1000) / 10
  }

  function tgOf(sub) {
    return { '语文': 'tg-yuwen', '数学': 'tg-shuxue', '英语': 'tg-yingyu', '科学': 'tg-kexue', '道法': 'tg-daofa' }[sub] || 'tg-qita'
  }

  var SUBJECTS = ['语文', '数学', '英语', '科学', '道法', '其他']

  App.pages.score = function (container) {
    var list = App.store.get('scores', [])
    var tab = 'record'

    function render() {
      // 顶部
      var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">成绩管理</h2>' +
        '<p class="muted" style="margin:0 0 16px;font-size:13px;">本地优先存储（刷新不丢）；开启云同步后数据写入飞书多维表格（境内，得分率=得分÷满分）。</p>'

      // 各科目最高得分率汇总
      var bySub = {}
      list.forEach(function (s) {
        var r = rate(s)
        if (r == null) return
        if (!bySub[s.subject] || bySub[s.subject].best < r) bySub[s.subject] = { best: r, n: (bySub[s.subject] ? bySub[s.subject].n + 1 : 1) }
        else bySub[s.subject].n++
      })
      var sumHtml = '<div class="summary-grid">'
      var hasAny = false
      SUBJECTS.forEach(function (sub) {
        var d = bySub[sub]
        if (!d) return
        hasAny = true
        var bad = d.best < 90
        sumHtml += '<div class="summary-card"><div class="sum-name">' + App.esc(sub) + '</div>' +
          '<div class="sum-value' + (bad ? ' bad' : '') + '">' + d.best.toFixed(1) + '%</div>' +
          '<div class="sum-tag"><span class="tag ' + tgOf(sub) + '">' + d.n + ' 次考试</span></div></div>'
      })
      if (!hasAny) sumHtml += '<div class="hint" style="grid-column:1/-1;">还没有成绩，录入后会显示各科目汇总。</div>'
      sumHtml += '</div>'

      // Tab
      var tabsHtml = '<div class="segmented">' +
        '<span class="' + (tab === 'record' ? 'on' : '') + '" data-tab="record">录入与记录</span>' +
        '<span class="' + (tab === 'trend' ? 'on' : '') + '" data-tab="trend">趋势分析</span>' +
        '</div>'

      // 表单
      var formHtml = App.ui.card('录入一次考试',
        '<div class="form-row required"><label>科目</label><div class="form-ctrl"><select id="sc-subject" class="inp">' +
          SUBJECTS.map(function (x) { return '<option value="' + x + '">' + x + '</option>' }).join('') +
        '</select></div></div>' +
        '<div class="form-row required"><label>考试名称</label><div class="form-ctrl"><input id="sc-exam" class="inp" placeholder="如 单元测 / 期中 / 期末" /></div></div>' +
        '<div class="form-row required"><label>日期</label><div class="form-ctrl"><input id="sc-date" class="inp" type="date" placeholder="dd/mm/yyyy" value="' + App.todayStr() + '" /></div></div>' +
        '<div class="form-row required"><label>得分</label><div class="form-ctrl"><input id="sc-score" class="inp" type="number" step="0.5" placeholder="如 92" /></div></div>' +
        '<div class="form-row"><label>满分</label><div class="form-ctrl"><input id="sc-full" class="inp" type="number" step="0.5" value="100" /></div></div>' +
        '<div class="form-row"><label>班级排名</label><div class="form-ctrl"><input id="sc-cr" class="inp" type="number" placeholder="可选（仅自己看）" /></div></div>' +
        '<div class="form-row"><label>年级排名</label><div class="form-ctrl"><input id="sc-gr" class="inp" type="number" placeholder="可选" /></div></div>' +
        '<div class="form-row"><label>备注</label><div class="form-ctrl"><input id="sc-note" class="inp" placeholder="失分原因等（可选）" /></div></div>' +
        '<div style="margin-top:12px;">' + App.ui.btn('sc-add', '添加到记录', 'primary') + '</div>' +
        '<div id="sc-msg" class="msg"></div>'
      )

      var pageHtml = '<div class="module-page">' +
        '<div class="form-col">' + formHtml + '</div>' +
        '<div class="list-col">' +
        '<div id="sc-list"></div>' +
        (tab === 'trend' ? '<div id="sc-chart" class="chart-box" style="margin-top:16px;"></div>' : '') +
        '</div></div>'

      container.innerHTML = headHtml + sumHtml + tabsHtml + pageHtml

      bindTabs()
      bindAdd()
      renderList()
      if (tab === 'trend') renderChart()
    }

    function bindTabs() {
      var tabs = container.querySelector('.segmented')
      if (!tabs) return
      tabs.addEventListener('click', function (e) {
        var t = e.target.closest('span[data-tab]')
        if (!t) return
        tab = t.getAttribute('data-tab')
        render()
      })
    }

    function bindAdd() {
      var btn = container.querySelector('#sc-add')
      if (!btn) return
      btn.addEventListener('click', function () {
        var score = Number(container.querySelector('#sc-score').value)
        var date = container.querySelector('#sc-date').value
        if (!score || !date) {
          var m = container.querySelector('#sc-msg'); m.textContent = '请填得分和日期'; m.className = 'msg err'; return
        }
        list.push({
          id: App.uid(),
          examName: container.querySelector('#sc-exam').value.trim() || '未命名',
          date: date,
          subject: container.querySelector('#sc-subject').value,
          score: score,
          fullScore: Number(container.querySelector('#sc-full').value) || 100,
          classRank: Number(container.querySelector('#sc-cr').value) || null,
          gradeRank: Number(container.querySelector('#sc-gr').value) || null,
          note: container.querySelector('#sc-note').value.trim()
        })
        App.store.set('scores', list)
        var m = container.querySelector('#sc-msg'); m.textContent = '已添加 ✓'; m.className = 'msg ok'
        setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 2000)
        render()
      })
    }

    function renderList() {
      var el = container.querySelector('#sc-list')
      if (!el) return
      if (!list.length) { el.innerHTML = App.ui.empty('还没有成绩记录，先在左侧录入一条。'); return }
      var rows = list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 }).map(function (s) {
        var r = rate(s)
        return '<tr>' +
          '<td>' + App.esc(s.date || '') + '</td>' +
          '<td><span class="tag ' + tgOf(s.subject) + '">' + App.esc(s.subject || '') + '</span></td>' +
          '<td>' + App.esc(s.examName || '') + '</td>' +
          '<td>' + App.esc(s.score) + '/' + App.esc(s.fullScore) + '</td>' +
          '<td>' + (r != null ? r + '%' : '—') + '</td>' +
          '<td>' + (s.classRank ? App.esc(s.classRank) : '—') + '</td>' +
          '<td>' + (s.gradeRank ? App.esc(s.gradeRank) : '—') + '</td>' +
          '<td><a class="link" data-del="' + App.esc(s.id) + '">删除</a></td>' +
          '</tr>'
      }).join('')
      el.innerHTML = '<table class="tbl"><thead><tr><th>日期</th><th>科目</th><th>考试</th><th>得分</th><th>得分率</th><th>班排</th><th>年排</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>'
      el.querySelectorAll('[data-del]').forEach(function (a) {
        a.addEventListener('click', function () {
          var id = a.getAttribute('data-del')
          list = list.filter(function (x) { return x.id !== id })
          App.store.set('scores', list)
          render()
        })
      })
    }

    function renderChart() {
      var box = container.querySelector('#sc-chart')
      if (!box) return
      if (typeof echarts === 'undefined') { box.innerHTML = '<div class="empty-tip">图表库未加载，不影响记录。</div>'; return }
      if (list.length < 2) { box.innerHTML = '<div class="empty-tip">录入至少 2 条即可看趋势。</div>'; return }
      var bySubject = {}
      list.forEach(function (s) { (bySubject[s.subject] = bySubject[s.subject] || []).push(s) })
      var dates = []
      list.forEach(function (s) { if (dates.indexOf(s.date) < 0) dates.push(s.date) })
      dates.sort()
      var series = Object.keys(bySubject).map(function (sub) {
        var m = {}
        bySubject[sub].forEach(function (s) { m[s.date] = rate(s) })
        return { name: sub, type: 'line', data: dates.map(function (d) { return m[d] == null ? null : m[d] }), connectNulls: true }
      })
      box.innerHTML = ''
      var chart = echarts.init(box)
      App.charts.push(chart)
      chart.setOption({
        title: { text: '得分率趋势（按日期）', left: 'center', textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, type: 'scroll' },
        grid: { bottom: 60, top: 40, left: 40, right: 20 },
        xAxis: { type: 'category', data: dates, boundaryGap: false },
        yAxis: { type: 'value', name: '得分率%', max: 100 },
        series: series
      })
    }

    render()
  }
})(window)