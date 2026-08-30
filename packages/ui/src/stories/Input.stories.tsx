import React, { useState } from "react";
import type { Meta } from "@storybook/react";
import { Mail, Lock, User, Search } from "lucide-react";
import { Input } from "../components/input.js";
import { Select } from "../components/select.js";
import { Textarea } from "../components/textarea.js";
import { Checkbox } from "../components/checkbox.js";
import { Switch } from "../components/switch.js";

const meta: Meta = {
  title: "Components/Forms",
  parameters: {
    docs: {
      description: {
        component: "Form primitives including Input, Select, Textarea, Checkbox, and Switch with full accessible labeling and error states.",
      },
    },
  },
};

export default meta;

export const TextInputs = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "24rem" }}>
    <Input
      label="Nome Completo"
      placeholder="Ex: Samuel Santos"
      helperText="Nome do educando para o relatório"
    />
    <Input
      label="Busca de Lições"
      placeholder="Pesquisar..."
      leftIcon={<Search size={16} />}
    />
    <Input
      label="E-mail"
      type="email"
      placeholder="voce@exemplo.com"
      leftIcon={<Mail size={16} />}
      defaultValue="contato@familia.com"
    />
    <Input
      label="Senha"
      type="password"
      placeholder="••••••••"
      leftIcon={<Lock size={16} />}
    />
    <Input
      label="Campo com Erro"
      error="O preenchimento deste campo é obrigatório."
      defaultValue="Valor inválido"
      leftIcon={<User size={16} />}
    />
    <Input
      label="Campo Desabilitado"
      disabled
      defaultValue="Texto fixo"
    />
  </div>
);

export const Selects = () => {
  const options = [
    { value: "grammar", label: "Gramática (Fase 1)" },
    { value: "logic", label: "Lógica (Fase 2)" },
    { value: "rhetoric", label: "Retórica (Fase 3)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "24rem" }}>
      <Select
        label="Etapa do Trivium"
        options={options}
        helperText="Selecione a fase pedagógica atual"
      />
      <Select
        label="Etapa com Erro"
        options={options}
        error="Por favor selecione uma etapa válida"
      />
      <Select
        label="Etapa Desabilitada"
        options={options}
        disabled
      />
    </div>
  );
};

export const Textareas = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "28rem" }}>
    <Textarea
      label="Observações Pedagógicas"
      placeholder="Descreva o progresso, dificuldades ou destaques da lição..."
      helperText="Máximo de 500 caracteres"
      rows={4}
    />
    <Textarea
      label="Notas com Erro"
      error="A descrição não pode ficar em branco"
      rows={3}
    />
  </div>
);

export const Checkboxes = () => {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Checkbox
        label="Lição concluída com sucesso"
        description="Registra os minutos dedicados no histórico do dia"
        checked={checked1}
        onChange={(e) => setChecked1(e.target.checked)}
      />
      <Checkbox
        label="Revisão ortográfica realizada"
        checked={checked2}
        onChange={(e) => setChecked2(e.target.checked)}
      />
      <Checkbox
        label="Opção obrigatória não marcada"
        error="Você precisa confirmar antes de avançar"
      />
      <Checkbox
        label="Opção desabilitada"
        disabled
      />
    </div>
  );
};

export const Switches = () => {
  const [enabled1, setEnabled1] = useState(true);
  const [enabled2, setEnabled2] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Switch
        label="Notificações diárias"
        description="Receba lembretes matinais sobre as atividades programadas"
        checked={enabled1}
        onChange={(e) => setEnabled1(e.target.checked)}
      />
      <Switch
        label="Modo silencioso"
        description="Silencia alertas de áudio durante lições cronometradas"
        checked={enabled2}
        onChange={(e) => setEnabled2(e.target.checked)}
      />
      <Switch
        label="Recurso desabilitado"
        description="Requer plano de tutoria ativa"
        disabled
        checked={false}
      />
    </div>
  );
};
