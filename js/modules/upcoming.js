/**
 * 模块：升学节点（upcoming.js）— v0.5 升级
 * 顶部标题+描述 + 双栏布局 + 倒计时大数字 + 必填 *
 * 倒计时 = 真实「目标日期 − 今天」，**严禁写死任何示例数字**。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  App.pages.upcoming = function (container) {
    var list = App.store.get('upcoming', [])

    var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">升学节点</h2>' +
      '<p class="muted" style="margin:0 0 16px;font-size:13px;">节点管理（小升初 / 中考 / 模考 / 自定义）。首页最近节点倒计时也读这份数据。</p>'

    var formHtml = App.ui.card('添加升学节点',
      '<div class="form-row required"><label>节点名称</label><div class="form-ctrl"><input id="up-name" class="inp" placeholder="如 小升初 / 中考 / 一模" /></div></div>' +
      '<div class="form-row required"><label>目标日期</label><div class="form-ctrl"><input id="up-date" class="inp" type="date" placeholder="dd/mm/yyyy" /></div></div>' +
      '<div style="margin-top:12px;">' + App.ui.btn('up-add', '添加节点', 'primary') + '</div>' +
      '<div id="up-msg" class="msg"></div>'
    )

    container.innerHTML = headHtml +
      '<div class="module-page"><div class="form-col">' + formHtml + '</div>' +
      '<div class="list-col"><div id="up-list"></div></div></div>'

    function renderList() {
      var el = container.querySelector('#up-list')
      if (!list.length) {
        el.innerHTML = App.ui.empty('还没有节点。添加后，首页会显示最近一个节点的真实倒计时。')
        return
      }
      var sorted = list.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1 })
      var rows = sorted.map(function (u) {
        var d = App.daysLeft(u.date)
        var txt, cls
        if (d == null) { txt = '日期无效'; cls = 'tag' }
        else if (d > 0) { txt = '还有 <b style="color:var(--brand);">' + d + '</b> 天'; cls = 'tag-warn-soft' }
        else if (d === 0) { txt = '就是今天'; cls = 'tag-warn-soft' }
        else { txt = '已过去 ' + (-d) + ' 天'; cls = '' }
        return '<tr>' +
          '<td><b>' + App.esc(u.name) + '</b></td>' +
          '<td>' + App.esc(u.date) + '</td>' +
          '<td><span class="tag ' + cls + '">' + txt + '</span></td>' +
          '<td><a class="link" data-del="' + App.esc(u.id) + '">删除</a></td>' +
          '</tr>'
      }).join('')
      el.innerHTML = '<table class="tbl"><thead><tr><th>节点</th><th>目标日期</th><th>倒计时</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>'
      el.querySelectorAll('[data-del]').forEach(function (a) {
        a.addEventListener('click', function () {
          var id = a.getAttribute('data-del')
          list = list.filter(function (x) { return x.id !== id })
          App.store.set('upcoming', list); renderList()
        })
      })
    }

    container.querySelector('#up-add').addEventListener('click', function () {
      var name = container.querySelector('#up-name').value.trim()
      var date = container.querySelector('#up-date').value
      if (!name || !date) {
        var m = container.querySelector('#up-msg'); m.textContent = '请填名称和日期'; m.className = 'msg err'; return
      }
      list.push({ id: App.uid(), name: name, date: date })
      App.store.set('upcoming', list)
      container.querySelector('#up-name').value = ''
      container.querySelector('#up-date').value = ''
      var m = container.querySelector('#up-msg'); m.textContent = '已添加 ✓'; m.className = 'msg ok'
      setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 2000)
      renderList()
    })

    renderList()
  }
})(window)