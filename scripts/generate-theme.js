const fs = require('fs');
const path = require('path');

const tokensPath = path.join(__dirname, '..', 'design', 'tokens.json');
const outputPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
const themeConfigPath = path.join(__dirname, '..', 'tailwind.config.js');

try {
  // Read and parse the design tokens
  console.log('Reading design tokens...');
  const tokensFile = fs.readFileSync(tokensPath, 'utf8');
  const tokens = JSON.parse(tokensFile);
  console.log('Tokens parsed successfully.');

  const { colors, radius } = tokens;

  const generateColorVariables = (colorObject) => {
    return Object.entries(colorObject)
      .map(([name, value]) => `    --${name}: ${value};`)
      .join('\n');
  };

  // Construct the CSS content
  console.log('Generating CSS content...');
  const cssContent = `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
${generateColorVariables(colors.light)}
    --radius: ${radius};
  }

  .dark {
${generateColorVariables(colors.dark)}
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
  `.trim();
  console.log('CSS content generated.');

  // Write the generated CSS to the output file
  fs.writeFileSync(outputPath, cssContent);
  console.log(`✅ Theme styles successfully written to ${outputPath}`);

  // Optional: A check or update for tailwind.config.js could go here
  // For now, we'll just log a reminder.
  console.log('🔔 Remember to ensure your tailwind.config.js is set up to use these CSS variables.');

} catch (error) {
  console.error('❌ An error occurred during theme generation:');
  console.error(error);
  process.exit(1);
} 