/**
 * 模块：择校决策（school.js）— v0.5 升级
 * 顶部标题+描述 + 双栏布局（左侧表单 + 右侧卡片化列表）+ 必填 * + 类型彩色 tag
 * 仅做留痕与对比，不替孩子下绝对化结论。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  function tgType(t) {
    return { '公办': 'tg-qita', '民办': 'tg-yuwen', '九年一贯': 'tg-yingyu', '国际/双语': 'tg-shuxue' }[t] || 'tg-qita'
  }
  function tgCon(c) {
    return { '优先': 'tag-bad-soft', '已定': 'tag-ok-soft', '考虑中': 'tag-warn-soft', '暂放': '' }[c] || ''
  }

  App.pages.school = function (container) {
    var list = App.store.get('schools', [])

    var headHtml = '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">择校决策</h2>' +
      '<p class="muted" style="margin:0 0 16px;font-size:13px;">候选初中列表，对比看指标生/校内竞争/结论。仅留痕，不替孩子下绝对结论。</p>'

    var formHtml = App.ui.card('添加候选初中',
      '<div class="form-row required"><label>校名</label><div class="form-ctrl"><input id="sk-name" class="inp" placeholder="如 某外国语学校" /></div></div>' +
      '<div class="form-row"><label>类型</label><div class="form-ctrl"><select id="sk-type" class="inp"><option>公办</option><option>民办</option><option>九年一贯</option><option>国际/双语</option><option>其他</option></select></div></div>' +
      '<div class="form-row"><label>指标生名额</label><div class="form-ctrl"><input id="sk-quota" class="inp" type="number" placeholder="如 30（可选）" /></div></div>' +
      '<div class="form-row"><label>校内竞争判断</label><div class="form-ctrl"><select id="sk-comp" class="inp"><option>强</option><option>中</option><option>弱</option><option>未知</option></select></div></div>' +
      '<div class="form-row"><label>决策结论</label><div class="form-ctrl"><select id="sk-con" class="inp"><option>考虑中</option><option>优先</option><option>已定</option><option>暂放</option></select></div></div>' +
      '<div style="margin-top:12px;">' + App.ui.btn('sk-add', '添加学校', 'primary') + '</div>' +
      '<div id="sk-msg" class="msg"></div>'
    )

    container.innerHTML = headHtml +
      '<div class="module-page"><div class="form-col">' + formHtml + '</div>' +
      '<div class="list-col"><div id="sk-list"></div></div></div>'

    function renderList() {
      var el = container.querySelector('#sk-list')
      if (!list.length) { el.innerHTML = App.ui.empty('还没有候选学校，先在左侧添一所。'); return }
      var cards = list.map(function (s) {
        return '<div class="item">' +
          '<div class="item-head"><b>' + App.esc(s.name) + '</b> ' +
          '<span class="tag ' + tgType(s.type) + '">' + App.esc(s.type) + '</span> ' +
          '<span class="tag ' + tgCon(s.conclusion) + '">' + App.esc(s.conclusion) + '</span>' +
          '<a class="link del" data-del="' + App.esc(s.id) + '" style="float:right;">删除</a></div>' +
          '<div class="muted" style="margin-top:6px;">指标生名额：' + (s.quota ? App.esc(s.quota) : '未填') +
          ' ｜ 校内竞争：' + App.esc(s.competition) + '</div>' +
          '</div>'
      }).join('')
      el.innerHTML = cards
      el.querySelectorAll('[data-del]').forEach(function (a) {
        a.addEventListener('click', function () {
          var id = a.getAttribute('data-del')
          list = list.filter(function (x) { return x.id !== id })
          App.store.set('schools', list); renderList()
        })
      })
    }

    container.querySelector('#sk-add').addEventListener('click', function () {
      var name = container.querySelector('#sk-name').value.trim()
      if (!name) { var m = container.querySelector('#sk-msg'); m.textContent = '请填校名'; m.className = 'msg err'; return }
      list.push({
        id: App.uid(),
        name: name,
        type: container.querySelector('#sk-type').value,
        quota: Number(container.querySelector('#sk-quota').value) || null,
        competition: container.querySelector('#sk-comp').value,
        conclusion: container.querySelector('#sk-con').value
      })
      App.store.set('schools', list)
      container.querySelector('#sk-name').value = ''
      var m = container.querySelector('#sk-msg'); m.textContent = '已添加 ✓'; m.className = 'msg ok'
      setTimeout(function () { m.textContent = ''; m.className = 'msg' }, 2000)
      renderList()
    })

    renderList()
  }
})(window)