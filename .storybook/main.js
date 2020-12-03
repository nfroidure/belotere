// TODO: Use '@next/plugin-storybook/preset' when not experimental anymore
// https://github.com/vercel/next.js/pull/12934

module.exports = {
  stories: ['../components/*.stories.tsx'],
  addons: [
   "@storybook/addon-actions/register",
   "@storybook/addon-links/register",
   "@storybook/addon-knobs/register",
  ],
};
