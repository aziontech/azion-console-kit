/**
 * Object containing contextual prompts for the domain creation form.
 *
 * @typedef {Object} DomainPrompts
 * @property {string} create.general - Prompt for providing detailed instructions for each field in the domain creation form.
 * @property {string} create.settings - Prompt for explaining the use of the CNAME field and the CNAME Access Only option, and describing the differences between the digital certificate options.
 */

export default {
  create: {
    general:
      'Please assist me in creating a domain. Provide detailed instructions for each field in the domain creation form.',
    settings:
      'Please explain the use of the CNAME field and the CNAME Access Only option. Additionally, describe the differences between the digital certificate options.'
  }
}
