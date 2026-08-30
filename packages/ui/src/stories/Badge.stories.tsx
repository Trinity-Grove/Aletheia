import React from "react";
import type { Meta } from "@storybook/react";
import { Badge, type BadgeVariant } from "../components/badge.js";

const meta: Meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    docs: {
      description: {
        component: "Status badges, pills, and indicator chips supporting semantic color variants and status dots.",
      },
    },
  },
};

export default meta;

export const Default = () => <Badge>Badge Padrão</Badge>;

export const AllVariants = () => {
  const variants: BadgeVariant[] = ["indigo", "amber", "emerald", "slate", "rose"];

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
      {variants.map((v) => (
        <Badge key={v} variant={v}>
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </Badge>
      ))}
    </div>
  );
};

export const WithDots = () => {
  const variants: BadgeVariant[] = ["indigo", "amber", "emerald", "slate", "rose"];

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
      {variants.map((v) => (
        <Badge key={v} variant={v} dot>
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </Badge>
      ))}
    </div>
  );
};

export const Sizes = () => (
  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
    <Badge size="sm" variant="emerald" dot>Pequeno (sm)</Badge>
    <Badge size="md" variant="emerald" dot>Médio (md)</Badge>
    <Badge size="lg" variant="emerald" dot>Grande (lg)</Badge>
  </div>
);
