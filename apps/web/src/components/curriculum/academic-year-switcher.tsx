import React from "react";
import type { AcademicYearResponseDto } from "@aletheia/contracts";

export interface AcademicYearSwitcherProps {
  years: AcademicYearResponseDto[];
  activeYearId: string;
  onSelectYear: (yearId: string) => void;
  onCreateYear?: () => void;
}

export function AcademicYearSwitcher({
  years,
  activeYearId,
  onSelectYear,
  onCreateYear,
}: AcademicYearSwitcherProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <label htmlFor="academic-year-select" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#4B5563" }}>
        Ano Letivo:
      </label>
      <select
        id="academic-year-select"
        data-testid="academic-year-select"
        value={activeYearId}
        onChange={(e) => onSelectYear(e.target.value)}
        style={{
          padding: "0.375rem 0.75rem",
          borderRadius: "0.375rem",
          border: "1px solid #D1D5DB",
          backgroundColor: "#FFFFFF",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "#1F2937",
          cursor: "pointer",
        }}
      >
        {years.map((y) => (
          <option key={y.id} value={y.id}>
            {y.title} {y.isCurrent ? "(Atual)" : ""}
          </option>
        ))}
      </select>
      {onCreateYear && (
        <button
          type="button"
          onClick={onCreateYear}
          data-testid="create-year-btn"
          style={{
            padding: "0.375rem 0.625rem",
            borderRadius: "0.375rem",
            border: "1px solid #D1D5DB",
            backgroundColor: "#F9FAFB",
            fontSize: "0.75rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + Novo Ano
        </button>
      )}
    </div>
  );
}
