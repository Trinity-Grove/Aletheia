import { DataMigrationRunner } from './data-migration-runner.js';
import { PrismaService } from './prisma.service.js';

describe('DataMigrationRunner', () => {
  it('applies a migration that has not run yet and records it in the changelog', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const create = jest.fn().mockResolvedValue({});
    const prisma = { dataMigrationLog: { findUnique, create } } as unknown as PrismaService;
    const runner = new DataMigrationRunner(prisma);

    const run = jest.fn().mockResolvedValue('42 things created');
    await runner.run([{ code: 'my-migration', run }]);

    expect(findUnique).toHaveBeenCalledWith({ where: { code: 'my-migration' } });
    expect(run).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: { code: 'my-migration', notes: '42 things created' },
    });
  });

  it('skips a migration that has already been applied', async () => {
    const findUnique = jest.fn().mockResolvedValue({ id: 'log-1', code: 'my-migration' });
    const create = jest.fn();
    const prisma = { dataMigrationLog: { findUnique, create } } as unknown as PrismaService;
    const runner = new DataMigrationRunner(prisma);

    const run = jest.fn();
    await runner.run([{ code: 'my-migration', run }]);

    expect(run).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('does not record a failed migration, so it retries on the next call', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const create = jest.fn();
    const prisma = { dataMigrationLog: { findUnique, create } } as unknown as PrismaService;
    const runner = new DataMigrationRunner(prisma);

    const run = jest.fn().mockRejectedValue(new Error('boom'));
    await runner.run([{ code: 'my-migration', run }]);

    expect(create).not.toHaveBeenCalled();
  });

  it('continues to the next migration even if an earlier one fails', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const create = jest.fn().mockResolvedValue({});
    const prisma = { dataMigrationLog: { findUnique, create } } as unknown as PrismaService;
    const runner = new DataMigrationRunner(prisma);

    const failingRun = jest.fn().mockRejectedValue(new Error('boom'));
    const succeedingRun = jest.fn().mockResolvedValue('done');

    await runner.run([
      { code: 'broken-migration', run: failingRun },
      { code: 'healthy-migration', run: succeedingRun },
    ]);

    expect(failingRun).toHaveBeenCalledTimes(1);
    expect(succeedingRun).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({ data: { code: 'healthy-migration', notes: 'done' } });
  });
});
