// 记住用户离开首页时的滚动位置，供项目详情页的 “Back to Home” 恢复。
// 用 sessionStorage：只在当前标签页会话内有效，关掉标签页即清除，
// 不会污染用户的永久存储。隐私模式下写入失败时静默降级（返回 null）。
const POS_KEY = 'pf:projects:pos'
const RETURN_KEY = 'pf:projects:return'

/** 离开首页去看项目时调用：记下当前位置 */
export function rememberScroll() {
  try {
    sessionStorage.setItem(POS_KEY, String(Math.round(window.scrollY)))
  } catch {
    /* 隐私模式/存储被禁用：忽略，退化为默认落点 */
  }
}

/**
 * 点击项目卡片时调用。只在「首页」记录位置 —— 此时的位置对返回有意义。
 * 从全部项目页等站内其他页面进入时清掉记录，返回时改为落到首页 Projects 区域
 * （否则会把别的页面的滚动值当成首页位置恢复，落到错误的位置）。
 */
export function rememberScrollFromCard() {
  try {
    const h = location.hash.replace(/^#/, '')
    if (h.startsWith('/')) {
      sessionStorage.removeItem(POS_KEY)
    } else {
      sessionStorage.setItem(POS_KEY, String(Math.round(window.scrollY)))
    }
  } catch {
    /* 忽略 */
  }
}

/** 点击 “Back to Home” 时调用：标记这次返回要恢复位置 */
export function markReturn() {
  try {
    sessionStorage.setItem(RETURN_KEY, '1')
  } catch {
    /* 忽略 */
  }
}

/** 回到首页时调用：若本次是带恢复意图的返回，消费标记并返回要恢复的位置；否则 null */
export function consumeReturn(): number | null {
  try {
    if (sessionStorage.getItem(RETURN_KEY) !== '1') return null
    sessionStorage.removeItem(RETURN_KEY)
    const v = sessionStorage.getItem(POS_KEY)
    return v === null ? null : Number(v)
  } catch {
    return null
  }
}
