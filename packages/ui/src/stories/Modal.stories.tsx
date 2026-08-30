import React, { useState } from "react";
import type { Meta } from "@storybook/react";
import { Modal } from "../components/modal.js";
import { Button } from "../components/button.js";
import { Input } from "../components/input.js";

const meta: Meta = {
  title: "Components/Modal",
  component: Modal,
  parameters: {
    docs: {
      description: {
        component: "Accessible modal dialog with focus trapping, backdrop blur, keyboard navigation (Escape), and customizable sizes.",
      },
    },
  },
};

export default meta;

export const Default = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Abrir Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Planejamento de Lição"
        description="Configure os detalhes da lição diária para o educando."
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsOpen(false)}>Salvar Lição</Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input label="Título da Lição" defaultValue="Gramática Latina: Declinações" />
          <Input label="Duração Estimada (min)" type="number" defaultValue="45" />
        </div>
      </Modal>
    </div>
  );
};

export const Sizes = () => {
  const [activeSize, setActiveSize] = useState<"sm" | "md" | "lg" | "xl" | null>(null);

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      {(["sm", "md", "lg", "xl"] as const).map((size) => (
        <Button key={size} variant="outline" onClick={() => setActiveSize(size)}>
          Modal ({size})
        </Button>
      ))}

      <Modal
        isOpen={activeSize !== null}
        onClose={() => setActiveSize(null)}
        maxWidth={activeSize || "md"}
        title={`Modal Tamanho: ${activeSize?.toUpperCase()}`}
        description="Exemplo demonstrando a variação de largura do diálogo."
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setActiveSize(null)}>Fechar</Button>
          </div>
        }
      >
        <p>Conteúdo interno dimensionado dinamicamente para o breakpoint escolhido.</p>
      </Modal>
    </div>
  );
};
