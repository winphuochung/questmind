import { PlayerState } from "../types";

const MOCK_CLOUD_DELAY = 1000;

export const mockLogin = async (phoneOrEmail: string, username: string, avatar: string): Promise<PlayerState> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate fetching from cloud
      const cloudData = localStorage.getItem(`cloud_sync_${phoneOrEmail}`);
      if (cloudData) {
        try {
          const parsed = JSON.parse(cloudData);
          resolve({
            ...parsed,
            isLoggedIn: true,
            username,
            avatar,
          });
          return;
        } catch (e) {
          console.error("Cloud data corrupted", e);
        }
      }
      
      // Default new user state
      resolve({
        username,
        phoneOrEmail,
        avatar,
        isLoggedIn: true,
        xp: 0,
        level: 1,
        gold: 150,
        hearts: 5,
        items: { revive: 0, hint: 0, shield: 0, doubleXp: false },
        history: [],
        completedChapters: [],
        collectedPieces: {},
        completedPuzzles: [],
        activeTab: "home"
      });
    }, MOCK_CLOUD_DELAY);
  });
};

export const mockCloudSync = async (playerState: PlayerState): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (playerState.isLoggedIn && playerState.phoneOrEmail) {
        localStorage.setItem(`cloud_sync_${playerState.phoneOrEmail}`, JSON.stringify(playerState));
        resolve(true);
      } else {
        resolve(false);
      }
    }, MOCK_CLOUD_DELAY / 2);
  });
};
