/**
 * @license
 * Copyright (C) 2021, 2022  WofWca <wofwca@protonmail.com>
 *
 * This file is part of Jump Cutter Browser Extension.
 *
 * Jump Cutter Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Jump Cutter Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Jump Cutter Browser Extension.  If not, see <https://www.gnu.org/licenses/>.
 */

import { filterOutUnchangedValues } from '@/helpers';
import { mainStorageAreaName } from './mainStorageAreaName';
import type { MyStorageChanges } from './';
import { browserOrChrome } from '@/webextensions-api-browser-or-chrome';

type MyOnChangedListener = (changes: MyStorageChanges) => void;
// type NativeOnChangedListener = Parameters<typeof chrome.storage.onChanged.addListener>[0];
type NativeOnChangedListener = (
  changes: { [key: string]: browser.storage.StorageChange | chrome.storage.StorageChange },
  // areaName: chrome.storage.AreaName,
  areaName: typeof mainStorageAreaName | string,
) => void;
const srcListenerToWrapperListener = new WeakMap<MyOnChangedListener, NativeOnChangedListener>();
export function createWrapperListener(listener: MyOnChangedListener): NativeOnChangedListener {
  return (changes, areaName) => {
    if (areaName !== mainStorageAreaName) return;

    if (BUILD_DEFINITIONS.BROWSER_MAY_HAVE_EQUAL_OLD_AND_NEW_VALUE_IN_STORAGE_CHANGE_OBJECT) {
      changes = filterOutUnchangedValues(changes);
      if (Object.keys(changes).length === 0) {
        return;
      }
    }

    listener(changes);
  };
}

/**
 * This is a wrapper around the native `browser.storage.onChanged.addListener`. The reason we need this is so listeners
 * attached using it only react to changes in `local` storage, but not `sync` (or others). See `src/background.ts`.
 */
export function addOnStorageChangedListener(listener: MyOnChangedListener): void {
  const actualListener = createWrapperListener(listener);
  srcListenerToWrapperListener.set(listener, actualListener);
  browserOrChrome.storage.onChanged.addListener(actualListener);
}
export function removeOnStorageChangedListener(listener: MyOnChangedListener): void {
  const actualListener = srcListenerToWrapperListener.get(listener);
  if (!actualListener) {
    if (IS_DEV_MODE) {
      console.warn('Did not remove listener because it\'s already not attached');
    }
    return;
  }
  browserOrChrome.storage.onChanged.removeListener(actualListener);
}
