import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    title: z.string().min(1),
    count: z.number().int().nonnegative(),
  });

  it('returns the parsed value when it matches the schema', () => {
    const pipe = new ZodValidationPipe(schema);

    expect(pipe.transform({ title: 'Algebra', count: 3 })).toEqual({
      title: 'Algebra',
      count: 3,
    });
  });

  it('applies schema transforms and defaults to the returned value', () => {
    const withDefault = z.object({
      title: z.string().min(1),
      archived: z.boolean().default(false),
    });
    const pipe = new ZodValidationPipe(withDefault);

    expect(pipe.transform({ title: 'Algebra' })).toEqual({
      title: 'Algebra',
      archived: false,
    });
  });

  it('rejects a payload missing a required field', () => {
    const pipe = new ZodValidationPipe(schema);

    expect(() => pipe.transform({ count: 3 })).toThrow(BadRequestException);
  });

  it('rejects a payload with the wrong type for a field', () => {
    const pipe = new ZodValidationPipe(schema);

    expect(() => pipe.transform({ title: 'Algebra', count: 'three' })).toThrow(
      BadRequestException,
    );
  });

  it('includes the field path in the rejection message', () => {
    const pipe = new ZodValidationPipe(schema);

    try {
      pipe.transform({ title: '', count: 3 });
      throw new Error('expected transform to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as { message: string[] };
      expect(response.message[0]).toContain('title');
    }
  });
});
