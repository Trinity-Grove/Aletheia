import React, { useState } from "react";
import type { Meta } from "@storybook/react";
import { ActivityList, type DailyActivityItem } from "../patterns/activity-list.js";

const meta: Meta = {
  title: "Patterns/ActivityList",
  component: ActivityList,
  parameters: {
    docs: {
      description: {
        component: "Pattern presenting today sequence of devotional readings, lessons, and routines with interactive completion toggles.",
      },
    },
  },
};

export default meta;

const sampleActivities: DailyActivityItem[] = [
  {
    id: "1",
    title: "Leitura Bíblica: Salmos 19-23",
    subjectName: "Devocional",
    time: "08:00",
    durationMinutes: 20,
    completed: true,
    type: "devotional",
  },
  {
    id: "2",
    title: "Gramática: Substantivos e Adjetivos em Latim",
    subjectName: "Latim",
    time: "08:30",
    durationMinutes: 45,
    completed: true,
    type: "lesson",
  },
  {
    id: "3",
    title: "Matemática: Frações e Proporções",
    subjectName: "Aritmética",
    time: "09:30",
    durationMinutes: 50,
    completed: false,
    type: "lesson",
  },
  {
    id: "4",
    title: "História Antiga: As Pirâmides de Gizé",
    subjectName: "História",
    time: "10:30",
    durationMinutes: 40,
    completed: false,
    type: "lesson",
  },
  {
    id: "5",
    title: "Caminhada e Observação da Natureza",
    subjectName: "Ciências Naturais",
    time: "14:00",
    durationMinutes: 35,
    completed: false,
    type: "routine",
  },
];

export const Default = () => {
  const [activities, setActivities] = useState(sampleActivities);

  const handleToggle = (id: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    );
  };

  return (
    <div style={{ maxWidth: "42rem" }}>
      <ActivityList activities={activities} onToggleComplete={handleToggle} />
    </div>
  );
};

export const AllCompleted = () => (
  <div style={{ maxWidth: "42rem" }}>
    <ActivityList
      activities={sampleActivities.map((a) => ({ ...a, completed: true }))}
      onToggleComplete={() => {}}
    />
  </div>
);

export const Empty = () => (
  <div style={{ maxWidth: "42rem" }}>
    <ActivityList activities={[]} />
  </div>
);
