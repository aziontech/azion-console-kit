/**
 * An array of objects representing context suggestions.
 *
 * @typedef {Object} PromptSuggestion
 * @property {string} title - The title of the context suggestion.
 * @property {string} context - The context text.
 * @property {string} [icon] - Optional PrimeVue icon class for the suggestion.
 *
 * @typedef {PromptSuggestion[]} PromptSuggestions
 */

export const INITIAL_PROMPTS_SUGGESTIONS = {
  'software-developer': [
    {
      title: 'What frameworks are supported by Azion?',
      icon: 'pi pi-cog',
      context: `I'm a developer looking for the supported frameworks for building Edge Applications on Azion. I want to understand how to start using these frameworks to streamline my development process.`
    },
    {
      title: 'How can I write an edge function?',
      icon: 'pi pi-code',
      context: `I need to create an edge function to improve my application. Explain to me how edge functions work on Azion and how can I start writing one from scratch. Give me some examples to understand better.`
    }
  ],
  'security-specialist': [
    {
      title: 'How do I configure a WAF?',
      icon: 'pi pi-shield',
      context: `I'm a Security Specialist looking to improve the security policies for my Edge Applications. I need to use a WAF to do so. How can I set up a WAF Rule Set on Azion step-by-step, and what configurations should I take into account?`
    },
    {
      title: 'How do I protect my site against bots?',
      icon: 'pi pi-ban',
      context: `Bad bots are a significant threat to websites nowadays. What can Azion offer me on this topic? I want to learn some techniques and identify tools to manage bots and protect my applications from unauthorized traffic.`
    }
  ],
  'devops-engineer': [
    {
      title: 'How do I protect my infrastructure?',
      icon: 'pi pi-lock',
      context: `I want to secure my infrastructure by blocking threats using network lists based on IP/CIDR addresses, countries, and ASNs. Explain the workflow to configure these network lists on Azion.`
    },
    {
      title: 'How do I migrate my project to Azion?',
      icon: 'pi pi-upload',
      context: `I have a project on a different platform, and I want to migrate it to Azion. How can I do that step-by-step, including my nameservers, domains, and applications?`
    }
  ],
  'data-engineer': [
    {
      title: 'How do I monitor my application activity?',
      icon: 'pi pi-chart-line',
      context: `I've already deployed an Edge Application to the edge. Now I want to test if it's working and monitor the traffic activity. How can I do that using Azion tools and products?`
    },
    {
      title: 'How do I create a Data Stream?',
      icon: 'pi pi-cloud-download',
      context: `I'm monitoring my application activity and I want to create a Data Stream to receive the logs in an external endpoint. Guide me to do so using Azion Console.`
    }
  ],
  other: [
    {
      title: 'How to build an Edge Application',
      icon: 'pi pi-cog',
      context: `I want to build an Edge Application using Azion Console. Explain the main steps covering the process of configuring and deploying it.`
    },
    {
      title: 'How to protect an application',
      icon: 'pi pi-shield',
      context: `I've already deployed an Edge Application to the edge. Now I want to configure some security policies and a WAF to protect it. How can I do that using Azion tools and products?`
    }
  ]
}

/**
 * Loads context suggestions based on the given role.
 *
 * @param {'software-developer'| 'devops-engineer'| 'infrastructure-analyst'| 'network-engineer'| 'security-specialist'| 'data-engineer'| 'ai-ml-engineer'| 'iot-engineer'| 'team-lead'| 'other'} [role] - The user's job role. Defaults to 'other'.
 * @return {PromptSuggestions} The context suggestions based on the role.
 */
export const loadPromptSuggestion = (role = 'other') => {
  switch (role) {
    case 'software-developer':
      return INITIAL_PROMPTS_SUGGESTIONS['software-developer']
    case 'security-specialist':
      return INITIAL_PROMPTS_SUGGESTIONS['security-specialist']
    case 'devops-engineer':
      return INITIAL_PROMPTS_SUGGESTIONS['devops-engineer']
    case 'data-engineer':
      return INITIAL_PROMPTS_SUGGESTIONS['data-engineer']
    default:
      return INITIAL_PROMPTS_SUGGESTIONS['other']
  }
}
