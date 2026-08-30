import React from "react";
import type { Meta } from "@storybook/react";
import { User, BookOpen, Calendar, Clock } from "lucide-react";
import { DataList } from "../components/data-list.js";

const meta: Meta = {
  title: "Components/DataList",
  component: DataList,
  parameters: {
    docs: {
      description: {
        component: "Key-value pair data presentation using accessible definition list dl/dt/dd semantics.",
      },
    },
  },
};

export default meta;

export const Default = () => (
  <div style={{ maxWidth: "28rem" }}>
    <DataList
      items={[
        { id: "1", label: "Educando", value: "Samuel Santos", icon: <User size={16} /> },
        { id: "2", label: "Etapa Pedagógica", value: "Gramática", helperText: "Ciclo Fundamental 1" },
        { id: "3", label: "Currículo Base", value: "Trivium Clássico", icon: <BookOpen size={16} /> },
        { id: "4", label: "Meta Diária", value: "4 horas (240 min)", icon: <Clock size={16} /> },
      ]}
    />
  </div>
);

export const MultiColumn = () => (
  <div style={{ maxWidth: "48rem" }}>
    <DataList
      columns={2}
      items={[
        { id: "1", label: "Ano Letivo", value: "2026", icon: <Calendar size={16} /> },
        { id: "2", label: "Dias Cumpridos", value: "142 de 200 dias" },
        { id: "3", label: "Horas Totais", value: "568 horas" },
        { id: "4", label: "Frequência", value: "98.5%" },
      ]}
    />
  </div>
);
