import { toSimplified } from '@hankit/tools'
import { mode } from '../modes'
import { WORD_LENGTH } from './constants'
import { getIdiom } from './idioms'
import { checkValidPoemLine } from './poems'

export function filterNonChineseChars(input: string) {
  return Array.from(input)
    .filter(i => /\p{Script=Han}/u.test(i))
    .slice(0, WORD_LENGTH)
    .join('')
}

export function checkValidIdiom(word: string, strict = false) {
  if (!strict)
    return true
  if (mode.isPoem)
    return checkValidPoemLine(word) || checkValidPoemLine(toSimplified(word))
  return !!getIdiom(word)
}
