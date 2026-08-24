import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { CreateFamilyDto, FamilyResponseDto } from '@aletheia/contracts';
import { FamilyService } from '../application/family.service.js';
import { JwtAuthGuard } from '../../../platform/auth/index.js';

@ApiTags('Families')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'families', version: '1' })
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new family aggregate with current guardian as owner' })
  @ApiResponse({ status: 201, description: 'Family created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(
    @Req() req: { user: { userId: string } },
    @Body() body: CreateFamilyDto,
  ): Promise<FamilyResponseDto> {
    return this.familyService.createFamily(req.user.userId, body);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List all families current guardian belongs to' })
  @ApiResponse({ status: 200, description: 'List of families.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMine(
    @Req() req: { user: { userId: string } },
  ): Promise<FamilyResponseDto[]> {
    return this.familyService.getMyFamilies(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific family' })
  @ApiResponse({ status: 200, description: 'Family details.' })
  @ApiResponse({ status: 403, description: 'Forbidden if not a member.' })
  @ApiResponse({ status: 404, description: 'Family not found.' })
  async getById(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ): Promise<FamilyResponseDto> {
    return this.familyService.getFamilyById(req.user.userId, id);
  }
}
