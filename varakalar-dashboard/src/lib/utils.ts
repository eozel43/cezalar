import { clsx, ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Register the custom font sizes from tailwind.config.js so they are not
// mistaken for text colors (and dropped) when merged with e.g. text-white
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['caption', 'body-sm', 'body', 'body-lg', 'heading-sm', 'heading-md', 'heading-lg', 'heading-xl'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
