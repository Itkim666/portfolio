// ============ 个人信息配置：改这一个文件即可更新全站文案 ============
export const site = {
  name: 'Itkim',
  role: 'Computer Science / Computer Application',
  tagline: 'I enjoy turning ideas into small, solid software — games, tools and web experiments.',
  github: 'https://github.com/Itkim666/Itkim666',
  githubUser: 'Itkim666',
  // 填入邮箱后 Contact 区会自动显示；留空则整个条目隐藏（优雅降级）
  email: '',
}

export const about = {
  paragraphs: [
    '我是 Itkim，计算机专业在读。平时喜欢写代码把想法变成能跑起来的东西：小游戏、实用小工具、Web 实验，都做。',
    '目前的学习重心是 C/C++ 与数据结构，同时在补计算机网络和数据库的基础。比起堆技术名词，我更在意把每一个项目做完整：能运行、能复盘、能讲清楚。',
    '特点：安静但有耐心，遇到问题习惯先自己读文档和源码；喜欢给项目写文档，因为写到一半卡住的地方往往就是没想清楚的地方。',
  ],
  facts: [
    { label: 'Focus', value: 'Game Dev / Web' },
    { label: 'Learning', value: 'Networking · MySQL' },
    { label: 'Status', value: 'Open to opportunities' },
  ],
}

export const skillGroups = [
  {
    title: 'Languages',
    items: ['C', 'C++', 'Python', 'JavaScript'],
  },
  {
    title: 'Web',
    items: ['HTML', 'CSS', 'React'],
  },
  {
    title: 'Tools & CS',
    items: ['Git', 'GitHub', 'MySQL', '计算机网络'],
  },
]

export const education = [
  {
    period: '2023 — Present',
    title: '计算机科学与技术（本科在读）',
    org: 'My University', // TODO: 替换为你的学校
    note: '主修数据结构、操作系统、计算机网络、数据库原理。',
  },
  {
    period: 'Ongoing',
    title: '自学与项目实践',
    org: 'GitHub',
    note: '通过复刻游戏和构建 Web 项目学习工程化开发，源码与文档均托管在 GitHub。',
  },
]
