import { describe, expect, test } from 'bun:test';
import {
  SCENE_IDS,
  formatCounter,
  indexOfScene,
  isSceneId,
  sceneAt,
  sceneFromHash,
  stepIndex,
} from '../src/lib/scenes/state';

describe('scene ids', () => {
  test('stage order is intro, work, stack, me', () => {
    expect([...SCENE_IDS]).toEqual(['intro', 'work', 'stack', 'me']);
  });

  test('guards unknown ids', () => {
    expect(isSceneId('work')).toBe(true);
    expect(isSceneId('main')).toBe(false);
  });

  test('maps ids and indices both ways', () => {
    expect(indexOfScene('stack')).toBe(2);
    expect(sceneAt(3)).toBe('me');
    expect(sceneAt(4)).toBeNull();
    expect(sceneAt(-1)).toBeNull();
  });
});

describe('sceneFromHash', () => {
  test('reads hashes with or without #', () => {
    expect(sceneFromHash('#work')).toBe('work');
    expect(sceneFromHash('me')).toBe('me');
  });

  test('rejects empty and unknown hashes', () => {
    expect(sceneFromHash('')).toBeNull();
    expect(sceneFromHash('#main')).toBeNull();
  });
});

describe('stepIndex', () => {
  test('moves within bounds and clamps at the ends', () => {
    expect(stepIndex(0, 1, 4)).toBe(1);
    expect(stepIndex(3, 1, 4)).toBe(3);
    expect(stepIndex(0, -1, 4)).toBe(0);
    expect(stepIndex(1, 5, 4)).toBe(3);
  });

  test('handles an empty stage', () => {
    expect(stepIndex(2, 1, 0)).toBe(0);
  });
});

describe('formatCounter', () => {
  test('pads both numbers', () => {
    expect(formatCounter(1, 4)).toBe('02 / 04');
  });
});
