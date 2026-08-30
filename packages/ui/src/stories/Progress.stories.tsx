import React from "react";
import type { Meta } from "@storybook/react";
import { Progress } from "../components/progress.js";

const meta: Meta = {
  title: "Components/Progress",
  component: Progress,
  parameters: {
    docs: {
      description: {
        component: "Determinate progress bar with WCAG-compliant role=progressbar and aria values.",
      },
    },
  },
};

export default meta;

export const Default = () => (
  <div style={{ maxWidth: "24rem" }}>
    <Progress value={65} label="Progresso do currículo de História" />
  </div>
);

export const States = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "24rem" }}>
    <div>
      <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>0% - Início</span>
      <Progress value={0} label="0% concluído" />
    </div>
    <div>
      <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>35% - Em andamento</span>
      <Progress value={35} label="35% concluído" />
    </div>
    <div>
      <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>75% - Quase completo</span>
      <Progress value={75} label="75% concluído" />
    </div>
    <div>
      <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>100% - Meta atingida</span>
      <Progress value={100} label="100% concluído" />
    </div>
  </div>
);
