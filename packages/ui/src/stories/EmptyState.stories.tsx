import React from "react";
import type { Meta } from "@storybook/react";
import { Plus, BookOpen } from "lucide-react";
import { EmptyState } from "../components/empty-state.js";
import { Button } from "../components/button.js";

const meta: Meta = {
  title: "Components/EmptyState",
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component: "Illustrated placeholder state for zero-data views, initial onboarding, and empty filtered queries.",
      },
    },
  },
};

export default meta;

export const Default = () => (
  <EmptyState
    title="Nenhum educando cadastrado"
    description="Comece adicionando os educandos da família para organizar cronogramas e diários."
  />
);

export const WithAction = () => (
  <EmptyState
    title="Nenhuma lição para hoje"
    description="O plano de aprendizagem está livre. Você pode programar novas atividades ou aproveitar o dia."
    action={
      <Button leftIcon={<Plus size={16} />}>
        Nova Lição
      </Button>
    }
  />
);

export const CustomIcon = () => (
  <EmptyState
    icon={<BookOpen size={40} style={{ color: "var(--color-brand-forest)" }} />}
    title="Biblioteca Vazia"
    description="Adicione livros clássicos e referências pedagógicas à sua estante digital."
    action={
      <Button variant="secondary" leftIcon={<Plus size={16} />}>
        Explorar Catálogo
      </Button>
    }
  />
);
