import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { BookOpen, Plus, Trash2, ArrowRight } from "lucide-react";
import { Button, type ButtonProps } from "../components/button.js";
import { IconButton } from "../components/icon-button.js";
import { TextLink } from "../components/text-link.js";

const meta: Meta<ButtonProps> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: "Primary action buttons, icon buttons, and text link primitives adhering to design system tokens and a11y standards.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<ButtonProps>;

export const Default: Story = {
  args: {
    children: "Salvar Lição",
    variant: "primary",
    size: "md",
  },
};

export const Variants = () => (
  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>
  </div>
);

export const Sizes = () => (
  <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
    <Button size="sm">Small (sm)</Button>
    <Button size="md">Medium (md)</Button>
    <Button size="lg">Large (lg)</Button>
  </div>
);

export const WithIcons = () => (
  <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
    <Button leftIcon={<BookOpen size={16} aria-hidden="true" />}>Iniciar Leitura</Button>
    <Button variant="secondary" rightIcon={<ArrowRight size={16} aria-hidden="true" />}>
      Próximo Passo
    </Button>
    <Button variant="outline" leftIcon={<Plus size={16} aria-hidden="true" />}>
      Novo Registro
    </Button>
  </div>
);

export const LoadingState = () => (
  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
    <Button isLoading>Salvando...</Button>
    <Button variant="secondary" isLoading>
      Processando
    </Button>
    <Button variant="outline" isLoading>
      Carregando
    </Button>
  </div>
);

export const DisabledState = () => (
  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
    <Button disabled>Desabilitado</Button>
    <Button variant="secondary" disabled>
      Desabilitado
    </Button>
    <Button variant="outline" disabled>
      Desabilitado
    </Button>
  </div>
);

export const IconButtons = () => (
  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
    <IconButton aria-label="Adicionar item" size="sm" icon={<Plus size={14} />} />
    <IconButton aria-label="Adicionar item" size="md" icon={<Plus size={16} />} />
    <IconButton aria-label="Adicionar item" size="lg" icon={<Plus size={20} />} />
    <IconButton aria-label="Excluir item" size="md" icon={<Trash2 size={16} />} />
  </div>
);

export const TextLinks = () => (
  <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
    <TextLink href="/dashboard">Voltar para o Início</TextLink>
    <TextLink href="/settings">Configurações da Conta</TextLink>
  </div>
);
