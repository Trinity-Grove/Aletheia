import React from "react";
import type { Meta } from "@storybook/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/card.js";
import { ScriptureCard } from "../components/scripture-card.js";
import { Button } from "../components/button.js";
import { Badge } from "../components/badge.js";

const meta: Meta = {
  title: "Components/Card",
  parameters: {
    docs: {
      description: {
        component: "Content containers with header, content, footer, shadow elevations, and scripture display variants.",
      },
    },
  },
};

export default meta;

export const Default = () => (
  <Card style={{ maxWidth: "24rem" }}>
    <CardHeader>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <CardTitle>História Antiga</CardTitle>
        <Badge variant="indigo">Gramática</Badge>
      </div>
      <CardDescription>Estudo da Mesopotâmia e Egito Antigo</CardDescription>
    </CardHeader>
    <CardContent>
      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
        Leitura guiada de capítulos 1 a 3 com narração oral e preenchimento da linha do tempo.
      </p>
    </CardContent>
    <CardFooter>
      <Button size="sm" variant="outline">Ver Detalhes</Button>
    </CardFooter>
  </Card>
);

export const Variants = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
    <Card variant="default">
      <CardHeader>
        <CardTitle>Default</CardTitle>
        <CardDescription>Borda sutil com fundo neutro</CardDescription>
      </CardHeader>
      <CardContent>Conteúdo do card padrão.</CardContent>
    </Card>

    <Card variant="bordered">
      <CardHeader>
        <CardTitle>Bordered</CardTitle>
        <CardDescription>Borda reforçada</CardDescription>
      </CardHeader>
      <CardContent>Conteúdo do card com borda explícita.</CardContent>
    </Card>

    <Card variant="flat">
      <CardHeader>
        <CardTitle>Flat</CardTitle>
        <CardDescription>Sem sombras ou elevação</CardDescription>
      </CardHeader>
      <CardContent>Conteúdo do card plano.</CardContent>
    </Card>

    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Elevated</CardTitle>
        <CardDescription>Com elevação e destaque</CardDescription>
      </CardHeader>
      <CardContent>Conteúdo do card elevado.</CardContent>
    </Card>

    <Card variant="glass">
      <CardHeader>
        <CardTitle>Glass</CardTitle>
        <CardDescription>Fundo translúcido com blur</CardDescription>
      </CardHeader>
      <CardContent>Conteúdo do card de efeito vidro.</CardContent>
    </Card>
  </div>
);

export const Shadows = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
    <Card shadow="none">
      <CardHeader><CardTitle>None</CardTitle></CardHeader>
      <CardContent>Sem sombra</CardContent>
    </Card>
    <Card shadow="sm">
      <CardHeader><CardTitle>Small</CardTitle></CardHeader>
      <CardContent>Sombra suave</CardContent>
    </Card>
    <Card shadow="md">
      <CardHeader><CardTitle>Medium</CardTitle></CardHeader>
      <CardContent>Sombra média</CardContent>
    </Card>
    <Card shadow="lg">
      <CardHeader><CardTitle>Large</CardTitle></CardHeader>
      <CardContent>Sombra pronunciada</CardContent>
    </Card>
  </div>
);

export const ScriptureCards = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "36rem" }}>
    <ScriptureCard
      verseText="O temor do SENHOR é o princípio da sabedoria, e o conhecimento do Santo é entendimento."
      citation="Provérbios 9:10"
    />
    <ScriptureCard
      verseText="Ensina a criança no caminho em que deve andar, e, ainda quando for velho, não se desviará dele."
      citation="Provérbios 22:6"
    />
  </div>
);
