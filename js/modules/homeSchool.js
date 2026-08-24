/**
 * 模块：家校沟通台账（homeSchool.js）— v0.5 升级
 * 顶部标题+描述 + 沟通概览汇总卡 + 双栏（左录入 / 右记录表）+ 必填* + 彩色 tag
 * 字段对齐飞书「家校沟通台账表」：date / channel / from / content / type / note
 * 只记录老师原话/通知/作业量等，看沟通密度；不评价老师或学校。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  var TYPE_TAG = { 通知: 'tg-info', 表扬: 'tg-ok', 提醒: 'tg-orange', 问题: 'tg-err', 作业量: 'tg-purple', 其他: 'tg-gray' }
  var CHANNEL_TAG = { 老师口头: 'tg-cyan', 班级通知: 'tg-info', 作业群: 'tg-purple', 家长会: 'tg-pink', 私信: 'tg-orange', 其他: 'tg-gray' }

  function typeTag(t) {
    return '<span class="tag ' + (TYPE_TAG[t] || 'tg-gray') + '">' + App.esc(t || '—') + '</span>'
  }
  function channelTag(c) {
    return '<span class="tag ' + (CHANNEL_TAG[c] || 'tg-gray') + '">' + App.esc(c || '—') + '</span>'
  }

  App.pages.homeSchool = function (container) {
    var list = App.demo.list('homeSchool')

    function render() {
      var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">家校沟通台账</h2>' +
        '<p class="muted" style="margin:0 0 16px;font-size:13px;">只记录老师原话/通知/作业量，看沟通密度；不评价老师或学校。</p>'

      // 沟通概览汇总卡
      var now = new Date()
      var ymd = App.todayStr()
      var d30 = new Date(now.getTime() - 30 * 86400000)
      var d30s = d30.getFullYear() + '-' + ('0' + (d30.getMonth() + 1)).slice(-2) + '-' + ('0' + d30.getDate()).slice(-2)
      var sumHtml = '<div class="summary-grid">'
      if (list.length) {
        var r30 = list.filter(function (x) { return x.date && x.date >= d30s })
        var praises = r30.filter(function (x) { return x.type === '表扬' }).length
        var follow = r30.filter(function (x) { return x.type === '提醒' || x.type === '问题' }).length
        var last = list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 })[0]
        sumHtml +=
          '<div class="summary-card"><div class="sum-name">近 30 天沟通</div><div class="sum-value">' + r30.length + '<span class="unit"> 条</span></div><div class="sum-tag">' + (r30.length >= 4 ? '<span class="tag tg-ok">有节奏</span>' : '<span class="tag tg-gray">偏少</span>') + '</div></div>' +
          '<div class="summary-card"><div class="sum-name">表扬/正反馈</div><div class="sum-value">' + praises + '<span class="unit"> 条</span></div><div class="sum-tag"><span class="tag tg-ok">鼓励为主</span></div></div>' +
          '<div class="summary-card"><div class="sum-name">提醒/问题</div><div class="sum-value">' + follow + '<span class="unit"> 条</span></div><div class="sum-tag">' + (follow ? '<span class="tag tg-orange">需跟进</span>' : '<span class="tag tg-ok">无</span>') + '</div></div>' +
          '<div class="summary-card"><div class="sum-name">最近沟通</div><div class="sum-value small">' + App.esc(last.date || '—') + '</div><div class="sum-tag">' + typeTag(last.type) + '</div></div>'
      } else {
        sumHtml += '<div class="hint" style="grid-column:1/-1;">还没有家校记录，记录后会显示近 30 天沟通概览。</div>'
      }
      sumHtml += '</div>'

      // 左栏表单
      var formHtml = App.ui.card('记一条家校沟通',
        '<div class="form-row required"><label>日期</label><div class="form-ctrl"><input id="hs-date" class="inp" type="date" value="' + App.todayStr() + '" placeholder="dd/mm/yyyy" /></div></div>' +
        '<div class="form-row"><label>渠道</label><div class="form-ctrl"><select id="hs-channel" class="inp">' +
        ['老师口头', '班级通知', '作业群', '家长会', '私信', '其他'].map(function (x) { return '<option value="' + x + '">' + x + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>来源</label><div class="form-ctrl"><input id="hs-from" class="inp" placeholder="老师姓名/学科（可选）" /></div></div>' +
        '<div class="form-row"><label>内容摘要</label><div class="form-ctrl"><input id="hs-content" class="inp" placeholder="老师原话/通知内容（可选）" /></div></div>' +
        '<div class="form-row"><label>类型</label><div class="form-ctrl"><select id="hs-type" class="inp">' +
        ['通知', '作业量', '表扬', '提醒', '问题', '其他'].map(function (x) { return '<option value="' + x + '">' + x + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>备注</label><div class="form-ctrl"><input id="hs-note" class="inp" placeholder="可选" /></div></div>' +
        '<div style="margin-top:12px;">' + App.ui.btn('hs-add', '保存这条', 'primary') + '</div>' +
        '<div id="hs-msg" class="msg"></div>'
      )

      var pageHtml = '<div class="module-page"><div class="form-col">' + formHtml + '</div><div class="list-col"><div id="hs-list"></div></div></div>'

      container.innerHTML = headHtml + sumHtml + pageHtml
      bindAdd()
      renderList()
    }

    function bindAdd() {
      var btn = container.querySelector('#hs-add')
      if (!btn) return
      btn.addEventListener('click', function () {
        var date = container.querySelector('#hs-date').value
        if (!date) { var m = container.querySelector('#hs-msg'); m.textContent = '请选日期'; m.className = 'msg err'; return }
        var s = {
          id: App.uid(), date: date,
          channel: container.querySelector('#hs-channel').value,
          from: container.querySelector('#hs-from').value.trim(),
          content: container.querySelector('#hs-content').value.trim(),
          type: container.querySelector('#hs-type').value,
          note: container.querySelector('#hs-note').value.trim()
        }
        list.push(s)
        App.demo.write('homeSchool', list)
        var m = container.querySelector('#hs-msg'); m.textContent = '已保存 ✓'; m.className = 'msg ok'
        setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 2000)
        render()
      })
    }

    function renderList() {
      var el = container.querySelector('#hs-list')
      if (!el) return
      if (!list.length) { el.innerHTML = App.ui.empty('还没有家校记录，先在左侧记一条。'); return }
      var rows = list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 }).map(function (s) {
        return '<tr>' +
          '<td>' + App.esc(s.date || '') + '</td>' +
          '<td>' + channelTag(s.channel) + '</td>' +
          '<td>' + App.esc(s.from || '—') + '</td>' +
          '<td>' + App.esc(s.content || '—') + '</td>' +
          '<td>' + typeTag(s.type) + '</td>' +
          '<td><a class="link" data-del="' + App.esc(s.id) + '">删除</a></td>' +
          '</tr>'
      }).join('')
      el.innerHTML = '<table class="tbl"><thead><tr><th>日期</th><th>渠道</th><th>来源</th><th>内容摘要</th><th>类型</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="hint">看沟通密度即可，别给每条都贴情绪标签。</div>'
      el.querySelectorAll('[data-del]').forEach(function (a) {
        a.addEventListener('click', function () {
          var id = a.getAttribute('data-del')
          list = list.filter(function (x) { return x.id !== id })
          App.demo.write('homeSchool', list)
          render()
        })
      })
    }

    render()
  }
})(window)
