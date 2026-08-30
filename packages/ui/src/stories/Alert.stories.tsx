import React from "react";
import type { Meta } from "@storybook/react";
import { Alert } from "../components/alert.js";
import { BookOpen } from "lucide-react";

const meta: Meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: {
    docs: {
      description: {
        component: "Contextual feedback alerts for information, success, warning, and error states with accessible role=alert.",
      },
    },
  },
};

export default meta;

export const Default = () => (
  <Alert title="Informação">
    O período letivo de outono começará na próxima segunda-feira.
  </Alert>
);

export const AllVariants = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "36rem" }}>
    <Alert variant="info" title="Informação">
      Novas lições foram adicionadas ao currículo de Gramática.
    </Alert>

    <Alert variant="success" title="Concluído com Sucesso">
      Todas as metas pedagógicas da semana foram atingidas!
    </Alert>

    <Alert variant="warning" title="Atenção Necessária">
      Há 2 registros diários pendentes de validação pelo tutor.
    </Alert>

    <Alert variant="error" title="Erro no Registro">
      Não foi possível salvar o progresso. Verifique a conexão.
    </Alert>
  </div>
);

export const WithoutTitle = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "36rem" }}>
    <Alert variant="info">
      Lembre-se de registrar o tempo de leitura bíblica de hoje.
    </Alert>
    <Alert variant="success">
      Meta diária de 240 minutos alcançada!
    </Alert>
  </div>
);

export const CustomIcon = () => (
  <Alert
    variant="info"
    icon={<BookOpen size={18} />}
    title="Leitura Devocional"
  >
    Salmo 119:105 - &quot;Lâmpada para os meus pés é tua palavra e luz, para o meu caminho.&quot;
  </Alert>
);
