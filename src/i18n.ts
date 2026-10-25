import hans from './locales/zh-cn.json'
import hant from './locales/zh-tw.json'
import { mode } from './modes'

const lang = window.navigator.language?.toLowerCase() || ''
export const preferTraditional = lang.includes('hant') || lang.includes('tw') || lang.includes('hk')
export const preferZhuyin = lang.includes('tw')

export const locale = useStorage<'hans' | 'hant'>('handle-locale', preferTraditional ? 'hant' : 'hans')

function lookup(key: string): string | undefined {
  return (locale.value === 'hant' ? (hant as any)[key] : null) || (hans as any)[key]
}

// mode-specific strings live under `key@<mode id>` or `key@poem` and fall back to `key`
const suffixes = [`@${mode.id}`, ...(mode.isPoem ? ['@poem'] : [])]

export function t(key: keyof typeof hans, ...t: any[]): string {
  const str: string = suffixes.map(s => lookup(key + s)).find(Boolean) || lookup(key) || key
  return str.replace(/\{(\d+)\}/g, (_, i) => t[i])
}
