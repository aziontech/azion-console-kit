/**
 * An array of objects representing prompt suggestions.
 *
 * @typedef {Object} PromptSuggestion
 * @property {string} title - The title of the prompt suggestion.
 * @property {string} prompt - The prompt text.
 *
 * @typedef {PromptSuggestion[]} PromptSuggestions
 */

/**
 * Loads prompt suggestions based on the given role.
 *
 * @param {'software-developer'| 'devops-engineer'| 'infrastructure-analyst'| 'network-engineer'| 'security-specialist'| 'data-engineer'| 'ai-ml-engineer'| 'iot-engineer'| 'team-lead'| 'other'} role - The job role of the user.
 * @return {PromptSuggestions} The prompt suggestions based on the role.
 */
export const loadPromptSuggestion = (role = 'other') => {
  const DEFAULT_PROMPTS = [
    {
      title: 'How do I build an edge application?',
      prompt: `I want to build an edge application using Azion Console. Explain the main steps covering the process of configuring and deploying it.`
    },
    {
      title: 'How do I protect my application?',
      prompt: `I've already deployed an edge application to the edge. Now I want to configure some security policies and a WAF to protect it. How can I do that using Azion tools and products?`
    }
  ]
  const SOFTWARE_DEVELOPER_PROMPTS = [
    {
      title: 'What frameworks are supported by Azion?',
      prompt: `I'm a developer looking for the supported frameworks for building edge applications on Azion. I want to understand how to start using these frameworks to streamline my development process.`
    },
    {
      title: 'How can I write an edge function?',
      prompt:
        'I need to create an edge function to improve my application. Explain to me how edge functions work on Azion and how can I start writing one from scratch. Give me some examples to understand better.'
    }
  ]
  const SECURITY_SPECIALIST_PROMPTS = [
    {
      title: 'How do I configure a WAF?',
      prompt: `I'm a Security Specialist looking to improve the security policies for my edge applications. I need to use a WAF to do so. How can I set up a WAF Rule Set on Azion step-by-step, and what configurations should I take into account?`
    },
    {
      title: 'How do I protect my site against bots?',
      prompt: `Bad bots are a significant threat to websites nowadays. What can Azion offer me on this topic? I want to learn some techniques and identify tools to manage bots and protect my applications from unauthorized traffic.`
    }
  ]
  const DEVOPS_ENGINEER_PROMPTS = [
    {
      title: 'How do I protect my infrastructure?',
      prompt: `I want to secure my infrastructure by blocking threats using network lists based on IP/CIDR addresses, countries, and ASNs. Explain the workflow to configure these network lists on Azion.`
    },
    {
      title: 'How do I migrate my project to Azion?',
      prompt: `I have a project on a different platform, and I want to migrate it to Azion. How can I do that step-by-step, including my nameservers, domains, and applications?`
    }
  ]
  const DATA_ENGINEER_PROMPTS = [
    {
      title: 'How do I monitor my application activity?',
      prompt: `I've already deployed an edge application to the edge. Now I want to test if it's working and monitor the traffic activity. How can I do that using Azion tools and products?`
    },
    {
      title: 'How do I create a Data Stream?',
      prompt: `I'm monitoring my application activity and I want to create a Data Stream to receive the logs in an external endpoint. Guide me to do so using Azion Console.`
    }
  ]

  switch (role) {
    case 'software-developer':
      return SOFTWARE_DEVELOPER_PROMPTS
    case 'security-specialist':
      return SECURITY_SPECIALIST_PROMPTS
    case 'devops-engineer':
      return DEVOPS_ENGINEER_PROMPTS
    case 'data-engineer':
      return DATA_ENGINEER_PROMPTS
    default:
      return DEFAULT_PROMPTS
  }
}
