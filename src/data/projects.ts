import raw from '../../data/projects.json'
import type { Project } from '../types'

// 构建期静态导入：JSON 打包进产物，运行时不存在“读文件失败”的可能。
// 缺失的图片/链接由组件层逐项降级处理。
export const projects = raw as Project[]

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}
