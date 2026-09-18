import { ScheduleController } from './schedule.controller.js';
import type {
  ApplySuggestedRoutineDto,
  CreateScheduleSlotDto,
  ScheduleSlotResponseDto,
  SuggestedRoutineResponseDto,
  SuggestRoutineInputDto,
} from '@aletheia/contracts';

describe('ScheduleController', () => {
  let controller: ScheduleController;
  let scheduleService: any;
  let routineGeneratorService: any;

  const FAMILY_ID = '11111111-1111-4111-8111-111111111111';
  const SLOT_ID = '22222222-2222-4222-8222-222222222222';

  const mockSlotResponse: ScheduleSlotResponseDto = {
    id: SLOT_ID,
    familyId: FAMILY_ID,
    dayOfWeek: 1,
    startTime: '08:30',
    endTime: '09:00',
    title: 'Matemática',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockSuggestedRoutine: SuggestedRoutineResponseDto = {
    slots: [
      {
        dayOfWeek: 1,
        startTime: '08:30',
        endTime: '08:45',
        subjectName: 'Devocional Familiar',
        subjectColor: '#4F46E5',
        slotType: 'DEVOTIONAL',
      },
    ],
    pedagogicalRationale: 'Rotina Charlotte Mason',
    totalInstructionalHoursWeekly: 14.5,
  };

  beforeEach(() => {
    scheduleService = {
      createSlot: jest.fn().mockResolvedValue(mockSlotResponse),
      listSlots: jest.fn().mockResolvedValue([mockSlotResponse]),
      getSlot: jest.fn().mockResolvedValue(mockSlotResponse),
      updateSlot: jest.fn().mockResolvedValue(mockSlotResponse),
      deleteSlot: jest.fn().mockResolvedValue(true),
      getDailyAgenda: jest.fn().mockResolvedValue({ date: '2026-09-18', items: [] }),
    };

    routineGeneratorService = {
      suggestRoutine: jest.fn().mockResolvedValue(mockSuggestedRoutine),
      applySuggestedRoutine: jest.fn().mockResolvedValue([mockSlotResponse]),
    };

    controller = new ScheduleController(scheduleService, routineGeneratorService);
  });

  describe('suggestRoutine', () => {
    it('delegates to RoutineGeneratorService.suggestRoutine', async () => {
      const input: SuggestRoutineInputDto = {
        pedagogicalModelCode: 'CHARLOTTE_MASON',
        startHour: '08:30',
      };

      const result = await controller.suggestRoutine(FAMILY_ID, input);

      expect(routineGeneratorService.suggestRoutine).toHaveBeenCalledWith(FAMILY_ID, input);
      expect(result).toEqual(mockSuggestedRoutine);
    });
  });

  describe('applySuggestedRoutine', () => {
    it('delegates to RoutineGeneratorService.applySuggestedRoutine', async () => {
      const input: ApplySuggestedRoutineDto = {
        replaceExisting: true,
        slots: mockSuggestedRoutine.slots,
      };

      const result = await controller.applySuggestedRoutine(FAMILY_ID, input);

      expect(routineGeneratorService.applySuggestedRoutine).toHaveBeenCalledWith(FAMILY_ID, input);
      expect(result).toEqual([mockSlotResponse]);
    });
  });

  describe('standard schedule CRUD', () => {
    it('calls createSlot', async () => {
      const dto: CreateScheduleSlotDto = {
        dayOfWeek: 1,
        startTime: '08:30',
        endTime: '09:00',
        title: 'Matemática',
      };
      const result = await controller.createSlot(FAMILY_ID, dto);
      expect(scheduleService.createSlot).toHaveBeenCalledWith(FAMILY_ID, dto);
      expect(result).toEqual(mockSlotResponse);
    });

    it('calls getSlots', async () => {
      const result = await controller.getSlots(FAMILY_ID, '1');
      expect(scheduleService.listSlots).toHaveBeenCalledWith(FAMILY_ID, { dayOfWeek: 1 });
      expect(result).toEqual([mockSlotResponse]);
    });
  });
});
