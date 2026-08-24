/**
 * 模块：学习能力（ability.js）— v0.5 升级
 * 顶部标题+描述 + 6 维度最新评分汇总卡 + 双栏（左录入 / 右记录表）+ 必填* + 彩色档位 tag
 * 字段对齐飞书「学习能力表」：date / 注意力 / 工作记忆 / 逻辑思维 / 语言理解 / 执行功能 / 学习动机（均 1-5）/ note
 * 仅家长观察评分看趋势，绝不做医学/心理诊断结论。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  var DIMS = [
    { k: 'attention', label: '注意力' },
    { k: 'memory', label: '工作记忆' },
    { k: 'logic', label: '逻辑思维' },
    { k: 'language', label: '语言理解' },
    { k: 'executive', label: '执行功能' },
    { k: 'motivation', label: '学习动机' }
  ]

  function levelTag(v) {
    v = Number(v) || 0
    if (v >= 4) return '<span class="tag tg-ok">优</span>'
    if (v === 3) return '<span class="tag tg-warn">中</span>'
    return '<span class="tag tg-err">待关注</span>'
  }

  App.pages.ability = function (container) {
    var list = App.demo.list('ability')

    function render() {
      var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">学习能力画像</h2>' +
        '<p class="muted" style="margin:0 0 16px;font-size:13px;">只记录家长 / 老师观察到的表现趋势，不做任何诊断结论。评分 1-5，5 最好。</p>'

      var last = list.length ? list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 })[0] : null
      var sumHtml = '<div class="summary-grid">'
      if (last) {
        DIMS.forEach(function (d) {
          var v = Number(last[d.k]) || 0
          var bad = v < 3
          sumHtml += '<div class="summary-card">' +
            '<div class="sum-name">' + d.label + '</div>' +
            '<div class="sum-value' + (bad ? ' bad' : '') + '">' + v + '</div>' +
            '<div class="sum-tag">' + levelTag(v) + '</div></div>'
        })
      } else {
        sumHtml += '<div class="hint" style="grid-column:1/-1;">还没有评分，记录后会显示最新一次各维度。</div>'
      }
      sumHtml += '</div>'

      var formHtml = App.ui.card('记录一次观察评分（1-5，5 最好）',
        '<div class="form-row required"><label>日期</label><div class="form-ctrl"><input id="ab-date" class="inp" type="date" placeholder="dd/mm/yyyy" value="' + App.todayStr() + '" /></div></div>' +
        DIMS.map(function (d) {
          var opts = [1, 2, 3, 4, 5].map(function (v) { return '<option value="' + v + '">' + v + '</option>' }).join('')
          return '<div class="form-row"><label>' + d.label + '</label><div class="form-ctrl"><select id="ab-' + d.k + '" class="inp">' + opts + '</select></div></div>'
        }).join('') +
        '<div class="form-row"><label>备注</label><div class="form-ctrl"><input id="ab-note" class="inp" placeholder="当时情境等（可选）" /></div></div>' +
        '<div style="margin-top:12px;">' + App.ui.btn('ab-add', '保存本次评分', 'primary') + '</div>' +
        '<div id="ab-msg" class="msg"></div>'
      )

      var pageHtml = '<div class="module-page"><div class="form-col">' + formHtml + '</div><div class="list-col"><div id="ab-list"></div></div></div>'

      container.innerHTML = headHtml + sumHtml + pageHtml
      bindAdd()
      renderList()
    }

    function bindAdd() {
      var btn = container.querySelector('#ab-add')
      if (!btn) return
      btn.addEventListener('click', function () {
        var date = container.querySelector('#ab-date').value
        if (!date) { var m = container.querySelector('#ab-msg'); m.textContent = '请选日期'; m.className = 'msg err'; return }
        var s = { id: App.uid(), date: date }
        DIMS.forEach(function (d) { s[d.k] = Number(container.querySelector('#ab-' + d.k).value) || 3 })
        s.note = container.querySelector('#ab-note').value.trim()
        list.push(s)
        App.demo.write('ability', list)
        var m = container.querySelector('#ab-msg'); m.textContent = '已保存 ✓'; m.className = 'msg ok'
        setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 2000)
        render()
      })
    }

    function renderList() {
      var el = container.querySelector('#ab-list')
      if (!el) return
      if (!list.length) { el.innerHTML = App.ui.empty('还没有评分记录，先在左侧记录一次。'); return }
      var rows = list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 }).map(function (s) {
        var sum = 0
        DIMS.forEach(function (d) { sum += Number(s[d.k]) || 0 })
        var avg = (sum / DIMS.length).toFixed(1)
        var cells = DIMS.map(function (d) { return '<td>' + App.esc(s[d.k] || '—') + '</td>' }).join('')
        return '<tr>' +
          '<td>' + App.esc(s.date || '') + '</td>' + cells +
          '<td>' + avg + '</td>' +
          '<td><a class="link" data-del="' + App.esc(s.id) + '">删除</a></td>' +
          '</tr>'
      }).join('')
      el.innerHTML = '<table class="tbl"><thead><tr><th>日期</th><th>注意力</th><th>记忆</th><th>逻辑</th><th>语言</th><th>执行</th><th>动机</th><th>均分</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="hint">均分仅供参考，看长期趋势，别拿单次给孩子下结论。</div>'
      el.querySelectorAll('[data-del]').forEach(function (a) {
        a.addEventListener('click', function () {
          var id = a.getAttribute('data-del')
          list = list.filter(function (x) { return x.id !== id })
          App.demo.write('ability', list)
          render()
        })
      })
    }

    render()
  }
})(window)
