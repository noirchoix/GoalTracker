// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
// src/app.d.ts
// See https://kit.svelte.dev/docs/types#app
declare global {
  namespace App {
    interface Locals {
      user: { id: string; email: string } | null;
    }
    // interface PageData {}
    // interface Error {}
    // interface Platform {}
  }
}
export {};
