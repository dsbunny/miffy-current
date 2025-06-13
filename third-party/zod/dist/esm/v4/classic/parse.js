import * as core from "zod/v4/core";
import { ZodError, _ZodError } from "./errors.js";
export const parse = /* @__PURE__ */ core._parse(ZodError);
export const parseAsync = /* @__PURE__ */ core._parseAsync(ZodError);
export const safeParse = /* @__PURE__ */ core._safeParse(_ZodError);
export const safeParseAsync = /* @__PURE__ */ core._safeParseAsync(_ZodError);
