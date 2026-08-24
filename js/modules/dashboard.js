/**
 * 模块：成长驾驶舱（dashboard.js）— v0.5 升级为 React 风格
 * 布局 = 欢迎卡（青绿淡底+CTA）+ 警示条 + 4 统计卡（睡眠/运动/心情/记录日期）+ 3 区块（多维预警/临近日节点/成长曲线）+ 数据保全
 * 底部保留紧凑模块网格（按分类 tab）作为模块入口
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  var MODULES = [
    { id: 'home', icon: '🏠', iconAnt: 'dashboard', name: '成长驾驶舱', desc: '首页综合视图，所有重要数据一眼可见。', cat: '概览' },
    { id: 'score', icon: '📊', iconAnt: 'line-chart', name: '成绩管理', desc: '校内考试、班级/年级排名趋势，错题管理。', cat: '学业' },
    { id: 'ability', icon: '💡', iconAnt: 'fund', name: '学习能力画像', desc: '注意力、记忆力、思维风格等可训练能力的趋势评估。', cat: '学业' },
    { id: 'goal', icon: '⭐', iconAnt: 'aim', name: '目标管理', desc: '学年/学期目标分解，里程碑锁定，盯着走。', cat: '学业' },
    { id: 'health', icon: '❤️', iconAnt: 'heart', name: '身心健康与发育', desc: '睡眠/运动/情绪、生长曲线、骨龄/体质/青春发动。', cat: '身心健康' },
    { id: 'nutrition', icon: '🥗', iconAnt: 'medicine-box', name: '营养与膳食管理', desc: '膳食记录、营养结构评估，与发育联动。', cat: '身心健康' },
    { id: 'parenting', icon: '👨‍👩‍👧', iconAnt: 'team', name: '亲子关系管理', desc: '亲子时光、家庭会议、关系健康度与沟通建议。', cat: '兴趣与亲子' },
    { id: 'interest', icon: '📚', iconAnt: 'star', name: '兴趣阅读', desc: '读了什么/多久/兴趣如何，接读伴。', cat: '兴趣与亲子' },
    { id: 'career', icon: '🧭', iconAnt: 'bulb', name: '生涯启蒙探索', desc: '记录兴趣萌芽与职业好奇，只记不评。', cat: '兴趣与亲子' },
    { id: 'experience', icon: '🎮', iconAnt: 'solution', name: '职业体验库', desc: '参观/访谈/夏令营等体验留痕与收获。', cat: '兴趣与亲子' },
    { id: 'school', icon: '🎯', iconAnt: 'compass', name: '升学规划管理', desc: '小升初+中考+高考多周期时间轴、节点红线、政策雷达。', cat: '升学规划' },
    { id: 'admission', icon: '📞', iconAnt: 'rocket', name: '中高考升学助手', desc: '多 Agent 模考：估分/换算/概率/志愿/访问。', cat: '升学规划' },
    { id: 'habit', icon: '⏰', iconAnt: 'calendar', name: '时间管理与习惯', desc: '日/周/月打卡，培养自驱力与节律。', cat: '成长与规划' },
    { id: 'weekly', icon: '📅', iconAnt: 'file-text', name: '成长周报·月报', desc: '自动汇总周/月数据，趋势一目了然。', cat: '成长与规划' },
    { id: 'comprehensive', icon: '🌳', iconAnt: 'trophy', name: '五育综评对齐', desc: '德智体美劳活动留痕，对照综评口径查缺补漏。', cat: '成长与规划' },
    { id: 'homeSchool', icon: '🏫', iconAnt: 'book', name: '家校沟通台账', desc: '老师通知/作业量/表扬/提醒，沟通密度留痕。', cat: '成长与规划' },
    { id: 'archive', icon: '📁', iconAnt: 'idcard', name: '成长档案', desc: '所有记录沉淀的「孩子成长档案」。', cat: '档案与安全' },
    { id: 'sync', icon: '💾', iconAnt: 'safety-certificate', name: '同步备份', desc: '多端数据加密同步，本地/云端双备份。', cat: '档案与安全' }
  ]

  var CATS = ['全部', '学业', '身心健康', '兴趣与亲子', '升学规划', '成长与规划', '档案与安全']

  // 南京规则：9/1 为学年起点；6岁入一年级
  function calcGrade(birthday, gradeOverride) {
    if (gradeOverride) return String(gradeOverride)
    if (!birthday) return '—'
    var b = new Date(birthday)
    if (isNaN(b.getTime())) return '—'
    var now = new Date()
    var sys = new Date(now.getFullYear(), 8, 1)
    if (now < sys) sys = new Date(now.getFullYear() - 1, 8, 1)
    var g = sys.getFullYear() - b.getFullYear() - 5
    if (g < 1) return '学龄前'
    if (g > 6) return '六年级以上'
    return ['—', '一', '二', '三', '四', '五', '六'][g] + '年级'
  }

  function moodLevel(m) {
    if (m === '好') return { tag: 'tag-ok-soft', label: '好' }
    if (m === '中') return { tag: 'tag-info-soft', label: '中' }
    if (m === '差') return { tag: 'tag-bad-soft', label: '差' }
    return { tag: '', label: '—' }
  }

  App.pages.dashboard = function (container) {
    var activeCat = '全部' // 模块网格当前分类 tab（必须在此声明，闭包 renderGrid/tab 共用）
    var profile = App.store.get('profile', {})
    var body = App.store.get('body', [])
    var upcoming = App.store.get('upcoming', [])

    var kidName = profile.name || '小宝'
    var kidGrade = calcGrade(profile.birthday, profile.gradeOverride)
    var school = profile.school || ''
    var alerts = []
    try { alerts = (App.alerts && App.alerts.list) ? App.alerts.list() : [] } catch (e) { console.error('[dashboard] alerts.list error', e) }

    var lastBody = body.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 })[0]
    var bodyGap = lastBody ? App.daysBetween(App.todayStr(), lastBody.date) : null

    // 4 统计卡数据
    var sleepStr = (lastBody && lastBody.sleepHours != null) ? Number(lastBody.sleepHours).toFixed(1) : '—'
    var sleepUnit = (lastBody && lastBody.sleepHours != null) ? ' h' : ''
    var sleepTag = ''
    if (lastBody && lastBody.sleepHours != null) {
      sleepTag = Number(lastBody.sleepHours) >= 9 ? '<span class="tag tag-ok-soft">达标</span>' : '<span class="tag tag-warn-soft">待改善</span>'
    }
    var exStr = (lastBody && lastBody.exerciseMin != null) ? String(lastBody.exerciseMin) : '—'
    var exUnit = (lastBody && lastBody.exerciseMin != null) ? ' min' : ''
    var exTag = ''
    if (lastBody && lastBody.exerciseMin != null) {
      exTag = Number(lastBody.exerciseMin) >= 60 ? '<span class="tag tag-ok-soft">达成</span>' : '<span class="tag tag-warn-soft">待改善</span>'
    }
    var mood = moodLevel(lastBody && lastBody.mood)
    var lastDateStr = lastBody ? lastBody.date : '—'
    var dateTag = bodyGap != null && bodyGap >= 7 ? '<span class="tag tag-warn-soft">待改善</span>'
      : (lastBody ? '<span class="tag tag-ok-soft">最新</span>' : '')
    var dateHint = bodyGap != null ? '已 ' + bodyGap + ' 天未更新' : '尚无记录'

    // 顶部：欢迎卡
    var welcomeHtml = '<div class="welcome-card">' +
      '<h2>早上好，' + App.esc(kidName) + ' 👋</h2>' +
      '<p>今天是成长驾驶舱 · 一眼看清状态、节点、预警与趋势。先关注这 ' + alerts.length + ' 条重点提醒。</p>' +
      '<div class="actions">' +
      '<a class="btn primary" data-go="admission">查看升学时间轴</a>' +
      '<a class="btn" data-go="health">身心健康</a>' +
      '</div></div>'

    // 警示条
    var stripHtml = ''
    if (bodyGap != null && bodyGap >= 7) {
      stripHtml = '<div class="alert-strip"><div class="text">⚠ 最近一次身心记录是 <b>' + bodyGap + ' 天前</b>，已 ' + bodyGap + ' 天未更新。建议补录一条。</div>' +
        '<a class="btn primary" data-go="health">去补录</a></div>'
    }

    // 4 统计卡
    var statHtml = '<div class="stat-card-grid">' +
      '<div class="stat-card-modern"><div class="label">睡眠(最近)</div><div><span class="value">' + sleepStr + '</span><span class="unit">' + sleepUnit + '</span></div>' + sleepTag + '<div class="hint">建议 ≥ 8h</div></div>' +
      '<div class="stat-card-modern"><div class="label">运动(最近)</div><div><span class="value">' + exStr + '</span><span class="unit">' + exUnit + '</span></div>' + exTag + '<div class="hint">建议 ≥ 60min</div></div>' +
      '<div class="stat-card-modern"><div class="label">心情(最近)</div><div class="value small">' + App.esc(mood.label) + '</div>' + (mood.tag ? '<span class="tag ' + mood.tag + '">' + App.esc(mood.label) + '</span>' : '') + '<div class="hint">好/中/差</div></div>' +
      '<div class="stat-card-modern"><div class="label">最近记录日期</div><div class="value small">' + App.esc(lastDateStr) + '</div>' + dateTag + '<div class="hint">' + dateHint + '</div></div>' +
      '</div>'

    // 3 区块：预警 / 临近日节点 / 成长曲线
    var alertsHtml = '<div class="dash-block">' +
      '<div class="dash-block-head"><span class="dash-block-title">多维预警摘要</span>' +
      '<span class="dash-block-count">' + alerts.length + ' 重点</span></div>' +
      (alerts.length
        ? alerts.slice(0, 4).map(function (a) {
          return '<div class="alert-row"><div class="row-head"><span class="tag ' + (a.level === 'urgent' ? 'tag-bad-soft' : 'tag-warn-soft') + '">' + (a.level === 'urgent' ? '重点' : '提示') + '</span><b>' + App.esc(a.title) + '</b></div><div class="row-desc">' + App.esc(a.desc) + '</div></div>'
        }).join('')
        : '<div class="hint">暂无预警 👍</div>') +
      '</div>'

    var nodesAll = upcoming.map(function (u) {
      var d = App.daysLeft(u.date)
      return { name: u.name, date: u.date, days: d }
    }).filter(function (x) { return x.days != null && x.days >= 0 })
      .sort(function (a, b) { return a.days - b.days })
      .slice(0, 5)
    var nodesHtml = '<div class="dash-block">' +
      '<div class="dash-block-head"><span class="dash-block-title">临近日节点倒计时</span>' +
      '<span class="dash-block-count">' + nodesAll.length + ' 个</span></div>' +
      (nodesAll.length
        ? nodesAll.map(function (u) {
          return '<div class="node-row"><div class="node-name">' + App.esc(u.name) + ' <span class="muted">· ' + App.esc(u.date) + '</span></div><div class="node-days ' + (u.days <= 7 ? 'urgent' : '') + '">' + u.days + ' 天</div></div>'
        }).join('')
        : '<div class="hint">去「升学」添加节点</div>') +
      '</div>'

    var growthHtml = '<div class="dash-block">' +
      '<div class="dash-block-head"><span class="dash-block-title">成长曲线（身高/体重）</span>' +
      '<span class="dash-block-count">ECharts</span></div>' +
      '<div id="dash-growth" class="chart-box" style="flex:1;height:220px;"></div>' +
      '</div>'

    var blocksHtml = '<div class="dash-blocks">' + alertsHtml + nodesHtml + growthHtml + '</div>'

    // 数据保全
    var backupHtml = App.ui.card('数据保全（备份/恢复）',
      '数据只存在本机浏览器。建议定期点「导出备份」存个文件（JSON），换设备时可导入恢复。备份不含任何示例数据。' +
      '<div style="margin-top:12px;">' + App.ui.btn('bk-export', '导出备份', 'primary') + ' ' +
      '<input id="bk-import" type="file" accept="application/json" style="display:none" />' +
      App.ui.btn('bk-import-btn', '导入恢复', '') + '</div>' +
      '<div id="bk-msg" class="msg"></div>'
    )

    // 底部：紧凑模块网格（按分类 tab）
    var tabsHtml = '<div style="margin-top:24px;"><div class="card-title">模块入口（按分类）</div>'
    tabsHtml += '<div class="grid-tabs" id="dash-tabs">'
    CATS.forEach(function (c) {
      tabsHtml += '<span class="grid-tab' + (c === activeCat ? ' on' : '') + '" data-cat="' + App.esc(c) + '">' + App.esc(c) + '</span>'
    })
    tabsHtml += '</div><div class="module-grid" id="dash-grid"></div></div>'

    container.innerHTML = welcomeHtml + stripHtml + statHtml + blocksHtml + backupHtml + tabsHtml

    renderGrid()

    // 跳转按钮
    container.querySelectorAll('[data-go]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault()
        App.go(el.getAttribute('data-go'))
      })
    })

    // tab 切换
    var tabs = container.querySelector('#dash-tabs')
    if (tabs) tabs.addEventListener('click', function (e) {
      var t = e.target.closest('.grid-tab')
      if (!t) return
      activeCat = t.getAttribute('data-cat')
      tabs.querySelectorAll('.grid-tab').forEach(function (x) { x.classList.toggle('on', x === t) })
      renderGrid()
    })

    // 备份按钮
    var exp = container.querySelector('#bk-export')
    if (exp) exp.addEventListener('click', function () {
      var n = App.backup.exportData()
      var m = container.querySelector('#bk-msg'); m.textContent = '已导出 ' + n + ' 项数据 ✓'; m.className = 'msg ok'
      setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 3000)
    })
    var impBtn = container.querySelector('#bk-import-btn')
    var impFile = container.querySelector('#bk-import')
    if (impBtn && impFile) {
      impBtn.addEventListener('click', function () { impFile.click() })
      impFile.addEventListener('change', function () {
        var f = impFile.files && impFile.files[0]
        if (!f) return
        App.backup.importData(f, function (err, n) {
          var m = container.querySelector('#bk-msg')
          if (err) { m.textContent = '导入失败：' + err.message; m.className = 'msg err' }
          else { m.textContent = '已导入 ' + n + ' 个数据项 ✓'; m.className = 'msg ok' }
          setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 3000)
        })
      })
    }

    // 成长曲线 ECharts
    var gbox = container.querySelector('#dash-growth')
    if (gbox && typeof echarts !== 'undefined' && body.length >= 2) {
      var sorted = body.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1 })
      var dates = [], hs = [], ws = []
      sorted.forEach(function (r) {
        dates.push(r.date)
        hs.push(r.height ? Number(r.height) : null)
        ws.push(r.weight ? Number(r.weight) : null)
      })
      var chart = echarts.init(gbox)
      App.charts.push(chart)
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, textStyle: { fontSize: 11 } },
        grid: { top: 20, bottom: 50, left: 50, right: 50 },
        xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10 } },
        yAxis: [
          { type: 'value', name: '身高cm', position: 'left', axisLabel: { fontSize: 10 } },
          { type: 'value', name: '体重kg', position: 'right', axisLabel: { fontSize: 10 } }
        ],
        series: [
          { name: '身高(cm)', type: 'line', data: hs, yAxisIndex: 0, smooth: true, connectNulls: true },
          { name: '体重(kg)', type: 'line', data: ws, yAxisIndex: 1, smooth: true, connectNulls: true, lineStyle: { type: 'dashed' } }
        ]
      })
    } else if (gbox) {
      gbox.innerHTML = '<div class="empty-tip">' + (body.length < 2 ? '录 ≥ 2 条身心数据看曲线' : '图表库未加载') + '</div>'
    }

    function renderGrid() {
      var grid = container.querySelector('#dash-grid')
      if (!grid) return
      var list = activeCat === '全部' ? MODULES : MODULES.filter(function (m) { return m.cat === activeCat })
      var html = ''
      list.forEach(function (m) {
        var iconHtml = (App.icon && m.iconAnt) ? App.icon(m.iconAnt) : App.esc(m.icon)
        html += '<div class="module-card" data-go="' + App.esc(m.id) + '">' +
          '<div class="module-card-head"><span class="module-icon">' + iconHtml + '</span><span class="module-name">' + App.esc(m.name) + '</span></div>' +
          '<div class="module-desc">' + App.esc(m.desc) + '</div>' +
          '<span class="module-tag tag-' + App.esc(m.cat) + '">' + App.esc(m.cat) + '</span>' +
          '</div>'
      })
      grid.innerHTML = html
      grid.querySelectorAll('.module-card').forEach(function (c) {
        c.addEventListener('click', function () {
          var id = c.getAttribute('data-go')
          if (id) App.go(id)
        })
      })
    }
  }

  // 暴露 calcGrade 给顶栏用
  App.calcGrade = calcGrade
})(window)