// Main Functions:

import { encode } from "./encode.js";
export { encode };
import type { EncodeOptions } from "./encode.js";
export type { EncodeOptions };

import { decode, decodeMulti } from "./decode.js";
export { decode, decodeMulti };
import type { DecodeOptions } from "./decode.js";
export { DecodeOptions };

import { decodeAsync, decodeArrayStream, decodeMultiStream, decodeStream } from "./decodeAsync.js";
export { decodeAsync, decodeArrayStream, decodeMultiStream, decodeStream };

import { Decoder, DataViewIndexOutOfBoundsError } from "./Decoder.js";
import { DecodeError } from "./DecodeError.js";
export { Decoder, DecodeError, DataViewIndexOutOfBoundsError };

import { Encoder } from "./Encoder.js";
export { Encoder };

// Utilitiies for Extension Types:

import { ExtensionCodec } from "./ExtensionCodec.js";
export { ExtensionCodec };
import type { ExtensionCodecType, ExtensionDecoderType, ExtensionEncoderType } from "./ExtensionCodec.js";
export type { ExtensionCodecType, ExtensionDecoderType, ExtensionEncoderType };
import { ExtData } from "./ExtData.js";
export { ExtData };

import {
  EXT_TIMESTAMP,
  encodeDateToTimeSpec,
  encodeTimeSpecToTimestamp,
  decodeTimestampToTimeSpec,
  encodeTimestampExtension,
  decodeTimestampExtension,
} from "./timestamp.js";
export {
  EXT_TIMESTAMP,
  encodeDateToTimeSpec,
  encodeTimeSpecToTimestamp,
  decodeTimestampToTimeSpec,
  encodeTimestampExtension,
  decodeTimestampExtension,
};
