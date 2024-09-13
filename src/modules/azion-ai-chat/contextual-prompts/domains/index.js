/**
 * Object containing contextual prompts for the domain creation form.
 *
 * @typedef {Object} DomainPrompts
 * @property {string} create.general - Prompt for providing detailed instructions for each field in the domain creation form.
 * @property {string} create.settings - Prompt for explaining the use of the CNAME field and the CNAME Access Only option, and describing the differences between the digital certificate options.
 * @property {string} create.authentication - Prompt for explaining the use of the Mutual Authentication Settings.
 * @property {string} edit.general - Prompt for providing detailed instructions for each field in the domain edition form.
 * @property {string} edit.settings - Prompt for explaining the editing and managing of the CNAME field and the CNAME Access Only option, and describing the differences between the digital certificate options.
 * @property {string} edit.authentication - Prompt for explaining the editing and managing of the Mutual Authentication Settings.

*/

export default {
  create: {
    general:
      'I want to create a new domain with Azion and link it to an edge application. I need a step-by-step guide on configuring my new domain, including detailed instructions for each field in the domain creation form.',
    settings:
      'I am creating a new domain with Azion Console. While linking it to an edge application, I want to better understand CNAMEs, how to list them to associate with the Azion domain, and the differences between digital certificate options to choose the best one for my needs.',
    authentication:
      'I am creating a new domain with Azion Console. While configuring the main settings, I want to learn more about Mutual Authentication Settings and how enabling it can benefit me.'
  },
  edit: {
    general:
      'I want to edit one of my domains on Azion. Provide a step-by-step guide on how to edit the main settings in the domain editing form',
    settings:
      'I am editing one of my domains on Azion and need an overview of CNAMEs, how to list them to associate with the Azion domain, and the differences between digital certificate options. Help me edit these settings in the best way to avoid issues later.',
    authentication:
      'I am editing the main settings for one of my domains on Azion and would like guidance on managing the Mutual Authentication Settings, including some best practices.'
  }
}
