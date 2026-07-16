import React from 'react';

interface BlueprintContentProps {
  children: React.ReactNode;
}

export const BlueprintContent: React.FC<BlueprintContentProps> = ({ children }) => {
  return (
    <section className="flex-1 overflow-y-auto relative bg-black">
      <div className="max-w-4xl mx-auto py-12 px-8">
        <div className="border border-outline-dim bg-black p-12 relative shadow-none">
          <article className="prose prose-invert prose-p:text-white/80 prose-headings:font-display prose-headings:text-white max-w-none">
            {children}
          </article>
        </div>
      </div>
    </section>
  );
};
