import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  USER_COLORS,
  hashUserIdToColorIndex,
  generateUserColor,
  generateAnonymousUserId,
  getStoredUser,
  setStoredUser,
  createAnonymousUser,
  getOrCreateUser,
  DEFAULT_PRESENCE_CONFIG,
  DEFAULT_ADAPTER_CONFIG,
  DEFAULT_CONNECTION_CONFIG,
} from '@thinkix/collaboration';
import type { CollaborationUser } from '@thinkix/collaboration';

describe('hashUserIdToColorIndex', () => {
  it('returns consistent index for same userId', () => {
    const index1 = hashUserIdToColorIndex('user-123');
    const index2 = hashUserIdToColorIndex('user-123');
    expect(index1).toBe(index2);
  });

  it('returns different indices for different userIds', () => {
    const index1 = hashUserIdToColorIndex('user-123');
    const index2 = hashUserIdToColorIndex('user-456');
    expect(index1).not.toBe(index2);
  });

  it('returns index within USER_COLORS bounds', () => {
    const testIds = [
      'user-1',
      'user-2',
      'a-very-long-user-id-with-many-characters',
      'short',
      '12345',
      'special!@#$%',
      'unicode-你好',
    ];

    testIds.forEach((id) => {
      const index = hashUserIdToColorIndex(id);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(USER_COLORS.length);
    });
  });

  it('handles empty string', () => {
    const index = hashUserIdToColorIndex('');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(USER_COLORS.length);
  });

  it('handles single character', () => {
    const index = hashUserIdToColorIndex('a');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(USER_COLORS.length);
  });

  it('produces deterministic hash for known input', () => {
    expect(hashUserIdToColorIndex('alice')).toBe(hashUserIdToColorIndex('alice'));
    expect(hashUserIdToColorIndex('bob')).toBe(hashUserIdToColorIndex('bob'));
  });
});

