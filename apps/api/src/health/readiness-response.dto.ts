import type { DependencyState, ReadinessResponse } from '@aletheia/contracts';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

const dependencyStates: DependencyState[] = [
  'up',
  'down',
  'degraded',
  'not_configured',
];

@ApiSchema({ name: 'ReadinessDependencies' })
export class ReadinessDependenciesDto {
  @ApiProperty({ enum: dependencyStates })
  postgres!: DependencyState;

  @ApiProperty({ enum: dependencyStates })
  redis!: DependencyState;

  @ApiProperty({ enum: dependencyStates })
  objectStorage!: DependencyState;
}

@ApiSchema({ name: 'ReadinessResponse' })
export class ReadinessResponseDto implements ReadinessResponse {
  @ApiProperty({ enum: ['ready', 'degraded', 'not-ready'] })
  status!: ReadinessResponse['status'];

  @ApiProperty({ type: () => ReadinessDependenciesDto })
  dependencies!: ReadinessDependenciesDto;
}
