import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import type {
  CreateExportJobDto,
  DataExportJobResponseDto,
  FamilyDataExportPackageDto,
} from "@aletheia/contracts";
import { JwtAuthGuard, FamilyTenantGuard } from "../../../platform/auth/index.js";
import { DataExportService } from "../application/data-export.service.js";

@Controller({ path: "families/:familyId/export", version: "1" })
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
export class DataExportController {
  constructor(private readonly dataExportService: DataExportService) {}

  @Post()
  async createExportJob(
    @Param("familyId") familyId: string,
    @Req() req: { user?: { userId?: string } },
    @Body() dto?: CreateExportJobDto,
  ): Promise<DataExportJobResponseDto> {
    const userId = req.user?.userId ?? "";
    return this.dataExportService.createExportJob(familyId, userId, dto);
  }

  @Get("package")
  async getFullExportPackage(
    @Param("familyId") familyId: string,
  ): Promise<FamilyDataExportPackageDto> {
    return this.dataExportService.exportFamilyData(familyId);
  }

  @Get(":id")
  async getExportJob(
    @Param("familyId") familyId: string,
    @Param("id") id: string,
  ): Promise<DataExportJobResponseDto> {
    return this.dataExportService.getExportJob(familyId, id);
  }

  @Get()
  async listExportJobs(
    @Param("familyId") familyId: string,
  ): Promise<DataExportJobResponseDto[]> {
    return this.dataExportService.listExportJobs(familyId);
  }
}
