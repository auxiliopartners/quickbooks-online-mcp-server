/**
 * Prototype-shape contract test for get_general_ledger.
 *
 * The existing reports.handlers.test uses a hand-rolled mock that stubs whatever
 * method name the handler happens to call. That lets a typo in the handler
 * (e.g. reportGeneralLedger instead of the real reportGeneralLedgerDetail) slip
 * past CI because the mock agrees with the typo. This test closes that loop by
 * verifying the handler invokes a method that actually exists on the real
 * node-quickbooks prototype.
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import QuickBooks from 'node-quickbooks';

const mockQuickbooksClient = {
  authenticate: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  getQuickbooks: jest.fn<() => QuickBooks>(),
};

jest.unstable_mockModule('../../../src/clients/quickbooks-client', () => ({
  quickbooksClient: mockQuickbooksClient,
}));

const { getQuickbooksGeneralLedger } = await import('../../../src/handlers/get-quickbooks-general-ledger.handler');

describe('get_general_ledger prototype-shape contract', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockQuickbooksClient.authenticate.mockResolvedValue(undefined);
  });

  it('node-quickbooks exposes reportGeneralLedgerDetail on its prototype', () => {
    expect(typeof (QuickBooks.prototype as any).reportGeneralLedgerDetail).toBe('function');
  });

  it('handler invokes a method that exists on the real QuickBooks prototype', async () => {
    const qb = Object.create(QuickBooks.prototype) as QuickBooks;
    mockQuickbooksClient.getQuickbooks.mockReturnValue(qb);

    const spy = jest
      .spyOn(QuickBooks.prototype as any, 'reportGeneralLedgerDetail')
      .mockImplementation(function (this: unknown, _params: any, cb: any) {
        cb(null, { Header: { ReportName: 'GeneralLedger' } });
      });

    const result = await getQuickbooksGeneralLedger({ start_date: '2024-01-01', end_date: '2024-01-31' });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.isError).toBe(false);
    expect(result.result).toMatchObject({ Header: { ReportName: 'GeneralLedger' } });
  });
});
