/**
 * 成长工作台单文件版 · 数据保全（backup.js，T02）
 * 本地导出 / 导入：不依赖任何服务器，文件落在本机下载目录。
 *
 * 红线：导出时过滤示例 key（本版暂无示例，但过滤器先写好：
 *   if (key.indexOf('sample') === 0) continue），示例不落库、不备份。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.backup = App.backup || {}

  // 导出：调 exportAll，过滤示例 key，生成带日期的 JSON 用 Blob 触发下载
  App.backup.exportData = function () {
    var all = App.store.exportAll()
    var filtered = {}
    for (var k in all) {
      if (!Object.prototype.hasOwnProperty.call(all, k)) continue
      if (k.indexOf('sample') === 0) continue // 示例键不导出、不备份
      filtered[k] = all[k]
    }
    filtered.__exportedAt = new Date().toISOString()
    filtered.__source = 'growth-workbench-single-file'
    var json = JSON.stringify(filtered, null, 2)
    var blob = new Blob([json], { type: 'application/json' })
    var url = URL.createObjectURL(blob)
    var ymd = App.todayStr().replace(/-/g, '')
    var a = document.createElement('a')
    a.href = url
    a.download = 'growth-workbench-备份-' + ymd + '.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(function () { URL.revokeObjectURL(url) }, 1000)
    return Object.keys(filtered).length
  }

  // 导入：读文件 -> importAll -> 回调(err, 条数)
  App.backup.importData = function (file, onDone) {
    if (!file) { if (onDone) onDone(new Error('未选择文件'), 0); return }
    var reader = new FileReader()
    reader.onload = function () {
      try {
        var obj = JSON.parse(reader.result)
        delete obj.__exportedAt
        delete obj.__source
        var n = App.store.importAll(obj)
        if (onDone) onDone(null, n)
      } catch (e) {
        if (onDone) onDone(e || new Error('解析失败'), 0)
      }
    }
    reader.onerror = function () { if (onDone) onDone(new Error('文件读取失败'), 0) }
    reader.readAsText(file)
  }
})(window)
