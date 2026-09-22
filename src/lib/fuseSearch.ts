import Fuse, { type FuseOptionKey } from "fuse.js";

export const createFuseSearch = <T>(items: T[], keys: FuseOptionKey<T>[]) =>
  new Fuse(items, {
    keys,
    threshold: 0.35,
    ignoreLocation: true,
  });
