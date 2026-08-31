import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import {
  updateFamilySettingsSchema,
  type FamilySettingsResponseDto,
  type UpdateFamilySettingsDto,
} from "@aletheia/contracts";
import { JwtAuthGuard, FamilyTenantGuard } from "../../../platform/auth/index.js";
import { ZodValidationPipe } from "../../../platform/validation/index.js";
import { FamilySettingsService } from "../application/family-settings.service.js";

@Controller({ path: "families/:familyId/settings", version: "1" })
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
export class FamilySettingsController {
  constructor(private readonly settingsService: FamilySettingsService) {}

  @Get()
  async getSettings(@Param("familyId") familyId: string): Promise<FamilySettingsResponseDto> {
    return this.settingsService.getSettings(familyId);
  }

  @Patch()
  async updateSettings(
    @Param("familyId") familyId: string,
    @Body(new ZodValidationPipe(updateFamilySettingsSchema)) dto: UpdateFamilySettingsDto,
  ): Promise<FamilySettingsResponseDto> {
    return this.settingsService.updateSettings(familyId, dto);
  }
}
