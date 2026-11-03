// Minimal types for the parts of the p5.brush standalone build that SAI Canvas uses.
declare module "p5.brush/standalone" {
  export function load(canvas: HTMLCanvasElement | OffscreenCanvas): void;
  export function scaleBrushes(scale: number): void;
  export function clear(color?: string): void;
  export function render(): void;
  export function push(): void;
  export function pop(): void;
  export function translate(x: number, y: number): void;
  export function seed(value: number): void;
  export function set(name: string, color: string, weight: number): void;
  export function line(x1: number, y1: number, x2: number, y2: number): void;
  export function spline(points: number[][], curvature?: number): unknown;
  export function fill(color: string, opacity?: number): void;
  export function noFill(): void;
  export function fillBleed(strength: number, direction?: "in" | "out"): void;
  export function noStroke(): void;
  export function polygon(points: number[][]): unknown;
}
