// components/annah-ai-logo.tsx
import React from 'react';

const AnnahAiLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    width={841.89}
    height={595.28}
    viewBox="0 0 841.89 595.28"
    {...props}
  >
    <path
      d="M47.95 271.77h18.71l-28.07 39.62-28.07-39.62h18.71V159.02H47.95z"
      fill="#38c68b" // Use accent color
      stroke="#38c68b" // Use accent color
      strokeWidth={0.25}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      strokeOpacity={1}
    />
    <text
      xmlSpace="preserve"
      x={70.43} // Adjusted x position to be closer to the arrow
      y={271.77} // Align baseline with the bottom of the arrow stem visually
      fill="hsl(var(--foreground))" // Use foreground color variable
      strokeWidth={0.25}
      strokeOpacity={1}
      style={{
        fontVariantLigatures: 'none',
        fontVariantCaps: 'normal',
        fontVariantNumeric: 'normal',
        fontVariantEastAsian: 'normal',
        lineHeight: 1.25,
        fontFamily: 'Arial', // Keep Arial or match layout font if needed
        fontSize: '150px', // Larger font size
        fontWeight: 'bold', // Bold font weight
        letterSpacing: 0,
        wordSpacing: 0,
      }}
      transform="scale(.99987 1.00013)"
    >
      <tspan
        x={70.43} // Match the text x position
        y={271.77} // Match the text y position
        fill="hsl(var(--foreground))" // Use foreground color variable
        strokeWidth={0.25}
        style={{
          fontVariantLigatures: 'normal',
          fontVariantCaps: 'normal',
          fontVariantNumeric: 'normal',
          fontVariantEastAsian: 'normal',
          fontSize: '150px', // Match font size
          fontWeight: 'bold', // Match font weight
        }}
      >
        ANNAH.AI
      </tspan>
    </text>
  </svg>
);

export default AnnahAiLogo;
