/**
 * 成长工作台单文件版 · 通用工具（util.js）
 * 经典脚本，挂在 window.App 下。提供转义、日期、id、UI 字符串构造等。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  // HTML 转义，防止用户录入内容注入页面（XSS 防护）
  App.esc = function (s) {
    if (s === null || s === undefined) return ''
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  // 生成简单唯一 id
  App.uid = function () {
    return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  }

  // 安全解析日期：支持 Date / 字符串 / 空；失败返回 null（防崩溃）
  App.parseDateSafe = function (v) {
    if (!v) return null
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v
    var d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  }

  // 今天 YYYY-MM-DD
  App.todayStr = function () {
    var d = new Date()
    var m = ('0' + (d.getMonth() + 1)).slice(-2)
    var day = ('0' + d.getDate()).slice(-2)
    return d.getFullYear() + '-' + m + '-' + day
  }

  // 两日期相差天数（b - a，按天取整，可为负）；任一无效返回 null
  App.daysBetween = function (aStr, bStr) {
    var a = App.parseDateSafe(aStr)
    var b = App.parseDateSafe(bStr)
    if (!a || !b) return null
    return Math.round((b.getTime() - a.getTime()) / 86400000)
  }

  // 距今天数（未来为正，过去为负，无日期为 null）
  App.daysLeft = function (targetStr) {
    return App.daysBetween(App.todayStr(), targetStr)
  }

  // 简易 UI 字符串构造器（返回 HTML 片段，供模块拼接）
  App.ui = {
    card: function (title, body, cls) {
      return '<div class="card ' + (cls || '') + '">' +
        (title ? '<h3 class="card-title">' + App.esc(title) + '</h3>' : '') +
        body + '</div>'
    },
    row: function (label, control) {
      return '<div class="form-row"><label>' + App.esc(label) + '</label>' +
        '<div class="form-ctrl">' + control + '</div></div>'
    },
    btn: function (id, label, cls) {
      return '<button type="button" id="' + id + '" class="btn ' + (cls || '') + '">' + App.esc(label) + '</button>'
    },
    empty: function (text) {
      return '<div class="empty-tip">' + App.esc(text) + '</div>'
    }
  }
})(window)
