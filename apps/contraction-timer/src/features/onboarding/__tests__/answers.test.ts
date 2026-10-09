import '@/testing/mocks';
import { defaultDraft } from '@/components/DueDateForm';
import { resolveAnswers } from '../answers';

const today = '2026-10-09';

describe('resolveAnswers (what onboarding saves)', () => {
  it('saves nothing for a flow that was skipped at once: safe defaults', () => {
    expect(resolveAnswers({}, today)).toEqual({ acknowledged: false, due: null, firstBaby: undefined, partnerMode: false, needs: [], landing: '/timer' });
  });
  it('takes the acknowledgement only when the box was ticked', () => {
    expect(resolveAnswers({ disclaimer: true }, today).acknowledged).toBe(true);
    expect(resolveAnswers({ disclaimer: false }, today).acknowledged).toBe(false);
  });
  it('drops a starting date the person never touched', () => {
    expect(resolveAnswers({ howFar: defaultDraft('edd', today) }, today).due).toBeNull();
  });
  it('keeps a date the person set and that is valid', () => {
    const draft = { ...defaultDraft('lmp', today), touched: true };
    expect(resolveAnswers({ howFar: draft }, today).due).toEqual({ mode: 'lmp', date: draft.date, cycleLength: 28, ivfEmbryoDay: 5 });
  });
  it('drops a date that fails the plan\'s limits even if touched', () => {
    expect(resolveAnswers({ howFar: { ...defaultDraft('lmp', today), date: '2026-10-20', touched: true } }, today).due).toBeNull();
  });
  it('"I\'ll add this later" saves no date', () => {
    expect(resolveAnswers({ howFar: 'later' }, today).due).toBeNull();
  });
  it('"I\'m the partner" turns Partner mode on', () => {
    expect(resolveAnswers({ firstBaby: 'partner' }, today).partnerMode).toBe(true);
    expect(resolveAnswers({ firstBaby: 'yes' }, today).partnerMode).toBe(false);
  });
  it('lands on Kicks only when counting kicks is the only need', () => {
    const needs = (n: string[]) => ({ needs: { needs: n, reminder: { on: false, hour: 20, minute: 0 } } });
    expect(resolveAnswers(needs(['kicks']), today).landing).toBe('/kicks');
    expect(resolveAnswers(needs(['kicks', 'timer']), today).landing).toBe('/timer');
    expect(resolveAnswers(needs([]), today).landing).toBe('/timer');
  });
});
