import React from "react";
import type { Meta } from "@storybook/react";
import { Plus } from "lucide-react";
import { PageHeader } from "../components/page-header.js";
import { SectionHeader } from "../components/section-header.js";
import { Button } from "../components/button.js";
import { Badge } from "../components/badge.js";

const meta: Meta = {
  title: "Components/PageHeader",
  parameters: {
    docs: {
      description: {
        component: "Page and Section headers establishing visual hierarchy, eyebrows, title, description, and primary page actions.",
      },
    },
  },
};

export default meta;

export const PageHeaderDefault = () => (
  <PageHeader
    eyebrow="Trinity Grove Academy"
    title="Diário de Aprendizagem"
    description="Registro contínuo das atividades pedagógicas, tempos de instrução e conquistas diárias."
    action={
      <Button leftIcon={<Plus size={16} />}>
        Nova Atividade
      </Button>
    }
  />
);

export const PageHeaderSimple = () => (
  <PageHeader
    title="Configurações da Família"
    description="Gerencie educandos, matérias e preferências do sistema."
  />
);

export const SectionHeaderDefault = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "48rem" }}>
    <SectionHeader
      title="Atividades Acadêmicas"
      description="Lições programadas para o período matutino"
      badge={<Badge variant="indigo">3 Atividades</Badge>}
      action={<Button size="sm" variant="outline">Ver Todas</Button>}
    />

    <SectionHeader
      title="Devocionais em Família"
      description="Leituras bíblicas e memorização de versículos"
      badge={<Badge variant="emerald" dot>Concluído</Badge>}
    />
  </div>
);
