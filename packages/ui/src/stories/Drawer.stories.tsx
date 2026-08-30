import React, { useState } from "react";
import type { Meta } from "@storybook/react";
import { Drawer } from "../components/drawer.js";
import { Button } from "../components/button.js";
import { Input } from "../components/input.js";
import { Select } from "../components/select.js";

const meta: Meta = {
  title: "Components/Drawer",
  component: Drawer,
  parameters: {
    docs: {
      description: {
        component: "Slide-over drawer panel for secondary tasks, detailed views, and contextual filters.",
      },
    },
  },
};

export default meta;

export const Default = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Abrir Gaveta Lateral</Button>
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Filtros de Atividades"
        description="Filtre por matéria, educando e período de tempo."
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Limpar
            </Button>
            <Button onClick={() => setIsOpen(false)}>Aplicar Filtros</Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Input label="Busca por palavra-chave" placeholder="Ex: Matemática..." />
          <Select
            label="Matéria"
            options={[
              { value: "all", label: "Todas as Matérias" },
              { value: "math", label: "Matemática" },
              { value: "history", label: "História" },
              { value: "latin", label: "Latim" },
            ]}
          />
        </div>
      </Drawer>
    </div>
  );
};

export const PositionsAndSizes = () => {
  const [config, setConfig] = useState<{ position: "left" | "right"; size: "sm" | "md" | "lg" } | null>(null);

  return (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      <Button onClick={() => setConfig({ position: "right", size: "sm" })}>Direita (sm)</Button>
      <Button onClick={() => setConfig({ position: "right", size: "lg" })}>Direita (lg)</Button>
      <Button variant="secondary" onClick={() => setConfig({ position: "left", size: "md" })}>
        Esquerda (md)
      </Button>

      {config && (
        <Drawer
          isOpen={true}
          onClose={() => setConfig(null)}
          position={config.position}
          size={config.size}
          title={`Gaveta: ${config.position.toUpperCase()} (${config.size})`}
          description="Painel lateral posicionado dinamicamente."
        >
          <p>Exemplo de conteúdo para gaveta lateral.</p>
        </Drawer>
      )}
    </div>
  );
};
