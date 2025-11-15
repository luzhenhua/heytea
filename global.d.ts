import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type WiredElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  [key: string]: any;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wired-card': WiredElementProps;
      'wired-button': WiredElementProps;
      'wired-input': WiredElementProps;
      'wired-slider': WiredElementProps;
      'wired-textarea': WiredElementProps;
    }
  }
}

export {};
