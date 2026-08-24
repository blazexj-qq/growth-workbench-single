/**
 * 全局搜索（search.js）
 * 前端搜所有 store 数据。暴露 App.search.query(text) 返回 [{kind, label, target}]
 * - profile 特殊处理（对象）
 * - 习惯 habits 结构特殊，不深搜
 * - 最多 10 条结果
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.search = App.search || {}

  var FIELDS = [
    { key: 'profile', label: '档案', fields: ['name', 'school'], page: 'archive' },
    { key: 'scores', label: '成绩', fields: ['examName', 'subject', 'note'], page: 'score' },
    { key: 'body', label: '身心', fields: ['note', 'mood'], page: 'health' },
    { key: 'ability', label: '能力', fields: ['note'], page: 'ability' },
    { key: 'nutrition', label: '营养', fields: ['breakfast', 'lunch', 'dinner', 'snack', 'note'], page: 'nutrition' },
    { key: 'parenting', label: '亲子', fields: ['type', 'keyPoint', 'note'], page: 'parenting' },
    { key: 'interest', label: '阅读', fields: ['book', 'readMode', 'amount', 'parentObs', 'note'], page: 'interest' },
    { key: 'comprehensive', label: '五育', fields: ['item', 'evidence', 'note'], page: 'comprehensive' },
    { key: 'homeSchool', label: '家校', fields: ['channel', 'from', 'content', 'type', 'note'], page: 'homeSchool' },
    { key: 'career', label: '生涯', fields: ['title', 'domain', 'source', 'thought', 'note'], page: 'career' },
    { key: 'experience', label: '体验', fields: ['career', 'form', 'venue', 'gain', 'note'], page: 'experience' },
    { key: 'school', label: '择校', fields: ['name', 'type', 'conclusion'], page: 'school' },
    { key: 'upcoming', label: '升学', fields: ['name'], page: 'admission' },
    { key: 'goal', label: '目标', fields: ['content', 'review', 'note'], page: 'goal' }
  ]

  function hitFields(item, fields, lc) {
    for (var i = 0; i < fields.length; i++) {
      var v = String(item[fields[i]] || '').toLowerCase()
      if (v && v.indexOf(lc) >= 0) return true
    }
    return false
  }

  function labelOf(it) {
    return (it.subject || it.name || it.content || it.type || it.examName || '记录') +
      (it.date ? ' · ' + it.date : '')
  }

  App.search.query = function (text) {
    text = (text || '').trim()
    if (!text) return []
    var lc = text.toLowerCase()
    var out = []
    for (var i = 0; i < FIELDS.length; i++) {
      var cfg = FIELDS[i]
      var data = App.store.get(cfg.key, null)
      if (data == null) continue
      if (cfg.key === 'profile') {
        if (typeof data !== 'object' || Array.isArray(data)) continue
        if (hitFields(data, cfg.fields, lc)) {
          out.push({ kind: cfg.label, label: (data.name || '孩子档案'), target: cfg.page })
        }
      } else if (Array.isArray(data)) {
        for (var k = 0; k < data.length && out.length < 10; k++) {
          if (hitFields(data[k], cfg.fields, lc)) {
            out.push({ kind: cfg.label, label: labelOf(data[k]), target: cfg.page })
          }
        }
      }
      if (out.length >= 10) break
    }
    return out
  }
})(window)
