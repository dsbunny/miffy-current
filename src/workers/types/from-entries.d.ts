module '@ungap/from-entries' {
	export default function fromEntries<T>(entries: Iterable<readonly [PropertyKey, T]>): Record<PropertyKey, T>;
}
