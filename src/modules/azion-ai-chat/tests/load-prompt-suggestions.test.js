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
    expect(sut()).toEqual([
      {
        title: 'How to build an Edge Application',
        prompt: `I want to build an Edge Application using Azion Console. Explain the main steps covering the process of configuring and deploying it.`
      },
      {
        title: 'How to protect an application',
        prompt: `I've already deployed an Edge Application to the edge. Now I want to configure some security policies and a WAF to protect it. How can I do that using Azion tools and products?`
      }
    ])
  })

  it('should return software developer prompts when role is software-developer', () => {
    const { sut } = makeSut()
    expect(sut('software-developer')).toEqual(INITIAL_PROMPTS_SUGGESTIONS['software-developer'])
  })

  it('should return security specialist prompts when role is security-specialist', () => {
    const { sut } = makeSut()
    expect(sut('security-specialist')).toEqual([
      {
        title: 'How do I configure a WAF?',
        prompt: `I'm a Security Specialist looking to improve the security policies for my Edge Applications. I need to use a WAF to do so. How can I set up a WAF Rule Set on Azion step-by-step, and what configurations should I take into account?`
      },
      {
        title: 'How do I protect my site against bots?',
        prompt: `Bad bots are a significant threat to websites nowadays. What can Azion offer me on this topic? I want to learn some techniques and identify tools to manage bots and protect my applications from unauthorized traffic.`
      }
    ])
  })

  it('should return devops engineer prompts when role is devops-engineer', () => {
    const { sut } = makeSut()
    expect(sut('devops-engineer')).toEqual([
      {
        title: 'How do I protect my infrastructure?',
        prompt: `I want to secure my infrastructure by blocking threats using network lists based on IP/CIDR addresses, countries, and ASNs. Explain the workflow to configure these network lists on Azion.`
      },
      {
        title: 'How do I migrate my project to Azion?',
        prompt: `I have a project on a different platform, and I want to migrate it to Azion. How can I do that step-by-step, including my nameservers, domains, and applications?`
      }
    ])
  })

  it('should return data engineer prompts when role is data-engineer', () => {
    const { sut } = makeSut()
    expect(sut('data-engineer')).toEqual([
      {
        title: 'How do I monitor my application activity?',
        prompt: `I've already deployed an Edge Application to the edge. Now I want to test if it's working and monitor the traffic activity. How can I do that using Azion tools and products?`
      },
      {
        title: 'How do I create a Data Stream?',
        prompt: `I'm monitoring my application activity and I want to create a Data Stream to receive the logs in an external endpoint. Guide me to do so using Azion Console.`
      }
    ])
  })

  it('should return default prompts when role is other', () => {
    const { sut } = makeSut()
    expect(sut('other')).toEqual([
      {
        title: 'How to build an Edge Application',
        prompt: `I want to build an Edge Application using Azion Console. Explain the main steps covering the process of configuring and deploying it.`
      },
      {
        title: 'How to protect an application',
        prompt: `I've already deployed an Edge Application to the edge. Now I want to configure some security policies and a WAF to protect it. How can I do that using Azion tools and products?`
      }
    ])
  })
})
