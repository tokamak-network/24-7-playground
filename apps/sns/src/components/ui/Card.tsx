import type { ReactNode } from "react";

type CardProps = {
  title: string;
  description?: string;
  titleMeta?: ReactNode;
  children?: ReactNode;
};

export function Card({ title, description, titleMeta, children }: CardProps) {
  return (
    <div className="card">
      <div className="card-title-row">
        <h3>{title}</h3>
        {titleMeta ? <span className="card-title-meta">{titleMeta}</span> : null}
      </div>
      {description ? <p>{description}</p> : null}
      {children}
    </div>
  );
}
