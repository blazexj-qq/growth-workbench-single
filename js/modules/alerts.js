/**
 * 预警生成器（alerts.js）
 * 真实数据驱动，绝不硬编码示例。暴露 App.alerts.list() 返回预警数组
 * + App.alerts.refresh() 刷新顶栏角标（在引导脚本中定义）。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.alerts = App.alerts || {}

  App.alerts.list = function () {
    var out = []

    // 1. 身心：BMI 异常 / 久未记录
    var body = App.store.get('body', [])
    if (body.length) {
      var last = body.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 })[0]
      var h = Number(last.height)
      var w = Number(last.weight)
      if (h > 0 && w > 0) {
        var bmi = w / Math.pow(h / 100, 2)
        if (bmi >= 24) out.push({ level: 'urgent', title: '体重偏重（BMI ' + bmi.toFixed(1) + '）', desc: '建议看医生或营养科评估，不下结论。', module: 'health' })
        else if (bmi > 0 && bmi <= 17) out.push({ level: 'urgent', title: '体重偏轻（BMI ' + bmi.toFixed(1) + '）', desc: '建议看医生评估。', module: 'health' })
      }
      if (last.date) {
        var gap = App.daysBetween(App.todayStr(), last.date)
        if (gap != null && gap >= 7) out.push({ level: 'warn', title: '身心记录已停 ' + gap + ' 天', desc: '建议补录一次身高/体重/睡眠/运动。', module: 'health' })
      }
    } else {
      out.push({ level: 'warn', title: '还没记过身心数据', desc: '先记一条身高体重吧。', module: 'health' })
    }

    // 2. 升学节点 ≤ 30 天
    var up = App.store.get('upcoming', [])
    up.forEach(function (u) {
      var d = App.daysLeft(u.date)
      if (d != null && d >= 0 && d <= 30) {
        out.push({ level: d <= 7 ? 'urgent' : 'warn', title: '升学节点临近：' + (u.name || ''), desc: '还有 ' + d + ' 天，去「升学」查看准备。', module: 'admission' })
      }
    })

    // 3. 成绩 > 30 天无新记录
    var scores = App.store.get('scores', [])
    if (scores.length) {
      var lastS = scores.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 })[0]
      if (lastS && lastS.date) {
        var gs = App.daysBetween(App.todayStr(), lastS.date)
        if (gs != null && gs >= 30) out.push({ level: 'warn', title: '成绩记录已停 ' + gs + ' 天', desc: '快考试/周测了吗？补一条看看。', module: 'score' })
      }
    }

    return out
  }
})(window)
