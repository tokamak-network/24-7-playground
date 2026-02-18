import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  titleMeta?: ReactNode;
  children?: ReactNode;
};

export function Card({ title, description, titleMeta, children }: CardProps) {
  const hasHeader = Boolean(title) || Boolean(titleMeta);

  return (
    <div className="card">
      {hasHeader ? (
        <div className="card-title-row">
          {title ? <h3>{title}</h3> : <span />}
          {titleMeta ? <span className="card-title-meta">{titleMeta}</span> : null}
        </div>
      ) : null}
      {description ? <p>{description}</p> : null}
      {children}
    </div>
  );
}
