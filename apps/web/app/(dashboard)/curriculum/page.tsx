'use client';

import React, { useEffect, useState } from "react";
import { Alert, useToast } from "@aletheia/ui";
import type {
  AcademicYearResponseDto,
  CreateObjectiveDto,
  CreateSubjectDto,
  LearnerPlanResponseDto,
  LearnerSummaryDto,
  ObjectiveResponseDto,
  ObjectiveStatus,
  PedagogicalFramework,
  SubjectResponseDto,
  UpdateObjectiveDto,
  UpdateSubjectDto,
} from "@aletheia/contracts";
import { ProductShell } from "../../../src/components/product-shell";
import { CurriculumView } from "../../../src/components/curriculum/curriculum-view";

export default function CurriculumPage() {
  const { toast } = useToast();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
  const [years, setYears] = useState<AcademicYearResponseDto[]>([]);
  const [activeYearId, setActiveYearId] = useState<string>("");
  const [subjects, setSubjects] = useState<SubjectResponseDto[]>([]);
  const [objectives, setObjectives] = useState<ObjectiveResponseDto[]>([]);
  const [learnerPlan, setLearnerPlan] = useState<LearnerPlanResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const storedFamilyId = localStorage.getItem("familyId");
        if (!storedFamilyId) {
          setLoading(false);
          return;
        }
        setFamilyId(storedFamilyId);

        // Load learners
        const learnersRes = await fetch(`/api/v1/families/${storedFamilyId}/learners`, {
          credentials: 'include',
        });
        if (learnersRes.ok) {
          const lData = await learnersRes.json();
          setLearners(lData);
          if (lData.length > 0 && !activeLearnerId) {
            setActiveLearnerId(lData[0].id);
          }
        } else {
          setLoadError("Não foi possível carregar os educandos.");
        }

        // Load academic years
        const yearsRes = await fetch(`/api/v1/families/${storedFamilyId}/curriculum/academic-years`, {
          credentials: 'include',
        });
        if (yearsRes.ok) {
          const yData: AcademicYearResponseDto[] = await yearsRes.json();
          if (yData.length > 0) {
            setYears(yData);
            const current = yData.find((y) => y.isCurrent) || yData[0]!;
            setActiveYearId(current.id);
          } else {
            // A brand-new family has no academic year yet — provision the
            // current one instead of leaving activeYearId empty, which
            // would silently break objective creation (it requires a real
            // academicYearId).
            const currentRes = await fetch(
              `/api/v1/families/${storedFamilyId}/curriculum/academic-years/current`,
              { credentials: 'include' },
            );
            if (currentRes.ok) {
              const created: AcademicYearResponseDto = await currentRes.json();
              setYears([created]);
              setActiveYearId(created.id);
            } else {
              setLoadError("Não foi possível carregar os anos letivos.");
            }
          }
        } else {
          setLoadError("Não foi possível carregar os anos letivos.");
        }

        // Load subjects
        const subjectsRes = await fetch(`/api/v1/families/${storedFamilyId}/curriculum/subjects`, {
          credentials: 'include',
        });
        if (subjectsRes.ok) {
          const sData = await subjectsRes.json();
          setSubjects(sData);
        } else {
          setLoadError("Não foi possível carregar as disciplinas.");
        }
      } catch {
        setLoadError("Não foi possível carregar o currículo. Verifique sua conexão.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadLearnerObjectives() {
      if (!familyId || !activeYearId) return;
      try {
        const queryParams = new URLSearchParams({ academicYearId: activeYearId });
        if (activeLearnerId) queryParams.append("learnerId", activeLearnerId);

        const objRes = await fetch(`/api/v1/families/${familyId}/curriculum/objectives?${queryParams.toString()}`, {
          credentials: 'include',
        });
        if (objRes.ok) {
          const oData = await objRes.json();
          setObjectives(oData);
        }

        if (activeLearnerId) {
          const planRes = await fetch(`/api/v1/families/${familyId}/curriculum/plans?learnerId=${activeLearnerId}&academicYearId=${activeYearId}`, {
            credentials: 'include',
          });
          if (planRes.ok) {
            const pData = await planRes.json();
            setLearnerPlan(pData);
          }
        }
      } catch {
        // ignore error
      }
    }
    loadLearnerObjectives();
  }, [familyId, activeYearId, activeLearnerId]);

  const activeLearner = learners.find((l) => l.id === activeLearnerId) || null;

  const handleApplyTemplate = async (template: PedagogicalFramework) => {
    if (!familyId || !activeLearnerId || !activeYearId) return;
    await fetch(`/api/v1/families/${familyId}/curriculum/templates/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ learnerId: activeLearnerId, academicYearId: activeYearId, template }),
    });

    // Refresh subjects & objectives
    const sRes = await fetch(`/api/v1/families/${familyId}/curriculum/subjects`, { credentials: 'include' });
    if (sRes.ok) setSubjects(await sRes.json());
    const oRes = await fetch(`/api/v1/families/${familyId}/curriculum/objectives?learnerId=${activeLearnerId}&academicYearId=${activeYearId}`, { credentials: 'include' });
    if (oRes.ok) setObjectives(await oRes.json());
  };

  const handleCreateSubject = async (dto: CreateSubjectDto) => {
    if (!familyId) return;
    const res = await fetch(`/api/v1/families/${familyId}/curriculum/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao criar disciplina.');
    }
    const created = await res.json();
    setSubjects((prev) => [...prev, created]);
  };

  const handleUpdateSubject = async (subjectId: string, dto: UpdateSubjectDto) => {
    if (!familyId) return;
    const res = await fetch(`/api/v1/families/${familyId}/curriculum/subjects/${subjectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao atualizar disciplina.');
    }
    const updated = await res.json();
    setSubjects((prev) => prev.map((s) => (s.id === subjectId ? updated : s)));
  };

  const handleArchiveSubject = async (subjectId: string) => {
    if (!familyId) return;
    try {
      const res = await fetch(`/api/v1/families/${familyId}/curriculum/subjects/${subjectId}/archive`, {
        method: "POST",
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao arquivar disciplina.');
      }
      setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
      toast({ variant: 'success', title: 'Disciplina arquivada.' });
    } catch (err: unknown) {
      toast({
        variant: 'error',
        title: err instanceof Error ? err.message : 'Falha ao arquivar disciplina.',
      });
    }
  };

  const handleCreateObjective = async (dto: CreateObjectiveDto) => {
    if (!familyId) return;
    const res = await fetch(`/api/v1/families/${familyId}/curriculum/objectives`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao criar objetivo.');
    }
    const created = await res.json();
    setObjectives((prev) => [...prev, created]);
  };

  const handleUpdateObjective = async (objectiveId: string, dto: UpdateObjectiveDto) => {
    if (!familyId) return;
    const res = await fetch(`/api/v1/families/${familyId}/curriculum/objectives/${objectiveId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao atualizar objetivo.');
    }
    const updated = await res.json();
    setObjectives((prev) => prev.map((o) => (o.id === objectiveId ? updated : o)));
  };

  const handleToggleObjectiveStatus = async (objectiveId: string, nextStatus: ObjectiveStatus) => {
    if (!familyId) return;
    try {
      const res = await fetch(`/api/v1/families/${familyId}/curriculum/objectives/${objectiveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao atualizar status do objetivo.');
      }
      const updated = await res.json();
      setObjectives((prev) => prev.map((o) => (o.id === objectiveId ? updated : o)));
    } catch (err: unknown) {
      toast({
        variant: 'error',
        title: err instanceof Error ? err.message : 'Falha ao atualizar status do objetivo.',
      });
    }
  };

  const handleDeleteObjective = async (objectiveId: string) => {
    if (!familyId) return;
    try {
      const res = await fetch(`/api/v1/families/${familyId}/curriculum/objectives/${objectiveId}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao excluir objetivo.');
      }
      setObjectives((prev) => prev.filter((o) => o.id !== objectiveId));
      toast({ variant: 'success', title: 'Objetivo excluído.' });
    } catch (err: unknown) {
      toast({
        variant: 'error',
        title: err instanceof Error ? err.message : 'Falha ao excluir objetivo.',
      });
    }
  };

  return (
    <ProductShell
      learners={learners}
      activeLearnerId={activeLearnerId}
      onSelectLearner={setActiveLearnerId}
    >
      {loadError && (
        <Alert variant="error" style={{ margin: "1rem" }}>
          {loadError}
        </Alert>
      )}
      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center" }}>Carregando plano curricular...</div>
      ) : (
        <CurriculumView
          years={years}
          activeYearId={activeYearId}
          onSelectYear={setActiveYearId}
          subjects={subjects}
          objectives={objectives}
          activeLearner={activeLearner}
          learnerPlan={learnerPlan}
          onApplyTemplate={handleApplyTemplate}
          onCreateSubject={handleCreateSubject}
          onUpdateSubject={handleUpdateSubject}
          onArchiveSubject={handleArchiveSubject}
          onCreateObjective={handleCreateObjective}
          onUpdateObjective={handleUpdateObjective}
          onToggleObjectiveStatus={handleToggleObjectiveStatus}
          onDeleteObjective={handleDeleteObjective}
        />
      )}
    </ProductShell>
  );
}
