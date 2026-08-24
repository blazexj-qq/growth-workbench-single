/**
 * 模块：营养膳食（nutrition.js）— v0.5 升级
 * 顶部标题+描述 + 近 7 天概览汇总卡 + 双栏（左录入 / 右记录表）+ 必填* + 彩色 tag
 * 字段对齐飞书「营养与膳食表」。只记录每天吃了啥、客观项，不做营养诊断、不评价"吃得好不好"。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  // 早餐质量（1-3）
  function bsTag(v) {
    v = Number(v) || 0
    if (v >= 3) return '<span class="tag tg-ok">达标</span>'
    if (v === 2) return '<span class="tag tg-warn">一般</span>'
    return '<span class="tag tg-err">待改善</span>'
  }
  // 喝奶
  function milkTag(v) {
    return v === '是' ? '<span class="tag tg-ok">达标</span>' : '<span class="tag tg-gray">未达标</span>'
  }
  // 含糖饮料次数
  function sugarTag(n) {
    n = Number(n) || 0
    return n === 0 ? '<span class="tag tg-ok">0 次</span>' : '<span class="tag tg-warn">' + n + ' 次</span>'
  }

  App.pages.nutrition = function (container) {
    var list = App.demo.list('nutrition')

    function recent7() {
      return list.slice()
        .filter(function (x) { return x && x.date })
        .sort(function (a, b) { return a.date < b.date ? 1 : -1 })
        .slice(0, 7)
    }

    function render() {
      var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">营养与膳食管理</h2>' +
        '<p class="muted" style="margin:0 0 16px;font-size:13px;">只记每天吃了什么、客观情况；不做营养诊断，也不评价孩子"吃得好不好"。</p>'

      // 近 7 天概览汇总卡
      var r7 = recent7()
      var sumHtml = '<div class="summary-grid">'
      if (r7.length) {
        var bsVals = r7.map(function (x) { return Number(x.breakfastScore) || 0 }).filter(function (v) { return v > 0 })
        var bsAvg = bsVals.length ? (bsVals.reduce(function (a, b) { return a + b }, 0) / bsVals.length).toFixed(1) : '—'
        var vegFruit = r7.map(function (x) { return (Number(x.veg) || 0) + (Number(x.fruit) || 0) })
        var vfAvg = (vegFruit.reduce(function (a, b) { return a + b }, 0) / r7.length).toFixed(1)
        var sugarTotal = r7.reduce(function (a, x) { return a + (Number(x.sugarDrink) || 0) }, 0)
        var milkDays = r7.filter(function (x) { return x.milk === '是' }).length
        sumHtml +=
          '<div class="summary-card"><div class="sum-name">早餐质量(近7天均值)</div><div class="sum-value">' + bsAvg + '</div><div class="sum-tag">' + (bsAvg === '—' ? '' : bsTag(bsAvg)) + '</div></div>' +
          '<div class="summary-card"><div class="sum-name">蔬果份数(日均)</div><div class="sum-value">' + vfAvg + '</div><div class="sum-tag"><span class="tag ' + (Number(vfAvg) >= 2 ? 'tg-ok' : 'tg-warn') + '">' + (Number(vfAvg) >= 2 ? '达标' : '偏少') + '</span></div></div>' +
          '<div class="summary-card"><div class="sum-name">含糖饮料(近7天合计)</div><div class="sum-value">' + sugarTotal + '</div><div class="sum-tag">' + sugarTag(sugarTotal) + '</div></div>' +
          '<div class="summary-card"><div class="sum-name">喝奶达标天数</div><div class="sum-value">' + milkDays + '<span class="unit">/7</span></div><div class="sum-tag">' + (milkDays >= 5 ? '<span class="tag tg-ok">不错</span>' : '<span class="tag tg-warn">可加油</span>') + '</div></div>'
      } else {
        sumHtml += '<div class="hint" style="grid-column:1/-1;">还没有饮食记录，记录后会显示近 7 天概览。</div>'
      }
      sumHtml += '</div>'

      // 左栏表单
      var formHtml = App.ui.card('记录今天吃了啥（只记事实，不评好坏）',
        '<div class="form-row required"><label>日期</label><div class="form-ctrl"><input id="nt-date" class="inp" type="date" value="' + App.todayStr() + '" placeholder="dd/mm/yyyy" /></div></div>' +
        '<div class="form-row"><label>早餐</label><div class="form-ctrl"><input id="nt-bf" class="inp" placeholder="如 牛奶+鸡蛋+包子（可选）" /></div></div>' +
        '<div class="form-row"><label>午餐</label><div class="form-ctrl"><input id="nt-lu" class="inp" placeholder="可选" /></div></div>' +
        '<div class="form-row"><label>晚餐</label><div class="form-ctrl"><input id="nt-di" class="inp" placeholder="可选" /></div></div>' +
        '<div class="form-row"><label>加餐</label><div class="form-ctrl"><input id="nt-sn" class="inp" placeholder="间食（可选）" /></div></div>' +
        '<div class="form-row"><label>早餐质量</label><div class="form-ctrl"><select id="nt-bs" class="inp">' +
        '<option value="0">0 未吃</option><option value="1">1 只含 1 类</option>' +
        '<option value="2">2 含 2 类</option><option value="3" selected>3 含 3 类及以上</option></select>' +
        '<div class="hint">类：谷薯 / 蔬果 / 肉蛋奶 / 大豆坚果</div></div></div>' +
        '<div class="form-row"><label>蔬菜份数</label><div class="form-ctrl"><input id="nt-veg" class="inp" type="number" min="0" placeholder="约 1 拳头/份（可选）" /></div></div>' +
        '<div class="form-row"><label>水果份数</label><div class="form-ctrl"><input id="nt-fruit" class="inp" type="number" min="0" placeholder="约 1 拳头/份（可选）" /></div></div>' +
        '<div class="form-row"><label>喝奶达标</label><div class="form-ctrl"><select id="nt-milk" class="inp">' +
        '<option value="否">否</option><option value="是">是（≥300ml）</option></select></div></div>' +
        '<div class="form-row"><label>饮水杯数</label><div class="form-ctrl"><input id="nt-cups" class="inp" type="number" min="0" placeholder="粗略记杯数（可选）" /></div></div>' +
        '<div class="form-row"><label>含糖饮料次数</label><div class="form-ctrl"><input id="nt-sugar" class="inp" type="number" min="0" value="0" /></div></div>' +
        '<div class="form-row"><label>零食健康度</label><div class="form-ctrl"><select id="nt-snack" class="inp">' +
        '<option value="1">1 不健康</option><option value="2" selected>2 一般</option>' +
        '<option value="3">3 健康</option></select></div></div>' +
        '<div class="form-row"><label>边吃边看屏幕</label><div class="form-ctrl"><select id="nt-screen" class="inp">' +
        '<option value="否">否</option><option value="是">是</option></select></div></div>' +
        '<div class="form-row"><label>在外就餐</label><div class="form-ctrl"><select id="nt-out" class="inp">' +
        '<option value="否">否</option><option value="是">是</option></select></div></div>' +
        '<div class="form-row"><label>补充剂</label><div class="form-ctrl"><input id="nt-sup" class="inp" placeholder="如 维D/钙（可选）" /></div></div>' +
        '<div class="form-row"><label>备注</label><div class="form-ctrl"><input id="nt-note" class="inp" placeholder="挑食/外食/过敏等（可选）" /></div></div>' +
        '<div style="margin-top:12px;">' + App.ui.btn('nt-add', '保存今天', 'primary') + '</div>' +
        '<div id="nt-msg" class="msg"></div>'
      )

      var pageHtml = '<div class="module-page"><div class="form-col">' + formHtml + '</div><div class="list-col"><div id="nt-list"></div></div></div>'

      container.innerHTML = headHtml + sumHtml + pageHtml
      bindAdd()
      renderList()
    }

    function bindAdd() {
      var btn = container.querySelector('#nt-add')
      if (!btn) return
      btn.addEventListener('click', function () {
        var date = container.querySelector('#nt-date').value
        if (!date) { var m = container.querySelector('#nt-msg'); m.textContent = '请选日期'; m.className = 'msg err'; return }
        var s = {
          id: App.uid(), date: date,
          breakfast: container.querySelector('#nt-bf').value.trim(),
          lunch: container.querySelector('#nt-lu').value.trim(),
          dinner: container.querySelector('#nt-di').value.trim(),
          snack: container.querySelector('#nt-sn').value.trim(),
          breakfastScore: Number(container.querySelector('#nt-bs').value) || 0,
          veg: Number(container.querySelector('#nt-veg').value) || null,
          fruit: Number(container.querySelector('#nt-fruit').value) || null,
          milk: container.querySelector('#nt-milk').value,
          waterCups: Number(container.querySelector('#nt-cups').value) || null,
          sugarDrink: Number(container.querySelector('#nt-sugar').value) || 0,
          snackHealthy: Number(container.querySelector('#nt-snack').value) || 2,
          screenWhileEating: container.querySelector('#nt-screen').value,
          eatOut: container.querySelector('#nt-out').value,
          supplement: container.querySelector('#nt-sup').value.trim(),
          note: container.querySelector('#nt-note').value.trim()
        }
        list.push(s)
        App.demo.write('nutrition', list)
        var m = container.querySelector('#nt-msg'); m.textContent = '已保存 ✓'; m.className = 'msg ok'
        setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 2000)
        render()
      })
    }

    function renderList() {
      var el = container.querySelector('#nt-list')
      if (!el) return
      if (!list.length) { el.innerHTML = App.ui.empty('还没有饮食记录，先在左侧记下今天。'); return }
      var rows = list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1 }).map(function (s) {
        var brief = [s.breakfast, s.lunch, s.dinner].filter(Boolean).join(' / ') || '—'
        var vegFruit = ((Number(s.veg) || 0) + (Number(s.fruit) || 0)) + ' 份'
        return '<tr>' +
          '<td>' + App.esc(s.date || '') + '</td>' +
          '<td>' + App.esc(brief) + '</td>' +
          '<td>' + milkTag(s.milk) + '</td>' +
          '<td>' + App.esc(vegFruit) + '</td>' +
          '<td>' + sugarTag(s.sugarDrink) + '</td>' +
          '<td><a class="link" data-del="' + App.esc(s.id) + '">删除</a></td>' +
          '</tr>'
      }).join('')
      el.innerHTML = '<table class="tbl"><thead><tr><th>日期</th><th>早/午/晚餐</th><th>喝奶</th><th>蔬果(份)</th><th>含糖饮料</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="hint">只看事实、看趋势；不拿单天评价孩子。</div>'
      el.querySelectorAll('[data-del]').forEach(function (a) {
        a.addEventListener('click', function () {
          var id = a.getAttribute('data-del')
          list = list.filter(function (x) { return x.id !== id })
          App.demo.write('nutrition', list)
          render()
        })
      })
    }

    render()
  }
})(window)
