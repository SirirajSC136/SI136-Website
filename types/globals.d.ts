// types/globals.d.ts
import type { Mongoose } from 'mongoose';

declare global {
    var mongoose: {
        promise: Promise<Mongoose> | null;
        conn: Mongoose | null;
    };
}
declare module "ical" {
  export function parseICS(data: string): Record<string, any>;
}
