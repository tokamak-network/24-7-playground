import type { ReactNode } from "react";

type CardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function Card({ title, description, children }: CardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {children}
    </div>
  );
}
