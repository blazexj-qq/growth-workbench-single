/**
 * 模块：目标管理（goal.js）— v0.5 升级
 * 顶部标题+描述 + 状态汇总卡 + 双栏（左录入 / 右目标卡片）+ 必填* + 彩色状态 tag
 * 字段对齐飞书「目标管理表」。与 H 习惯、J 生涯互补，不重叠。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  var STATUS_ORDER = { '进行中': 0, '已完成': 1, '已暂停': 2, '已放弃': 3 }

  function statusTag(st) {
    var m = { '进行中': 'tg-info', '已完成': 'tg-ok', '已暂停': 'tg-warn', '已放弃': 'tg-err' }
    return '<span class="tag ' + (m[st] || 'tg-gray') + '">' + App.esc(st || '') + '</span>'
  }
  function catTag(cat) {
    var m = { '学业': 'tg-info', '身体': 'tg-ok', '兴趣': 'tg-purple', '习惯': 'tg-cyan', '其他': 'tg-gray' }
    return '<span class="tag ' + (m[cat] || 'tg-gray') + '">' + App.esc(cat || '') + '</span>'
  }

  App.pages.goal = function (container) {
    var list = App.demo.list('goal')

    function render() {
      var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">目标管理</h2>' +
        '<p class="muted" style="margin:0 0 16px;font-size:13px;">小步快跑，先定一个能完成的小目标。进度只自己看，不给孩子排名。</p>'

      var doing = list.filter(function (g) { return g.status === '进行中' }).length
      var done = list.filter(function (g) { return g.status === '已完成' }).length
      var sumHtml = '<div class="summary-grid">' +
        '<div class="summary-card"><div class="sum-name">进行中</div><div class="sum-value">' + doing + '</div><div class="sum-tag">' + statusTag('进行中') + '</div></div>' +
        '<div class="summary-card"><div class="sum-name">已完成</div><div class="sum-value">' + done + '</div><div class="sum-tag">' + statusTag('已完成') + '</div></div>' +
        '</div>'

      var formHtml = App.ui.card('定一个小目标',
        '<div class="form-row required"><label>创建日期</label><div class="form-ctrl"><input id="gl-created" class="inp" type="date" placeholder="dd/mm/yyyy" value="' + App.todayStr() + '" /></div></div>' +
        '<div class="form-row"><label>类别</label><div class="form-ctrl"><select id="gl-cat" class="inp">' + ['学业', '身体', '兴趣', '习惯', '其他'].map(function (x) { return '<option value="' + x + '">' + x + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row required"><label>目标内容</label><div class="form-ctrl"><input id="gl-content" class="inp" placeholder="如 每天读 20 分钟课外书" /></div></div>' +
        '<div class="form-row"><label>截止日期</label><div class="form-ctrl"><input id="gl-due" class="inp" type="date" placeholder="dd/mm/yyyy" /></div></div>' +
        '<div class="form-row"><label>状态</label><div class="form-ctrl"><select id="gl-status" class="inp">' + ['进行中', '已完成', '已暂停', '已放弃'].map(function (x) { return '<option value="' + x + '">' + x + '</option>' }).join('') + '</select></div></div>' +
        '<div class="form-row"><label>进度(%)</label><div class="form-ctrl"><input id="gl-progress" class="inp" type="number" min="0" max="100" value="0" /></div></div>' +
        '<div class="form-row"><label>复盘</label><div class="form-ctrl"><input id="gl-review" class="inp" placeholder="做了什么、结果如何（可选）" /></div></div>' +
        '<div class="form-row"><label>备注</label><div class="form-ctrl"><input id="gl-note" class="inp" placeholder="可选" /></div></div>' +
        '<div style="margin-top:12px;">' + App.ui.btn('gl-add', '添加目标', 'primary') + '</div>' +
        '<div id="gl-msg" class="msg"></div>'
      )

      var pageHtml = '<div class="module-page"><div class="form-col">' + formHtml + '</div><div class="list-col"><div id="gl-list"></div></div></div>'

      container.innerHTML = headHtml + sumHtml + pageHtml
      bindAdd()
      renderList()
    }

    function bindAdd() {
      var btn = container.querySelector('#gl-add')
      if (!btn) return
      btn.addEventListener('click', function () {
        var content = container.querySelector('#gl-content').value.trim()
        var created = container.querySelector('#gl-created').value
        if (!content || !created) { var m = container.querySelector('#gl-msg'); m.textContent = '请填目标内容和创建日期'; m.className = 'msg err'; return }
        var g = {
          id: App.uid(),
          createdAt: created,
          category: container.querySelector('#gl-cat').value,
          content: content,
          dueDate: container.querySelector('#gl-due').value || null,
          status: container.querySelector('#gl-status').value,
          progress: Number(container.querySelector('#gl-progress').value) || 0,
          review: container.querySelector('#gl-review').value.trim(),
          note: container.querySelector('#gl-note').value.trim()
        }
        list.push(g)
        App.demo.write('goal', list)
        var m = container.querySelector('#gl-msg'); m.textContent = '已添加 ✓'; m.className = 'msg ok'
        setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 2000)
        render()
      })
    }

    function renderList() {
      var el = container.querySelector('#gl-list')
      if (!el) return
      if (!list.length) { el.innerHTML = App.ui.empty('还没有目标，先定一个小的。'); return }
      var sorted = list.slice().sort(function (a, b) {
        var da = STATUS_ORDER[a.status] == null ? 9 : STATUS_ORDER[a.status]
        var db = STATUS_ORDER[b.status] == null ? 9 : STATUS_ORDER[b.status]
        if (da !== db) return da - db
        return a.createdAt < b.createdAt ? 1 : -1
      })
      var html = sorted.map(function (g) {
        var bar = Math.max(0, Math.min(100, Number(g.progress) || 0))
        return '<div class="item">' +
          '<div class="item-head">' + catTag(g.category) + ' ' + App.esc(g.content || '') + ' ' + statusTag(g.status) + '</div>' +
          '<div class="muted" style="margin-top:6px;">创建 ' + App.esc(g.createdAt || '') +
          (g.dueDate ? ' · 截止 ' + App.esc(g.dueDate) : '') + '</div>' +
          '<div class="muted" style="margin-top:4px;">进度 ' + bar + '%</div>' +
          '<div style="background:#eef2f5;border-radius:8px;height:8px;margin-top:4px;">' +
          '<div style="width:' + bar + '%;background:var(--brand);border-radius:8px;height:8px;"></div></div>' +
          (g.review ? '<div class="muted" style="margin-top:6px;">复盘：' + App.esc(g.review) + '</div>' : '') +
          '<div style="margin-top:6px;"><a class="link" data-del="' + App.esc(g.id) + '">删除</a></div>' +
          '</div>'
      }).join('')
      el.innerHTML = html
      el.querySelectorAll('[data-del]').forEach(function (a) {
        a.addEventListener('click', function () {
          var id = a.getAttribute('data-del')
          list = list.filter(function (x) { return x.id !== id })
          App.demo.write('goal', list)
          render()
        })
      })
    }

    render()
  }
})(window)
