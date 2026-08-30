import React from "react";
import type { Meta } from "@storybook/react";
import { HelpCircle, Info } from "lucide-react";
import { Tooltip } from "../components/tooltip.js";
import { Button } from "../components/button.js";
import { IconButton } from "../components/icon-button.js";

const meta: Meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component: "Hover and focus accessible helper text with aria-describedby linkage and directional positioning.",
      },
    },
  },
};

export default meta;

export const Default = () => (
  <div style={{ padding: "3rem", display: "flex", gap: "2rem", alignItems: "center" }}>
    <Tooltip content="Clique para salvar as alterações realizadas na lição">
      <Button>Salvar Progresso</Button>
    </Tooltip>

    <Tooltip content="Ajuda sobre o cálculo da meta diária">
      <IconButton aria-label="Ajuda">
        <HelpCircle size={18} />
      </IconButton>
    </Tooltip>

    <Tooltip content="Informações sobre a etapa pedagógica">
      <IconButton aria-label="Informações">
        <Info size={18} />
      </IconButton>
    </Tooltip>
  </div>
);

export const Positions = () => (
  <div style={{ padding: "4rem", display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
    <Tooltip content="Tooltip no topo" position="top">
      <Button variant="outline">Topo</Button>
    </Tooltip>
    <Tooltip content="Tooltip à direita" position="right">
      <Button variant="outline">Direita</Button>
    </Tooltip>
    <Tooltip content="Tooltip abaixo" position="bottom">
      <Button variant="outline">Abaixo</Button>
    </Tooltip>
    <Tooltip content="Tooltip à esquerda" position="left">
      <Button variant="outline">Esquerda</Button>
    </Tooltip>
  </div>
);
