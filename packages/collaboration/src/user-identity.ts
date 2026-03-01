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
  avatarDataUrl: string;
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

  const avatarDataUrl = createAvatar(avataaars, {
    seed,
    size: 128,
  }).toDataUri();

  return { nickname, avatarDataUrl };
}

export function generateAvatarDataUrl(seed: string, size: number = 32): string {
  return createAvatar(avataaars, {
    seed,
    size,
  }).toDataUri();
}
