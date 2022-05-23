declare module "make-promises-safe";
declare module "is-minified-code";

interface PromiseFulfilledResult<T> {
  status: "fulfilled";
  value: T;
}
