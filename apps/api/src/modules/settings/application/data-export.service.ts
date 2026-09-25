import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateExportJobDto,
  DataExportJobResponseDto,
  FamilyDataExportPackageDto,
} from '@aletheia/contracts';
import { DataExportRepository } from '../infrastructure/data-export.repository.js';
import { PRIVACY_PUBLIC_API, type PrivacyPublicApi } from '../../privacy/application/public-api.js';

@Injectable()
export class DataExportService {
  constructor(
    private readonly dataExportRepository: DataExportRepository,
    @Inject(PRIVACY_PUBLIC_API) private readonly privacyPublicApi: PrivacyPublicApi,
  ) {}

  async createExportJob(
    familyId: string,
    requestedById: string,
    _dto?: CreateExportJobDto,
  ): Promise<DataExportJobResponseDto> {
    const job = await this.dataExportRepository.createJob(familyId, requestedById);
    await this.privacyPublicApi.recordSensitiveDataAccess({
      actorUserId: requestedById,
      familyId,
      action: 'CREATE',
      resourceType: 'DATA_EXPORT_PACKAGE',
      resourceId: job.id,
    });
    return job.toResponseDto();
  }

  async getExportJob(familyId: string, id: string): Promise<DataExportJobResponseDto> {
    const job = await this.dataExportRepository.findById(familyId, id);
    if (!job) {
      throw new NotFoundException(`Data export job with ID ${id} not found.`);
    }
    return job.toResponseDto();
  }

  async listExportJobs(familyId: string, limit = 20): Promise<DataExportJobResponseDto[]> {
    const jobs = await this.dataExportRepository.findRecentJobs(familyId, limit);
    return jobs.map((job) => job.toResponseDto());
  }

  async exportFamilyData(familyId: string, actorUserId: string): Promise<FamilyDataExportPackageDto> {
    const data = await this.dataExportRepository.aggregateFamilyData(familyId);
    await this.privacyPublicApi.recordSensitiveDataAccess({
      actorUserId,
      familyId,
      action: 'EXPORT',
      resourceType: 'DATA_EXPORT_PACKAGE',
    });
    return data;
  }

  async processExportJob(
    familyId: string,
    id: string,
  ): Promise<{ job: DataExportJobResponseDto; data: FamilyDataExportPackageDto }> {
    const job = await this.dataExportRepository.findById(familyId, id);
    if (!job) {
      throw new NotFoundException(`Data export job with ID ${id} not found.`);
    }

    await this.dataExportRepository.updateJob(familyId, id, {
      status: 'PROCESSING',
    });

    try {
      const data = await this.dataExportRepository.aggregateFamilyData(familyId);
      const jsonString = JSON.stringify(data);
      const fileSizeBytes = Buffer.byteLength(jsonString, 'utf8');
      const downloadUrl = `/api/v1/families/${familyId}/backup/export-jobs/${id}/download`;

      const completedJob = await this.dataExportRepository.updateJob(familyId, id, {
        status: 'COMPLETED',
        downloadUrl,
        fileSizeBytes,
        completedAt: new Date(),
        errorReason: null,
      });

      if (!completedJob) {
        throw new NotFoundException(`Data export job with ID ${id} not found after processing.`);
      }

      return {
        job: completedJob.toResponseDto(),
        data,
      };
    } catch (error) {
      const errorReason = error instanceof Error ? error.message : 'Unknown export error';
      await this.dataExportRepository.updateJob(familyId, id, {
        status: 'FAILED',
        errorReason,
        completedAt: new Date(),
      });
      throw error;
    }
  }
}
