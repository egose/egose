import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import npm2yarn from '@docusaurus/remark-plugin-npm2yarn';

const defaultLocale = 'en';

const config: Config = {
  title: 'Egose',
  tagline: 'A Comprehensive Toolkit for Building Secure Apps with Mongoose and Express.js',
  favicon: 'img/logo.png',

  // Set the production url of your site here
  url: 'https://egose.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'egose', // Usually your GitHub org/user name.
  projectName: 'egose', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale,
    locales: [defaultLocale],
  },
  plugins: [],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          remarkPlugins: [[npm2yarn, { sync: true }]],
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Egose',
      logo: {
        alt: 'Egose Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'aclSidebar',
          position: 'left',
          label: 'Egose ACL',
        },
        {
          type: 'docSidebar',
          sidebarId: 'adapterjsSidebar',
          position: 'left',
          label: 'Egose Adapter JS',
        },
        {
          type: 'docSidebar',
          sidebarId: 'swaggerSidebar',
          position: 'left',
          label: 'Egose Swagger',
        },
        {
          type: 'docSidebar',
          sidebarId: 'decoSidebar',
          position: 'left',
          label: 'Egose Deco',
        },
        // { to: '/blog', label: 'Blog', position: 'left' },
        {
          href: 'https://github.com/egose/egose',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Egose ACL',
              to: '/docs/egose-acl/philosophy',
            },
            {
              label: 'Egose Adapter JS',
              to: '/docs/egose-adapter-js/philosophy',
            },
            {
              label: 'Egose Swagger',
              to: '/docs/egose-swagger/philosophy',
            },
            {
              label: 'Egose Deco',
              to: '/docs/egose-deco/philosophy',
            },
          ],
        },
        {
          title: 'Community',
          // items: [
          //   {
          //     label: 'Stack Overflow',
          //     href: 'https://stackoverflow.com/questions/tagged/docusaurus',
          //   },
          //   {
          //     label: 'Discord',
          //     href: 'https://discordapp.com/invite/docusaurus',
          //   },
          //   {
          //     label: 'Twitter',
          //     href: 'https://twitter.com/docusaurus',
          //   },
          // ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/egose/egose',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Egose. Built with Docusaurus.`,
    },
    docs: {
      sidebar: {
        hideable: true,
      },
    },
    algolia: {
      // These keys are not secrets and can be added to your Git repository.
      appId: 'GG3T2M2V9J',
      apiKey: 'b5435ac2b5014a82759ec3a6fb34fb25',
      indexName: 'egoseio',
      contextualSearch: false,
      searchParameters: {},
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
