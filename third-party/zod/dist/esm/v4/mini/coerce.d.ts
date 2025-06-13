import * as core from "zod/v4/core";
import * as schemas from "./schemas.js";
export declare function string(params?: string | core.$ZodStringParams): schemas.ZodMiniString<unknown>;
export declare function number(params?: string | core.$ZodNumberParams): schemas.ZodMiniNumber<unknown>;
export declare function boolean(params?: string | core.$ZodBooleanParams): schemas.ZodMiniBoolean<unknown>;
export declare function bigint(params?: string | core.$ZodBigIntParams): schemas.ZodMiniBigInt<unknown>;
export declare function date(params?: string | core.$ZodDateParams): schemas.ZodMiniDate<unknown>;
