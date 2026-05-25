const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function idColumn(value: string): 'id' | 'slug' {
  return UUID_RE.test(value) ? 'id' : 'slug'
}
