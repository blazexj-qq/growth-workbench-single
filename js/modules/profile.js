/**
 * 模块：孩子档案（profile.js）
 * 字段对齐飞书「孩子档案表」：姓名 / 年级 / 备注。
 * 年级按「当前年月 vs 9月1日界」自动推算，允许手动覆盖。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})
  App.pages = App.pages || {}

  // 按生日推算年级（南京入学规则：8/31 前满 6 周岁入学；学年以 9/1 划分）
  function calcGrade(birthday) {
    var b = App.parseDateSafe(birthday)
    if (!b) return null
    var now = new Date()
    var enrollYear = b.getFullYear() + 6
    if (b.getMonth() >= 8) enrollYear += 1 // 9月1日及以后出生，晚一年入学
    var schoolYearStart = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
    var gradeNo = schoolYearStart - enrollYear + 1
    var cn = function (n) {
      if (n <= 0) return '学前'
      if (n <= 6) return ['', '一', '二', '三', '四', '五', '六'][n] + '年级'
      if (n <= 9) return ['', '初一', '初二', '初三'][n - 6]
      if (n <= 12) return ['', '高一', '高二', '高三'][n - 9]
      return '高中以上'
    }
    // 预计升级年份：下一个 9 月
    var promoteYear = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()
    return { current: cn(gradeNo), next: cn(gradeNo + 1), promoteYear: promoteYear }
  }

  function gradeText(g) {
    return g ? (g.current + '（预计 ' + g.promoteYear + ' 年 9 月升 ' + g.next + '）') : '请填写生日后自动推算'
  }

  App.pages.profile = function (container) {
    var p = App.store.get('profile', null)
    var name = p ? p.name : ''
    var gender = p ? p.gender : '女'
    var birthday = p ? p.birthday : ''
    var school = p ? p.school : ''
    var gradeOverride = p ? (p.gradeOverride || '') : ''

    var html =
      App.ui.card('孩子档案',
        '<p class="muted">仅本机保存，不上传任何服务器。年级按「当前年月 vs 9月1日界」自动推算，也可手动覆盖。</p>' +
        App.ui.row('姓名', '<input id="pf-name" class="inp" value="' + App.esc(name) + '" placeholder="如 小宝" />') +
        App.ui.row('性别', '<select id="pf-gender" class="inp">' +
          '<option value="女"' + (gender === '女' ? ' selected' : '') + '>女</option>' +
          '<option value="男"' + (gender === '男' ? ' selected' : '') + '>男</option>' +
          '</select>') +
        App.ui.row('生日', '<input id="pf-birthday" class="inp" type="date" value="' + App.esc(birthday) + '" placeholder="dd/mm/yyyy" />' +
          '<span class="hint">拿到的是文本（如「2016年9月」）也能解析，不会崩</span>') +
        App.ui.row('学校', '<input id="pf-school" class="inp" value="' + App.esc(school) + '" placeholder="如 南京市某小学" />') +
        App.ui.row('年级（自动推算）', '<div class="readonly">' + App.esc(gradeText(calcGrade(birthday))) + '</div>') +
        App.ui.row('年级（手动覆盖）', '<input id="pf-grade" class="inp" value="' + App.esc(gradeOverride) + '" placeholder="留空则用自动推算" />') +
        '<div style="margin-top:14px;">' + App.ui.btn('pf-save', '保存档案', 'primary') + '</div>' +
        '<div id="pf-msg" class="msg"></div>'
      )

    container.innerHTML = html

    // 生日变化实时刷新自动年级
    var bdEl = container.querySelector('#pf-birthday')
    var autoEl = container.querySelector('.readonly')
    bdEl.addEventListener('change', function () {
      autoEl.textContent = gradeText(calcGrade(bdEl.value))
    })

    container.querySelector('#pf-save').addEventListener('click', function () {
      var data = {
        name: container.querySelector('#pf-name').value.trim(),
        gender: container.querySelector('#pf-gender').value,
        birthday: container.querySelector('#pf-birthday').value,
        school: container.querySelector('#pf-school').value.trim(),
        gradeOverride: container.querySelector('#pf-grade').value.trim()
      }
      App.store.set('profile', data)
      var msg = container.querySelector('#pf-msg')
      msg.textContent = '已保存 ✓'
      msg.className = 'msg ok'
      setTimeout(function () { msg.textContent = ''; msg.className = 'msg' }, 2000)
    })
  }
})(window)
