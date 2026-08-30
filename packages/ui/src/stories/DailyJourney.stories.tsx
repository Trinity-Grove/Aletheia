import React from "react";
import type { Meta } from "@storybook/react";
import { DailyJourney } from "../patterns/daily-journey.js";

const meta: Meta = {
  title: "Patterns/DailyJourney",
  component: DailyJourney,
  parameters: {
    docs: {
      description: {
        component: "Composite pattern displaying daily homeschool learning metrics: instruction time, completed lessons, and academic day sequence.",
      },
    },
  },
};

export default meta;

export const InProgress = () => (
  <div style={{ maxWidth: "36rem" }}>
    <DailyJourney
      completedMinutes={150}
      targetMinutes={240}
      completedLessons={3}
      totalLessons={5}
      daySequence={42}
    />
  </div>
);

export const CompletedGoal = () => (
  <div style={{ maxWidth: "36rem" }}>
    <DailyJourney
      completedMinutes={240}
      targetMinutes={240}
      completedLessons={5}
      totalLessons={5}
      daySequence={42}
    />
  </div>
);

export const DayBeginning = () => (
  <div style={{ maxWidth: "36rem" }}>
    <DailyJourney
      completedMinutes={0}
      targetMinutes={240}
      completedLessons={0}
      totalLessons={6}
      daySequence={43}
    />
  </div>
);

export const ZeroTargetFallback = () => (
  <div style={{ maxWidth: "36rem" }}>
    <DailyJourney
      completedMinutes={0}
      targetMinutes={0}
      completedLessons={0}
      totalLessons={0}
      daySequence={1}
    />
  </div>
);
