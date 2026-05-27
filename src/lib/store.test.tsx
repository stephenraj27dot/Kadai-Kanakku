import { describe, it, expect } from 'vitest';
import { balanceOf, statusOf, type Customer } from './store';

describe('Financial Logic Tests', () => {
  it('calculates correct balance for zero transactions', () => {
    const customer: Customer = {
      id: '1', name: 'Test', txns: [], createdAt: Date.now()
    };
    expect(balanceOf(customer)).toBe(0);
    expect(statusOf(customer)).toBe('settled');
  });

  it('calculates correct balance for debits (baki)', () => {
    const customer: Customer = {
      id: '1', name: 'Test', createdAt: Date.now(),
      txns: [
        { id: 't1', type: 'debit', amount: 100, at: Date.now() },
        { id: 't2', type: 'debit', amount: 50, at: Date.now() }
      ]
    };
    expect(balanceOf(customer)).toBe(150);
    expect(statusOf(customer)).toBe('pending');
  });

  it('calculates correct balance for debits and credits', () => {
    const customer: Customer = {
      id: '1', name: 'Test', createdAt: Date.now(),
      txns: [
        { id: 't1', type: 'debit', amount: 100, at: Date.now() },
        { id: 't2', type: 'credit', amount: 40, at: Date.now() }
      ]
    };
    expect(balanceOf(customer)).toBe(60);
    expect(statusOf(customer)).toBe('partial');
  });

  it('marks as settled if fully paid', () => {
    const customer: Customer = {
      id: '1', name: 'Test', createdAt: Date.now(),
      txns: [
        { id: 't1', type: 'debit', amount: 100, at: Date.now() },
        { id: 't2', type: 'credit', amount: 100, at: Date.now() }
      ]
    };
    expect(balanceOf(customer)).toBe(0);
    expect(statusOf(customer)).toBe('settled');
  });

  it('marks as settled if overpaid (negative balance)', () => {
    const customer: Customer = {
      id: '1', name: 'Test', createdAt: Date.now(),
      txns: [
        { id: 't1', type: 'debit', amount: 100, at: Date.now() },
        { id: 't2', type: 'credit', amount: 150, at: Date.now() }
      ]
    };
    expect(balanceOf(customer)).toBe(-50);
    expect(statusOf(customer)).toBe('settled');
  });
});
