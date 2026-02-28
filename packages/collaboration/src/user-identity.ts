import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
  type Config,
} from 'unique-names-generator';

export interface UserIdentity {
  nickname: string;
  avatarSvg: string;
}

const NICKNAME_CONFIG: Config = {
  dictionaries: [adjectives, animals],
  separator: ' ',
  style: 'capital',
  length: 2,
};

export function generateUserIdentity(seed: string): UserIdentity {
  const nickname = uniqueNamesGenerator({
    ...NICKNAME_CONFIG,
    seed,
  });

  const avatarSvg = createAvatar(avataaars, {
    seed,
    size: 128,
  }).toString();

  return { nickname, avatarSvg };
}

export function generateAvatarDataUrl(seed: string, size: number = 32): string {
  const svg = createAvatar(avataaars, {
    seed,
    size,
  }).toDataUri();

  return svg;
}
