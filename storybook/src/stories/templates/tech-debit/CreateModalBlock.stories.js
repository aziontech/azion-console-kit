import CreateModalBlock from '@/templates/create-modal-block/index.vue';

export default {
  title: '[tech debit] / Templates/CreateModalBlock',
  component: CreateModalBlock,
  tags: ['autodocs'],
  argTypes: {
    solutions: {
      control: 'object',
      description:
        'Object containing arrays of solution templates for each tab (recommended, templates, githubImport)'
    },
    loading: {
      control: 'object',
      description:
        'Object containing loading states for each tab (recommended, templates, githubImport)'
    }
  },
  parameters: {
    docs: {
      description: {
        component: `A comprehensive create modal with tabbed navigation for browsing recommended templates, templates, resources, and GitHub imports.

**Features:**
- Tabbed navigation (Recommended, Templates, Resources, Import from GitHub)
- Search functionality across all tabs
- Responsive grid layout
- Loading states per tab (for Recommended, Templates, and GitHub Import tabs)
- Resources tab displays hardcoded internal resources (not controlled by props)

**Props:**
- \`solutions\`: Object containing template data for Recommended, Templates, and GitHub Import tabs
- \`loading\`: Object controlling loading states for each tab

**Events:**
- \`closeModal\`: Emitted when a selection is made and navigation occurs`
      }
    }
  }
};

export const Default = {
  args: {
    solutions: {
      recommended: [
        {
          id: 1,
          name: 'Next.js Starter',
          headline: 'A Next.js starter template with edge optimization',
          vendor: {
            name: 'Vercel',
            slug: 'vercel',
            icon: 'https://via.placeholder.com/40'
          },
          slug: 'nextjs-starter'
        },
        {
          id: 2,
          name: 'Vue.js App',
          headline: 'Vue.js application template with composition API',
          vendor: {
            name: 'Vue',
            slug: 'vue',
            icon: 'https://via.placeholder.com/40'
          },
          slug: 'vuejs-app'
        }
      ],
      templates: [
        {
          id: 3,
          name: 'React Template',
          headline: 'Modern React application template',
          vendor: {
            name: 'Meta',
            slug: 'meta',
            icon: 'https://via.placeholder.com/40'
          },
          slug: 'react-template'
        }
      ],
      githubImport: [
        {
          id: 4,
          name: 'Import from GitHub',
          vendor: {
            name: 'GitHub',
            slug: 'github'
          },
          slug: 'github-import'
        }
      ]
    },
    loading: {
      recommended: false,
      templates: false,
      githubImport: false
    }
  }
};

export const Loading = {
  args: {
    solutions: {
      recommended: [],
      templates: [],
      githubImport: []
    },
    loading: {
      recommended: true,
      templates: false,
      githubImport: false
    }
  }
};

export const EmptyState = {
  args: {
    solutions: {
      recommended: [],
      templates: [],
      githubImport: []
    },
    loading: {
      recommended: false,
      templates: false,
      githubImport: false
    }
  }
};

export const WithMultipleTemplates = {
  args: {
    solutions: {
      recommended: [
        {
          id: 1,
          name: 'Next.js E-commerce',
          headline: 'Full-featured e-commerce template with Next.js',
          vendor: {
            name: 'Vercel',
            slug: 'vercel',
            icon: 'https://via.placeholder.com/40'
          },
          slug: 'nextjs-ecommerce'
        },
        {
          id: 2,
          name: 'Vue Dashboard',
          headline: 'Admin dashboard template with Vue 3',
          vendor: {
            name: 'Vue',
            slug: 'vue',
            icon: 'https://via.placeholder.com/40'
          },
          slug: 'vue-dashboard'
        },
        {
          id: 3,
          name: 'React Blog',
          headline: 'Blog template with React and MDX support',
          vendor: {
            name: 'Meta',
            slug: 'meta',
            icon: 'https://via.placeholder.com/40'
          },
          slug: 'react-blog'
        }
      ],
      templates: [
        {
          id: 4,
          name: 'Static Site',
          headline: 'Static site generator template',
          vendor: {
            name: 'Various',
            slug: 'various',
            icon: 'https://via.placeholder.com/40'
          },
          slug: 'static-site'
        },
        {
          id: 5,
          name: 'API Backend',
          headline: 'Serverless API backend template',
          vendor: {
            name: 'Node',
            slug: 'node',
            icon: 'https://via.placeholder.com/40'
          },
          slug: 'api-backend'
        }
      ],
      githubImport: [
        {
          id: 6,
          name: 'Existing Project',
          vendor: {
            name: 'GitHub',
            slug: 'github'
          },
          slug: 'existing-project'
        }
      ]
    },
    loading: {
      recommended: false,
      templates: false,
      githubImport: false
    }
  }
};
