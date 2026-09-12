export interface ProjectProblem {
  problem: string
  solution: string
}

// 项目详情的可选文档字段：缺任何一项都优雅降级（对应章节直接不渲染）
export interface ProjectDetails {
  background?: string
  goals?: string
  features?: string[]
  architecture?: string
  process?: string
  problems?: ProjectProblem[]
  results?: string
  screenshots?: string[]
}

export interface Project {
  slug: string
  name: string
  description: string
  cover: string
  technologies: string[]
  date: string
  github: string
  demo: string
  status: string
  tags: string[]
  details?: ProjectDetails
}