describe('generateUserColor', () => {
  it('returns a valid color from USER_COLORS', () => {
    const color = generateUserColor('user-123');
    expect(USER_COLORS).toContain(color);
  });

  it('returns consistent color for same userId', () => {
    const color1 = generateUserColor('user-123');
    const color2 = generateUserColor('user-123');
    expect(color1).toBe(color2);
  });

  it('returns different colors for different userIds', () => {
    const color1 = generateUserColor('user-123');
    const color2 = generateUserColor('user-456');
    expect(color1).not.toBe(color2);
  });

  it('returns hex color format', () => {
    const color = generateUserColor('user-123');
    expect(color).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe('generateAnonymousUserId', () => {
  it('returns string starting with anon_', () => {
    const id = generateAnonymousUserId();
    expect(id).toMatch(/^anon_/);
  });

  it('returns unique IDs on each call', () => {
    const id1 = generateAnonymousUserId();
    const id2 = generateAnonymousUserId();
    expect(id1).not.toBe(id2);
  });

  it('contains UUID format after prefix', () => {
    const id = generateAnonymousUserId();
    const uuidPart = id.replace('anon_', '');
    expect(uuidPart).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});

describe('getStoredUser', () => {
  const mockStorage = {
    getItem: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when no user is stored', () => {
    mockStorage.getItem.mockReturnValue(null);
    const user = getStoredUser();
    expect(user).toBeNull();
  });

  it('returns parsed user when stored', () => {
    const storedUser: CollaborationUser = {
      id: 'user-123',
      name: 'Test User',
      color: '#FF0000',
    };
    mockStorage.getItem.mockReturnValue(JSON.stringify(storedUser));
    const user = getStoredUser();
    expect(user).toEqual(storedUser);
  });

  it('returns user with avatar when stored', () => {
    const storedUser: CollaborationUser = {
      id: 'user-123',
      name: 'Test User',
      color: '#FF0000',
      avatar: 'data:image/svg+xml,test',
    };
    mockStorage.getItem.mockReturnValue(JSON.stringify(storedUser));
    const user = getStoredUser();
    expect(user).toEqual(storedUser);
  });

  it('returns null on JSON parse error', () => {
    mockStorage.getItem.mockReturnValue('invalid json');
    const user = getStoredUser();
    expect(user).toBeNull();
  });

  it('returns null when localStorage throws', () => {
    mockStorage.getItem.mockImplementation(() => {
      throw new Error('Storage error');
    });
    const user = getStoredUser();
    expect(user).toBeNull();
  });

  it('returns null on server side (no window)', () => {
    vi.unstubAllGlobals();
    const user = getStoredUser();
    expect(user).toBeNull();
  });
});

describe('setStoredUser', () => {
  const mockStorage = {
    setItem: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores user as JSON string', () => {
    const user: CollaborationUser = {
      id: 'user-123',
      name: 'Test User',
      color: '#FF0000',
    };
    setStoredUser(user);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'thinkix:collaboration:user',
      JSON.stringify(user)
    );
  });

  it('stores user with avatar', () => {
    const user: CollaborationUser = {
      id: 'user-123',
      name: 'Test User',
      color: '#FF0000',
      avatar: 'data:image/svg+xml,test',
    };
    setStoredUser(user);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'thinkix:collaboration:user',
      JSON.stringify(user)
    );
  });

  it('handles localStorage errors gracefully', () => {
    mockStorage.setItem.mockImplementation(() => {
      throw new Error('Storage full');
    });
    const user: CollaborationUser = { id: 'user-123', name: 'Test', color: '#FF0000' };
    expect(() => setStoredUser(user)).not.toThrow();
  });

  it('does nothing on server side (no window)', () => {
    vi.unstubAllGlobals();
    const user: CollaborationUser = { id: 'user-123', name: 'Test', color: '#FF0000' };
    expect(() => setStoredUser(user)).not.toThrow();
  });
});

describe('createAnonymousUser', () => {
  it('creates user with anon_ prefix id', () => {
    const user = createAnonymousUser();
    expect(user.id).toMatch(/^anon_/);
  });

  it('creates user with generated nickname', () => {
    const user = createAnonymousUser();
    expect(user.name).toBeDefined();
    expect(user.name.length).toBeGreaterThan(0);
  });

  it('creates user with valid color', () => {
    const user = createAnonymousUser();
    expect(USER_COLORS).toContain(user.color);
  });

  it('creates user with avatar data URL', () => {
    const user = createAnonymousUser();
    expect(user.avatar).toMatch(/^data:image\/svg\+xml/);
  });

  it('creates unique users on each call', () => {
    const user1 = createAnonymousUser();
    const user2 = createAnonymousUser();
    expect(user1.id).not.toBe(user2.id);
    expect(user1.name).not.toBe(user2.name);
  });
});

describe('getOrCreateUser', () => {
  const mockStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns stored user when available', () => {
    const storedUser: CollaborationUser = {
      id: 'stored-user',
      name: 'Stored User',
      color: '#00FF00',
    };
    mockStorage.getItem.mockReturnValue(JSON.stringify(storedUser));

    const user = getOrCreateUser();
    expect(user).toEqual(storedUser);
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  it('creates and stores new user when none exists', () => {
    mockStorage.getItem.mockReturnValue(null);

    const user = getOrCreateUser();
    expect(user.id).toMatch(/^anon_/);
    expect(user.name).toBeDefined();
    expect(user.color).toBeDefined();
    expect(mockStorage.setItem).toHaveBeenCalled();
  });

  it('creates new user when stored data is invalid', () => {
    mockStorage.getItem.mockReturnValue('invalid json');

    const user = getOrCreateUser();
    expect(user.id).toMatch(/^anon_/);
    expect(mockStorage.setItem).toHaveBeenCalled();
  });
});

describe('Constants', () => {
  it('USER_COLORS has expected length', () => {
    expect(USER_COLORS.length).toBe(20);
  });

  it('USER_COLORS are valid hex colors', () => {
    USER_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
    });
  });

  it('DEFAULT_PRESENCE_CONFIG has expected values', () => {
    expect(DEFAULT_PRESENCE_CONFIG.throttleMs).toBe(50);
    expect(DEFAULT_PRESENCE_CONFIG.idleTimeoutMs).toBe(30000);
  });

  it('DEFAULT_ADAPTER_CONFIG has expected values', () => {
    expect(DEFAULT_ADAPTER_CONFIG.presence).toEqual(DEFAULT_PRESENCE_CONFIG);
    expect(DEFAULT_ADAPTER_CONFIG.pageSize).toBe(50);
  });

  it('DEFAULT_CONNECTION_CONFIG has expected values', () => {
    expect(DEFAULT_CONNECTION_CONFIG.cursorThrottleMs).toBe(50);
    expect(DEFAULT_CONNECTION_CONFIG.cursorIdleTimeoutMs).toBe(30000);
    expect(DEFAULT_CONNECTION_CONFIG.syncDebounceMs).toBe(16);
    expect(DEFAULT_CONNECTION_CONFIG.presencePageSize).toBe(50);
    expect(DEFAULT_CONNECTION_CONFIG.enableOfflineQueue).toBe(true);
    expect(DEFAULT_CONNECTION_CONFIG.maxRetries).toBe(3);
  });
});
