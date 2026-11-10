import type { HTMLAttributes } from "react";

export function Card({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`shadow-soft rounded-2xl bg-surface ${className}`}
      {...rest}
    />
  );
}
