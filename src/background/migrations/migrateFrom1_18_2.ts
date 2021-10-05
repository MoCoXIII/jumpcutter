import { defaultSettings, Settings } from '@/settings';
import browser from '@/webextensions-api';

// A fix for https://github.com/WofWca/jumpcutter/issues/30
// (make it impossible to set soundedSpeed to 0 using popup inputs and change it to be non-zero if it already is).
export default async function (): Promise<void> {
  const {
    popupSoundedSpeedMin,
    popupSoundedSpeedStep: popupSoundedSpeedStepFromStorage,
    soundedSpeed,
  } = await browser.storage.local.get(['popupSoundedSpeedMin', 'popupSoundedSpeedStep', 'soundedSpeed']);
  const popupSoundedSpeedStep = popupSoundedSpeedStepFromStorage ?? defaultSettings.popupSoundedSpeedStep;

  const newValues: Partial<Settings> = {};
  // Otherwise the user already changed it or the value for this setting was never set (in case we're updating
  // from an older version that didn't have it).
  if (popupSoundedSpeedMin === 0) {
    newValues.popupSoundedSpeedMin = popupSoundedSpeedStep;
  }
  // Otherwise same as above.
  if (soundedSpeed === 0) {
    newValues.soundedSpeed = popupSoundedSpeedStep;
  }
  await browser.storage.local.set(newValues);
}
