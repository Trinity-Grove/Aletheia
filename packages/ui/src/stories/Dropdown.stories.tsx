import React from "react";
import type { Meta } from "@storybook/react";
import { MoreVertical, Edit2, Copy, Trash2, Download } from "lucide-react";
import { Dropdown } from "../components/dropdown.js";
import { Button } from "../components/button.js";
import { IconButton } from "../components/icon-button.js";

const meta: Meta = {
  title: "Components/Dropdown",
  component: Dropdown,
  parameters: {
    docs: {
      description: {
        component: "Contextual disclosure menu with full keyboard navigation (arrows, Enter, Escape) and accessible WAI-ARIA menu semantics.",
      },
    },
  },
};

export default meta;

export const Default = () => (
  <div style={{ padding: "2rem" }}>
    <Dropdown
      trigger={<Button variant="outline">Ações da Lição</Button>}
      items={[
        { id: "edit", label: "Editar Lição", icon: <Edit2 size={16} />, onClick: () => alert("Editar") },
        { id: "duplicate", label: "Duplicar para Amanhã", icon: <Copy size={16} />, onClick: () => alert("Duplicar") },
        { id: "export", label: "Exportar PDF", icon: <Download size={16} />, onClick: () => alert("Exportar") },
        { id: "delete", label: "Excluir Lição", icon: <Trash2 size={16} />, danger: true, onClick: () => alert("Excluir") },
      ]}
    />
  </div>
);

export const IconButtonTrigger = () => (
  <div style={{ padding: "2rem" }}>
    <Dropdown
      align="right"
      trigger={
        <IconButton aria-label="Mais opções" size="sm">
          <MoreVertical size={16} />
        </IconButton>
      }
      items={[
        { id: "view", label: "Ver Diário" },
        { id: "edit", label: "Editar Dados" },
        { id: "archive", label: "Arquivar Educando", danger: true },
      ]}
    />
  </div>
);
