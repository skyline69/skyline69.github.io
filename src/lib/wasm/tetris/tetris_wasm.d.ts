/* tslint:disable */
/* eslint-disable */

export function destroy(): void;

export function handle_key_down(code: string): void;

export function handle_key_up(code: string): void;

export function is_game_over(): boolean;

export function level(): number;

export function lines(): number;

export function pause(): void;

export function reset(): void;

export function resume(): void;

export function score(): number;

export function start(host_id: string): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly handle_key_down: (a: number, b: number) => void;
    readonly handle_key_up: (a: number, b: number) => void;
    readonly is_game_over: () => number;
    readonly start: (a: number, b: number) => [number, number];
    readonly resume: () => void;
    readonly reset: () => void;
    readonly pause: () => void;
    readonly destroy: () => void;
    readonly level: () => number;
    readonly lines: () => number;
    readonly score: () => number;
    readonly wasm_bindgen__closure__destroy__h03bd9c7325150abb: (a: number, b: number) => void;
    readonly wasm_bindgen__convert__closures_____invoke__he82da8dfabac2a26: (a: number, b: number, c: number) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h57696dbe9a9943c5: (a: number, b: number, c: any) => void;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
