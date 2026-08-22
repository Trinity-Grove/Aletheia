import type { HealthResponse as HealthResponseContract } from '@aletheia/contracts';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'HealthResponse' })
export class HealthResponseDto implements HealthResponseContract {
  @ApiProperty({ enum: ['ok'] })
  status!: 'ok';

  @ApiProperty({ enum: ['aletheia-api'] })
  service!: 'aletheia-api';

  @ApiProperty()
  version!: string;

  @ApiProperty({ format: 'date-time' })
  timestamp!: string;
}
