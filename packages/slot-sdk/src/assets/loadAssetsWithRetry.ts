import type { AssetLoader } from './AssetLoader';
import type { LoadedAssets } from './LoadedAssets';
import type { LoadingScreen } from './LoadingScreen';

/**
 * Loads `preload`, shows the logo, then loads `game` with progress on the loading screen.
 * On a failure the cause goes to the console, the screen shows an error with Retry,
 * and after the click loading starts over. Resolves only when everything has loaded.
 */
export async function loadAssetsWithRetry(
  loader: Pick<AssetLoader, 'loadPreload' | 'loadGame'>,
  screen: Pick<LoadingScreen, 'showLogo' | 'setProgress' | 'showError'>,
): Promise<LoadedAssets> {
  for (;;) {
    try {
      await loader.loadPreload();
      screen.showLogo();
      return await loader.loadGame((progress) => {
        screen.setProgress(progress);
      });
    } catch (error) {
      console.error('slot-sdk: loading assets failed, waiting for Retry.', error);
      await screen.showError();
    }
  }
}
