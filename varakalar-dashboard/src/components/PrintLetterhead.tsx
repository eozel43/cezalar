import React from 'react';
import { APP_CONFIG } from '../config';

// Only rendered on paper: municipal letterhead at the top of the first page and a
// faint logo watermark repeated on every page (position: fixed repeats in print)
const PrintLetterhead: React.FC = () => (
  <>
    <img src={APP_CONFIG.printLogoUrl} alt="" aria-hidden="true" className="print-watermark hidden print:block" />

    <header className="hidden print:block text-center pb-3 mb-4 border-b-2 border-neutral-800">
      <img src={APP_CONFIG.printLogoUrl} alt={APP_CONFIG.institution} className="mx-auto mb-2" style={{ width: '24mm', height: '24mm' }} />
      {APP_CONFIG.letterhead.map((line, i) => (
        <div
          key={line}
          className={i === APP_CONFIG.letterhead.length - 1 ? 'text-[11pt] font-semibold' : 'text-[12pt] font-bold tracking-wide'}
          style={{ color: '#000', lineHeight: 1.35 }}
        >
          {line}
        </div>
      ))}
    </header>
  </>
);

export default PrintLetterhead;
