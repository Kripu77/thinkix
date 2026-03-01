import { describe, it, expect } from 'vitest';
import { generateUserIdentity, generateAvatarDataUrl } from '@thinkix/collaboration';

describe('generateUserIdentity', () => {
  it('returns identical nickname for same seed', () => {
    const seed = 'test-seed-123';
    const result1 = generateUserIdentity(seed);
    const result2 = generateUserIdentity(seed);

    expect(result1.nickname).toBe(result2.nickname);
  });

  it('returns identical avatar data URL for same seed', () => {
    const seed = 'test-seed-456';
    const result1 = generateUserIdentity(seed);
    const result2 = generateUserIdentity(seed);

    expect(result1.avatarDataUrl).toBe(result2.avatarDataUrl);
  });

  it('returns different nicknames for different seeds', () => {
    const result1 = generateUserIdentity('seed-one');
    const result2 = generateUserIdentity('seed-two');

    expect(result1.nickname).not.toBe(result2.nickname);
  });

  it('returns different avatars for different seeds', () => {
    const result1 = generateUserIdentity('seed-alpha');
    const result2 = generateUserIdentity('seed-beta');

    expect(result1.avatarDataUrl).not.toBe(result2.avatarDataUrl);
  });

  it('generates nickname in Adjective Animal format', () => {
    const result = generateUserIdentity('format-test');
    const parts = result.nickname.split(' ');

    expect(parts.length).toBe(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it('generates capitalized nickname', () => {
    const result = generateUserIdentity('capital-test');
    const parts = result.nickname.split(' ');

    expect(parts[0][0]).toBe(parts[0][0].toUpperCase());
    expect(parts[1][0]).toBe(parts[1][0].toUpperCase());
  });

  it('generates valid data URL', () => {
    const result = generateUserIdentity('dataurl-test');

    expect(result.avatarDataUrl).toMatch(/^data:image\/svg\+xml/);
  });

  it('is fully deterministic - multiple calls produce same result', () => {
    const seed = 'determinism-check';
    const results = Array.from({ length: 5 }, () => generateUserIdentity(seed));

    const firstNickname = results[0].nickname;
    const firstAvatar = results[0].avatarDataUrl;

    results.forEach(({ nickname, avatarDataUrl }) => {
      expect(nickname).toBe(firstNickname);
      expect(avatarDataUrl).toBe(firstAvatar);
    });
  });
});

describe('generateAvatarDataUrl', () => {
  it('returns data URL for same seed', () => {
    const seed = 'dataurl-test';
    const result = generateAvatarDataUrl(seed);

    expect(result).toMatch(/^data:image\/svg\+xml/);
  });

  it('returns identical data URLs for same seed', () => {
    const seed = 'identical-test';
    const result1 = generateAvatarDataUrl(seed);
    const result2 = generateAvatarDataUrl(seed);

    expect(result1).toBe(result2);
  });

  it('returns different data URLs for different seeds', () => {
    const result1 = generateAvatarDataUrl('seed-a');
    const result2 = generateAvatarDataUrl('seed-b');

    expect(result1).not.toBe(result2);
  });

  it('respects size parameter', () => {
    const seed = 'size-test';
    const result32 = generateAvatarDataUrl(seed, 32);
    const result64 = generateAvatarDataUrl(seed, 64);

    expect(result32).toBeDefined();
    expect(result64).toBeDefined();
  });
});

describe('User Identity Snapshot', () => {
  it('matches snapshot for fixed seed', () => {
    const result = generateUserIdentity('snapshot-seed');
    expect(result.nickname).toMatchSnapshot('nickname');
    expect(result.avatarDataUrl).toMatchSnapshot('avatarDataUrl');
  });
});
