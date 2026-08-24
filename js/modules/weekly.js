/**
 * 模块：成长周报（weekly.js）— 模块 W
 * 自动汇总「本周」（从本周一 0 点起）各模块新增录入条数，
 * 生成一段大白话中文周报。只读 store，不写。
 * 防焦虑：只做客观汇总，不排名、不评分、不贴标签。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  // 本周一 0 点
  function weekStart() {
    var d = new Date()
    var dow = (d.getDay() + 6) % 7 // 周一 = 0
    d.setDate(d.getDate() - dow)
    d.setHours(0, 0, 0, 0)
    return d
  }
  function inWeek(dateStr, start) {
    var dt = App.parseDateSafe(dateStr)
    if (!dt) return false
    return dt >= start
  }

  App.pages.weekly = function (container) {
    var start = weekStart()
    var scores = App.store.get('scores', [])
    var body = App.store.get('body', [])
    var habits = App.store.get('habits', { preset: [], enabled: [], checkins: {} })

    var nScore = scores.filter(function (s) { return inWeek(s.date, start) }).length
    var nBody = body.filter(function (r) { return inWeek(r.date, start) }).length

    // 习惯打卡次数：本周内各日 checkins 长度之和
    var nHabit = 0
    var checkins = habits.checkins || {}
    Object.keys(checkins).forEach(function (dateStr) {
      if (inWeek(dateStr, start)) nHabit += (checkins[dateStr] || []).length
    })

    var summary = '本周录入成绩 ' + nScore + ' 条、身心数据 ' + nBody + ' 条、习惯打卡 ' + nHabit + ' 次。'

    var range = start.getFullYear() + '-' + ('0' + (start.getMonth() + 1)).slice(-2) + '-' + ('0' + start.getDate()).slice(-2)
    var bodyHtml =
      '<p class="muted">统计范围：本周（从 ' + range + ' 起）。数据来自本机记录，非诊断、非评判。</p>' +
      '<div class="weekly-text">' + App.esc(summary) + '</div>' +
      '<div class="muted" style="margin-top:12px;">说明：周报只做客观汇总，帮你看节奏；不排名、不评分、不贴标签。</div>'

    container.innerHTML = App.ui.card('成长周报（本周）', bodyHtml)
  }
})(window)
