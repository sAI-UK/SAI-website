import type { RuntimeMode } from "./types";

export interface TeacherAuthorisation {
  canReview(input: { sessionId: string; mode: RuntimeMode; simulated: boolean }): Promise<boolean>;
}

export const prototypeTeacherAuthorisation: TeacherAuthorisation = {
  async canReview({ sessionId, mode, simulated }) {
    if (!sessionId || !simulated) return false;
    return mode === "demo" || mode === "provider-development";
  },
};
