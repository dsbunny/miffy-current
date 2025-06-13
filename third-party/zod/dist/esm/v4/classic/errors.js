import * as core from "zod/v4/core";
import { _$ZodError } from "zod/v4/core";
export const _ZodError = core.$constructor("ZodError", (inst, issues) => {
    _$ZodError.init(inst, issues);
    Object.defineProperty(inst, "format", {
        value: (mapper) => core.formatError(inst, mapper),
        enumerable: false,
    });
    Object.defineProperty(inst, "flatten", {
        value: (mapper) => core.flattenError(inst, mapper),
        enumerable: false,
    });
    Object.defineProperty(inst, "addIssue", {
        value: (issue) => inst.issues.push(issue),
        enumerable: false,
    });
    Object.defineProperty(inst, "addIssues", {
        value: (issues) => inst.issues.push(...issues),
        enumerable: false,
    });
    Object.defineProperty(inst, "isEmpty", {
        get() {
            return inst.issues.length === 0;
        },
    });
});
export class ZodError extends Error {
    constructor(issues) {
        super();
        _ZodError.init(this, issues);
    }
}
// /** @deprecated Use `z.core.$ZodErrorMapCtx` instead. */
// export type ErrorMapCtx = core.$ZodErrorMapCtx;
