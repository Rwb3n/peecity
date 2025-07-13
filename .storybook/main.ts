import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  features: {
    buildStoriesJson: true,
  },
  // Chromatic viewport configuration for responsive testing
  chromatic: {
    viewports: [375, 768, 1200],
    delay: 300,
    diffThreshold: 0.2,
    pauseAnimationAtEnd: true,
  },
};
export default config; 