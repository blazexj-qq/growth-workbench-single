/**
 * 成长工作台单文件版 · 本地状态层（store.js）
 *
 * 设计要点：
 * 1. 使用 window.App 命名空间，避免污染全局 window。
 * 2. 所有数据写入 localStorage，并统一加前缀，避免与其它站点键冲突。
 * 3. 提供 JSON 读写封装：get / set / exportAll / importAll。
 * 4. 全程为经典脚本（无 ES module import），可直接用浏览器打开 index.html 运行。
 *
 * 注意：本文件不依赖任何外部库，浏览器与 Node 下均只做语法解析即可通过。
 */
(function (global) {
  'use strict'

  var App = (global.App = global.App || {})

  // 存储键前缀：单文件版（single-file version）专用，避免与 React 版冲突
  var PREFIX = 'growth-workbench-sv:'

  /**
   * localStorage JSON 读写工具。
   */
  var store = {
    /**
     * 读取一个键，返回解析后的对象。
     * @param {string} key 不含前缀的短键名
     * @param {*} defaultVal 读不到（不存在 / 解析失败）时返回的默认值
     * @returns {*}
     */
    get: function (key, defaultVal) {
      var raw = localStorage.getItem(PREFIX + key)
      if (raw === null || raw === undefined) return defaultVal
      var parsed
      try {
        parsed = JSON.parse(raw)
      } catch (e) {
        return defaultVal
      }
      // 类型保护：默认值是数组的键，读到非数组（旧备份导入 / 格式错乱）时返回空数组，
      // 防止页面 .map/.forEach/.slice 直接抛错导致整页空白
      if (Array.isArray(defaultVal) && !Array.isArray(parsed)) return defaultVal
      return parsed
    },

    /**
     * 写入一个键，自动 JSON 序列化。
     * @param {string} key 不含前缀的短键名
     * @param {*} val 任意可序列化值
     * @returns {*} 回传写入的 val，便于链式使用
     */
    set: function (key, val) {
      localStorage.setItem(PREFIX + key, JSON.stringify(val))
      return val
    },

    /**
     * 导出全站数据：遍历 localStorage 中本前缀下的所有键，
     * 返回 { 短键名: 解析后的值 } 对象。
     * @returns {Object}
     */
    exportAll: function () {
      var dump = {}
      for (var i = 0; i < localStorage.length; i++) {
        var full = localStorage.key(i)
        if (!full || full.indexOf(PREFIX) !== 0) continue
        var short = full.slice(PREFIX.length)
        var raw = localStorage.getItem(full)
        try {
          dump[short] = JSON.parse(raw)
        } catch (e) {
          dump[short] = raw
        }
      }
      return dump
    },

    /**
     * 导入全站数据：把 exportAll 产出的对象批量写回 localStorage。
     * @param {Object} json 形如 { 短键名: 值 }
     * @returns {number} 实际写入的键数量
     * @throws {Error} 参数不是对象时抛错
     */
    importAll: function (json) {
      if (!json || typeof json !== 'object') {
        throw new Error('importAll 需要一个对象参数（来自 exportAll）')
      }
      var count = 0
      for (var k in json) {
        if (!Object.prototype.hasOwnProperty.call(json, k)) continue
        localStorage.setItem(PREFIX + k, JSON.stringify(json[k]))
        count++
      }
      return count
    },

    // 暴露前缀，便于调试
    _prefix: PREFIX
  }

  App.store = store
})(window)
