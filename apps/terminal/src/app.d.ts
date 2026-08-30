import type { Session } from "@ae2-terminal/ae2-api";

declare global {
  const __APP_VERSION__: string;

  namespace App {
    interface Locals {
      session: Session | null;
    }

    interface PageData {
      session: Omit<Session, "token"> | null;
      version: string;
      publicMode: boolean;
    }
  }
}

export {};
