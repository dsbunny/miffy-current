var _Constants,_RRule;const _excluded=["base"],_excluded2=["padTo","floor"];function asyncGeneratorStep(n,t,e,r,o,a,c){try{var i=n[a](c),u=i.value;}catch(n){return void e(n);}i.done?t(u):Promise.resolve(u).then(r,o);}function _asyncToGenerator(n){return function(){var t=this,e=arguments;return new Promise(function(r,o){var a=n.apply(t,e);function _next(n){asyncGeneratorStep(a,r,o,_next,_throw,"next",n);}function _throw(n){asyncGeneratorStep(a,r,o,_next,_throw,"throw",n);}_next(void 0);});};}function ownKeys(e,r){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);r&&(o=o.filter(function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable;})),t.push.apply(t,o);}return t;}function _objectSpread(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{};r%2?ownKeys(Object(t),!0).forEach(function(r){_defineProperty(e,r,t[r]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):ownKeys(Object(t)).forEach(function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(t,r));});}return e;}function _defineProperty(e,r,t){return(r=_toPropertyKey(r))in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e;}function _toPropertyKey(t){var i=_toPrimitive(t,"string");return"symbol"==typeof i?i:i+"";}function _toPrimitive(t,r){if("object"!=typeof t||!t)return t;var e=t[Symbol.toPrimitive];if(void 0!==e){var i=e.call(t,r||"default");if("object"!=typeof i)return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return("string"===r?String:Number)(t);}function _objectWithoutProperties(e,t){if(null==e)return{};var o,r,i=_objectWithoutPropertiesLoose(e,t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);for(r=0;r<n.length;r++)o=n[r],-1===t.indexOf(o)&&{}.propertyIsEnumerable.call(e,o)&&(i[o]=e[o]);}return i;}function _objectWithoutPropertiesLoose(r,e){if(null==r)return{};var t={};for(var n in r)if({}.hasOwnProperty.call(r,n)){if(-1!==e.indexOf(n))continue;t[n]=r[n];}return t;}(function(Object){typeof globalThis!=='object'&&(this?get():(Object.defineProperty(Object.prototype,'_T_',{configurable:true,get:get}),_T_));function get(){var global=this||self;global.globalThis=global;delete Object.prototype._T_;}})(Object);var define=require('define-properties');var callBind=require('call-bind');var implementation=require('./implementation');var getPolyfill=require('./polyfill');var shim=require('./shim');var polyfill=callBind(getPolyfill(),Object);define(polyfill,{getPolyfill:getPolyfill,implementation:implementation,shim:shim});module.exports=polyfill;/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */const proxyMarker=Symbol("Comlink.proxy");const createEndpoint=Symbol("Comlink.endpoint");const releaseProxy=Symbol("Comlink.releaseProxy");const finalizer=Symbol("Comlink.finalizer");const throwMarker=Symbol("Comlink.thrown");const isObject$1=val=>typeof val==="object"&&val!==null||typeof val==="function";/**
 * Internal transfer handle to handle objects marked to proxy.
 */const proxyTransferHandler={canHandle:val=>isObject$1(val)&&val[proxyMarker],serialize(obj){const{port1,port2}=new MessageChannel();expose(obj,port1);return[port2,[port2]];},deserialize(port){port.start();return wrap(port);}};/**
 * Internal transfer handler to handle thrown exceptions.
 */const throwTransferHandler={canHandle:value=>isObject$1(value)&&throwMarker in value,serialize({value}){let serialized;if(value instanceof Error){serialized={isError:true,value:{message:value.message,name:value.name,stack:value.stack}};}else{serialized={isError:false,value};}return[serialized,[]];},deserialize(serialized){if(serialized.isError){throw Object.assign(new Error(serialized.value.message),serialized.value);}throw serialized.value;}};/**
 * Allows customizing the serialization of certain values.
 */const transferHandlers=new Map([["proxy",proxyTransferHandler],["throw",throwTransferHandler]]);function isAllowedOrigin(allowedOrigins,origin){for(const allowedOrigin of allowedOrigins){if(origin===allowedOrigin||allowedOrigin==="*"){return true;}if(allowedOrigin instanceof RegExp&&allowedOrigin.test(origin)){return true;}}return false;}function expose(obj,ep=globalThis,allowedOrigins=["*"]){ep.addEventListener("message",function callback(ev){if(!ev||!ev.data){return;}if(!isAllowedOrigin(allowedOrigins,ev.origin)){console.warn(`Invalid origin '${ev.origin}' for comlink proxy`);return;}const{id,type,path}=Object.assign({path:[]},ev.data);const argumentList=(ev.data.argumentList||[]).map(fromWireValue);let returnValue;try{const parent=path.slice(0,-1).reduce((obj,prop)=>obj[prop],obj);const rawValue=path.reduce((obj,prop)=>obj[prop],obj);switch(type){case"GET"/* MessageType.GET */:{returnValue=rawValue;}break;case"SET"/* MessageType.SET */:{parent[path.slice(-1)[0]]=fromWireValue(ev.data.value);returnValue=true;}break;case"APPLY"/* MessageType.APPLY */:{returnValue=rawValue.apply(parent,argumentList);}break;case"CONSTRUCT"/* MessageType.CONSTRUCT */:{const value=new rawValue(...argumentList);returnValue=proxy(value);}break;case"ENDPOINT"/* MessageType.ENDPOINT */:{const{port1,port2}=new MessageChannel();expose(obj,port2);returnValue=transfer(port1,[port1]);}break;case"RELEASE"/* MessageType.RELEASE */:{returnValue=undefined;}break;default:return;}}catch(value){returnValue={value,[throwMarker]:0};}Promise.resolve(returnValue).catch(value=>{return{value,[throwMarker]:0};}).then(returnValue=>{const[wireValue,transferables]=toWireValue(returnValue);ep.postMessage(Object.assign(Object.assign({},wireValue),{id}),transferables);if(type==="RELEASE"/* MessageType.RELEASE */){// detach and deactive after sending release response above.
ep.removeEventListener("message",callback);closeEndPoint(ep);if(finalizer in obj&&typeof obj[finalizer]==="function"){obj[finalizer]();}}}).catch(error=>{// Send Serialization Error To Caller
const[wireValue,transferables]=toWireValue({value:new TypeError("Unserializable return value"),[throwMarker]:0});ep.postMessage(Object.assign(Object.assign({},wireValue),{id}),transferables);});});if(ep.start){ep.start();}}function isMessagePort(endpoint){return endpoint.constructor.name==="MessagePort";}function closeEndPoint(endpoint){if(isMessagePort(endpoint))endpoint.close();}function wrap(ep,target){const pendingListeners=new Map();ep.addEventListener("message",function handleMessage(ev){const{data}=ev;if(!data||!data.id){return;}const resolver=pendingListeners.get(data.id);if(!resolver){return;}try{resolver(data);}finally{pendingListeners.delete(data.id);}});return createProxy(ep,pendingListeners,[],target);}function throwIfProxyReleased(isReleased){if(isReleased){throw new Error("Proxy has been released and is not useable");}}function releaseEndpoint(ep){return requestResponseMessage(ep,new Map(),{type:"RELEASE"/* MessageType.RELEASE */}).then(()=>{closeEndPoint(ep);});}const proxyCounter=new WeakMap();const proxyFinalizers="FinalizationRegistry"in globalThis&&new FinalizationRegistry(ep=>{const newCount=(proxyCounter.get(ep)||0)-1;proxyCounter.set(ep,newCount);if(newCount===0){releaseEndpoint(ep);}});function registerProxy(proxy,ep){const newCount=(proxyCounter.get(ep)||0)+1;proxyCounter.set(ep,newCount);if(proxyFinalizers){proxyFinalizers.register(proxy,ep,proxy);}}function unregisterProxy(proxy){if(proxyFinalizers){proxyFinalizers.unregister(proxy);}}function createProxy(ep,pendingListeners,path=[],target=function(){}){let isProxyReleased=false;const proxy=new Proxy(target,{get(_target,prop){throwIfProxyReleased(isProxyReleased);if(prop===releaseProxy){return()=>{unregisterProxy(proxy);releaseEndpoint(ep);pendingListeners.clear();isProxyReleased=true;};}if(prop==="then"){if(path.length===0){return{then:()=>proxy};}const r=requestResponseMessage(ep,pendingListeners,{type:"GET"/* MessageType.GET */,path:path.map(p=>p.toString())}).then(fromWireValue);return r.then.bind(r);}return createProxy(ep,pendingListeners,[...path,prop]);},set(_target,prop,rawValue){throwIfProxyReleased(isProxyReleased);// FIXME: ES6 Proxy Handler `set` methods are supposed to return a
// boolean. To show good will, we return true asynchronously ¯\_(ツ)_/¯
const[value,transferables]=toWireValue(rawValue);return requestResponseMessage(ep,pendingListeners,{type:"SET"/* MessageType.SET */,path:[...path,prop].map(p=>p.toString()),value},transferables).then(fromWireValue);},apply(_target,_thisArg,rawArgumentList){throwIfProxyReleased(isProxyReleased);const last=path[path.length-1];if(last===createEndpoint){return requestResponseMessage(ep,pendingListeners,{type:"ENDPOINT"/* MessageType.ENDPOINT */}).then(fromWireValue);}// We just pretend that `bind()` didn’t happen.
if(last==="bind"){return createProxy(ep,pendingListeners,path.slice(0,-1));}const[argumentList,transferables]=processArguments(rawArgumentList);return requestResponseMessage(ep,pendingListeners,{type:"APPLY"/* MessageType.APPLY */,path:path.map(p=>p.toString()),argumentList},transferables).then(fromWireValue);},construct(_target,rawArgumentList){throwIfProxyReleased(isProxyReleased);const[argumentList,transferables]=processArguments(rawArgumentList);return requestResponseMessage(ep,pendingListeners,{type:"CONSTRUCT"/* MessageType.CONSTRUCT */,path:path.map(p=>p.toString()),argumentList},transferables).then(fromWireValue);}});registerProxy(proxy,ep);return proxy;}function myFlat(arr){return Array.prototype.concat.apply([],arr);}function processArguments(argumentList){const processed=argumentList.map(toWireValue);return[processed.map(v=>v[0]),myFlat(processed.map(v=>v[1]))];}const transferCache=new WeakMap();function transfer(obj,transfers){transferCache.set(obj,transfers);return obj;}function proxy(obj){return Object.assign(obj,{[proxyMarker]:true});}function toWireValue(value){for(const[name,handler]of transferHandlers){if(handler.canHandle(value)){const[serializedValue,transferables]=handler.serialize(value);return[{type:"HANDLER"/* WireValueType.HANDLER */,name,value:serializedValue},transferables];}}return[{type:"RAW"/* WireValueType.RAW */,value},transferCache.get(value)||[]];}function fromWireValue(value){switch(value.type){case"HANDLER"/* WireValueType.HANDLER */:return transferHandlers.get(value.name).deserialize(value.value);case"RAW"/* WireValueType.RAW */:return value.value;}}function requestResponseMessage(ep,pendingListeners,msg,transfers){return new Promise(resolve=>{const id=generateUUID();pendingListeners.set(id,resolve);if(ep.start){ep.start();}ep.postMessage(Object.assign({id},msg),transfers);});}function generateUUID(){return new Array(4).fill(0).map(()=>Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16)).join("-");}// these aren't really private, but nor are they really useful to document
/**
 * @private
 */class LuxonError extends Error{}/**
 * @private
 */class InvalidDateTimeError extends LuxonError{constructor(reason){super(`Invalid DateTime: ${reason.toMessage()}`);}}/**
 * @private
 */class InvalidIntervalError extends LuxonError{constructor(reason){super(`Invalid Interval: ${reason.toMessage()}`);}}/**
 * @private
 */class InvalidDurationError extends LuxonError{constructor(reason){super(`Invalid Duration: ${reason.toMessage()}`);}}/**
 * @private
 */class ConflictingSpecificationError extends LuxonError{}/**
 * @private
 */class InvalidUnitError extends LuxonError{constructor(unit){super(`Invalid unit ${unit}`);}}/**
 * @private
 */class InvalidArgumentError extends LuxonError{}/**
 * @private
 */class ZoneIsAbstractError extends LuxonError{constructor(){super("Zone is an abstract class");}}/**
 * @private
 */const n="numeric",s="short",l="long";const DATE_SHORT={year:n,month:n,day:n};const DATE_MED={year:n,month:s,day:n};const DATE_MED_WITH_WEEKDAY={year:n,month:s,day:n,weekday:s};const DATE_FULL={year:n,month:l,day:n};const DATE_HUGE={year:n,month:l,day:n,weekday:l};const TIME_SIMPLE={hour:n,minute:n};const TIME_WITH_SECONDS={hour:n,minute:n,second:n};const TIME_WITH_SHORT_OFFSET={hour:n,minute:n,second:n,timeZoneName:s};const TIME_WITH_LONG_OFFSET={hour:n,minute:n,second:n,timeZoneName:l};const TIME_24_SIMPLE={hour:n,minute:n,hourCycle:"h23"};const TIME_24_WITH_SECONDS={hour:n,minute:n,second:n,hourCycle:"h23"};const TIME_24_WITH_SHORT_OFFSET={hour:n,minute:n,second:n,hourCycle:"h23",timeZoneName:s};const TIME_24_WITH_LONG_OFFSET={hour:n,minute:n,second:n,hourCycle:"h23",timeZoneName:l};const DATETIME_SHORT={year:n,month:n,day:n,hour:n,minute:n};const DATETIME_SHORT_WITH_SECONDS={year:n,month:n,day:n,hour:n,minute:n,second:n};const DATETIME_MED={year:n,month:s,day:n,hour:n,minute:n};const DATETIME_MED_WITH_SECONDS={year:n,month:s,day:n,hour:n,minute:n,second:n};const DATETIME_MED_WITH_WEEKDAY={year:n,month:s,day:n,weekday:s,hour:n,minute:n};const DATETIME_FULL={year:n,month:l,day:n,hour:n,minute:n,timeZoneName:s};const DATETIME_FULL_WITH_SECONDS={year:n,month:l,day:n,hour:n,minute:n,second:n,timeZoneName:s};const DATETIME_HUGE={year:n,month:l,day:n,weekday:l,hour:n,minute:n,timeZoneName:l};const DATETIME_HUGE_WITH_SECONDS={year:n,month:l,day:n,weekday:l,hour:n,minute:n,second:n,timeZoneName:l};/**
 * @interface
 */class Zone{/**
   * The type of zone
   * @abstract
   * @type {string}
   */get type(){throw new ZoneIsAbstractError();}/**
   * The name of this zone.
   * @abstract
   * @type {string}
   */get name(){throw new ZoneIsAbstractError();}/**
   * The IANA name of this zone.
   * Defaults to `name` if not overwritten by a subclass.
   * @abstract
   * @type {string}
   */get ianaName(){return this.name;}/**
   * Returns whether the offset is known to be fixed for the whole year.
   * @abstract
   * @type {boolean}
   */get isUniversal(){throw new ZoneIsAbstractError();}/**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.locale - What locale to return the offset name in.
   * @return {string}
   */offsetName(ts,opts){throw new ZoneIsAbstractError();}/**
   * Returns the offset's value as a string
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */formatOffset(ts,format){throw new ZoneIsAbstractError();}/**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */offset(ts){throw new ZoneIsAbstractError();}/**
   * Return whether this Zone is equal to another zone
   * @abstract
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */equals(otherZone){throw new ZoneIsAbstractError();}/**
   * Return whether this Zone is valid.
   * @abstract
   * @type {boolean}
   */get isValid(){throw new ZoneIsAbstractError();}}let singleton$1=null;/**
 * Represents the local zone for this JavaScript environment.
 * @implements {Zone}
 */class SystemZone extends Zone{/**
   * Get a singleton instance of the local zone
   * @return {SystemZone}
   */static get instance(){if(singleton$1===null){singleton$1=new SystemZone();}return singleton$1;}/** @override **/get type(){return"system";}/** @override **/get name(){return new Intl.DateTimeFormat().resolvedOptions().timeZone;}/** @override **/get isUniversal(){return false;}/** @override **/offsetName(ts,{format,locale}){return parseZoneInfo(ts,format,locale);}/** @override **/formatOffset(ts,format){return formatOffset(this.offset(ts),format);}/** @override **/offset(ts){return-new Date(ts).getTimezoneOffset();}/** @override **/equals(otherZone){return otherZone.type==="system";}/** @override **/get isValid(){return true;}}const dtfCache=new Map();function makeDTF(zoneName){let dtf=dtfCache.get(zoneName);if(dtf===undefined){dtf=new Intl.DateTimeFormat("en-US",{hour12:false,timeZone:zoneName,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",era:"short"});dtfCache.set(zoneName,dtf);}return dtf;}const typeToPos={year:0,month:1,day:2,era:3,hour:4,minute:5,second:6};function hackyOffset(dtf,date){const formatted=dtf.format(date).replace(/\u200E/g,""),parsed=/(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(formatted),[,fMonth,fDay,fYear,fadOrBc,fHour,fMinute,fSecond]=parsed;return[fYear,fMonth,fDay,fadOrBc,fHour,fMinute,fSecond];}function partsOffset(dtf,date){const formatted=dtf.formatToParts(date);const filled=[];for(let i=0;i<formatted.length;i++){const{type,value}=formatted[i];const pos=typeToPos[type];if(type==="era"){filled[pos]=value;}else if(!isUndefined(pos)){filled[pos]=parseInt(value,10);}}return filled;}const ianaZoneCache=new Map();/**
 * A zone identified by an IANA identifier, like America/New_York
 * @implements {Zone}
 */class IANAZone extends Zone{/**
   * @param {string} name - Zone name
   * @return {IANAZone}
   */static create(name){let zone=ianaZoneCache.get(name);if(zone===undefined){ianaZoneCache.set(name,zone=new IANAZone(name));}return zone;}/**
   * Reset local caches. Should only be necessary in testing scenarios.
   * @return {void}
   */static resetCache(){ianaZoneCache.clear();dtfCache.clear();}/**
   * Returns whether the provided string is a valid specifier. This only checks the string's format, not that the specifier identifies a known zone; see isValidZone for that.
   * @param {string} s - The string to check validity on
   * @example IANAZone.isValidSpecifier("America/New_York") //=> true
   * @example IANAZone.isValidSpecifier("Sport~~blorp") //=> false
   * @deprecated For backward compatibility, this forwards to isValidZone, better use `isValidZone()` directly instead.
   * @return {boolean}
   */static isValidSpecifier(s){return this.isValidZone(s);}/**
   * Returns whether the provided string identifies a real zone
   * @param {string} zone - The string to check
   * @example IANAZone.isValidZone("America/New_York") //=> true
   * @example IANAZone.isValidZone("Fantasia/Castle") //=> false
   * @example IANAZone.isValidZone("Sport~~blorp") //=> false
   * @return {boolean}
   */static isValidZone(zone){if(!zone){return false;}try{new Intl.DateTimeFormat("en-US",{timeZone:zone}).format();return true;}catch(e){return false;}}constructor(name){super();/** @private **/this.zoneName=name;/** @private **/this.valid=IANAZone.isValidZone(name);}/**
   * The type of zone. `iana` for all instances of `IANAZone`.
   * @override
   * @type {string}
   */get type(){return"iana";}/**
   * The name of this zone (i.e. the IANA zone name).
   * @override
   * @type {string}
   */get name(){return this.zoneName;}/**
   * Returns whether the offset is known to be fixed for the whole year:
   * Always returns false for all IANA zones.
   * @override
   * @type {boolean}
   */get isUniversal(){return false;}/**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.locale - What locale to return the offset name in.
   * @return {string}
   */offsetName(ts,{format,locale}){return parseZoneInfo(ts,format,locale,this.name);}/**
   * Returns the offset's value as a string
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */formatOffset(ts,format){return formatOffset(this.offset(ts),format);}/**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @override
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */offset(ts){if(!this.valid)return NaN;const date=new Date(ts);if(isNaN(date))return NaN;const dtf=makeDTF(this.name);let[year,month,day,adOrBc,hour,minute,second]=dtf.formatToParts?partsOffset(dtf,date):hackyOffset(dtf,date);if(adOrBc==="BC"){year=-Math.abs(year)+1;}// because we're using hour12 and https://bugs.chromium.org/p/chromium/issues/detail?id=1025564&can=2&q=%2224%3A00%22%20datetimeformat
const adjustedHour=hour===24?0:hour;const asUTC=objToLocalTS({year,month,day,hour:adjustedHour,minute,second,millisecond:0});let asTS=+date;const over=asTS%1000;asTS-=over>=0?over:1000+over;return(asUTC-asTS)/(60*1000);}/**
   * Return whether this Zone is equal to another zone
   * @override
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */equals(otherZone){return otherZone.type==="iana"&&otherZone.name===this.name;}/**
   * Return whether this Zone is valid.
   * @override
   * @type {boolean}
   */get isValid(){return this.valid;}}// todo - remap caching
let intlLFCache={};function getCachedLF(locString,opts={}){const key=JSON.stringify([locString,opts]);let dtf=intlLFCache[key];if(!dtf){dtf=new Intl.ListFormat(locString,opts);intlLFCache[key]=dtf;}return dtf;}const intlDTCache=new Map();function getCachedDTF(locString,opts={}){const key=JSON.stringify([locString,opts]);let dtf=intlDTCache.get(key);if(dtf===undefined){dtf=new Intl.DateTimeFormat(locString,opts);intlDTCache.set(key,dtf);}return dtf;}const intlNumCache=new Map();function getCachedINF(locString,opts={}){const key=JSON.stringify([locString,opts]);let inf=intlNumCache.get(key);if(inf===undefined){inf=new Intl.NumberFormat(locString,opts);intlNumCache.set(key,inf);}return inf;}const intlRelCache=new Map();function getCachedRTF(locString,opts={}){const{base}=opts,cacheKeyOpts=_objectWithoutProperties(opts,_excluded);// exclude `base` from the options
const key=JSON.stringify([locString,cacheKeyOpts]);let inf=intlRelCache.get(key);if(inf===undefined){inf=new Intl.RelativeTimeFormat(locString,opts);intlRelCache.set(key,inf);}return inf;}let sysLocaleCache=null;function systemLocale(){if(sysLocaleCache){return sysLocaleCache;}else{sysLocaleCache=new Intl.DateTimeFormat().resolvedOptions().locale;return sysLocaleCache;}}const intlResolvedOptionsCache=new Map();function getCachedIntResolvedOptions(locString){let opts=intlResolvedOptionsCache.get(locString);if(opts===undefined){opts=new Intl.DateTimeFormat(locString).resolvedOptions();intlResolvedOptionsCache.set(locString,opts);}return opts;}const weekInfoCache=new Map();function getCachedWeekInfo(locString){let data=weekInfoCache.get(locString);if(!data){const locale=new Intl.Locale(locString);// browsers currently implement this as a property, but spec says it should be a getter function
data="getWeekInfo"in locale?locale.getWeekInfo():locale.weekInfo;// minimalDays was removed from WeekInfo: https://github.com/tc39/proposal-intl-locale-info/issues/86
if(!("minimalDays"in data)){data=_objectSpread(_objectSpread({},fallbackWeekSettings),data);}weekInfoCache.set(locString,data);}return data;}function parseLocaleString(localeStr){// I really want to avoid writing a BCP 47 parser
// see, e.g. https://github.com/wooorm/bcp-47
// Instead, we'll do this:
// a) if the string has no -u extensions, just leave it alone
// b) if it does, use Intl to resolve everything
// c) if Intl fails, try again without the -u
// private subtags and unicode subtags have ordering requirements,
// and we're not properly parsing this, so just strip out the
// private ones if they exist.
const xIndex=localeStr.indexOf("-x-");if(xIndex!==-1){localeStr=localeStr.substring(0,xIndex);}const uIndex=localeStr.indexOf("-u-");if(uIndex===-1){return[localeStr];}else{let options;let selectedStr;try{options=getCachedDTF(localeStr).resolvedOptions();selectedStr=localeStr;}catch(e){const smaller=localeStr.substring(0,uIndex);options=getCachedDTF(smaller).resolvedOptions();selectedStr=smaller;}const{numberingSystem,calendar}=options;return[selectedStr,numberingSystem,calendar];}}function intlConfigString(localeStr,numberingSystem,outputCalendar){if(outputCalendar||numberingSystem){if(!localeStr.includes("-u-")){localeStr+="-u";}if(outputCalendar){localeStr+=`-ca-${outputCalendar}`;}if(numberingSystem){localeStr+=`-nu-${numberingSystem}`;}return localeStr;}else{return localeStr;}}function mapMonths(f){const ms=[];for(let i=1;i<=12;i++){const dt=DateTime$1.utc(2009,i,1);ms.push(f(dt));}return ms;}function mapWeekdays(f){const ms=[];for(let i=1;i<=7;i++){const dt=DateTime$1.utc(2016,11,13+i);ms.push(f(dt));}return ms;}function listStuff(loc,length,englishFn,intlFn){const mode=loc.listingMode();if(mode==="error"){return null;}else if(mode==="en"){return englishFn(length);}else{return intlFn(length);}}function supportsFastNumbers(loc){if(loc.numberingSystem&&loc.numberingSystem!=="latn"){return false;}else{return loc.numberingSystem==="latn"||!loc.locale||loc.locale.startsWith("en")||getCachedIntResolvedOptions(loc.locale).numberingSystem==="latn";}}/**
 * @private
 */class PolyNumberFormatter{constructor(intl,forceSimple,opts){this.padTo=opts.padTo||0;this.floor=opts.floor||false;const{padTo,floor}=opts,otherOpts=_objectWithoutProperties(opts,_excluded2);if(!forceSimple||Object.keys(otherOpts).length>0){const intlOpts=_objectSpread({useGrouping:false},opts);if(opts.padTo>0)intlOpts.minimumIntegerDigits=opts.padTo;this.inf=getCachedINF(intl,intlOpts);}}format(i){if(this.inf){const fixed=this.floor?Math.floor(i):i;return this.inf.format(fixed);}else{// to match the browser's numberformatter defaults
const fixed=this.floor?Math.floor(i):roundTo(i,3);return padStart$1(fixed,this.padTo);}}}/**
 * @private
 */class PolyDateFormatter{constructor(dt,intl,opts){this.opts=opts;this.originalZone=undefined;let z=undefined;if(this.opts.timeZone){// Don't apply any workarounds if a timeZone is explicitly provided in opts
this.dt=dt;}else if(dt.zone.type==="fixed"){// UTC-8 or Etc/UTC-8 are not part of tzdata, only Etc/GMT+8 and the like.
// That is why fixed-offset TZ is set to that unless it is:
// 1. Representing offset 0 when UTC is used to maintain previous behavior and does not become GMT.
// 2. Unsupported by the browser:
//    - some do not support Etc/
//    - < Etc/GMT-14, > Etc/GMT+12, and 30-minute or 45-minute offsets are not part of tzdata
const gmtOffset=-1*(dt.offset/60);const offsetZ=gmtOffset>=0?`Etc/GMT+${gmtOffset}`:`Etc/GMT${gmtOffset}`;if(dt.offset!==0&&IANAZone.create(offsetZ).valid){z=offsetZ;this.dt=dt;}else{// Not all fixed-offset zones like Etc/+4:30 are present in tzdata so
// we manually apply the offset and substitute the zone as needed.
z="UTC";this.dt=dt.offset===0?dt:dt.setZone("UTC").plus({minutes:dt.offset});this.originalZone=dt.zone;}}else if(dt.zone.type==="system"){this.dt=dt;}else if(dt.zone.type==="iana"){this.dt=dt;z=dt.zone.name;}else{// Custom zones can have any offset / offsetName so we just manually
// apply the offset and substitute the zone as needed.
z="UTC";this.dt=dt.setZone("UTC").plus({minutes:dt.offset});this.originalZone=dt.zone;}const intlOpts=_objectSpread({},this.opts);intlOpts.timeZone=intlOpts.timeZone||z;this.dtf=getCachedDTF(intl,intlOpts);}format(){if(this.originalZone){// If we have to substitute in the actual zone name, we have to use
// formatToParts so that the timezone can be replaced.
return this.formatToParts().map(({value})=>value).join("");}return this.dtf.format(this.dt.toJSDate());}formatToParts(){const parts=this.dtf.formatToParts(this.dt.toJSDate());if(this.originalZone){return parts.map(part=>{if(part.type==="timeZoneName"){const offsetName=this.originalZone.offsetName(this.dt.ts,{locale:this.dt.locale,format:this.opts.timeZoneName});return _objectSpread(_objectSpread({},part),{},{value:offsetName});}else{return part;}});}return parts;}resolvedOptions(){return this.dtf.resolvedOptions();}}/**
 * @private
 */class PolyRelFormatter{constructor(intl,isEnglish,opts){this.opts=_objectSpread({style:"long"},opts);if(!isEnglish&&hasRelative()){this.rtf=getCachedRTF(intl,opts);}}format(count,unit){if(this.rtf){return this.rtf.format(count,unit);}else{return formatRelativeTime(unit,count,this.opts.numeric,this.opts.style!=="long");}}formatToParts(count,unit){if(this.rtf){return this.rtf.formatToParts(count,unit);}else{return[];}}}const fallbackWeekSettings={firstDay:1,minimalDays:4,weekend:[6,7]};/**
 * @private
 */class Locale{static fromOpts(opts){return Locale.create(opts.locale,opts.numberingSystem,opts.outputCalendar,opts.weekSettings,opts.defaultToEN);}static create(locale,numberingSystem,outputCalendar,weekSettings,defaultToEN=false){const specifiedLocale=locale||Settings.defaultLocale;// the system locale is useful for human-readable strings but annoying for parsing/formatting known formats
const localeR=specifiedLocale||(defaultToEN?"en-US":systemLocale());const numberingSystemR=numberingSystem||Settings.defaultNumberingSystem;const outputCalendarR=outputCalendar||Settings.defaultOutputCalendar;const weekSettingsR=validateWeekSettings(weekSettings)||Settings.defaultWeekSettings;return new Locale(localeR,numberingSystemR,outputCalendarR,weekSettingsR,specifiedLocale);}static resetCache(){sysLocaleCache=null;intlDTCache.clear();intlNumCache.clear();intlRelCache.clear();intlResolvedOptionsCache.clear();weekInfoCache.clear();}static fromObject({locale,numberingSystem,outputCalendar,weekSettings}={}){return Locale.create(locale,numberingSystem,outputCalendar,weekSettings);}constructor(locale,numbering,outputCalendar,weekSettings,specifiedLocale){const[parsedLocale,parsedNumberingSystem,parsedOutputCalendar]=parseLocaleString(locale);this.locale=parsedLocale;this.numberingSystem=numbering||parsedNumberingSystem||null;this.outputCalendar=outputCalendar||parsedOutputCalendar||null;this.weekSettings=weekSettings;this.intl=intlConfigString(this.locale,this.numberingSystem,this.outputCalendar);this.weekdaysCache={format:{},standalone:{}};this.monthsCache={format:{},standalone:{}};this.meridiemCache=null;this.eraCache={};this.specifiedLocale=specifiedLocale;this.fastNumbersCached=null;}get fastNumbers(){if(this.fastNumbersCached==null){this.fastNumbersCached=supportsFastNumbers(this);}return this.fastNumbersCached;}listingMode(){const isActuallyEn=this.isEnglish();const hasNoWeirdness=(this.numberingSystem===null||this.numberingSystem==="latn")&&(this.outputCalendar===null||this.outputCalendar==="gregory");return isActuallyEn&&hasNoWeirdness?"en":"intl";}clone(alts){if(!alts||Object.getOwnPropertyNames(alts).length===0){return this;}else{return Locale.create(alts.locale||this.specifiedLocale,alts.numberingSystem||this.numberingSystem,alts.outputCalendar||this.outputCalendar,validateWeekSettings(alts.weekSettings)||this.weekSettings,alts.defaultToEN||false);}}redefaultToEN(alts={}){return this.clone(_objectSpread(_objectSpread({},alts),{},{defaultToEN:true}));}redefaultToSystem(alts={}){return this.clone(_objectSpread(_objectSpread({},alts),{},{defaultToEN:false}));}months(length,format=false){return listStuff(this,length,months,()=>{const intl=format?{month:length,day:"numeric"}:{month:length},formatStr=format?"format":"standalone";if(!this.monthsCache[formatStr][length]){this.monthsCache[formatStr][length]=mapMonths(dt=>this.extract(dt,intl,"month"));}return this.monthsCache[formatStr][length];});}weekdays(length,format=false){return listStuff(this,length,weekdays,()=>{const intl=format?{weekday:length,year:"numeric",month:"long",day:"numeric"}:{weekday:length},formatStr=format?"format":"standalone";if(!this.weekdaysCache[formatStr][length]){this.weekdaysCache[formatStr][length]=mapWeekdays(dt=>this.extract(dt,intl,"weekday"));}return this.weekdaysCache[formatStr][length];});}meridiems(){return listStuff(this,undefined,()=>meridiems,()=>{// In theory there could be aribitrary day periods. We're gonna assume there are exactly two
// for AM and PM. This is probably wrong, but it's makes parsing way easier.
if(!this.meridiemCache){const intl={hour:"numeric",hourCycle:"h12"};this.meridiemCache=[DateTime$1.utc(2016,11,13,9),DateTime$1.utc(2016,11,13,19)].map(dt=>this.extract(dt,intl,"dayperiod"));}return this.meridiemCache;});}eras(length){return listStuff(this,length,eras,()=>{const intl={era:length};// This is problematic. Different calendars are going to define eras totally differently. What I need is the minimum set of dates
// to definitely enumerate them.
if(!this.eraCache[length]){this.eraCache[length]=[DateTime$1.utc(-40,1,1),DateTime$1.utc(2017,1,1)].map(dt=>this.extract(dt,intl,"era"));}return this.eraCache[length];});}extract(dt,intlOpts,field){const df=this.dtFormatter(dt,intlOpts),results=df.formatToParts(),matching=results.find(m=>m.type.toLowerCase()===field);return matching?matching.value:null;}numberFormatter(opts={}){// this forcesimple option is never used (the only caller short-circuits on it, but it seems safer to leave)
// (in contrast, the rest of the condition is used heavily)
return new PolyNumberFormatter(this.intl,opts.forceSimple||this.fastNumbers,opts);}dtFormatter(dt,intlOpts={}){return new PolyDateFormatter(dt,this.intl,intlOpts);}relFormatter(opts={}){return new PolyRelFormatter(this.intl,this.isEnglish(),opts);}listFormatter(opts={}){return getCachedLF(this.intl,opts);}isEnglish(){return this.locale==="en"||this.locale.toLowerCase()==="en-us"||getCachedIntResolvedOptions(this.intl).locale.startsWith("en-us");}getWeekSettings(){if(this.weekSettings){return this.weekSettings;}else if(!hasLocaleWeekInfo()){return fallbackWeekSettings;}else{return getCachedWeekInfo(this.locale);}}getStartOfWeek(){return this.getWeekSettings().firstDay;}getMinDaysInFirstWeek(){return this.getWeekSettings().minimalDays;}getWeekendDays(){return this.getWeekSettings().weekend;}equals(other){return this.locale===other.locale&&this.numberingSystem===other.numberingSystem&&this.outputCalendar===other.outputCalendar;}toString(){return`Locale(${this.locale}, ${this.numberingSystem}, ${this.outputCalendar})`;}}let singleton=null;/**
 * A zone with a fixed offset (meaning no DST)
 * @implements {Zone}
 */class FixedOffsetZone extends Zone{/**
   * Get a singleton instance of UTC
   * @return {FixedOffsetZone}
   */static get utcInstance(){if(singleton===null){singleton=new FixedOffsetZone(0);}return singleton;}/**
   * Get an instance with a specified offset
   * @param {number} offset - The offset in minutes
   * @return {FixedOffsetZone}
   */static instance(offset){return offset===0?FixedOffsetZone.utcInstance:new FixedOffsetZone(offset);}/**
   * Get an instance of FixedOffsetZone from a UTC offset string, like "UTC+6"
   * @param {string} s - The offset string to parse
   * @example FixedOffsetZone.parseSpecifier("UTC+6")
   * @example FixedOffsetZone.parseSpecifier("UTC+06")
   * @example FixedOffsetZone.parseSpecifier("UTC-6:00")
   * @return {FixedOffsetZone}
   */static parseSpecifier(s){if(s){const r=s.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);if(r){return new FixedOffsetZone(signedOffset(r[1],r[2]));}}return null;}constructor(offset){super();/** @private **/this.fixed=offset;}/**
   * The type of zone. `fixed` for all instances of `FixedOffsetZone`.
   * @override
   * @type {string}
   */get type(){return"fixed";}/**
   * The name of this zone.
   * All fixed zones' names always start with "UTC" (plus optional offset)
   * @override
   * @type {string}
   */get name(){return this.fixed===0?"UTC":`UTC${formatOffset(this.fixed,"narrow")}`;}/**
   * The IANA name of this zone, i.e. `Etc/UTC` or `Etc/GMT+/-nn`
   *
   * @override
   * @type {string}
   */get ianaName(){if(this.fixed===0){return"Etc/UTC";}else{return`Etc/GMT${formatOffset(-this.fixed,"narrow")}`;}}/**
   * Returns the offset's common name at the specified timestamp.
   *
   * For fixed offset zones this equals to the zone name.
   * @override
   */offsetName(){return this.name;}/**
   * Returns the offset's value as a string
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */formatOffset(ts,format){return formatOffset(this.fixed,format);}/**
   * Returns whether the offset is known to be fixed for the whole year:
   * Always returns true for all fixed offset zones.
   * @override
   * @type {boolean}
   */get isUniversal(){return true;}/**
   * Return the offset in minutes for this zone at the specified timestamp.
   *
   * For fixed offset zones, this is constant and does not depend on a timestamp.
   * @override
   * @return {number}
   */offset(){return this.fixed;}/**
   * Return whether this Zone is equal to another zone (i.e. also fixed and same offset)
   * @override
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */equals(otherZone){return otherZone.type==="fixed"&&otherZone.fixed===this.fixed;}/**
   * Return whether this Zone is valid:
   * All fixed offset zones are valid.
   * @override
   * @type {boolean}
   */get isValid(){return true;}}/**
 * A zone that failed to parse. You should never need to instantiate this.
 * @implements {Zone}
 */class InvalidZone extends Zone{constructor(zoneName){super();/**  @private */this.zoneName=zoneName;}/** @override **/get type(){return"invalid";}/** @override **/get name(){return this.zoneName;}/** @override **/get isUniversal(){return false;}/** @override **/offsetName(){return null;}/** @override **/formatOffset(){return"";}/** @override **/offset(){return NaN;}/** @override **/equals(){return false;}/** @override **/get isValid(){return false;}}/**
 * @private
 */function normalizeZone(input,defaultZone){if(isUndefined(input)||input===null){return defaultZone;}else if(input instanceof Zone){return input;}else if(isString(input)){const lowered=input.toLowerCase();if(lowered==="default")return defaultZone;else if(lowered==="local"||lowered==="system")return SystemZone.instance;else if(lowered==="utc"||lowered==="gmt")return FixedOffsetZone.utcInstance;else return FixedOffsetZone.parseSpecifier(lowered)||IANAZone.create(input);}else if(isNumber$1(input)){return FixedOffsetZone.instance(input);}else if(typeof input==="object"&&"offset"in input&&typeof input.offset==="function"){// This is dumb, but the instanceof check above doesn't seem to really work
// so we're duck checking it
return input;}else{return new InvalidZone(input);}}const numberingSystems={arab:"[\u0660-\u0669]",arabext:"[\u06F0-\u06F9]",bali:"[\u1B50-\u1B59]",beng:"[\u09E6-\u09EF]",deva:"[\u0966-\u096F]",fullwide:"[\uFF10-\uFF19]",gujr:"[\u0AE6-\u0AEF]",hanidec:"[〇|一|二|三|四|五|六|七|八|九]",khmr:"[\u17E0-\u17E9]",knda:"[\u0CE6-\u0CEF]",laoo:"[\u0ED0-\u0ED9]",limb:"[\u1946-\u194F]",mlym:"[\u0D66-\u0D6F]",mong:"[\u1810-\u1819]",mymr:"[\u1040-\u1049]",orya:"[\u0B66-\u0B6F]",tamldec:"[\u0BE6-\u0BEF]",telu:"[\u0C66-\u0C6F]",thai:"[\u0E50-\u0E59]",tibt:"[\u0F20-\u0F29]",latn:"\\d"};const numberingSystemsUTF16={arab:[1632,1641],arabext:[1776,1785],bali:[6992,7001],beng:[2534,2543],deva:[2406,2415],fullwide:[65296,65303],gujr:[2790,2799],khmr:[6112,6121],knda:[3302,3311],laoo:[3792,3801],limb:[6470,6479],mlym:[3430,3439],mong:[6160,6169],mymr:[4160,4169],orya:[2918,2927],tamldec:[3046,3055],telu:[3174,3183],thai:[3664,3673],tibt:[3872,3881]};const hanidecChars=numberingSystems.hanidec.replace(/[\[|\]]/g,"").split("");function parseDigits(str){let value=parseInt(str,10);if(isNaN(value)){value="";for(let i=0;i<str.length;i++){const code=str.charCodeAt(i);if(str[i].search(numberingSystems.hanidec)!==-1){value+=hanidecChars.indexOf(str[i]);}else{for(const key in numberingSystemsUTF16){const[min,max]=numberingSystemsUTF16[key];if(code>=min&&code<=max){value+=code-min;}}}}return parseInt(value,10);}else{return value;}}// cache of {numberingSystem: {append: regex}}
const digitRegexCache=new Map();function resetDigitRegexCache(){digitRegexCache.clear();}function digitRegex({numberingSystem},append=""){const ns=numberingSystem||"latn";let appendCache=digitRegexCache.get(ns);if(appendCache===undefined){appendCache=new Map();digitRegexCache.set(ns,appendCache);}let regex=appendCache.get(append);if(regex===undefined){regex=new RegExp(`${numberingSystems[ns]}${append}`);appendCache.set(append,regex);}return regex;}let now=()=>Date.now(),defaultZone="system",defaultLocale=null,defaultNumberingSystem=null,defaultOutputCalendar=null,twoDigitCutoffYear=60,throwOnInvalid,defaultWeekSettings=null;/**
 * Settings contains static getters and setters that control Luxon's overall behavior. Luxon is a simple library with few options, but the ones it does have live here.
 */class Settings{/**
   * Get the callback for returning the current timestamp.
   * @type {function}
   */static get now(){return now;}/**
   * Set the callback for returning the current timestamp.
   * The function should return a number, which will be interpreted as an Epoch millisecond count
   * @type {function}
   * @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
   * @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
   */static set now(n){now=n;}/**
   * Set the default time zone to create DateTimes in. Does not affect existing instances.
   * Use the value "system" to reset this value to the system's time zone.
   * @type {string}
   */static set defaultZone(zone){defaultZone=zone;}/**
   * Get the default time zone object currently used to create DateTimes. Does not affect existing instances.
   * The default value is the system's time zone (the one set on the machine that runs this code).
   * @type {Zone}
   */static get defaultZone(){return normalizeZone(defaultZone,SystemZone.instance);}/**
   * Get the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */static get defaultLocale(){return defaultLocale;}/**
   * Set the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */static set defaultLocale(locale){defaultLocale=locale;}/**
   * Get the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */static get defaultNumberingSystem(){return defaultNumberingSystem;}/**
   * Set the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */static set defaultNumberingSystem(numberingSystem){defaultNumberingSystem=numberingSystem;}/**
   * Get the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */static get defaultOutputCalendar(){return defaultOutputCalendar;}/**
   * Set the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */static set defaultOutputCalendar(outputCalendar){defaultOutputCalendar=outputCalendar;}/**
   * @typedef {Object} WeekSettings
   * @property {number} firstDay
   * @property {number} minimalDays
   * @property {number[]} weekend
   *//**
   * @return {WeekSettings|null}
   */static get defaultWeekSettings(){return defaultWeekSettings;}/**
   * Allows overriding the default locale week settings, i.e. the start of the week, the weekend and
   * how many days are required in the first week of a year.
   * Does not affect existing instances.
   *
   * @param {WeekSettings|null} weekSettings
   */static set defaultWeekSettings(weekSettings){defaultWeekSettings=validateWeekSettings(weekSettings);}/**
   * Get the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
   * @type {number}
   */static get twoDigitCutoffYear(){return twoDigitCutoffYear;}/**
   * Set the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
   * @type {number}
   * @example Settings.twoDigitCutoffYear = 0 // all 'yy' are interpreted as 20th century
   * @example Settings.twoDigitCutoffYear = 99 // all 'yy' are interpreted as 21st century
   * @example Settings.twoDigitCutoffYear = 50 // '49' -> 2049; '50' -> 1950
   * @example Settings.twoDigitCutoffYear = 1950 // interpreted as 50
   * @example Settings.twoDigitCutoffYear = 2050 // ALSO interpreted as 50
   */static set twoDigitCutoffYear(cutoffYear){twoDigitCutoffYear=cutoffYear%100;}/**
   * Get whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */static get throwOnInvalid(){return throwOnInvalid;}/**
   * Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */static set throwOnInvalid(t){throwOnInvalid=t;}/**
   * Reset Luxon's global caches. Should only be necessary in testing scenarios.
   * @return {void}
   */static resetCaches(){Locale.resetCache();IANAZone.resetCache();DateTime$1.resetCache();resetDigitRegexCache();}}class Invalid{constructor(reason,explanation){this.reason=reason;this.explanation=explanation;}toMessage(){if(this.explanation){return`${this.reason}: ${this.explanation}`;}else{return this.reason;}}}const nonLeapLadder=[0,31,59,90,120,151,181,212,243,273,304,334],leapLadder=[0,31,60,91,121,152,182,213,244,274,305,335];function unitOutOfRange(unit,value){return new Invalid("unit out of range",`you specified ${value} (of type ${typeof value}) as a ${unit}, which is invalid`);}function dayOfWeek(year,month,day){const d=new Date(Date.UTC(year,month-1,day));if(year<100&&year>=0){d.setUTCFullYear(d.getUTCFullYear()-1900);}const js=d.getUTCDay();return js===0?7:js;}function computeOrdinal(year,month,day){return day+(isLeapYear(year)?leapLadder:nonLeapLadder)[month-1];}function uncomputeOrdinal(year,ordinal){const table=isLeapYear(year)?leapLadder:nonLeapLadder,month0=table.findIndex(i=>i<ordinal),day=ordinal-table[month0];return{month:month0+1,day};}function isoWeekdayToLocal(isoWeekday,startOfWeek){return(isoWeekday-startOfWeek+7)%7+1;}/**
 * @private
 */function gregorianToWeek(gregObj,minDaysInFirstWeek=4,startOfWeek=1){const{year,month,day}=gregObj,ordinal=computeOrdinal(year,month,day),weekday=isoWeekdayToLocal(dayOfWeek(year,month,day),startOfWeek);let weekNumber=Math.floor((ordinal-weekday+14-minDaysInFirstWeek)/7),weekYear;if(weekNumber<1){weekYear=year-1;weekNumber=weeksInWeekYear(weekYear,minDaysInFirstWeek,startOfWeek);}else if(weekNumber>weeksInWeekYear(year,minDaysInFirstWeek,startOfWeek)){weekYear=year+1;weekNumber=1;}else{weekYear=year;}return _objectSpread({weekYear,weekNumber,weekday},timeObject(gregObj));}function weekToGregorian(weekData,minDaysInFirstWeek=4,startOfWeek=1){const{weekYear,weekNumber,weekday}=weekData,weekdayOfJan4=isoWeekdayToLocal(dayOfWeek(weekYear,1,minDaysInFirstWeek),startOfWeek),yearInDays=daysInYear(weekYear);let ordinal=weekNumber*7+weekday-weekdayOfJan4-7+minDaysInFirstWeek,year;if(ordinal<1){year=weekYear-1;ordinal+=daysInYear(year);}else if(ordinal>yearInDays){year=weekYear+1;ordinal-=daysInYear(weekYear);}else{year=weekYear;}const{month,day}=uncomputeOrdinal(year,ordinal);return _objectSpread({year,month,day},timeObject(weekData));}function gregorianToOrdinal(gregData){const{year,month,day}=gregData;const ordinal=computeOrdinal(year,month,day);return _objectSpread({year,ordinal},timeObject(gregData));}function ordinalToGregorian(ordinalData){const{year,ordinal}=ordinalData;const{month,day}=uncomputeOrdinal(year,ordinal);return _objectSpread({year,month,day},timeObject(ordinalData));}/**
 * Check if local week units like localWeekday are used in obj.
 * If so, validates that they are not mixed with ISO week units and then copies them to the normal week unit properties.
 * Modifies obj in-place!
 * @param obj the object values
 */function usesLocalWeekValues(obj,loc){const hasLocaleWeekData=!isUndefined(obj.localWeekday)||!isUndefined(obj.localWeekNumber)||!isUndefined(obj.localWeekYear);if(hasLocaleWeekData){const hasIsoWeekData=!isUndefined(obj.weekday)||!isUndefined(obj.weekNumber)||!isUndefined(obj.weekYear);if(hasIsoWeekData){throw new ConflictingSpecificationError("Cannot mix locale-based week fields with ISO-based week fields");}if(!isUndefined(obj.localWeekday))obj.weekday=obj.localWeekday;if(!isUndefined(obj.localWeekNumber))obj.weekNumber=obj.localWeekNumber;if(!isUndefined(obj.localWeekYear))obj.weekYear=obj.localWeekYear;delete obj.localWeekday;delete obj.localWeekNumber;delete obj.localWeekYear;return{minDaysInFirstWeek:loc.getMinDaysInFirstWeek(),startOfWeek:loc.getStartOfWeek()};}else{return{minDaysInFirstWeek:4,startOfWeek:1};}}function hasInvalidWeekData(obj,minDaysInFirstWeek=4,startOfWeek=1){const validYear=isInteger(obj.weekYear),validWeek=integerBetween(obj.weekNumber,1,weeksInWeekYear(obj.weekYear,minDaysInFirstWeek,startOfWeek)),validWeekday=integerBetween(obj.weekday,1,7);if(!validYear){return unitOutOfRange("weekYear",obj.weekYear);}else if(!validWeek){return unitOutOfRange("week",obj.weekNumber);}else if(!validWeekday){return unitOutOfRange("weekday",obj.weekday);}else return false;}function hasInvalidOrdinalData(obj){const validYear=isInteger(obj.year),validOrdinal=integerBetween(obj.ordinal,1,daysInYear(obj.year));if(!validYear){return unitOutOfRange("year",obj.year);}else if(!validOrdinal){return unitOutOfRange("ordinal",obj.ordinal);}else return false;}function hasInvalidGregorianData(obj){const validYear=isInteger(obj.year),validMonth=integerBetween(obj.month,1,12),validDay=integerBetween(obj.day,1,daysInMonth(obj.year,obj.month));if(!validYear){return unitOutOfRange("year",obj.year);}else if(!validMonth){return unitOutOfRange("month",obj.month);}else if(!validDay){return unitOutOfRange("day",obj.day);}else return false;}function hasInvalidTimeData(obj){const{hour,minute,second,millisecond}=obj;const validHour=integerBetween(hour,0,23)||hour===24&&minute===0&&second===0&&millisecond===0,validMinute=integerBetween(minute,0,59),validSecond=integerBetween(second,0,59),validMillisecond=integerBetween(millisecond,0,999);if(!validHour){return unitOutOfRange("hour",hour);}else if(!validMinute){return unitOutOfRange("minute",minute);}else if(!validSecond){return unitOutOfRange("second",second);}else if(!validMillisecond){return unitOutOfRange("millisecond",millisecond);}else return false;}/*
  This is just a junk drawer, containing anything used across multiple classes.
  Because Luxon is small(ish), this should stay small and we won't worry about splitting
  it up into, say, parsingUtil.js and basicUtil.js and so on. But they are divided up by feature area.
*//**
 * @private
 */// TYPES
function isUndefined(o){return typeof o==="undefined";}function isNumber$1(o){return typeof o==="number";}function isInteger(o){return typeof o==="number"&&o%1===0;}function isString(o){return typeof o==="string";}function isDate(o){return Object.prototype.toString.call(o)==="[object Date]";}// CAPABILITIES
function hasRelative(){try{return typeof Intl!=="undefined"&&!!Intl.RelativeTimeFormat;}catch(e){return false;}}function hasLocaleWeekInfo(){try{return typeof Intl!=="undefined"&&!!Intl.Locale&&("weekInfo"in Intl.Locale.prototype||"getWeekInfo"in Intl.Locale.prototype);}catch(e){return false;}}// OBJECTS AND ARRAYS
function maybeArray(thing){return Array.isArray(thing)?thing:[thing];}function bestBy(arr,by,compare){if(arr.length===0){return undefined;}return arr.reduce((best,next)=>{const pair=[by(next),next];if(!best){return pair;}else if(compare(best[0],pair[0])===best[0]){return best;}else{return pair;}},null)[1];}function pick$1(obj,keys){return keys.reduce((a,k)=>{a[k]=obj[k];return a;},{});}function hasOwnProperty(obj,prop){return Object.prototype.hasOwnProperty.call(obj,prop);}function validateWeekSettings(settings){if(settings==null){return null;}else if(typeof settings!=="object"){throw new InvalidArgumentError("Week settings must be an object");}else{if(!integerBetween(settings.firstDay,1,7)||!integerBetween(settings.minimalDays,1,7)||!Array.isArray(settings.weekend)||settings.weekend.some(v=>!integerBetween(v,1,7))){throw new InvalidArgumentError("Invalid week settings");}return{firstDay:settings.firstDay,minimalDays:settings.minimalDays,weekend:Array.from(settings.weekend)};}}// NUMBERS AND STRINGS
function integerBetween(thing,bottom,top){return isInteger(thing)&&thing>=bottom&&thing<=top;}// x % n but takes the sign of n instead of x
function floorMod(x,n){return x-n*Math.floor(x/n);}function padStart$1(input,n=2){const isNeg=input<0;let padded;if(isNeg){padded="-"+(""+-input).padStart(n,"0");}else{padded=(""+input).padStart(n,"0");}return padded;}function parseInteger(string){if(isUndefined(string)||string===null||string===""){return undefined;}else{return parseInt(string,10);}}function parseFloating(string){if(isUndefined(string)||string===null||string===""){return undefined;}else{return parseFloat(string);}}function parseMillis(fraction){// Return undefined (instead of 0) in these cases, where fraction is not set
if(isUndefined(fraction)||fraction===null||fraction===""){return undefined;}else{const f=parseFloat("0."+fraction)*1000;return Math.floor(f);}}function roundTo(number,digits,towardZero=false){const factor=10**digits,rounder=towardZero?Math.trunc:Math.round;return rounder(number*factor)/factor;}// DATE BASICS
function isLeapYear(year){return year%4===0&&(year%100!==0||year%400===0);}function daysInYear(year){return isLeapYear(year)?366:365;}function daysInMonth(year,month){const modMonth=floorMod(month-1,12)+1,modYear=year+(month-modMonth)/12;if(modMonth===2){return isLeapYear(modYear)?29:28;}else{return[31,null,31,30,31,30,31,31,30,31,30,31][modMonth-1];}}// convert a calendar object to a local timestamp (epoch, but with the offset baked in)
function objToLocalTS(obj){let d=Date.UTC(obj.year,obj.month-1,obj.day,obj.hour,obj.minute,obj.second,obj.millisecond);// for legacy reasons, years between 0 and 99 are interpreted as 19XX; revert that
if(obj.year<100&&obj.year>=0){d=new Date(d);// set the month and day again, this is necessary because year 2000 is a leap year, but year 100 is not
// so if obj.year is in 99, but obj.day makes it roll over into year 100,
// the calculations done by Date.UTC are using year 2000 - which is incorrect
d.setUTCFullYear(obj.year,obj.month-1,obj.day);}return+d;}// adapted from moment.js: https://github.com/moment/moment/blob/000ac1800e620f770f4eb31b5ae908f6167b0ab2/src/lib/units/week-calendar-utils.js
function firstWeekOffset(year,minDaysInFirstWeek,startOfWeek){const fwdlw=isoWeekdayToLocal(dayOfWeek(year,1,minDaysInFirstWeek),startOfWeek);return-fwdlw+minDaysInFirstWeek-1;}function weeksInWeekYear(weekYear,minDaysInFirstWeek=4,startOfWeek=1){const weekOffset=firstWeekOffset(weekYear,minDaysInFirstWeek,startOfWeek);const weekOffsetNext=firstWeekOffset(weekYear+1,minDaysInFirstWeek,startOfWeek);return(daysInYear(weekYear)-weekOffset+weekOffsetNext)/7;}function untruncateYear(year){if(year>99){return year;}else return year>Settings.twoDigitCutoffYear?1900+year:2000+year;}// PARSING
function parseZoneInfo(ts,offsetFormat,locale,timeZone=null){const date=new Date(ts),intlOpts={hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"};if(timeZone){intlOpts.timeZone=timeZone;}const modified=_objectSpread({timeZoneName:offsetFormat},intlOpts);const parsed=new Intl.DateTimeFormat(locale,modified).formatToParts(date).find(m=>m.type.toLowerCase()==="timezonename");return parsed?parsed.value:null;}// signedOffset('-5', '30') -> -330
function signedOffset(offHourStr,offMinuteStr){let offHour=parseInt(offHourStr,10);// don't || this because we want to preserve -0
if(Number.isNaN(offHour)){offHour=0;}const offMin=parseInt(offMinuteStr,10)||0,offMinSigned=offHour<0||Object.is(offHour,-0)?-offMin:offMin;return offHour*60+offMinSigned;}// COERCION
function asNumber(value){const numericValue=Number(value);if(typeof value==="boolean"||value===""||Number.isNaN(numericValue))throw new InvalidArgumentError(`Invalid unit value ${value}`);return numericValue;}function normalizeObject(obj,normalizer){const normalized={};for(const u in obj){if(hasOwnProperty(obj,u)){const v=obj[u];if(v===undefined||v===null)continue;normalized[normalizer(u)]=asNumber(v);}}return normalized;}/**
 * Returns the offset's value as a string
 * @param {number} ts - Epoch milliseconds for which to get the offset
 * @param {string} format - What style of offset to return.
 *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
 * @return {string}
 */function formatOffset(offset,format){const hours=Math.trunc(Math.abs(offset/60)),minutes=Math.trunc(Math.abs(offset%60)),sign=offset>=0?"+":"-";switch(format){case"short":return`${sign}${padStart$1(hours,2)}:${padStart$1(minutes,2)}`;case"narrow":return`${sign}${hours}${minutes>0?`:${minutes}`:""}`;case"techie":return`${sign}${padStart$1(hours,2)}${padStart$1(minutes,2)}`;default:throw new RangeError(`Value format ${format} is out of range for property format`);}}function timeObject(obj){return pick$1(obj,["hour","minute","second","millisecond"]);}/**
 * @private
 */const monthsLong=["January","February","March","April","May","June","July","August","September","October","November","December"];const monthsShort=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];const monthsNarrow=["J","F","M","A","M","J","J","A","S","O","N","D"];function months(length){switch(length){case"narrow":return[...monthsNarrow];case"short":return[...monthsShort];case"long":return[...monthsLong];case"numeric":return["1","2","3","4","5","6","7","8","9","10","11","12"];case"2-digit":return["01","02","03","04","05","06","07","08","09","10","11","12"];default:return null;}}const weekdaysLong=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];const weekdaysShort=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];const weekdaysNarrow=["M","T","W","T","F","S","S"];function weekdays(length){switch(length){case"narrow":return[...weekdaysNarrow];case"short":return[...weekdaysShort];case"long":return[...weekdaysLong];case"numeric":return["1","2","3","4","5","6","7"];default:return null;}}const meridiems=["AM","PM"];const erasLong=["Before Christ","Anno Domini"];const erasShort=["BC","AD"];const erasNarrow=["B","A"];function eras(length){switch(length){case"narrow":return[...erasNarrow];case"short":return[...erasShort];case"long":return[...erasLong];default:return null;}}function meridiemForDateTime(dt){return meridiems[dt.hour<12?0:1];}function weekdayForDateTime(dt,length){return weekdays(length)[dt.weekday-1];}function monthForDateTime(dt,length){return months(length)[dt.month-1];}function eraForDateTime(dt,length){return eras(length)[dt.year<0?0:1];}function formatRelativeTime(unit,count,numeric="always",narrow=false){const units={years:["year","yr."],quarters:["quarter","qtr."],months:["month","mo."],weeks:["week","wk."],days:["day","day","days"],hours:["hour","hr."],minutes:["minute","min."],seconds:["second","sec."]};const lastable=["hours","minutes","seconds"].indexOf(unit)===-1;if(numeric==="auto"&&lastable){const isDay=unit==="days";switch(count){case 1:return isDay?"tomorrow":`next ${units[unit][0]}`;case-1:return isDay?"yesterday":`last ${units[unit][0]}`;case 0:return isDay?"today":`this ${units[unit][0]}`;}}const isInPast=Object.is(count,-0)||count<0,fmtValue=Math.abs(count),singular=fmtValue===1,lilUnits=units[unit],fmtUnit=narrow?singular?lilUnits[1]:lilUnits[2]||lilUnits[1]:singular?units[unit][0]:unit;return isInPast?`${fmtValue} ${fmtUnit} ago`:`in ${fmtValue} ${fmtUnit}`;}function stringifyTokens(splits,tokenToString){let s="";for(const token of splits){if(token.literal){s+=token.val;}else{s+=tokenToString(token.val);}}return s;}const macroTokenToFormatOpts={D:DATE_SHORT,DD:DATE_MED,DDD:DATE_FULL,DDDD:DATE_HUGE,t:TIME_SIMPLE,tt:TIME_WITH_SECONDS,ttt:TIME_WITH_SHORT_OFFSET,tttt:TIME_WITH_LONG_OFFSET,T:TIME_24_SIMPLE,TT:TIME_24_WITH_SECONDS,TTT:TIME_24_WITH_SHORT_OFFSET,TTTT:TIME_24_WITH_LONG_OFFSET,f:DATETIME_SHORT,ff:DATETIME_MED,fff:DATETIME_FULL,ffff:DATETIME_HUGE,F:DATETIME_SHORT_WITH_SECONDS,FF:DATETIME_MED_WITH_SECONDS,FFF:DATETIME_FULL_WITH_SECONDS,FFFF:DATETIME_HUGE_WITH_SECONDS};/**
 * @private
 */class Formatter{static create(locale,opts={}){return new Formatter(locale,opts);}static parseFormat(fmt){// white-space is always considered a literal in user-provided formats
// the " " token has a special meaning (see unitForToken)
let current=null,currentFull="",bracketed=false;const splits=[];for(let i=0;i<fmt.length;i++){const c=fmt.charAt(i);if(c==="'"){if(currentFull.length>0){splits.push({literal:bracketed||/^\s+$/.test(currentFull),val:currentFull});}current=null;currentFull="";bracketed=!bracketed;}else if(bracketed){currentFull+=c;}else if(c===current){currentFull+=c;}else{if(currentFull.length>0){splits.push({literal:/^\s+$/.test(currentFull),val:currentFull});}currentFull=c;current=c;}}if(currentFull.length>0){splits.push({literal:bracketed||/^\s+$/.test(currentFull),val:currentFull});}return splits;}static macroTokenToFormatOpts(token){return macroTokenToFormatOpts[token];}constructor(locale,formatOpts){this.opts=formatOpts;this.loc=locale;this.systemLoc=null;}formatWithSystemDefault(dt,opts){if(this.systemLoc===null){this.systemLoc=this.loc.redefaultToSystem();}const df=this.systemLoc.dtFormatter(dt,_objectSpread(_objectSpread({},this.opts),opts));return df.format();}dtFormatter(dt,opts={}){return this.loc.dtFormatter(dt,_objectSpread(_objectSpread({},this.opts),opts));}formatDateTime(dt,opts){return this.dtFormatter(dt,opts).format();}formatDateTimeParts(dt,opts){return this.dtFormatter(dt,opts).formatToParts();}formatInterval(interval,opts){const df=this.dtFormatter(interval.start,opts);return df.dtf.formatRange(interval.start.toJSDate(),interval.end.toJSDate());}resolvedOptions(dt,opts){return this.dtFormatter(dt,opts).resolvedOptions();}num(n,p=0){// we get some perf out of doing this here, annoyingly
if(this.opts.forceSimple){return padStart$1(n,p);}const opts=_objectSpread({},this.opts);if(p>0){opts.padTo=p;}return this.loc.numberFormatter(opts).format(n);}formatDateTimeFromString(dt,fmt){const knownEnglish=this.loc.listingMode()==="en",useDateTimeFormatter=this.loc.outputCalendar&&this.loc.outputCalendar!=="gregory",string=(opts,extract)=>this.loc.extract(dt,opts,extract),formatOffset=opts=>{if(dt.isOffsetFixed&&dt.offset===0&&opts.allowZ){return"Z";}return dt.isValid?dt.zone.formatOffset(dt.ts,opts.format):"";},meridiem=()=>knownEnglish?meridiemForDateTime(dt):string({hour:"numeric",hourCycle:"h12"},"dayperiod"),month=(length,standalone)=>knownEnglish?monthForDateTime(dt,length):string(standalone?{month:length}:{month:length,day:"numeric"},"month"),weekday=(length,standalone)=>knownEnglish?weekdayForDateTime(dt,length):string(standalone?{weekday:length}:{weekday:length,month:"long",day:"numeric"},"weekday"),maybeMacro=token=>{const formatOpts=Formatter.macroTokenToFormatOpts(token);if(formatOpts){return this.formatWithSystemDefault(dt,formatOpts);}else{return token;}},era=length=>knownEnglish?eraForDateTime(dt,length):string({era:length},"era"),tokenToString=token=>{// Where possible: https://cldr.unicode.org/translation/date-time/date-time-symbols
switch(token){// ms
case"S":return this.num(dt.millisecond);case"u":// falls through
case"SSS":return this.num(dt.millisecond,3);// seconds
case"s":return this.num(dt.second);case"ss":return this.num(dt.second,2);// fractional seconds
case"uu":return this.num(Math.floor(dt.millisecond/10),2);case"uuu":return this.num(Math.floor(dt.millisecond/100));// minutes
case"m":return this.num(dt.minute);case"mm":return this.num(dt.minute,2);// hours
case"h":return this.num(dt.hour%12===0?12:dt.hour%12);case"hh":return this.num(dt.hour%12===0?12:dt.hour%12,2);case"H":return this.num(dt.hour);case"HH":return this.num(dt.hour,2);// offset
case"Z":// like +6
return formatOffset({format:"narrow",allowZ:this.opts.allowZ});case"ZZ":// like +06:00
return formatOffset({format:"short",allowZ:this.opts.allowZ});case"ZZZ":// like +0600
return formatOffset({format:"techie",allowZ:this.opts.allowZ});case"ZZZZ":// like EST
return dt.zone.offsetName(dt.ts,{format:"short",locale:this.loc.locale});case"ZZZZZ":// like Eastern Standard Time
return dt.zone.offsetName(dt.ts,{format:"long",locale:this.loc.locale});// zone
case"z":// like America/New_York
return dt.zoneName;// meridiems
case"a":return meridiem();// dates
case"d":return useDateTimeFormatter?string({day:"numeric"},"day"):this.num(dt.day);case"dd":return useDateTimeFormatter?string({day:"2-digit"},"day"):this.num(dt.day,2);// weekdays - standalone
case"c":// like 1
return this.num(dt.weekday);case"ccc":// like 'Tues'
return weekday("short",true);case"cccc":// like 'Tuesday'
return weekday("long",true);case"ccccc":// like 'T'
return weekday("narrow",true);// weekdays - format
case"E":// like 1
return this.num(dt.weekday);case"EEE":// like 'Tues'
return weekday("short",false);case"EEEE":// like 'Tuesday'
return weekday("long",false);case"EEEEE":// like 'T'
return weekday("narrow",false);// months - standalone
case"L":// like 1
return useDateTimeFormatter?string({month:"numeric",day:"numeric"},"month"):this.num(dt.month);case"LL":// like 01, doesn't seem to work
return useDateTimeFormatter?string({month:"2-digit",day:"numeric"},"month"):this.num(dt.month,2);case"LLL":// like Jan
return month("short",true);case"LLLL":// like January
return month("long",true);case"LLLLL":// like J
return month("narrow",true);// months - format
case"M":// like 1
return useDateTimeFormatter?string({month:"numeric"},"month"):this.num(dt.month);case"MM":// like 01
return useDateTimeFormatter?string({month:"2-digit"},"month"):this.num(dt.month,2);case"MMM":// like Jan
return month("short",false);case"MMMM":// like January
return month("long",false);case"MMMMM":// like J
return month("narrow",false);// years
case"y":// like 2014
return useDateTimeFormatter?string({year:"numeric"},"year"):this.num(dt.year);case"yy":// like 14
return useDateTimeFormatter?string({year:"2-digit"},"year"):this.num(dt.year.toString().slice(-2),2);case"yyyy":// like 0012
return useDateTimeFormatter?string({year:"numeric"},"year"):this.num(dt.year,4);case"yyyyyy":// like 000012
return useDateTimeFormatter?string({year:"numeric"},"year"):this.num(dt.year,6);// eras
case"G":// like AD
return era("short");case"GG":// like Anno Domini
return era("long");case"GGGGG":return era("narrow");case"kk":return this.num(dt.weekYear.toString().slice(-2),2);case"kkkk":return this.num(dt.weekYear,4);case"W":return this.num(dt.weekNumber);case"WW":return this.num(dt.weekNumber,2);case"n":return this.num(dt.localWeekNumber);case"nn":return this.num(dt.localWeekNumber,2);case"ii":return this.num(dt.localWeekYear.toString().slice(-2),2);case"iiii":return this.num(dt.localWeekYear,4);case"o":return this.num(dt.ordinal);case"ooo":return this.num(dt.ordinal,3);case"q":// like 1
return this.num(dt.quarter);case"qq":// like 01
return this.num(dt.quarter,2);case"X":return this.num(Math.floor(dt.ts/1000));case"x":return this.num(dt.ts);default:return maybeMacro(token);}};return stringifyTokens(Formatter.parseFormat(fmt),tokenToString);}formatDurationFromString(dur,fmt){const tokenToField=token=>{switch(token[0]){case"S":return"millisecond";case"s":return"second";case"m":return"minute";case"h":return"hour";case"d":return"day";case"w":return"week";case"M":return"month";case"y":return"year";default:return null;}},tokenToString=lildur=>token=>{const mapped=tokenToField(token);if(mapped){return this.num(lildur.get(mapped),token.length);}else{return token;}},tokens=Formatter.parseFormat(fmt),realTokens=tokens.reduce((found,{literal,val})=>literal?found:found.concat(val),[]),collapsed=dur.shiftTo(...realTokens.map(tokenToField).filter(t=>t));return stringifyTokens(tokens,tokenToString(collapsed));}}/*
 * This file handles parsing for well-specified formats. Here's how it works:
 * Two things go into parsing: a regex to match with and an extractor to take apart the groups in the match.
 * An extractor is just a function that takes a regex match array and returns a { year: ..., month: ... } object
 * parse() does the work of executing the regex and applying the extractor. It takes multiple regex/extractor pairs to try in sequence.
 * Extractors can take a "cursor" representing the offset in the match to look at. This makes it easy to combine extractors.
 * combineExtractors() does the work of combining them, keeping track of the cursor through multiple extractions.
 * Some extractions are super dumb and simpleParse and fromStrings help DRY them.
 */const ianaRegex=/[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;function combineRegexes(...regexes){const full=regexes.reduce((f,r)=>f+r.source,"");return RegExp(`^${full}$`);}function combineExtractors(...extractors){return m=>extractors.reduce(([mergedVals,mergedZone,cursor],ex)=>{const[val,zone,next]=ex(m,cursor);return[_objectSpread(_objectSpread({},mergedVals),val),zone||mergedZone,next];},[{},null,1]).slice(0,2);}function parse$2(s,...patterns){if(s==null){return[null,null];}for(const[regex,extractor]of patterns){const m=regex.exec(s);if(m){return extractor(m);}}return[null,null];}function simpleParse(...keys){return(match,cursor)=>{const ret={};let i;for(i=0;i<keys.length;i++){ret[keys[i]]=parseInteger(match[cursor+i]);}return[ret,null,cursor+i];};}// ISO and SQL parsing
const offsetRegex=/(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/;const isoExtendedZone=`(?:${offsetRegex.source}?(?:\\[(${ianaRegex.source})\\])?)?`;const isoTimeBaseRegex=/(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/;const isoTimeRegex=RegExp(`${isoTimeBaseRegex.source}${isoExtendedZone}`);const isoTimeExtensionRegex=RegExp(`(?:T${isoTimeRegex.source})?`);const isoYmdRegex=/([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/;const isoWeekRegex=/(\d{4})-?W(\d\d)(?:-?(\d))?/;const isoOrdinalRegex=/(\d{4})-?(\d{3})/;const extractISOWeekData=simpleParse("weekYear","weekNumber","weekDay");const extractISOOrdinalData=simpleParse("year","ordinal");const sqlYmdRegex=/(\d{4})-(\d\d)-(\d\d)/;// dumbed-down version of the ISO one
const sqlTimeRegex=RegExp(`${isoTimeBaseRegex.source} ?(?:${offsetRegex.source}|(${ianaRegex.source}))?`);const sqlTimeExtensionRegex=RegExp(`(?: ${sqlTimeRegex.source})?`);function int$1(match,pos,fallback){const m=match[pos];return isUndefined(m)?fallback:parseInteger(m);}function extractISOYmd(match,cursor){const item={year:int$1(match,cursor),month:int$1(match,cursor+1,1),day:int$1(match,cursor+2,1)};return[item,null,cursor+3];}function extractISOTime(match,cursor){const item={hours:int$1(match,cursor,0),minutes:int$1(match,cursor+1,0),seconds:int$1(match,cursor+2,0),milliseconds:parseMillis(match[cursor+3])};return[item,null,cursor+4];}function extractISOOffset(match,cursor){const local=!match[cursor]&&!match[cursor+1],fullOffset=signedOffset(match[cursor+1],match[cursor+2]),zone=local?null:FixedOffsetZone.instance(fullOffset);return[{},zone,cursor+3];}function extractIANAZone(match,cursor){const zone=match[cursor]?IANAZone.create(match[cursor]):null;return[{},zone,cursor+1];}// ISO time parsing
const isoTimeOnly=RegExp(`^T?${isoTimeBaseRegex.source}$`);// ISO duration parsing
const isoDuration=/^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;function extractISODuration(match){const[s,yearStr,monthStr,weekStr,dayStr,hourStr,minuteStr,secondStr,millisecondsStr]=match;const hasNegativePrefix=s[0]==="-";const negativeSeconds=secondStr&&secondStr[0]==="-";const maybeNegate=(num,force=false)=>num!==undefined&&(force||num&&hasNegativePrefix)?-num:num;return[{years:maybeNegate(parseFloating(yearStr)),months:maybeNegate(parseFloating(monthStr)),weeks:maybeNegate(parseFloating(weekStr)),days:maybeNegate(parseFloating(dayStr)),hours:maybeNegate(parseFloating(hourStr)),minutes:maybeNegate(parseFloating(minuteStr)),seconds:maybeNegate(parseFloating(secondStr),secondStr==="-0"),milliseconds:maybeNegate(parseMillis(millisecondsStr),negativeSeconds)}];}// These are a little braindead. EDT *should* tell us that we're in, say, America/New_York
// and not just that we're in -240 *right now*. But since I don't think these are used that often
// I'm just going to ignore that
const obsOffsets={GMT:0,EDT:-4*60,EST:-5*60,CDT:-5*60,CST:-6*60,MDT:-6*60,MST:-7*60,PDT:-7*60,PST:-8*60};function fromStrings(weekdayStr,yearStr,monthStr,dayStr,hourStr,minuteStr,secondStr){const result={year:yearStr.length===2?untruncateYear(parseInteger(yearStr)):parseInteger(yearStr),month:monthsShort.indexOf(monthStr)+1,day:parseInteger(dayStr),hour:parseInteger(hourStr),minute:parseInteger(minuteStr)};if(secondStr)result.second=parseInteger(secondStr);if(weekdayStr){result.weekday=weekdayStr.length>3?weekdaysLong.indexOf(weekdayStr)+1:weekdaysShort.indexOf(weekdayStr)+1;}return result;}// RFC 2822/5322
const rfc2822=/^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;function extractRFC2822(match){const[,weekdayStr,dayStr,monthStr,yearStr,hourStr,minuteStr,secondStr,obsOffset,milOffset,offHourStr,offMinuteStr]=match,result=fromStrings(weekdayStr,yearStr,monthStr,dayStr,hourStr,minuteStr,secondStr);let offset;if(obsOffset){offset=obsOffsets[obsOffset];}else if(milOffset){offset=0;}else{offset=signedOffset(offHourStr,offMinuteStr);}return[result,new FixedOffsetZone(offset)];}function preprocessRFC2822(s){// Remove comments and folding whitespace and replace multiple-spaces with a single space
return s.replace(/\([^()]*\)|[\n\t]/g," ").replace(/(\s\s+)/g," ").trim();}// http date
const rfc1123=/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/,rfc850=/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/,ascii=/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;function extractRFC1123Or850(match){const[,weekdayStr,dayStr,monthStr,yearStr,hourStr,minuteStr,secondStr]=match,result=fromStrings(weekdayStr,yearStr,monthStr,dayStr,hourStr,minuteStr,secondStr);return[result,FixedOffsetZone.utcInstance];}function extractASCII(match){const[,weekdayStr,monthStr,dayStr,hourStr,minuteStr,secondStr,yearStr]=match,result=fromStrings(weekdayStr,yearStr,monthStr,dayStr,hourStr,minuteStr,secondStr);return[result,FixedOffsetZone.utcInstance];}const isoYmdWithTimeExtensionRegex=combineRegexes(isoYmdRegex,isoTimeExtensionRegex);const isoWeekWithTimeExtensionRegex=combineRegexes(isoWeekRegex,isoTimeExtensionRegex);const isoOrdinalWithTimeExtensionRegex=combineRegexes(isoOrdinalRegex,isoTimeExtensionRegex);const isoTimeCombinedRegex=combineRegexes(isoTimeRegex);const extractISOYmdTimeAndOffset=combineExtractors(extractISOYmd,extractISOTime,extractISOOffset,extractIANAZone);const extractISOWeekTimeAndOffset=combineExtractors(extractISOWeekData,extractISOTime,extractISOOffset,extractIANAZone);const extractISOOrdinalDateAndTime=combineExtractors(extractISOOrdinalData,extractISOTime,extractISOOffset,extractIANAZone);const extractISOTimeAndOffset=combineExtractors(extractISOTime,extractISOOffset,extractIANAZone);/*
 * @private
 */function parseISODate(s){return parse$2(s,[isoYmdWithTimeExtensionRegex,extractISOYmdTimeAndOffset],[isoWeekWithTimeExtensionRegex,extractISOWeekTimeAndOffset],[isoOrdinalWithTimeExtensionRegex,extractISOOrdinalDateAndTime],[isoTimeCombinedRegex,extractISOTimeAndOffset]);}function parseRFC2822Date(s){return parse$2(preprocessRFC2822(s),[rfc2822,extractRFC2822]);}function parseHTTPDate(s){return parse$2(s,[rfc1123,extractRFC1123Or850],[rfc850,extractRFC1123Or850],[ascii,extractASCII]);}function parseISODuration(s){return parse$2(s,[isoDuration,extractISODuration]);}const extractISOTimeOnly=combineExtractors(extractISOTime);function parseISOTimeOnly(s){return parse$2(s,[isoTimeOnly,extractISOTimeOnly]);}const sqlYmdWithTimeExtensionRegex=combineRegexes(sqlYmdRegex,sqlTimeExtensionRegex);const sqlTimeCombinedRegex=combineRegexes(sqlTimeRegex);const extractISOTimeOffsetAndIANAZone=combineExtractors(extractISOTime,extractISOOffset,extractIANAZone);function parseSQL(s){return parse$2(s,[sqlYmdWithTimeExtensionRegex,extractISOYmdTimeAndOffset],[sqlTimeCombinedRegex,extractISOTimeOffsetAndIANAZone]);}const INVALID$2="Invalid Duration";// unit conversion constants
const lowOrderMatrix={weeks:{days:7,hours:7*24,minutes:7*24*60,seconds:7*24*60*60,milliseconds:7*24*60*60*1000},days:{hours:24,minutes:24*60,seconds:24*60*60,milliseconds:24*60*60*1000},hours:{minutes:60,seconds:60*60,milliseconds:60*60*1000},minutes:{seconds:60,milliseconds:60*1000},seconds:{milliseconds:1000}},casualMatrix=_objectSpread({years:{quarters:4,months:12,weeks:52,days:365,hours:365*24,minutes:365*24*60,seconds:365*24*60*60,milliseconds:365*24*60*60*1000},quarters:{months:3,weeks:13,days:91,hours:91*24,minutes:91*24*60,seconds:91*24*60*60,milliseconds:91*24*60*60*1000},months:{weeks:4,days:30,hours:30*24,minutes:30*24*60,seconds:30*24*60*60,milliseconds:30*24*60*60*1000}},lowOrderMatrix),daysInYearAccurate=146097.0/400,daysInMonthAccurate=146097.0/4800,accurateMatrix=_objectSpread({years:{quarters:4,months:12,weeks:daysInYearAccurate/7,days:daysInYearAccurate,hours:daysInYearAccurate*24,minutes:daysInYearAccurate*24*60,seconds:daysInYearAccurate*24*60*60,milliseconds:daysInYearAccurate*24*60*60*1000},quarters:{months:3,weeks:daysInYearAccurate/28,days:daysInYearAccurate/4,hours:daysInYearAccurate*24/4,minutes:daysInYearAccurate*24*60/4,seconds:daysInYearAccurate*24*60*60/4,milliseconds:daysInYearAccurate*24*60*60*1000/4},months:{weeks:daysInMonthAccurate/7,days:daysInMonthAccurate,hours:daysInMonthAccurate*24,minutes:daysInMonthAccurate*24*60,seconds:daysInMonthAccurate*24*60*60,milliseconds:daysInMonthAccurate*24*60*60*1000}},lowOrderMatrix);// units ordered by size
const orderedUnits$1=["years","quarters","months","weeks","days","hours","minutes","seconds","milliseconds"];const reverseUnits=orderedUnits$1.slice(0).reverse();// clone really means "create another instance just like this one, but with these changes"
function clone$2(dur,alts,clear=false){// deep merge for vals
const conf={values:clear?alts.values:_objectSpread(_objectSpread({},dur.values),alts.values||{}),loc:dur.loc.clone(alts.loc),conversionAccuracy:alts.conversionAccuracy||dur.conversionAccuracy,matrix:alts.matrix||dur.matrix};return new Duration(conf);}function durationToMillis(matrix,vals){var _vals$milliseconds;let sum=(_vals$milliseconds=vals.milliseconds)!==null&&_vals$milliseconds!==void 0?_vals$milliseconds:0;for(const unit of reverseUnits.slice(1)){if(vals[unit]){sum+=vals[unit]*matrix[unit]["milliseconds"];}}return sum;}// NB: mutates parameters
function normalizeValues(matrix,vals){// the logic below assumes the overall value of the duration is positive
// if this is not the case, factor is used to make it so
const factor=durationToMillis(matrix,vals)<0?-1:1;orderedUnits$1.reduceRight((previous,current)=>{if(!isUndefined(vals[current])){if(previous){const previousVal=vals[previous]*factor;const conv=matrix[current][previous];// if (previousVal < 0):
// lower order unit is negative (e.g. { years: 2, days: -2 })
// normalize this by reducing the higher order unit by the appropriate amount
// and increasing the lower order unit
// this can never make the higher order unit negative, because this function only operates
// on positive durations, so the amount of time represented by the lower order unit cannot
// be larger than the higher order unit
// else:
// lower order unit is positive (e.g. { years: 2, days: 450 } or { years: -2, days: 450 })
// in this case we attempt to convert as much as possible from the lower order unit into
// the higher order one
//
// Math.floor takes care of both of these cases, rounding away from 0
// if previousVal < 0 it makes the absolute value larger
// if previousVal >= it makes the absolute value smaller
const rollUp=Math.floor(previousVal/conv);vals[current]+=rollUp*factor;vals[previous]-=rollUp*conv*factor;}return current;}else{return previous;}},null);// try to convert any decimals into smaller units if possible
// for example for { years: 2.5, days: 0, seconds: 0 } we want to get { years: 2, days: 182, hours: 12 }
orderedUnits$1.reduce((previous,current)=>{if(!isUndefined(vals[current])){if(previous){const fraction=vals[previous]%1;vals[previous]-=fraction;vals[current]+=fraction*matrix[previous][current];}return current;}else{return previous;}},null);}// Remove all properties with a value of 0 from an object
function removeZeroes(vals){const newVals={};for(const[key,value]of Object.entries(vals)){if(value!==0){newVals[key]=value;}}return newVals;}/**
 * A Duration object represents a period of time, like "2 months" or "1 day, 1 hour". Conceptually, it's just a map of units to their quantities, accompanied by some additional configuration and methods for creating, parsing, interrogating, transforming, and formatting them. They can be used on their own or in conjunction with other Luxon types; for example, you can use {@link DateTime#plus} to add a Duration object to a DateTime, producing another DateTime.
 *
 * Here is a brief overview of commonly used methods and getters in Duration:
 *
 * * **Creation** To create a Duration, use {@link Duration.fromMillis}, {@link Duration.fromObject}, or {@link Duration.fromISO}.
 * * **Unit values** See the {@link Duration#years}, {@link Duration#months}, {@link Duration#weeks}, {@link Duration#days}, {@link Duration#hours}, {@link Duration#minutes}, {@link Duration#seconds}, {@link Duration#milliseconds} accessors.
 * * **Configuration** See  {@link Duration#locale} and {@link Duration#numberingSystem} accessors.
 * * **Transformation** To create new Durations out of old ones use {@link Duration#plus}, {@link Duration#minus}, {@link Duration#normalize}, {@link Duration#set}, {@link Duration#reconfigure}, {@link Duration#shiftTo}, and {@link Duration#negate}.
 * * **Output** To convert the Duration into other representations, see {@link Duration#as}, {@link Duration#toISO}, {@link Duration#toFormat}, and {@link Duration#toJSON}
 *
 * There's are more methods documented below. In addition, for more information on subtler topics like internationalization and validity, see the external documentation.
 */class Duration{/**
   * @private
   */constructor(config){const accurate=config.conversionAccuracy==="longterm"||false;let matrix=accurate?accurateMatrix:casualMatrix;if(config.matrix){matrix=config.matrix;}/**
     * @access private
     */this.values=config.values;/**
     * @access private
     */this.loc=config.loc||Locale.create();/**
     * @access private
     */this.conversionAccuracy=accurate?"longterm":"casual";/**
     * @access private
     */this.invalid=config.invalid||null;/**
     * @access private
     */this.matrix=matrix;/**
     * @access private
     */this.isLuxonDuration=true;}/**
   * Create Duration from a number of milliseconds.
   * @param {number} count of milliseconds
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */static fromMillis(count,opts){return Duration.fromObject({milliseconds:count},opts);}/**
   * Create a Duration from a JavaScript object with keys like 'years' and 'hours'.
   * If this object is empty then a zero milliseconds duration is returned.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.years
   * @param {number} obj.quarters
   * @param {number} obj.months
   * @param {number} obj.weeks
   * @param {number} obj.days
   * @param {number} obj.hours
   * @param {number} obj.minutes
   * @param {number} obj.seconds
   * @param {number} obj.milliseconds
   * @param {Object} [opts=[]] - options for creating this Duration
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the custom conversion system to use
   * @return {Duration}
   */static fromObject(obj,opts={}){if(obj==null||typeof obj!=="object"){throw new InvalidArgumentError(`Duration.fromObject: argument expected to be an object, got ${obj===null?"null":typeof obj}`);}return new Duration({values:normalizeObject(obj,Duration.normalizeUnit),loc:Locale.fromObject(opts),conversionAccuracy:opts.conversionAccuracy,matrix:opts.matrix});}/**
   * Create a Duration from DurationLike.
   *
   * @param {Object | number | Duration} durationLike
   * One of:
   * - object with keys like 'years' and 'hours'.
   * - number representing milliseconds
   * - Duration instance
   * @return {Duration}
   */static fromDurationLike(durationLike){if(isNumber$1(durationLike)){return Duration.fromMillis(durationLike);}else if(Duration.isDuration(durationLike)){return durationLike;}else if(typeof durationLike==="object"){return Duration.fromObject(durationLike);}else{throw new InvalidArgumentError(`Unknown duration argument ${durationLike} of type ${typeof durationLike}`);}}/**
   * Create a Duration from an ISO 8601 duration string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the preset conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromISO('P3Y6M1W4DT12H30M5S').toObject() //=> { years: 3, months: 6, weeks: 1, days: 4, hours: 12, minutes: 30, seconds: 5 }
   * @example Duration.fromISO('PT23H').toObject() //=> { hours: 23 }
   * @example Duration.fromISO('P5Y3M').toObject() //=> { years: 5, months: 3 }
   * @return {Duration}
   */static fromISO(text,opts){const[parsed]=parseISODuration(text);if(parsed){return Duration.fromObject(parsed,opts);}else{return Duration.invalid("unparsable",`the input "${text}" can't be parsed as ISO 8601`);}}/**
   * Create a Duration from an ISO 8601 time string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Times
   * @example Duration.fromISOTime('11:22:33.444').toObject() //=> { hours: 11, minutes: 22, seconds: 33, milliseconds: 444 }
   * @example Duration.fromISOTime('11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @return {Duration}
   */static fromISOTime(text,opts){const[parsed]=parseISOTimeOnly(text);if(parsed){return Duration.fromObject(parsed,opts);}else{return Duration.invalid("unparsable",`the input "${text}" can't be parsed as ISO 8601`);}}/**
   * Create an invalid Duration.
   * @param {string} reason - simple string of why this datetime is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Duration}
   */static invalid(reason,explanation=null){if(!reason){throw new InvalidArgumentError("need to specify a reason the Duration is invalid");}const invalid=reason instanceof Invalid?reason:new Invalid(reason,explanation);if(Settings.throwOnInvalid){throw new InvalidDurationError(invalid);}else{return new Duration({invalid});}}/**
   * @private
   */static normalizeUnit(unit){const normalized={year:"years",years:"years",quarter:"quarters",quarters:"quarters",month:"months",months:"months",week:"weeks",weeks:"weeks",day:"days",days:"days",hour:"hours",hours:"hours",minute:"minutes",minutes:"minutes",second:"seconds",seconds:"seconds",millisecond:"milliseconds",milliseconds:"milliseconds"}[unit?unit.toLowerCase():unit];if(!normalized)throw new InvalidUnitError(unit);return normalized;}/**
   * Check if an object is a Duration. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */static isDuration(o){return o&&o.isLuxonDuration||false;}/**
   * Get  the locale of a Duration, such 'en-GB'
   * @type {string}
   */get locale(){return this.isValid?this.loc.locale:null;}/**
   * Get the numbering system of a Duration, such 'beng'. The numbering system is used when formatting the Duration
   *
   * @type {string}
   */get numberingSystem(){return this.isValid?this.loc.numberingSystem:null;}/**
   * Returns a string representation of this Duration formatted according to the specified format string. You may use these tokens:
   * * `S` for milliseconds
   * * `s` for seconds
   * * `m` for minutes
   * * `h` for hours
   * * `d` for days
   * * `w` for weeks
   * * `M` for months
   * * `y` for years
   * Notes:
   * * Add padding by repeating the token, e.g. "yy" pads the years to two digits, "hhhh" pads the hours out to four digits
   * * Tokens can be escaped by wrapping with single quotes.
   * * The duration will be converted to the set of units in the format string using {@link Duration#shiftTo} and the Durations's conversion accuracy setting.
   * @param {string} fmt - the format string
   * @param {Object} opts - options
   * @param {boolean} [opts.floor=true] - floor numerical values
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("y d s") //=> "1 6 2"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("yy dd sss") //=> "01 06 002"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("M S") //=> "12 518402000"
   * @return {string}
   */toFormat(fmt,opts={}){// reverse-compat since 1.2; we always round down now, never up, and we do it by default
const fmtOpts=_objectSpread(_objectSpread({},opts),{},{floor:opts.round!==false&&opts.floor!==false});return this.isValid?Formatter.create(this.loc,fmtOpts).formatDurationFromString(this,fmt):INVALID$2;}/**
   * Returns a string representation of a Duration with all units included.
   * To modify its behavior, use `listStyle` and any Intl.NumberFormat option, though `unitDisplay` is especially relevant.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options
   * @param {Object} opts - Formatting options. Accepts the same keys as the options parameter of the native `Intl.NumberFormat` constructor, as well as `listStyle`.
   * @param {string} [opts.listStyle='narrow'] - How to format the merged list. Corresponds to the `style` property of the options parameter of the native `Intl.ListFormat` constructor.
   * @example
   * ```js
   * var dur = Duration.fromObject({ days: 1, hours: 5, minutes: 6 })
   * dur.toHuman() //=> '1 day, 5 hours, 6 minutes'
   * dur.toHuman({ listStyle: "long" }) //=> '1 day, 5 hours, and 6 minutes'
   * dur.toHuman({ unitDisplay: "short" }) //=> '1 day, 5 hr, 6 min'
   * ```
   */toHuman(opts={}){if(!this.isValid)return INVALID$2;const l=orderedUnits$1.map(unit=>{const val=this.values[unit];if(isUndefined(val)){return null;}return this.loc.numberFormatter(_objectSpread(_objectSpread({style:"unit",unitDisplay:"long"},opts),{},{unit:unit.slice(0,-1)})).format(val);}).filter(n=>n);return this.loc.listFormatter(_objectSpread({type:"conjunction",style:opts.listStyle||"narrow"},opts)).format(l);}/**
   * Returns a JavaScript object with this Duration's values.
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toObject() //=> { years: 1, days: 6, seconds: 2 }
   * @return {Object}
   */toObject(){if(!this.isValid)return{};return _objectSpread({},this.values);}/**
   * Returns an ISO 8601-compliant string representation of this Duration.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromObject({ years: 3, seconds: 45 }).toISO() //=> 'P3YT45S'
   * @example Duration.fromObject({ months: 4, seconds: 45 }).toISO() //=> 'P4MT45S'
   * @example Duration.fromObject({ months: 5 }).toISO() //=> 'P5M'
   * @example Duration.fromObject({ minutes: 5 }).toISO() //=> 'PT5M'
   * @example Duration.fromObject({ milliseconds: 6 }).toISO() //=> 'PT0.006S'
   * @return {string}
   */toISO(){// we could use the formatter, but this is an easier way to get the minimum string
if(!this.isValid)return null;let s="P";if(this.years!==0)s+=this.years+"Y";if(this.months!==0||this.quarters!==0)s+=this.months+this.quarters*3+"M";if(this.weeks!==0)s+=this.weeks+"W";if(this.days!==0)s+=this.days+"D";if(this.hours!==0||this.minutes!==0||this.seconds!==0||this.milliseconds!==0)s+="T";if(this.hours!==0)s+=this.hours+"H";if(this.minutes!==0)s+=this.minutes+"M";if(this.seconds!==0||this.milliseconds!==0)// this will handle "floating point madness" by removing extra decimal places
// https://stackoverflow.com/questions/588004/is-floating-point-math-broken
s+=roundTo(this.seconds+this.milliseconds/1000,3)+"S";if(s==="P")s+="T0S";return s;}/**
   * Returns an ISO 8601-compliant string representation of this Duration, formatted as a time of day.
   * Note that this will return null if the duration is invalid, negative, or equal to or greater than 24 hours.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Times
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example Duration.fromObject({ hours: 11 }).toISOTime() //=> '11:00:00.000'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressMilliseconds: true }) //=> '11:00:00'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressSeconds: true }) //=> '11:00'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ includePrefix: true }) //=> 'T11:00:00.000'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ format: 'basic' }) //=> '110000.000'
   * @return {string}
   */toISOTime(opts={}){if(!this.isValid)return null;const millis=this.toMillis();if(millis<0||millis>=86400000)return null;opts=_objectSpread(_objectSpread({suppressMilliseconds:false,suppressSeconds:false,includePrefix:false,format:"extended"},opts),{},{includeOffset:false});const dateTime=DateTime$1.fromMillis(millis,{zone:"UTC"});return dateTime.toISOTime(opts);}/**
   * Returns an ISO 8601 representation of this Duration appropriate for use in JSON.
   * @return {string}
   */toJSON(){return this.toISO();}/**
   * Returns an ISO 8601 representation of this Duration appropriate for use in debugging.
   * @return {string}
   */toString(){return this.toISO();}/**
   * Returns a string representation of this Duration appropriate for the REPL.
   * @return {string}
   */[Symbol.for("nodejs.util.inspect.custom")](){if(this.isValid){return`Duration { values: ${JSON.stringify(this.values)} }`;}else{return`Duration { Invalid, reason: ${this.invalidReason} }`;}}/**
   * Returns an milliseconds value of this Duration.
   * @return {number}
   */toMillis(){if(!this.isValid)return NaN;return durationToMillis(this.matrix,this.values);}/**
   * Returns an milliseconds value of this Duration. Alias of {@link toMillis}
   * @return {number}
   */valueOf(){return this.toMillis();}/**
   * Make this Duration longer by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */plus(duration){if(!this.isValid)return this;const dur=Duration.fromDurationLike(duration),result={};for(const k of orderedUnits$1){if(hasOwnProperty(dur.values,k)||hasOwnProperty(this.values,k)){result[k]=dur.get(k)+this.get(k);}}return clone$2(this,{values:result},true);}/**
   * Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */minus(duration){if(!this.isValid)return this;const dur=Duration.fromDurationLike(duration);return this.plus(dur.negate());}/**
   * Scale this Duration by the specified amount. Return a newly-constructed Duration.
   * @param {function} fn - The function to apply to each unit. Arity is 1 or 2: the value of the unit and, optionally, the unit name. Must return a number.
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits(x => x * 2) //=> { hours: 2, minutes: 60 }
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits((x, u) => u === "hours" ? x * 2 : x) //=> { hours: 2, minutes: 30 }
   * @return {Duration}
   */mapUnits(fn){if(!this.isValid)return this;const result={};for(const k of Object.keys(this.values)){result[k]=asNumber(fn(this.values[k],k));}return clone$2(this,{values:result},true);}/**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example Duration.fromObject({years: 2, days: 3}).get('years') //=> 2
   * @example Duration.fromObject({years: 2, days: 3}).get('months') //=> 0
   * @example Duration.fromObject({years: 2, days: 3}).get('days') //=> 3
   * @return {number}
   */get(unit){return this[Duration.normalizeUnit(unit)];}/**
   * "Set" the values of specified units. Return a newly-constructed Duration.
   * @param {Object} values - a mapping of units to numbers
   * @example dur.set({ years: 2017 })
   * @example dur.set({ hours: 8, minutes: 30 })
   * @return {Duration}
   */set(values){if(!this.isValid)return this;const mixed=_objectSpread(_objectSpread({},this.values),normalizeObject(values,Duration.normalizeUnit));return clone$2(this,{values:mixed});}/**
   * "Set" the locale and/or numberingSystem.  Returns a newly-constructed Duration.
   * @example dur.reconfigure({ locale: 'en-GB' })
   * @return {Duration}
   */reconfigure({locale,numberingSystem,conversionAccuracy,matrix}={}){const loc=this.loc.clone({locale,numberingSystem});const opts={loc,matrix,conversionAccuracy};return clone$2(this,opts);}/**
   * Return the length of the duration in the specified unit.
   * @param {string} unit - a unit such as 'minutes' or 'days'
   * @example Duration.fromObject({years: 1}).as('days') //=> 365
   * @example Duration.fromObject({years: 1}).as('months') //=> 12
   * @example Duration.fromObject({hours: 60}).as('days') //=> 2.5
   * @return {number}
   */as(unit){return this.isValid?this.shiftTo(unit).get(unit):NaN;}/**
   * Reduce this Duration to its canonical representation in its current units.
   * Assuming the overall value of the Duration is positive, this means:
   * - excessive values for lower-order units are converted to higher-order units (if possible, see first and second example)
   * - negative lower-order units are converted to higher order units (there must be such a higher order unit, otherwise
   *   the overall value would be negative, see third example)
   * - fractional values for higher-order units are converted to lower-order units (if possible, see fourth example)
   *
   * If the overall value is negative, the result of this method is equivalent to `this.negate().normalize().negate()`.
   * @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
   * @example Duration.fromObject({ days: 5000 }).normalize().toObject() //=> { days: 5000 }
   * @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
   * @example Duration.fromObject({ years: 2.5, days: 0, hours: 0 }).normalize().toObject() //=> { years: 2, days: 182, hours: 12 }
   * @return {Duration}
   */normalize(){if(!this.isValid)return this;const vals=this.toObject();normalizeValues(this.matrix,vals);return clone$2(this,{values:vals},true);}/**
   * Rescale units to its largest representation
   * @example Duration.fromObject({ milliseconds: 90000 }).rescale().toObject() //=> { minutes: 1, seconds: 30 }
   * @return {Duration}
   */rescale(){if(!this.isValid)return this;const vals=removeZeroes(this.normalize().shiftToAll().toObject());return clone$2(this,{values:vals},true);}/**
   * Convert this Duration into its representation in a different set of units.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
   * @return {Duration}
   */shiftTo(...units){if(!this.isValid)return this;if(units.length===0){return this;}units=units.map(u=>Duration.normalizeUnit(u));const built={},accumulated={},vals=this.toObject();let lastUnit;for(const k of orderedUnits$1){if(units.indexOf(k)>=0){lastUnit=k;let own=0;// anything we haven't boiled down yet should get boiled to this unit
for(const ak in accumulated){own+=this.matrix[ak][k]*accumulated[ak];accumulated[ak]=0;}// plus anything that's already in this unit
if(isNumber$1(vals[k])){own+=vals[k];}// only keep the integer part for now in the hopes of putting any decimal part
// into a smaller unit later
const i=Math.trunc(own);built[k]=i;accumulated[k]=(own*1000-i*1000)/1000;// otherwise, keep it in the wings to boil it later
}else if(isNumber$1(vals[k])){accumulated[k]=vals[k];}}// anything leftover becomes the decimal for the last unit
// lastUnit must be defined since units is not empty
for(const key in accumulated){if(accumulated[key]!==0){built[lastUnit]+=key===lastUnit?accumulated[key]:accumulated[key]/this.matrix[lastUnit][key];}}normalizeValues(this.matrix,built);return clone$2(this,{values:built},true);}/**
   * Shift this Duration to all available units.
   * Same as shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds")
   * @return {Duration}
   */shiftToAll(){if(!this.isValid)return this;return this.shiftTo("years","months","weeks","days","hours","minutes","seconds","milliseconds");}/**
   * Return the negative of this Duration.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).negate().toObject() //=> { hours: -1, seconds: -30 }
   * @return {Duration}
   */negate(){if(!this.isValid)return this;const negated={};for(const k of Object.keys(this.values)){negated[k]=this.values[k]===0?0:-this.values[k];}return clone$2(this,{values:negated},true);}/**
   * Get the years.
   * @type {number}
   */get years(){return this.isValid?this.values.years||0:NaN;}/**
   * Get the quarters.
   * @type {number}
   */get quarters(){return this.isValid?this.values.quarters||0:NaN;}/**
   * Get the months.
   * @type {number}
   */get months(){return this.isValid?this.values.months||0:NaN;}/**
   * Get the weeks
   * @type {number}
   */get weeks(){return this.isValid?this.values.weeks||0:NaN;}/**
   * Get the days.
   * @type {number}
   */get days(){return this.isValid?this.values.days||0:NaN;}/**
   * Get the hours.
   * @type {number}
   */get hours(){return this.isValid?this.values.hours||0:NaN;}/**
   * Get the minutes.
   * @type {number}
   */get minutes(){return this.isValid?this.values.minutes||0:NaN;}/**
   * Get the seconds.
   * @return {number}
   */get seconds(){return this.isValid?this.values.seconds||0:NaN;}/**
   * Get the milliseconds.
   * @return {number}
   */get milliseconds(){return this.isValid?this.values.milliseconds||0:NaN;}/**
   * Returns whether the Duration is invalid. Invalid durations are returned by diff operations
   * on invalid DateTimes or Intervals.
   * @return {boolean}
   */get isValid(){return this.invalid===null;}/**
   * Returns an error code if this Duration became invalid, or null if the Duration is valid
   * @return {string}
   */get invalidReason(){return this.invalid?this.invalid.reason:null;}/**
   * Returns an explanation of why this Duration became invalid, or null if the Duration is valid
   * @type {string}
   */get invalidExplanation(){return this.invalid?this.invalid.explanation:null;}/**
   * Equality check
   * Two Durations are equal iff they have the same units and the same values for each unit.
   * @param {Duration} other
   * @return {boolean}
   */equals(other){if(!this.isValid||!other.isValid){return false;}if(!this.loc.equals(other.loc)){return false;}function eq(v1,v2){// Consider 0 and undefined as equal
if(v1===undefined||v1===0)return v2===undefined||v2===0;return v1===v2;}for(const u of orderedUnits$1){if(!eq(this.values[u],other.values[u])){return false;}}return true;}}const INVALID$1="Invalid Interval";// checks if the start is equal to or before the end
function validateStartEnd(start,end){if(!start||!start.isValid){return Interval.invalid("missing or invalid start");}else if(!end||!end.isValid){return Interval.invalid("missing or invalid end");}else if(end<start){return Interval.invalid("end before start",`The end of an interval must be after its start, but you had start=${start.toISO()} and end=${end.toISO()}`);}else{return null;}}/**
 * An Interval object represents a half-open interval of time, where each endpoint is a {@link DateTime}. Conceptually, it's a container for those two endpoints, accompanied by methods for creating, parsing, interrogating, comparing, transforming, and formatting them.
 *
 * Here is a brief overview of the most commonly used methods and getters in Interval:
 *
 * * **Creation** To create an Interval, use {@link Interval.fromDateTimes}, {@link Interval.after}, {@link Interval.before}, or {@link Interval.fromISO}.
 * * **Accessors** Use {@link Interval#start} and {@link Interval#end} to get the start and end.
 * * **Interrogation** To analyze the Interval, use {@link Interval#count}, {@link Interval#length}, {@link Interval#hasSame}, {@link Interval#contains}, {@link Interval#isAfter}, or {@link Interval#isBefore}.
 * * **Transformation** To create other Intervals out of this one, use {@link Interval#set}, {@link Interval#splitAt}, {@link Interval#splitBy}, {@link Interval#divideEqually}, {@link Interval.merge}, {@link Interval.xor}, {@link Interval#union}, {@link Interval#intersection}, or {@link Interval#difference}.
 * * **Comparison** To compare this Interval to another one, use {@link Interval#equals}, {@link Interval#overlaps}, {@link Interval#abutsStart}, {@link Interval#abutsEnd}, {@link Interval#engulfs}
 * * **Output** To convert the Interval into other representations, see {@link Interval#toString}, {@link Interval#toLocaleString}, {@link Interval#toISO}, {@link Interval#toISODate}, {@link Interval#toISOTime}, {@link Interval#toFormat}, and {@link Interval#toDuration}.
 */class Interval{/**
   * @private
   */constructor(config){/**
     * @access private
     */this.s=config.start;/**
     * @access private
     */this.e=config.end;/**
     * @access private
     */this.invalid=config.invalid||null;/**
     * @access private
     */this.isLuxonInterval=true;}/**
   * Create an invalid Interval.
   * @param {string} reason - simple string of why this Interval is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Interval}
   */static invalid(reason,explanation=null){if(!reason){throw new InvalidArgumentError("need to specify a reason the Interval is invalid");}const invalid=reason instanceof Invalid?reason:new Invalid(reason,explanation);if(Settings.throwOnInvalid){throw new InvalidIntervalError(invalid);}else{return new Interval({invalid});}}/**
   * Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
   * @param {DateTime|Date|Object} start
   * @param {DateTime|Date|Object} end
   * @return {Interval}
   */static fromDateTimes(start,end){const builtStart=friendlyDateTime(start),builtEnd=friendlyDateTime(end);const validateError=validateStartEnd(builtStart,builtEnd);if(validateError==null){return new Interval({start:builtStart,end:builtEnd});}else{return validateError;}}/**
   * Create an Interval from a start DateTime and a Duration to extend to.
   * @param {DateTime|Date|Object} start
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */static after(start,duration){const dur=Duration.fromDurationLike(duration),dt=friendlyDateTime(start);return Interval.fromDateTimes(dt,dt.plus(dur));}/**
   * Create an Interval from an end DateTime and a Duration to extend backwards to.
   * @param {DateTime|Date|Object} end
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */static before(end,duration){const dur=Duration.fromDurationLike(duration),dt=friendlyDateTime(end);return Interval.fromDateTimes(dt.minus(dur),dt);}/**
   * Create an Interval from an ISO 8601 string.
   * Accepts `<start>/<end>`, `<start>/<duration>`, and `<duration>/<end>` formats.
   * @param {string} text - the ISO string to parse
   * @param {Object} [opts] - options to pass {@link DateTime#fromISO} and optionally {@link Duration#fromISO}
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {Interval}
   */static fromISO(text,opts){const[s,e]=(text||"").split("/",2);if(s&&e){let start,startIsValid;try{start=DateTime$1.fromISO(s,opts);startIsValid=start.isValid;}catch(e){startIsValid=false;}let end,endIsValid;try{end=DateTime$1.fromISO(e,opts);endIsValid=end.isValid;}catch(e){endIsValid=false;}if(startIsValid&&endIsValid){return Interval.fromDateTimes(start,end);}if(startIsValid){const dur=Duration.fromISO(e,opts);if(dur.isValid){return Interval.after(start,dur);}}else if(endIsValid){const dur=Duration.fromISO(s,opts);if(dur.isValid){return Interval.before(end,dur);}}}return Interval.invalid("unparsable",`the input "${text}" can't be parsed as ISO 8601`);}/**
   * Check if an object is an Interval. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */static isInterval(o){return o&&o.isLuxonInterval||false;}/**
   * Returns the start of the Interval
   * @type {DateTime}
   */get start(){return this.isValid?this.s:null;}/**
   * Returns the end of the Interval
   * @type {DateTime}
   */get end(){return this.isValid?this.e:null;}/**
   * Returns the last DateTime included in the interval (since end is not part of the interval)
   * @type {DateTime}
   */get lastDateTime(){return this.isValid?this.e?this.e.minus(1):null:null;}/**
   * Returns whether this Interval's end is at least its start, meaning that the Interval isn't 'backwards'.
   * @type {boolean}
   */get isValid(){return this.invalidReason===null;}/**
   * Returns an error code if this Interval is invalid, or null if the Interval is valid
   * @type {string}
   */get invalidReason(){return this.invalid?this.invalid.reason:null;}/**
   * Returns an explanation of why this Interval became invalid, or null if the Interval is valid
   * @type {string}
   */get invalidExplanation(){return this.invalid?this.invalid.explanation:null;}/**
   * Returns the length of the Interval in the specified unit.
   * @param {string} unit - the unit (such as 'hours' or 'days') to return the length in.
   * @return {number}
   */length(unit="milliseconds"){return this.isValid?this.toDuration(...[unit]).get(unit):NaN;}/**
   * Returns the count of minutes, hours, days, months, or years included in the Interval, even in part.
   * Unlike {@link Interval#length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
   * asks 'what dates are included in this interval?', not 'how many days long is this interval?'
   * @param {string} [unit='milliseconds'] - the unit of time to count.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; this operation will always use the locale of the start DateTime
   * @return {number}
   */count(unit="milliseconds",opts){if(!this.isValid)return NaN;const start=this.start.startOf(unit,opts);let end;if(opts!==null&&opts!==void 0&&opts.useLocaleWeeks){end=this.end.reconfigure({locale:start.locale});}else{end=this.end;}end=end.startOf(unit,opts);return Math.floor(end.diff(start,unit).get(unit))+(end.valueOf()!==this.end.valueOf());}/**
   * Returns whether this Interval's start and end are both in the same unit of time
   * @param {string} unit - the unit of time to check sameness on
   * @return {boolean}
   */hasSame(unit){return this.isValid?this.isEmpty()||this.e.minus(1).hasSame(this.s,unit):false;}/**
   * Return whether this Interval has the same start and end DateTimes.
   * @return {boolean}
   */isEmpty(){return this.s.valueOf()===this.e.valueOf();}/**
   * Return whether this Interval's start is after the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */isAfter(dateTime){if(!this.isValid)return false;return this.s>dateTime;}/**
   * Return whether this Interval's end is before the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */isBefore(dateTime){if(!this.isValid)return false;return this.e<=dateTime;}/**
   * Return whether this Interval contains the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */contains(dateTime){if(!this.isValid)return false;return this.s<=dateTime&&this.e>dateTime;}/**
   * "Sets" the start and/or end dates. Returns a newly-constructed Interval.
   * @param {Object} values - the values to set
   * @param {DateTime} values.start - the starting DateTime
   * @param {DateTime} values.end - the ending DateTime
   * @return {Interval}
   */set({start,end}={}){if(!this.isValid)return this;return Interval.fromDateTimes(start||this.s,end||this.e);}/**
   * Split this Interval at each of the specified DateTimes
   * @param {...DateTime} dateTimes - the unit of time to count.
   * @return {Array}
   */splitAt(...dateTimes){if(!this.isValid)return[];const sorted=dateTimes.map(friendlyDateTime).filter(d=>this.contains(d)).sort((a,b)=>a.toMillis()-b.toMillis()),results=[];let{s}=this,i=0;while(s<this.e){const added=sorted[i]||this.e,next=+added>+this.e?this.e:added;results.push(Interval.fromDateTimes(s,next));s=next;i+=1;}return results;}/**
   * Split this Interval into smaller Intervals, each of the specified length.
   * Left over time is grouped into a smaller interval
   * @param {Duration|Object|number} duration - The length of each resulting interval.
   * @return {Array}
   */splitBy(duration){const dur=Duration.fromDurationLike(duration);if(!this.isValid||!dur.isValid||dur.as("milliseconds")===0){return[];}let{s}=this,idx=1,next;const results=[];while(s<this.e){const added=this.start.plus(dur.mapUnits(x=>x*idx));next=+added>+this.e?this.e:added;results.push(Interval.fromDateTimes(s,next));s=next;idx+=1;}return results;}/**
   * Split this Interval into the specified number of smaller intervals.
   * @param {number} numberOfParts - The number of Intervals to divide the Interval into.
   * @return {Array}
   */divideEqually(numberOfParts){if(!this.isValid)return[];return this.splitBy(this.length()/numberOfParts).slice(0,numberOfParts);}/**
   * Return whether this Interval overlaps with the specified Interval
   * @param {Interval} other
   * @return {boolean}
   */overlaps(other){return this.e>other.s&&this.s<other.e;}/**
   * Return whether this Interval's end is adjacent to the specified Interval's start.
   * @param {Interval} other
   * @return {boolean}
   */abutsStart(other){if(!this.isValid)return false;return+this.e===+other.s;}/**
   * Return whether this Interval's start is adjacent to the specified Interval's end.
   * @param {Interval} other
   * @return {boolean}
   */abutsEnd(other){if(!this.isValid)return false;return+other.e===+this.s;}/**
   * Returns true if this Interval fully contains the specified Interval, specifically if the intersect (of this Interval and the other Interval) is equal to the other Interval; false otherwise.
   * @param {Interval} other
   * @return {boolean}
   */engulfs(other){if(!this.isValid)return false;return this.s<=other.s&&this.e>=other.e;}/**
   * Return whether this Interval has the same start and end as the specified Interval.
   * @param {Interval} other
   * @return {boolean}
   */equals(other){if(!this.isValid||!other.isValid){return false;}return this.s.equals(other.s)&&this.e.equals(other.e);}/**
   * Return an Interval representing the intersection of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
   * Returns null if the intersection is empty, meaning, the intervals don't intersect.
   * @param {Interval} other
   * @return {Interval}
   */intersection(other){if(!this.isValid)return this;const s=this.s>other.s?this.s:other.s,e=this.e<other.e?this.e:other.e;if(s>=e){return null;}else{return Interval.fromDateTimes(s,e);}}/**
   * Return an Interval representing the union of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
   * @param {Interval} other
   * @return {Interval}
   */union(other){if(!this.isValid)return this;const s=this.s<other.s?this.s:other.s,e=this.e>other.e?this.e:other.e;return Interval.fromDateTimes(s,e);}/**
   * Merge an array of Intervals into an equivalent minimal set of Intervals.
   * Combines overlapping and adjacent Intervals.
   * The resulting array will contain the Intervals in ascending order, that is, starting with the earliest Interval
   * and ending with the latest.
   *
   * @param {Array} intervals
   * @return {Array}
   */static merge(intervals){const[found,final]=intervals.sort((a,b)=>a.s-b.s).reduce(([sofar,current],item)=>{if(!current){return[sofar,item];}else if(current.overlaps(item)||current.abutsStart(item)){return[sofar,current.union(item)];}else{return[sofar.concat([current]),item];}},[[],null]);if(final){found.push(final);}return found;}/**
   * Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
   * @param {Array} intervals
   * @return {Array}
   */static xor(intervals){let start=null,currentCount=0;const results=[],ends=intervals.map(i=>[{time:i.s,type:"s"},{time:i.e,type:"e"}]),flattened=Array.prototype.concat(...ends),arr=flattened.sort((a,b)=>a.time-b.time);for(const i of arr){currentCount+=i.type==="s"?1:-1;if(currentCount===1){start=i.time;}else{if(start&&+start!==+i.time){results.push(Interval.fromDateTimes(start,i.time));}start=null;}}return Interval.merge(results);}/**
   * Return an Interval representing the span of time in this Interval that doesn't overlap with any of the specified Intervals.
   * @param {...Interval} intervals
   * @return {Array}
   */difference(...intervals){return Interval.xor([this].concat(intervals)).map(i=>this.intersection(i)).filter(i=>i&&!i.isEmpty());}/**
   * Returns a string representation of this Interval appropriate for debugging.
   * @return {string}
   */toString(){if(!this.isValid)return INVALID$1;return`[${this.s.toISO()} – ${this.e.toISO()})`;}/**
   * Returns a string representation of this Interval appropriate for the REPL.
   * @return {string}
   */[Symbol.for("nodejs.util.inspect.custom")](){if(this.isValid){return`Interval { start: ${this.s.toISO()}, end: ${this.e.toISO()} }`;}else{return`Interval { Invalid, reason: ${this.invalidReason} }`;}}/**
   * Returns a localized string representing this Interval. Accepts the same options as the
   * Intl.DateTimeFormat constructor and any presets defined by Luxon, such as
   * {@link DateTime.DATE_FULL} or {@link DateTime.TIME_SIMPLE}. The exact behavior of this method
   * is browser-specific, but in general it will return an appropriate representation of the
   * Interval in the assigned locale. Defaults to the system's locale if no locale has been
   * specified.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {Object} [formatOpts=DateTime.DATE_SHORT] - Either a DateTime preset or
   * Intl.DateTimeFormat constructor options.
   * @param {Object} opts - Options to override the configuration of the start DateTime.
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(); //=> 11/7/2022 – 11/8/2022
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL); //=> November 7 – 8, 2022
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL, { locale: 'fr-FR' }); //=> 7–8 novembre 2022
   * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString(DateTime.TIME_SIMPLE); //=> 6:00 – 8:00 PM
   * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> Mon, Nov 07, 6:00 – 8:00 p
   * @return {string}
   */toLocaleString(formatOpts=DATE_SHORT,opts={}){return this.isValid?Formatter.create(this.s.loc.clone(opts),formatOpts).formatInterval(this):INVALID$1;}/**
   * Returns an ISO 8601-compliant string representation of this Interval.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */toISO(opts){if(!this.isValid)return INVALID$1;return`${this.s.toISO(opts)}/${this.e.toISO(opts)}`;}/**
   * Returns an ISO 8601-compliant string representation of date of this Interval.
   * The time components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {string}
   */toISODate(){if(!this.isValid)return INVALID$1;return`${this.s.toISODate()}/${this.e.toISODate()}`;}/**
   * Returns an ISO 8601-compliant string representation of time of this Interval.
   * The date components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */toISOTime(opts){if(!this.isValid)return INVALID$1;return`${this.s.toISOTime(opts)}/${this.e.toISOTime(opts)}`;}/**
   * Returns a string representation of this Interval formatted according to the specified format
   * string. **You may not want this.** See {@link Interval#toLocaleString} for a more flexible
   * formatting tool.
   * @param {string} dateFormat - The format string. This string formats the start and end time.
   * See {@link DateTime#toFormat} for details.
   * @param {Object} opts - Options.
   * @param {string} [opts.separator =  ' – '] - A separator to place between the start and end
   * representations.
   * @return {string}
   */toFormat(dateFormat,{separator=" – "}={}){if(!this.isValid)return INVALID$1;return`${this.s.toFormat(dateFormat)}${separator}${this.e.toFormat(dateFormat)}`;}/**
   * Return a Duration representing the time spanned by this interval.
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example Interval.fromDateTimes(dt1, dt2).toDuration().toObject() //=> { milliseconds: 88489257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('days').toObject() //=> { days: 1.0241812152777778 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes']).toObject() //=> { hours: 24, minutes: 34.82095 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes', 'seconds']).toObject() //=> { hours: 24, minutes: 34, seconds: 49.257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('seconds').toObject() //=> { seconds: 88489.257 }
   * @return {Duration}
   */toDuration(unit,opts){if(!this.isValid){return Duration.invalid(this.invalidReason);}return this.e.diff(this.s,unit,opts);}/**
   * Run mapFn on the interval start and end, returning a new Interval from the resulting DateTimes
   * @param {function} mapFn
   * @return {Interval}
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.toUTC())
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.plus({ hours: 2 }))
   */mapEndpoints(mapFn){return Interval.fromDateTimes(mapFn(this.s),mapFn(this.e));}}/**
 * The Info class contains static methods for retrieving general time and date related data. For example, it has methods for finding out if a time zone has a DST, for listing the months in any supported locale, and for discovering which of Luxon features are available in the current environment.
 */class Info{/**
   * Return whether the specified zone contains a DST.
   * @param {string|Zone} [zone='local'] - Zone to check. Defaults to the environment's local zone.
   * @return {boolean}
   */static hasDST(zone=Settings.defaultZone){const proto=DateTime$1.now().setZone(zone).set({month:12});return!zone.isUniversal&&proto.offset!==proto.set({month:6}).offset;}/**
   * Return whether the specified zone is a valid IANA specifier.
   * @param {string} zone - Zone to check
   * @return {boolean}
   */static isValidIANAZone(zone){return IANAZone.isValidZone(zone);}/**
   * Converts the input into a {@link Zone} instance.
   *
   * * If `input` is already a Zone instance, it is returned unchanged.
   * * If `input` is a string containing a valid time zone name, a Zone instance
   *   with that name is returned.
   * * If `input` is a string that doesn't refer to a known time zone, a Zone
   *   instance with {@link Zone#isValid} == false is returned.
   * * If `input is a number, a Zone instance with the specified fixed offset
   *   in minutes is returned.
   * * If `input` is `null` or `undefined`, the default zone is returned.
   * @param {string|Zone|number} [input] - the value to be converted
   * @return {Zone}
   */static normalizeZone(input){return normalizeZone(input,Settings.defaultZone);}/**
   * Get the weekday on which the week starts according to the given locale.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number} the start of the week, 1 for Monday through 7 for Sunday
   */static getStartOfWeek({locale=null,locObj=null}={}){return(locObj||Locale.create(locale)).getStartOfWeek();}/**
   * Get the minimum number of days necessary in a week before it is considered part of the next year according
   * to the given locale.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number}
   */static getMinimumDaysInFirstWeek({locale=null,locObj=null}={}){return(locObj||Locale.create(locale)).getMinDaysInFirstWeek();}/**
   * Get the weekdays, which are considered the weekend according to the given locale
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number[]} an array of weekdays, 1 for Monday through 7 for Sunday
   */static getWeekendWeekdays({locale=null,locObj=null}={}){// copy the array, because we cache it internally
return(locObj||Locale.create(locale)).getWeekendDays().slice();}/**
   * Return an array of standalone month names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @example Info.months()[0] //=> 'January'
   * @example Info.months('short')[0] //=> 'Jan'
   * @example Info.months('numeric')[0] //=> '1'
   * @example Info.months('short', { locale: 'fr-CA' } )[0] //=> 'janv.'
   * @example Info.months('numeric', { locale: 'ar' })[0] //=> '١'
   * @example Info.months('long', { outputCalendar: 'islamic' })[0] //=> 'Rabiʻ I'
   * @return {Array}
   */static months(length="long",{locale=null,numberingSystem=null,locObj=null,outputCalendar="gregory"}={}){return(locObj||Locale.create(locale,numberingSystem,outputCalendar)).months(length);}/**
   * Return an array of format month names.
   * Format months differ from standalone months in that they're meant to appear next to the day of the month. In some languages, that
   * changes the string.
   * See {@link Info#months}
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @return {Array}
   */static monthsFormat(length="long",{locale=null,numberingSystem=null,locObj=null,outputCalendar="gregory"}={}){return(locObj||Locale.create(locale,numberingSystem,outputCalendar)).months(length,true);}/**
   * Return an array of standalone week names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the weekday representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @example Info.weekdays()[0] //=> 'Monday'
   * @example Info.weekdays('short')[0] //=> 'Mon'
   * @example Info.weekdays('short', { locale: 'fr-CA' })[0] //=> 'lun.'
   * @example Info.weekdays('short', { locale: 'ar' })[0] //=> 'الاثنين'
   * @return {Array}
   */static weekdays(length="long",{locale=null,numberingSystem=null,locObj=null}={}){return(locObj||Locale.create(locale,numberingSystem,null)).weekdays(length);}/**
   * Return an array of format week names.
   * Format weekdays differ from standalone weekdays in that they're meant to appear next to more date information. In some languages, that
   * changes the string.
   * See {@link Info#weekdays}
   * @param {string} [length='long'] - the length of the month representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale=null] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @return {Array}
   */static weekdaysFormat(length="long",{locale=null,numberingSystem=null,locObj=null}={}){return(locObj||Locale.create(locale,numberingSystem,null)).weekdays(length,true);}/**
   * Return an array of meridiems.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.meridiems() //=> [ 'AM', 'PM' ]
   * @example Info.meridiems({ locale: 'my' }) //=> [ 'နံနက်', 'ညနေ' ]
   * @return {Array}
   */static meridiems({locale=null}={}){return Locale.create(locale).meridiems();}/**
   * Return an array of eras, such as ['BC', 'AD']. The locale can be specified, but the calendar system is always Gregorian.
   * @param {string} [length='short'] - the length of the era representation, such as "short" or "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.eras() //=> [ 'BC', 'AD' ]
   * @example Info.eras('long') //=> [ 'Before Christ', 'Anno Domini' ]
   * @example Info.eras('long', { locale: 'fr' }) //=> [ 'avant Jésus-Christ', 'après Jésus-Christ' ]
   * @return {Array}
   */static eras(length="short",{locale=null}={}){return Locale.create(locale,null,"gregory").eras(length);}/**
   * Return the set of available features in this environment.
   * Some features of Luxon are not available in all environments. For example, on older browsers, relative time formatting support is not available. Use this function to figure out if that's the case.
   * Keys:
   * * `relative`: whether this environment supports relative time formatting
   * * `localeWeek`: whether this environment supports different weekdays for the start of the week based on the locale
   * @example Info.features() //=> { relative: false, localeWeek: true }
   * @return {Object}
   */static features(){return{relative:hasRelative(),localeWeek:hasLocaleWeekInfo()};}}function dayDiff(earlier,later){const utcDayStart=dt=>dt.toUTC(0,{keepLocalTime:true}).startOf("day").valueOf(),ms=utcDayStart(later)-utcDayStart(earlier);return Math.floor(Duration.fromMillis(ms).as("days"));}function highOrderDiffs(cursor,later,units){const differs=[["years",(a,b)=>b.year-a.year],["quarters",(a,b)=>b.quarter-a.quarter+(b.year-a.year)*4],["months",(a,b)=>b.month-a.month+(b.year-a.year)*12],["weeks",(a,b)=>{const days=dayDiff(a,b);return(days-days%7)/7;}],["days",dayDiff]];const results={};const earlier=cursor;let lowestOrder,highWater;/* This loop tries to diff using larger units first.
     If we overshoot, we backtrack and try the next smaller unit.
     "cursor" starts out at the earlier timestamp and moves closer and closer to "later"
     as we use smaller and smaller units.
     highWater keeps track of where we would be if we added one more of the smallest unit,
     this is used later to potentially convert any difference smaller than the smallest higher order unit
     into a fraction of that smallest higher order unit
  */for(const[unit,differ]of differs){if(units.indexOf(unit)>=0){lowestOrder=unit;results[unit]=differ(cursor,later);highWater=earlier.plus(results);if(highWater>later){// we overshot the end point, backtrack cursor by 1
results[unit]--;cursor=earlier.plus(results);// if we are still overshooting now, we need to backtrack again
// this happens in certain situations when diffing times in different zones,
// because this calculation ignores time zones
if(cursor>later){// keep the "overshot by 1" around as highWater
highWater=cursor;// backtrack cursor by 1
results[unit]--;cursor=earlier.plus(results);}}else{cursor=highWater;}}}return[cursor,results,highWater,lowestOrder];}function diff(earlier,later,units,opts){let[cursor,results,highWater,lowestOrder]=highOrderDiffs(earlier,later,units);const remainingMillis=later-cursor;const lowerOrderUnits=units.filter(u=>["hours","minutes","seconds","milliseconds"].indexOf(u)>=0);if(lowerOrderUnits.length===0){if(highWater<later){highWater=cursor.plus({[lowestOrder]:1});}if(highWater!==cursor){results[lowestOrder]=(results[lowestOrder]||0)+remainingMillis/(highWater-cursor);}}const duration=Duration.fromObject(results,opts);if(lowerOrderUnits.length>0){return Duration.fromMillis(remainingMillis,opts).shiftTo(...lowerOrderUnits).plus(duration);}else{return duration;}}const MISSING_FTP="missing Intl.DateTimeFormat.formatToParts support";function intUnit(regex,post=i=>i){return{regex,deser:([s])=>post(parseDigits(s))};}const NBSP=String.fromCharCode(160);const spaceOrNBSP=`[ ${NBSP}]`;const spaceOrNBSPRegExp=new RegExp(spaceOrNBSP,"g");function fixListRegex(s){// make dots optional and also make them literal
// make space and non breakable space characters interchangeable
return s.replace(/\./g,"\\.?").replace(spaceOrNBSPRegExp,spaceOrNBSP);}function stripInsensitivities(s){return s.replace(/\./g,"")// ignore dots that were made optional
.replace(spaceOrNBSPRegExp," ")// interchange space and nbsp
.toLowerCase();}function oneOf(strings,startIndex){if(strings===null){return null;}else{return{regex:RegExp(strings.map(fixListRegex).join("|")),deser:([s])=>strings.findIndex(i=>stripInsensitivities(s)===stripInsensitivities(i))+startIndex};}}function offset(regex,groups){return{regex,deser:([,h,m])=>signedOffset(h,m),groups};}function simple(regex){return{regex,deser:([s])=>s};}function escapeToken(value){return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&");}/**
 * @param token
 * @param {Locale} loc
 */function unitForToken(token,loc){const one=digitRegex(loc),two=digitRegex(loc,"{2}"),three=digitRegex(loc,"{3}"),four=digitRegex(loc,"{4}"),six=digitRegex(loc,"{6}"),oneOrTwo=digitRegex(loc,"{1,2}"),oneToThree=digitRegex(loc,"{1,3}"),oneToSix=digitRegex(loc,"{1,6}"),oneToNine=digitRegex(loc,"{1,9}"),twoToFour=digitRegex(loc,"{2,4}"),fourToSix=digitRegex(loc,"{4,6}"),literal=t=>({regex:RegExp(escapeToken(t.val)),deser:([s])=>s,literal:true}),unitate=t=>{if(token.literal){return literal(t);}switch(t.val){// era
case"G":return oneOf(loc.eras("short"),0);case"GG":return oneOf(loc.eras("long"),0);// years
case"y":return intUnit(oneToSix);case"yy":return intUnit(twoToFour,untruncateYear);case"yyyy":return intUnit(four);case"yyyyy":return intUnit(fourToSix);case"yyyyyy":return intUnit(six);// months
case"M":return intUnit(oneOrTwo);case"MM":return intUnit(two);case"MMM":return oneOf(loc.months("short",true),1);case"MMMM":return oneOf(loc.months("long",true),1);case"L":return intUnit(oneOrTwo);case"LL":return intUnit(two);case"LLL":return oneOf(loc.months("short",false),1);case"LLLL":return oneOf(loc.months("long",false),1);// dates
case"d":return intUnit(oneOrTwo);case"dd":return intUnit(two);// ordinals
case"o":return intUnit(oneToThree);case"ooo":return intUnit(three);// time
case"HH":return intUnit(two);case"H":return intUnit(oneOrTwo);case"hh":return intUnit(two);case"h":return intUnit(oneOrTwo);case"mm":return intUnit(two);case"m":return intUnit(oneOrTwo);case"q":return intUnit(oneOrTwo);case"qq":return intUnit(two);case"s":return intUnit(oneOrTwo);case"ss":return intUnit(two);case"S":return intUnit(oneToThree);case"SSS":return intUnit(three);case"u":return simple(oneToNine);case"uu":return simple(oneOrTwo);case"uuu":return intUnit(one);// meridiem
case"a":return oneOf(loc.meridiems(),0);// weekYear (k)
case"kkkk":return intUnit(four);case"kk":return intUnit(twoToFour,untruncateYear);// weekNumber (W)
case"W":return intUnit(oneOrTwo);case"WW":return intUnit(two);// weekdays
case"E":case"c":return intUnit(one);case"EEE":return oneOf(loc.weekdays("short",false),1);case"EEEE":return oneOf(loc.weekdays("long",false),1);case"ccc":return oneOf(loc.weekdays("short",true),1);case"cccc":return oneOf(loc.weekdays("long",true),1);// offset/zone
case"Z":case"ZZ":return offset(new RegExp(`([+-]${oneOrTwo.source})(?::(${two.source}))?`),2);case"ZZZ":return offset(new RegExp(`([+-]${oneOrTwo.source})(${two.source})?`),2);// we don't support ZZZZ (PST) or ZZZZZ (Pacific Standard Time) in parsing
// because we don't have any way to figure out what they are
case"z":return simple(/[a-z_+-/]{1,256}?/i);// this special-case "token" represents a place where a macro-token expanded into a white-space literal
// in this case we accept any non-newline white-space
case" ":return simple(/[^\S\n\r]/);default:return literal(t);}};const unit=unitate(token)||{invalidReason:MISSING_FTP};unit.token=token;return unit;}const partTypeStyleToTokenVal={year:{"2-digit":"yy",numeric:"yyyyy"},month:{numeric:"M","2-digit":"MM",short:"MMM",long:"MMMM"},day:{numeric:"d","2-digit":"dd"},weekday:{short:"EEE",long:"EEEE"},dayperiod:"a",dayPeriod:"a",hour12:{numeric:"h","2-digit":"hh"},hour24:{numeric:"H","2-digit":"HH"},minute:{numeric:"m","2-digit":"mm"},second:{numeric:"s","2-digit":"ss"},timeZoneName:{long:"ZZZZZ",short:"ZZZ"}};function tokenForPart(part,formatOpts,resolvedOpts){const{type,value}=part;if(type==="literal"){const isSpace=/^\s+$/.test(value);return{literal:!isSpace,val:isSpace?" ":value};}const style=formatOpts[type];// The user might have explicitly specified hour12 or hourCycle
// if so, respect their decision
// if not, refer back to the resolvedOpts, which are based on the locale
let actualType=type;if(type==="hour"){if(formatOpts.hour12!=null){actualType=formatOpts.hour12?"hour12":"hour24";}else if(formatOpts.hourCycle!=null){if(formatOpts.hourCycle==="h11"||formatOpts.hourCycle==="h12"){actualType="hour12";}else{actualType="hour24";}}else{// tokens only differentiate between 24 hours or not,
// so we do not need to check hourCycle here, which is less supported anyways
actualType=resolvedOpts.hour12?"hour12":"hour24";}}let val=partTypeStyleToTokenVal[actualType];if(typeof val==="object"){val=val[style];}if(val){return{literal:false,val};}return undefined;}function buildRegex(units){const re=units.map(u=>u.regex).reduce((f,r)=>`${f}(${r.source})`,"");return[`^${re}$`,units];}function match(input,regex,handlers){const matches=input.match(regex);if(matches){const all={};let matchIndex=1;for(const i in handlers){if(hasOwnProperty(handlers,i)){const h=handlers[i],groups=h.groups?h.groups+1:1;if(!h.literal&&h.token){all[h.token.val[0]]=h.deser(matches.slice(matchIndex,matchIndex+groups));}matchIndex+=groups;}}return[matches,all];}else{return[matches,{}];}}function dateTimeFromMatches(matches){const toField=token=>{switch(token){case"S":return"millisecond";case"s":return"second";case"m":return"minute";case"h":case"H":return"hour";case"d":return"day";case"o":return"ordinal";case"L":case"M":return"month";case"y":return"year";case"E":case"c":return"weekday";case"W":return"weekNumber";case"k":return"weekYear";case"q":return"quarter";default:return null;}};let zone=null;let specificOffset;if(!isUndefined(matches.z)){zone=IANAZone.create(matches.z);}if(!isUndefined(matches.Z)){if(!zone){zone=new FixedOffsetZone(matches.Z);}specificOffset=matches.Z;}if(!isUndefined(matches.q)){matches.M=(matches.q-1)*3+1;}if(!isUndefined(matches.h)){if(matches.h<12&&matches.a===1){matches.h+=12;}else if(matches.h===12&&matches.a===0){matches.h=0;}}if(matches.G===0&&matches.y){matches.y=-matches.y;}if(!isUndefined(matches.u)){matches.S=parseMillis(matches.u);}const vals=Object.keys(matches).reduce((r,k)=>{const f=toField(k);if(f){r[f]=matches[k];}return r;},{});return[vals,zone,specificOffset];}let dummyDateTimeCache=null;function getDummyDateTime(){if(!dummyDateTimeCache){dummyDateTimeCache=DateTime$1.fromMillis(1555555555555);}return dummyDateTimeCache;}function maybeExpandMacroToken(token,locale){if(token.literal){return token;}const formatOpts=Formatter.macroTokenToFormatOpts(token.val);const tokens=formatOptsToTokens(formatOpts,locale);if(tokens==null||tokens.includes(undefined)){return token;}return tokens;}function expandMacroTokens(tokens,locale){return Array.prototype.concat(...tokens.map(t=>maybeExpandMacroToken(t,locale)));}/**
 * @private
 */class TokenParser{constructor(locale,format){this.locale=locale;this.format=format;this.tokens=expandMacroTokens(Formatter.parseFormat(format),locale);this.units=this.tokens.map(t=>unitForToken(t,locale));this.disqualifyingUnit=this.units.find(t=>t.invalidReason);if(!this.disqualifyingUnit){const[regexString,handlers]=buildRegex(this.units);this.regex=RegExp(regexString,"i");this.handlers=handlers;}}explainFromTokens(input){if(!this.isValid){return{input,tokens:this.tokens,invalidReason:this.invalidReason};}else{const[rawMatches,matches]=match(input,this.regex,this.handlers),[result,zone,specificOffset]=matches?dateTimeFromMatches(matches):[null,null,undefined];if(hasOwnProperty(matches,"a")&&hasOwnProperty(matches,"H")){throw new ConflictingSpecificationError("Can't include meridiem when specifying 24-hour format");}return{input,tokens:this.tokens,regex:this.regex,rawMatches,matches,result,zone,specificOffset};}}get isValid(){return!this.disqualifyingUnit;}get invalidReason(){return this.disqualifyingUnit?this.disqualifyingUnit.invalidReason:null;}}function explainFromTokens(locale,input,format){const parser=new TokenParser(locale,format);return parser.explainFromTokens(input);}function parseFromTokens(locale,input,format){const{result,zone,specificOffset,invalidReason}=explainFromTokens(locale,input,format);return[result,zone,specificOffset,invalidReason];}function formatOptsToTokens(formatOpts,locale){if(!formatOpts){return null;}const formatter=Formatter.create(locale,formatOpts);const df=formatter.dtFormatter(getDummyDateTime());const parts=df.formatToParts();const resolvedOpts=df.resolvedOptions();return parts.map(p=>tokenForPart(p,formatOpts,resolvedOpts));}const INVALID="Invalid DateTime";const MAX_DATE$1=8.64e15;function unsupportedZone(zone){return new Invalid("unsupported zone",`the zone "${zone.name}" is not supported`);}// we cache week data on the DT object and this intermediates the cache
/**
 * @param {DateTime} dt
 */function possiblyCachedWeekData(dt){if(dt.weekData===null){dt.weekData=gregorianToWeek(dt.c);}return dt.weekData;}/**
 * @param {DateTime} dt
 */function possiblyCachedLocalWeekData(dt){if(dt.localWeekData===null){dt.localWeekData=gregorianToWeek(dt.c,dt.loc.getMinDaysInFirstWeek(),dt.loc.getStartOfWeek());}return dt.localWeekData;}// clone really means, "make a new object with these modifications". all "setters" really use this
// to create a new object while only changing some of the properties
function clone$1(inst,alts){const current={ts:inst.ts,zone:inst.zone,c:inst.c,o:inst.o,loc:inst.loc,invalid:inst.invalid};return new DateTime$1(_objectSpread(_objectSpread(_objectSpread({},current),alts),{},{old:current}));}// find the right offset a given local time. The o input is our guess, which determines which
// offset we'll pick in ambiguous cases (e.g. there are two 3 AMs b/c Fallback DST)
function fixOffset(localTS,o,tz){// Our UTC time is just a guess because our offset is just a guess
let utcGuess=localTS-o*60*1000;// Test whether the zone matches the offset for this ts
const o2=tz.offset(utcGuess);// If so, offset didn't change and we're done
if(o===o2){return[utcGuess,o];}// If not, change the ts by the difference in the offset
utcGuess-=(o2-o)*60*1000;// If that gives us the local time we want, we're done
const o3=tz.offset(utcGuess);if(o2===o3){return[utcGuess,o2];}// If it's different, we're in a hole time. The offset has changed, but the we don't adjust the time
return[localTS-Math.min(o2,o3)*60*1000,Math.max(o2,o3)];}// convert an epoch timestamp into a calendar object with the given offset
function tsToObj(ts,offset){ts+=offset*60*1000;const d=new Date(ts);return{year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),second:d.getUTCSeconds(),millisecond:d.getUTCMilliseconds()};}// convert a calendar object to a epoch timestamp
function objToTS(obj,offset,zone){return fixOffset(objToLocalTS(obj),offset,zone);}// create a new DT instance by adding a duration, adjusting for DSTs
function adjustTime(inst,dur){const oPre=inst.o,year=inst.c.year+Math.trunc(dur.years),month=inst.c.month+Math.trunc(dur.months)+Math.trunc(dur.quarters)*3,c=_objectSpread(_objectSpread({},inst.c),{},{year,month,day:Math.min(inst.c.day,daysInMonth(year,month))+Math.trunc(dur.days)+Math.trunc(dur.weeks)*7}),millisToAdd=Duration.fromObject({years:dur.years-Math.trunc(dur.years),quarters:dur.quarters-Math.trunc(dur.quarters),months:dur.months-Math.trunc(dur.months),weeks:dur.weeks-Math.trunc(dur.weeks),days:dur.days-Math.trunc(dur.days),hours:dur.hours,minutes:dur.minutes,seconds:dur.seconds,milliseconds:dur.milliseconds}).as("milliseconds"),localTS=objToLocalTS(c);let[ts,o]=fixOffset(localTS,oPre,inst.zone);if(millisToAdd!==0){ts+=millisToAdd;// that could have changed the offset by going over a DST, but we want to keep the ts the same
o=inst.zone.offset(ts);}return{ts,o};}// helper useful in turning the results of parsing into real dates
// by handling the zone options
function parseDataToDateTime(parsed,parsedZone,opts,format,text,specificOffset){const{setZone,zone}=opts;if(parsed&&Object.keys(parsed).length!==0||parsedZone){const interpretationZone=parsedZone||zone,inst=DateTime$1.fromObject(parsed,_objectSpread(_objectSpread({},opts),{},{zone:interpretationZone,specificOffset}));return setZone?inst:inst.setZone(zone);}else{return DateTime$1.invalid(new Invalid("unparsable",`the input "${text}" can't be parsed as ${format}`));}}// if you want to output a technical format (e.g. RFC 2822), this helper
// helps handle the details
function toTechFormat(dt,format,allowZ=true){return dt.isValid?Formatter.create(Locale.create("en-US"),{allowZ,forceSimple:true}).formatDateTimeFromString(dt,format):null;}function toISODate(o,extended){const longFormat=o.c.year>9999||o.c.year<0;let c="";if(longFormat&&o.c.year>=0)c+="+";c+=padStart$1(o.c.year,longFormat?6:4);if(extended){c+="-";c+=padStart$1(o.c.month);c+="-";c+=padStart$1(o.c.day);}else{c+=padStart$1(o.c.month);c+=padStart$1(o.c.day);}return c;}function toISOTime(o,extended,suppressSeconds,suppressMilliseconds,includeOffset,extendedZone){let c=padStart$1(o.c.hour);if(extended){c+=":";c+=padStart$1(o.c.minute);if(o.c.millisecond!==0||o.c.second!==0||!suppressSeconds){c+=":";}}else{c+=padStart$1(o.c.minute);}if(o.c.millisecond!==0||o.c.second!==0||!suppressSeconds){c+=padStart$1(o.c.second);if(o.c.millisecond!==0||!suppressMilliseconds){c+=".";c+=padStart$1(o.c.millisecond,3);}}if(includeOffset){if(o.isOffsetFixed&&o.offset===0&&!extendedZone){c+="Z";}else if(o.o<0){c+="-";c+=padStart$1(Math.trunc(-o.o/60));c+=":";c+=padStart$1(Math.trunc(-o.o%60));}else{c+="+";c+=padStart$1(Math.trunc(o.o/60));c+=":";c+=padStart$1(Math.trunc(o.o%60));}}if(extendedZone){c+="["+o.zone.ianaName+"]";}return c;}// defaults for unspecified units in the supported calendars
const defaultUnitValues={month:1,day:1,hour:0,minute:0,second:0,millisecond:0},defaultWeekUnitValues={weekNumber:1,weekday:1,hour:0,minute:0,second:0,millisecond:0},defaultOrdinalUnitValues={ordinal:1,hour:0,minute:0,second:0,millisecond:0};// Units in the supported calendars, sorted by bigness
const orderedUnits=["year","month","day","hour","minute","second","millisecond"],orderedWeekUnits=["weekYear","weekNumber","weekday","hour","minute","second","millisecond"],orderedOrdinalUnits=["year","ordinal","hour","minute","second","millisecond"];// standardize case and plurality in units
function normalizeUnit(unit){const normalized={year:"year",years:"year",month:"month",months:"month",day:"day",days:"day",hour:"hour",hours:"hour",minute:"minute",minutes:"minute",quarter:"quarter",quarters:"quarter",second:"second",seconds:"second",millisecond:"millisecond",milliseconds:"millisecond",weekday:"weekday",weekdays:"weekday",weeknumber:"weekNumber",weeksnumber:"weekNumber",weeknumbers:"weekNumber",weekyear:"weekYear",weekyears:"weekYear",ordinal:"ordinal"}[unit.toLowerCase()];if(!normalized)throw new InvalidUnitError(unit);return normalized;}function normalizeUnitWithLocalWeeks(unit){switch(unit.toLowerCase()){case"localweekday":case"localweekdays":return"localWeekday";case"localweeknumber":case"localweeknumbers":return"localWeekNumber";case"localweekyear":case"localweekyears":return"localWeekYear";default:return normalizeUnit(unit);}}// cache offsets for zones based on the current timestamp when this function is
// first called. When we are handling a datetime from components like (year,
// month, day, hour) in a time zone, we need a guess about what the timezone
// offset is so that we can convert into a UTC timestamp. One way is to find the
// offset of now in the zone. The actual date may have a different offset (for
// example, if we handle a date in June while we're in December in a zone that
// observes DST), but we can check and adjust that.
//
// When handling many dates, calculating the offset for now every time is
// expensive. It's just a guess, so we can cache the offset to use even if we
// are right on a time change boundary (we'll just correct in the other
// direction). Using a timestamp from first read is a slight optimization for
// handling dates close to the current date, since those dates will usually be
// in the same offset (we could set the timestamp statically, instead). We use a
// single timestamp for all zones to make things a bit more predictable.
//
// This is safe for quickDT (used by local() and utc()) because we don't fill in
// higher-order units from tsNow (as we do in fromObject, this requires that
// offset is calculated from tsNow).
/**
 * @param {Zone} zone
 * @return {number}
 */function guessOffsetForZone(zone){if(zoneOffsetTs===undefined){zoneOffsetTs=Settings.now();}// Do not cache anything but IANA zones, because it is not safe to do so.
// Guessing an offset which is not present in the zone can cause wrong results from fixOffset
if(zone.type!=="iana"){return zone.offset(zoneOffsetTs);}const zoneName=zone.name;let offsetGuess=zoneOffsetGuessCache.get(zoneName);if(offsetGuess===undefined){offsetGuess=zone.offset(zoneOffsetTs);zoneOffsetGuessCache.set(zoneName,offsetGuess);}return offsetGuess;}// this is a dumbed down version of fromObject() that runs about 60% faster
// but doesn't do any validation, makes a bunch of assumptions about what units
// are present, and so on.
function quickDT(obj,opts){const zone=normalizeZone(opts.zone,Settings.defaultZone);if(!zone.isValid){return DateTime$1.invalid(unsupportedZone(zone));}const loc=Locale.fromObject(opts);let ts,o;// assume we have the higher-order units
if(!isUndefined(obj.year)){for(const u of orderedUnits){if(isUndefined(obj[u])){obj[u]=defaultUnitValues[u];}}const invalid=hasInvalidGregorianData(obj)||hasInvalidTimeData(obj);if(invalid){return DateTime$1.invalid(invalid);}const offsetProvis=guessOffsetForZone(zone);[ts,o]=objToTS(obj,offsetProvis,zone);}else{ts=Settings.now();}return new DateTime$1({ts,zone,loc,o});}function diffRelative(start,end,opts){const round=isUndefined(opts.round)?true:opts.round,format=(c,unit)=>{c=roundTo(c,round||opts.calendary?0:2,true);const formatter=end.loc.clone(opts).relFormatter(opts);return formatter.format(c,unit);},differ=unit=>{if(opts.calendary){if(!end.hasSame(start,unit)){return end.startOf(unit).diff(start.startOf(unit),unit).get(unit);}else return 0;}else{return end.diff(start,unit).get(unit);}};if(opts.unit){return format(differ(opts.unit),opts.unit);}for(const unit of opts.units){const count=differ(unit);if(Math.abs(count)>=1){return format(count,unit);}}return format(start>end?-0:0,opts.units[opts.units.length-1]);}function lastOpts(argList){let opts={},args;if(argList.length>0&&typeof argList[argList.length-1]==="object"){opts=argList[argList.length-1];args=Array.from(argList).slice(0,argList.length-1);}else{args=Array.from(argList);}return[opts,args];}/**
 * Timestamp to use for cached zone offset guesses (exposed for test)
 */let zoneOffsetTs;/**
 * Cache for zone offset guesses (exposed for test).
 *
 * This optimizes quickDT via guessOffsetForZone to avoid repeated calls of
 * zone.offset().
 */const zoneOffsetGuessCache=new Map();/**
 * A DateTime is an immutable data structure representing a specific date and time and accompanying methods. It contains class and instance methods for creating, parsing, interrogating, transforming, and formatting them.
 *
 * A DateTime comprises of:
 * * A timestamp. Each DateTime instance refers to a specific millisecond of the Unix epoch.
 * * A time zone. Each instance is considered in the context of a specific zone (by default the local system's zone).
 * * Configuration properties that effect how output strings are formatted, such as `locale`, `numberingSystem`, and `outputCalendar`.
 *
 * Here is a brief overview of the most commonly used functionality it provides:
 *
 * * **Creation**: To create a DateTime from its components, use one of its factory class methods: {@link DateTime.local}, {@link DateTime.utc}, and (most flexibly) {@link DateTime.fromObject}. To create one from a standard string format, use {@link DateTime.fromISO}, {@link DateTime.fromHTTP}, and {@link DateTime.fromRFC2822}. To create one from a custom string format, use {@link DateTime.fromFormat}. To create one from a native JS date, use {@link DateTime.fromJSDate}.
 * * **Gregorian calendar and time**: To examine the Gregorian properties of a DateTime individually (i.e as opposed to collectively through {@link DateTime#toObject}), use the {@link DateTime#year}, {@link DateTime#month},
 * {@link DateTime#day}, {@link DateTime#hour}, {@link DateTime#minute}, {@link DateTime#second}, {@link DateTime#millisecond} accessors.
 * * **Week calendar**: For ISO week calendar attributes, see the {@link DateTime#weekYear}, {@link DateTime#weekNumber}, and {@link DateTime#weekday} accessors.
 * * **Configuration** See the {@link DateTime#locale} and {@link DateTime#numberingSystem} accessors.
 * * **Transformation**: To transform the DateTime into other DateTimes, use {@link DateTime#set}, {@link DateTime#reconfigure}, {@link DateTime#setZone}, {@link DateTime#setLocale}, {@link DateTime.plus}, {@link DateTime#minus}, {@link DateTime#endOf}, {@link DateTime#startOf}, {@link DateTime#toUTC}, and {@link DateTime#toLocal}.
 * * **Output**: To convert the DateTime to other representations, use the {@link DateTime#toRelative}, {@link DateTime#toRelativeCalendar}, {@link DateTime#toJSON}, {@link DateTime#toISO}, {@link DateTime#toHTTP}, {@link DateTime#toObject}, {@link DateTime#toRFC2822}, {@link DateTime#toString}, {@link DateTime#toLocaleString}, {@link DateTime#toFormat}, {@link DateTime#toMillis} and {@link DateTime#toJSDate}.
 *
 * There's plenty others documented below. In addition, for more information on subtler topics like internationalization, time zones, alternative calendars, validity, and so on, see the external documentation.
 */let DateTime$1=class DateTime{/**
   * @access private
   */constructor(config){const zone=config.zone||Settings.defaultZone;let invalid=config.invalid||(Number.isNaN(config.ts)?new Invalid("invalid input"):null)||(!zone.isValid?unsupportedZone(zone):null);/**
     * @access private
     */this.ts=isUndefined(config.ts)?Settings.now():config.ts;let c=null,o=null;if(!invalid){const unchanged=config.old&&config.old.ts===this.ts&&config.old.zone.equals(zone);if(unchanged){[c,o]=[config.old.c,config.old.o];}else{// If an offset has been passed and we have not been called from
// clone(), we can trust it and avoid the offset calculation.
const ot=isNumber$1(config.o)&&!config.old?config.o:zone.offset(this.ts);c=tsToObj(this.ts,ot);invalid=Number.isNaN(c.year)?new Invalid("invalid input"):null;c=invalid?null:c;o=invalid?null:ot;}}/**
     * @access private
     */this._zone=zone;/**
     * @access private
     */this.loc=config.loc||Locale.create();/**
     * @access private
     */this.invalid=invalid;/**
     * @access private
     */this.weekData=null;/**
     * @access private
     */this.localWeekData=null;/**
     * @access private
     */this.c=c;/**
     * @access private
     */this.o=o;/**
     * @access private
     */this.isLuxonDateTime=true;}// CONSTRUCT
/**
   * Create a DateTime for the current instant, in the system's time zone.
   *
   * Use Settings to override these default values if needed.
   * @example DateTime.now().toISO() //~> now in the ISO format
   * @return {DateTime}
   */static now(){return new DateTime({});}/**
   * Create a local DateTime
   * @param {number} [year] - The calendar year. If omitted (as in, call `local()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month, 1-indexed
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
   * @example DateTime.local()                                  //~> now
   * @example DateTime.local({ zone: "America/New_York" })      //~> now, in US east coast time
   * @example DateTime.local(2017)                              //~> 2017-01-01T00:00:00
   * @example DateTime.local(2017, 3)                           //~> 2017-03-01T00:00:00
   * @example DateTime.local(2017, 3, 12, { locale: "fr" })     //~> 2017-03-12T00:00:00, with a French locale
   * @example DateTime.local(2017, 3, 12, 5)                    //~> 2017-03-12T05:00:00
   * @example DateTime.local(2017, 3, 12, 5, { zone: "utc" })   //~> 2017-03-12T05:00:00, in UTC
   * @example DateTime.local(2017, 3, 12, 5, 45)                //~> 2017-03-12T05:45:00
   * @example DateTime.local(2017, 3, 12, 5, 45, 10)            //~> 2017-03-12T05:45:10
   * @example DateTime.local(2017, 3, 12, 5, 45, 10, 765)       //~> 2017-03-12T05:45:10.765
   * @return {DateTime}
   */static local(){const[opts,args]=lastOpts(arguments),[year,month,day,hour,minute,second,millisecond]=args;return quickDT({year,month,day,hour,minute,second,millisecond},opts);}/**
   * Create a DateTime in UTC
   * @param {number} [year] - The calendar year. If omitted (as in, call `utc()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
   * @param {Object} options - configuration options for the DateTime
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
   * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
   * @param {string} [options.weekSettings] - the week settings to set on the resulting DateTime instance
   * @example DateTime.utc()                                              //~> now
   * @example DateTime.utc(2017)                                          //~> 2017-01-01T00:00:00Z
   * @example DateTime.utc(2017, 3)                                       //~> 2017-03-01T00:00:00Z
   * @example DateTime.utc(2017, 3, 12)                                   //~> 2017-03-12T00:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5)                                //~> 2017-03-12T05:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45)                            //~> 2017-03-12T05:45:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, { locale: "fr" })          //~> 2017-03-12T05:45:00Z with a French locale
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10)                        //~> 2017-03-12T05:45:10Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10, 765, { locale: "fr" }) //~> 2017-03-12T05:45:10.765Z with a French locale
   * @return {DateTime}
   */static utc(){const[opts,args]=lastOpts(arguments),[year,month,day,hour,minute,second,millisecond]=args;opts.zone=FixedOffsetZone.utcInstance;return quickDT({year,month,day,hour,minute,second,millisecond},opts);}/**
   * Create a DateTime from a JavaScript Date object. Uses the default zone.
   * @param {Date} date - a JavaScript Date object
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @return {DateTime}
   */static fromJSDate(date,options={}){const ts=isDate(date)?date.valueOf():NaN;if(Number.isNaN(ts)){return DateTime.invalid("invalid input");}const zoneToUse=normalizeZone(options.zone,Settings.defaultZone);if(!zoneToUse.isValid){return DateTime.invalid(unsupportedZone(zoneToUse));}return new DateTime({ts:ts,zone:zoneToUse,loc:Locale.fromObject(options)});}/**
   * Create a DateTime from a number of milliseconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
   * @param {number} milliseconds - a number of milliseconds since 1970 UTC
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} options.weekSettings - the week settings to set on the resulting DateTime instance
   * @return {DateTime}
   */static fromMillis(milliseconds,options={}){if(!isNumber$1(milliseconds)){throw new InvalidArgumentError(`fromMillis requires a numerical input, but received a ${typeof milliseconds} with value ${milliseconds}`);}else if(milliseconds<-MAX_DATE$1||milliseconds>MAX_DATE$1){// this isn't perfect because we can still end up out of range because of additional shifting, but it's a start
return DateTime.invalid("Timestamp out of range");}else{return new DateTime({ts:milliseconds,zone:normalizeZone(options.zone,Settings.defaultZone),loc:Locale.fromObject(options)});}}/**
   * Create a DateTime from a number of seconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
   * @param {number} seconds - a number of seconds since 1970 UTC
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} options.weekSettings - the week settings to set on the resulting DateTime instance
   * @return {DateTime}
   */static fromSeconds(seconds,options={}){if(!isNumber$1(seconds)){throw new InvalidArgumentError("fromSeconds requires a numerical input");}else{return new DateTime({ts:seconds*1000,zone:normalizeZone(options.zone,Settings.defaultZone),loc:Locale.fromObject(options)});}}/**
   * Create a DateTime from a JavaScript object with keys like 'year' and 'hour' with reasonable defaults.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.year - a year, such as 1987
   * @param {number} obj.month - a month, 1-12
   * @param {number} obj.day - a day of the month, 1-31, depending on the month
   * @param {number} obj.ordinal - day of the year, 1-365 or 366
   * @param {number} obj.weekYear - an ISO week year
   * @param {number} obj.weekNumber - an ISO week number, between 1 and 52 or 53, depending on the year
   * @param {number} obj.weekday - an ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
   * @param {number} obj.localWeekYear - a week year, according to the locale
   * @param {number} obj.localWeekNumber - a week number, between 1 and 52 or 53, depending on the year, according to the locale
   * @param {number} obj.localWeekday - a weekday, 1-7, where 1 is the first and 7 is the last day of the week, according to the locale
   * @param {number} obj.hour - hour of the day, 0-23
   * @param {number} obj.minute - minute of the hour, 0-59
   * @param {number} obj.second - second of the minute, 0-59
   * @param {number} obj.millisecond - millisecond of the second, 0-999
   * @param {Object} opts - options for creating this DateTime
   * @param {string|Zone} [opts.zone='local'] - interpret the numbers in the context of a particular zone. Can take any value taken as the first argument to setZone()
   * @param {string} [opts.locale='system\'s locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromObject({ year: 1982, month: 5, day: 25}).toISODate() //=> '1982-05-25'
   * @example DateTime.fromObject({ year: 1982 }).toISODate() //=> '1982-01-01'
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }) //~> today at 10:26:06
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'utc' }),
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'local' })
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'America/New_York' })
   * @example DateTime.fromObject({ weekYear: 2016, weekNumber: 2, weekday: 3 }).toISODate() //=> '2016-01-13'
   * @example DateTime.fromObject({ localWeekYear: 2022, localWeekNumber: 1, localWeekday: 1 }, { locale: "en-US" }).toISODate() //=> '2021-12-26'
   * @return {DateTime}
   */static fromObject(obj,opts={}){obj=obj||{};const zoneToUse=normalizeZone(opts.zone,Settings.defaultZone);if(!zoneToUse.isValid){return DateTime.invalid(unsupportedZone(zoneToUse));}const loc=Locale.fromObject(opts);const normalized=normalizeObject(obj,normalizeUnitWithLocalWeeks);const{minDaysInFirstWeek,startOfWeek}=usesLocalWeekValues(normalized,loc);const tsNow=Settings.now(),offsetProvis=!isUndefined(opts.specificOffset)?opts.specificOffset:zoneToUse.offset(tsNow),containsOrdinal=!isUndefined(normalized.ordinal),containsGregorYear=!isUndefined(normalized.year),containsGregorMD=!isUndefined(normalized.month)||!isUndefined(normalized.day),containsGregor=containsGregorYear||containsGregorMD,definiteWeekDef=normalized.weekYear||normalized.weekNumber;// cases:
// just a weekday -> this week's instance of that weekday, no worries
// (gregorian data or ordinal) + (weekYear or weekNumber) -> error
// (gregorian month or day) + ordinal -> error
// otherwise just use weeks or ordinals or gregorian, depending on what's specified
if((containsGregor||containsOrdinal)&&definiteWeekDef){throw new ConflictingSpecificationError("Can't mix weekYear/weekNumber units with year/month/day or ordinals");}if(containsGregorMD&&containsOrdinal){throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");}const useWeekData=definiteWeekDef||normalized.weekday&&!containsGregor;// configure ourselves to deal with gregorian dates or week stuff
let units,defaultValues,objNow=tsToObj(tsNow,offsetProvis);if(useWeekData){units=orderedWeekUnits;defaultValues=defaultWeekUnitValues;objNow=gregorianToWeek(objNow,minDaysInFirstWeek,startOfWeek);}else if(containsOrdinal){units=orderedOrdinalUnits;defaultValues=defaultOrdinalUnitValues;objNow=gregorianToOrdinal(objNow);}else{units=orderedUnits;defaultValues=defaultUnitValues;}// set default values for missing stuff
let foundFirst=false;for(const u of units){const v=normalized[u];if(!isUndefined(v)){foundFirst=true;}else if(foundFirst){normalized[u]=defaultValues[u];}else{normalized[u]=objNow[u];}}// make sure the values we have are in range
const higherOrderInvalid=useWeekData?hasInvalidWeekData(normalized,minDaysInFirstWeek,startOfWeek):containsOrdinal?hasInvalidOrdinalData(normalized):hasInvalidGregorianData(normalized),invalid=higherOrderInvalid||hasInvalidTimeData(normalized);if(invalid){return DateTime.invalid(invalid);}// compute the actual time
const gregorian=useWeekData?weekToGregorian(normalized,minDaysInFirstWeek,startOfWeek):containsOrdinal?ordinalToGregorian(normalized):normalized,[tsFinal,offsetFinal]=objToTS(gregorian,offsetProvis,zoneToUse),inst=new DateTime({ts:tsFinal,zone:zoneToUse,o:offsetFinal,loc});// gregorian data + weekday serves only to validate
if(normalized.weekday&&containsGregor&&obj.weekday!==inst.weekday){return DateTime.invalid("mismatched weekday",`you can't specify both a weekday of ${normalized.weekday} and a date of ${inst.toISO()}`);}if(!inst.isValid){return DateTime.invalid(inst.invalid);}return inst;}/**
   * Create a DateTime from an ISO 8601 string
   * @param {string} text - the ISO string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the time to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} [opts.outputCalendar] - the output calendar to set on the resulting DateTime instance
   * @param {string} [opts.numberingSystem] - the numbering system to set on the resulting DateTime instance
   * @param {string} [opts.weekSettings] - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromISO('2016-05-25T09:08:34.123')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00', {setZone: true})
   * @example DateTime.fromISO('2016-05-25T09:08:34.123', {zone: 'utc'})
   * @example DateTime.fromISO('2016-W05-4')
   * @return {DateTime}
   */static fromISO(text,opts={}){const[vals,parsedZone]=parseISODate(text);return parseDataToDateTime(vals,parsedZone,opts,"ISO 8601",text);}/**
   * Create a DateTime from an RFC 2822 string
   * @param {string} text - the RFC 2822 string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since the offset is always specified in the string itself, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23:12 GMT')
   * @example DateTime.fromRFC2822('Fri, 25 Nov 2016 13:23:12 +0600')
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23 Z')
   * @return {DateTime}
   */static fromRFC2822(text,opts={}){const[vals,parsedZone]=parseRFC2822Date(text);return parseDataToDateTime(vals,parsedZone,opts,"RFC 2822",text);}/**
   * Create a DateTime from an HTTP header date
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @param {string} text - the HTTP header date
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since HTTP dates are always in UTC, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [opts.setZone=false] - override the zone with the fixed-offset zone specified in the string. For HTTP dates, this is always UTC, so this option is equivalent to setting the `zone` option to 'utc', but this option is included for consistency with similar methods.
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromHTTP('Sun, 06 Nov 1994 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sunday, 06-Nov-94 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sun Nov  6 08:49:37 1994')
   * @return {DateTime}
   */static fromHTTP(text,opts={}){const[vals,parsedZone]=parseHTTPDate(text);return parseDataToDateTime(vals,parsedZone,opts,"HTTP",opts);}/**
   * Create a DateTime from an input string and format string.
   * Defaults to en-US if no locale has been specified, regardless of the system's locale. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/parsing?id=table-of-tokens).
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see the link below for the formats)
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @return {DateTime}
   */static fromFormat(text,fmt,opts={}){if(isUndefined(text)||isUndefined(fmt)){throw new InvalidArgumentError("fromFormat requires an input string and a format");}const{locale=null,numberingSystem=null}=opts,localeToUse=Locale.fromOpts({locale,numberingSystem,defaultToEN:true}),[vals,parsedZone,specificOffset,invalid]=parseFromTokens(localeToUse,text,fmt);if(invalid){return DateTime.invalid(invalid);}else{return parseDataToDateTime(vals,parsedZone,opts,`format ${fmt}`,text,specificOffset);}}/**
   * @deprecated use fromFormat instead
   */static fromString(text,fmt,opts={}){return DateTime.fromFormat(text,fmt,opts);}/**
   * Create a DateTime from a SQL date, time, or datetime
   * Defaults to en-US if no locale has been specified, regardless of the system's locale
   * @param {string} text - the string to parse
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @example DateTime.fromSQL('2017-05-15')
   * @example DateTime.fromSQL('2017-05-15 09:12:34')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342+06:00')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles', { setZone: true })
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342', { zone: 'America/Los_Angeles' })
   * @example DateTime.fromSQL('09:12:34.342')
   * @return {DateTime}
   */static fromSQL(text,opts={}){const[vals,parsedZone]=parseSQL(text);return parseDataToDateTime(vals,parsedZone,opts,"SQL",text);}/**
   * Create an invalid DateTime.
   * @param {string} reason - simple string of why this DateTime is invalid. Should not contain parameters or anything else data-dependent.
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {DateTime}
   */static invalid(reason,explanation=null){if(!reason){throw new InvalidArgumentError("need to specify a reason the DateTime is invalid");}const invalid=reason instanceof Invalid?reason:new Invalid(reason,explanation);if(Settings.throwOnInvalid){throw new InvalidDateTimeError(invalid);}else{return new DateTime({invalid});}}/**
   * Check if an object is an instance of DateTime. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */static isDateTime(o){return o&&o.isLuxonDateTime||false;}/**
   * Produce the format string for a set of options
   * @param formatOpts
   * @param localeOpts
   * @returns {string}
   */static parseFormatForOpts(formatOpts,localeOpts={}){const tokenList=formatOptsToTokens(formatOpts,Locale.fromObject(localeOpts));return!tokenList?null:tokenList.map(t=>t?t.val:null).join("");}/**
   * Produce the the fully expanded format token for the locale
   * Does NOT quote characters, so quoted tokens will not round trip correctly
   * @param fmt
   * @param localeOpts
   * @returns {string}
   */static expandFormat(fmt,localeOpts={}){const expanded=expandMacroTokens(Formatter.parseFormat(fmt),Locale.fromObject(localeOpts));return expanded.map(t=>t.val).join("");}static resetCache(){zoneOffsetTs=undefined;zoneOffsetGuessCache.clear();}// INFO
/**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example DateTime.local(2017, 7, 4).get('month'); //=> 7
   * @example DateTime.local(2017, 7, 4).get('day'); //=> 4
   * @return {number}
   */get(unit){return this[unit];}/**
   * Returns whether the DateTime is valid. Invalid DateTimes occur when:
   * * The DateTime was created from invalid calendar information, such as the 13th month or February 30
   * * The DateTime was created by an operation on another invalid date
   * @type {boolean}
   */get isValid(){return this.invalid===null;}/**
   * Returns an error code if this DateTime is invalid, or null if the DateTime is valid
   * @type {string}
   */get invalidReason(){return this.invalid?this.invalid.reason:null;}/**
   * Returns an explanation of why this DateTime became invalid, or null if the DateTime is valid
   * @type {string}
   */get invalidExplanation(){return this.invalid?this.invalid.explanation:null;}/**
   * Get the locale of a DateTime, such 'en-GB'. The locale is used when formatting the DateTime
   *
   * @type {string}
   */get locale(){return this.isValid?this.loc.locale:null;}/**
   * Get the numbering system of a DateTime, such 'beng'. The numbering system is used when formatting the DateTime
   *
   * @type {string}
   */get numberingSystem(){return this.isValid?this.loc.numberingSystem:null;}/**
   * Get the output calendar of a DateTime, such 'islamic'. The output calendar is used when formatting the DateTime
   *
   * @type {string}
   */get outputCalendar(){return this.isValid?this.loc.outputCalendar:null;}/**
   * Get the time zone associated with this DateTime.
   * @type {Zone}
   */get zone(){return this._zone;}/**
   * Get the name of the time zone.
   * @type {string}
   */get zoneName(){return this.isValid?this.zone.name:null;}/**
   * Get the year
   * @example DateTime.local(2017, 5, 25).year //=> 2017
   * @type {number}
   */get year(){return this.isValid?this.c.year:NaN;}/**
   * Get the quarter
   * @example DateTime.local(2017, 5, 25).quarter //=> 2
   * @type {number}
   */get quarter(){return this.isValid?Math.ceil(this.c.month/3):NaN;}/**
   * Get the month (1-12).
   * @example DateTime.local(2017, 5, 25).month //=> 5
   * @type {number}
   */get month(){return this.isValid?this.c.month:NaN;}/**
   * Get the day of the month (1-30ish).
   * @example DateTime.local(2017, 5, 25).day //=> 25
   * @type {number}
   */get day(){return this.isValid?this.c.day:NaN;}/**
   * Get the hour of the day (0-23).
   * @example DateTime.local(2017, 5, 25, 9).hour //=> 9
   * @type {number}
   */get hour(){return this.isValid?this.c.hour:NaN;}/**
   * Get the minute of the hour (0-59).
   * @example DateTime.local(2017, 5, 25, 9, 30).minute //=> 30
   * @type {number}
   */get minute(){return this.isValid?this.c.minute:NaN;}/**
   * Get the second of the minute (0-59).
   * @example DateTime.local(2017, 5, 25, 9, 30, 52).second //=> 52
   * @type {number}
   */get second(){return this.isValid?this.c.second:NaN;}/**
   * Get the millisecond of the second (0-999).
   * @example DateTime.local(2017, 5, 25, 9, 30, 52, 654).millisecond //=> 654
   * @type {number}
   */get millisecond(){return this.isValid?this.c.millisecond:NaN;}/**
   * Get the week year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 12, 31).weekYear //=> 2015
   * @type {number}
   */get weekYear(){return this.isValid?possiblyCachedWeekData(this).weekYear:NaN;}/**
   * Get the week number of the week year (1-52ish).
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2017, 5, 25).weekNumber //=> 21
   * @type {number}
   */get weekNumber(){return this.isValid?possiblyCachedWeekData(this).weekNumber:NaN;}/**
   * Get the day of the week.
   * 1 is Monday and 7 is Sunday
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 11, 31).weekday //=> 4
   * @type {number}
   */get weekday(){return this.isValid?possiblyCachedWeekData(this).weekday:NaN;}/**
   * Returns true if this date is on a weekend according to the locale, false otherwise
   * @returns {boolean}
   */get isWeekend(){return this.isValid&&this.loc.getWeekendDays().includes(this.weekday);}/**
   * Get the day of the week according to the locale.
   * 1 is the first day of the week and 7 is the last day of the week.
   * If the locale assigns Sunday as the first day of the week, then a date which is a Sunday will return 1,
   * @returns {number}
   */get localWeekday(){return this.isValid?possiblyCachedLocalWeekData(this).weekday:NaN;}/**
   * Get the week number of the week year according to the locale. Different locales assign week numbers differently,
   * because the week can start on different days of the week (see localWeekday) and because a different number of days
   * is required for a week to count as the first week of a year.
   * @returns {number}
   */get localWeekNumber(){return this.isValid?possiblyCachedLocalWeekData(this).weekNumber:NaN;}/**
   * Get the week year according to the locale. Different locales assign week numbers (and therefor week years)
   * differently, see localWeekNumber.
   * @returns {number}
   */get localWeekYear(){return this.isValid?possiblyCachedLocalWeekData(this).weekYear:NaN;}/**
   * Get the ordinal (meaning the day of the year)
   * @example DateTime.local(2017, 5, 25).ordinal //=> 145
   * @type {number|DateTime}
   */get ordinal(){return this.isValid?gregorianToOrdinal(this.c).ordinal:NaN;}/**
   * Get the human readable short month name, such as 'Oct'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).monthShort //=> Oct
   * @type {string}
   */get monthShort(){return this.isValid?Info.months("short",{locObj:this.loc})[this.month-1]:null;}/**
   * Get the human readable long month name, such as 'October'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).monthLong //=> October
   * @type {string}
   */get monthLong(){return this.isValid?Info.months("long",{locObj:this.loc})[this.month-1]:null;}/**
   * Get the human readable short weekday, such as 'Mon'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).weekdayShort //=> Mon
   * @type {string}
   */get weekdayShort(){return this.isValid?Info.weekdays("short",{locObj:this.loc})[this.weekday-1]:null;}/**
   * Get the human readable long weekday, such as 'Monday'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).weekdayLong //=> Monday
   * @type {string}
   */get weekdayLong(){return this.isValid?Info.weekdays("long",{locObj:this.loc})[this.weekday-1]:null;}/**
   * Get the UTC offset of this DateTime in minutes
   * @example DateTime.now().offset //=> -240
   * @example DateTime.utc().offset //=> 0
   * @type {number}
   */get offset(){return this.isValid?+this.o:NaN;}/**
   * Get the short human name for the zone's current offset, for example "EST" or "EDT".
   * Defaults to the system's locale if no locale has been specified
   * @type {string}
   */get offsetNameShort(){if(this.isValid){return this.zone.offsetName(this.ts,{format:"short",locale:this.locale});}else{return null;}}/**
   * Get the long human name for the zone's current offset, for example "Eastern Standard Time" or "Eastern Daylight Time".
   * Defaults to the system's locale if no locale has been specified
   * @type {string}
   */get offsetNameLong(){if(this.isValid){return this.zone.offsetName(this.ts,{format:"long",locale:this.locale});}else{return null;}}/**
   * Get whether this zone's offset ever changes, as in a DST.
   * @type {boolean}
   */get isOffsetFixed(){return this.isValid?this.zone.isUniversal:null;}/**
   * Get whether the DateTime is in a DST.
   * @type {boolean}
   */get isInDST(){if(this.isOffsetFixed){return false;}else{return this.offset>this.set({month:1,day:1}).offset||this.offset>this.set({month:5}).offset;}}/**
   * Get those DateTimes which have the same local time as this DateTime, but a different offset from UTC
   * in this DateTime's zone. During DST changes local time can be ambiguous, for example
   * `2023-10-29T02:30:00` in `Europe/Berlin` can have offset `+01:00` or `+02:00`.
   * This method will return both possible DateTimes if this DateTime's local time is ambiguous.
   * @returns {DateTime[]}
   */getPossibleOffsets(){if(!this.isValid||this.isOffsetFixed){return[this];}const dayMs=86400000;const minuteMs=60000;const localTS=objToLocalTS(this.c);const oEarlier=this.zone.offset(localTS-dayMs);const oLater=this.zone.offset(localTS+dayMs);const o1=this.zone.offset(localTS-oEarlier*minuteMs);const o2=this.zone.offset(localTS-oLater*minuteMs);if(o1===o2){return[this];}const ts1=localTS-o1*minuteMs;const ts2=localTS-o2*minuteMs;const c1=tsToObj(ts1,o1);const c2=tsToObj(ts2,o2);if(c1.hour===c2.hour&&c1.minute===c2.minute&&c1.second===c2.second&&c1.millisecond===c2.millisecond){return[clone$1(this,{ts:ts1}),clone$1(this,{ts:ts2})];}return[this];}/**
   * Returns true if this DateTime is in a leap year, false otherwise
   * @example DateTime.local(2016).isInLeapYear //=> true
   * @example DateTime.local(2013).isInLeapYear //=> false
   * @type {boolean}
   */get isInLeapYear(){return isLeapYear(this.year);}/**
   * Returns the number of days in this DateTime's month
   * @example DateTime.local(2016, 2).daysInMonth //=> 29
   * @example DateTime.local(2016, 3).daysInMonth //=> 31
   * @type {number}
   */get daysInMonth(){return daysInMonth(this.year,this.month);}/**
   * Returns the number of days in this DateTime's year
   * @example DateTime.local(2016).daysInYear //=> 366
   * @example DateTime.local(2013).daysInYear //=> 365
   * @type {number}
   */get daysInYear(){return this.isValid?daysInYear(this.year):NaN;}/**
   * Returns the number of weeks in this DateTime's year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2004).weeksInWeekYear //=> 53
   * @example DateTime.local(2013).weeksInWeekYear //=> 52
   * @type {number}
   */get weeksInWeekYear(){return this.isValid?weeksInWeekYear(this.weekYear):NaN;}/**
   * Returns the number of weeks in this DateTime's local week year
   * @example DateTime.local(2020, 6, {locale: 'en-US'}).weeksInLocalWeekYear //=> 52
   * @example DateTime.local(2020, 6, {locale: 'de-DE'}).weeksInLocalWeekYear //=> 53
   * @type {number}
   */get weeksInLocalWeekYear(){return this.isValid?weeksInWeekYear(this.localWeekYear,this.loc.getMinDaysInFirstWeek(),this.loc.getStartOfWeek()):NaN;}/**
   * Returns the resolved Intl options for this DateTime.
   * This is useful in understanding the behavior of formatting methods
   * @param {Object} opts - the same options as toLocaleString
   * @return {Object}
   */resolvedLocaleOptions(opts={}){const{locale,numberingSystem,calendar}=Formatter.create(this.loc.clone(opts),opts).resolvedOptions(this);return{locale,numberingSystem,outputCalendar:calendar};}// TRANSFORM
/**
   * "Set" the DateTime's zone to UTC. Returns a newly-constructed DateTime.
   *
   * Equivalent to {@link DateTime#setZone}('utc')
   * @param {number} [offset=0] - optionally, an offset from UTC in minutes
   * @param {Object} [opts={}] - options to pass to `setZone()`
   * @return {DateTime}
   */toUTC(offset=0,opts={}){return this.setZone(FixedOffsetZone.instance(offset),opts);}/**
   * "Set" the DateTime's zone to the host's local zone. Returns a newly-constructed DateTime.
   *
   * Equivalent to `setZone('local')`
   * @return {DateTime}
   */toLocal(){return this.setZone(Settings.defaultZone);}/**
   * "Set" the DateTime's zone to specified zone. Returns a newly-constructed DateTime.
   *
   * By default, the setter keeps the underlying time the same (as in, the same timestamp), but the new instance will report different local times and consider DSTs when making computations, as with {@link DateTime#plus}. You may wish to use {@link DateTime#toLocal} and {@link DateTime#toUTC} which provide simple convenience wrappers for commonly used zones.
   * @param {string|Zone} [zone='local'] - a zone identifier. As a string, that can be any IANA zone supported by the host environment, or a fixed-offset name of the form 'UTC+3', or the strings 'local' or 'utc'. You may also supply an instance of a {@link DateTime#Zone} class.
   * @param {Object} opts - options
   * @param {boolean} [opts.keepLocalTime=false] - If true, adjust the underlying time so that the local time stays the same, but in the target zone. You should rarely need this.
   * @return {DateTime}
   */setZone(zone,{keepLocalTime=false,keepCalendarTime=false}={}){zone=normalizeZone(zone,Settings.defaultZone);if(zone.equals(this.zone)){return this;}else if(!zone.isValid){return DateTime.invalid(unsupportedZone(zone));}else{let newTS=this.ts;if(keepLocalTime||keepCalendarTime){const offsetGuess=zone.offset(this.ts);const asObj=this.toObject();[newTS]=objToTS(asObj,offsetGuess,zone);}return clone$1(this,{ts:newTS,zone});}}/**
   * "Set" the locale, numberingSystem, or outputCalendar. Returns a newly-constructed DateTime.
   * @param {Object} properties - the properties to set
   * @example DateTime.local(2017, 5, 25).reconfigure({ locale: 'en-GB' })
   * @return {DateTime}
   */reconfigure({locale,numberingSystem,outputCalendar}={}){const loc=this.loc.clone({locale,numberingSystem,outputCalendar});return clone$1(this,{loc});}/**
   * "Set" the locale. Returns a newly-constructed DateTime.
   * Just a convenient alias for reconfigure({ locale })
   * @example DateTime.local(2017, 5, 25).setLocale('en-GB')
   * @return {DateTime}
   */setLocale(locale){return this.reconfigure({locale});}/**
   * "Set" the values of specified units. Returns a newly-constructed DateTime.
   * You can only set units with this method; for "setting" metadata, see {@link DateTime#reconfigure} and {@link DateTime#setZone}.
   *
   * This method also supports setting locale-based week units, i.e. `localWeekday`, `localWeekNumber` and `localWeekYear`.
   * They cannot be mixed with ISO-week units like `weekday`.
   * @param {Object} values - a mapping of units to numbers
   * @example dt.set({ year: 2017 })
   * @example dt.set({ hour: 8, minute: 30 })
   * @example dt.set({ weekday: 5 })
   * @example dt.set({ year: 2005, ordinal: 234 })
   * @return {DateTime}
   */set(values){if(!this.isValid)return this;const normalized=normalizeObject(values,normalizeUnitWithLocalWeeks);const{minDaysInFirstWeek,startOfWeek}=usesLocalWeekValues(normalized,this.loc);const settingWeekStuff=!isUndefined(normalized.weekYear)||!isUndefined(normalized.weekNumber)||!isUndefined(normalized.weekday),containsOrdinal=!isUndefined(normalized.ordinal),containsGregorYear=!isUndefined(normalized.year),containsGregorMD=!isUndefined(normalized.month)||!isUndefined(normalized.day),containsGregor=containsGregorYear||containsGregorMD,definiteWeekDef=normalized.weekYear||normalized.weekNumber;if((containsGregor||containsOrdinal)&&definiteWeekDef){throw new ConflictingSpecificationError("Can't mix weekYear/weekNumber units with year/month/day or ordinals");}if(containsGregorMD&&containsOrdinal){throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");}let mixed;if(settingWeekStuff){mixed=weekToGregorian(_objectSpread(_objectSpread({},gregorianToWeek(this.c,minDaysInFirstWeek,startOfWeek)),normalized),minDaysInFirstWeek,startOfWeek);}else if(!isUndefined(normalized.ordinal)){mixed=ordinalToGregorian(_objectSpread(_objectSpread({},gregorianToOrdinal(this.c)),normalized));}else{mixed=_objectSpread(_objectSpread({},this.toObject()),normalized);// if we didn't set the day but we ended up on an overflow date,
// use the last day of the right month
if(isUndefined(normalized.day)){mixed.day=Math.min(daysInMonth(mixed.year,mixed.month),mixed.day);}}const[ts,o]=objToTS(mixed,this.o,this.zone);return clone$1(this,{ts,o});}/**
   * Add a period of time to this DateTime and return the resulting DateTime
   *
   * Adding hours, minutes, seconds, or milliseconds increases the timestamp by the right number of milliseconds. Adding days, months, or years shifts the calendar, accounting for DSTs and leap years along the way. Thus, `dt.plus({ hours: 24 })` may result in a different time than `dt.plus({ days: 1 })` if there's a DST shift in between.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @example DateTime.now().plus(123) //~> in 123 milliseconds
   * @example DateTime.now().plus({ minutes: 15 }) //~> in 15 minutes
   * @example DateTime.now().plus({ days: 1 }) //~> this time tomorrow
   * @example DateTime.now().plus({ days: -1 }) //~> this time yesterday
   * @example DateTime.now().plus({ hours: 3, minutes: 13 }) //~> in 3 hr, 13 min
   * @example DateTime.now().plus(Duration.fromObject({ hours: 3, minutes: 13 })) //~> in 3 hr, 13 min
   * @return {DateTime}
   */plus(duration){if(!this.isValid)return this;const dur=Duration.fromDurationLike(duration);return clone$1(this,adjustTime(this,dur));}/**
   * Subtract a period of time to this DateTime and return the resulting DateTime
   * See {@link DateTime#plus}
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   @return {DateTime}
   */minus(duration){if(!this.isValid)return this;const dur=Duration.fromDurationLike(duration).negate();return clone$1(this,adjustTime(this,dur));}/**
   * "Set" this DateTime to the beginning of a unit of time.
   * @param {string} unit - The unit to go to the beginning of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
   * @example DateTime.local(2014, 3, 3).startOf('month').toISODate(); //=> '2014-03-01'
   * @example DateTime.local(2014, 3, 3).startOf('year').toISODate(); //=> '2014-01-01'
   * @example DateTime.local(2014, 3, 3).startOf('week').toISODate(); //=> '2014-03-03', weeks always start on Mondays
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('day').toISOTime(); //=> '00:00.000-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('hour').toISOTime(); //=> '05:00:00.000-05:00'
   * @return {DateTime}
   */startOf(unit,{useLocaleWeeks=false}={}){if(!this.isValid)return this;const o={},normalizedUnit=Duration.normalizeUnit(unit);switch(normalizedUnit){case"years":o.month=1;// falls through
case"quarters":case"months":o.day=1;// falls through
case"weeks":case"days":o.hour=0;// falls through
case"hours":o.minute=0;// falls through
case"minutes":o.second=0;// falls through
case"seconds":o.millisecond=0;break;// no default, invalid units throw in normalizeUnit()
}if(normalizedUnit==="weeks"){if(useLocaleWeeks){const startOfWeek=this.loc.getStartOfWeek();const{weekday}=this;if(weekday<startOfWeek){o.weekNumber=this.weekNumber-1;}o.weekday=startOfWeek;}else{o.weekday=1;}}if(normalizedUnit==="quarters"){const q=Math.ceil(this.month/3);o.month=(q-1)*3+1;}return this.set(o);}/**
   * "Set" this DateTime to the end (meaning the last millisecond) of a unit of time
   * @param {string} unit - The unit to go to the end of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
   * @example DateTime.local(2014, 3, 3).endOf('month').toISO(); //=> '2014-03-31T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3).endOf('year').toISO(); //=> '2014-12-31T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3).endOf('week').toISO(); // => '2014-03-09T23:59:59.999-05:00', weeks start on Mondays
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('day').toISO(); //=> '2014-03-03T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('hour').toISO(); //=> '2014-03-03T05:59:59.999-05:00'
   * @return {DateTime}
   */endOf(unit,opts){return this.isValid?this.plus({[unit]:1}).startOf(unit,opts).minus(1):this;}// OUTPUT
/**
   * Returns a string representation of this DateTime formatted according to the specified format string.
   * **You may not want this.** See {@link DateTime#toLocaleString} for a more flexible formatting tool. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/formatting?id=table-of-tokens).
   * Defaults to en-US if no locale has been specified, regardless of the system's locale.
   * @param {string} fmt - the format string
   * @param {Object} opts - opts to override the configuration options on this DateTime
   * @example DateTime.now().toFormat('yyyy LLL dd') //=> '2017 Apr 22'
   * @example DateTime.now().setLocale('fr').toFormat('yyyy LLL dd') //=> '2017 avr. 22'
   * @example DateTime.now().toFormat('yyyy LLL dd', { locale: "fr" }) //=> '2017 avr. 22'
   * @example DateTime.now().toFormat("HH 'hours and' mm 'minutes'") //=> '20 hours and 55 minutes'
   * @return {string}
   */toFormat(fmt,opts={}){return this.isValid?Formatter.create(this.loc.redefaultToEN(opts)).formatDateTimeFromString(this,fmt):INVALID;}/**
   * Returns a localized string representing this date. Accepts the same options as the Intl.DateTimeFormat constructor and any presets defined by Luxon, such as `DateTime.DATE_FULL` or `DateTime.TIME_SIMPLE`.
   * The exact behavior of this method is browser-specific, but in general it will return an appropriate representation
   * of the DateTime in the assigned locale.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param formatOpts {Object} - Intl.DateTimeFormat constructor options and configuration options
   * @param {Object} opts - opts to override the configuration options on this DateTime
   * @example DateTime.now().toLocaleString(); //=> 4/20/2017
   * @example DateTime.now().setLocale('en-gb').toLocaleString(); //=> '20/04/2017'
   * @example DateTime.now().toLocaleString(DateTime.DATE_FULL); //=> 'April 20, 2017'
   * @example DateTime.now().toLocaleString(DateTime.DATE_FULL, { locale: 'fr' }); //=> '28 août 2022'
   * @example DateTime.now().toLocaleString(DateTime.TIME_SIMPLE); //=> '11:32 AM'
   * @example DateTime.now().toLocaleString(DateTime.DATETIME_SHORT); //=> '4/20/2017, 11:32 AM'
   * @example DateTime.now().toLocaleString({ weekday: 'long', month: 'long', day: '2-digit' }); //=> 'Thursday, April 20'
   * @example DateTime.now().toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> 'Thu, Apr 20, 11:27 AM'
   * @example DateTime.now().toLocaleString({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); //=> '11:32'
   * @return {string}
   */toLocaleString(formatOpts=DATE_SHORT,opts={}){return this.isValid?Formatter.create(this.loc.clone(opts),formatOpts).formatDateTime(this):INVALID;}/**
   * Returns an array of format "parts", meaning individual tokens along with metadata. This is allows callers to post-process individual sections of the formatted output.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
   * @param opts {Object} - Intl.DateTimeFormat constructor options, same as `toLocaleString`.
   * @example DateTime.now().toLocaleParts(); //=> [
   *                                   //=>   { type: 'day', value: '25' },
   *                                   //=>   { type: 'literal', value: '/' },
   *                                   //=>   { type: 'month', value: '05' },
   *                                   //=>   { type: 'literal', value: '/' },
   *                                   //=>   { type: 'year', value: '1982' }
   *                                   //=> ]
   */toLocaleParts(opts={}){return this.isValid?Formatter.create(this.loc.clone(opts),opts).formatDateTimeParts(this):[];}/**
   * Returns an ISO 8601-compliant string representation of this DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.extendedZone=false] - add the time zone format extension
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc(1983, 5, 25).toISO() //=> '1982-05-25T00:00:00.000Z'
   * @example DateTime.now().toISO() //=> '2017-04-22T20:47:05.335-04:00'
   * @example DateTime.now().toISO({ includeOffset: false }) //=> '2017-04-22T20:47:05.335'
   * @example DateTime.now().toISO({ format: 'basic' }) //=> '20170422T204705.335-0400'
   * @return {string|null}
   */toISO({format="extended",suppressSeconds=false,suppressMilliseconds=false,includeOffset=true,extendedZone=false}={}){if(!this.isValid){return null;}const ext=format==="extended";let c=toISODate(this,ext);c+="T";c+=toISOTime(this,ext,suppressSeconds,suppressMilliseconds,includeOffset,extendedZone);return c;}/**
   * Returns an ISO 8601-compliant string representation of this DateTime's date component
   * @param {Object} opts - options
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc(1982, 5, 25).toISODate() //=> '1982-05-25'
   * @example DateTime.utc(1982, 5, 25).toISODate({ format: 'basic' }) //=> '19820525'
   * @return {string|null}
   */toISODate({format="extended"}={}){if(!this.isValid){return null;}return toISODate(this,format==="extended");}/**
   * Returns an ISO 8601-compliant string representation of this DateTime's week date
   * @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
   * @return {string}
   */toISOWeekDate(){return toTechFormat(this,"kkkk-'W'WW-c");}/**
   * Returns an ISO 8601-compliant string representation of this DateTime's time component
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.extendedZone=true] - add the time zone format extension
   * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime() //=> '07:34:19.361Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34, seconds: 0, milliseconds: 0 }).toISOTime({ suppressSeconds: true }) //=> '07:34Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ format: 'basic' }) //=> '073419.361Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ includePrefix: true }) //=> 'T07:34:19.361Z'
   * @return {string}
   */toISOTime({suppressMilliseconds=false,suppressSeconds=false,includeOffset=true,includePrefix=false,extendedZone=false,format="extended"}={}){if(!this.isValid){return null;}let c=includePrefix?"T":"";return c+toISOTime(this,format==="extended",suppressSeconds,suppressMilliseconds,includeOffset,extendedZone);}/**
   * Returns an RFC 2822-compatible string representation of this DateTime
   * @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
   * @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
   * @return {string}
   */toRFC2822(){return toTechFormat(this,"EEE, dd LLL yyyy HH:mm:ss ZZZ",false);}/**
   * Returns a string representation of this DateTime appropriate for use in HTTP headers. The output is always expressed in GMT.
   * Specifically, the string conforms to RFC 1123.
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @example DateTime.utc(2014, 7, 13).toHTTP() //=> 'Sun, 13 Jul 2014 00:00:00 GMT'
   * @example DateTime.utc(2014, 7, 13, 19).toHTTP() //=> 'Sun, 13 Jul 2014 19:00:00 GMT'
   * @return {string}
   */toHTTP(){return toTechFormat(this.toUTC(),"EEE, dd LLL yyyy HH:mm:ss 'GMT'");}/**
   * Returns a string representation of this DateTime appropriate for use in SQL Date
   * @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
   * @return {string|null}
   */toSQLDate(){if(!this.isValid){return null;}return toISODate(this,true);}/**
   * Returns a string representation of this DateTime appropriate for use in SQL Time
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
   * @example DateTime.utc().toSQL() //=> '05:15:16.345'
   * @example DateTime.now().toSQL() //=> '05:15:16.345 -04:00'
   * @example DateTime.now().toSQL({ includeOffset: false }) //=> '05:15:16.345'
   * @example DateTime.now().toSQL({ includeZone: false }) //=> '05:15:16.345 America/New_York'
   * @return {string}
   */toSQLTime({includeOffset=true,includeZone=false,includeOffsetSpace=true}={}){let fmt="HH:mm:ss.SSS";if(includeZone||includeOffset){if(includeOffsetSpace){fmt+=" ";}if(includeZone){fmt+="z";}else if(includeOffset){fmt+="ZZ";}}return toTechFormat(this,fmt,true);}/**
   * Returns a string representation of this DateTime appropriate for use in SQL DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
   * @example DateTime.utc(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 Z'
   * @example DateTime.local(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 -04:00'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeOffset: false }) //=> '2014-07-13 00:00:00.000'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeZone: true }) //=> '2014-07-13 00:00:00.000 America/New_York'
   * @return {string}
   */toSQL(opts={}){if(!this.isValid){return null;}return`${this.toSQLDate()} ${this.toSQLTime(opts)}`;}/**
   * Returns a string representation of this DateTime appropriate for debugging
   * @return {string}
   */toString(){return this.isValid?this.toISO():INVALID;}/**
   * Returns a string representation of this DateTime appropriate for the REPL.
   * @return {string}
   */[Symbol.for("nodejs.util.inspect.custom")](){if(this.isValid){return`DateTime { ts: ${this.toISO()}, zone: ${this.zone.name}, locale: ${this.locale} }`;}else{return`DateTime { Invalid, reason: ${this.invalidReason} }`;}}/**
   * Returns the epoch milliseconds of this DateTime. Alias of {@link DateTime#toMillis}
   * @return {number}
   */valueOf(){return this.toMillis();}/**
   * Returns the epoch milliseconds of this DateTime.
   * @return {number}
   */toMillis(){return this.isValid?this.ts:NaN;}/**
   * Returns the epoch seconds (including milliseconds in the fractional part) of this DateTime.
   * @return {number}
   */toSeconds(){return this.isValid?this.ts/1000:NaN;}/**
   * Returns the epoch seconds (as a whole number) of this DateTime.
   * @return {number}
   */toUnixInteger(){return this.isValid?Math.floor(this.ts/1000):NaN;}/**
   * Returns an ISO 8601 representation of this DateTime appropriate for use in JSON.
   * @return {string}
   */toJSON(){return this.toISO();}/**
   * Returns a BSON serializable equivalent to this DateTime.
   * @return {Date}
   */toBSON(){return this.toJSDate();}/**
   * Returns a JavaScript object with this DateTime's year, month, day, and so on.
   * @param opts - options for generating the object
   * @param {boolean} [opts.includeConfig=false] - include configuration attributes in the output
   * @example DateTime.now().toObject() //=> { year: 2017, month: 4, day: 22, hour: 20, minute: 49, second: 42, millisecond: 268 }
   * @return {Object}
   */toObject(opts={}){if(!this.isValid)return{};const base=_objectSpread({},this.c);if(opts.includeConfig){base.outputCalendar=this.outputCalendar;base.numberingSystem=this.loc.numberingSystem;base.locale=this.loc.locale;}return base;}/**
   * Returns a JavaScript Date equivalent to this DateTime.
   * @return {Date}
   */toJSDate(){return new Date(this.isValid?this.ts:NaN);}// COMPARE
/**
   * Return the difference between two DateTimes as a Duration.
   * @param {DateTime} otherDateTime - the DateTime to compare this one to
   * @param {string|string[]} [unit=['milliseconds']] - the unit or array of units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example
   * var i1 = DateTime.fromISO('1982-05-25T09:45'),
   *     i2 = DateTime.fromISO('1983-10-14T10:30');
   * i2.diff(i1).toObject() //=> { milliseconds: 43807500000 }
   * i2.diff(i1, 'hours').toObject() //=> { hours: 12168.75 }
   * i2.diff(i1, ['months', 'days']).toObject() //=> { months: 16, days: 19.03125 }
   * i2.diff(i1, ['months', 'days', 'hours']).toObject() //=> { months: 16, days: 19, hours: 0.75 }
   * @return {Duration}
   */diff(otherDateTime,unit="milliseconds",opts={}){if(!this.isValid||!otherDateTime.isValid){return Duration.invalid("created by diffing an invalid DateTime");}const durOpts=_objectSpread({locale:this.locale,numberingSystem:this.numberingSystem},opts);const units=maybeArray(unit).map(Duration.normalizeUnit),otherIsLater=otherDateTime.valueOf()>this.valueOf(),earlier=otherIsLater?this:otherDateTime,later=otherIsLater?otherDateTime:this,diffed=diff(earlier,later,units,durOpts);return otherIsLater?diffed.negate():diffed;}/**
   * Return the difference between this DateTime and right now.
   * See {@link DateTime#diff}
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units units (such as 'hours' or 'days') to include in the duration
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */diffNow(unit="milliseconds",opts={}){return this.diff(DateTime.now(),unit,opts);}/**
   * Return an Interval spanning between this DateTime and another DateTime
   * @param {DateTime} otherDateTime - the other end point of the Interval
   * @return {Interval|DateTime}
   */until(otherDateTime){return this.isValid?Interval.fromDateTimes(this,otherDateTime):this;}/**
   * Return whether this DateTime is in the same unit of time as another DateTime.
   * Higher-order units must also be identical for this function to return `true`.
   * Note that time zones are **ignored** in this comparison, which compares the **local** calendar time. Use {@link DateTime#setZone} to convert one of the dates if needed.
   * @param {DateTime} otherDateTime - the other DateTime
   * @param {string} unit - the unit of time to check sameness on
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; only the locale of this DateTime is used
   * @example DateTime.now().hasSame(otherDT, 'day'); //~> true if otherDT is in the same current calendar day
   * @return {boolean}
   */hasSame(otherDateTime,unit,opts){if(!this.isValid)return false;const inputMs=otherDateTime.valueOf();const adjustedToZone=this.setZone(otherDateTime.zone,{keepLocalTime:true});return adjustedToZone.startOf(unit,opts)<=inputMs&&inputMs<=adjustedToZone.endOf(unit,opts);}/**
   * Equality check
   * Two DateTimes are equal if and only if they represent the same millisecond, have the same zone and location, and are both valid.
   * To compare just the millisecond values, use `+dt1 === +dt2`.
   * @param {DateTime} other - the other DateTime
   * @return {boolean}
   */equals(other){return this.isValid&&other.isValid&&this.valueOf()===other.valueOf()&&this.zone.equals(other.zone)&&this.loc.equals(other.loc);}/**
   * Returns a string representation of a this time relative to now, such as "in two days". Can only internationalize if your
   * platform supports Intl.RelativeTimeFormat. Rounds down by default.
   * @param {Object} options - options that affect the output
   * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
   * @param {string} [options.style="long"] - the style of units, must be "long", "short", or "narrow"
   * @param {string|string[]} options.unit - use a specific unit or array of units; if omitted, or an array, the method will pick the best unit. Use an array or one of "years", "quarters", "months", "weeks", "days", "hours", "minutes", or "seconds"
   * @param {boolean} [options.round=true] - whether to round the numbers in the output.
   * @param {number} [options.padding=0] - padding in milliseconds. This allows you to round up the result if it fits inside the threshold. Don't use in combination with {round: false} because the decimal output will include the padding.
   * @param {string} options.locale - override the locale of this DateTime
   * @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
   * @example DateTime.now().plus({ days: 1 }).toRelative() //=> "in 1 day"
   * @example DateTime.now().setLocale("es").toRelative({ days: 1 }) //=> "dentro de 1 día"
   * @example DateTime.now().plus({ days: 1 }).toRelative({ locale: "fr" }) //=> "dans 23 heures"
   * @example DateTime.now().minus({ days: 2 }).toRelative() //=> "2 days ago"
   * @example DateTime.now().minus({ days: 2 }).toRelative({ unit: "hours" }) //=> "48 hours ago"
   * @example DateTime.now().minus({ hours: 36 }).toRelative({ round: false }) //=> "1.5 days ago"
   */toRelative(options={}){if(!this.isValid)return null;const base=options.base||DateTime.fromObject({},{zone:this.zone}),padding=options.padding?this<base?-options.padding:options.padding:0;let units=["years","months","days","hours","minutes","seconds"];let unit=options.unit;if(Array.isArray(options.unit)){units=options.unit;unit=undefined;}return diffRelative(base,this.plus(padding),_objectSpread(_objectSpread({},options),{},{numeric:"always",units,unit}));}/**
   * Returns a string representation of this date relative to today, such as "yesterday" or "next month".
   * Only internationalizes on platforms that supports Intl.RelativeTimeFormat.
   * @param {Object} options - options that affect the output
   * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
   * @param {string} options.locale - override the locale of this DateTime
   * @param {string} options.unit - use a specific unit; if omitted, the method will pick the unit. Use one of "years", "quarters", "months", "weeks", or "days"
   * @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
   * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar() //=> "tomorrow"
   * @example DateTime.now().setLocale("es").plus({ days: 1 }).toRelative() //=> ""mañana"
   * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar({ locale: "fr" }) //=> "demain"
   * @example DateTime.now().minus({ days: 2 }).toRelativeCalendar() //=> "2 days ago"
   */toRelativeCalendar(options={}){if(!this.isValid)return null;return diffRelative(options.base||DateTime.fromObject({},{zone:this.zone}),this,_objectSpread(_objectSpread({},options),{},{numeric:"auto",units:["years","months","days"],calendary:true}));}/**
   * Return the min of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the minimum
   * @return {DateTime} the min DateTime, or undefined if called with no argument
   */static min(...dateTimes){if(!dateTimes.every(DateTime.isDateTime)){throw new InvalidArgumentError("min requires all arguments be DateTimes");}return bestBy(dateTimes,i=>i.valueOf(),Math.min);}/**
   * Return the max of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the maximum
   * @return {DateTime} the max DateTime, or undefined if called with no argument
   */static max(...dateTimes){if(!dateTimes.every(DateTime.isDateTime)){throw new InvalidArgumentError("max requires all arguments be DateTimes");}return bestBy(dateTimes,i=>i.valueOf(),Math.max);}// MISC
/**
   * Explain how a string would be parsed by fromFormat()
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see description)
   * @param {Object} options - options taken by fromFormat()
   * @return {Object}
   */static fromFormatExplain(text,fmt,options={}){const{locale=null,numberingSystem=null}=options,localeToUse=Locale.fromOpts({locale,numberingSystem,defaultToEN:true});return explainFromTokens(localeToUse,text,fmt);}/**
   * @deprecated use fromFormatExplain instead
   */static fromStringExplain(text,fmt,options={}){return DateTime.fromFormatExplain(text,fmt,options);}/**
   * Build a parser for `fmt` using the given locale. This parser can be passed
   * to {@link DateTime.fromFormatParser} to a parse a date in this format. This
   * can be used to optimize cases where many dates need to be parsed in a
   * specific format.
   *
   * @param {String} fmt - the format the string is expected to be in (see
   * description)
   * @param {Object} options - options used to set locale and numberingSystem
   * for parser
   * @returns {TokenParser} - opaque object to be used
   */static buildFormatParser(fmt,options={}){const{locale=null,numberingSystem=null}=options,localeToUse=Locale.fromOpts({locale,numberingSystem,defaultToEN:true});return new TokenParser(localeToUse,fmt);}/**
   * Create a DateTime from an input string and format parser.
   *
   * The format parser must have been created with the same locale as this call.
   *
   * @param {String} text - the string to parse
   * @param {TokenParser} formatParser - parser from {@link DateTime.buildFormatParser}
   * @param {Object} opts - options taken by fromFormat()
   * @returns {DateTime}
   */static fromFormatParser(text,formatParser,opts={}){if(isUndefined(text)||isUndefined(formatParser)){throw new InvalidArgumentError("fromFormatParser requires an input string and a format parser");}const{locale=null,numberingSystem=null}=opts,localeToUse=Locale.fromOpts({locale,numberingSystem,defaultToEN:true});if(!localeToUse.equals(formatParser.locale)){throw new InvalidArgumentError(`fromFormatParser called with a locale of ${localeToUse}, `+`but the format parser was created for ${formatParser.locale}`);}const{result,zone,specificOffset,invalidReason}=formatParser.explainFromTokens(text);if(invalidReason){return DateTime.invalid(invalidReason);}else{return parseDataToDateTime(result,zone,opts,`format ${formatParser.format}`,text,specificOffset);}}// FORMAT PRESETS
/**
   * {@link DateTime#toLocaleString} format like 10/14/1983
   * @type {Object}
   */static get DATE_SHORT(){return DATE_SHORT;}/**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983'
   * @type {Object}
   */static get DATE_MED(){return DATE_MED;}/**
   * {@link DateTime#toLocaleString} format like 'Fri, Oct 14, 1983'
   * @type {Object}
   */static get DATE_MED_WITH_WEEKDAY(){return DATE_MED_WITH_WEEKDAY;}/**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983'
   * @type {Object}
   */static get DATE_FULL(){return DATE_FULL;}/**
   * {@link DateTime#toLocaleString} format like 'Tuesday, October 14, 1983'
   * @type {Object}
   */static get DATE_HUGE(){return DATE_HUGE;}/**
   * {@link DateTime#toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */static get TIME_SIMPLE(){return TIME_SIMPLE;}/**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */static get TIME_WITH_SECONDS(){return TIME_WITH_SECONDS;}/**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */static get TIME_WITH_SHORT_OFFSET(){return TIME_WITH_SHORT_OFFSET;}/**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */static get TIME_WITH_LONG_OFFSET(){return TIME_WITH_LONG_OFFSET;}/**
   * {@link DateTime#toLocaleString} format like '09:30', always 24-hour.
   * @type {Object}
   */static get TIME_24_SIMPLE(){return TIME_24_SIMPLE;}/**
   * {@link DateTime#toLocaleString} format like '09:30:23', always 24-hour.
   * @type {Object}
   */static get TIME_24_WITH_SECONDS(){return TIME_24_WITH_SECONDS;}/**
   * {@link DateTime#toLocaleString} format like '09:30:23 EDT', always 24-hour.
   * @type {Object}
   */static get TIME_24_WITH_SHORT_OFFSET(){return TIME_24_WITH_SHORT_OFFSET;}/**
   * {@link DateTime#toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
   * @type {Object}
   */static get TIME_24_WITH_LONG_OFFSET(){return TIME_24_WITH_LONG_OFFSET;}/**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */static get DATETIME_SHORT(){return DATETIME_SHORT;}/**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */static get DATETIME_SHORT_WITH_SECONDS(){return DATETIME_SHORT_WITH_SECONDS;}/**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */static get DATETIME_MED(){return DATETIME_MED;}/**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */static get DATETIME_MED_WITH_SECONDS(){return DATETIME_MED_WITH_SECONDS;}/**
   * {@link DateTime#toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */static get DATETIME_MED_WITH_WEEKDAY(){return DATETIME_MED_WITH_WEEKDAY;}/**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */static get DATETIME_FULL(){return DATETIME_FULL;}/**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */static get DATETIME_FULL_WITH_SECONDS(){return DATETIME_FULL_WITH_SECONDS;}/**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */static get DATETIME_HUGE(){return DATETIME_HUGE;}/**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */static get DATETIME_HUGE_WITH_SECONDS(){return DATETIME_HUGE_WITH_SECONDS;}};/**
 * @private
 */function friendlyDateTime(dateTimeish){if(DateTime$1.isDateTime(dateTimeish)){return dateTimeish;}else if(dateTimeish&&dateTimeish.valueOf&&isNumber$1(dateTimeish.valueOf())){return DateTime$1.fromJSDate(dateTimeish);}else if(dateTimeish&&typeof dateTimeish==="object"){return DateTime$1.fromObject(dateTimeish);}else{throw new InvalidArgumentError(`Unknown datetime argument: ${dateTimeish}, of type ${typeof dateTimeish}`);}}(function(){/* Detect if we're in a worker or not */var isWorker=false;try{document;}catch(e){isWorker=true;}if(isWorker){if(!self.Worker){self.Worker=function(path){var that=this;this.id=Math.random().toString(36).substr(2,5);this.eventListeners={"message":[]};self.addEventListener("message",function(e){if(e.data._from===that.id){var newEvent=new MessageEvent("message");newEvent.initMessageEvent("message",false,false,e.data.message,that,"",null,[]);that.dispatchEvent(newEvent);if(that.onmessage){that.onmessage(newEvent);}}});var location=self.location.pathname;var slashedPath=path.charAt(0)=='/'?path:'/'+path;var absPath=location.substring(0,location.lastIndexOf('/'))+slashedPath;self.postMessage({_subworker:true,cmd:'newWorker',id:this.id,path:absPath});};Worker.prototype={onerror:null,onmessage:null,postMessage:function(message,transfer){self.postMessage({_subworker:true,id:this.id,cmd:'passMessage',message:message,transfer:transfer},transfer);},terminate:function(){self.postMessage({_subworker:true,cmd:'terminate',id:this.id});},addEventListener:function(type,listener,useCapture){if(this.eventListeners[type]){this.eventListeners[type].push(listener);}},removeEventListener:function(type,listener,useCapture){if(!(type in this.eventListeners)){return;}var index=this.eventListeners[type].indexOf(listener);if(index!==-1){this.eventListeners[type].splice(index,1);}},dispatchEvent:function(event){var listeners=this.eventListeners[event.type];for(var i=0;i<listeners.length;i++){listeners[i](event);}}};}}var allWorkers={};var cmds={newWorker:function(event){var worker=new Worker(event.data.path);worker.addEventListener("message",function(e){var envelope={_from:event.data.id,message:e.data};event.target.postMessage(envelope);});allWorkers[event.data.id]=worker;},terminate:function(event){allWorkers[event.data.id].terminate();},passMessage:function(event){allWorkers[event.data.id].postMessage(event.data.message,event.data.transfer);}};var messageRecieved=function(event){if(event.data._subworker){cmds[event.data.cmd](event);}};/* Hijack Worker */var oldWorker=Worker;Worker=function(path){if(this.constructor!==Worker){throw new TypeError("Failed to construct 'Worker': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");}var blobIndex=path.indexOf('blob:');if(blobIndex!==-1&&blobIndex!==0){path=path.substring(blobIndex);}var newWorker=new oldWorker(path);newWorker.addEventListener("message",messageRecieved);return newWorker;};})();Promise.prototype.finally||(Promise.prototype.finally=function(t){if("function"!=typeof t)return this.then(t,t);const e=this.constructor||Promise;return this.then(o=>e.resolve(t()).then(()=>o),o=>e.resolve(t()).then(()=>{throw o;}));});class RetrieverError extends Error{constructor(uri,originalError){super(uri);_defineProperty(this,"uri",void 0);_defineProperty(this,"originalError",void 0);this.uri=uri;this.originalError=originalError;this.name='RetrieverError';}}class ParserError extends Error{constructor(scope,type,errors){super(type);_defineProperty(this,"scope",void 0);_defineProperty(this,"errors",void 0);this.scope=scope;this.errors=errors;this.name='ParserError';}}const TILDE_RE=/~/g;const SLASH_RE=/\//g;const TILDE_0_RE=/~0/g;const TILDE_1_RE=/~1/g;function escape(frag){return frag.replace(TILDE_RE,'~0').replace(SLASH_RE,'~1');}function unescape(frag){return frag.replace(TILDE_1_RE,'/').replace(TILDE_0_RE,'~');}const __meta=Symbol();const LII_RE=/^[a-zA-Z][a-zA-Z0-9\.\-_:]*$/;// Location-independent identifier, JSON Schema draft 7, par. 8.2.3
function normalizeUri(input,scope){const uri=new URL(input,scope);const out=uri.toString();return out+(!uri.hash&&out[out.length-1]!=='#'?'#':'');}function isRef(obj){return obj!==null&&typeof obj==='object'&&typeof obj.$ref==='string';}function isAnnotated(obj){return obj!==null&&typeof obj==='object'&&typeof obj[__meta]==='object';}function isDerefd(obj){return isAnnotated(obj)&&obj[__meta].derefd===true;}function getMeta(obj){if(!isAnnotated(obj)){throw new Error('Not annotated');}return obj[__meta];}function getKey(obj){const parent=getMeta(obj).parent;if(typeof parent==='undefined'){return undefined;}else if(Array.isArray(parent)){for(let i=0;i<parent.length;i++){if(parent[i]===obj){return i;}}return undefined;}else{return Object.keys(parent).find(k=>parent[k]===obj);}}function getById(obj,id){if(obj===null||typeof obj!=='object'){throw new TypeError('Invalid object');}const meta=getMeta(obj);return meta.registry[normalizeUri(id,meta.scope)];}function annotate(obj,options){if(obj===null||typeof obj!=='object'){throw new TypeError('Invalid object');}else if(isAnnotated(obj)){throw new Error('Already annotated');}obj[__meta]={registry:options.registry||{},refs:options.refs||new Set(),root:obj};obj[__meta].registry[normalizeUri(options.scope)]=obj;return function _annotate(obj,scope){if(isRef(obj)){const uri=new URL(obj.$ref,scope);uri.hash='';getMeta(obj).refs.add(uri.toString()+'#');obj[__meta].scope=normalizeUri(scope);}else{if(typeof obj.$id==='string'){if(!obj.$id||obj.$id==='#'){throw new SyntaxError(`Invalid identifier ${obj.$id}`);}const id=new URL(obj.$id,scope);if(id.hash&&!id.hash.substr(1).match(LII_RE)){throw new SyntaxError(`Invalid identifier ${obj.$id}`);}obj[__meta].scope=normalizeUri(obj.$id,scope);obj[__meta].registry[obj[__meta].scope]=obj;obj[__meta].root=obj;}else{obj[__meta].scope=normalizeUri(scope);}const keys=Object.keys(obj);for(let key of keys){const next=obj[key];if(next!==null&&typeof next==='object'&&!isAnnotated(next)){const meta=getMeta(obj);next[__meta]={registry:meta.registry,refs:meta.refs,parent:obj,root:meta.root};_annotate(next,`${meta.scope}/${escape(key)}`);}}}return obj;}(obj,options.scope);}function missingRefs(obj){const meta=getMeta(obj);const known=new Set(Object.keys(meta.registry));return[...meta.refs].filter(r=>!known.has(r));}const PREFIX_RE=/^(0|[1-9][0-9]*?)([#]?)$/;const INDEX_RE=/-|0|[1-9][0-9]*/;function resolve$1(obj,path){if(typeof obj==='undefined'){throw new TypeError('Bad object');}else if(typeof path!=='string'){throw new TypeError('Bad path');}else if(!path){return obj;}let current=obj;const parts=path.split('/');const prefix=parts.shift();if(prefix){if(prefix.match(LII_RE)){current=getById(current,`#${prefix}`);}else{const match=prefix.match(PREFIX_RE);if(!match){throw new SyntaxError(`Bad prefix ${prefix}`);}else{let levels=parseInt(match[1]);while(levels--){current=getMeta(current).parent;if(!current){throw new RangeError(`Invalid prefix "${match[1]}"`);}}if(match[2]){return getKey(current);}}}}while(parts.length){if(current===null||typeof current!=='object'){throw new TypeError(`Invalid type at path`);}const part=unescape(parts.shift());if(Array.isArray(current)){if(!part.match(INDEX_RE)){throw new SyntaxError(`Invalid array index "${part}"`);}else if(part==='-'){throw new RangeError(`Index out of bounds "${part}"`);}else{const index=parseInt(part);if(index>current.length){throw new RangeError(`Index out of bounds "${part}"`);}else{current=current[index];}}}else{current=current[part];if(typeof current==='undefined'){throw new RangeError(`Cannot find property "${part}"`);}}}return current;}const RELATIVE_RE=/^#(?:0|[1-9][0-9]*?)(?:$|\/)/;function deref(obj){let out;if(obj.$ref.match(RELATIVE_RE)){out=resolve$1(obj,obj.$ref.substr(1));}else{const scope=getMeta(obj).scope;const uri=new URL(obj.$ref,scope);const path=uri.hash?uri.hash.substr(1):undefined;uri.hash='';out=getMeta(obj).registry[uri.toString()+'#'];if(!out){throw new Error(`Reference not in registry (${uri.toString()})`);}else if(path){out=resolve$1(out,path);}}return out;}function resolve(obj,options){if(obj===null||typeof obj!=='object'){return obj;}return function _parse(obj){if(!isAnnotated(obj)){obj=annotate(obj,options);}if(isDerefd(obj)){return obj;}else if(isRef(obj)){return deref(obj);}else{const orig=Object.assign({},obj);Object.defineProperty(obj,'toJSON',{get:()=>()=>orig,enumerable:false,configurable:false});const keys=Object.keys(obj);for(let key of keys){const next=obj[key];if(next!==null&&typeof next==='object'){if(isRef(next)){Object.defineProperty(obj,key,{get:()=>{Object.defineProperty(obj,key,{value:deref(next),enumerable:true,configurable:true,writable:true});return obj[key];},enumerable:true,configurable:true});}else{obj[key]=_parse(next);}}else{obj[key]=next;}}getMeta(obj).derefd=true;return obj;}}(obj);}function parse$1(_x,_x2){return _parse$.apply(this,arguments);}/*! (c) Andrea Giammarchi - ISC */function _parse$(){_parse$=_asyncToGenerator(function*(dataOrUri,opts){let obj;if(!opts||!opts.scope){throw new Error('No scope');}if(typeof dataOrUri==='string'){if(!opts.retriever){throw new Error('No retriever');}const uri=new URL(dataOrUri).toString();obj=yield opts.retriever(uri);if(!opts.registry){opts.registry={};}if(uri!==opts.scope){opts.registry[normalizeUri(uri)]=obj;}}else if(dataOrUri===null||typeof dataOrUri!=='object'){throw new TypeError('Bad data');}else{obj=dataOrUri;}if(isAnnotated(obj)){return obj;}else{annotate(obj,opts);if(getMeta(obj).refs.size>0){const missingRefs$1=missingRefs(obj);if(missingRefs$1.length){if(!opts.retriever){throw new Error('No retriever');}const registry=getMeta(obj).registry;const errors=[];for(let r of missingRefs$1){try{registry[r]=yield opts.retriever(r);}catch(e){errors.push(new RetrieverError(r,e));}}if(errors.length){throw new ParserError(getMeta(obj).scope,'retriever',errors);}}return resolve(obj,opts);}else{return obj;}}});return _parse$.apply(this,arguments);}var self$1={};try{self$1.EventTarget=new EventTarget().constructor;}catch(EventTarget){(function(Object,wm){var create=Object.create;var defineProperty=Object.defineProperty;var proto=EventTarget.prototype;define(proto,'addEventListener',function(type,listener,options){for(var secret=wm.get(this),listeners=secret[type]||(secret[type]=[]),i=0,length=listeners.length;i<length;i++){if(listeners[i].listener===listener)return;}listeners.push({target:this,listener:listener,options:options});});define(proto,'dispatchEvent',function(event){var secret=wm.get(this);var listeners=secret[event.type];if(listeners){define(event,'target',this);define(event,'currentTarget',this);listeners.slice(0).some(dispatch,event);delete event.currentTarget;delete event.target;}return true;});define(proto,'removeEventListener',function(type,listener){for(var secret=wm.get(this),/* istanbul ignore next */listeners=secret[type]||(secret[type]=[]),i=0,length=listeners.length;i<length;i++){if(listeners[i].listener===listener){listeners.splice(i,1);return;}}});self$1.EventTarget=EventTarget;function EventTarget(){wm.set(this,create(null));}function define(target,name,value){defineProperty(target,name,{configurable:true,writable:true,value:value});}function dispatch(info){var options=info.options;if(options&&options.once)info.target.removeEventListener(this.type,info.listener);if(typeof info.listener==='function')info.listener.call(info.target,this);else info.listener.handleEvent(this);return this._stopImmediatePropagationFlag;}})(Object,new WeakMap());}var EventTarget$1=self$1.EventTarget;function $constructor(name,initializer){class _{constructor(def){var _a$deferred;var _a;const th=this;_.init(th,def);(_a$deferred=(_a=th._zod).deferred)!==null&&_a$deferred!==void 0?_a$deferred:_a.deferred=[];for(const fn of th._zod.deferred){fn();}}static init(inst,def){var _inst$_zod,_a$traits;var _a;(_inst$_zod=inst._zod)!==null&&_inst$_zod!==void 0?_inst$_zod:inst._zod={};(_a$traits=(_a=inst._zod).traits)!==null&&_a$traits!==void 0?_a$traits:_a.traits=new Set();// const seen = inst._zod.traits.has(name);
inst._zod.traits.add(name);initializer(inst,def);// support prototype modifications
for(const k in _.prototype){Object.defineProperty(inst,k,{value:_.prototype[k].bind(inst)});}inst._zod.constr=_;inst._zod.def=def;}static[Symbol.hasInstance](inst){var _inst$_zod2;return inst===null||inst===void 0||(_inst$_zod2=inst._zod)===null||_inst$_zod2===void 0||(_inst$_zod2=_inst$_zod2.traits)===null||_inst$_zod2===void 0?void 0:_inst$_zod2.has(name);}}Object.defineProperty(_,"name",{value:name});return _;}class $ZodAsyncError extends Error{constructor(){super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);}}const globalConfig={};function config(newConfig){return globalConfig;}const _$ZodError=$constructor("$ZodError",(inst,def)=>{Object.defineProperties(inst,{issues:{value:def,enumerable:true},_zod:{value:inst._zod,enumerable:false}// message: {
//   get() {
//     return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
//   },
//   enumerable: false,
// },
});});// export interface $ZodError<T = unknown> extends $ZodError<T> {}
class $ZodError extends Error{constructor(issues){super();_$ZodError.init(this,issues);}}function flattenError(error,mapper=issue=>issue.message){const fieldErrors={};const formErrors=[];for(const sub of error.issues){if(sub.path.length>0){fieldErrors[sub.path[0]]=fieldErrors[sub.path[0]]||[];fieldErrors[sub.path[0]].push(mapper(sub));}else{formErrors.push(mapper(sub));}}return{formErrors,fieldErrors};}function formatError(error,_mapper){const mapper=_mapper||function(issue){return issue.message;};const fieldErrors={_errors:[]};const processError=error=>{for(const issue of error.issues){if(issue.code==="invalid_union"){issue.errors.map(issues=>processError({issues}));}else if(issue.code==="invalid_key"){processError({issues:issue.issues});}else if(issue.code==="invalid_element"){processError({issues:issue.issues});}else if(issue.path.length===0){fieldErrors._errors.push(mapper(issue));}else{let curr=fieldErrors;let i=0;while(i<issue.path.length){const el=issue.path[i];const terminal=i===issue.path.length-1;if(!terminal){curr[el]=curr[el]||{_errors:[]};}else{curr[el]=curr[el]||{_errors:[]};curr[el]._errors.push(mapper(issue));}curr=curr[el];i++;}}}};processError(error);return fieldErrors;}// functions
function cached(getter){return{get value(){{const value=getter();Object.defineProperty(this,"value",{value});return value;}}};}function nullish(input){return input===null||input===undefined;}function cleanRegex(source){const start=source.startsWith("^")?1:0;const end=source.endsWith("$")?source.length-1:source.length;return source.slice(start,end);}function floatSafeRemainder(val,step){const valDecCount=(val.toString().split(".")[1]||"").length;const stepDecCount=(step.toString().split(".")[1]||"").length;const decCount=valDecCount>stepDecCount?valDecCount:stepDecCount;const valInt=Number.parseInt(val.toFixed(decCount).replace(".",""));const stepInt=Number.parseInt(step.toFixed(decCount).replace(".",""));return valInt%stepInt/10**decCount;}function defineLazy(object,key,getter){Object.defineProperty(object,key,{get(){{const value=getter();object[key]=value;return value;}},set(v){Object.defineProperty(object,key,{value:v// configurable: true,
});// object[key] = v;
},configurable:true});}function assignProp(target,prop,value){Object.defineProperty(target,prop,{value,writable:true,enumerable:true,configurable:true});}function randomString(length=10){const chars="abcdefghijklmnopqrstuvwxyz";let str="";for(let i=0;i<length;i++){str+=chars[Math.floor(Math.random()*chars.length)];}return str;}function esc(str){return JSON.stringify(str);}function isObject(data){return typeof data==="object"&&data!==null;}const allowsEval=cached(()=>{try{new Function("");return true;}catch(_){return false;}});function isPlainObject(data){return typeof data==="object"&&data!==null&&Object.getPrototypeOf(data)===Object.prototype;}const propertyKeyTypes=new Set(["string","number","symbol"]);function escapeRegex(str){return str.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}// zod-specific utils
function clone(inst,def){const cl=new inst._zod.constr(def!==null&&def!==void 0?def:inst._zod.def);if(!def)cl._zod.parent=inst;return cl;}function normalizeParams(_params){const params=_params;if(!params)return{};if(typeof params==="string")return{error:()=>params};if((params===null||params===void 0?void 0:params.message)!==undefined){if((params===null||params===void 0?void 0:params.error)!==undefined)throw new Error("Cannot specify both `message` and `error` params");params.error=params.message;}delete params.message;if(typeof params.error==="string")return _objectSpread(_objectSpread({},params),{},{error:()=>params.error});return params;}function optionalKeys(shape){return Object.keys(shape).filter(k=>{return shape[k]._zod.optionality==="optional";});}const NUMBER_FORMAT_RANGES={safeint:[Number.MIN_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],int32:[-2147483648,2147483647],uint32:[0,4294967295],float32:[-34028234663852886e22,3.4028234663852886e38],float64:[-Number.MAX_VALUE,Number.MAX_VALUE]};function pick(schema,mask){const newShape={};const currDef=schema._zod.def;//.shape;
for(const key in mask){if(!(key in currDef.shape)){throw new Error(`Unrecognized key: "${key}"`);}if(!mask[key])continue;// pick key
newShape[key]=currDef.shape[key];}return clone(schema,_objectSpread(_objectSpread({},schema._zod.def),{},{shape:newShape,checks:[]}));}function omit(schema,mask){const newShape=_objectSpread({},schema._zod.def.shape);const currDef=schema._zod.def;//.shape;
for(const key in mask){if(!(key in currDef.shape)){throw new Error(`Unrecognized key: "${key}"`);}if(!mask[key])continue;delete newShape[key];}return clone(schema,_objectSpread(_objectSpread({},schema._zod.def),{},{shape:newShape,checks:[]}));}function extend(schema,shape){const def=_objectSpread(_objectSpread({},schema._zod.def),{},{get shape(){const _shape=_objectSpread(_objectSpread({},schema._zod.def.shape),shape);assignProp(this,"shape",_shape);// self-caching
return _shape;},checks:[]// delete existing checks
});return clone(schema,def);}function merge(a,b){return clone(a,_objectSpread(_objectSpread({},a._zod.def),{},{get shape(){const _shape=_objectSpread(_objectSpread({},a._zod.def.shape),b._zod.def.shape);assignProp(this,"shape",_shape);// self-caching
return _shape;},catchall:b._zod.def.catchall,checks:[]// delete existing checks
}));}function partial(Class,schema,mask){const oldShape=schema._zod.def.shape;const shape=_objectSpread({},oldShape);if(mask){for(const key in mask){if(!(key in oldShape)){throw new Error(`Unrecognized key: "${key}"`);}if(!mask[key])continue;shape[key]=Class?new Class({type:"optional",innerType:oldShape[key]}):oldShape[key];}}else{for(const key in oldShape){shape[key]=Class?new Class({type:"optional",innerType:oldShape[key]}):oldShape[key];}}return clone(schema,_objectSpread(_objectSpread({},schema._zod.def),{},{shape,checks:[]}));}function required(Class,schema,mask){const oldShape=schema._zod.def.shape;const shape=_objectSpread({},oldShape);if(mask){for(const key in mask){if(!(key in shape)){throw new Error(`Unrecognized key: "${key}"`);}if(!mask[key])continue;// overwrite with non-optional
shape[key]=new Class({type:"nonoptional",innerType:oldShape[key]});}}else{for(const key in oldShape){// overwrite with non-optional
shape[key]=new Class({type:"nonoptional",innerType:oldShape[key]});}}return clone(schema,_objectSpread(_objectSpread({},schema._zod.def),{},{shape,// optional: [],
checks:[]}));}function aborted(x,startIndex=0){for(let i=startIndex;i<x.issues.length;i++){if(x.issues[i].continue!==true)return true;}return false;}function prefixIssues(path,issues){return issues.map(iss=>{var _a$path;var _a;(_a$path=(_a=iss).path)!==null&&_a$path!==void 0?_a$path:_a.path=[];iss.path.unshift(path);return iss;});}function unwrapMessage(message){return typeof message==="string"?message:message===null||message===void 0?void 0:message.message;}function finalizeIssue(iss,ctx,config){var _iss$path;const full=_objectSpread(_objectSpread({},iss),{},{path:(_iss$path=iss.path)!==null&&_iss$path!==void 0?_iss$path:[]});// for backwards compatibility
// const _ctx: errors.$ZodErrorMapCtx = { data: iss.input, defaultError: undefined as any };
if(!iss.message){var _ref,_ref2,_ref3,_unwrapMessage,_iss$inst,_iss$inst$error,_ctx$error,_config$customError,_config$localeError;const message=(_ref=(_ref2=(_ref3=(_unwrapMessage=unwrapMessage((_iss$inst=iss.inst)===null||_iss$inst===void 0||(_iss$inst=_iss$inst._zod.def)===null||_iss$inst===void 0||(_iss$inst$error=_iss$inst.error)===null||_iss$inst$error===void 0?void 0:_iss$inst$error.call(_iss$inst,iss)))!==null&&_unwrapMessage!==void 0?_unwrapMessage:unwrapMessage(ctx===null||ctx===void 0||(_ctx$error=ctx.error)===null||_ctx$error===void 0?void 0:_ctx$error.call(ctx,iss)))!==null&&_ref3!==void 0?_ref3:unwrapMessage((_config$customError=config.customError)===null||_config$customError===void 0?void 0:_config$customError.call(config,iss)))!==null&&_ref2!==void 0?_ref2:unwrapMessage((_config$localeError=config.localeError)===null||_config$localeError===void 0?void 0:_config$localeError.call(config,iss)))!==null&&_ref!==void 0?_ref:"Invalid input";full.message=message;}// delete (full as any).def;
delete full.inst;delete full.continue;if(!(ctx!==null&&ctx!==void 0&&ctx.reportInput)){delete full.input;}return full;}function getLengthableOrigin(input){if(Array.isArray(input))return"array";if(typeof input==="string")return"string";return"unknown";}function issue(...args){const[iss,input,inst]=args;if(typeof iss==="string"){return{message:iss,code:"custom",input,inst};}return _objectSpread({},iss);}const _parse=_Err=>(schema,value,_ctx,_params)=>{const ctx=_ctx?Object.assign(_ctx,{async:false}):{async:false};const result=schema._zod.run({value,issues:[]},ctx);if(result instanceof Promise){throw new $ZodAsyncError();}if(result.issues.length){var _params$Err;const e=new((_params$Err=_params===null||_params===void 0?void 0:_params.Err)!==null&&_params$Err!==void 0?_params$Err:_Err)(result.issues.map(iss=>finalizeIssue(iss,ctx,config())));Error.captureStackTrace(e,_params===null||_params===void 0?void 0:_params.callee);throw e;}return result.value;};const _parseAsync=_Err=>(/*#__PURE__*/function(){var _ref4=_asyncToGenerator(function*(schema,value,_ctx,params){const ctx=_ctx?Object.assign(_ctx,{async:true}):{async:true};let result=schema._zod.run({value,issues:[]},ctx);if(result instanceof Promise)result=yield result;if(result.issues.length){var _params$Err2;const e=new((_params$Err2=params===null||params===void 0?void 0:params.Err)!==null&&_params$Err2!==void 0?_params$Err2:_Err)(result.issues.map(iss=>finalizeIssue(iss,ctx,config())));Error.captureStackTrace(e,params===null||params===void 0?void 0:params.callee);throw e;}return result.value;});return function(_x3,_x4,_x5,_x6){return _ref4.apply(this,arguments);};}());const _safeParse=_Err=>(schema,value,_ctx)=>{const ctx=_ctx?Object.assign(_ctx,{async:false}):{async:false};const result=schema._zod.run({value,issues:[]},ctx);if(result instanceof Promise){throw new $ZodAsyncError();}return result.issues.length?{success:false,error:new(_Err!==null&&_Err!==void 0?_Err:$ZodError)(result.issues.map(iss=>finalizeIssue(iss,ctx,config())))}:{success:true,data:result.value};};const _safeParseAsync=_Err=>(/*#__PURE__*/function(){var _ref5=_asyncToGenerator(function*(schema,value,_ctx){const ctx=_ctx?Object.assign(_ctx,{async:true}):{async:true};let result=schema._zod.run({value,issues:[]},ctx);if(result instanceof Promise)result=yield result;return result.issues.length?{success:false,error:new _Err(result.issues.map(iss=>finalizeIssue(iss,ctx,config())))}:{success:true,data:result.value};});return function(_x7,_x8,_x9){return _ref5.apply(this,arguments);};}());const cuid=/^[cC][^\s-]{8,}$/;const cuid2=/^[0-9a-z]+$/;const ulid=/^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;const xid=/^[0-9a-vA-V]{20}$/;const ksuid=/^[A-Za-z0-9]{27}$/;const nanoid=/^[a-zA-Z0-9_-]{21}$/;/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */const duration$1=/^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */const guid=/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;/** Returns a regex for validating an RFC 4122 UUID.
 *
 * @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */const uuid$1=version=>{if(!version)return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000)$/;return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);};/** Practical email validation */const email=/^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;// from https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
const _emoji$1=`^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;function emoji(){return new RegExp(_emoji$1,"u");}const ipv4=/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;const ipv6=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})$/;const cidrv4=/^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;const cidrv6=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;// https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
const base64=/^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;const base64url=/^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;// based on https://stackoverflow.com/questions/106179/regular-expression-to-match-dns-hostname-or-ip-address
// export const hostname: RegExp =
//   /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
const hostname=/^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/;// https://blog.stevenlevithan.com/archives/validate-phone-number#r4-3 (regex sans spaces)
const e164=/^\+(?:[0-9]){6,14}[0-9]$/;const dateSource=`((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;const date$1=new RegExp(`^${dateSource}$`);function timeSource(args){// let regex = `\\d{2}:\\d{2}:\\d{2}`;
let regex=`([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d`;if(args.precision){regex=`${regex}\\.\\d{${args.precision}}`;}else if(args.precision==null){regex=`${regex}(\\.\\d+)?`;}return regex;}function time$1(args){return new RegExp(`^${timeSource(args)}$`);}// Adapted from https://stackoverflow.com/a/3143231
function datetime$1(args){let regex=`${dateSource}T${timeSource(args)}`;const opts=[];opts.push(args.local?`Z?`:`Z`);if(args.offset)opts.push(`([+-]\\d{2}:?\\d{2})`);regex=`${regex}(${opts.join("|")})`;return new RegExp(`^${regex}$`);}const string$1=params=>{var _params$minimum,_params$maximum;const regex=params?`[\\s\\S]{${(_params$minimum=params===null||params===void 0?void 0:params.minimum)!==null&&_params$minimum!==void 0?_params$minimum:0},${(_params$maximum=params===null||params===void 0?void 0:params.maximum)!==null&&_params$maximum!==void 0?_params$maximum:""}}`:`[\\s\\S]*`;return new RegExp(`^${regex}$`);};const integer=/^\d+$/;const number$1=/^-?\d+(?:\.\d+)?/i;const boolean$1=/true|false/i;// regex for string with no uppercase letters
const lowercase=/^[^A-Z]*$/;// regex for string with no lowercase letters
const uppercase=/^[^a-z]*$/;// import { $ZodType } from "./schemas.js";
const $ZodCheck=/*@__PURE__*/$constructor("$ZodCheck",(inst,def)=>{var _inst$_zod3,_a$onattach;var _a;(_inst$_zod3=inst._zod)!==null&&_inst$_zod3!==void 0?_inst$_zod3:inst._zod={};inst._zod.def=def;(_a$onattach=(_a=inst._zod).onattach)!==null&&_a$onattach!==void 0?_a$onattach:_a.onattach=[];});const numericOriginMap={number:"number",bigint:"bigint",object:"date"};const $ZodCheckLessThan=/*@__PURE__*/$constructor("$ZodCheckLessThan",(inst,def)=>{$ZodCheck.init(inst,def);const origin=numericOriginMap[typeof def.value];inst._zod.onattach.push(inst=>{var _inst$_zod$computed$m;const curr=(_inst$_zod$computed$m=inst._zod.computed.maximum)!==null&&_inst$_zod$computed$m!==void 0?_inst$_zod$computed$m:Number.POSITIVE_INFINITY;if(def.value<curr){inst._zod.computed.maximum=def.value;inst._zod.computed.inclusive=def.inclusive;}});inst._zod.check=payload=>{if(def.inclusive?payload.value<=def.value:payload.value<def.value){return;}payload.issues.push({origin,code:"too_big",maximum:def.value,input:payload.value,inclusive:def.inclusive,inst,continue:!def.abort});};});const $ZodCheckGreaterThan=/*@__PURE__*/$constructor("$ZodCheckGreaterThan",(inst,def)=>{$ZodCheck.init(inst,def);const origin=numericOriginMap[typeof def.value];inst._zod.onattach.push(inst=>{var _inst$_zod$computed$m2;const curr=(_inst$_zod$computed$m2=inst._zod.computed.minimum)!==null&&_inst$_zod$computed$m2!==void 0?_inst$_zod$computed$m2:Number.NEGATIVE_INFINITY;if(def.value>curr){inst._zod.computed.minimum=def.value;inst._zod.computed.inclusive=def.inclusive;}});inst._zod.check=payload=>{if(def.inclusive?payload.value>=def.value:payload.value>def.value){return;}payload.issues.push({origin:origin,code:"too_small",minimum:def.value,input:payload.value,inclusive:def.inclusive,inst,continue:!def.abort});};});const $ZodCheckMultipleOf=/*@__PURE__*/$constructor("$ZodCheckMultipleOf",(inst,def)=>{$ZodCheck.init(inst,def);inst._zod.onattach.push(inst=>{var _a$multipleOf;var _a;(_a$multipleOf=(_a=inst._zod.computed).multipleOf)!==null&&_a$multipleOf!==void 0?_a$multipleOf:_a.multipleOf=def.value;});inst._zod.check=payload=>{if(typeof payload.value!==typeof def.value)throw new Error("Cannot mix number and bigint in multiple_of check.");const isMultiple=typeof payload.value==="bigint"?payload.value%def.value===BigInt(0):floatSafeRemainder(payload.value,def.value)===0;if(isMultiple)return;payload.issues.push({origin:typeof payload.value,code:"not_multiple_of",divisor:def.value,input:payload.value,inst,continue:!def.abort});};});const $ZodCheckNumberFormat=/*@__PURE__*/$constructor("$ZodCheckNumberFormat",(inst,def)=>{var _def$format;$ZodCheck.init(inst,def);// no format checks
def.format=def.format||"float64";const isInt=(_def$format=def.format)===null||_def$format===void 0?void 0:_def$format.includes("int");const origin=isInt?"int":"number";const[minimum,maximum]=NUMBER_FORMAT_RANGES[def.format];inst._zod.onattach.push(inst=>{inst._zod.computed.format=def.format;inst._zod.computed.minimum=minimum;inst._zod.computed.maximum=maximum;inst._zod.computed.inclusive=true;if(isInt)inst._zod.computed.pattern=integer;});inst._zod.check=payload=>{const input=payload.value;if(isInt){if(!Number.isInteger(input)){// invalid_type issue
payload.issues.push({expected:origin,format:def.format,code:"invalid_type",input,inst});return;// not_multiple_of issue
// payload.issues.push({
//   code: "not_multiple_of",
//   origin: "number",
//   input,
//   inst,
//   divisor: 1,
// });
}if(!Number.isSafeInteger(input)){if(input>0){// too_big
payload.issues.push({input,code:"too_big",maximum:Number.MAX_SAFE_INTEGER,note:"Integers must be within the the safe integer range.",inst,origin,continue:!def.abort});}else{// too_small
payload.issues.push({input,code:"too_small",minimum:Number.MIN_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst,origin,continue:!def.abort});}return;}}if(input<minimum){payload.issues.push({origin:"number",input:input,code:"too_small",minimum:minimum,inclusive:true,inst,continue:!def.abort});}if(input>maximum){payload.issues.push({origin:"number",input,code:"too_big",maximum,inst});}};});const $ZodCheckMaxLength=/*@__PURE__*/$constructor("$ZodCheckMaxLength",(inst,def)=>{$ZodCheck.init(inst,def);inst._zod.when=payload=>{const val=payload.value;return!nullish(val)&&val.length!==undefined;};inst._zod.onattach.push(inst=>{var _inst$_zod$computed$m3;const curr=(_inst$_zod$computed$m3=inst._zod.computed.maximum)!==null&&_inst$_zod$computed$m3!==void 0?_inst$_zod$computed$m3:Number.POSITIVE_INFINITY;if(def.maximum<curr)inst._zod.computed.maximum=def.maximum;});inst._zod.check=payload=>{const input=payload.value;const length=input.length;if(length<=def.maximum)return;const origin=getLengthableOrigin(input);payload.issues.push({origin,code:"too_big",maximum:def.maximum,input,inst,continue:!def.abort});};});const $ZodCheckMinLength=/*@__PURE__*/$constructor("$ZodCheckMinLength",(inst,def)=>{$ZodCheck.init(inst,def);inst._zod.when=payload=>{const val=payload.value;return!nullish(val)&&val.length!==undefined;};inst._zod.onattach.push(inst=>{var _inst$_zod$computed$m4;const curr=(_inst$_zod$computed$m4=inst._zod.computed.minimum)!==null&&_inst$_zod$computed$m4!==void 0?_inst$_zod$computed$m4:Number.NEGATIVE_INFINITY;if(def.minimum>curr)inst._zod.computed.minimum=def.minimum;});inst._zod.check=payload=>{const input=payload.value;const length=input.length;if(length>=def.minimum)return;const origin=getLengthableOrigin(input);payload.issues.push({origin,code:"too_small",minimum:def.minimum,input,inst,continue:!def.abort});};});const $ZodCheckLengthEquals=/*@__PURE__*/$constructor("$ZodCheckLengthEquals",(inst,def)=>{$ZodCheck.init(inst,def);inst._zod.when=payload=>{const val=payload.value;return!nullish(val)&&val.length!==undefined;};inst._zod.onattach.push(inst=>{inst._zod.computed.minimum=def.length;inst._zod.computed.maximum=def.length;inst._zod.computed.length=def.length;});inst._zod.check=payload=>{const input=payload.value;const length=input.length;if(length===def.length)return;const origin=getLengthableOrigin(input);const tooBig=length>def.length;payload.issues.push(_objectSpread(_objectSpread({origin},tooBig?{code:"too_big",maximum:def.length}:{code:"too_small",minimum:def.length}),{},{input:payload.value,inst,continue:!def.abort}));};});const $ZodCheckStringFormat=/*@__PURE__*/$constructor("$ZodCheckStringFormat",(inst,def)=>{var _a$check;var _a;$ZodCheck.init(inst,def);inst._zod.onattach.push(inst=>{inst._zod.computed.format=def.format;if(def.pattern)inst._zod.computed.pattern=def.pattern;});(_a$check=(_a=inst._zod).check)!==null&&_a$check!==void 0?_a$check:_a.check=payload=>{if(!def.pattern)throw new Error("Not implemented.");def.pattern.lastIndex=0;if(def.pattern.test(payload.value))return;payload.issues.push(_objectSpread(_objectSpread({origin:"string",code:"invalid_format",format:def.format,input:payload.value},def.pattern?{pattern:def.pattern.toString()}:{}),{},{inst,continue:!def.abort}));};});const $ZodCheckRegex=/*@__PURE__*/$constructor("$ZodCheckRegex",(inst,def)=>{$ZodCheckStringFormat.init(inst,def);inst._zod.check=payload=>{def.pattern.lastIndex=0;if(def.pattern.test(payload.value))return;payload.issues.push({origin:"string",code:"invalid_format",format:"regex",input:payload.value,pattern:def.pattern.toString(),inst,continue:!def.abort});};});const $ZodCheckLowerCase=/*@__PURE__*/$constructor("$ZodCheckLowerCase",(inst,def)=>{var _def$pattern;(_def$pattern=def.pattern)!==null&&_def$pattern!==void 0?_def$pattern:def.pattern=lowercase;$ZodCheckStringFormat.init(inst,def);});const $ZodCheckUpperCase=/*@__PURE__*/$constructor("$ZodCheckUpperCase",(inst,def)=>{var _def$pattern2;(_def$pattern2=def.pattern)!==null&&_def$pattern2!==void 0?_def$pattern2:def.pattern=uppercase;$ZodCheckStringFormat.init(inst,def);});const $ZodCheckIncludes=/*@__PURE__*/$constructor("$ZodCheckIncludes",(inst,def)=>{$ZodCheck.init(inst,def);const pattern=new RegExp(escapeRegex(def.includes));def.pattern=pattern;inst._zod.onattach.push(inst=>{inst._zod.computed.pattern=pattern;});inst._zod.check=payload=>{if(payload.value.includes(def.includes,def.position))return;payload.issues.push({origin:"string",code:"invalid_format",format:"includes",includes:def.includes,input:payload.value,inst,continue:!def.abort});};});const $ZodCheckStartsWith=/*@__PURE__*/$constructor("$ZodCheckStartsWith",(inst,def)=>{var _def$pattern3;$ZodCheck.init(inst,def);const pattern=new RegExp(`^${escapeRegex(def.prefix)}.*`);(_def$pattern3=def.pattern)!==null&&_def$pattern3!==void 0?_def$pattern3:def.pattern=pattern;inst._zod.onattach.push(inst=>{inst._zod.computed.pattern=pattern;});inst._zod.check=payload=>{if(payload.value.startsWith(def.prefix))return;payload.issues.push({origin:"string",code:"invalid_format",format:"starts_with",prefix:def.prefix,input:payload.value,inst,continue:!def.abort});};});const $ZodCheckEndsWith=/*@__PURE__*/$constructor("$ZodCheckEndsWith",(inst,def)=>{var _def$pattern4;$ZodCheck.init(inst,def);const pattern=new RegExp(`.*${escapeRegex(def.suffix)}$`);(_def$pattern4=def.pattern)!==null&&_def$pattern4!==void 0?_def$pattern4:def.pattern=pattern;inst._zod.onattach.push(inst=>{inst._zod.computed.pattern=new RegExp(`.*${escapeRegex(def.suffix)}$`);});inst._zod.check=payload=>{if(payload.value.endsWith(def.suffix))return;payload.issues.push({origin:"string",code:"invalid_format",format:"ends_with",suffix:def.suffix,input:payload.value,inst,continue:!def.abort});};});const $ZodCheckOverwrite=/*@__PURE__*/$constructor("$ZodCheckOverwrite",(inst,def)=>{$ZodCheck.init(inst,def);inst._zod.check=payload=>{payload.value=def.tx(payload.value);};});class Doc{constructor(args=[]){this.content=[];this.indent=0;if(this)this.args=args;}indented(fn){this.indent+=1;fn(this);this.indent-=1;}write(arg){if(typeof arg==="function"){arg(this,{execution:"sync"});arg(this,{execution:"async"});return;}const content=arg;const lines=content.split("\n").filter(x=>x);const minIndent=Math.min(...lines.map(x=>x.length-x.trimStart().length));const dedented=lines.map(x=>x.slice(minIndent)).map(x=>" ".repeat(this.indent*2)+x);for(const line of dedented){this.content.push(line);}}compile(){var _this$content;const args=this===null||this===void 0?void 0:this.args;const content=(_this$content=this===null||this===void 0?void 0:this.content)!==null&&_this$content!==void 0?_this$content:[``];const lines=[...content.map(x=>`  ${x}`)];return new Function(...args,lines.join("\n"));}}const version={major:4,minor:0,patch:0};const $ZodType=/*@__PURE__*/$constructor("$ZodType",(inst,def)=>{var _inst$_zod$def$checks;var _a;inst!==null&&inst!==void 0?inst:inst={};inst._zod.id=def.type+"_"+randomString(10);inst._zod.def=def;// set _def property
inst._zod.computed=inst._zod.computed||{};// initialize _computed object
inst._zod.version=version;const checks=[...((_inst$_zod$def$checks=inst._zod.def.checks)!==null&&_inst$_zod$def$checks!==void 0?_inst$_zod$def$checks:[])];// if inst is itself a checks.$ZodCheck, run it as a check
if(inst._zod.traits.has("$ZodCheck")){checks.unshift(inst);}//
for(const ch of checks){for(const fn of ch._zod.onattach){fn(inst);}}if(checks.length===0){var _a$deferred2,_inst$_zod$deferred;// deferred initializer
// inst._zod.parse is not yet defined
(_a$deferred2=(_a=inst._zod).deferred)!==null&&_a$deferred2!==void 0?_a$deferred2:_a.deferred=[];(_inst$_zod$deferred=inst._zod.deferred)===null||_inst$_zod$deferred===void 0||_inst$_zod$deferred.push(()=>{inst._zod.run=inst._zod.parse;});}else{const runChecks=(payload,checks,ctx)=>{let isAborted=aborted(payload);let asyncResult;for(const ch of checks){if(ch._zod.when){const shouldRun=ch._zod.when(payload);if(!shouldRun)continue;}else{if(isAborted){continue;}}const currLen=payload.issues.length;const _=ch._zod.check(payload);if(_ instanceof Promise&&(ctx===null||ctx===void 0?void 0:ctx.async)===false){throw new $ZodAsyncError();}if(asyncResult||_ instanceof Promise){asyncResult=(asyncResult!==null&&asyncResult!==void 0?asyncResult:Promise.resolve()).then(/*#__PURE__*/_asyncToGenerator(function*(){yield _;const nextLen=payload.issues.length;if(nextLen===currLen)return;if(!isAborted)isAborted=aborted(payload,currLen);}));}else{const nextLen=payload.issues.length;if(nextLen===currLen)continue;if(!isAborted)isAborted=aborted(payload,currLen);}}if(asyncResult){return asyncResult.then(()=>{return payload;});}return payload;};inst._zod.run=(payload,ctx)=>{const result=inst._zod.parse(payload,ctx);if(result instanceof Promise){if(ctx.async===false)throw new $ZodAsyncError();return result.then(result=>runChecks(result,checks,ctx));}return runChecks(result,checks,ctx);};}inst["~standard"]={validate:value=>{const result=inst._zod.run({value,issues:[]},{});if(result instanceof Promise){return result.then(({issues,value})=>{if(issues.length===0)return{value};return{issues:issues.map(iss=>finalizeIssue(iss,{},config()))};});}if(result.issues.length===0)return{value:result.value};return{issues:result.issues.map(iss=>finalizeIssue(iss,{},config()))};},vendor:"zod",version:1};});const $ZodString=/*@__PURE__*/$constructor("$ZodString",(inst,def)=>{var _inst$_zod$computed$p,_inst$_zod$computed;$ZodType.init(inst,def);inst._zod.pattern=(_inst$_zod$computed$p=inst===null||inst===void 0||(_inst$_zod$computed=inst._zod.computed)===null||_inst$_zod$computed===void 0?void 0:_inst$_zod$computed.pattern)!==null&&_inst$_zod$computed$p!==void 0?_inst$_zod$computed$p:string$1(inst._zod.computed);inst._zod.parse=(payload,_)=>{if(def.coerce)try{payload.value=String(payload.value);}catch(_){}if(typeof payload.value==="string")return payload;payload.issues.push({expected:"string",code:"invalid_type",input:payload.value,inst});return payload;};});const $ZodStringFormat=/*@__PURE__*/$constructor("$ZodStringFormat",(inst,def)=>{// check initialization must come first
$ZodCheckStringFormat.init(inst,def);$ZodString.init(inst,def);});const $ZodGUID=/*@__PURE__*/$constructor("$ZodGUID",(inst,def)=>{var _def$pattern5;(_def$pattern5=def.pattern)!==null&&_def$pattern5!==void 0?_def$pattern5:def.pattern=guid;$ZodStringFormat.init(inst,def);});const $ZodUUID=/*@__PURE__*/$constructor("$ZodUUID",(inst,def)=>{var _def$pattern7;if(def.version){var _def$pattern6;const versionMap={v1:1,v2:2,v3:3,v4:4,v5:5,v6:6,v7:7,v8:8};const v=versionMap[def.version];if(v===undefined)throw new Error(`Invalid UUID version: "${def.version}"`);(_def$pattern6=def.pattern)!==null&&_def$pattern6!==void 0?_def$pattern6:def.pattern=uuid$1(v);}else(_def$pattern7=def.pattern)!==null&&_def$pattern7!==void 0?_def$pattern7:def.pattern=uuid$1();$ZodStringFormat.init(inst,def);});const $ZodEmail=/*@__PURE__*/$constructor("$ZodEmail",(inst,def)=>{var _def$pattern8;(_def$pattern8=def.pattern)!==null&&_def$pattern8!==void 0?_def$pattern8:def.pattern=email;$ZodStringFormat.init(inst,def);});const $ZodURL=/*@__PURE__*/$constructor("$ZodURL",(inst,def)=>{$ZodStringFormat.init(inst,def);inst._zod.check=payload=>{try{const url=new URL(payload.value);hostname.lastIndex=0;if(!hostname.test(url.hostname)){payload.issues.push({code:"invalid_format",format:"url",note:"Invalid hostname",pattern:hostname.source,input:payload.value,inst});}if(def.hostname){def.hostname.lastIndex=0;if(!def.hostname.test(url.hostname)){payload.issues.push({code:"invalid_format",format:"url",note:"Invalid hostname",pattern:def.hostname.source,input:payload.value,inst});}}if(def.protocol){def.protocol.lastIndex=0;if(!def.protocol.test(url.protocol.endsWith(":")?url.protocol.slice(0,-1):url.protocol)){payload.issues.push({code:"invalid_format",format:"url",note:"Invalid protocol",pattern:def.protocol.source,input:payload.value,inst});}}return;}catch(_){payload.issues.push({code:"invalid_format",format:"url",input:payload.value,inst});}};});const $ZodEmoji=/*@__PURE__*/$constructor("$ZodEmoji",(inst,def)=>{var _def$pattern9;(_def$pattern9=def.pattern)!==null&&_def$pattern9!==void 0?_def$pattern9:def.pattern=emoji();$ZodStringFormat.init(inst,def);});const $ZodNanoID=/*@__PURE__*/$constructor("$ZodNanoID",(inst,def)=>{var _def$pattern0;(_def$pattern0=def.pattern)!==null&&_def$pattern0!==void 0?_def$pattern0:def.pattern=nanoid;$ZodStringFormat.init(inst,def);});const $ZodCUID=/*@__PURE__*/$constructor("$ZodCUID",(inst,def)=>{var _def$pattern1;(_def$pattern1=def.pattern)!==null&&_def$pattern1!==void 0?_def$pattern1:def.pattern=cuid;$ZodStringFormat.init(inst,def);});const $ZodCUID2=/*@__PURE__*/$constructor("$ZodCUID2",(inst,def)=>{var _def$pattern10;(_def$pattern10=def.pattern)!==null&&_def$pattern10!==void 0?_def$pattern10:def.pattern=cuid2;$ZodStringFormat.init(inst,def);});const $ZodULID=/*@__PURE__*/$constructor("$ZodULID",(inst,def)=>{var _def$pattern11;(_def$pattern11=def.pattern)!==null&&_def$pattern11!==void 0?_def$pattern11:def.pattern=ulid;$ZodStringFormat.init(inst,def);});const $ZodXID=/*@__PURE__*/$constructor("$ZodXID",(inst,def)=>{var _def$pattern12;(_def$pattern12=def.pattern)!==null&&_def$pattern12!==void 0?_def$pattern12:def.pattern=xid;$ZodStringFormat.init(inst,def);});const $ZodKSUID=/*@__PURE__*/$constructor("$ZodKSUID",(inst,def)=>{var _def$pattern13;(_def$pattern13=def.pattern)!==null&&_def$pattern13!==void 0?_def$pattern13:def.pattern=ksuid;$ZodStringFormat.init(inst,def);});const $ZodISODateTime=/*@__PURE__*/$constructor("$ZodISODateTime",(inst,def)=>{var _def$pattern14;(_def$pattern14=def.pattern)!==null&&_def$pattern14!==void 0?_def$pattern14:def.pattern=datetime$1(def);$ZodStringFormat.init(inst,def);});const $ZodISODate=/*@__PURE__*/$constructor("$ZodISODate",(inst,def)=>{var _def$pattern15;(_def$pattern15=def.pattern)!==null&&_def$pattern15!==void 0?_def$pattern15:def.pattern=date$1;$ZodStringFormat.init(inst,def);});const $ZodISOTime=/*@__PURE__*/$constructor("$ZodISOTime",(inst,def)=>{var _def$pattern16;(_def$pattern16=def.pattern)!==null&&_def$pattern16!==void 0?_def$pattern16:def.pattern=time$1(def);$ZodStringFormat.init(inst,def);});const $ZodISODuration=/*@__PURE__*/$constructor("$ZodISODuration",(inst,def)=>{var _def$pattern17;(_def$pattern17=def.pattern)!==null&&_def$pattern17!==void 0?_def$pattern17:def.pattern=duration$1;$ZodStringFormat.init(inst,def);});const $ZodIPv4=/*@__PURE__*/$constructor("$ZodIPv4",(inst,def)=>{var _def$pattern18;(_def$pattern18=def.pattern)!==null&&_def$pattern18!==void 0?_def$pattern18:def.pattern=ipv4;$ZodStringFormat.init(inst,def);inst._zod.onattach.push(inst=>{inst._zod.computed.format=`ipv4`;});});const $ZodIPv6=/*@__PURE__*/$constructor("$ZodIPv6",(inst,def)=>{var _def$pattern19;(_def$pattern19=def.pattern)!==null&&_def$pattern19!==void 0?_def$pattern19:def.pattern=ipv6;$ZodStringFormat.init(inst,def);inst._zod.onattach.push(inst=>{inst._zod.computed.format=`ipv6`;});inst._zod.check=payload=>{try{new URL(`http://[${payload.value}]`);// return;
}catch(_unused){payload.issues.push({code:"invalid_format",format:"ipv6",input:payload.value,inst});}};});const $ZodCIDRv4=/*@__PURE__*/$constructor("$ZodCIDRv4",(inst,def)=>{var _def$pattern20;(_def$pattern20=def.pattern)!==null&&_def$pattern20!==void 0?_def$pattern20:def.pattern=cidrv4;$ZodStringFormat.init(inst,def);});const $ZodCIDRv6=/*@__PURE__*/$constructor("$ZodCIDRv6",(inst,def)=>{var _def$pattern21;(_def$pattern21=def.pattern)!==null&&_def$pattern21!==void 0?_def$pattern21:def.pattern=cidrv6;// not used for validation
$ZodStringFormat.init(inst,def);inst._zod.check=payload=>{const[address,prefix]=payload.value.split("/");try{if(!prefix)throw new Error();const prefixNum=Number(prefix);if(`${prefixNum}`!==prefix)throw new Error();if(prefixNum<0||prefixNum>128)throw new Error();new URL(`http://[${address}]`);}catch(_unused2){payload.issues.push({code:"invalid_format",format:"cidrv6",input:payload.value,inst});}};});const $ZodBase64=/*@__PURE__*/$constructor("$ZodBase64",(inst,def)=>{var _def$pattern22;(_def$pattern22=def.pattern)!==null&&_def$pattern22!==void 0?_def$pattern22:def.pattern=base64;$ZodStringFormat.init(inst,def);inst._zod.onattach.push(inst=>{inst._zod.computed.contentEncoding="base64";});});const $ZodBase64URL=/*@__PURE__*/$constructor("$ZodBase64URL",(inst,def)=>{var _def$pattern23;(_def$pattern23=def.pattern)!==null&&_def$pattern23!==void 0?_def$pattern23:def.pattern=base64url;$ZodStringFormat.init(inst,def);inst._zod.onattach.push(inst=>{inst._zod.computed.contentEncoding="base64url";});});const $ZodE164=/*@__PURE__*/$constructor("$ZodE164",(inst,def)=>{var _def$pattern24;(_def$pattern24=def.pattern)!==null&&_def$pattern24!==void 0?_def$pattern24:def.pattern=e164;$ZodStringFormat.init(inst,def);});//////////////////////////////   ZodJWT   //////////////////////////////
function isValidJWT(token,algorithm=null){try{const tokensParts=token.split(".");if(tokensParts.length!==3)return false;const[header]=tokensParts;const parsedHeader=JSON.parse(atob(header));if("typ"in parsedHeader&&(parsedHeader===null||parsedHeader===void 0?void 0:parsedHeader.typ)!=="JWT")return false;if(algorithm&&(!("alg"in parsedHeader)||parsedHeader.alg!==algorithm))return false;return true;}catch(_unused3){return false;}}const $ZodJWT=/*@__PURE__*/$constructor("$ZodJWT",(inst,def)=>{$ZodStringFormat.init(inst,def);inst._zod.check=payload=>{if(isValidJWT(payload.value,def.alg))return;payload.issues.push({code:"invalid_format",format:"jwt",input:payload.value,inst});};});const $ZodNumber=/*@__PURE__*/$constructor("$ZodNumber",(inst,def)=>{var _inst$_zod$computed$p2;$ZodType.init(inst,def);inst._zod.pattern=(_inst$_zod$computed$p2=inst._zod.computed.pattern)!==null&&_inst$_zod$computed$p2!==void 0?_inst$_zod$computed$p2:number$1;inst._zod.parse=(payload,_ctx)=>{if(def.coerce)try{payload.value=Number(payload.value);}catch(_){}const input=payload.value;if(typeof input==="number"&&!Number.isNaN(input)&&Number.isFinite(input)){return payload;}const received=typeof input==="number"?Number.isNaN(input)?"NaN":!Number.isFinite(input)?"Infinity":undefined:undefined;payload.issues.push(_objectSpread({expected:"number",code:"invalid_type",input,inst},received?{received}:{}));return payload;};});const $ZodNumberFormat=/*@__PURE__*/$constructor("$ZodNumber",(inst,def)=>{$ZodCheckNumberFormat.init(inst,def);$ZodNumber.init(inst,def);// no format checksp
});const $ZodBoolean=/*@__PURE__*/$constructor("$ZodBoolean",(inst,def)=>{$ZodType.init(inst,def);inst._zod.pattern=boolean$1;inst._zod.parse=(payload,_ctx)=>{if(def.coerce)try{payload.value=Boolean(payload.value);}catch(_){}const input=payload.value;if(typeof input==="boolean")return payload;payload.issues.push({expected:"boolean",code:"invalid_type",input,inst});return payload;};});const $ZodAny=/*@__PURE__*/$constructor("$ZodAny",(inst,def)=>{$ZodType.init(inst,def);inst._zod.parse=payload=>payload;});const $ZodUnknown=/*@__PURE__*/$constructor("$ZodUnknown",(inst,def)=>{$ZodType.init(inst,def);inst._zod.parse=payload=>payload;});const $ZodNever=/*@__PURE__*/$constructor("$ZodNever",(inst,def)=>{$ZodType.init(inst,def);inst._zod.parse=(payload,_ctx)=>{payload.issues.push({expected:"never",code:"invalid_type",input:payload.value,inst});return payload;};});function handleArrayResult(result,final,index){if(result.issues.length){final.issues.push(...prefixIssues(index,result.issues));}final.value[index]=result.value;}const $ZodArray=/*@__PURE__*/$constructor("$ZodArray",(inst,def)=>{$ZodType.init(inst,def);inst._zod.parse=(payload,ctx)=>{const input=payload.value;if(!Array.isArray(input)){payload.issues.push({expected:"array",code:"invalid_type",input,inst});return payload;}payload.value=Array(input.length);const proms=[];for(let i=0;i<input.length;i++){const item=input[i];const result=def.element._zod.run({value:item,issues:[]},ctx);if(result instanceof Promise){proms.push(result.then(result=>handleArrayResult(result,payload,i)));}else{handleArrayResult(result,payload,i);}}if(proms.length){return Promise.all(proms).then(()=>payload);}return payload;//handleArrayResultsAsync(parseResults, final);
};});function handleObjectResult(result,final,key){// if(isOptional)
if(result.issues.length){final.issues.push(...prefixIssues(key,result.issues));}else{final.value[key]=result.value;}}function handleOptionalObjectResult(result,final,key,input){if(result.issues.length){// validation failed against value schema
if(input[key]===undefined){// if input was undefined, ignore the error
if(key in input){final.value[key]=undefined;}}else{final.issues.push(...prefixIssues(key,result.issues));}}else if(result.value===undefined){// validation returned `undefined`
if(key in input)final.value[key]=undefined;}else{// non-undefined value
final.value[key]=result.value;}}const $ZodObject=/*@__PURE__*/$constructor("$ZodObject",(inst,def)=>{$ZodType.init(inst,def);const _normalized=cached(()=>{const keys=Object.keys(def.shape);const okeys=optionalKeys(def.shape);return{shape:def.shape,keys,keySet:new Set(keys),numKeys:keys.length,optionalKeys:new Set(okeys)};});defineLazy(inst._zod,"disc",()=>{const shape=def.shape;const discMap=new Map();let hasDisc=false;for(const key in shape){const field=shape[key]._zod;if(field.values||field.disc){var _field$values;hasDisc=true;const o={values:new Set((_field$values=field.values)!==null&&_field$values!==void 0?_field$values:[]),maps:field.disc?[field.disc]:[]};discMap.set(key,o);}}if(!hasDisc){return undefined;}return discMap;});const generateFastpass=shape=>{const doc=new Doc(["shape","payload","ctx"]);const{keys,optionalKeys}=_normalized.value;const parseStr=key=>{const k=esc(key);return`shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;};// doc.write(`const shape = inst._zod.def.shape;`);
doc.write(`const input = payload.value;`);const ids=Object.create(null);for(const key of keys){ids[key]=randomString(15);}for(const key of keys){if(optionalKeys.has(key))continue;const id=ids[key];doc.write(`const ${id} = ${parseStr(key)};`);doc.write(`
          if (${id}.issues.length) payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${esc(key)}, ...iss.path] : [${esc(key)}]
          })));`);}doc.write(`payload.value = {`);doc.indented(()=>{for(const key of keys){if(optionalKeys.has(key))continue;const id=ids[key];doc.write(`  ${esc(key)}: ${id}.value,`);}});doc.write(`}`);// NEW: always run validation
// this lets default values get applied to optionals
for(const key of keys){if(!optionalKeys.has(key))continue;const id=ids[key];doc.write(`const ${id} = ${parseStr(key)};`);const k=esc(key);doc.write(`
        if (${id}.issues.length) {
          if (input[${k}] === undefined) {
            if (${k} in input) {
              payload.value[${k}] = undefined;
            }
          } else {
            payload.issues = payload.issues.concat(
              ${id}.issues.map((iss) => ({
                ...iss,
                path: iss.path ? [${k}, ...iss.path] : [${k}],
              }))
            );
          }
        } else if (${id}.value === undefined) {
          if (${k} in input) payload.value[${k}] = undefined;
        } else {
          payload.value[${k}] = ${id}.value;
        }  
        `);}doc.write(`return payload;`);const fn=doc.compile();return(payload,ctx)=>fn(shape,payload,ctx);};let fastpass;const isObject$1=isObject;const jit=!globalConfig.jitless;const allowsEval$1=allowsEval;const fastEnabled=jit&&allowsEval$1.value;// && !def.catchall;
const{catchall}=def;let value;inst._zod.parse=(payload,ctx)=>{value!==null&&value!==void 0?value:value=_normalized.value;const input=payload.value;if(!isObject$1(input)){payload.issues.push({expected:"object",code:"invalid_type",input,inst});return payload;}const proms=[];if(jit&&fastEnabled&&(ctx===null||ctx===void 0?void 0:ctx.async)===false&&ctx.jitless!==true){// always synchronous
if(!fastpass)fastpass=generateFastpass(def.shape);payload=fastpass(payload,ctx);}else{payload.value={};const shape=value.shape;for(const key of value.keys){const el=shape[key];// do not add omitted optional keys
// if (!(key in input)) {
//   if (optionalKeys.has(key)) continue;
//   payload.issues.push({
//     code: "invalid_type",
//     path: [key],
//     expected: "nonoptional",
//     note: `Missing required key: "${key}"`,
//     input,
//     inst,
//   });
// }
const r=el._zod.run({value:input[key],issues:[]},ctx);const isOptional=el._zod.optionality==="optional";if(r instanceof Promise){proms.push(r.then(r=>isOptional?handleOptionalObjectResult(r,payload,key,input):handleObjectResult(r,payload,key)));}else{if(isOptional){handleOptionalObjectResult(r,payload,key,input);}else{handleObjectResult(r,payload,key);}}}}if(!catchall){// return payload;
return proms.length?Promise.all(proms).then(()=>payload):payload;}const unrecognized=[];// iterate over input keys
const keySet=value.keySet;const _catchall=catchall._zod;const t=_catchall.def.type;for(const key of Object.keys(input)){if(keySet.has(key))continue;if(t==="never"){unrecognized.push(key);continue;}const r=_catchall.run({value:input[key],issues:[]},ctx);if(r instanceof Promise){proms.push(r.then(r=>handleObjectResult(r,payload,key)));}else{handleObjectResult(r,payload,key);}}if(unrecognized.length){payload.issues.push({code:"unrecognized_keys",keys:unrecognized,input,inst});}if(!proms.length)return payload;return Promise.all(proms).then(()=>{return payload;});};});function handleUnionResults(results,final,inst,ctx){for(const result of results){if(result.issues.length===0){final.value=result.value;return final;}}final.issues.push({code:"invalid_union",input:final.value,inst,errors:results.map(result=>result.issues.map(iss=>finalizeIssue(iss,ctx,config())))});return final;}const $ZodUnion=/*@__PURE__*/$constructor("$ZodUnion",(inst,def)=>{$ZodType.init(inst,def);const values=new Set();if(def.options.every(o=>o._zod.values)){for(const option of def.options){for(const v of option._zod.values){values.add(v);}}inst._zod.values=values;}// computed union regex for pattern if all options have pattern
if(def.options.every(o=>o._zod.pattern)){const patterns=def.options.map(o=>o._zod.pattern);inst._zod.pattern=new RegExp(`^(${patterns.map(p=>cleanRegex(p.source)).join("|")})$`);}inst._zod.parse=(payload,ctx)=>{const results=[];for(const option of def.options){const result=option._zod.run({value:payload.value,issues:[]},ctx);if(result instanceof Promise){results.push(result);}else{if(result.issues.length===0)return result;results.push(result);}}return handleUnionResults(results,payload,inst,ctx);};});const $ZodIntersection=/*@__PURE__*/$constructor("$ZodIntersection",(inst,def)=>{$ZodType.init(inst,def);inst._zod.parse=(payload,ctx)=>{const{value:input}=payload;const left=def.left._zod.run({value:input,issues:[]},ctx);const right=def.right._zod.run({value:input,issues:[]},ctx);const async=left instanceof Promise||right instanceof Promise;if(async){return Promise.all([left,right]).then(([left,right])=>{return handleIntersectionResults(payload,left,right);});}return handleIntersectionResults(payload,left,right);};});function mergeValues(a,b){// const aType = parse.t(a);
// const bType = parse.t(b);
if(a===b){return{valid:true,data:a};}if(a instanceof Date&&b instanceof Date&&+a===+b){return{valid:true,data:a};}if(isPlainObject(a)&&isPlainObject(b)){const bKeys=Object.keys(b);const sharedKeys=Object.keys(a).filter(key=>bKeys.indexOf(key)!==-1);const newObj=_objectSpread(_objectSpread({},a),b);for(const key of sharedKeys){const sharedValue=mergeValues(a[key],b[key]);if(!sharedValue.valid){return{valid:false,mergeErrorPath:[key,...sharedValue.mergeErrorPath]};}newObj[key]=sharedValue.data;}return{valid:true,data:newObj};}if(Array.isArray(a)&&Array.isArray(b)){if(a.length!==b.length){return{valid:false,mergeErrorPath:[]};}const newArray=[];for(let index=0;index<a.length;index++){const itemA=a[index];const itemB=b[index];const sharedValue=mergeValues(itemA,itemB);if(!sharedValue.valid){return{valid:false,mergeErrorPath:[index,...sharedValue.mergeErrorPath]};}newArray.push(sharedValue.data);}return{valid:true,data:newArray};}return{valid:false,mergeErrorPath:[]};}function handleIntersectionResults(result,left,right){if(left.issues.length){result.issues.push(...left.issues);}if(right.issues.length){result.issues.push(...right.issues);}if(aborted(result))return result;const merged=mergeValues(left.value,right.value);if(!merged.valid){throw new Error(`Unmergable intersection. Error path: `+`${JSON.stringify(merged.mergeErrorPath)}`);}result.value=merged.data;return result;}const $ZodRecord=/*@__PURE__*/$constructor("$ZodRecord",(inst,def)=>{$ZodType.init(inst,def);inst._zod.parse=(payload,ctx)=>{const input=payload.value;if(!isPlainObject(input)){payload.issues.push({expected:"record",code:"invalid_type",input,inst});return payload;}const proms=[];if(def.keyType._zod.values){const values=def.keyType._zod.values;payload.value={};for(const key of values){if(typeof key==="string"||typeof key==="number"||typeof key==="symbol"){const result=def.valueType._zod.run({value:input[key],issues:[]},ctx);if(result instanceof Promise){proms.push(result.then(result=>{if(result.issues.length){payload.issues.push(...prefixIssues(key,result.issues));}payload.value[key]=result.value;}));}else{if(result.issues.length){payload.issues.push(...prefixIssues(key,result.issues));}payload.value[key]=result.value;}}}let unrecognized;for(const key in input){if(!values.has(key)){unrecognized=unrecognized!==null&&unrecognized!==void 0?unrecognized:[];unrecognized.push(key);}}if(unrecognized&&unrecognized.length>0){payload.issues.push({code:"unrecognized_keys",input,inst,keys:unrecognized});}}else{payload.value={};for(const key of Reflect.ownKeys(input)){if(key==="__proto__")continue;const keyResult=def.keyType._zod.run({value:key,issues:[]},ctx);if(keyResult instanceof Promise){throw new Error("Async schemas not supported in object keys currently");}if(keyResult.issues.length){payload.issues.push({origin:"record",code:"invalid_key",issues:keyResult.issues.map(iss=>finalizeIssue(iss,ctx,config())),input:key,path:[key],inst});continue;}const result=def.valueType._zod.run({value:input[key],issues:[]},ctx);if(result instanceof Promise){proms.push(result.then(result=>{if(result.issues.length){payload.issues.push(...prefixIssues(key,result.issues));}else{payload.value[keyResult.value]=result.value;}}));}else{if(result.issues.length){payload.issues.push(...prefixIssues(key,result.issues));}else{payload.value[keyResult.value]=result.value;}}}}if(proms.length){return Promise.all(proms).then(()=>payload);}return payload;};});const $ZodEnum=/*@__PURE__*/$constructor("$ZodEnum",(inst,def)=>{$ZodType.init(inst,def);const numericValues=Object.values(def.entries).filter(v=>typeof v==="number");const values=Object.entries(def.entries).filter(([k,_])=>numericValues.indexOf(+k)===-1).map(([_,v])=>v);inst._zod.values=new Set(values);inst._zod.pattern=new RegExp(`^(${values.filter(k=>propertyKeyTypes.has(typeof k)).map(o=>typeof o==="string"?escapeRegex(o):o.toString()).join("|")})$`);inst._zod.parse=(payload,_ctx)=>{const input=payload.value;if(inst._zod.values.has(input)){return payload;}payload.issues.push({code:"invalid_value",values,input,inst});return payload;};});const $ZodLiteral=/*@__PURE__*/$constructor("$ZodLiteral",(inst,def)=>{$ZodType.init(inst,def);inst._zod.values=new Set(def.values);inst._zod.pattern=new RegExp(`^(${def.values.map(o=>typeof o==="string"?escapeRegex(o):o?o.toString():String(o)).join("|")})$`);inst._zod.parse=(payload,_ctx)=>{const input=payload.value;if(inst._zod.values.has(input)){return payload;}payload.issues.push({code:"invalid_value",values:def.values,input,inst});return payload;};});const $ZodTransform=/*@__PURE__*/$constructor("$ZodTransform",(inst,def)=>{$ZodType.init(inst,def);inst._zod.parse=(payload,_ctx)=>{const _out=def.transform(payload.value,payload);if(_ctx.async){const output=_out instanceof Promise?_out:Promise.resolve(_out);return output.then(output=>{payload.value=output;return payload;});}if(_out instanceof Promise){throw new $ZodAsyncError();}payload.value=_out;return payload;};});const $ZodOptional=/*@__PURE__*/$constructor("$ZodOptional",(inst,def)=>{$ZodType.init(inst,def);inst._zod.optionality="optional";defineLazy(inst._zod,"values",()=>def.innerType._zod.values?new Set([...def.innerType._zod.values,undefined]):undefined);defineLazy(inst._zod,"pattern",()=>{const pattern=def.innerType._zod.pattern;return pattern?new RegExp(`^(${cleanRegex(pattern.source)})?$`):undefined;});inst._zod.parse=(payload,ctx)=>{if(payload.value===undefined){return payload;}return def.innerType._zod.run(payload,ctx);};});const $ZodNullable=/*@__PURE__*/$constructor("$ZodNullable",(inst,def)=>{$ZodType.init(inst,def);defineLazy(inst._zod,"optionality",()=>def.innerType._zod.optionality);defineLazy(inst._zod,"pattern",()=>{const pattern=def.innerType._zod.pattern;return pattern?new RegExp(`^(${cleanRegex(pattern.source)}|null)$`):undefined;});defineLazy(inst._zod,"values",()=>{return def.innerType._zod.values?new Set([...def.innerType._zod.values,null]):undefined;});inst._zod.parse=(payload,ctx)=>{if(payload.value===null)return payload;return def.innerType._zod.run(payload,ctx);};});const $ZodDefault=/*@__PURE__*/$constructor("$ZodDefault",(inst,def)=>{$ZodType.init(inst,def);// inst._zod.qin = "true";
inst._zod.optionality="defaulted";defineLazy(inst._zod,"values",()=>def.innerType._zod.values);inst._zod.parse=(payload,ctx)=>{if(payload.value===undefined){payload.value=def.defaultValue;/**
             * $ZodDefault always returns the default value immediately.
             * It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */return payload;}const result=def.innerType._zod.run(payload,ctx);if(result instanceof Promise){return result.then(result=>handleDefaultResult(result,def));}return handleDefaultResult(result,def);};});function handleDefaultResult(payload,def){if(payload.value===undefined){payload.value=def.defaultValue;}return payload;}const $ZodPrefault=/*@__PURE__*/$constructor("$ZodPrefault",(inst,def)=>{$ZodType.init(inst,def);inst._zod.optionality="defaulted";defineLazy(inst._zod,"values",()=>def.innerType._zod.values);inst._zod.parse=(payload,ctx)=>{if(payload.value===undefined){payload.value=def.defaultValue;}return def.innerType._zod.run(payload,ctx);};});const $ZodNonOptional=/*@__PURE__*/$constructor("$ZodNonOptional",(inst,def)=>{$ZodType.init(inst,def);defineLazy(inst._zod,"values",()=>{const v=def.innerType._zod.values;return v?new Set([...v].filter(x=>x!==undefined)):undefined;});inst._zod.parse=(payload,ctx)=>{const result=def.innerType._zod.run(payload,ctx);if(result instanceof Promise){return result.then(result=>handleNonOptionalResult(result,inst));}return handleNonOptionalResult(result,inst);};});function handleNonOptionalResult(payload,inst){if(!payload.issues.length&&payload.value===undefined){payload.issues.push({code:"invalid_type",expected:"nonoptional",input:payload.value,inst});}return payload;}const $ZodCatch=/*@__PURE__*/$constructor("$ZodCatch",(inst,def)=>{$ZodType.init(inst,def);defineLazy(inst._zod,"optionality",()=>def.innerType._zod.optionality);defineLazy(inst._zod,"values",()=>def.innerType._zod.values);inst._zod.parse=(payload,ctx)=>{const result=def.innerType._zod.run(payload,ctx);if(result instanceof Promise){return result.then(result=>{if(result.issues.length){payload.value=def.catchValue(_objectSpread(_objectSpread({},payload),{},{error:{issues:result.issues.map(iss=>finalizeIssue(iss,ctx,config()))},input:payload.value}));payload.issues=[];}else{payload.value=result.value;}return payload;});}if(result.issues.length){payload.value=def.catchValue(_objectSpread(_objectSpread({},payload),{},{error:{issues:result.issues.map(iss=>finalizeIssue(iss,ctx,config()))},input:payload.value}));payload.issues=[];}else{payload.value=result.value;}return payload;};});const $ZodPipe=/*@__PURE__*/$constructor("$ZodPipe",(inst,def)=>{$ZodType.init(inst,def);// inst._zod.qin = def.in._zod.qin;
// inst._zod.qout = def.in._zod.qout;
inst._zod.values=def.in._zod.values;inst._zod.parse=(payload,ctx)=>{const left=def.in._zod.run(payload,ctx);if(left instanceof Promise){return left.then(left=>handlePipeResult(left,def,ctx));}return handlePipeResult(left,def,ctx);};});function handlePipeResult(left,def,ctx){if(aborted(left)){return left;}return def.out._zod.run({value:left.value,issues:left.issues},ctx);}const $ZodReadonly=/*@__PURE__*/$constructor("$ZodReadonly",(inst,def)=>{$ZodType.init(inst,def);defineLazy(inst._zod,"disc",()=>def.innerType._zod.disc);defineLazy(inst._zod,"optionality",()=>def.innerType._zod.optionality);inst._zod.parse=(payload,ctx)=>{const result=def.innerType._zod.run(payload,ctx);if(result instanceof Promise){return result.then(handleReadonlyResult);}return handleReadonlyResult(result);};});function handleReadonlyResult(payload){payload.value=Object.freeze(payload.value);return payload;}const $ZodCustom=/*@__PURE__*/$constructor("$ZodCustom",(inst,def)=>{$ZodCheck.init(inst,def);$ZodType.init(inst,def);inst._zod.parse=(payload,_)=>{return payload;};inst._zod.check=payload=>{const input=payload.value;const r=def.fn(input);if(r instanceof Promise){return r.then(r=>handleRefineResult(r,payload,input,inst));}handleRefineResult(r,payload,input,inst);return;};});function handleRefineResult(result,payload,input,inst){if(!result){const _iss={code:"custom",input,inst,// incorporates params.error into issue reporting
path:inst._zod.def.path,// incorporates params.error into issue reporting
continue:!inst._zod.def.abort// params: inst._zod.def.params,
};if(inst._zod.def.params)_iss.params=inst._zod.def.params;payload.issues.push(issue(_iss));}}class $ZodRegistry{constructor(){this._map=new WeakMap();this._idmap=new Map();}add(schema,..._meta){const meta=_meta[0];this._map.set(schema,meta);if(meta&&typeof meta==="object"&&"id"in meta){if(this._idmap.has(meta.id)){throw new Error(`ID ${meta.id} already exists in the registry`);}this._idmap.set(meta.id,schema);}return this;}remove(schema){this._map.delete(schema);return this;}get(schema){return this._map.get(schema);}has(schema){return this._map.has(schema);}}// registries
function registry(){return new $ZodRegistry();}const globalRegistry=/*@__PURE__*/registry();function _string(Class,params){return new Class(_objectSpread({type:"string"},normalizeParams(params)));}function _email(Class,params){return new Class(_objectSpread({type:"string",format:"email",check:"string_format",abort:false},normalizeParams(params)));}function _guid(Class,params){return new Class(_objectSpread({type:"string",format:"guid",check:"string_format",abort:false},normalizeParams(params)));}function _uuid(Class,params){return new Class(_objectSpread({type:"string",format:"uuid",check:"string_format",abort:false},normalizeParams(params)));}function _uuidv4(Class,params){return new Class(_objectSpread({type:"string",format:"uuid",check:"string_format",abort:false,version:"v4"},normalizeParams(params)));}function _uuidv6(Class,params){return new Class(_objectSpread({type:"string",format:"uuid",check:"string_format",abort:false,version:"v6"},normalizeParams(params)));}function _uuidv7(Class,params){return new Class(_objectSpread({type:"string",format:"uuid",check:"string_format",abort:false,version:"v7"},normalizeParams(params)));}function _url(Class,params){return new Class(_objectSpread({type:"string",format:"url",check:"string_format",abort:false},normalizeParams(params)));}function _emoji(Class,params){return new Class(_objectSpread({type:"string",format:"emoji",check:"string_format",abort:false},normalizeParams(params)));}function _nanoid(Class,params){return new Class(_objectSpread({type:"string",format:"nanoid",check:"string_format",abort:false},normalizeParams(params)));}function _cuid(Class,params){return new Class(_objectSpread({type:"string",format:"cuid",check:"string_format",abort:false},normalizeParams(params)));}function _cuid2(Class,params){return new Class(_objectSpread({type:"string",format:"cuid2",check:"string_format",abort:false},normalizeParams(params)));}function _ulid(Class,params){return new Class(_objectSpread({type:"string",format:"ulid",check:"string_format",abort:false},normalizeParams(params)));}function _xid(Class,params){return new Class(_objectSpread({type:"string",format:"xid",check:"string_format",abort:false},normalizeParams(params)));}function _ksuid(Class,params){return new Class(_objectSpread({type:"string",format:"ksuid",check:"string_format",abort:false},normalizeParams(params)));}function _ipv4(Class,params){return new Class(_objectSpread({type:"string",format:"ipv4",check:"string_format",abort:false},normalizeParams(params)));}function _ipv6(Class,params){return new Class(_objectSpread({type:"string",format:"ipv6",check:"string_format",abort:false},normalizeParams(params)));}function _cidrv4(Class,params){return new Class(_objectSpread({type:"string",format:"cidrv4",check:"string_format",abort:false},normalizeParams(params)));}function _cidrv6(Class,params){return new Class(_objectSpread({type:"string",format:"cidrv6",check:"string_format",abort:false},normalizeParams(params)));}function _base64(Class,params){return new Class(_objectSpread({type:"string",format:"base64",check:"string_format",abort:false},normalizeParams(params)));}function _base64url(Class,params){return new Class(_objectSpread({type:"string",format:"base64url",check:"string_format",abort:false},normalizeParams(params)));}function _e164(Class,params){return new Class(_objectSpread({type:"string",format:"e164",check:"string_format",abort:false},normalizeParams(params)));}function _jwt(Class,params){return new Class(_objectSpread({type:"string",format:"jwt",check:"string_format",abort:false},normalizeParams(params)));}function _isoDateTime(Class,params){return new Class(_objectSpread({type:"string",format:"datetime",check:"string_format",offset:false,local:false,precision:null},normalizeParams(params)));}function _isoDate(Class,params){return new Class(_objectSpread({type:"string",format:"date",check:"string_format"},normalizeParams(params)));}function _isoTime(Class,params){return new Class(_objectSpread({type:"string",format:"time",check:"string_format",precision:null},normalizeParams(params)));}function _isoDuration(Class,params){return new Class(_objectSpread({type:"string",format:"duration",check:"string_format"},normalizeParams(params)));}function _number(Class,params){return new Class(_objectSpread({type:"number",checks:[]},normalizeParams(params)));}function _int(Class,params){return new Class(_objectSpread({type:"number",check:"number_format",abort:false,format:"safeint"},normalizeParams(params)));}function _boolean(Class,params){return new Class(_objectSpread({type:"boolean"},normalizeParams(params)));}function _any(Class){return new Class({type:"any"});}function _unknown(Class){return new Class({type:"unknown"});}function _never(Class,params){return new Class(_objectSpread({type:"never"},normalizeParams(params)));}function _lt(value,params){return new $ZodCheckLessThan(_objectSpread(_objectSpread({check:"less_than"},normalizeParams(params)),{},{value,inclusive:false}));}function _lte(value,params){return new $ZodCheckLessThan(_objectSpread(_objectSpread({check:"less_than"},normalizeParams(params)),{},{value,inclusive:true}));}function _gt(value,params){return new $ZodCheckGreaterThan(_objectSpread(_objectSpread({check:"greater_than"},normalizeParams(params)),{},{value,inclusive:false}));}function _gte(value,params){return new $ZodCheckGreaterThan(_objectSpread(_objectSpread({check:"greater_than"},normalizeParams(params)),{},{value,inclusive:true}));}function _multipleOf(value,params){return new $ZodCheckMultipleOf(_objectSpread(_objectSpread({check:"multiple_of"},normalizeParams(params)),{},{value}));}function _maxLength(maximum,params){const ch=new $ZodCheckMaxLength(_objectSpread(_objectSpread({check:"max_length"},normalizeParams(params)),{},{maximum}));return ch;}function _minLength(minimum,params){return new $ZodCheckMinLength(_objectSpread(_objectSpread({check:"min_length"},normalizeParams(params)),{},{minimum}));}function _length(length,params){return new $ZodCheckLengthEquals(_objectSpread(_objectSpread({check:"length_equals"},normalizeParams(params)),{},{length}));}function _regex(pattern,params){return new $ZodCheckRegex(_objectSpread(_objectSpread({check:"string_format",format:"regex"},normalizeParams(params)),{},{pattern}));}function _lowercase(params){return new $ZodCheckLowerCase(_objectSpread({check:"string_format",format:"lowercase"},normalizeParams(params)));}function _uppercase(params){return new $ZodCheckUpperCase(_objectSpread({check:"string_format",format:"uppercase"},normalizeParams(params)));}function _includes(includes,params){return new $ZodCheckIncludes(_objectSpread(_objectSpread({check:"string_format",format:"includes"},normalizeParams(params)),{},{includes}));}function _startsWith(prefix,params){return new $ZodCheckStartsWith(_objectSpread(_objectSpread({check:"string_format",format:"starts_with"},normalizeParams(params)),{},{prefix}));}function _endsWith(suffix,params){return new $ZodCheckEndsWith(_objectSpread(_objectSpread({check:"string_format",format:"ends_with"},normalizeParams(params)),{},{suffix}));}function _overwrite(tx){return new $ZodCheckOverwrite({check:"overwrite",tx});}// normalize
function _normalize(form){return _overwrite(input=>input.normalize(form));}// trim
function _trim(){return _overwrite(input=>input.trim());}// toLowerCase
function _toLowerCase(){return _overwrite(input=>input.toLowerCase());}// toUpperCase
function _toUpperCase(){return _overwrite(input=>input.toUpperCase());}function _array(Class,element,params){return new Class(_objectSpread({type:"array",element},normalizeParams(params)));}function _custom(Class,fn,_params){const schema=new Class(_objectSpread({type:"custom",check:"custom",fn:fn},normalizeParams(_params)));return schema;}const ZodISODateTime=/*@__PURE__*/$constructor("ZodISODateTime",(inst,def)=>{$ZodISODateTime.init(inst,def);ZodStringFormat.init(inst,def);});function datetime(params){return _isoDateTime(ZodISODateTime,params);}const ZodISODate=/*@__PURE__*/$constructor("ZodISODate",(inst,def)=>{$ZodISODate.init(inst,def);ZodStringFormat.init(inst,def);});function date(params){return _isoDate(ZodISODate,params);}const ZodISOTime=/*@__PURE__*/$constructor("ZodISOTime",(inst,def)=>{$ZodISOTime.init(inst,def);ZodStringFormat.init(inst,def);});function time(params){return _isoTime(ZodISOTime,params);}const ZodISODuration=/*@__PURE__*/$constructor("ZodISODuration",(inst,def)=>{$ZodISODuration.init(inst,def);ZodStringFormat.init(inst,def);});function duration(params){return _isoDuration(ZodISODuration,params);}const _ZodError=$constructor("ZodError",(inst,issues)=>{_$ZodError.init(inst,issues);Object.defineProperty(inst,"format",{value:mapper=>formatError(inst,mapper),enumerable:false});Object.defineProperty(inst,"flatten",{value:mapper=>flattenError(inst,mapper),enumerable:false});Object.defineProperty(inst,"addIssue",{value:issue=>inst.issues.push(issue),enumerable:false});Object.defineProperty(inst,"addIssues",{value:issues=>inst.issues.push(...issues),enumerable:false});Object.defineProperty(inst,"isEmpty",{get(){return inst.issues.length===0;}});});class ZodError extends Error{constructor(issues){super();_ZodError.init(this,issues);}}// /** @deprecated Use `z.core.$ZodErrorMapCtx` instead. */
// export type ErrorMapCtx = core.$ZodErrorMapCtx;
const parse=/* @__PURE__ */_parse(ZodError);const parseAsync=/* @__PURE__ */_parseAsync(ZodError);const safeParse=/* @__PURE__ */_safeParse(_ZodError);const safeParseAsync=/* @__PURE__ */_safeParseAsync(_ZodError);const ZodType=/*@__PURE__*/$constructor("ZodType",(inst,def)=>{$ZodType.init(inst,def);inst.def=def;inst._def=def;// base methods
inst.check=(...checks)=>{var _def$checks;return inst.clone(_objectSpread(_objectSpread({},def),{},{checks:[...((_def$checks=def.checks)!==null&&_def$checks!==void 0?_def$checks:[]),...checks.map(ch=>typeof ch==="function"?{_zod:{check:ch,def:{check:"custom"},onattach:[]}}:ch)]}));};inst.clone=_def=>clone(inst,_def);inst.brand=()=>inst;inst.register=(reg,meta)=>{reg.add(inst,meta);return inst;};//  const parse: <T extends core.$ZodType>(
//   schema: T,
//   value: unknown,
//   _ctx?: core.ParseContext<core.$ZodIssue>
//  const safeParse: <T extends core.$ZodType>(
//   schema: T,
//   value: unknown,
//   _ctx?: core.ParseContext<core.$ZodIssue>
//  const parseAsync: <T extends core.$ZodType>(
//   schema: T,
//   value: unknown,
//   _ctx?: core.ParseContext<core.$ZodIssue>
//  const safeParseAsync: <T extends core.$ZodType>(
//   schema: T,
//   value: unknown,
//   _ctx?: core.ParseContext<core.$ZodIssue>
// parsing
inst.parse=(data,params)=>parse(inst,data,params,{callee:inst.parse});inst.safeParse=(data,params)=>safeParse(inst,data,params);inst.parseAsync=/*#__PURE__*/function(){var _ref7=_asyncToGenerator(function*(data,params){return parseAsync(inst,data,params,{callee:inst.parseAsync});});return function(_x0,_x1){return _ref7.apply(this,arguments);};}();inst.safeParseAsync=/*#__PURE__*/function(){var _ref8=_asyncToGenerator(function*(data,params){return safeParseAsync(inst,data,params);});return function(_x10,_x11){return _ref8.apply(this,arguments);};}();inst.spa=inst.safeParseAsync;// refinements
inst.refine=(check,params)=>inst.check(refine(check,params));inst.superRefine=refinement=>inst.check(superRefine(refinement));inst.overwrite=fn=>inst.check(_overwrite(fn));// wrappers
inst.optional=()=>optional(inst);inst.nullable=()=>nullable(inst);inst.nullish=()=>optional(nullable(inst));inst.nonoptional=params=>nonoptional(inst,params);inst.array=()=>array(inst);inst.or=arg=>union([inst,arg]);inst.and=arg=>intersection(inst,arg);inst.transform=tx=>pipe(inst,transform(tx));inst.default=def=>_default(inst,def);inst.prefault=def=>prefault(inst,def);// inst.coalesce = (def, params) => coalesce(inst, def, params);
inst.catch=params=>_catch(inst,params);inst.pipe=target=>pipe(inst,target);inst.readonly=()=>readonly(inst);// meta
inst.describe=description=>{var _globalRegistry$get;const cl=inst.clone();const meta=_objectSpread(_objectSpread({},(_globalRegistry$get=globalRegistry.get(inst))!==null&&_globalRegistry$get!==void 0?_globalRegistry$get:{}),{},{description});delete meta.id;// do not inherit
globalRegistry.add(cl,meta);return cl;};Object.defineProperty(inst,"description",{get(){var _globalRegistry$get2;return(_globalRegistry$get2=globalRegistry.get(inst))===null||_globalRegistry$get2===void 0?void 0:_globalRegistry$get2.description;},configurable:true});inst.meta=(...args)=>{if(args.length===0)return globalRegistry.get(inst);const cl=inst.clone();globalRegistry.add(cl,args[0]);return cl;};// helpers
inst.isOptional=()=>inst.safeParse(undefined).success;inst.isNullable=()=>inst.safeParse(null).success;return inst;});/** @internal */const _ZodString=/*@__PURE__*/$constructor("_ZodString",(inst,def)=>{var _inst$_zod$computed$f,_inst$_zod$computed$m5,_inst$_zod$computed$m6;$ZodString.init(inst,def);ZodType.init(inst,def);inst.format=(_inst$_zod$computed$f=inst._zod.computed.format)!==null&&_inst$_zod$computed$f!==void 0?_inst$_zod$computed$f:null;inst.minLength=(_inst$_zod$computed$m5=inst._zod.computed.minimum)!==null&&_inst$_zod$computed$m5!==void 0?_inst$_zod$computed$m5:null;inst.maxLength=(_inst$_zod$computed$m6=inst._zod.computed.maximum)!==null&&_inst$_zod$computed$m6!==void 0?_inst$_zod$computed$m6:null;// validations
inst.regex=(...args)=>inst.check(_regex(...args));inst.includes=(...args)=>inst.check(_includes(...args));inst.startsWith=params=>inst.check(_startsWith(params));inst.endsWith=params=>inst.check(_endsWith(params));inst.min=(...args)=>inst.check(_minLength(...args));inst.max=(...args)=>inst.check(_maxLength(...args));inst.length=(...args)=>inst.check(_length(...args));inst.nonempty=(...args)=>inst.check(_minLength(1,...args));inst.lowercase=params=>inst.check(_lowercase(params));inst.uppercase=params=>inst.check(_uppercase(params));// transforms
inst.trim=()=>inst.check(_trim());inst.normalize=(...args)=>inst.check(_normalize(...args));inst.toLowerCase=()=>inst.check(_toLowerCase());inst.toUpperCase=()=>inst.check(_toUpperCase());});const ZodString=/*@__PURE__*/$constructor("ZodString",(inst,def)=>{$ZodString.init(inst,def);_ZodString.init(inst,def);inst.email=params=>inst.check(_email(ZodEmail,params));inst.url=params=>inst.check(_url(ZodURL,params));inst.jwt=params=>inst.check(_jwt(ZodJWT,params));inst.emoji=params=>inst.check(_emoji(ZodEmoji,params));inst.guid=params=>inst.check(_guid(ZodGUID,params));inst.uuid=params=>inst.check(_uuid(ZodUUID,params));inst.uuidv4=params=>inst.check(_uuidv4(ZodUUID,params));inst.uuidv6=params=>inst.check(_uuidv6(ZodUUID,params));inst.uuidv7=params=>inst.check(_uuidv7(ZodUUID,params));inst.nanoid=params=>inst.check(_nanoid(ZodNanoID,params));inst.guid=params=>inst.check(_guid(ZodGUID,params));inst.cuid=params=>inst.check(_cuid(ZodCUID,params));inst.cuid2=params=>inst.check(_cuid2(ZodCUID2,params));inst.ulid=params=>inst.check(_ulid(ZodULID,params));inst.base64=params=>inst.check(_base64(ZodBase64,params));inst.base64url=params=>inst.check(_base64url(ZodBase64URL,params));inst.xid=params=>inst.check(_xid(ZodXID,params));inst.ksuid=params=>inst.check(_ksuid(ZodKSUID,params));inst.ipv4=params=>inst.check(_ipv4(ZodIPv4,params));inst.ipv6=params=>inst.check(_ipv6(ZodIPv6,params));inst.cidrv4=params=>inst.check(_cidrv4(ZodCIDRv4,params));inst.cidrv6=params=>inst.check(_cidrv6(ZodCIDRv6,params));inst.e164=params=>inst.check(_e164(ZodE164,params));// iso
inst.datetime=params=>inst.check(datetime(params));inst.date=params=>inst.check(date(params));inst.time=params=>inst.check(time(params));inst.duration=params=>inst.check(duration(params));});function string(params){return _string(ZodString,params);}const ZodStringFormat=/*@__PURE__*/$constructor("ZodStringFormat",(inst,def)=>{$ZodStringFormat.init(inst,def);_ZodString.init(inst,def);});const ZodEmail=/*@__PURE__*/$constructor("ZodEmail",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodEmail.init(inst,def);ZodStringFormat.init(inst,def);});const ZodGUID=/*@__PURE__*/$constructor("ZodGUID",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodGUID.init(inst,def);ZodStringFormat.init(inst,def);});const ZodUUID=/*@__PURE__*/$constructor("ZodUUID",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodUUID.init(inst,def);ZodStringFormat.init(inst,def);});function uuid(params){return _uuid(ZodUUID,params);}const ZodURL=/*@__PURE__*/$constructor("ZodURL",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodURL.init(inst,def);ZodStringFormat.init(inst,def);});function url(params){return _url(ZodURL,params);}const ZodEmoji=/*@__PURE__*/$constructor("ZodEmoji",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodEmoji.init(inst,def);ZodStringFormat.init(inst,def);});const ZodNanoID=/*@__PURE__*/$constructor("ZodNanoID",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodNanoID.init(inst,def);ZodStringFormat.init(inst,def);});const ZodCUID=/*@__PURE__*/$constructor("ZodCUID",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodCUID.init(inst,def);ZodStringFormat.init(inst,def);});const ZodCUID2=/*@__PURE__*/$constructor("ZodCUID2",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodCUID2.init(inst,def);ZodStringFormat.init(inst,def);});const ZodULID=/*@__PURE__*/$constructor("ZodULID",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodULID.init(inst,def);ZodStringFormat.init(inst,def);});const ZodXID=/*@__PURE__*/$constructor("ZodXID",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodXID.init(inst,def);ZodStringFormat.init(inst,def);});const ZodKSUID=/*@__PURE__*/$constructor("ZodKSUID",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodKSUID.init(inst,def);ZodStringFormat.init(inst,def);});const ZodIPv4=/*@__PURE__*/$constructor("ZodIPv4",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodIPv4.init(inst,def);ZodStringFormat.init(inst,def);});const ZodIPv6=/*@__PURE__*/$constructor("ZodIPv6",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodIPv6.init(inst,def);ZodStringFormat.init(inst,def);});const ZodCIDRv4=/*@__PURE__*/$constructor("ZodCIDRv4",(inst,def)=>{$ZodCIDRv4.init(inst,def);ZodStringFormat.init(inst,def);});const ZodCIDRv6=/*@__PURE__*/$constructor("ZodCIDRv6",(inst,def)=>{$ZodCIDRv6.init(inst,def);ZodStringFormat.init(inst,def);});const ZodBase64=/*@__PURE__*/$constructor("ZodBase64",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodBase64.init(inst,def);ZodStringFormat.init(inst,def);});const ZodBase64URL=/*@__PURE__*/$constructor("ZodBase64URL",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodBase64URL.init(inst,def);ZodStringFormat.init(inst,def);});const ZodE164=/*@__PURE__*/$constructor("ZodE164",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodE164.init(inst,def);ZodStringFormat.init(inst,def);});const ZodJWT=/*@__PURE__*/$constructor("ZodJWT",(inst,def)=>{// ZodStringFormat.init(inst, def);
$ZodJWT.init(inst,def);ZodStringFormat.init(inst,def);});const ZodNumber=/*@__PURE__*/$constructor("ZodNumber",(inst,def)=>{var _inst$_zod$computed$m7,_inst$_zod$computed$m8,_inst$_zod$computed$f2,_inst$_zod$computed$m9,_inst$_zod$computed$f3;$ZodNumber.init(inst,def);ZodType.init(inst,def);inst.gt=(value,params)=>inst.check(_gt(value,params));inst.gte=(value,params)=>inst.check(_gte(value,params));inst.min=(value,params)=>inst.check(_gte(value,params));inst.lt=(value,params)=>inst.check(_lt(value,params));inst.lte=(value,params)=>inst.check(_lte(value,params));inst.max=(value,params)=>inst.check(_lte(value,params));inst.int=params=>inst.check(int(params));inst.safe=params=>inst.check(int(params));inst.positive=params=>inst.check(_gt(0,params));inst.nonnegative=params=>inst.check(_gte(0,params));inst.negative=params=>inst.check(_lt(0,params));inst.nonpositive=params=>inst.check(_lte(0,params));inst.multipleOf=(value,params)=>inst.check(_multipleOf(value,params));inst.step=(value,params)=>inst.check(_multipleOf(value,params));// inst.finite = (params) => inst.check(core.finite(params));
inst.finite=()=>inst;inst.minValue=(_inst$_zod$computed$m7=inst._zod.computed.minimum)!==null&&_inst$_zod$computed$m7!==void 0?_inst$_zod$computed$m7:null;inst.maxValue=(_inst$_zod$computed$m8=inst._zod.computed.maximum)!==null&&_inst$_zod$computed$m8!==void 0?_inst$_zod$computed$m8:null;inst.isInt=((_inst$_zod$computed$f2=inst._zod.computed.format)!==null&&_inst$_zod$computed$f2!==void 0?_inst$_zod$computed$f2:"").includes("int")||Number.isSafeInteger((_inst$_zod$computed$m9=inst._zod.computed.multipleOf)!==null&&_inst$_zod$computed$m9!==void 0?_inst$_zod$computed$m9:0.5);inst.isFinite=true;inst.format=(_inst$_zod$computed$f3=inst._zod.computed.format)!==null&&_inst$_zod$computed$f3!==void 0?_inst$_zod$computed$f3:null;});function number(params){return _number(ZodNumber,params);}const ZodNumberFormat=/*@__PURE__*/$constructor("ZodNumberFormat",(inst,def)=>{$ZodNumberFormat.init(inst,def);ZodNumber.init(inst,def);});function int(params){return _int(ZodNumberFormat,params);}const ZodBoolean=/*@__PURE__*/$constructor("ZodBoolean",(inst,def)=>{$ZodBoolean.init(inst,def);ZodType.init(inst,def);});function boolean(params){return _boolean(ZodBoolean,params);}const ZodAny=/*@__PURE__*/$constructor("ZodAny",(inst,def)=>{$ZodAny.init(inst,def);ZodType.init(inst,def);});function any(){return _any(ZodAny);}const ZodUnknown=/*@__PURE__*/$constructor("ZodUnknown",(inst,def)=>{$ZodUnknown.init(inst,def);ZodType.init(inst,def);});function unknown(){return _unknown(ZodUnknown);}const ZodNever=/*@__PURE__*/$constructor("ZodNever",(inst,def)=>{$ZodNever.init(inst,def);ZodType.init(inst,def);});function never(params){return _never(ZodNever,params);}const ZodArray=/*@__PURE__*/$constructor("ZodArray",(inst,def)=>{$ZodArray.init(inst,def);ZodType.init(inst,def);inst.element=def.element;inst.min=(minLength,params)=>inst.check(_minLength(minLength,params));inst.nonempty=params=>inst.check(_minLength(1,params));inst.max=(maxLength,params)=>inst.check(_maxLength(maxLength,params));inst.length=(len,params)=>inst.check(_length(len,params));});function array(element,params){return _array(ZodArray,element,params);}const ZodObject=/*@__PURE__*/$constructor("ZodObject",(inst,def)=>{$ZodObject.init(inst,def);ZodType.init(inst,def);defineLazy(inst,"shape",()=>{return Object.fromEntries(Object.entries(inst._zod.def.shape));});inst.keyof=()=>_enum(Object.keys(inst._zod.def.shape));inst.catchall=catchall=>inst.clone(_objectSpread(_objectSpread({},inst._zod.def),{},{catchall}));inst.passthrough=()=>inst.clone(_objectSpread(_objectSpread({},inst._zod.def),{},{catchall:unknown()}));// inst.nonstrict = () => inst.clone({ ...inst._zod.def, catchall: api.unknown() });
inst.loose=()=>inst.clone(_objectSpread(_objectSpread({},inst._zod.def),{},{catchall:unknown()}));inst.strict=()=>inst.clone(_objectSpread(_objectSpread({},inst._zod.def),{},{catchall:never()}));inst.strip=()=>inst.clone(_objectSpread(_objectSpread({},inst._zod.def),{},{catchall:undefined}));inst.extend=incoming=>{return extend(inst,incoming);};inst.merge=other=>merge(inst,other);inst.pick=mask=>pick(inst,mask);inst.omit=mask=>omit(inst,mask);inst.partial=(...args)=>partial(ZodOptional,inst,args[0]);inst.required=(...args)=>required(ZodNonOptional,inst,args[0]);});function object(shape,params){const def=_objectSpread({type:"object",get shape(){assignProp(this,"shape",_objectSpread({},shape));return this.shape;}},normalizeParams(params));return new ZodObject(def);}const ZodUnion=/*@__PURE__*/$constructor("ZodUnion",(inst,def)=>{$ZodUnion.init(inst,def);ZodType.init(inst,def);inst.options=def.options;});function union(options,params){return new ZodUnion(_objectSpread({type:"union",options},normalizeParams(params)));}const ZodIntersection=/*@__PURE__*/$constructor("ZodIntersection",(inst,def)=>{$ZodIntersection.init(inst,def);ZodType.init(inst,def);});function intersection(left,right){return new ZodIntersection({type:"intersection",left,right});}const ZodRecord=/*@__PURE__*/$constructor("ZodRecord",(inst,def)=>{$ZodRecord.init(inst,def);ZodType.init(inst,def);inst.keyType=def.keyType;inst.valueType=def.valueType;});function record(keyType,valueType,params){return new ZodRecord(_objectSpread({type:"record",keyType,valueType},normalizeParams(params)));}const ZodEnum=/*@__PURE__*/$constructor("ZodEnum",(inst,def)=>{$ZodEnum.init(inst,def);ZodType.init(inst,def);inst.enum=def.entries;inst.options=Object.values(def.entries);const keys=new Set(Object.keys(def.entries));inst.extract=(values,params)=>{const newEntries={};for(const value of values){if(keys.has(value)){newEntries[value]=def.entries[value];}else throw new Error(`Key ${value} not found in enum`);}return new ZodEnum(_objectSpread(_objectSpread(_objectSpread({},def),{},{checks:[]},normalizeParams(params)),{},{entries:newEntries}));};inst.exclude=(values,params)=>{const newEntries=_objectSpread({},def.entries);for(const value of values){if(keys.has(value)){delete newEntries[value];}else throw new Error(`Key ${value} not found in enum`);}return new ZodEnum(_objectSpread(_objectSpread(_objectSpread({},def),{},{checks:[]},normalizeParams(params)),{},{entries:newEntries}));};});function _enum(values,params){const entries=Array.isArray(values)?Object.fromEntries(values.map(v=>[v,v])):values;return new ZodEnum(_objectSpread({type:"enum",entries},normalizeParams(params)));}const ZodLiteral=/*@__PURE__*/$constructor("ZodLiteral",(inst,def)=>{$ZodLiteral.init(inst,def);ZodType.init(inst,def);inst.values=new Set(def.values);});function literal(value,params){return new ZodLiteral(_objectSpread({type:"literal",values:Array.isArray(value)?value:[value]},normalizeParams(params)));}const ZodTransform=/*@__PURE__*/$constructor("ZodTransform",(inst,def)=>{$ZodTransform.init(inst,def);ZodType.init(inst,def);inst._zod.parse=(payload,_ctx)=>{payload.addIssue=issue$1=>{if(typeof issue$1==="string"){payload.issues.push(issue(issue$1,payload.value,def));}else{var _issue$code,_issue$input,_issue$inst,_issue$continue;// for Zod 3 backwards compatibility
const _issue=issue$1;if(_issue.fatal)_issue.continue=false;(_issue$code=_issue.code)!==null&&_issue$code!==void 0?_issue$code:_issue.code="custom";(_issue$input=_issue.input)!==null&&_issue$input!==void 0?_issue$input:_issue.input=payload.value;(_issue$inst=_issue.inst)!==null&&_issue$inst!==void 0?_issue$inst:_issue.inst=inst;(_issue$continue=_issue.continue)!==null&&_issue$continue!==void 0?_issue$continue:_issue.continue=!def.abort;payload.issues.push(issue(_issue));}};const output=def.transform(payload.value,payload);if(output instanceof Promise){return output.then(output=>{payload.value=output;return payload;});}payload.value=output;return payload;};});function transform(fn,params){return new ZodTransform(_objectSpread({type:"transform",transform:fn},normalizeParams(params)));}const ZodOptional=/*@__PURE__*/$constructor("ZodOptional",(inst,def)=>{$ZodOptional.init(inst,def);ZodType.init(inst,def);inst.unwrap=()=>inst._zod.def.innerType;});function optional(innerType){return new ZodOptional({type:"optional",innerType});}const ZodNullable=/*@__PURE__*/$constructor("ZodNullable",(inst,def)=>{$ZodNullable.init(inst,def);ZodType.init(inst,def);inst.unwrap=()=>inst._zod.def.innerType;});function nullable(innerType){return new ZodNullable({type:"nullable",innerType});}const ZodDefault=/*@__PURE__*/$constructor("ZodDefault",(inst,def)=>{$ZodDefault.init(inst,def);ZodType.init(inst,def);inst.unwrap=()=>inst._zod.def.innerType;inst.removeDefault=inst.unwrap;});function _default(innerType,defaultValue){return new ZodDefault({type:"default",innerType,get defaultValue(){return typeof defaultValue==="function"?defaultValue():defaultValue;}});}const ZodPrefault=/*@__PURE__*/$constructor("ZodPrefault",(inst,def)=>{$ZodPrefault.init(inst,def);ZodType.init(inst,def);inst.unwrap=()=>inst._zod.def.innerType;});function prefault(innerType,defaultValue){return new ZodPrefault({type:"prefault",innerType,get defaultValue(){return typeof defaultValue==="function"?defaultValue():defaultValue;}});}const ZodNonOptional=/*@__PURE__*/$constructor("ZodNonOptional",(inst,def)=>{$ZodNonOptional.init(inst,def);ZodType.init(inst,def);inst.unwrap=()=>inst._zod.def.innerType;});function nonoptional(innerType,params){return new ZodNonOptional(_objectSpread({type:"nonoptional",innerType},normalizeParams(params)));}const ZodCatch=/*@__PURE__*/$constructor("ZodCatch",(inst,def)=>{$ZodCatch.init(inst,def);ZodType.init(inst,def);inst.unwrap=()=>inst._zod.def.innerType;inst.removeCatch=inst.unwrap;});function _catch(innerType,catchValue){return new ZodCatch({type:"catch",innerType,catchValue:typeof catchValue==="function"?catchValue:()=>catchValue});}const ZodPipe=/*@__PURE__*/$constructor("ZodPipe",(inst,def)=>{$ZodPipe.init(inst,def);ZodType.init(inst,def);inst.in=def.in;inst.out=def.out;});function pipe(in_,out){return new ZodPipe({type:"pipe",in:in_,out// ...util.normalizeParams(params),
});}const ZodReadonly=/*@__PURE__*/$constructor("ZodReadonly",(inst,def)=>{$ZodReadonly.init(inst,def);ZodType.init(inst,def);});function readonly(innerType){return new ZodReadonly({type:"readonly",innerType});}const ZodCustom=/*@__PURE__*/$constructor("ZodCustom",(inst,def)=>{$ZodCustom.init(inst,def);ZodType.init(inst,def);});// custom checks
function check(fn,params){const ch=new $ZodCheck(_objectSpread({check:"custom"},normalizeParams(params)));ch._zod.check=fn;return ch;}function refine(fn,_params={}){return _custom(ZodCustom,fn,_params);}// superRefine
function superRefine(fn,params){const ch=check(payload=>{payload.addIssue=issue$1=>{if(typeof issue$1==="string"){payload.issues.push(issue(issue$1,payload.value,ch._zod.def));}else{var _issue$code2,_issue$input2,_issue$inst2,_issue$continue2;// for Zod 3 backwards compatibility
const _issue=issue$1;if(_issue.fatal)_issue.continue=false;(_issue$code2=_issue.code)!==null&&_issue$code2!==void 0?_issue$code2:_issue.code="custom";(_issue$input2=_issue.input)!==null&&_issue$input2!==void 0?_issue$input2:_issue.input=payload.value;(_issue$inst2=_issue.inst)!==null&&_issue$inst2!==void 0?_issue$inst2:_issue.inst=ch;(_issue$continue2=_issue.continue)!==null&&_issue$continue2!==void 0?_issue$continue2:_issue.continue=!ch._zod.def.abort;payload.issues.push(issue(_issue));}};return fn(payload.value,payload);},params);return ch;}// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
const BaseParams=record(string(),any()).describe('Runtime parameters for an asset');// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
var RecipeTemplateSchema;(function(RecipeTemplateSchema){RecipeTemplateSchema.MediaTemplate=object({asset_id:uuid().describe('Asset ID'),params:BaseParams.optional().describe('Runtime parameters for the asset'),// WARNING: 86400 seconds is the maximum duration of a media template
duration_seconds:number().min(1).max(86400).describe('Duration of the asset in seconds')}).describe('Media template');RecipeTemplateSchema.PlaylistTemplate=object({// WARNING: 1000 media templates is the maximum number of media templates that can be assigned to a playlist template
media_templates:array(RecipeTemplateSchema.MediaTemplate).min(1).max(1000).describe('Array of media templates')}).describe('Playlist template');// e.g. MO for Monday, 2MO for the second Monday of the month.
RecipeTemplateSchema.NDay=object({day:_enum(['mo','tu','we','th','fr','sa','su']).describe('Day of the week'),nthOfPeriod:number().int().optional().describe('Nth day of the period')}).describe('Nth day');RecipeTemplateSchema.RecurrenceRuleTemplate=object({frequency:_enum(['secondly','minutely','hourly','daily','weekly','monthly','yearly']).describe('Frequency of the recurrence rule'),interval:number().int().min(1).max(1000).optional().describe('Interval of the recurrence rule'),byDay:array(RecipeTemplateSchema.NDay).optional().describe('Array of Nth days'),byMonthDay:array(number().int().min(1).max(31)).optional().describe('Array of month days'),byMonth:array(number().int().min(1).max(12)).optional().describe('Array of months'),bySetPosition:array(number().int()).optional().describe('Array of set positions'),times:number().int().min(1).max(1000).optional().describe('Number of times the recurrence rule repeats'),until:datetime().optional().describe('DateTime until the recurrence rule repeats')}).describe('Recurrence rule template');RecipeTemplateSchema.EventTemplate=object({priority:number().int().min(0).max(10).describe('Priority of the event template'),start:datetime().describe('ISO datetime of the start of the event template'),timeZone:string().describe('Time zone of the event template'),duration:string().describe('Duration of the event template'),playlist:RecipeTemplateSchema.PlaylistTemplate,recurrenceRules:array(RecipeTemplateSchema.RecurrenceRuleTemplate).optional().describe('Array of recurrence rule templates')}).describe('Event template');RecipeTemplateSchema.RecipeTemplate=object({events:array(RecipeTemplateSchema.EventTemplate).min(1).max(1000).describe('Array of event templates')}).describe('Recipe template');})(RecipeTemplateSchema||(RecipeTemplateSchema={}));// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
const PublisherRequest=object({tenant_id:uuid().describe('Tenant ID'),reference_id:string().max(255).describe('Reference ID of the job'),recipe_template:RecipeTemplateSchema.RecipeTemplate,// WARNING: 1000 canvas is the maximum number that can be assigned to a job
canvas_ids:array(uuid()).min(1).max(1000).describe('List of canvas IDs'),identity:string().describe('Identity of the author of the job')}).describe('Publish job');// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
const PublisherResponse=object({job_id:string().regex(/^\d+$/).describe('Unique identifier for this job, can be used to query the status of the job.'),reference_id:string().max(255).describe('User provided reference identifier.'),timestamp:datetime().describe('ISO datetime of the job.')}).describe('Publisher job output');// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// #region Errors
object({code:string().describe('Error code representing the type of error.'),message:string().describe('Error message describing the issue.'),detail:string().describe('Additional details about the error, if available.'),timestamp:datetime().describe('Timestamp when the error occurred (ISO_8601 format).')}).describe('Error response schema');// #endregion
// #region WebHook
object({ref_id:string(),class:string()}).describe('WebHook request schema');object({}).describe('WebHook response schema');// #endregion
// #region Publisher
object({}).describe('Create UUIDs request schema');object({uuids:array(string())}).describe('Create UUIDs response schema');object({}).describe('Get Job Status request schema');object({status:_enum(["created","succeeded","failed","retrying"]).describe('Job status indicating the current state of the job.'),progress:number().describe('Progress of the job as a percentage (0-100).')}).or(array(object({error:string().describe('Error message if the job could not be queried.')}).or(object({status:_enum(["created","succeeded","failed","retrying"]).describe('Job status indicating the current state of the job.'),progress:number().describe('Progress of the job as a percentage (0-100).')})))).describe('Get Job Status response schema');PublisherRequest.describe('Create Publisher request schema');PublisherResponse.describe('Create Publisher response schema');// #endregion
// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
var RecipeSchema;(function(RecipeSchema){RecipeSchema.HashValue=object({method:literal("SHA256").describe("Hash method"),hex:string().describe("Hexadecimal hash value")}).describe("SHA-256 hash value");// Define types for HTML elements
RecipeSchema.HTMLImageElement=object({"@type":literal("HTMLImageElement").describe("Type of the HTML element"),id:uuid().describe("ID of the image"),href:url().min(20).max(2048).describe("URL of the image"),size:number().min(20).max(5368709120)// 5GB
.describe("Size of the image in bytes"),hash:RecipeSchema.HashValue,md5:string().length(24)// Base64 encoded 16 bytes.
.describe("MD5 hash value"),integrity:string().describe("Subresource Integrity (SRI) value"),duration:number().min(1).max(86400).describe("Duration of the image in seconds"),params:BaseParams.optional().describe("Optional parameters of the image element")}).describe("HTML image element");RecipeSchema.HTMLVideoElement=object({"@type":literal("HTMLVideoElement").describe("Type of the HTML element"),id:uuid().describe("ID of the video"),href:url().min(20).max(2048).describe("URL of the video"),size:number().min(20).max(5497558138880)// 5TB
.describe("Size of the video in bytes"),hash:RecipeSchema.HashValue,md5:string().length(24)// Base64 encoded 16 bytes.
.describe("MD5 hash value"),integrity:string().describe("Subresource Integrity (SRI) value"),duration:number().min(1).max(86400).describe("Duration of the video in seconds"),params:BaseParams.optional().describe("Optional parameters of the video element")}).describe("HTML video element");RecipeSchema.HTMLScriptElement=object({"@type":literal("HTMLScriptElement").describe("Type of the HTML element"),id:uuid().describe("ID of the script"),href:url().min(20).max(2048).describe("URL of the script"),size:number().min(20).max(1073741824)// 1GB
.describe("Size of the script in bytes"),hash:RecipeSchema.HashValue,md5:string().length(24)// Base64 encoded 16 bytes.
.describe("MD5 hash value"),integrity:string().describe("Subresource Integrity (SRI) value")}).describe("HTML script element");RecipeSchema.CustomElement=object({"@type":literal("CustomElement").describe("Type of the custom element"),id:uuid().describe("ID of the custom element"),href:url().min(20).max(2048).describe("URL of the custom element"),size:number().min(20).max(1073741824)// 1GB
.describe("Size of the custom element in bytes"),hash:RecipeSchema.HashValue,md5:string().length(24)// Base64 encoded 16 bytes.
.describe("MD5 hash value"),integrity:string().describe("Subresource Integrity (SRI) value"),duration:number().min(1).max(86400).describe("Duration of the custom element in seconds"),params:BaseParams.optional().describe("Optional parameters of the custom element"),sources:array(union([RecipeSchema.HTMLImageElement.omit({duration:true}),RecipeSchema.HTMLVideoElement.omit({duration:true}),RecipeSchema.HTMLScriptElement])).optional().describe("Array of sources, which can be HTMLImageElement, HTMLVideoElement, or HTMLScriptElement")}).describe("Custom element");// Define types for other components
RecipeSchema.RecurrenceRule=object({"@type":literal("RecurrenceRule").describe("Type of the recurrence rule"),frequency:_enum(["secondly","minutely","hourly","daily","weekly","monthly","yearly"]).describe("Frequency of the recurrence rule"),interval:number().int().min(1).max(1000).optional().describe("Interval of the recurrence rule"),firstDayOfWeek:_enum(["mo","tu","we","th","fr","sa","su"]).optional().describe("First day of the week"),byDay:array(object({day:_enum(["mo","tu","we","th","fr","sa","su"]),nthOfPeriod:number().int().optional()})).optional().describe("Array of Nth days"),byMonthDay:array(number().int().min(1).max(31)).optional().describe("Array of month days"),byMonth:array(number().int().min(1).max(12)).optional().describe("Array of months"),byYearDay:array(number().int().min(1).max(366)).optional().describe("Array of year days"),byWeekNo:array(number().int().min(1).max(53)).optional().describe("Array of week numbers"),byHour:array(number().int().min(0).max(23)).optional().describe("Array of hours"),byMinute:array(number().int().min(0).max(59)).optional().describe("Array of minutes"),bySecond:array(number().int().min(0).max(59)).optional().describe("Array of seconds"),bySetPosition:array(number().int()).optional().describe("Array of set positions"),timeZone:string().optional().describe("Time zone"),times:number().int().min(1).max(1000).optional().describe("Number of times the recurrence rule repeats"),until:datetime().optional().describe("ISO datetime until the recurrence rule repeats")}).describe("Recurrence rule");RecipeSchema.MatchPattern=object({"@type":literal("MatchPattern").describe("Type of the match pattern"),code:string().describe("Code of the match pattern")}).describe("Match pattern");RecipeSchema.DOMEvent=object({"@type":literal("DOMEvent").describe("Type of the DOM event"),type:string().describe("Type of the DOM event"),match:RecipeSchema.MatchPattern}).describe("DOM event");RecipeSchema.Playlist=object({"@type":literal("Playlist").describe("Type of the playlist"),entries:array(union([RecipeSchema.HTMLImageElement,RecipeSchema.HTMLVideoElement,RecipeSchema.CustomElement])).describe("Array of entries")}).describe("Playlist");RecipeSchema.Event=object({"@type":literal("Event").describe("Type of the event"),id:uuid().describe("ID of the event"),priority:number().int().min(0).max(10).describe("Priority of the event"),start:datetime().describe("ISO datetime of the start of the event"),timeZone:string().describe("Time zone of the event"),duration:string().describe("Duration of the event"),playlist:RecipeSchema.Playlist,recurrenceRules:array(RecipeSchema.RecurrenceRule).optional().describe("Array of recurrence rules"),onceOn:RecipeSchema.DOMEvent.optional().describe("Once on DOM event"),enableOn:RecipeSchema.DOMEvent.optional().describe("Enable on DOM event"),disableOn:RecipeSchema.DOMEvent.optional().describe("Disable on DOM event")}).describe("Event");RecipeSchema.Transition=object({"@type":literal("Transition").describe("Type of the transition"),id:uuid().describe("ID of the transition"),href:url().min(20).max(2048).describe("URL of the transition"),size:number().min(20).max(1073741824)// 1GB
.describe("Size of the transition in bytes"),hash:RecipeSchema.HashValue,md5:string().length(24)// Base64 encoded 16 bytes.
.describe("MD5 hash value"),integrity:string().describe("Subresource Integrity (SRI) value"),duration:number().min(1).max(86400).describe("Duration of the transition in seconds"),params:BaseParams.optional().describe("Optional parameters of the transition"),sources:array(union([RecipeSchema.HTMLImageElement.omit({duration:true}),RecipeSchema.HTMLVideoElement.omit({duration:true}),RecipeSchema.HTMLScriptElement])).optional().describe("Array of sources, which can be HTMLImageElement, HTMLVideoElement, or HTMLScriptElement")}).describe("Transition");RecipeSchema.SignalingServer=object({url:url().min(20).max(2048).describe("URL of the signaling server")}).describe("Signaling server");// aka RTCIceServer in the DOM.
RecipeSchema.IceServer=object({urls:union([string(),array(string())]).describe("URLs of the ICE server"),username:string().optional().describe("Username of the ICE server"),credential:string().optional().describe("Credential of the ICE server")}).describe("ICE server");RecipeSchema.Cluster=object({label:string().describe("Label of the cluster"),id:uuid().describe("ID of the cluster"),peers:array(uuid()).describe("Array of peer IDs"),iceServers:array(RecipeSchema.IceServer).describe("Array of ICE servers"),signalingServers:array(RecipeSchema.SignalingServer).describe("Array of signaling servers"),enableLoopback:boolean().optional().describe("Enable loopback")}).describe("Cluster");// Compose the final type
RecipeSchema.Recipe=object({transition:RecipeSchema.Transition,schedule:array(RecipeSchema.Event).describe("Array of events"),$defs:record(string(),RecipeSchema.Playlist).optional().describe("Definitions of playlists"),cluster:RecipeSchema.Cluster.optional().describe("Cluster configuration")}).describe("Recipe");// Link to a recipe
RecipeSchema.RecipeLink=object({"@type":literal("RecipeLink").describe("Type of the recipe link"),id:uuid().describe("ID of the recipe"),href:url().min(20).max(2048).describe("URL of the recipe"),size:number().min(20).max(1073741824)// 1GB
.describe("Size of the recipe in bytes"),hash:RecipeSchema.HashValue,md5:string().length(24)// Base64 encoded 16 bytes.
.describe("MD5 hash value"),integrity:string().describe("Subresource Integrity (SRI) value")}).describe("Recipe link");})(RecipeSchema||(RecipeSchema={}));// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
class Constants{}//@ts-nocheck
// =============================================================================
// Weekday
// =============================================================================
_Constants=Constants;_Constants.NETWORK_EMPTY=0;_Constants.NETWORK_IDLE=1;_Constants.NETWORK_LOADING=2;_Constants.NETWORK_NO_SOURCE=3;_Constants.HAVE_NOTHING=0;_Constants.HAVE_METADATA=1;_Constants.HAVE_CURRENT_DATA=2;_Constants.HAVE_FUTURE_DATA=3;_Constants.HAVE_ENOUGH_DATA=4;const ALL_WEEKDAYS=['MO','TU','WE','TH','FR','SA','SU'];class Weekday{constructor(weekday,n){if(n===0)throw new Error("Can't create weekday with n == 0");this.weekday=weekday;this.n=n;}static fromStr(str){return new Weekday(ALL_WEEKDAYS.indexOf(str));}// __call__ - Cannot call the object directly, do it through
// e.g. RRule.TH.nth(-1) instead,
nth(n){return this.n===n?this:new Weekday(this.weekday,n);}// __eq__
equals(other){return this.weekday===other.weekday&&this.n===other.n;}// __repr__
toString(){let s=ALL_WEEKDAYS[this.weekday];if(this.n)s=(this.n>0?'+':'')+String(this.n)+s;return s;}getJsWeekday(){return this.weekday===6?0:this.weekday+1;}}//@ts-nocheck
// =============================================================================
// Helper functions
// =============================================================================
const isPresent=function(value){return value!==null&&value!==undefined;};const isNumber=function(value){return typeof value==='number';};const isWeekdayStr=function(value){return typeof value==='string'&&ALL_WEEKDAYS.includes(value);};const isArray=Array.isArray;/**
 * Simplified version of python's range()
 */const range=function(start,end=start){if(arguments.length===1){end=start;start=0;}const rang=[];for(let i=start;i<end;i++)rang.push(i);return rang;};const repeat=function(value,times){let i=0;const array=[];if(isArray(value)){for(;i<times;i++)array[i]=[].concat(value);}else{for(;i<times;i++)array[i]=value;}return array;};const toArray=function(item){if(isArray(item)){return item;}return[item];};function padStart(item,targetLength,padString=' '){const str=String(item);targetLength=targetLength>>0;if(str.length>targetLength){return String(str);}targetLength=targetLength-str.length;if(targetLength>padString.length){padString+=repeat(padString,targetLength/padString.length);}return padString.slice(0,targetLength)+String(str);}/**
 * closure/goog/math/math.js:modulo
 * Copyright 2006 The Closure Library Authors.
 * The % operator in JavaScript returns the remainder of a / b, but differs from
 * some other languages in that the result will have the same sign as the
 * dividend. For example, -1 % 8 == -1, whereas in some other languages
 * (such as Python) the result would be 7. This function emulates the more
 * correct modulo behavior, which is useful for certain applications such as
 * calculating an offset index in a circular list.
 *
 * @param {number} a The dividend.
 * @param {number} b The divisor.
 * @return {number} a % b where the result is between 0 and b (either 0 <= x < b
 * or b < x <= 0, depending on the sign of b).
 */const pymod=function(a,b){const r=a%b;// If r and b differ in sign, add b to wrap the result to the correct sign.
return r*b<0?r+b:r;};/**
 * @see: <http://docs.python.org/library/functions.html#divmod>
 */const divmod=function(a,b){return{div:Math.floor(a/b),mod:pymod(a,b)};};const empty=function(obj){return!isPresent(obj)||obj.length===0;};/**
 * Python-like boolean
 *
 * @return {Boolean} value of an object/primitive, taking into account
 * the fact that in Python an empty list's/tuple's
 * boolean value is False, whereas in JS it's true
 */const notEmpty=function(obj){return!empty(obj);};/**
 * Return true if a value is in an array
 */const includes=function(arr,val){return notEmpty(arr)&&arr.indexOf(val)!==-1;};/* eslint-disable @typescript-eslint/no-namespace *//**
 * General date-related utilities.
 * Also handles several incompatibilities between JavaScript and Python
 *
 */var dateutil;(function(dateutil){dateutil.MONTH_DAYS=[31,28,31,30,31,30,31,31,30,31,30,31];/**
     * Number of milliseconds of one day
     */dateutil.ONE_DAY=1000*60*60*24;/**
     * @see: <http://docs.python.org/library/datetime.html#datetime.MAXYEAR>
     */dateutil.MAXYEAR=9999;/**
     * Python uses 1-Jan-1 as the base for calculating ordinals but we don't
     * want to confuse the JS engine with milliseconds > Number.MAX_NUMBER,
     * therefore we use 1-Jan-1970 instead
     */dateutil.ORDINAL_BASE=new Date(Date.UTC(1970,0,1));/**
     * Python: MO-SU: 0 - 6
     * JS: SU-SAT 0 - 6
     */dateutil.PY_WEEKDAYS=[6,0,1,2,3,4,5];/**
     * py_date.timetuple()[7]
     */dateutil.getYearDay=function(date){const dateNoTime=new Date(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate());return Math.ceil((dateNoTime.valueOf()-new Date(date.getUTCFullYear(),0,1).valueOf())/dateutil.ONE_DAY)+1;};dateutil.isLeapYear=function(year){return year%4===0&&year%100!==0||year%400===0;};dateutil.isDate=function(value){return value instanceof Date;};dateutil.isValidDate=function(value){return dateutil.isDate(value)&&!isNaN(value.getTime());};/**
     * @return {Number} the date's timezone offset in ms
     */dateutil.tzOffset=function(date){return date.getTimezoneOffset()*60*1000;};/**
     * @see: <http://www.mcfedries.com/JavaScript/DaysBetween.asp>
     */dateutil.daysBetween=function(date1,date2){// The number of milliseconds in one day
// Convert both dates to milliseconds
const date1ms=date1.getTime()-dateutil.tzOffset(date1);const date2ms=date2.getTime()-dateutil.tzOffset(date2);// Calculate the difference in milliseconds
const differencems=date1ms-date2ms;// Convert back to days and return
return Math.round(differencems/dateutil.ONE_DAY);};/**
     * @see: <http://docs.python.org/library/datetime.html#datetime.date.toordinal>
     */dateutil.toOrdinal=function(date){return dateutil.daysBetween(date,dateutil.ORDINAL_BASE);};/**
     * @see - <http://docs.python.org/library/datetime.html#datetime.date.fromordinal>
     */dateutil.fromOrdinal=function(ordinal){return new Date(dateutil.ORDINAL_BASE.getTime()+ordinal*dateutil.ONE_DAY);};dateutil.getMonthDays=function(date){const month=date.getUTCMonth();return month===1&&dateutil.isLeapYear(date.getUTCFullYear())?29:dateutil.MONTH_DAYS[month];};/**
     * @return {Number} python-like weekday
     */dateutil.getWeekday=function(date){return dateutil.PY_WEEKDAYS[date.getUTCDay()];};/**
     * @see: <http://docs.python.org/library/calendar.html#calendar.monthrange>
     */dateutil.monthRange=function(year,month){const date=new Date(Date.UTC(year,month,1));return[dateutil.getWeekday(date),dateutil.getMonthDays(date)];};/**
     * @see: <http://docs.python.org/library/datetime.html#datetime.datetime.combine>
     */dateutil.combine=function(date,time){time=time||date;return new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate(),time.getHours(),time.getMinutes(),time.getSeconds(),time.getMilliseconds()));};dateutil.clone=function(date){const dolly=new Date(date.getTime());return dolly;};dateutil.cloneDates=function(dates){const clones=[];for(let i=0;i<dates.length;i++){clones.push(dateutil.clone(dates[i]));}return clones;};/**
     * Sorts an array of Date or dateutil.Time objects
     */dateutil.sort=function(dates){dates.sort(function(a,b){return a.getTime()-b.getTime();});};dateutil.timeToUntilString=function(time,utc=true){const date=new Date(time);return[padStart(date.getUTCFullYear().toString(),4,'0'),padStart(date.getUTCMonth()+1,2,'0'),padStart(date.getUTCDate(),2,'0'),'T',padStart(date.getUTCHours(),2,'0'),padStart(date.getUTCMinutes(),2,'0'),padStart(date.getUTCSeconds(),2,'0'),utc?'Z':''].join('');};dateutil.untilStringToDate=function(until){const re=/^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?$/;const bits=re.exec(until);if(!bits)throw new Error(`Invalid UNTIL value: ${until}`);return new Date(Date.UTC(parseInt(bits[1],10),parseInt(bits[2],10)-1,parseInt(bits[3],10),parseInt(bits[5],10)||0,parseInt(bits[6],10)||0,parseInt(bits[7],10)||0));};})(dateutil||(dateutil={}));var dateutil$1=dateutil;/**
 * This class helps us to emulate python's generators, sorta.
 */class IterResult{constructor(method,args){this.minDate=null;this.maxDate=null;this._result=[];this.total=0;this.method=method;this.args=args;if(method==='between'){this.maxDate=args.inc?args.before:new Date(args.before.getTime()-1);this.minDate=args.inc?args.after:new Date(args.after.getTime()+1);}else if(method==='before'){this.maxDate=args.inc?args.dt:new Date(args.dt.getTime()-1);}else if(method==='after'){this.minDate=args.inc?args.dt:new Date(args.dt.getTime()+1);}}/**
     * Possibly adds a date into the result.
     *
     * @param {Date} date - the date isn't necessarly added to the result
     * list (if it is too late/too early)
     * @return {Boolean} true if it makes sense to continue the iteration
     * false if we're done.
     */accept(date){++this.total;const tooEarly=this.minDate&&date<this.minDate;const tooLate=this.maxDate&&date>this.maxDate;if(this.method==='between'){if(tooEarly)return true;if(tooLate)return false;}else if(this.method==='before'){if(tooLate)return false;}else if(this.method==='after'){if(tooEarly)return true;this.add(date);return false;}return this.add(date);}/**
     *
     * @param {Date} date that is part of the result.
     * @return {Boolean} whether we are interested in more values.
     */add(date){this._result.push(date);return true;}/**
     * 'before' and 'after' return only one date, whereas 'all'
     * and 'between' an array.
     *
     * @return {Date,Array?}
     */getValue(){const res=this._result;switch(this.method){case'all':case'between':return res;case'before':case'after':default:return res.length?res[res.length-1]:null;}}clone(){return new IterResult(this.method,this.args);}}//@ts-nocheck
/**
 * IterResult subclass that calls a callback function on each add,
 * and stops iterating when the callback returns false.
 */class CallbackIterResult extends IterResult{constructor(method,args,iterator){super(method,args);this.iterator=iterator;}add(date){if(this.iterator(date,this._result.length)){this._result.push(date);return true;}return false;}}//@ts-nocheck
// =============================================================================
// i18n
// =============================================================================
const ENGLISH={dayNames:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],monthNames:['January','February','March','April','May','June','July','August','September','October','November','December'],tokens:{SKIP:/^[ \r\n\t]+|^\.$/,number:/^[1-9][0-9]*/,numberAsText:/^(one|two|three)/i,every:/^every/i,'day(s)':/^days?/i,'weekday(s)':/^weekdays?/i,'week(s)':/^weeks?/i,'hour(s)':/^hours?/i,'minute(s)':/^minutes?/i,'month(s)':/^months?/i,'year(s)':/^years?/i,on:/^(on|in)/i,at:/^(at)/i,the:/^the/i,first:/^first/i,second:/^second/i,third:/^third/i,nth:/^([1-9][0-9]*)(\.|th|nd|rd|st)/i,last:/^last/i,for:/^for/i,'time(s)':/^times?/i,until:/^(un)?til/i,monday:/^mo(n(day)?)?/i,tuesday:/^tu(e(s(day)?)?)?/i,wednesday:/^we(d(n(esday)?)?)?/i,thursday:/^th(u(r(sday)?)?)?/i,friday:/^fr(i(day)?)?/i,saturday:/^sa(t(urday)?)?/i,sunday:/^su(n(day)?)?/i,january:/^jan(uary)?/i,february:/^feb(ruary)?/i,march:/^mar(ch)?/i,april:/^apr(il)?/i,may:/^may/i,june:/^june?/i,july:/^july?/i,august:/^aug(ust)?/i,september:/^sep(t(ember)?)?/i,october:/^oct(ober)?/i,november:/^nov(ember)?/i,december:/^dec(ember)?/i,comma:/^(,\s*|(and|or)\s*)+/i}};//@ts-nocheck
// =============================================================================
// Helper functions
// =============================================================================
/**
 * Return true if a value is in an array
 */const contains=function(arr,val){return arr.indexOf(val)!==-1;};const defaultGetText=id=>id.toString();const defaultDateFormatter=(year,month,day)=>`${month} ${day}, ${year}`;/**
 *
 * @param {RRule} rrule
 * Optional:
 * @param {Function} gettext function
 * @param {Object} language definition
 * @constructor
 */class ToText{constructor(rrule,gettext=defaultGetText,language=ENGLISH,dateFormatter=defaultDateFormatter){this.text=[];this.language=language||ENGLISH;this.gettext=gettext;this.dateFormatter=dateFormatter;this.rrule=rrule;this.options=rrule.options;this.origOptions=rrule.origOptions;if(this.origOptions.bymonthday){const bymonthday=[].concat(this.options.bymonthday);const bynmonthday=[].concat(this.options.bynmonthday);bymonthday.sort((a,b)=>a-b);bynmonthday.sort((a,b)=>b-a);// 1, 2, 3, .., -5, -4, -3, ..
this.bymonthday=bymonthday.concat(bynmonthday);if(!this.bymonthday.length)this.bymonthday=null;}if(isPresent(this.origOptions.byweekday)){const byweekday=!isArray(this.origOptions.byweekday)?[this.origOptions.byweekday]:this.origOptions.byweekday;const days=String(byweekday);this.byweekday={allWeeks:byweekday.filter(function(weekday){return!weekday.n;}),someWeeks:byweekday.filter(function(weekday){return Boolean(weekday.n);}),isWeekdays:days.indexOf('MO')!==-1&&days.indexOf('TU')!==-1&&days.indexOf('WE')!==-1&&days.indexOf('TH')!==-1&&days.indexOf('FR')!==-1&&days.indexOf('SA')===-1&&days.indexOf('SU')===-1,isEveryDay:days.indexOf('MO')!==-1&&days.indexOf('TU')!==-1&&days.indexOf('WE')!==-1&&days.indexOf('TH')!==-1&&days.indexOf('FR')!==-1&&days.indexOf('SA')!==-1&&days.indexOf('SU')!==-1};const sortWeekDays=function(a,b){return a.weekday-b.weekday;};this.byweekday.allWeeks.sort(sortWeekDays);this.byweekday.someWeeks.sort(sortWeekDays);if(!this.byweekday.allWeeks.length)this.byweekday.allWeeks=null;if(!this.byweekday.someWeeks.length)this.byweekday.someWeeks=null;}else{this.byweekday=null;}}/**
     * Test whether the rrule can be fully converted to text.
     *
     * @param {RRule} rrule
     * @return {Boolean}
     */static isFullyConvertible(rrule){const canConvert=true;if(!(rrule.options.freq in ToText.IMPLEMENTED))return false;if(rrule.origOptions.until&&rrule.origOptions.count)return false;for(const key in rrule.origOptions){if(contains(['dtstart','wkst','freq'],key))return true;if(!contains(ToText.IMPLEMENTED[rrule.options.freq],key))return false;}return canConvert;}isFullyConvertible(){return ToText.isFullyConvertible(this.rrule);}/**
     * Perform the conversion. Only some of the frequencies are supported.
     * If some of the rrule's options aren't supported, they'll
     * be omitted from the output an "(~ approximate)" will be appended.
     *
     * @return {*}
     */toString(){const gettext=this.gettext;if(!(this.options.freq in ToText.IMPLEMENTED)){return gettext('RRule error: Unable to fully convert this rrule to text');}this.text=[gettext('every')];// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
this[RRule.FREQUENCIES[this.options.freq]]();if(this.options.until){this.add(gettext('until'));const until=this.options.until;this.add(this.dateFormatter(until.getUTCFullYear(),this.language.monthNames[until.getUTCMonth()],until.getUTCDate()));}else if(this.options.count){this.add(gettext('for')).add(this.options.count.toString()).add(this.plural(this.options.count)?gettext('times'):gettext('time'));}if(!this.isFullyConvertible())this.add(gettext('(~ approximate)'));return this.text.join('');}HOURLY(){const gettext=this.gettext;if(this.options.interval!==1)this.add(this.options.interval.toString());this.add(this.plural(this.options.interval)?gettext('hours'):gettext('hour'));}MINUTELY(){const gettext=this.gettext;if(this.options.interval!==1)this.add(this.options.interval.toString());this.add(this.plural(this.options.interval)?gettext('minutes'):gettext('minute'));}DAILY(){const gettext=this.gettext;if(this.options.interval!==1)this.add(this.options.interval.toString());if(this.byweekday&&this.byweekday.isWeekdays){this.add(this.plural(this.options.interval)?gettext('weekdays'):gettext('weekday'));}else{this.add(this.plural(this.options.interval)?gettext('days'):gettext('day'));}if(this.origOptions.bymonth){this.add(gettext('in'));this._bymonth();}if(this.bymonthday){this._bymonthday();}else if(this.byweekday){this._byweekday();}else if(this.origOptions.byhour){this._byhour();}}WEEKLY(){const gettext=this.gettext;if(this.options.interval!==1){this.add(this.options.interval.toString()).add(this.plural(this.options.interval)?gettext('weeks'):gettext('week'));}if(this.byweekday&&this.byweekday.isWeekdays){if(this.options.interval===1){this.add(this.plural(this.options.interval)?gettext('weekdays'):gettext('weekday'));}else{this.add(gettext('on')).add(gettext('weekdays'));}}else if(this.byweekday&&this.byweekday.isEveryDay){this.add(this.plural(this.options.interval)?gettext('days'):gettext('day'));}else{if(this.options.interval===1)this.add(gettext('week'));if(this.origOptions.bymonth){this.add(gettext('in'));this._bymonth();}if(this.bymonthday){this._bymonthday();}else if(this.byweekday){this._byweekday();}}}MONTHLY(){const gettext=this.gettext;if(this.origOptions.bymonth){if(this.options.interval!==1){this.add(this.options.interval.toString()).add(gettext('months'));if(this.plural(this.options.interval))this.add(gettext('in'));}this._bymonth();}else{if(this.options.interval!==1){this.add(this.options.interval.toString());}this.add(this.plural(this.options.interval)?gettext('months'):gettext('month'));}if(this.bymonthday){this._bymonthday();}else if(this.byweekday&&this.byweekday.isWeekdays){this.add(gettext('on')).add(gettext('weekdays'));}else if(this.byweekday){this._byweekday();}}YEARLY(){const gettext=this.gettext;if(this.origOptions.bymonth){if(this.options.interval!==1){this.add(this.options.interval.toString());this.add(gettext('years'));}this._bymonth();}else{if(this.options.interval!==1){this.add(this.options.interval.toString());}this.add(this.plural(this.options.interval)?gettext('years'):gettext('year'));}if(this.bymonthday){this._bymonthday();}else if(this.byweekday){this._byweekday();}if(this.options.byyearday){this.add(gettext('on the')).add(this.list(this.options.byyearday,this.nth,gettext('and'))).add(gettext('day'));}if(this.options.byweekno){this.add(gettext('in')).add(this.plural(this.options.byweekno.length)?gettext('weeks'):gettext('week')).add(this.list(this.options.byweekno,undefined,gettext('and')));}}_bymonthday(){const gettext=this.gettext;if(this.byweekday&&this.byweekday.allWeeks){this.add(gettext('on')).add(this.list(this.byweekday.allWeeks,this.weekdaytext,gettext('or'))).add(gettext('the')).add(this.list(this.bymonthday,this.nth,gettext('or')));}else{this.add(gettext('on the')).add(this.list(this.bymonthday,this.nth,gettext('and')));}// this.add(gettext('DAY'))
}_byweekday(){const gettext=this.gettext;if(this.byweekday.allWeeks&&!this.byweekday.isWeekdays){this.add(gettext('on')).add(this.list(this.byweekday.allWeeks,this.weekdaytext));}if(this.byweekday.someWeeks){if(this.byweekday.allWeeks)this.add(gettext('and'));this.add(gettext('on the')).add(this.list(this.byweekday.someWeeks,this.weekdaytext,gettext('and')));}}_byhour(){const gettext=this.gettext;this.add(gettext('at')).add(this.list(this.origOptions.byhour,undefined,gettext('and')));}_bymonth(){this.add(this.list(this.options.bymonth,this.monthtext,this.gettext('and')));}nth(n){n=parseInt(n.toString(),10);let nth;const gettext=this.gettext;if(n===-1)return gettext('last');const npos=Math.abs(n);switch(npos){case 1:case 21:case 31:nth=npos+gettext('st');break;case 2:case 22:nth=npos+gettext('nd');break;case 3:case 23:nth=npos+gettext('rd');break;default:nth=npos+gettext('th');}return n<0?nth+' '+gettext('last'):nth;}monthtext(m){return this.language.monthNames[m-1];}weekdaytext(wday){const weekday=isNumber(wday)?(wday+1)%7:wday.getJsWeekday();return(wday.n?this.nth(wday.n)+' ':'')+this.language.dayNames[weekday];}plural(n){return n%100!==1;}add(s){this.text.push(' ');this.text.push(s);return this;}list(arr,callback,finalDelim,delim=','){if(!isArray(arr)){arr=[arr];}const delimJoin=function(array,delimiter,finalDelimiter){let list='';for(let i=0;i<array.length;i++){if(i!==0){if(i===array.length-1){list+=' '+finalDelimiter+' ';}else{list+=delimiter+' ';}}list+=array[i];}return list;};callback=callback||function(o){return o.toString();};const realCallback=arg=>{return callback&&callback.call(this,arg);};if(finalDelim){return delimJoin(arr.map(realCallback),delim,finalDelim);}else{return arr.map(realCallback).join(delim+' ');}}}//@ts-nocheck
// =============================================================================
// Parser
// =============================================================================
class Parser{constructor(rules){this.done=true;this.rules=rules;}start(text){this.text=text;this.done=false;return this.nextSymbol();}isDone(){return this.done&&this.symbol===null;}nextSymbol(){let best;let bestSymbol;this.symbol=null;this.value=null;do{if(this.done)return false;let rule;best=null;for(const name in this.rules){rule=this.rules[name];const match=rule.exec(this.text);if(match){if(best===null||match[0].length>best[0].length){best=match;bestSymbol=name;}}}if(best!=null){this.text=this.text.substr(best[0].length);if(this.text==='')this.done=true;}if(best==null){this.done=true;this.symbol=null;this.value=null;return;}}while(bestSymbol==='SKIP');this.symbol=bestSymbol;this.value=best;return true;}accept(name){if(this.symbol===name){if(this.value){const v=this.value;this.nextSymbol();return v;}this.nextSymbol();return true;}return false;}acceptNumber(){return this.accept('number');}expect(name){if(this.accept(name))return true;throw new Error('expected '+name+' but found '+this.symbol);}}function parseText(text,language=ENGLISH){const options={};const ttr=new Parser(language.tokens);if(!ttr.start(text))return null;S();return options;function S(){// every [n]
ttr.expect('every');const n=ttr.acceptNumber();if(n)options.interval=parseInt(n[0],10);if(ttr.isDone())throw new Error('Unexpected end');switch(ttr.symbol){case'day(s)':options.freq=RRule.DAILY;if(ttr.nextSymbol()){AT();F();}break;// FIXME Note: every 2 weekdays != every two weeks on weekdays.
// DAILY on weekdays is not a valid rule
case'weekday(s)':options.freq=RRule.WEEKLY;options.byweekday=[RRule.MO,RRule.TU,RRule.WE,RRule.TH,RRule.FR];ttr.nextSymbol();F();break;case'week(s)':options.freq=RRule.WEEKLY;if(ttr.nextSymbol()){ON();F();}break;case'hour(s)':options.freq=RRule.HOURLY;if(ttr.nextSymbol()){ON();F();}break;case'minute(s)':options.freq=RRule.MINUTELY;if(ttr.nextSymbol()){ON();F();}break;case'month(s)':options.freq=RRule.MONTHLY;if(ttr.nextSymbol()){ON();F();}break;case'year(s)':options.freq=RRule.YEARLY;if(ttr.nextSymbol()){ON();F();}break;case'monday':case'tuesday':case'wednesday':case'thursday':case'friday':case'saturday':case'sunday':options.freq=RRule.WEEKLY;const key=ttr.symbol.substr(0,2).toUpperCase();options.byweekday=[RRule[key]];if(!ttr.nextSymbol())return;// TODO check for duplicates
while(ttr.accept('comma')){if(ttr.isDone())throw new Error('Unexpected end');const wkd=decodeWKD();if(!wkd){throw new Error('Unexpected symbol '+ttr.symbol+', expected weekday');}options.byweekday.push(RRule[wkd]);ttr.nextSymbol();}MDAYs();F();break;case'january':case'february':case'march':case'april':case'may':case'june':case'july':case'august':case'september':case'october':case'november':case'december':options.freq=RRule.YEARLY;options.bymonth=[decodeM()];if(!ttr.nextSymbol())return;// TODO check for duplicates
while(ttr.accept('comma')){if(ttr.isDone())throw new Error('Unexpected end');const m=decodeM();if(!m){throw new Error('Unexpected symbol '+ttr.symbol+', expected month');}options.bymonth.push(m);ttr.nextSymbol();}ON();F();break;default:throw new Error('Unknown symbol');}}function ON(){const on=ttr.accept('on');const the=ttr.accept('the');if(!(on||the))return;do{const nth=decodeNTH();const wkd=decodeWKD();const m=decodeM();// nth <weekday> | <weekday>
if(nth){// ttr.nextSymbol()
if(wkd){ttr.nextSymbol();if(!options.byweekday)options.byweekday=[];options.byweekday.push(RRule[wkd].nth(nth));}else{if(!options.bymonthday)options.bymonthday=[];options.bymonthday.push(nth);ttr.accept('day(s)');}// <weekday>
}else if(wkd){ttr.nextSymbol();if(!options.byweekday)options.byweekday=[];options.byweekday.push(RRule[wkd]);}else if(ttr.symbol==='weekday(s)'){ttr.nextSymbol();if(!options.byweekday){options.byweekday=[RRule.MO,RRule.TU,RRule.WE,RRule.TH,RRule.FR];}}else if(ttr.symbol==='week(s)'){ttr.nextSymbol();let n=ttr.acceptNumber();if(!n){throw new Error('Unexpected symbol '+ttr.symbol+', expected week number');}options.byweekno=[parseInt(n[0],10)];while(ttr.accept('comma')){n=ttr.acceptNumber();if(!n){throw new Error('Unexpected symbol '+ttr.symbol+'; expected monthday');}options.byweekno.push(parseInt(n[0],10));}}else if(m){ttr.nextSymbol();if(!options.bymonth)options.bymonth=[];options.bymonth.push(m);}else{return;}}while(ttr.accept('comma')||ttr.accept('the')||ttr.accept('on'));}function AT(){const at=ttr.accept('at');if(!at)return;do{let n=ttr.acceptNumber();if(!n){throw new Error('Unexpected symbol '+ttr.symbol+', expected hour');}options.byhour=[parseInt(n[0],10)];while(ttr.accept('comma')){n=ttr.acceptNumber();if(!n){throw new Error('Unexpected symbol '+ttr.symbol+'; expected hour');}options.byhour.push(parseInt(n[0],10));}}while(ttr.accept('comma')||ttr.accept('at'));}function decodeM(){switch(ttr.symbol){case'january':return 1;case'february':return 2;case'march':return 3;case'april':return 4;case'may':return 5;case'june':return 6;case'july':return 7;case'august':return 8;case'september':return 9;case'october':return 10;case'november':return 11;case'december':return 12;default:return false;}}function decodeWKD(){switch(ttr.symbol){case'monday':case'tuesday':case'wednesday':case'thursday':case'friday':case'saturday':case'sunday':return ttr.symbol.substr(0,2).toUpperCase();default:return false;}}function decodeNTH(){switch(ttr.symbol){case'last':ttr.nextSymbol();return-1;case'first':ttr.nextSymbol();return 1;case'second':ttr.nextSymbol();return ttr.accept('last')?-2:2;case'third':ttr.nextSymbol();return ttr.accept('last')?-3:3;case'nth':const v=parseInt(ttr.value[1],10);if(v<-366||v>366)throw new Error('Nth out of range: '+v);ttr.nextSymbol();return ttr.accept('last')?-v:v;default:return false;}}function MDAYs(){ttr.accept('on');ttr.accept('the');let nth=decodeNTH();if(!nth)return;options.bymonthday=[nth];ttr.nextSymbol();while(ttr.accept('comma')){nth=decodeNTH();if(!nth){throw new Error('Unexpected symbol '+ttr.symbol+'; expected monthday');}options.bymonthday.push(nth);ttr.nextSymbol();}}function F(){if(ttr.symbol==='until'){const date=Date.parse(ttr.text);if(!date)throw new Error('Cannot parse until date:'+ttr.text);options.until=new Date(date);}else if(ttr.accept('for')){options.count=parseInt(ttr.value[0],10);ttr.expect('number');// ttr.expect('times')
}}}var Frequency;(function(Frequency){Frequency[Frequency["YEARLY"]=0]="YEARLY";Frequency[Frequency["MONTHLY"]=1]="MONTHLY";Frequency[Frequency["WEEKLY"]=2]="WEEKLY";Frequency[Frequency["DAILY"]=3]="DAILY";Frequency[Frequency["HOURLY"]=4]="HOURLY";Frequency[Frequency["MINUTELY"]=5]="MINUTELY";Frequency[Frequency["SECONDLY"]=6]="SECONDLY";})(Frequency||(Frequency={}));function freqIsDailyOrGreater(freq){return freq<Frequency.HOURLY;}//@ts-nocheck
/* !
 * rrule.js - Library for working with recurrence rules for calendar dates.
 * https://github.com/jakubroztocil/rrule
 *
 * Copyright 2010, Jakub Roztocil and Lars Schoning
 * Licenced under the BSD licence.
 * https://github.com/jakubroztocil/rrule/blob/master/LICENCE
 *
 *//**
 *
 * Implementation of RRule.fromText() and RRule::toText().
 *
 *
 * On the client side, this file needs to be included
 * when those functions are used.
 *
 */// =============================================================================
// fromText
// =============================================================================
/**
 * Will be able to convert some of the below described rules from
 * text format to a rule object.
 *
 *
 * RULES
 *
 * Every ([n])
 * day(s)
 * | [weekday], ..., (and) [weekday]
 * | weekday(s)
 * | week(s)
 * | month(s)
 * | [month], ..., (and) [month]
 * | year(s)
 *
 *
 * Plus 0, 1, or multiple of these:
 *
 * on [weekday], ..., (or) [weekday] the [monthday], [monthday], ... (or) [monthday]
 *
 * on [weekday], ..., (and) [weekday]
 *
 * on the [monthday], [monthday], ... (and) [monthday] (day of the month)
 *
 * on the [nth-weekday], ..., (and) [nth-weekday] (of the month/year)
 *
 *
 * Plus 0 or 1 of these:
 *
 * for [n] time(s)
 *
 * until [date]
 *
 * Plus (.)
 *
 *
 * Definitely no supported for parsing:
 *
 * (for year):
 * in week(s) [n], ..., (and) [n]
 *
 * on the [yearday], ..., (and) [n] day of the year
 * on day [yearday], ..., (and) [n]
 *
 *
 * NON-TERMINALS
 *
 * [n]: 1, 2 ..., one, two, three ..
 * [month]: January, February, March, April, May, ... December
 * [weekday]: Monday, ... Sunday
 * [nth-weekday]: first [weekday], 2nd [weekday], ... last [weekday], ...
 * [monthday]: first, 1., 2., 1st, 2nd, second, ... 31st, last day, 2nd last day, ..
 * [date]:
 * - [month] (0-31(,) ([year])),
 * - (the) 0-31.(1-12.([year])),
 * - (the) 0-31/(1-12/([year])),
 * - [weekday]
 *
 * [year]: 0000, 0001, ... 01, 02, ..
 *
 * Definitely not supported for parsing:
 *
 * [yearday]: first, 1., 2., 1st, 2nd, second, ... 366th, last day, 2nd last day, ..
 *
 * @param {String} text
 * @return {Object, Boolean} the rule, or null.
 */const fromText=function(text,language=ENGLISH){return new RRule(parseText(text,language)||undefined);};const common=['count','until','interval','byweekday','bymonthday','bymonth'];ToText.IMPLEMENTED=[];ToText.IMPLEMENTED[Frequency.HOURLY]=common;ToText.IMPLEMENTED[Frequency.MINUTELY]=common;ToText.IMPLEMENTED[Frequency.DAILY]=['byhour'].concat(common);ToText.IMPLEMENTED[Frequency.WEEKLY]=common;ToText.IMPLEMENTED[Frequency.MONTHLY]=common;ToText.IMPLEMENTED[Frequency.YEARLY]=['byweekno','byyearday'].concat(common);// =============================================================================
// Export
// =============================================================================
const toText=function(rrule,gettext,language,dateFormatter){return new ToText(rrule,gettext,language,dateFormatter).toString();};const{isFullyConvertible}=ToText;//@ts-nocheck
class Time{constructor(hour,minute,second,millisecond){this.hour=hour;this.minute=minute;this.second=second;this.millisecond=millisecond||0;}getHours(){return this.hour;}getMinutes(){return this.minute;}getSeconds(){return this.second;}getMilliseconds(){return this.millisecond;}getTime(){return(this.hour*60*60+this.minute*60+this.second)*1000+this.millisecond;}}class DateTime extends Time{static fromDate(date){return new this(date.getUTCFullYear(),date.getUTCMonth()+1,date.getUTCDate(),date.getUTCHours(),date.getUTCMinutes(),date.getUTCSeconds(),date.valueOf()%1000);}constructor(year,month,day,hour,minute,second,millisecond){super(hour,minute,second,millisecond);this.year=year;this.month=month;this.day=day;}getWeekday(){return dateutil.getWeekday(new Date(this.getTime()));}getTime(){return new Date(Date.UTC(this.year,this.month-1,this.day,this.hour,this.minute,this.second,this.millisecond)).getTime();}getDay(){return this.day;}getMonth(){return this.month;}getYear(){return this.year;}addYears(years){this.year+=years;}addMonths(months){this.month+=months;if(this.month>12){const yearDiv=Math.floor(this.month/12);const monthMod=pymod(this.month,12);this.month=monthMod;this.year+=yearDiv;if(this.month===0){this.month=12;--this.year;}}}addWeekly(days,wkst){if(wkst>this.getWeekday()){this.day+=-(this.getWeekday()+1+(6-wkst))+days*7;}else{this.day+=-(this.getWeekday()-wkst)+days*7;}this.fixDay();}addDaily(days){this.day+=days;this.fixDay();}addHours(hours,filtered,byhour){if(filtered){// Jump to one iteration before next day
this.hour+=Math.floor((23-this.hour)/hours)*hours;}for(;;){this.hour+=hours;const{div:dayDiv,mod:hourMod}=divmod(this.hour,24);if(dayDiv){this.hour=hourMod;this.addDaily(dayDiv);}if(empty(byhour)||includes(byhour,this.hour))break;}}addMinutes(minutes,filtered,byhour,byminute){if(filtered){// Jump to one iteration before next day
this.minute+=Math.floor((1439-(this.hour*60+this.minute))/minutes)*minutes;}for(;;){this.minute+=minutes;const{div:hourDiv,mod:minuteMod}=divmod(this.minute,60);if(hourDiv){this.minute=minuteMod;this.addHours(hourDiv,false,byhour);}if((empty(byhour)||includes(byhour,this.hour))&&(empty(byminute)||includes(byminute,this.minute))){break;}}}addSeconds(seconds,filtered,byhour,byminute,bysecond){if(filtered){// Jump to one iteration before next day
this.second+=Math.floor((86399-(this.hour*3600+this.minute*60+this.second))/seconds)*seconds;}for(;;){this.second+=seconds;const{div:minuteDiv,mod:secondMod}=divmod(this.second,60);if(minuteDiv){this.second=secondMod;this.addMinutes(minuteDiv,false,byhour,byminute);}if((empty(byhour)||includes(byhour,this.hour))&&(empty(byminute)||includes(byminute,this.minute))&&(empty(bysecond)||includes(bysecond,this.second))){break;}}}fixDay(){if(this.day<=28){return;}let daysinmonth=dateutil.monthRange(this.year,this.month-1)[1];if(this.day<=daysinmonth){return;}while(this.day>daysinmonth){this.day-=daysinmonth;++this.month;if(this.month===13){this.month=1;++this.year;if(this.year>dateutil.MAXYEAR){return;}}daysinmonth=dateutil.monthRange(this.year,this.month-1)[1];}}add(options,filtered){const{freq,interval,wkst,byhour,byminute,bysecond}=options;switch(freq){case Frequency.YEARLY:return this.addYears(interval);case Frequency.MONTHLY:return this.addMonths(interval);case Frequency.WEEKLY:return this.addWeekly(interval,wkst);case Frequency.DAILY:return this.addDaily(interval);case Frequency.HOURLY:return this.addHours(interval,filtered,byhour);case Frequency.MINUTELY:return this.addMinutes(interval,filtered,byhour,byminute);case Frequency.SECONDLY:return this.addSeconds(interval,filtered,byhour,byminute,bysecond);}}}//@ts-nocheck
function initializeOptions(options){const invalid=[];const keys=Object.keys(options);// Shallow copy for options and origOptions and check for invalid
for(const key of keys){if(!includes(defaultKeys,key))invalid.push(key);if(dateutil$1.isDate(options[key])&&!dateutil$1.isValidDate(options[key])){invalid.push(key);}}if(invalid.length){throw new Error('Invalid options: '+invalid.join(', '));}return _objectSpread({},options);}function parseOptions(options){const opts=_objectSpread(_objectSpread({},DEFAULT_OPTIONS),initializeOptions(options));if(isPresent(opts.byeaster))opts.freq=RRule.YEARLY;if(!(isPresent(opts.freq)&&RRule.FREQUENCIES[opts.freq])){throw new Error(`Invalid frequency: ${opts.freq} ${options.freq}`);}if(!opts.dtstart)opts.dtstart=new Date(new Date().setMilliseconds(0));if(!isPresent(opts.wkst)){opts.wkst=RRule.MO.weekday;}else if(isNumber(opts.wkst));else{opts.wkst=opts.wkst.weekday;}if(isPresent(opts.bysetpos)){if(isNumber(opts.bysetpos))opts.bysetpos=[opts.bysetpos];for(let i=0;i<opts.bysetpos.length;i++){const v=opts.bysetpos[i];if(v===0||!(v>=-366&&v<=366)){throw new Error('bysetpos must be between 1 and 366,'+' or between -366 and -1');}}}if(!(Boolean(opts.byweekno)||notEmpty(opts.byweekno)||notEmpty(opts.byyearday)||Boolean(opts.bymonthday)||notEmpty(opts.bymonthday)||isPresent(opts.byweekday)||isPresent(opts.byeaster))){switch(opts.freq){case RRule.YEARLY:if(!opts.bymonth)opts.bymonth=opts.dtstart.getUTCMonth()+1;opts.bymonthday=opts.dtstart.getUTCDate();break;case RRule.MONTHLY:opts.bymonthday=opts.dtstart.getUTCDate();break;case RRule.WEEKLY:opts.byweekday=[dateutil$1.getWeekday(opts.dtstart)];break;}}// bymonth
if(isPresent(opts.bymonth)&&!isArray(opts.bymonth)){opts.bymonth=[opts.bymonth];}// byyearday
if(isPresent(opts.byyearday)&&!isArray(opts.byyearday)&&isNumber(opts.byyearday)){opts.byyearday=[opts.byyearday];}// bymonthday
if(!isPresent(opts.bymonthday)){opts.bymonthday=[];opts.bynmonthday=[];}else if(isArray(opts.bymonthday)){const bymonthday=[];const bynmonthday=[];for(let i=0;i<opts.bymonthday.length;i++){const v=opts.bymonthday[i];if(v>0){bymonthday.push(v);}else if(v<0){bynmonthday.push(v);}}opts.bymonthday=bymonthday;opts.bynmonthday=bynmonthday;}else if(opts.bymonthday<0){opts.bynmonthday=[opts.bymonthday];opts.bymonthday=[];}else{opts.bynmonthday=[];opts.bymonthday=[opts.bymonthday];}// byweekno
if(isPresent(opts.byweekno)&&!isArray(opts.byweekno)){opts.byweekno=[opts.byweekno];}// byweekday / bynweekday
if(!isPresent(opts.byweekday)){opts.bynweekday=null;}else if(isNumber(opts.byweekday)){opts.byweekday=[opts.byweekday];opts.bynweekday=null;}else if(isWeekdayStr(opts.byweekday)){opts.byweekday=[Weekday.fromStr(opts.byweekday).weekday];opts.bynweekday=null;}else if(opts.byweekday instanceof Weekday){if(!opts.byweekday.n||opts.freq>RRule.MONTHLY){opts.byweekday=[opts.byweekday.weekday];opts.bynweekday=null;}else{opts.bynweekday=[[opts.byweekday.weekday,opts.byweekday.n]];opts.byweekday=null;}}else{const byweekday=[];const bynweekday=[];for(let i=0;i<opts.byweekday.length;i++){const wday=opts.byweekday[i];if(isNumber(wday)){byweekday.push(wday);continue;}else if(isWeekdayStr(wday)){byweekday.push(Weekday.fromStr(wday).weekday);continue;}if(!wday.n||opts.freq>RRule.MONTHLY){byweekday.push(wday.weekday);}else{bynweekday.push([wday.weekday,wday.n]);}}opts.byweekday=notEmpty(byweekday)?byweekday:null;opts.bynweekday=notEmpty(bynweekday)?bynweekday:null;}// byhour
if(!isPresent(opts.byhour)){opts.byhour=opts.freq<RRule.HOURLY?[opts.dtstart.getUTCHours()]:null;}else if(isNumber(opts.byhour)){opts.byhour=[opts.byhour];}// byminute
if(!isPresent(opts.byminute)){opts.byminute=opts.freq<RRule.MINUTELY?[opts.dtstart.getUTCMinutes()]:null;}else if(isNumber(opts.byminute)){opts.byminute=[opts.byminute];}// bysecond
if(!isPresent(opts.bysecond)){opts.bysecond=opts.freq<RRule.SECONDLY?[opts.dtstart.getUTCSeconds()]:null;}else if(isNumber(opts.bysecond)){opts.bysecond=[opts.bysecond];}return{parsedOptions:opts};}function buildTimeset(opts){const millisecondModulo=opts.dtstart.getTime()%1000;if(!freqIsDailyOrGreater(opts.freq)){return[];}const timeset=[];opts.byhour.forEach(hour=>{opts.byminute.forEach(minute=>{opts.bysecond.forEach(second=>{timeset.push(new Time(hour,minute,second,millisecondModulo));});});});return timeset;}//@ts-nocheck
function parseString(rfcString){const options=rfcString.split('\n').map(parseLine).filter(x=>x!==null);return _objectSpread(_objectSpread({},options[0]),options[1]);}function parseDtstart(line){const options={};const dtstartWithZone=/DTSTART(?:;TZID=([^:=]+?))?(?::|=)([^;\s]+)/i.exec(line);if(!dtstartWithZone){return options;}const[,tzid,dtstart]=dtstartWithZone;if(tzid){options.tzid=tzid;}options.dtstart=dateutil$1.untilStringToDate(dtstart);return options;}function parseLine(rfcString){rfcString=rfcString.replace(/^\s+|\s+$/,'');if(!rfcString.length)return null;const header=/^([A-Z]+?)[:;]/.exec(rfcString.toUpperCase());if(!header){return parseRrule(rfcString);}const[,key]=header;switch(key.toUpperCase()){case'RRULE':case'EXRULE':return parseRrule(rfcString);case'DTSTART':return parseDtstart(rfcString);default:throw new Error(`Unsupported RFC prop ${key} in ${rfcString}`);}}function parseRrule(line){const strippedLine=line.replace(/^RRULE:/i,'');const options=parseDtstart(strippedLine);const attrs=line.replace(/^(?:RRULE|EXRULE):/i,'').split(';');attrs.forEach(attr=>{const[key,value]=attr.split('=');switch(key.toUpperCase()){case'FREQ':options.freq=Frequency[value.toUpperCase()];break;case'WKST':options.wkst=Days[value.toUpperCase()];break;case'COUNT':case'INTERVAL':case'BYSETPOS':case'BYMONTH':case'BYMONTHDAY':case'BYYEARDAY':case'BYWEEKNO':case'BYHOUR':case'BYMINUTE':case'BYSECOND':const num=parseNumber(value);const optionKey=key.toLowerCase();// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
options[optionKey]=num;break;case'BYWEEKDAY':case'BYDAY':options.byweekday=parseWeekday(value);break;case'DTSTART':case'TZID':// for backwards compatibility
const dtstart=parseDtstart(line);options.tzid=dtstart.tzid;options.dtstart=dtstart.dtstart;break;case'UNTIL':options.until=dateutil$1.untilStringToDate(value);break;case'BYEASTER':options.byeaster=Number(value);break;default:throw new Error("Unknown RRULE property '"+key+"'");}});return options;}function parseNumber(value){if(value.indexOf(',')!==-1){const values=value.split(',');return values.map(parseIndividualNumber);}return parseIndividualNumber(value);}function parseIndividualNumber(value){if(/^[+-]?\d+$/.test(value)){return Number(value);}return value;}function parseWeekday(value){const days=value.split(',');return days.map(day=>{if(day.length===2){// MO, TU, ...
return Days[day];// wday instanceof Weekday
}// -1MO, +3FR, 1SO, 13TU ...
const parts=day.match(/^([+-]?\d{1,2})([A-Z]{2})$/);if(!parts||parts.length<3){throw new SyntaxError(`Invalid weekday string: ${day}`);}const n=Number(parts[1]);const wdaypart=parts[2];const wday=Days[wdaypart].weekday;return new Weekday(wday,n);});}//@ts-nocheck
class DateWithZone{constructor(date,tzid){if(isNaN(date.getTime())){throw new RangeError('Invalid date passed to DateWithZone');}this.date=date;this.tzid=tzid;}get isUTC(){return!this.tzid||this.tzid.toUpperCase()==='UTC';}toString(){const datestr=dateutil$1.timeToUntilString(this.date.getTime(),this.isUTC);if(!this.isUTC){return`;TZID=${this.tzid}:${datestr}`;}return`:${datestr}`;}getTime(){return this.date.getTime();}rezonedDate(){var _this$tzid;if(this.isUTC){return this.date;}const localTimeZone=Intl.DateTimeFormat().resolvedOptions().timeZone;const dateInLocalTZ=new Date(this.date.toLocaleString(undefined,{timeZone:localTimeZone}));const dateInTargetTZ=new Date(this.date.toLocaleString(undefined,{timeZone:(_this$tzid=this.tzid)!==null&&_this$tzid!==void 0?_this$tzid:'UTC'}));const tzOffset=dateInTargetTZ.getTime()-dateInLocalTZ.getTime();return new Date(this.date.getTime()-tzOffset);}}function optionsToString(options){const rrule=[];let dtstart='';const keys=Object.keys(options);const defaultKeys=Object.keys(DEFAULT_OPTIONS);for(let i=0;i<keys.length;i++){if(keys[i]==='tzid')continue;if(!includes(defaultKeys,keys[i]))continue;let key=keys[i].toUpperCase();const value=options[keys[i]];let outValue='';if(!isPresent(value)||isArray(value)&&!value.length)continue;switch(key){case'FREQ':outValue=RRule.FREQUENCIES[options.freq];break;case'WKST':if(isNumber(value)){outValue=new Weekday(value).toString();}else{outValue=value.toString();}break;case'BYWEEKDAY':/*
                  NOTE: BYWEEKDAY is a special case.
                  RRule() deconstructs the rule.options.byweekday array
                  into an array of Weekday arguments.
                  On the other hand, rule.origOptions is an array of Weekdays.
                  We need to handle both cases here.
                  It might be worth change RRule to keep the Weekdays.
        
                  Also, BYWEEKDAY (used by RRule) vs. BYDAY (RFC)
        
                  */key='BYDAY';outValue=toArray(value).map(wday=>{if(wday instanceof Weekday){return wday;}if(isArray(wday)){return new Weekday(wday[0],wday[1]);}return new Weekday(wday);}).toString();break;case'DTSTART':dtstart=buildDtstart(value,options.tzid);break;case'UNTIL':outValue=dateutil$1.timeToUntilString(value,!options.tzid);break;default:if(isArray(value)){const strValues=[];for(let j=0;j<value.length;j++){strValues[j]=String(value[j]);}outValue=strValues.toString();}else{outValue=String(value);}}if(outValue){rrule.push([key,outValue]);}}const rules=rrule.map(([key,value])=>`${key}=${value.toString()}`).join(';');let ruleString='';if(rules!==''){ruleString=`RRULE:${rules}`;}return[dtstart,ruleString].filter(x=>!!x).join('\n');}function buildDtstart(dtstart,tzid){if(!dtstart){return'';}return'DTSTART'+new DateWithZone(new Date(dtstart),tzid).toString();}//@ts-nocheck
function argsMatch(left,right){if(Array.isArray(left)){if(!Array.isArray(right))return false;if(left.length!==right.length)return false;return left.every((date,i)=>date.getTime()===right[i].getTime());}if(left instanceof Date){return right instanceof Date&&left.getTime()===right.getTime();}return left===right;}class Cache{constructor(){this.all=false;this.before=[];this.after=[];this.between=[];}/**
     * @param {String} what - all/before/after/between
     * @param {Array,Date} value - an array of dates, one date, or null
     * @param {Object?} args - _iter arguments
     */_cacheAdd(what,value,args){if(value){value=value instanceof Date?dateutil$1.clone(value):dateutil$1.cloneDates(value);}if(what==='all'){this.all=value;}else{args._value=value;this[what].push(args);}}/**
     * @return false - not in the cache
     * @return null  - cached, but zero occurrences (before/after)
     * @return Date  - cached (before/after)
     * @return []    - cached, but zero occurrences (all/between)
     * @return [Date1, DateN] - cached (all/between)
     */_cacheGet(what,args){let cached=false;const argsKeys=args?Object.keys(args):[];const findCacheDiff=function(item){for(let i=0;i<argsKeys.length;i++){const key=argsKeys[i];if(!argsMatch(args[key],item[key])){return true;}}return false;};const cachedObject=this[what];if(what==='all'){cached=this.all;}else if(isArray(cachedObject)){// Let's see whether we've already called the
// 'what' method with the same 'args'
for(let i=0;i<cachedObject.length;i++){const item=cachedObject[i];if(argsKeys.length&&findCacheDiff(item))continue;cached=item._value;break;}}if(!cached&&this.all){// Not in the cache, but we already know all the occurrences,
// so we can find the correct dates from the cached ones.
const iterResult=new IterResult(what,args);for(let i=0;i<this.all.length;i++){if(!iterResult.accept(this.all[i]))break;}cached=iterResult.getValue();this._cacheAdd(what,cached,args);}return isArray(cached)?dateutil$1.cloneDates(cached):cached instanceof Date?dateutil$1.clone(cached):cached;}}//@ts-nocheck
// =============================================================================
// Date masks
// =============================================================================
// Every mask is 7 days longer to handle cross-year weekly periods.
const M365MASK=[...repeat(1,31),...repeat(2,28),...repeat(3,31),...repeat(4,30),...repeat(5,31),...repeat(6,30),...repeat(7,31),...repeat(8,31),...repeat(9,30),...repeat(10,31),...repeat(11,30),...repeat(12,31),...repeat(1,7)];const M366MASK=[...repeat(1,31),...repeat(2,29),...repeat(3,31),...repeat(4,30),...repeat(5,31),...repeat(6,30),...repeat(7,31),...repeat(8,31),...repeat(9,30),...repeat(10,31),...repeat(11,30),...repeat(12,31),...repeat(1,7)];const M28=range(1,29);const M29=range(1,30);const M30=range(1,31);const M31=range(1,32);const MDAY366MASK=[...M31,...M29,...M31,...M30,...M31,...M30,...M31,...M31,...M30,...M31,...M30,...M31,...M31.slice(0,7)];const MDAY365MASK=[...M31,...M28,...M31,...M30,...M31,...M30,...M31,...M31,...M30,...M31,...M30,...M31,...M31.slice(0,7)];const NM28=range(-28,0);const NM29=range(-29,0);const NM30=range(-30,0);const NM31=range(-31,0);const NMDAY366MASK=[...NM31,...NM29,...NM31,...NM30,...NM31,...NM30,...NM31,...NM31,...NM30,...NM31,...NM30,...NM31,...NM31.slice(0,7)];const NMDAY365MASK=[...NM31,...NM28,...NM31,...NM30,...NM31,...NM30,...NM31,...NM31,...NM30,...NM31,...NM30,...NM31,...NM31.slice(0,7)];const M366RANGE=[0,31,60,91,121,152,182,213,244,274,305,335,366];const M365RANGE=[0,31,59,90,120,151,181,212,243,273,304,334,365];const WDAYMASK=function(){let wdaymask=[];for(let i=0;i<55;i++)wdaymask=wdaymask.concat(range(7));return wdaymask;}();function rebuildYear(year,options){const firstyday=new Date(Date.UTC(year,0,1));const yearlen=dateutil$1.isLeapYear(year)?366:365;const nextyearlen=dateutil$1.isLeapYear(year+1)?366:365;const yearordinal=dateutil$1.toOrdinal(firstyday);const yearweekday=dateutil$1.getWeekday(firstyday);const result=_objectSpread(_objectSpread({yearlen,nextyearlen,yearordinal,yearweekday},baseYearMasks(year)),{},{wnomask:null});if(empty(options.byweekno)){return result;}result.wnomask=repeat(0,yearlen+7);let firstwkst;let wyearlen;let no1wkst=firstwkst=pymod(7-yearweekday+options.wkst,7);if(no1wkst>=4){no1wkst=0;// Number of days in the year, plus the days we got
// from last year.
wyearlen=result.yearlen+pymod(yearweekday-options.wkst,7);}else{// Number of days in the year, minus the days we
// left in last year.
wyearlen=yearlen-no1wkst;}const div=Math.floor(wyearlen/7);const mod=pymod(wyearlen,7);const numweeks=Math.floor(div+mod/4);for(let j=0;j<options.byweekno.length;j++){let n=options.byweekno[j];if(n<0){n+=numweeks+1;}if(!(n>0&&n<=numweeks)){continue;}let i;if(n>1){i=no1wkst+(n-1)*7;if(no1wkst!==firstwkst){i-=7-firstwkst;}}else{i=no1wkst;}for(let k=0;k<7;k++){result.wnomask[i]=1;i++;if(result.wdaymask[i]===options.wkst)break;}}if(includes(options.byweekno,1)){// Check week number 1 of next year as well
// orig-TODO : Check -numweeks for next year.
let i=no1wkst+numweeks*7;if(no1wkst!==firstwkst)i-=7-firstwkst;if(i<yearlen){// If week starts in next year, we
// don't care about it.
for(let j=0;j<7;j++){result.wnomask[i]=1;i+=1;if(result.wdaymask[i]===options.wkst)break;}}}if(no1wkst){// Check last week number of last year as
// well. If no1wkst is 0, either the year
// started on week start, or week number 1
// got days from last year, so there are no
// days from last year's last week number in
// this year.
let lnumweeks;if(!includes(options.byweekno,-1)){const lyearweekday=dateutil$1.getWeekday(new Date(Date.UTC(year-1,0,1)));let lno1wkst=pymod(7-lyearweekday.valueOf()+options.wkst,7);const lyearlen=dateutil$1.isLeapYear(year-1)?366:365;let weekst;if(lno1wkst>=4){lno1wkst=0;weekst=lyearlen+pymod(lyearweekday-options.wkst,7);}else{weekst=yearlen-no1wkst;}lnumweeks=Math.floor(52+pymod(weekst,7)/4);}else{lnumweeks=-1;}if(includes(options.byweekno,lnumweeks)){for(let i=0;i<no1wkst;i++)result.wnomask[i]=1;}}return result;}function baseYearMasks(year){const yearlen=dateutil$1.isLeapYear(year)?366:365;const firstyday=new Date(Date.UTC(year,0,1));const wday=dateutil$1.getWeekday(firstyday);if(yearlen===365){return{mmask:M365MASK,mdaymask:MDAY365MASK,nmdaymask:NMDAY365MASK,wdaymask:WDAYMASK.slice(wday),mrange:M365RANGE};}return{mmask:M366MASK,mdaymask:MDAY366MASK,nmdaymask:NMDAY366MASK,wdaymask:WDAYMASK.slice(wday),mrange:M366RANGE};}function rebuildMonth(year,month,yearlen,mrange,wdaymask,options){const result={lastyear:year,lastmonth:month,nwdaymask:[]};let ranges=[];if(options.freq===RRule.YEARLY){if(empty(options.bymonth)){ranges=[[0,yearlen]];}else{for(let j=0;j<options.bymonth.length;j++){month=options.bymonth[j];ranges.push(mrange.slice(month-1,month+1));}}}else if(options.freq===RRule.MONTHLY){ranges=[mrange.slice(month-1,month+1)];}if(empty(ranges)){return result;}// Weekly frequency won't get here, so we may not
// care about cross-year weekly periods.
result.nwdaymask=repeat(0,yearlen);for(let j=0;j<ranges.length;j++){const rang=ranges[j];const first=rang[0];const last=rang[1]-1;for(let k=0;k<options.bynweekday.length;k++){let i;const[wday,n]=options.bynweekday[k];if(n<0){i=last+(n+1)*7;i-=pymod(wdaymask[i]-wday,7);}else{i=first+(n-1)*7;i+=pymod(7-wdaymask[i]+wday,7);}if(first<=i&&i<=last)result.nwdaymask[i]=1;}}return result;}//@ts-nocheck
function easter(y,offset=0){const a=y%19;const b=Math.floor(y/100);const c=y%100;const d=Math.floor(b/4);const e=b%4;const f=Math.floor((b+8)/25);const g=Math.floor((b-f+1)/3);const h=Math.floor(19*a+b-d-g+15)%30;const i=Math.floor(c/4);const k=c%4;const l=Math.floor(32+2*e+2*i-h-k)%7;const m=Math.floor((a+11*h+22*l)/451);const month=Math.floor((h+l-7*m+114)/31);const day=(h+l-7*m+114)%31+1;const date=Date.UTC(y,month-1,day+offset);const yearStart=Date.UTC(y,0,1);return[Math.ceil((date-yearStart)/(1000*60*60*24))];}//@ts-nocheck
// =============================================================================
// Iterinfo
// =============================================================================
class Iterinfo{// eslint-disable-next-line no-empty-function
constructor(options){this.options=options;}rebuild(year,month){const options=this.options;if(year!==this.lastyear){this.yearinfo=rebuildYear(year,options);}if(notEmpty(options.bynweekday)&&(month!==this.lastmonth||year!==this.lastyear)){const{yearlen,mrange,wdaymask}=this.yearinfo;this.monthinfo=rebuildMonth(year,month,yearlen,mrange,wdaymask,options);}if(isPresent(options.byeaster)){this.eastermask=easter(year,options.byeaster);}}get lastyear(){return this.monthinfo?this.monthinfo.lastyear:null;}get lastmonth(){return this.monthinfo?this.monthinfo.lastmonth:null;}get yearlen(){return this.yearinfo.yearlen;}get yearordinal(){return this.yearinfo.yearordinal;}get mrange(){return this.yearinfo.mrange;}get wdaymask(){return this.yearinfo.wdaymask;}get mmask(){return this.yearinfo.mmask;}get wnomask(){return this.yearinfo.wnomask;}get nwdaymask(){return this.monthinfo?this.monthinfo.nwdaymask:[];}get nextyearlen(){return this.yearinfo.nextyearlen;}get mdaymask(){return this.yearinfo.mdaymask;}get nmdaymask(){return this.yearinfo.nmdaymask;}ydayset(){return[range(this.yearlen),0,this.yearlen];}mdayset(_,month){const start=this.mrange[month-1];const end=this.mrange[month];const set=repeat(null,this.yearlen);for(let i=start;i<end;i++)set[i]=i;return[set,start,end];}wdayset(year,month,day){// We need to handle cross-year weeks here.
const set=repeat(null,this.yearlen+7);let i=dateutil$1.toOrdinal(new Date(Date.UTC(year,month-1,day)))-this.yearordinal;const start=i;for(let j=0;j<7;j++){set[i]=i;++i;if(this.wdaymask[i]===this.options.wkst)break;}return[set,start,i];}ddayset(year,month,day){const set=repeat(null,this.yearlen);const i=dateutil$1.toOrdinal(new Date(Date.UTC(year,month-1,day)))-this.yearordinal;set[i]=i;return[set,i,i+1];}htimeset(hour,_,second,millisecond){let set=[];this.options.byminute.forEach(minute=>{set=set.concat(this.mtimeset(hour,minute,second,millisecond));});dateutil$1.sort(set);return set;}mtimeset(hour,minute,_,millisecond){const set=this.options.bysecond.map(second=>new Time(hour,minute,second,millisecond));dateutil$1.sort(set);return set;}stimeset(hour,minute,second,millisecond){return[new Time(hour,minute,second,millisecond)];}getdayset(freq){switch(freq){case Frequency.YEARLY:return this.ydayset.bind(this);case Frequency.MONTHLY:return this.mdayset.bind(this);case Frequency.WEEKLY:return this.wdayset.bind(this);case Frequency.DAILY:return this.ddayset.bind(this);default:return this.ddayset.bind(this);}}gettimeset(freq){switch(freq){case Frequency.HOURLY:return this.htimeset.bind(this);case Frequency.MINUTELY:return this.mtimeset.bind(this);case Frequency.SECONDLY:return this.stimeset.bind(this);}}}//@ts-nocheck
function buildPoslist(bysetpos,timeset,start,end,ii,dayset){const poslist=[];for(let j=0;j<bysetpos.length;j++){let daypos;let timepos;const pos=bysetpos[j];if(pos<0){daypos=Math.floor(pos/timeset.length);timepos=pymod(pos,timeset.length);}else{daypos=Math.floor((pos-1)/timeset.length);timepos=pymod(pos-1,timeset.length);}const tmp=[];for(let k=start;k<end;k++){const val=dayset[k];if(!isPresent(val))continue;tmp.push(val);}let i;if(daypos<0){i=tmp.slice(daypos)[0];}else{i=tmp[daypos];}const time=timeset[timepos];const date=dateutil$1.fromOrdinal(ii.yearordinal+i);const res=dateutil$1.combine(date,time);// XXX: can this ever be in the array?
// - compare the actual date instead?
if(!includes(poslist,res))poslist.push(res);}dateutil$1.sort(poslist);return poslist;}function iter(iterResult,options){const{dtstart,freq,interval,until,bysetpos}=options;let count=options.count;if(count===0||interval===0){return emitResult(iterResult);}const counterDate=DateTime.fromDate(dtstart);const ii=new Iterinfo(options);ii.rebuild(counterDate.year,counterDate.month);let timeset=makeTimeset(ii,counterDate,options);for(;;){const[dayset,start,end]=ii.getdayset(freq)(counterDate.year,counterDate.month,counterDate.day);const filtered=removeFilteredDays(dayset,start,end,ii,options);if(notEmpty(bysetpos)){const poslist=buildPoslist(bysetpos,timeset,start,end,ii,dayset);for(let j=0;j<poslist.length;j++){const res=poslist[j];if(until&&res>until){return emitResult(iterResult);}if(res>=dtstart){const rezonedDate=rezoneIfNeeded(res,options);if(!iterResult.accept(rezonedDate)){return emitResult(iterResult);}if(count){--count;if(!count){return emitResult(iterResult);}}}}}else{for(let j=start;j<end;j++){const currentDay=dayset[j];if(!isPresent(currentDay)){continue;}const date=dateutil$1.fromOrdinal(ii.yearordinal+currentDay);for(let k=0;k<timeset.length;k++){const time=timeset[k];const res=dateutil$1.combine(date,time);if(until&&res>until){return emitResult(iterResult);}if(res>=dtstart){const rezonedDate=rezoneIfNeeded(res,options);if(!iterResult.accept(rezonedDate)){return emitResult(iterResult);}if(count){--count;if(!count){return emitResult(iterResult);}}}}}}if(options.interval===0){return emitResult(iterResult);}// Handle frequency and interval
counterDate.add(options,filtered);if(counterDate.year>dateutil$1.MAXYEAR){return emitResult(iterResult);}if(!freqIsDailyOrGreater(freq)){timeset=ii.gettimeset(freq)(counterDate.hour,counterDate.minute,counterDate.second,0);}ii.rebuild(counterDate.year,counterDate.month);}}function isFiltered(ii,currentDay,options){const{bymonth,byweekno,byweekday,byeaster,bymonthday,bynmonthday,byyearday}=options;return notEmpty(bymonth)&&!includes(bymonth,ii.mmask[currentDay])||notEmpty(byweekno)&&!ii.wnomask[currentDay]||notEmpty(byweekday)&&!includes(byweekday,ii.wdaymask[currentDay])||notEmpty(ii.nwdaymask)&&!ii.nwdaymask[currentDay]||byeaster!==null&&!includes(ii.eastermask,currentDay)||(notEmpty(bymonthday)||notEmpty(bynmonthday))&&!includes(bymonthday,ii.mdaymask[currentDay])&&!includes(bynmonthday,ii.nmdaymask[currentDay])||notEmpty(byyearday)&&(currentDay<ii.yearlen&&!includes(byyearday,currentDay+1)&&!includes(byyearday,-ii.yearlen+currentDay)||currentDay>=ii.yearlen&&!includes(byyearday,currentDay+1-ii.yearlen)&&!includes(byyearday,-ii.nextyearlen+currentDay-ii.yearlen));}function rezoneIfNeeded(date,options){return new DateWithZone(date,options.tzid).rezonedDate();}function emitResult(iterResult){return iterResult.getValue();}function removeFilteredDays(dayset,start,end,ii,options){let filtered=false;for(let dayCounter=start;dayCounter<end;dayCounter++){const currentDay=dayset[dayCounter];filtered=isFiltered(ii,currentDay,options);if(filtered)dayset[currentDay]=null;}return filtered;}function makeTimeset(ii,counterDate,options){const{freq,byhour,byminute,bysecond}=options;if(freqIsDailyOrGreater(freq)){return buildTimeset(options);}if(freq>=RRule.HOURLY&&notEmpty(byhour)&&!includes(byhour,counterDate.hour)||freq>=RRule.MINUTELY&&notEmpty(byminute)&&!includes(byminute,counterDate.minute)||freq>=RRule.SECONDLY&&notEmpty(bysecond)&&!includes(bysecond,counterDate.second)){return[];}return ii.gettimeset(freq)(counterDate.hour,counterDate.minute,counterDate.second,counterDate.millisecond);}//@ts-nocheck
// =============================================================================
// RRule
// =============================================================================
const Days={MO:new Weekday(0),TU:new Weekday(1),WE:new Weekday(2),TH:new Weekday(3),FR:new Weekday(4),SA:new Weekday(5),SU:new Weekday(6)};const DEFAULT_OPTIONS={freq:Frequency.YEARLY,dtstart:null,interval:1,wkst:Days.MO,count:null,until:null,tzid:null,bysetpos:null,bymonth:null,bymonthday:null,bynmonthday:null,byyearday:null,byweekno:null,byweekday:null,bynweekday:null,byhour:null,byminute:null,bysecond:null,byeaster:null};const defaultKeys=Object.keys(DEFAULT_OPTIONS);/**
 *
 * @param {Options?} options - see <http://labix.org/python-dateutil/#head-cf004ee9a75592797e076752b2a889c10f445418>
 * - The only required option is `freq`, one of RRule.YEARLY, RRule.MONTHLY, ...
 * @constructor
 */class RRule{constructor(options={},noCache=false){// RFC string
this._cache=noCache?null:new Cache();// used by toString()
this.origOptions=initializeOptions(options);const{parsedOptions}=parseOptions(options);this.options=parsedOptions;}static parseText(text,language){return parseText(text,language);}static fromText(text,language){return fromText(text,language);}static fromString(str){return new RRule(RRule.parseString(str)||undefined);}_iter(iterResult){return iter(iterResult,this.options);}_cacheGet(what,args){if(!this._cache)return false;return this._cache._cacheGet(what,args);}_cacheAdd(what,value,args){if(!this._cache)return;return this._cache._cacheAdd(what,value,args);}/**
     * @param {Function} iterator - optional function that will be called
     * on each date that is added. It can return false
     * to stop the iteration.
     * @return Array containing all recurrences.
     */all(iterator){if(iterator){return this._iter(new CallbackIterResult('all',{},iterator));}let result=this._cacheGet('all');if(result===false){result=this._iter(new IterResult('all',{}));this._cacheAdd('all',result);}return result;}/**
     * Returns all the occurrences of the rrule between after and before.
     * The inc keyword defines what happens if after and/or before are
     * themselves occurrences. With inc == True, they will be included in the
     * list, if they are found in the recurrence set.
     *
     * @return Array
     */between(after,before,inc=false,iterator){if(!dateutil$1.isValidDate(after)||!dateutil$1.isValidDate(before)){throw new Error('Invalid date passed in to RRule.between');}const args={before,after,inc};if(iterator){return this._iter(new CallbackIterResult('between',args,iterator));}let result=this._cacheGet('between',args);if(result===false){result=this._iter(new IterResult('between',args));this._cacheAdd('between',result,args);}return result;}/**
     * Returns the last recurrence before the given datetime instance.
     * The inc keyword defines what happens if dt is an occurrence.
     * With inc == True, if dt itself is an occurrence, it will be returned.
     *
     * @return Date or null
     */before(dt,inc=false){if(!dateutil$1.isValidDate(dt)){throw new Error('Invalid date passed in to RRule.before');}const args={dt:dt,inc:inc};let result=this._cacheGet('before',args);if(result===false){result=this._iter(new IterResult('before',args));this._cacheAdd('before',result,args);}return result;}/**
     * Returns the first recurrence after the given datetime instance.
     * The inc keyword defines what happens if dt is an occurrence.
     * With inc == True, if dt itself is an occurrence, it will be returned.
     *
     * @return Date or null
     */after(dt,inc=false){if(!dateutil$1.isValidDate(dt)){throw new Error('Invalid date passed in to RRule.after');}const args={dt:dt,inc:inc};let result=this._cacheGet('after',args);if(result===false){result=this._iter(new IterResult('after',args));this._cacheAdd('after',result,args);}return result;}/**
     * Returns the number of recurrences in this set. It will have go trough
     * the whole recurrence, if this hasn't been done before.
     */count(){return this.all().length;}/**
     * Converts the rrule into its string representation
     *
     * @see <http://www.ietf.org/rfc/rfc2445.txt>
     * @return String
     */toString(){return optionsToString(this.origOptions);}/**
     * Will convert all rules described in nlp:ToText
     * to text.
     */toText(gettext,language,dateFormatter){return toText(this,gettext,language,dateFormatter);}isFullyConvertibleToText(){return isFullyConvertible(this);}/**
     * @return a RRule instance with the same freq and options
     * as this one (cache is not cloned)
     */clone(){return new RRule(this.origOptions);}}// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
_RRule=RRule;// RRule class 'constants'
_RRule.FREQUENCIES=['YEARLY','MONTHLY','WEEKLY','DAILY','HOURLY','MINUTELY','SECONDLY'];_RRule.YEARLY=Frequency.YEARLY;_RRule.MONTHLY=Frequency.MONTHLY;_RRule.WEEKLY=Frequency.WEEKLY;_RRule.DAILY=Frequency.DAILY;_RRule.HOURLY=Frequency.HOURLY;_RRule.MINUTELY=Frequency.MINUTELY;_RRule.SECONDLY=Frequency.SECONDLY;_RRule.MO=Days.MO;_RRule.TU=Days.TU;_RRule.WE=Days.WE;_RRule.TH=Days.TH;_RRule.FR=Days.FR;_RRule.SA=Days.SA;_RRule.SU=Days.SU;_RRule.parseString=parseString;_RRule.optionsToString=optionsToString;class CalendarEvent{constructor(id,parentId,data,startTime,endTime,priority){this.parentId=null;this.id=id;this.parentId=parentId;this.data=data;this.start=startTime;this.end=endTime;const interval=Interval.fromDateTimes(startTime,endTime);this.duration=interval.toDuration();this.priority=priority;this._interval=interval;}get shortId(){return this.id.substring(0,7);}setPriority(priority){this.priority=priority;return this;}contains(dateTime){return this._interval.contains(dateTime);}getEvents(startTime,endTime){const interval=Interval.fromDateTimes(startTime,endTime);return interval.overlaps(this._interval)?[this]:[];}getEventsForDay(date){const startTime=date.startOf('day');const endTime=date.endOf('day');const interval=Interval.fromDateTimes(startTime,endTime);return interval.overlaps(this._interval)?[this]:[];}get interval(){return this._interval;}toJSON(){return{id:this.id,parentId:this.parentId,start:this.start.toISO(),duration:this.duration.toISO(),priority:this.priority,data:this.data};}static fromJSON(json){const startTime=DateTime$1.fromISO(json.start);const endTime=startTime.plus(Duration.fromISO(json.duration));const event=new CalendarEvent(json.id,json.parentId,json.data,startTime,endTime,json.priority);return event;}}// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
const MAX_DATE=DateTime$1.fromJSDate(new Date(8.64e15));const MAX_DURATION=Duration.fromMillis(8.64e15);// The base meta-data for scheduled events.
class ScheduleItem{// eventSeries: id of the scheduled event.
constructor(eventSeries,decl,start_offset,end_offset){this.eventSeries=eventSeries;this.decl=decl;this.start_offset=start_offset;this.end_offset=end_offset;}get shortEventSeries(){return this.eventSeries.substring(0,7);}get id(){return this.decl.id;}get shortId(){return this.decl.id.substring(0,7);}get duration(){return this.decl.duration;}}// For a given time window.
class ScheduleItemView{constructor(schedule_item,playlist_start){this.schedule_item=schedule_item;this._start_time=playlist_start.plus(schedule_item.start_offset);this._end_time=playlist_start.plus(schedule_item.end_offset);}get eventSeries(){return this.schedule_item.eventSeries;}get shortEventSeries(){return this.schedule_item.shortEventSeries;}get id(){return this.decl.id;}get shortId(){return this.decl.id.substring(0,7);}get currentSrc(){return this.decl.href;}get start_time(){return this._start_time;}get end_time(){return this._end_time;}get decl(){return this.schedule_item.decl;}get start_offset(){return this.schedule_item.start_offset;}get end_offset(){return this.schedule_item.end_offset;}_remainingTime(datetime){if(this._end_time.equals(MAX_DATE)){return"Infinity";}const interval=Interval.fromDateTimes(datetime,this._end_time);return interval.length('milliseconds');}summary(datetime){if(datetime<=this._end_time){return{decl:this.decl,remainingTimeMs:this._remainingTime(datetime),startTime:this._start_time.equals(MAX_DATE)?"Infinity":this._start_time.toISO(),endTime:this._end_time.equals(MAX_DATE)?"Infinity":this._end_time.toISO()};}return{decl:this.decl,remainingTimeMs:"Infinity",startTime:this._start_time.equals(MAX_DATE)?"Infinity":this._start_time.toISO(),endTime:this._end_time.equals(MAX_DATE)?"Infinity":this._end_time.toISO()};}}const DateTimeHandler={canHandle:val=>val instanceof DateTime$1,serialize:val=>{return[val.toMillis(),[]];},deserialize:num=>DateTime$1.fromMillis(num)};const CalendarEventHandler={canHandle:val=>val instanceof CalendarEvent,serialize:val=>{return[val.toJSON(),[]];},deserialize:obj=>CalendarEvent.fromJSON(obj)};const CalendarEventArrayHandler={canHandle:val=>Array.isArray(val)&&val.every(x=>x instanceof CalendarEvent),serialize:val=>{return[val.map(x=>x.toJSON()),[]];},deserialize:obj=>obj.map(x=>CalendarEvent.fromJSON(x))};transferHandlers.set("DATETIME",DateTimeHandler);transferHandlers.set("CALENDAREVENT",CalendarEventHandler);transferHandlers.set("CALENDAREVENTARRAY",CalendarEventArrayHandler);class CalendarSchedule{get _isDynamic(){return this._isOnce||this._isToggle;}constructor(decl,lowWatermark,highWatermark){this.decl=decl;this._queue=[];this._isOnce=false;this._isToggle=false;this._isReady=false;this._hasDeathNote=false;this._isActivated=false;this._isPulling=false;this._worker=this._workerFactory();this._calendar=wrap(this._worker);this._lowWatermark=Duration.fromDurationLike(lowWatermark);this._highWatermark=Duration.fromDurationLike(highWatermark);this._isOnce=this.decl.hasOwnProperty('onceOn');this._isToggle=this.decl.hasOwnProperty('enableOn')&&this.decl.hasOwnProperty('disableOn');if(this._isOnce){const match=this.decl.onceOn.match;console.log(`${this.shortId}: once schedule: ${JSON.stringify(match)}`);this._onceListener=event=>{console.log(`${this.shortId}: event ${JSON.stringify(event)}`);for(const prop in match){console.log('prop',prop);if(prop[0]==='@'){continue;}if(!event.detail.hasOwnProperty(prop)){console.log('no prop');continue;}if(event.detail[prop]===match[prop]){const datetime=DateTime$1.now();this._activate(datetime);}}};self.addEventListener(this.decl.onceOn.type,this._onceListener);}else if(this._isToggle){const matchOn=this.decl.enableOn.match;const matchOff=this.decl.disableOn.match;console.log(`${this.shortId}: toggle schedule: ${JSON.stringify(matchOn)}, ${JSON.stringify(matchOff)}`);this._enableListener=event=>{console.log(`${this.shortId}: event ${JSON.stringify(event)}`);for(const prop in matchOn){console.log('prop',prop);if(prop[0]==='@'){continue;}if(!event.detail.hasOwnProperty(prop)){console.log('no prop');continue;}if(event.detail[prop]===matchOn[prop]){const datetime=DateTime$1.now();this._activate(datetime);}}};this._disableListener=event=>{console.log(`${this.shortId}: event ${JSON.stringify(event)}`);for(const prop in matchOff){console.log('prop',prop);if(prop[0]==='@'){continue;}if(!event.detail.hasOwnProperty(prop)){console.log('no prop');continue;}if(event.detail[prop]===matchOff[prop]){const datetime=DateTime$1.now();this._deactivate(datetime);}}};self.addEventListener(this.decl.enableOn.type,this._enableListener);self.addEventListener(this.decl.disableOn.type,this._disableListener);}this._isActivated=!this._isDynamic;}// Use relative path on local file system due to LG WebOS security policy.
_workerFactory(){if(location.protocol==='file:'){return new Worker('../dist/calendar.bundle~chrome53.js',{type:'classic',credentials:'omit',name:`Calendar - ${this.shortId}`});}return new Worker(new URL('../dist/calendar.bundle.js',location.href).pathname,{type:'module',credentials:'omit',name:`Calendar - ${this.shortId}`});}_activate(datetime){var _this=this;return _asyncToGenerator(function*(){console.log(`${_this.shortId}: _activate(${datetime.toISO()})`);yield _this._calendar.parseSchedule(_this.id,_objectSpread(_objectSpread({},_this.decl),{},{start:datetime.toISO()}));_this._isActivated=true;})();}_deactivate(datetime){console.log(`${this.shortId}: _deactivate(${datetime.toISO()})`);this._isActivated=false;}get id(){return this.decl.id;}get shortId(){return this.id.substring(0,7);}set isReady(isReady){console.log(`${this.shortId}: isReady(${isReady})`);this._isReady=isReady;}get isReady(){return this._isReady;}get isActive(){return this._isReady&&this._isActivated;}// Forced re-interpretation of Recipe schema to wider type.
get entries(){return this.decl.playlist.entries;}get sources(){const hrefs=new Set();for(const decl of this.entries){// Primary asset,
hrefs.add({"@type":decl["@type"],id:decl.id,href:decl.href,size:decl.size,hash:decl.hash,integrity:decl.integrity,md5:decl.md5});// Dependent assets.
if('sources'in decl&&Array.isArray(decl.sources)){for(const asset of decl.sources){hrefs.add(asset);}}}return Array.from(hrefs.values());}summary(datetime){let pct=0;if(typeof this.tail!=="undefined"){this.tail.end.toISO();const interval=Interval.fromDateTimes(datetime,this.tail.end);const duration=interval.toDuration('milliseconds');pct=100*Math.min(duration.toMillis(),this._highWatermark.toMillis())/this._highWatermark.toMillis();}const queue=this._queue.map(entry=>entry.interval.toISO());return{id:this.shortId,pct,queue};}parseSchedule(decl){var _this2=this;return _asyncToGenerator(function*(){console.log(`${_this2.shortId}: parseSchedule`);if(_this2._isDynamic){return;}yield _this2._calendar.parseSchedule(_this2.id,decl);})();}_getEvents(startTime,endTime){var _this3=this;return _asyncToGenerator(function*(){//		console.log(`${this.shortId}: getEvents ${startTime.toISO()} -> ${endTime.toISO()}.`);
return yield _this3._calendar.getEvents(startTime,endTime);})();}setLowWatermark(durationLike){console.log(`${this.shortId}: setLowWatermark(${JSON.stringify(durationLike)})`);this._lowWatermark=Duration.fromDurationLike(durationLike);}setHighWatermark(durationLike){console.log(`${this.shortId}: setHighWatermark(${JSON.stringify(durationLike)})`);this._highWatermark=Duration.fromDurationLike(durationLike);}// Fill to high watermark when breaking low.
pull(datetime){var _this4=this;return _asyncToGenerator(function*(){//console.log(`${this.shortId}: pull(${datetime.toISO()})`);
if(!_this4._isActivated){return false;}if(_this4._aboveLowWatermark(datetime)){return false;}const headTime=typeof _this4.head==="undefined"?datetime:_this4.head.start;const endTime=headTime.plus(_this4._highWatermark);performance.now();const events=yield _this4._getEvents(datetime,endTime);//console.log(`${this.shortId}: getEvents ${Math.round(performance.now() - t0)}ms.`);
_this4._queue=events;return true;})();}prefetch(datetime){const headTime=typeof this.head==="undefined"?datetime:this.head.start;const tailTime=typeof this.tail==="undefined"?datetime:this.tail.end;const endTime=headTime.plus(this._highWatermark).plus(this._lowWatermark);if(endTime>tailTime){this._calendar.prefetchEvents(headTime,endTime).catch(err=>{console.error(err);});}}// Destructive to queue.
getCalendarEvent(datetime){//		console.log(`${this.shortId}: getCalendarEvent(${datetime.toISO()})`);
if(!this.isActive){return null;}else if(this._isOnce){if(typeof this.head!=="undefined"&&datetime>this.head.end){this._deactivate(datetime);return null;}}if(!this._isPulling){this._isPulling=true;this.pull(datetime).then(()=>{this.prefetch(datetime);}).finally(()=>{this._isPulling=false;});}while(true){if(typeof this.head==="undefined"){return null;}if(datetime<this.head.end){break;}this._queue.shift();}return this.head;}peekCalendarEvent(datetime){//		console.log(`${this.shortId}: peekCalendarEvent(${datetime.toISO()})`);
if(!this.isActive){return null;}else if(this._isOnce){if(typeof this.head!=="undefined"&&datetime>this.head.end){this._deactivate(datetime);return null;}}if(!this._isPulling){this._isPulling=true;this.pull(datetime).then(()=>{this.prefetch(datetime);}).finally(()=>{this._isPulling=false;});}for(const entry of this._queue){if(datetime<entry.end){return entry;}}return null;}get isEmpty(){return this._queue.length===0;}get head(){return this.isEmpty?undefined:this._queue[0];}get tail(){return this.isEmpty?undefined:this._queue[this._queue.length-1];}_aboveLowWatermark(datetime){//		console.log(`aboveLowWatermark(${datetime.toISO()})`);
if(typeof this.tail==="undefined"){return false;}const interval=Interval.fromDateTimes(datetime,this.tail.end);const duration=interval.toDuration('seconds');return duration>this._lowWatermark;}close(){if(typeof this._onceListener!=="undefined"){self.removeEventListener(this.decl.onceOn.type,this._onceListener);}if(typeof this._enableListener!=="undefined"){self.removeEventListener(this.decl.enableOn.type,this._enableListener);}if(typeof this._disableListener!=="undefined"){self.removeEventListener(this.decl.disableOn.type,this._disableListener);}this._calendar[releaseProxy]();this._worker.terminate();this._isReady=false;}closeWhenHidden(){this._hasDeathNote=true;if(!this.isReady){console.log(`${this.shortId}: Closing.`);this.close();}}hidden(){if(this._hasDeathNote){console.log(`${this.shortId}: Closing when hidden.`);this.close();}}toJSON(){return{decl:this.decl,"_lowWatermark":this._lowWatermark.toISO(),"_highWatermark":this._highWatermark.toISO(),"_queue":this._queue.map(x=>x.toJSON())};}}class BasicScheduler extends EventTarget$1{constructor(){super();this.autoplay=true;this.mergePlaylist=true;this._src="";this._src_id="";this._src_size=0;this._src_hash=undefined;this._src_integrity="";this._src_md5="";this._currentTime=DateTime$1.fromMillis(0);// UNIX epoch.
this._inTransition=false;this._transitionStartTime=DateTime$1.fromMillis(0);this._transitionEndTime=DateTime$1.fromMillis(0);this._transitionPercent=0;this._transitionPercentSpeed=0;this._play_resolve=null;this._play_reject=null;this._schedule_cluster=undefined;// Per HTMLMediaElement.
this._ended=false;this._error=null;this._networkState=Constants.NETWORK_NO_SOURCE;this._paused=true;this._readyState=Constants.HAVE_NOTHING;this._seeking=false;// Active MediaAssets.
this._joined_cluster=undefined;this._active_media_assets=[];this._media_list_duration=Duration.fromMillis(0);this._media_list_current=null;this._media_current=null;this._media_next=null;this._transitionFrom=null;this._transitionTo=null;this._hasInterrupt=false;this._transitionSize=0;this._calendar_schedules=[];this.addEventListener('loadedmetadata',event=>this._onLoadedMetadata(event));}get debugInTransition(){return this._inTransition;}_schedulerFactory(decl,lowWatermark,highWatermark){return new CalendarSchedule(decl,lowWatermark,highWatermark);}close(){}get src(){return this._src;}set src(href){var _this5=this;if(!this.mergePlaylist||href.length===0){_asyncToGenerator(function*(){yield _this5._clear();})();}this._src=href;if(this.autoplay&&this.src.length!==0){console.log(`BASIC-SCHEDULER: Auto-playing ${this.src} (${this.src_id})`);_asyncToGenerator(function*(){yield _this5.play();})();}}get src_id(){return this._src_id;}set src_id(src_id){this._src_id=src_id;}get src_size(){return this._src_size;}set src_size(size){this._src_size=size;}get src_hash(){return this._src_hash;}set src_hash(hash){this._src_hash=hash;}get src_integrity(){return this._src_integrity;}set src_integrity(integrity){this._src_integrity=integrity;}get src_md5(){return this._src_md5;}set src_md5(md5){this._src_md5=md5;}get currentTime(){return this._currentTime;}set currentTime(datetime){this._currentTime=datetime;}// Per HTMLMediaElement.
get ended(){return this._ended;}get error(){return this._error;}get networkState(){return this._networkState;}get paused(){return this._paused;}get readyState(){return this._readyState;}get seeking(){return this._seeking;}load(){var _this6=this;_asyncToGenerator(function*(){try{console.log("BASIC-SCHEDULER: load");_this6.dispatchEvent(new Event('loadstart'));_this6._networkState=Constants.NETWORK_LOADING;const schedule=yield _this6._fetch(_this6.src);_this6._networkState=Constants.NETWORK_IDLE;yield _this6._parseRecipe(schedule);_this6._readyState=Constants.HAVE_FUTURE_DATA;_this6.dispatchEvent(new Event('loadedmetadata'));_this6.dispatchEvent(new Event('loadeddata'));}catch(e){console.warn(e);_this6._networkState=Constants.NETWORK_IDLE;const event=new CustomEvent('error',{detail:e});_this6.dispatchEvent(event);}})();}pause(){if(this.paused){return;}console.log(`BASIC-SCHEDULER: Pausing ${this.src} (${this.src_id})`);this._paused=true;this.dispatchEvent(new Event('pause'));}play(){var _this7=this;return _asyncToGenerator(function*(){console.log("BASIC-SCHEDULER: play");if(_this7._play_resolve!==null){_this7.removeEventListener('canplay',_this7._play_resolve);}if(_this7._play_reject!==null){_this7.removeEventListener('error',_this7._play_reject);}yield new Promise((resolve,reject)=>{_this7._play_resolve=_event=>{_this7._play_resolve=null;resolve();};_this7._play_reject=event=>{_this7._play_reject=null;console.warn(event);reject(event);};_this7.addEventListener('canplay',_this7._play_resolve,{once:true});_this7.addEventListener('error',_this7._play_reject,{once:true});try{_this7.load();}catch(ex){console.warn(ex);reject(ex);}});_this7._paused=false;_this7.dispatchEvent(new Event('play'));_this7.dispatchEvent(new Event('playing'));})();}update(datetime){var _this$_media_list_cur;//		console.log("BASIC-SCHEDULER: update", datetime.toISO());
if(this.paused){return;}let need_seek=false;if(this._hasInterrupt){console.debug(`BASIC-SCHEDULER: Event playback, ${datetime.toISO()}.`);need_seek=true;}else if(datetime<this._currentTime){console.debug(`BASIC-SCHEDULER: Rewinding playback, ${this._currentTime.toISO()} -> ${datetime.toISO()}.`);need_seek=true;}else if(this._media_current===null){console.debug(`BASIC-SCHEDULER: Fast-seek forward, ${this._currentTime.toISO()} -> ${datetime.toISO()}.`);need_seek=true;}else if(datetime>=this._mediaCurrentEndTime){console.debug(`BASIC-SCHEDULER: Fast-forward playback, ${this._currentTime.toISO()} -> ${datetime.toISO()}.`);need_seek=true;}this._currentTime=datetime;if(need_seek){this._onSeekStarted();}const last_calendar_schedule_id=(_this$_media_list_cur=this._media_list_current)===null||_this$_media_list_cur===void 0?void 0:_this$_media_list_cur.parentId;this._media_list_current=this._getMediaListContains(datetime);this._updateMediaList(this._media_list_current);if(this._media_list_current!==null){this._media_current=this._seekMediaList(datetime,this._media_list_current);if(this._media_current!==null){const next_events=this._peekMediaListContains(this._media_current.end_time);if(next_events!==null){this._media_next=this._seekMediaList(this._media_current.end_time,next_events);}else{this._media_next=null;}}}else{this._media_current=null;}if(typeof last_calendar_schedule_id!=="undefined"){if(this._media_list_current===null||last_calendar_schedule_id!==this._media_list_current.parentId){const last_calendar_schedule=this._calendar_schedules.find(x=>x.id===last_calendar_schedule_id);if(typeof last_calendar_schedule!=="undefined"){last_calendar_schedule.hidden();}}}if(this._media_current===null){const next_events=this._peekMediaListAfter(datetime);if(next_events!==null){const next_datetime=DateTime$1.max(datetime,next_events.start);this._media_next=this._seekMediaList(next_datetime,next_events);}else{this._media_next=null;}}if(need_seek){this._onSeekEnded();}// [ intro ] -- content -- [ outro ] [ intro ] -- next content --
// Into and outro are scoped to the current media, thus after current media
// end time, i.e. the intro of the next content, the values for both intro
// and outro will have advanced in time.
if(!this._inTransition){if(datetime>=this._transitionOutroStartTime&&datetime<this._transitionOutroEndTime){console.debug(`BASIC-SCHEDULER: Start transition on outro: ${this._transitionOutroEndTime} > ${datetime.toISO()} >= ${this._transitionOutroStartTime.toISO()}`);this._onTransitionStart(this._transitionOutroStartTime);}else if(datetime>=this._transitionIntroStartTime&&datetime<this._transitionIntroEndTime){console.debug(`BASIC-SCHEDULER: Start transition on intro: ${this._transitionIntroEndTime.toISO()} > ${datetime.toISO()} >= ${this._transitionIntroStartTime.toISO()}`);this._onTransitionStart(this._transitionPreviousOutroStartTime);}}else{// Explicitly only a transition that has been started.
if(datetime>=this._transitionEndTime){this._onTransitionEnded(this._transitionEndTime);}}if(this._inTransition){this._updateTransition(datetime);}//		console.info(this.state(datetime));
}_onTransitionStart(datetime){console.debug(`BASIC-SCHEDULER: _onTransitionStart(${datetime.toISO()})`);if(this._media_current===null){throw new Error("current is null.");}this._transitionFrom=this._media_current.decl;// Schedule may have updated and next media has not been set.
if(this._media_next===null){console.warn("next is null.");return;}if(typeof this._transitionTime==="undefined"){throw new Error("transition time is undefined.");}this._transitionTo=this._media_next.decl;this._inTransition=true;this._transitionStartTime=datetime;this._transitionEndTime=datetime.plus({seconds:this._transitionTime});console.debug(`BASIC-SCHEDULER: Transition end: ${this._transitionEndTime.toISO()}`);}_updateTransition(datetime){//		console.log("BASIC-SCHEDULER: _updateTransition");
const interval=Interval.fromDateTimes(this._transitionStartTime,datetime);const elapsed=interval.length('seconds');if(typeof this._transitionTime==="undefined"){throw new Error("transition time is undefined.");}this._transitionPercent=Math.min(1.0,elapsed/this._transitionTime);this._transitionPercentSpeed=1/this._transitionTime;if(this._media_next===null){throw new Error("next is null.");}}_onTransitionEnded(datetime){console.debug(`BASIC-SCHEDULER: _onTransitionEnded(${datetime.toISO()}`);this._inTransition=false;this._transitionFrom=null;this._transitionTo=null;}_onSeekStarted(){//		console.log("BASIC-SCHEDULER: _onSeekStarted");
this._seeking=true;this.dispatchEvent(new Event('seeking'));}_onSeekEnded(){//		console.log("BASIC-SCHEDULER: _onSeekEnded");
this._seeking=false;this.dispatchEvent(new Event('seeked'));this.dispatchEvent(new Event('playing'));}state(datetime){const currentTime=datetime.toISO();if(currentTime===null){throw new Error("Cannot convert datetime to ISO.");}const eventSeries=this._calendar_schedules.map(calendar=>calendar.summary(datetime));const mediaList=this._active_media_assets.map(asset=>{const start=asset.start_offset.equals(MAX_DURATION)?"Infinity":asset.start_offset.toISO();if(start===null){throw new Error("Cannot convert start offset to ISO.");}const end=asset.end_offset.equals(MAX_DURATION)?"Infinity":asset.end_offset.toISO();if(end===null){throw new Error("Cannot convert end offset to ISO.");}const media={id:asset.shortId,start,end};return media;});const mediaCurrent=this._media_current===null?null:this._media_current.summary(datetime);const mediaNext=this._media_next===null?null:this._media_next.summary(datetime);const transition=this._inTransition&&this._transitionFrom!==null&&this._transitionTo!==null&&typeof this._transitionUrl==="string"?{from:{decl:this._transitionFrom},to:{decl:this._transitionTo},url:this._transitionUrl,percent:this._transitionPercent,percentSpeed:this._transitionPercentSpeed}:null;return{currentTime,eventSeries,mediaList,mediaCurrent,mediaNext,transition};}_onLoadedMetadata(_event){var _this8=this;_asyncToGenerator(function*(){console.groupCollapsed("BASIC-SCHEDULER: _onLoadedMetadata");_this8._media_list_current=_this8._getMediaListContains(_this8._currentTime);_this8._updateMediaList(_this8._media_list_current);if(_this8._media_list_current!==null){_this8._media_current=_this8._seekMediaList(_this8._currentTime,_this8._media_list_current);}if(_this8._media_current!==null){const event=_this8._peekMediaListContains(_this8._mediaCurrentEndTime);_this8._media_next=null;if(event!==null&&event.data.entries.length!==0){_this8._media_next=_this8._seekMediaList(_this8._mediaCurrentEndTime,event);}}else if(_this8._media_next!==null){const event=_this8._peekMediaListAfter(_this8._currentTime);if(event!==null){_this8._media_next=_this8._seekMediaList(event.start,event);}}_this8.dispatchEvent(new Event('canplay'));console.groupEnd();})();}_fetch(url){return _asyncToGenerator(function*(){console.log("BASIC-SCHEDULER: _fetch",url);const response=yield fetch(url);const referenced=yield response.json();const result=yield parse$1(referenced,{scope:self.location.href});return structuredClone(result);})();}_clear(){var _this9=this;return _asyncToGenerator(function*(){_this9._currentTime=DateTime$1.fromMillis(0);_this9._inTransition=false;_this9._transitionStartTime=DateTime$1.fromMillis(0);_this9._transitionEndTime=DateTime$1.fromMillis(0);_this9._transitionPercent=0;_this9._transitionPercentSpeed=0;_this9._ended=false;_this9._error=null;_this9._networkState=Constants.NETWORK_NO_SOURCE;_this9._paused=true;_this9._readyState=Constants.HAVE_NOTHING;_this9._seeking=false;if(typeof _this9._joined_cluster==="string"&&typeof _this9._leave==="function"){yield _this9._leave();_this9._joined_cluster=undefined;}_this9._active_media_assets=[];_this9._media_list_duration=Duration.fromMillis(0);_this9._media_list_current=null;_this9._media_current=null;_this9._media_next=null;_this9._transitionFrom=null;_this9._transitionTo=null;_this9._hasInterrupt=false;_this9._transitionId=undefined;_this9._transitionUrl=undefined;_this9._transitionSize=0;_this9._transitionHash=undefined;_this9._transitionIntegrity=undefined;_this9._transitionTime=undefined;for(const calendar of _this9._calendar_schedules){calendar.close();}_this9._calendar_schedules=[];})();}get currentSrc(){if(this._media_current===null){return this._media_current;}return this._media_current.currentSrc;}// All MediaDecl's for set of schedules.
get entries(){let entries=[];for(const schedule of this._calendar_schedules){entries=entries.concat(schedule.entries);}return entries;}// Unique media URLs for set of schedules.
get sources(){const sources=[];if(this._src){sources.push({scope:'schedule',entries:[{'@type':'Text',id:this._src_id,href:this._src,size:this._src_size,hash:this._src_hash,integrity:this._src_integrity,md5:this._src_md5,duration:0}],isReady:true});}if(this._transitionId&&this._transitionUrl&&this._transitionSize&&this._transitionHash&&this._transitionIntegrity&&this._transitionMd5&&this._transitionTime){sources.push({scope:this._transitionId,entries:[{'@type':'HTMLImageElement',id:this._transitionId,href:this._transitionUrl,size:this._transitionSize,hash:this._transitionHash,integrity:this._transitionIntegrity,md5:this._transitionMd5,duration:this._transitionTime}],// TODO: enable transition once it is ready.
isReady:false});}for(const schedule of this._calendar_schedules){sources.push({scope:schedule.id,entries:schedule.entries,// Forward getter/setter to calendar schedule.
get isReady(){return schedule.isReady;},set isReady(isReady){schedule.isReady=isReady;}});}return sources;}// Duration of one iteration of content inside the media list,
// as opposed to the window of playback.
_calculateMediaListIterationDuration(calendar_event){return calendar_event.data.entries.reduce((accumulator,currentValue)=>accumulator+currentValue.duration,0);}_calculateMediaListStart(datetime,duration){const start_time=datetime.minus({milliseconds:datetime.toMillis()%duration.toMillis()});//		console.log('list-start', datetime.toISO(), duration.toISO(), '->', start_time.toISO());
return start_time;}// ScheduleItemView must be in respect to the media list boundary.
_seekMediaList(datetime,calendar_event){//		console.log("BASIC-SCHEDULER: _seekMediaList", datetime.toISO());
if(calendar_event.data.entries.length===0){return null;}const duration=Duration.fromMillis(1000*this._calculateMediaListIterationDuration(calendar_event));let media_list_start=this._calculateMediaListStart(datetime,duration);while(datetime>=media_list_start.plus(duration)){media_list_start=media_list_start.plus(duration);}let start_offset=Duration.fromMillis(0);for(let i=0;i<calendar_event.data.entries.length;i++){const end_offset=start_offset.plus({seconds:calendar_event.data.entries[i].duration});const entry=new ScheduleItem(calendar_event.id,calendar_event.data.entries[i],start_offset,end_offset);const view=new ScheduleItemView(entry,media_list_start);if(datetime>=view.start_time&&datetime<view.end_time){return view;}start_offset=end_offset;}return null;}_add(eventSeries,decl){//		console.log("BASIC-SCHEDULER: _add", decl.toString());
const start_offset=this._media_list_duration;const end_offset=start_offset.plus({seconds:decl.duration});//console.log("BASIC-SCHEDULER: start", start_offset.toISO(), "end", end_offset.toISO());
this._active_media_assets.push(new ScheduleItem(eventSeries,decl,start_offset,end_offset));this._media_list_duration=end_offset;}//	protected _has(id: string): boolean {
//		const pos = this.values().findIndex(x => x.decl.id === id);
//		return pos !== -1;
//	}
_remove(id){//		console.log("BASIC-SCHEDULER: _remove", id);
const pos=this._active_media_assets.findIndex(x=>x.decl.id===id);const media_asset=this._active_media_assets[pos];this._media_list_duration=this._media_list_duration.minus({seconds:media_asset.duration});this._active_media_assets.splice(pos,1);}exposeNetwork(join,leave){this._join=join;this._leave=leave;}_parseRecipe(json){var _this0=this;return _asyncToGenerator(function*(){console.groupCollapsed("BASIC-SCHEDULER: _parseRecipe");// Parse and validate through ZOD.
const recipe=RecipeSchema.Recipe.parse(json);if('cluster'in recipe&&typeof recipe.cluster==='object'&&typeof _this0._join==='function'){const cluster_as_text=JSON.stringify(recipe.cluster);if(typeof _this0._joined_cluster==='string'&&_this0._joined_cluster===cluster_as_text){console.log("BASIC-SCHEDULER: Already joined cluster.");}else if(typeof _this0._leave==='function'){yield _this0._leave();}yield _this0._join(recipe.cluster);_this0._joined_cluster=cluster_as_text;}else if(typeof _this0._leave==='function'){yield _this0._leave();_this0._joined_cluster=undefined;}_this0._transitionId=recipe.transition.id;_this0._transitionUrl=recipe.transition.href;_this0._transitionSize=recipe.transition.size;_this0._transitionHash=recipe.transition.hash;_this0._transitionIntegrity=recipe.transition.integrity;_this0._transitionMd5=recipe.transition.md5;_this0._transitionTime=recipe.transition.duration;const calendar_schedules=[];let trash_stack=[];// Copy umodified calendar schedules from running state.
const running_schedules_by_id=new Map();for(const schedule of _this0._calendar_schedules){running_schedules_by_id.set(schedule.id,schedule);}for(const decl of recipe.schedule){const calendar_schedule=running_schedules_by_id.get(decl.id);if(typeof calendar_schedule!=="undefined"){calendar_schedules.push(calendar_schedule);running_schedules_by_id.delete(decl.id);}}trash_stack=trash_stack.concat(Array.from(running_schedules_by_id.values()));let promises=[];const now=DateTime$1.local();const lowWatermark={'seconds':30};let highWatermark={'seconds':90};const t0=performance.now();for(const decl of recipe.schedule){const schedule=new CalendarSchedule(decl,lowWatermark,highWatermark);promises.push(schedule.parseSchedule(decl));calendar_schedules.push(schedule);}yield Promise.all(promises);// preload events, ensuring calculation time is less than 60% of playback time.
let round=1;let t1=t0;while(true){promises=[];for(const schedule of calendar_schedules){schedule.setHighWatermark(highWatermark);promises.push(schedule.pull(now));}console.log(`Round ${round}: High watermark: ${highWatermark.seconds/60} minutes.`);yield Promise.all(promises);const t2=performance.now();const elapsed=(t2-t1)/1000;const limit=.1*highWatermark.seconds;console.log(`Round ${round}: ${elapsed}s, limit: ${limit}s.`);if(elapsed<limit){break;}t1=t2;highWatermark.seconds*=2;round++;if(round>=8){// 768 minutes.
break;}}const t3=performance.now();console.log(`Schedule parsed after ${(t3-t0)/1000}s.`);console.groupEnd();for(const schedule of calendar_schedules){schedule.prefetch(now);}_this0._calendar_schedules=calendar_schedules;// FIXME: Needs a close on complete flag to prevent interruption
// of playing content.
for(const schedule of trash_stack){schedule.closeWhenHidden();}})();}// ---> current playlist, respect end date within media.
_updateMediaList(calendar_event){//		console.log("BASIC-SCHEDULER: _updateMediaList");
if(calendar_event===null){for(const entry of this._active_media_assets){this._remove(entry.decl.id);}}else{const old_list=this._active_media_assets;const new_list=this._createMediaListFromCalendarEvent(calendar_event);// dirty playlist needs evaluation.
const additions=(x,y)=>x.filter(z=>y.findIndex(w=>w.decl.id===z.id)===-1);const deletions=(x,y)=>x.filter(z=>y.findIndex(w=>w.id===z.decl.id)===-1);for(const entry of additions(new_list,old_list)){this._add(calendar_event.id,entry);}for(const entry of deletions(old_list,new_list)){this._remove(entry.decl.id);}}}_getMediaListContains(datetime){//		console.groupCollapsed("BASIC-SCHEDULER: _getMediaListContains", datetime.toISO());
const all_events=[];for(const schedule of this._calendar_schedules){const event=schedule.getCalendarEvent(datetime);if(event===null){continue;}if(event.contains(datetime)){all_events.push(event);}}// 0 = undefined, 1 = highest priority, 9 = lowest priority.
// Sort to find the active media list, but does not determine playback boundary.
all_events.sort((a,b)=>{const priority=a.priority-b.priority;if(priority!==0){return priority;}const start=a.start.toMillis()-b.start.toMillis();return start;});const events=all_events.slice(0,1);//		console.groupEnd();
return events.length===0?null:events[0];}_peekMediaListContains(datetime){//		console.groupCollapsed("BASIC-SCHEDULER: _peekMediaListContains", datetime.toISO());
const all_events=[];for(const schedule of this._calendar_schedules){const event=schedule.peekCalendarEvent(datetime);if(event===null){continue;}if(event.contains(datetime)){all_events.push(event);}}// 0 = undefined, 1 = highest priority, 9 = lowest priority.
//		console.log("raw", JSON.stringify(all_events.map(x => {
//			return {
//				id: x.shortId,
//				start: x.start.toMillis(),
//				text: x.start.toISO(),
//				priority: x.priority,
//			};
//		})));
// Sort to find the active media list, but does not determine playback boundary.
all_events.sort((a,b)=>{const priority=a.priority-b.priority;if(priority!==0){return priority;}const start=a.start.toMillis()-b.start.toMillis();return start;});//		console.log("sorted", JSON.stringify(all_events.map(x => {
//			return {
//				id: x.shortId,
//				start: x.start.toMillis(),
//				text: x.start.toISO(),
//				priority: x.priority,
//			};
//		})));
const events=all_events.slice(0,1);//		console.groupEnd();
return events.length===0?null:events[0];}_peekMediaListAfter(datetime){//		console.groupCollapsed("BASIC-SCHEDULER: _peekMediaListAfter", datetime.toISO());
const all_events=[];for(const schedule of this._calendar_schedules){const event=schedule.peekCalendarEvent(datetime);if(event===null){continue;}if(event.start>=datetime||event.end>=datetime){all_events.push(event);}}all_events.sort((a,b)=>{const priority=a.priority-b.priority;if(priority!==0){return priority;}const start=a.start.toMillis()-b.start.toMillis();return start;});const events=all_events.slice(0,1);//		console.log("events", all_events);
//		console.groupEnd();
return events.length===0?null:events[0];}_createMediaListFromCalendarEvent(calendar_event){const media_list=[];for(const entry of calendar_event.data.entries){switch(entry["@type"]){case"HTMLImageElement":case"HTMLVideoElement":{const{'@type':type,id,href,size,hash,md5,integrity,params,duration}=entry;media_list.push({'@type':type,id,href,size,hash,md5,integrity,params,duration});break;}case'CustomElement':{const{'@type':type,id,href,size,hash,md5,integrity,params,duration,sources=undefined}=entry;media_list.push({'@type':type,id,href,size,hash,md5,integrity,params,duration,sources});break;}default:console.warn(`BASIC-SCHEDULER: Unknown media type ${entry["@type"]}`);break;}}return media_list;}get _mediaCurrentEndTime(){if(this._media_current===null){// By definition, end time is infinite.
return MAX_DATE;}return this._media_current.end_time;}get _transitionIntroStartTime(){if(this._media_current===null){// By definition, start time is infinite.
return MAX_DATE;}return this._media_current.start_time;}get _transitionIntroEndTime(){if(this._media_current===null){// By definition, end time is infinite.
return MAX_DATE;}if(typeof this._transitionTime==="undefined"){throw new Error("transition time is undefined.");}return this._media_current.start_time.plus({seconds:this._transitionTime/2});}get _transitionOutroStartTime(){if(this._media_current===null){// By definition, end time is infinite.
return MAX_DATE;}if(typeof this._transitionTime==="undefined"){throw new Error("transition time is undefined.");}// Has to be current for calculation post start-time to be valid.
return this._media_current.end_time.minus({seconds:this._transitionTime/2});}get _transitionOutroEndTime(){if(this._media_current===null){// By definition, end time is infinite.
return MAX_DATE;}return this._media_current.end_time;}get _transitionPreviousOutroStartTime(){if(this._media_current===null){// By definition, end time is infinite.
return MAX_DATE;}if(typeof this._transitionTime==="undefined"){throw new Error("transition time is undefined.");}// Has to be current for calculation post start-time to be valid.
return this._media_current.start_time.minus({seconds:this._transitionTime/2});}}// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
console.info('SCHEDULER: WebWorker started.');const scheduler=new BasicScheduler();scheduler.autoplay=false;scheduler.addEventListener('loadeddata',()=>{console.log(`SCHEDULER: Media list loaded.`);_asyncToGenerator(function*(){for(const sources of scheduler.sources){console.log(`SCHEDULER: Preparing scope "${sources.scope}" with ${sources.entries.length} entries.`);yield renderer.setSources(sources.scope,sources.entries);console.log(`SCHEDULER: Scope "${sources.scope}" ready.`);// Scope content is loaded and ready for usage.
sources.isReady=true;}})();});let statePort;let update_id;let renderer;// An equivalent to self.requestAnimationFrame() or self.requestIdleCallback()
// that runs at a constant fixed frequency.
const interval=1000/10/* 10 Hz */;let lastTime=0;function requestUpdate(callback){const now=performance.now();const target=Math.max(0,interval-(now-lastTime));const id=self.setTimeout(()=>callback(now+target),target);lastTime=now+target;return id;}function clearUpdate(id){self.clearTimeout(id);}expose({setStatePort(port){statePort=port;if(statePort instanceof MessagePort){console.log(`SCHEDULER: Received "statePort" ${statePort}.`);renderer=wrap(statePort);}},exposeNetwork(join,leave){scheduler.exposeNetwork(join,leave);},setSource(src,id,size,hash,integrity,md5){console.log(`SCHEDULER: ${JSON.stringify({src,id,size,hash,integrity,md5})}`);scheduler.src_md5=md5;scheduler.src_integrity=integrity;scheduler.src_hash=hash;scheduler.src_size=size;scheduler.src_id=id;scheduler.src=src;},// Plural meaning sources of set source.
getScopedSources(){return scheduler.sources;},play(){return _asyncToGenerator(function*(){yield scheduler.play();prepareNextUpdate();})();},pause(){if(typeof update_id==="number"){clearUpdate(update_id);update_id=undefined;}}});// Run one step of the scheduler state engine.  Note we use the real-time clock
// instead of the performance counter as we need to refer to calendar
// entries for starting and stopping schedules.
function update(_timestamp){//	console.log("update", timestamp);
_asyncToGenerator(function*(){try{const now=DateTime$1.local();scheduler.update(now);// Serialize the state to forward to the renderer.
if(typeof renderer!=='undefined'){const state=scheduler.state(now);yield renderer.setState(state);}prepareNextUpdate();}catch(ex){console.warn("SCHEDULER:",ex);}})();}function prepareNextUpdate(){//	console.log("prepareNextUpdate");
update_id=requestUpdate(timestamp=>update());}
//# sourceMappingURL=scheduler.bundle~chrome53.js.map
