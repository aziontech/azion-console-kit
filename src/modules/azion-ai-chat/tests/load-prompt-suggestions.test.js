import { describe, expect, it } from 'vitest'
import {
  INITIAL_PROMPTS_SUGGESTIONS,
  loadPromptSuggestion
} from '@/modules/azion-ai-chat/services/load-prompt-suggestions'

const makeSut = () => {
  return {
    sut: loadPromptSuggestion
  }
}
describe('loadPromptSuggestion', () => {
  it('should return default prompts when role is not provided', () => {
    const { sut } = makeSut()
    expect(sut()).toEqual(INITIAL_PROMPTS_SUGGESTIONS.other)
  })

  it('should return software developer prompts when role is software-developer', () => {
    const { sut } = makeSut()
    expect(sut('software-developer')).toEqual(INITIAL_PROMPTS_SUGGESTIONS['software-developer'])
  })

  it('should return security specialist prompts when role is security-specialist', () => {
    const { sut } = makeSut()
    expect(sut('security-specialist')).toEqual(INITIAL_PROMPTS_SUGGESTIONS['security-specialist'])
  })

  it('should return devops engineer prompts when role is devops-engineer', () => {
    const { sut } = makeSut()
    expect(sut('devops-engineer')).toEqual(INITIAL_PROMPTS_SUGGESTIONS['devops-engineer'])
  })

  it('should return data engineer prompts when role is data-engineer', () => {
    const { sut } = makeSut()
    expect(sut('data-engineer')).toEqual(INITIAL_PROMPTS_SUGGESTIONS['data-engineer'])
  })

  it('should return default prompts when role is other', () => {
    const { sut } = makeSut()
    expect(sut('other')).toEqual(INITIAL_PROMPTS_SUGGESTIONS.other)
  })
})
