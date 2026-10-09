import { mockDisk } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { NOW, MINUTE, SECOND, made, resetIds, series } from '@/testing/fixtures';
import { elapsedOf, IDLE_AUTO_END_MS, IDLE_PROMPT_MS } from '@/domain/session';
import { openContraction } from '@/domain/stats';
import { reloadSessionsFromDisk, useSessions } from '@/store/sessions';
import { useMeta } from '@/store/meta';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { RULE_PRESETS } from '@/domain/defaults';

beforeEach(() => {
  resetIds();
  resetApp();
});

const tapAt = (offsetMs: number) => useSessions.getState().tap(NOW + offsetMs);
const active = () => useSessions.getState().active!;

/** What a killed and relaunched process sees: nothing in memory, everything from the disk. */
function coldStart() {
  useSessions.setState({ active: null, index: [], archived: {}, restored: false });
  reloadSessionsFromDisk();
}

describe('writing to disk on every tap', () => {
  it('saves the start synchronously, before anything else can happen', () => {
    tapAt(0);
    const onDisk = db.get('activeSession')!;
    expect(onDisk.contractions).toHaveLength(1);
    expect(onDisk.contractions[0]).toMatchObject({ startedAt: NOW, endedAt: null });
    expect(onDisk.startedAt).toBe(NOW);
  });
  it('saves the stop the same way', () => {
    tapAt(0);
    tapAt(45 * SECOND);
    expect(db.get('activeSession')!.contractions[0].endedAt).toBe(NOW + 45 * SECOND);
  });
  it('does not write when a double tap is ignored', () => {
    tapAt(0);
    const before = JSON.stringify(db.get('activeSession'));
    expect(tapAt(100)).toBe('ignored');
    expect(JSON.stringify(db.get('activeSession'))).toBe(before);
  });
});

describe('kill and relaunch', () => {
  it('a contraction running when the app was killed shows ~3:00 three minutes later (plan F3)', () => {
    tapAt(0);
    coldStart();
    const s = active();
    expect(useSessions.getState().restored).toBe(true);
    expect(elapsedOf(openContraction(s.contractions)!, NOW + 3 * MINUTE)).toBe(3 * MINUTE);
    // and the very next tap stops it with the right length
    useSessions.getState().tap(NOW + 3 * MINUTE);
    expect(active().contractions[0].endedAt).toBe(NOW + 3 * MINUTE);
  });
  it('a resting session comes back with all its contractions', () => {
    const cs = series(NOW, 5, 5 * MINUTE, 60 * SECOND);
    for (const c of cs) {
      tapAt(c.startedAt - NOW);
      tapAt(c.endedAt! - NOW);
    }
    coldStart();
    expect(active().contractions).toHaveLength(5);
    expect(openContraction(active().contractions)).toBeNull();
  });
  it('a filed session survives too, and the index is newest first', () => {
    tapAt(0);
    tapAt(40 * SECOND);
    const first = useSessions.getState().endActive(NOW + MINUTE)!;
    tapAt(10 * MINUTE);
    tapAt(10 * MINUTE + 50 * SECOND);
    const second = useSessions.getState().endActive(NOW + 11 * MINUTE)!;
    coldStart();
    expect(useSessions.getState().active).toBeNull();
    expect(useSessions.getState().index).toEqual([second.id, first.id]);
    expect(useSessions.getState().get(first.id)!.contractions).toHaveLength(1);
  });
  it('repairs a file that holds two running contractions', () => {
    tapAt(0);
    const s = active();
    db.set('activeSession', { ...s, contractions: [{ id: 'old', startedAt: NOW - 10 * MINUTE, endedAt: null }, ...s.contractions] });
    coldStart();
    expect(active().contractions.filter((c) => c.endedAt === null)).toHaveLength(1);
  });
  it('a kill between filing and clearing leaves the filed copy only', () => {
    tapAt(0);
    tapAt(40 * SECOND);
    const open = JSON.parse(JSON.stringify(active()));
    const ended = useSessions.getState().endActive(NOW + MINUTE)!;
    db.set('activeSession', open); // the clearing write never happened
    coldStart();
    expect(useSessions.getState().active).toBeNull();
    expect(useSessions.getState().index).toEqual([ended.id]);
    expect(db.get('activeSession')).toBeNull();
  });
  it('survives a reboot: the disk is all it needs', () => {
    tapAt(0);
    tapAt(60 * SECOND);
    tapAt(5 * MINUTE);
    const keys = [...mockDisk.get('ct')!.keys()];
    expect(keys).toContain('activeSession');
    coldStart();
    expect(openContraction(active().contractions)!.startedAt).toBe(NOW + 5 * MINUTE);
  });
});

