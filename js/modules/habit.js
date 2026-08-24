/**
 * 模块：习惯养成（habit.js）— v0.5 升级
 * 顶部标题+描述 + 双栏（左侧习惯库+今日打卡 + 右侧连续天数+热力图）+ 卡片化打卡按钮
 * 防焦虑：打卡中断不批评，仅观察趋势；streak / 习惯库 / 热力图保留。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  var PRESET = [
    { cat: '健康', items: [
      { id: 'run', emoji: '🏃', name: '运动' },
      { id: 'sleep', emoji: '😴', name: '早睡' },
      { id: 'teeth', emoji: '🦷', name: '刷牙' }
    ]},
    { cat: '营养', items: [
      { id: 'milk', emoji: '🥛', name: '喝奶' },
      { id: 'veg', emoji: '🥦', name: '吃蔬菜' },
      { id: 'water', emoji: '💧', name: '喝水' }
    ]},
    { cat: '学习', items: [
      { id: 'read', emoji: '📚', name: '阅读' },
      { id: 'review', emoji: '📝', name: '错题复盘' },
      { id: 'plan', emoji: '🎯', name: '列计划' }
    ]},
    { cat: '亲子', items: [
      { id: 'talk', emoji: '💬', name: '聊天' },
      { id: 'play', emoji: '🎲', name: '一起玩' }
    ]}
  ]
  var ALL = []
  PRESET.forEach(function (g) { g.items.forEach(function (i) { ALL.push(i) }) })

  function load() {
    var h = App.store.get('habits', null)
    if (!h || !h.preset) {
      h = { preset: PRESET, enabled: ALL.map(function (i) { return i.id }), checkins: {} }
      App.store.set('habits', h)
    }
    return h
  }
  function findItem(id) {
    for (var i = 0; i < ALL.length; i++) if (ALL[i].id === id) return ALL[i]
    return null
  }
  function streakFor(h, id) {
    var n = 0
    var d = new Date()
    var todayStr = App.todayStr()
    var checkedToday = (h.checkins[todayStr] || []).indexOf(id) >= 0
    if (!checkedToday) d.setDate(d.getDate() - 1)
    while (true) {
      var ds = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2)
      if ((h.checkins[ds] || []).indexOf(id) >= 0) { n++; d.setDate(d.getDate() - 1) }
      else break
    }
    return n
  }

  App.pages.habit = function (container) {
    var h = load()
    var todayStr = App.todayStr()
    var todaySet = h.checkins[todayStr] || []

    var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">时间管理与习惯</h2>' +
      '<p class="muted" style="margin:0 0 16px;font-size:13px;">勾选启用要培养的习惯，每日打卡看趋势。中断不打分、不批评。</p>'

    var enableHtml = PRESET.map(function (g) {
      var items = g.items.map(function (i) {
        var on = h.enabled.indexOf(i.id) >= 0
        return '<label class="chk"><input type="checkbox" data-en="' + i.id + '"' + (on ? ' checked' : '') + '/> ' +
          i.emoji + ' ' + App.esc(i.name) + '</label>'
      }).join('')
      return '<div class="cat"><b>' + App.esc(g.cat) + '</b><div class="chks">' + items + '</div></div>'
    }).join('')

    var enabledItems = h.enabled.map(findItem).filter(Boolean)
    var checkHtml = enabledItems.length
      ? enabledItems.map(function (i) {
          var on = todaySet.indexOf(i.id) >= 0
          return '<button type="button" class="habit-btn ' + (on ? 'on' : '') + '" data-check="' + i.id + '">' +
            i.emoji + ' ' + App.esc(i.name) + (on ? ' ✓' : '') + '</button>'
        }).join('')
      : '<div class="empty-tip">先在左侧勾选要启用的习惯。</div>'

    var streakHtml = enabledItems.length
      ? '<div class="streaks">' + enabledItems.map(function (i) {
          return '<span class="streak">' + i.emoji + ' ' + App.esc(i.name) + '：连续 <b>' + streakFor(h, i.id) + '</b> 天</span>'
        }).join('') + '</div>'
      : ''

    var heat = []
    var base = new Date()
    base.setDate(base.getDate() - 83)
    for (var k = 0; k < 84; k++) {
      var dd = new Date(base)
      dd.setDate(base.getDate() + k)
      var ds = dd.getFullYear() + '-' + ('0' + (dd.getMonth() + 1)).slice(-2) + '-' + ('0' + dd.getDate()).slice(-2)
      var cnt = (h.checkins[ds] || []).length
      var lvl = cnt === 0 ? 0 : cnt <= 1 ? 1 : cnt <= 3 ? 2 : 3
      heat.push('<div class="heat-cell lv' + lvl + '" title="' + ds + '：' + cnt + ' 次"></div>')
    }

    var pageHtml = '<div class="module-page"><div class="form-col">' +
      App.ui.card('习惯库（勾选启用）', enableHtml) +
      App.ui.card('今日打卡', '<div class="habit-grid">' + checkHtml + '</div>') +
      '</div><div class="list-col">' +
      App.ui.card('连续天数', streakHtml) +
      App.ui.card('坚持热力图（近 12 周）',
        '<div class="heatmap">' + heat.join('') + '</div>' +
        '<div class="muted" style="margin-top:8px;">颜色越深 = 当天打卡项越多。中断不打分、不批评，只看趋势。</div>') +
      '</div></div>'

    container.innerHTML = headHtml + pageHtml

    container.querySelectorAll('[data-en]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var id = cb.getAttribute('data-en')
        h = load()
        if (cb.checked) { if (h.enabled.indexOf(id) < 0) h.enabled.push(id) }
        else { h.enabled = h.enabled.filter(function (x) { return x !== id }) }
        App.store.set('habits', h)
        App.pages.habit(container)
      })
    })
    container.querySelectorAll('[data-check]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-check')
        h = load()
        var set = h.checkins[todayStr] || []
        var idx = set.indexOf(id)
        if (idx >= 0) set.splice(idx, 1); else set.push(id)
        h.checkins[todayStr] = set
        App.store.set('habits', h)
        App.pages.habit(container)
      })
    })
  }
})(window)