"use client";
import { useState } from "react";

export type FaqItem = { question: string; answer: string };
export type FaqGroup = { heading: string; items: readonly FaqItem[] };

function Chevron() {
  return (
    <svg className="wmv-faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function WaaromFaq({ groups }: { groups: readonly FaqGroup[] }) {
  const [activeHeading, setActiveHeading] = useState(groups[0].heading);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const activeGroup = groups.find((group) => group.heading === activeHeading) ?? groups[0];

  return (
    <div className="wmv-faq">
      <div className="wmv-faq-tabs" role="tablist" aria-label="Categorie">
        {groups.map((group) => (
          <button
            key={group.heading}
            type="button"
            role="tab"
            aria-selected={group.heading === activeHeading}
            className={group.heading === activeHeading ? "wmv-faq-tab wmv-faq-tab-active" : "wmv-faq-tab"}
            onClick={() => {
              setActiveHeading(group.heading);
              setOpenQuestion(null);
            }}
          >
            {group.heading}
          </button>
        ))}
      </div>
      <div className="wmv-faq-list" role="tabpanel">
        {activeGroup.items.map((item) => (
          <details
            key={item.question}
            className="wmv-faq-item"
            open={openQuestion === item.question}
            onToggle={(event) => setOpenQuestion(event.currentTarget.open ? item.question : null)}
          >
            <summary>
              {item.question}
              <Chevron />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