describe('ending and the idle rules', () => {
  it('ending files the session, clears the open one and remembers when it ended', () => {
    tapAt(0);
    tapAt(40 * SECOND);
    const ended = useSessions.getState().endActive(NOW + 2 * MINUTE)!;
    expect(useSessions.getState().active).toBeNull();
    expect(db.get('activeSession')).toBeNull();
    expect(db.get(`session.${ended.id}`)).toMatchObject({ endedAt: NOW + 40 * SECOND });
    expect(useMeta.getState().meta.lastSessionEndedAt).toBe(NOW + 40 * SECOND);
  });
  it('asks after 2 hours and ends by itself after 6, at the time of the last contraction', () => {
    tapAt(0);
    tapAt(40 * SECOND);
    expect(useSessions.getState().checkIdle(NOW + 40 * SECOND + IDLE_PROMPT_MS)).toBe('prompt');
    expect(active()).toBeTruthy();
    useSessions.getState().keepActive(NOW + 40 * SECOND + IDLE_PROMPT_MS);
    expect(useSessions.getState().checkIdle(NOW + 40 * SECOND + IDLE_PROMPT_MS + MINUTE)).toBe('active');
    expect(useSessions.getState().checkIdle(NOW + 40 * SECOND + IDLE_AUTO_END_MS)).toBe('ended');
    expect(useSessions.getState().active).toBeNull();
    expect(useSessions.getState().index).toHaveLength(1);
  });
});

describe('undo', () => {
  it('undoing the first Start removes the session', () => {
    tapAt(0);
    useSessions.getState().undoTap();
    expect(useSessions.getState().active).toBeNull();
    expect(db.get('activeSession')).toBeNull();
  });
  it('undoing a Stop runs the contraction again', () => {
    tapAt(0);
    tapAt(40 * SECOND);
    useSessions.getState().undoTap();
    expect(openContraction(active().contractions)).not.toBeNull();
  });
});

describe('edits on a filed session', () => {
  it('tag, note, ignore, edit, add, delete and merge are saved', () => {
    for (const c of series(NOW, 3, 5 * MINUTE, 50 * SECOND)) {
      tapAt(c.startedAt - NOW);
      tapAt(c.endedAt! - NOW);
    }
    const ended = useSessions.getState().endActive(NOW + 20 * MINUTE)!;
    const s = useSessions.getState();
    const id = ended.contractions[0].id;
    s.setIntensity(ended.id, id, 'strong');
    s.setNote(ended.id, id, 'waters not broken');
    expect(db.get(`session.${ended.id}`)!.contractions.find((c) => c.id === id)).toMatchObject({ intensity: 'strong', note: 'waters not broken' });
    const added = s.addContraction(ended.id, NOW - 30 * MINUTE, 40 * SECOND, NOW + 21 * MINUTE);
    expect(added?.ok).toBe(true);
    expect(useSessions.getState().get(ended.id)!.contractions).toHaveLength(4);
    s.deleteContraction(ended.id, id);
    expect(useSessions.getState().get(ended.id)!.contractions).toHaveLength(3);
    expect(useSessions.getState().deleteSession(ended.id)).toBeTruthy();
    expect(db.get(`session.${ended.id}`)).toBeUndefined();
    expect(useSessions.getState().index).toEqual([]);
  });
  it('does nothing for a session that does not exist', () => {
    expect(useSessions.getState().editTimes('nope', 'x', {})).toBeNull();
    expect(useSessions.getState().deleteSession('nope')).toBeNull();
  });
});

describe('pattern evaluation', () => {
  /** An 11-contraction 5-1-1 session whose newest began 5 minutes before `at`. */
  function build(at: number) {
    for (const c of series(at, 11, 5 * MINUTE, 60 * SECOND, 5 * MINUTE)) {
      useSessions.getState().tap(c.startedAt);
      useSessions.getState().tap(c.endedAt!);
    }
  }
  it('fires once when the rule matches, stays quiet while it goes on, and records when it first matched', () => {
    const at = NOW + 2 * 60 * MINUTE;
    build(at);
    expect(useSessions.getState().evaluate(at)).toBe(true);
    expect(active().patternMatchedAt).toBe(at);
    expect(useSessions.getState().evaluate(at + 5 * SECOND)).toBe(false);
    expect(active().pattern?.episodeStartedAt).toBe(at);
  });
  it('does not save every second while a match goes on', () => {
    const at = NOW + 2 * 60 * MINUTE;
    build(at);
    useSessions.getState().evaluate(at);
    const saved = JSON.stringify(db.get('activeSession'));
    useSessions.getState().evaluate(at + 5 * SECOND);
    expect(JSON.stringify(db.get('activeSession'))).toBe(saved);
  });
  it('a dismissed banner stays dismissed inside the episode', () => {
    const at = NOW + 2 * 60 * MINUTE;
    build(at);
    useSessions.getState().evaluate(at);
    useSessions.getState().dismissPattern();
    expect(active().pattern?.dismissed).toBe(true);
    expect(useSessions.getState().evaluate(at + MINUTE)).toBe(false);
    expect(active().pattern?.dismissed).toBe(true);
  });
  it('uses the rule in Settings: changing it mid-session resets the match', () => {
    const at = NOW + 2 * 60 * MINUTE;
    build(at);
    expect(useSessions.getState().evaluate(at)).toBe(true);
    useSettings.getState().update({ rule: RULE_PRESETS['311'] });
    expect(useSessions.getState().evaluate(at + SECOND)).toBe(false);
    expect(active().ruleAtStart.preset).toBe('311');
    expect(active().patternMatchedAt).toBeUndefined();
  });
  it('does nothing without a session', () => {
    expect(useSessions.getState().evaluate(NOW)).toBe(false);
    void made;
  });
});
