import { Test } from '@nestjs/testing';
import { RoutineGeneratorService } from './routine-generator.service.js';
import { PrismaService } from '../../../platform/database/prisma.service.js';

describe('RoutineGeneratorService', () => {
  let service: RoutineGeneratorService;
  let prisma: any;

  const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const LEARNER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const ACADEMIC_YEAR_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  beforeEach(async () => {
    prisma = {
      subject: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'sub-' + Math.random().toString(36).substring(2, 7),
            familyId: data.familyId,
            name: data.name,
            color: data.color,
          }),
        ),
      },
      weeklyScheduleSlot: {
        deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'slot-' + Math.random().toString(36).substring(2, 7),
            familyId: data.familyId,
            academicYearId: data.academicYearId,
            subjectId: data.subjectId,
            learnerId: data.learnerId,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            title: data.title,
            description: data.description,
            color: data.color,
            location: data.location,
            createdAt: new Date('2026-09-18T10:00:00Z'),
            updatedAt: new Date('2026-09-18T10:00:00Z'),
            subject: data.subjectId ? { name: data.title } : null,
            learner: null,
          }),
        ),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RoutineGeneratorService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = moduleRef.get<RoutineGeneratorService>(RoutineGeneratorService);
  });

  describe('suggestRoutine', () => {
    it('generates Charlotte Mason routine by default with devotional and project fridays', async () => {
      const result = await service.suggestRoutine(FAMILY_ID, {
        pedagogicalModelCode: 'CHARLOTTE_MASON',
        startHour: '08:30',
        lessonDurationMinutes: 25,
        includeDevotional: true,
        fridaysForProjects: true,
      });

      expect(result.slots.length).toBeGreaterThan(10);
      expect(result.pedagogicalRationale).toContain('Charlotte Mason');
      expect(result.totalInstructionalHoursWeekly).toBeGreaterThan(10);

      // Check day 1 (Monday) starts with devotional at 08:30
      const mondaySlots = result.slots.filter((s) => s.dayOfWeek === 1);
      expect(mondaySlots[0]?.slotType).toBe('DEVOTIONAL');
      expect(mondaySlots[0]?.startTime).toBe('08:30');
      expect(mondaySlots[0]?.endTime).toBe('08:45');

      // Second slot is analytical subject (e.g. Matemática or Gramática)
      expect(mondaySlots[1]?.slotType).toBe('INSTRUCTION');
      expect(mondaySlots[1]?.startTime).toBe('08:45');

      // Friday (day 5) has project and nature blocks
      const fridaySlots = result.slots.filter((s) => s.dayOfWeek === 5);
      const hasNatureOrProject = fridaySlots.some(
        (s) => s.slotType === 'OUTDOOR_HABIT' || s.slotType === 'PROJECT_TRADES',
      );
      expect(hasNatureOrProject).toBe(true);
    });

    it('generates Classical routine with Trivium focus', async () => {
      const result = await service.suggestRoutine(FAMILY_ID, {
        pedagogicalModelCode: 'CLASSICAL',
        startHour: '08:00',
        lessonDurationMinutes: 45,
        includeDevotional: true,
        fridaysForProjects: false,
      });

      expect(result.pedagogicalRationale).toMatch(/Clássic|Trivium/i);
      const mondaySlots = result.slots.filter((s) => s.dayOfWeek === 1);
      const instructionSlot = mondaySlots.find((s) => s.slotType === 'INSTRUCTION');
      expect(instructionSlot).toBeDefined();
      // Should calculate total weekly hours
      expect(result.totalInstructionalHoursWeekly).toBeGreaterThan(12);
    });

    it('generates Montessori routine with extended immersion cycles', async () => {
      const result = await service.suggestRoutine(FAMILY_ID, {
        pedagogicalModelCode: 'MONTESSORI',
        startHour: '09:00',
        lessonDurationMinutes: 50,
        includeDevotional: false,
        fridaysForProjects: true,
      });

      expect(result.pedagogicalRationale).toMatch(/Montessori|ciclo|imersão/i);
      // No devotional since includeDevotional is false
      const devotionalSlots = result.slots.filter((s) => s.slotType === 'DEVOTIONAL');
      expect(devotionalSlots).toHaveLength(0);

      // Starts direct instruction at 09:00
      const mondaySlots = result.slots.filter((s) => s.dayOfWeek === 1);
      expect(mondaySlots[0]?.startTime).toBe('09:00');
    });

    it('generates standard academic Friday when fridaysForProjects is false', async () => {
      const result = await service.suggestRoutine(FAMILY_ID, {
        pedagogicalModelCode: 'CHARLOTTE_MASON',
        fridaysForProjects: false,
        includeDevotional: true,
      });

      const fridaySlots = result.slots.filter((s) => s.dayOfWeek === 5);
      const instructionCount = fridaySlots.filter((s) => s.slotType === 'INSTRUCTION').length;
      expect(instructionCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('applySuggestedRoutine', () => {
    it('deletes existing slots and creates new slots with subject mapping', async () => {
      const slots = [
        {
          dayOfWeek: 1,
          startTime: '08:30',
          endTime: '08:45',
          subjectName: 'Devocional Familiar',
          subjectColor: '#4F46E5',
          slotType: 'DEVOTIONAL' as const,
          notes: 'Leitura bíblica matinal',
        },
        {
          dayOfWeek: 1,
          startTime: '08:45',
          endTime: '09:15',
          subjectName: 'Matemática',
          subjectColor: '#2563EB',
          slotType: 'INSTRUCTION' as const,
        },
      ];

      const result = await service.applySuggestedRoutine(FAMILY_ID, {
        learnerId: LEARNER_ID,
        academicYearId: ACADEMIC_YEAR_ID,
        replaceExisting: true,
        slots,
      });

      expect(prisma.weeklyScheduleSlot.deleteMany).toHaveBeenCalledWith({
        where: {
          familyId: FAMILY_ID,
          learnerId: LEARNER_ID,
          academicYearId: ACADEMIC_YEAR_ID,
        },
      });

      expect(prisma.weeklyScheduleSlot.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0]?.dayOfWeek).toBe(1);
      expect(result[0]?.title).toBe('Devocional Familiar');
    });

    it('reuses existing family subjects instead of duplicating them', async () => {
      prisma.subject.findFirst.mockResolvedValueOnce({
        id: 'existing-math-id',
        familyId: FAMILY_ID,
        name: 'Matemática',
        color: '#2563EB',
      });

      const slots = [
        {
          dayOfWeek: 2,
          startTime: '09:00',
          endTime: '09:30',
          subjectName: 'Matemática',
          subjectColor: '#2563EB',
          slotType: 'INSTRUCTION' as const,
        },
      ];

      await service.applySuggestedRoutine(FAMILY_ID, {
        replaceExisting: false,
        slots,
      });

      expect(prisma.weeklyScheduleSlot.deleteMany).not.toHaveBeenCalled();
      expect(prisma.subject.create).not.toHaveBeenCalled();
      expect(prisma.weeklyScheduleSlot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subjectId: 'existing-math-id',
            title: 'Matemática',
          }),
        }),
      );
    });
  });
});
