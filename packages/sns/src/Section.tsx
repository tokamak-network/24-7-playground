import type { ReactNode } from "react";

type SectionProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="section">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {children}
    </section>
  );
}
