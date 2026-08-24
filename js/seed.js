/**
 * 成长工作台单文件版 · 演示数据种子（seed.js）
 *
 * 作用：首次启动（或用户手动点击"插入演示数据"按钮）时，注入一批贴近真实场景的
 *       演示记录到 `seed:` 前缀键，让老徐看 v0.5 双栏效果。
 *
 * 设计要点：
 * 1. 数据存到 `seed:Xxx` 键（seed 前缀），与真实数据 key 隔离，互不污染。
 * 2. sync.js 红线扩到 seed 前缀：演示数据不会被备份 / 上传。
 * 3. 模块层用 `App.demo.list('goal')` 智能读：真实数据非空用真实，空则用 seed。
 * 4. 写入永远走真实键，不动 seed 键——老徐删了 seed 数据可以一键恢复。
 * 5. 首启不自动注入，老徐手动按"插入演示数据"按钮（不在数据保全里找焦虑）。
 *
 * 经典 <script> 写法，挂 window.App；严禁 ES module。
 */
(function (global) {
  'use strict'
  var App = (global.App = global.App || {})

  // ---------- 工具 ----------
  function ymd(d) {
    if (!d) d = new Date()
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2)
  }
  function ymdAgo(days) {
    var d = new Date()
    d.setDate(d.getDate() - days)
    return ymd(d)
  }
  function uid() { return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }

  // ---------- 各模块演示数据 ----------
  // 选贴近老徐家真实生活场景的样例：目标 / 学习能力 / 阅读 / 兴趣 / 体验 / 亲子 6 项
  var SEED = {}
  SEED['seed:goal'] = [
    { id: uid(), createdAt: ymdAgo(28), category: '学业', content: '30 天读完 6 本课外书', dueDate: ymdAgo(-2), status: '进行中', progress: 67, review: '已读 4 本《窗边的小豆豆》《草房子》《今天我是升旗手》《青铜葵花》，最近有点慢。', note: '晚饭后 30 分钟' },
    { id: uid(), createdAt: ymdAgo(45), category: '身体', content: '每天跳绳 500 个', dueDate: ymdAgo(-30), status: '已完成', progress: 100, review: '开学前完成，已能连续 200 不间断。', note: '体育课加练 50 个' },
    { id: uid(), createdAt: ymdAgo(15), category: '兴趣', content: '读完《DK 太空百科》并能讲 3 件事给同学听', dueDate: ymdAgo(-20), status: '进行中', progress: 40, review: '已翻完一半，孩子对黑洞章节最感兴趣。', note: '周日和她一起看纪录片' },
    { id: uid(), createdAt: ymdAgo(60), category: '习惯', content: '每晚睡前自己整理书包', dueDate: ymdAgo(-15), status: '进行中', progress: 80, review: '周一到周五基本能自己整理，周末容易忘。', note: '' },
    { id: uid(), createdAt: ymdAgo(90), category: '兴趣', content: '钢琴 5 级', dueDate: ymdAgo(30), status: '已放弃', progress: 30, review: '孩子兴趣转向，跟她沟通后改弦乐方向。', note: '尊重孩子选择' }
  ]
  SEED['seed:ability'] = [
    { id: uid(), date: ymdAgo(120), attention: 3, memory: 3, logic: 4, language: 4, executive: 3, motivation: 4, note: '本学期起点观察' },
    { id: uid(), date: ymdAgo(90), attention: 4, memory: 4, logic: 4, language: 5, executive: 4, motivation: 4, note: '番茄钟练专注' },
    { id: uid(), date: ymdAgo(60), attention: 4, memory: 4, logic: 4, language: 5, executive: 4, motivation: 4, note: '保持' },
    { id: uid(), date: ymdAgo(30), attention: 4, memory: 4, logic: 5, language: 5, executive: 4, motivation: 4, note: '数学建模有突破' }
  ]
  SEED['seed:interest'] = [
    { id: uid(), date: ymdAgo(40), book: '《窗边的小豆豆》', readMode: '自主', durationMin: 45, amount: '第 1-3 章', comprehension: 4, interest: 5, parentObs: '她主动要求再看一遍', note: '' },
    { id: uid(), date: ymdAgo(30), book: '《DK 太空百科》', readMode: '亲子共读', durationMin: 30, amount: '太阳系章节', comprehension: 4, interest: 5, parentObs: '会画星系草图', note: '' },
    { id: uid(), date: ymdAgo(20), book: '《今天我是升旗手》', readMode: '自主', durationMin: 60, amount: '第 1-4 章', comprehension: 4, interest: 4, parentObs: '励志但不失童趣', note: '' },
    { id: uid(), date: ymdAgo(10), book: '《青铜葵花》', readMode: '自主', durationMin: 50, amount: '第 5-8 章', comprehension: 5, interest: 3, parentObs: '结尾让她哭了很久，跟她聊了"分离"', note: '' },
    { id: uid(), date: ymdAgo(5), book: '《草房子》', readMode: '听读', durationMin: 40, amount: '前 2 章', comprehension: 3, interest: 4, parentObs: '', note: '' }
  ]
  SEED['seed:career'] = [
    { id: uid(), date: ymdAgo(60), title: '想当医生', domain: '医学健康', source: '视频', thought: '看纪录片《手术两百年》后主动说"我想帮助生病的人"', status: '萌芽', note: '' },
    { id: uid(), date: ymdAgo(25), title: '对火箭好奇', domain: '工程技术', source: '家庭讨论', thought: '新闻里看到长征五号，问了一连串"为什么"', status: '感兴趣', note: '买了张 STEM 火箭拼装玩具' },
    { id: uid(), date: ymdAgo(10), title: '想当老师', domain: '人文社科', source: '学校活动', thought: '说"小红老师讲课好温柔"', status: '萌芽', note: '' }
  ]
  SEED['seed:experience'] = [
    { id: uid(), date: ymdAgo(50), title: '参观南京科技馆', type: '参观', location: '南京科技馆', duration: '半天', content: '主要看了宇航区、物理区', harvest: '对万有引力有了直观感受', rating: 5, status: '已完成', note: '' },
    { id: uid(), date: ymdAgo(20), title: '访谈医生表姨', type: '访谈', location: '家中视频', duration: '1 小时', content: '问了 10 个关于"医生每天做什么"的问题', harvest: '她说"医生要一直学习"，主动翻开了生物书', rating: 4, status: '已完成', note: '录音存档' },
    { id: uid(), date: ymdAgo(-7), title: '未来工程师夏令营', type: '夏令营', location: '待定', duration: '5 天', content: '', harvest: '', rating: 0, status: '报名中', note: '7 天后开始' }
  ]
  SEED['seed:parenting'] = [
    { id: uid(), date: ymdAgo(35), type: '深度谈话', durationMin: 30, childMood: 4, parentMood: 5, keyPoint: '《草房子》共读到秦大奶奶离世，她久久没说话', note: '' },
    { id: uid(), date: ymdAgo(20), type: '家庭会议', durationMin: 25, childMood: 4, parentMood: 4, keyPoint: '讨论暑假目标，三方各说各的，最终达成 2 个小目标', note: '' },
    { id: uid(), date: ymdAgo(10), type: '运动', durationMin: 90, childMood: 5, parentMood: 5, keyPoint: '玄武湖骑行一圈，她坚持没让扶', note: '' },
    { id: uid(), date: ymdAgo(3), type: '游戏', durationMin: 45, childMood: 5, parentMood: 5, keyPoint: '卡坦岛，她第一次赢了爸爸', note: '' }
  ]
  SEED['seed:nutrition'] = [
    { id: uid(), date: ymdAgo(6), breakfast: '牛奶+鸡蛋+包子', lunch: '学校食堂', dinner: '番茄炒蛋+米饭+青菜', snack: '酸奶', breakfastScore: 3, veg: 2, fruit: 1, milk: '是', waterCups: 5, sugarDrink: 0, snackHealthy: 3, screenWhileEating: '否', eatOut: '否', supplement: '维D', note: '早饭质量好' },
    { id: uid(), date: ymdAgo(4), breakfast: '粥+咸菜', lunch: '学校食堂', dinner: '外卖', snack: '薯片', breakfastScore: 2, veg: 1, fruit: 0, milk: '否', waterCups: 3, sugarDrink: 1, snackHealthy: 1, screenWhileEating: '是', eatOut: '是', supplement: '', note: '周末外食偏多' },
    { id: uid(), date: ymdAgo(1), breakfast: '牛奶+面包+水果', lunch: '学校食堂', dinner: '鱼+西兰花+米饭', snack: '坚果', breakfastScore: 3, veg: 2, fruit: 2, milk: '是', waterCups: 6, sugarDrink: 0, snackHealthy: 3, screenWhileEating: '否', eatOut: '否', supplement: '维D', note: '回归均衡' }
  ]
  SEED['seed:comprehensive'] = [
    { id: uid(), date: ymdAgo(40), category: '德', item: '班级值日', evidence: '值日表照片', status: '已完成', note: '' },
    { id: uid(), date: ymdAgo(25), category: '体', item: '校运动会 800 米', evidence: '奖状', status: '已完成', note: '第 3 名' },
    { id: uid(), date: ymdAgo(15), category: '美', item: '画展投稿', evidence: '画作照片', status: '进行中', note: '校内选拔' },
    { id: uid(), date: ymdAgo(8), category: '劳', item: '整理自己的书桌', evidence: '', status: '已完成', note: '每周一次' }
  ]
  SEED['seed:homeSchool'] = [
    { id: uid(), date: ymdAgo(10), channel: '班级通知', from: '班主任', content: '下周一带美术工具', type: '通知', note: '' },
    { id: uid(), date: ymdAgo(7), channel: '作业群', from: '数学老师', content: '本周口算练习达标', type: '表扬', note: '' },
    { id: uid(), date: ymdAgo(3), channel: '私信', from: '语文老师', content: '阅读量提升明显，建议增加精读', type: '提醒', note: '' }
  ]

  // 真实键 → seed 键的映射
  var KEY_MAP = {
    goal: 'seed:goal',
    ability: 'seed:ability',
    interest: 'seed:interest',
    career: 'seed:career',
    experience: 'seed:experience',
    parenting: 'seed:parenting',
    nutrition: 'seed:nutrition',
    comprehensive: 'seed:comprehensive',
    homeSchool: 'seed:homeSchool'
  }

  // ---------- 公开 API ----------
  App.demo = App.demo || {}

  /**
   * 智能读：真实数据非空用真实；真实为空 fallback 到 seed
   * @param {string} realKey 如 'goal' / 'ability'
   * @returns {Array}
   */
  App.demo.list = function (realKey) {
    var real = App.store.get(realKey, null)
    if (Array.isArray(real) && real.length) return real
    var seedKey = KEY_MAP[realKey]
    if (!seedKey) return Array.isArray(real) ? real : []
    return App.store.get(seedKey, [])
  }

  /**
   * 写入真实数据：调用方只管写 realKey；seed 键永远不动
   */
  App.demo.write = function (realKey, list) {
    App.store.set(realKey, list)
  }

  /**
   * 是否有 seed 数据
   */
  App.demo.hasSeed = function (realKey) {
    return !!App.store.get(KEY_MAP[realKey] || ('seed:' + realKey), null)
  }

  /**
   * 注入 / 覆盖种子数据
   */
  App.demo.fill = function () {
    var n = 0
    Object.keys(SEED).forEach(function (k) {
      App.store.set(k, SEED[k])
      n += SEED[k].length
    })
    return n
  }

  /**
   * 清空种子数据
   */
  App.demo.clear = function () {
    var n = 0
    Object.keys(SEED).forEach(function (k) {
      localStorage.removeItem(App.store._prefix + k)
      n++
    })
    return n
  }

  /**
   * 首启自动注入（一次性）。返回 true 表示本次注入，false 表示之前已注入过
   * 老徐刷新/换电脑/清缓存都仍能保留 seed 数据（除非他主动点「清空演示数据」）。
   */
  App.demo.bootstrap = function () {
    var flag = App.store.get('demo:bootstrapped', false)
    if (flag) return false
    App.demo.fill()
    App.store.set('demo:bootstrapped', { ts: Date.now(), version: 'v0.5.2' })
    return true
  }

  /**
   * 列出所有 seed 键的名称（供 sync.js 过滤 / UI 显示）
   */
  App.demo.seedKeys = function () {
    return Object.keys(SEED)
  }
})(window)
