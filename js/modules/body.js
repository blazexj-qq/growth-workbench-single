/**
 * 模块：身心健康（body.js）— v0.5 升级
 * 顶部标题+描述 + 双栏布局（左侧表单 + 右侧图表+列表）+ 必填 * + BMI 除零保护
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  function bmiOf(rec) {
    var h = Number(rec.height)
    var w = Number(rec.weight)
    if (!h || !w) return null
    var m = h / 100
    return Math.round((w / (m * m)) * 10) / 10
  }

  App.pages.body = function (container) {
    var list = App.store.get('body', [])

    var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">身心健康与发育</h2>' +
      '<p class="muted" style="margin:0 0 16px;font-size:13px;">身高体重睡眠运动一目了然，生长曲线趋势记录。BMI 仅作参考，不作医学结论。</p>'

    var formHtml = App.ui.card('记录一次身心数据',
      '<div class="form-row required"><label>日期</label><div class="form-ctrl"><input id="bd-date" class="inp" type="date" value="' + App.todayStr() + '" placeholder="dd/mm/yyyy" /></div></div>' +
      '<div class="form-row"><label>身高(cm)</label><div class="form-ctrl"><input id="bd-h" class="inp" type="number" step="0.1" placeholder="如 140" /></div></div>' +
      '<div class="form-row"><label>体重(kg)</label><div class="form-ctrl"><input id="bd-w" class="inp" type="number" step="0.1" placeholder="如 36" /></div></div>' +
      '<div class="form-row"><label>视力(左)</label><div class="form-ctrl"><input id="bd-vl" class="inp" type="number" step="0.1" placeholder="如 5.0" /></div></div>' +
      '<div class="form-row"><label>视力(右)</label><div class="form-ctrl"><input id="bd-vr" class="inp" type="number" step="0.1" placeholder="如 4.8" /></div></div>' +
      '<div class="form-row"><label>睡眠(小时)</label><div class="form-ctrl"><input id="bd-sleep" class="inp" type="number" step="0.1" placeholder="如 9" /></div></div>' +
      '<div class="form-row"><label>运动(分钟)</label><div class="form-ctrl"><input id="bd-ex" class="inp" type="number" placeholder="如 60" /></div></div>' +
      '<div class="form-row"><label>情绪</label><div class="form-ctrl"><select id="bd-mood" class="inp"><option>好</option><option>中</option><option>差</option></select></div></div>' +
      '<div style="margin-top:12px;">' + App.ui.btn('bd-add', '添加到记录', 'primary') + '</div>' +
      '<div id="bd-msg" class="msg"></div>'
    )

    container.innerHTML = headHtml +
      '<div class="module-page"><div class="form-col">' + formHtml + '</div>' +
      '<div class="list-col"><div id="bd-chart" class="chart-box"></div><div id="bd-list" style="margin-top:16px;"></div></div></div>'

    function renderList() {
      var el = container.querySelector('#bd-list')
      if (!list.length) { el.innerHTML = App.ui.empty('还没有身心记录。'); return }
      var rows = list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 }).map(function (r) {
        var bmi = bmiOf(r)
        return '<tr>' +
          '<td>' + App.esc(r.date) + '</td>' +
          '<td>' + (r.height || '—') + '</td>' +
          '<td>' + (r.weight || '—') + '</td>' +
          '<td>' + (bmi != null ? bmi : '—') + '</td>' +
          '<td>' + (r.visionLeft || '—') + '</td>' +
          '<td>' + (r.visionRight || '—') + '</td>' +
          '<td>' + (r.sleepHours || '—') + '</td>' +
          '<td>' + (r.exerciseMin || '—') + '</td>' +
          '<td>' + App.esc(r.mood || '') + '</td>' +
          '<td><a class="link" data-del="' + App.esc(r.id) + '">删除</a></td>' +
          '</tr>'
      }).join('')
      el.innerHTML = '<table class="tbl"><thead><tr><th>日期</th><th>身高</th><th>体重</th><th>BMI</th><th>视力左</th><th>视力右</th><th>睡眠</th><th>运动</th><th>情绪</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>'
      el.querySelectorAll('[data-del]').forEach(function (a) {
        a.addEventListener('click', function () {
          var id = a.getAttribute('data-del')
          list = list.filter(function (x) { return x.id !== id })
          App.store.set('body', list); renderList(); renderChart()
        })
      })
    }

    function renderChart() {
      var box = container.querySelector('#bd-chart')
      if (typeof echarts === 'undefined') { box.innerHTML = '<div class="empty-tip">图表库未加载，不影响记录。</div>'; return }
      if (list.length < 2) { box.innerHTML = '<div class="empty-tip">录入至少 2 条看生长曲线。</div>'; return }
      var sorted = list.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1 })
      var dates = sorted.map(function (r) { return r.date })
      box.innerHTML = ''
      var chart = echarts.init(box)
      App.charts.push(chart)
      chart.setOption({
        title: { text: '生长曲线（身高 / 体重）', left: 'center', textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0 },
        grid: { bottom: 60, top: 40, left: 45, right: 20 },
        xAxis: { type: 'category', data: dates, boundaryGap: false },
        yAxis: [
          { type: 'value', name: '身高cm', scale: true },
          { type: 'value', name: '体重kg', scale: true }
        ],
        series: [
          { name: '身高', type: 'line', data: sorted.map(function (r) { return Number(r.height) || null }), connectNulls: true },
          { name: '体重', type: 'line', yAxisIndex: 1, data: sorted.map(function (r) { return Number(r.weight) || null }), connectNulls: true }
        ]
      })
    }

    container.querySelector('#bd-add').addEventListener('click', function () {
      if (!container.querySelector('#bd-date').value) {
        var m = container.querySelector('#bd-msg'); m.textContent = '请填日期'; m.className = 'msg err'; return
      }
      list.push({
        id: App.uid(),
        date: container.querySelector('#bd-date').value,
        height: Number(container.querySelector('#bd-h').value) || null,
        weight: Number(container.querySelector('#bd-w').value) || null,
        visionLeft: Number(container.querySelector('#bd-vl').value) || null,
        visionRight: Number(container.querySelector('#bd-vr').value) || null,
        sleepHours: Number(container.querySelector('#bd-sleep').value) || null,
        exerciseMin: Number(container.querySelector('#bd-ex').value) || null,
        mood: container.querySelector('#bd-mood').value
      })
      App.store.set('body', list)
      var m = container.querySelector('#bd-msg'); m.textContent = '已添加 ✓'; m.className = 'msg ok'
      setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 2000)
      renderList(); renderChart()
    })

    renderList(); renderChart()
  }
})(window)