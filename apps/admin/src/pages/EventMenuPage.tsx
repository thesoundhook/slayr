import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Pencil, Check, X, Loader2, UtensilsCrossed, ToggleLeft, ToggleRight } from 'lucide-react'
import { getEventById } from '@/services/eventService'
import {
  getCategoriesByEvent, createCategory, updateCategory, deleteCategory,
  createMenuItem, updateMenuItem, deleteMenuItem,
  type MenuItemFormData,
} from '@/services/menuService'
import type { DbEvent, DbMenuCategory, DbMenuItem } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NumericInput } from '@/components/ui/NumericInput'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import PageHero from '@/components/ui/PageHero'
import { cn } from '@/lib/utils'

export default function EventMenuPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [event, setEvent]           = useState<DbEvent | null>(null)
  const [categories, setCategories] = useState<DbMenuCategory[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  // New category form
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat]   = useState(false)

  // Collapsed state per category
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Inline category rename
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName]   = useState('')
  const catNameRef = useRef<HTMLInputElement>(null)

  // New item form state (one per category)
  const [itemForms, setItemForms] = useState<Record<string, Partial<MenuItemFormData> & { open: boolean }>>({})

  // Editing item
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editItemData, setEditItemData]   = useState<Partial<MenuItemFormData>>({})

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    getEventById(id)
      .then(async ev => {
        setEvent(ev)
        const cats = await getCategoriesByEvent(ev.id)
        setCategories(cats)
      })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  // ── Category actions ──────────────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!event || !newCatName.trim()) return
    setAddingCat(true)
    setError(null)
    try {
      const cat = await createCategory(event.id, newCatName.trim(), categories.length)
      setCategories(prev => [...prev, cat])
      setNewCatName('')
    } catch (err) { setError((err as Error).message) }
    finally { setAddingCat(false) }
  }

  const startEditCat = (cat: DbMenuCategory) => {
    setEditingCatId(cat.id)
    setEditCatName(cat.name)
    setTimeout(() => catNameRef.current?.focus(), 0)
  }

  const commitEditCat = async (cat: DbMenuCategory) => {
    setEditingCatId(null)
    const name = editCatName.trim()
    if (!name || name === cat.name) return
    try {
      await updateCategory(cat.id, { name })
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name } : c))
    } catch (err) { setError((err as Error).message) }
  }

  const handleDeleteCategory = async (cat: DbMenuCategory) => {
    const count = cat.menu_items?.length ?? 0
    if (!confirm(`Delete "${cat.name}"${count > 0 ? ` and its ${count} item${count !== 1 ? 's' : ''}` : ''}? This cannot be undone.`)) return
    try {
      await deleteCategory(cat.id)
      setCategories(prev => prev.filter(c => c.id !== cat.id))
    } catch (err) { setError((err as Error).message) }
  }

  const toggleCollapse = (catId: string) =>
    setCollapsed(prev => { const n = new Set(prev); n.has(catId) ? n.delete(catId) : n.add(catId); return n })

  // ── Item form helpers ─────────────────────────────────────────────────────
  const openItemForm = (catId: string) =>
    setItemForms(prev => ({ ...prev, [catId]: { open: true, name: '', description: null, price: 0, image_url: null, is_available: true } }))

  const closeItemForm = (catId: string) =>
    setItemForms(prev => { const n = { ...prev }; delete n[catId]; return n })

  const updateItemForm = (catId: string, patch: Partial<MenuItemFormData>) =>
    setItemForms(prev => ({ ...prev, [catId]: { ...prev[catId], ...patch } }))

  const handleAddItem = async (cat: DbMenuCategory) => {
    if (!event) return
    const form = itemForms[cat.id]
    if (!form?.name?.trim()) return
    try {
      const item = await createMenuItem(event.id, cat.id, {
        name: form.name!.trim(),
        description: form.description || null,
        price: form.price ?? 0,
        image_url: form.image_url || null,
        is_available: form.is_available ?? true,
      }, cat.menu_items?.length ?? 0)
      setCategories(prev => prev.map(c =>
        c.id === cat.id ? { ...c, menu_items: [...(c.menu_items ?? []), item] } : c
      ))
      closeItemForm(cat.id)
    } catch (err) { setError((err as Error).message) }
  }

  const handleToggleAvailable = async (catId: string, item: DbMenuItem) => {
    try {
      await updateMenuItem(item.id, { is_available: !item.is_available })
      setCategories(prev => prev.map(c =>
        c.id === catId
          ? { ...c, menu_items: (c.menu_items ?? []).map(it => it.id === item.id ? { ...it, is_available: !it.is_available } : it) }
          : c
      ))
    } catch (err) { setError((err as Error).message) }
  }

  const startEditItem = (item: DbMenuItem) => {
    setEditingItemId(item.id)
    setEditItemData({ name: item.name, description: item.description, price: item.price, image_url: item.image_url, is_available: item.is_available })
  }

  const commitEditItem = async (catId: string, item: DbMenuItem) => {
    setEditingItemId(null)
    try {
      await updateMenuItem(item.id, editItemData)
      setCategories(prev => prev.map(c =>
        c.id === catId
          ? { ...c, menu_items: (c.menu_items ?? []).map(it => it.id === item.id ? { ...it, ...editItemData } : it) }
          : c
      ))
    } catch (err) { setError((err as Error).message) }
  }

  const handleDeleteItem = async (catId: string, item: DbMenuItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return
    try {
      await deleteMenuItem(item.id)
      setCategories(prev => prev.map(c =>
        c.id === catId ? { ...c, menu_items: (c.menu_items ?? []).filter(it => it.id !== item.id) } : c
      ))
    } catch (err) { setError((err as Error).message) }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  if (!event)  return <div className="p-6 text-muted-foreground">Event not found.</div>

  return (
    <>
      <PageHero
        badge="Menu"
        title={`Menu — ${event.title}`}
        subtitle="Build categories and items that guests will see when they scan their table QR code."
        ghost="04"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/events/${event.slug}/edit`)}>
            <ArrowLeft className="h-4 w-4" />
            Back to Event
          </Button>
        }
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex justify-between">
            {error}
            <button onClick={() => setError(null)} className="underline text-xs">dismiss</button>
          </div>
        )}

        {/* ── Add Category ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-base">Add Category</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="e.g. Cocktails, Bottles, Bites…"
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                className="flex-1"
              />
              <Button onClick={handleAddCategory} disabled={addingCat || !newCatName.trim()} size="sm">
                {addingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {categories.length === 0 && (
          <div className="rounded-lg border border-dashed bg-card flex flex-col items-center justify-center py-16 gap-3 text-center">
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No categories yet. Add one above to get started.</p>
          </div>
        )}

        {/* ── Categories ──────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {categories.map(cat => {
            const isCollapsed = collapsed.has(cat.id)
            const isEditingCat = editingCatId === cat.id
            const form = itemForms[cat.id]
            const items = cat.menu_items ?? []

            return (
              <div key={cat.id} className="rounded-xl border bg-card overflow-hidden">

                {/* Category header */}
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none" onClick={() => !isEditingCat && toggleCollapse(cat.id)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isEditingCat ? (
                      <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                        <input
                          ref={catNameRef}
                          value={editCatName}
                          onChange={e => setEditCatName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') commitEditCat(cat); if (e.key === 'Escape') setEditingCatId(null) }}
                          className="flex-1 text-sm font-semibold rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button onClick={() => commitEditCat(cat)} className="text-primary hover:text-primary/80"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingCatId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-sm">{cat.name}</span>
                        <span className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                  {!isEditingCat && (
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => startEditCat(cat)} className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteCategory(cat)} className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => toggleCollapse(cat.id)} className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground">
                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="border-t">
                    {/* Items list */}
                    {items.length > 0 && (
                      <div className="divide-y">
                        {items.map(item => {
                          const isEditingItem = editingItemId === item.id
                          return (
                            <div key={item.id} className={cn('px-4 py-3', !item.is_available && 'opacity-50')}>
                              {isEditingItem ? (
                                /* ── Edit item form ── */
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-muted-foreground">Name</label>
                                      <Input
                                        value={editItemData.name ?? ''}
                                        onChange={e => setEditItemData(p => ({ ...p, name: e.target.value }))}
                                        autoFocus
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-muted-foreground">Price (₦)</label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                                        <NumericInput
                                          min={0}
                                          value={Math.round((editItemData.price ?? 0) / 100)}
                                          onChange={v => setEditItemData(p => ({ ...p, price: v * 100 }))}
                                          className="pl-7"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                                    <Input
                                      value={editItemData.description ?? ''}
                                      onChange={e => setEditItemData(p => ({ ...p, description: e.target.value || null }))}
                                      placeholder="Optional description"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Image URL</label>
                                    <Input
                                      value={editItemData.image_url ?? ''}
                                      onChange={e => setEditItemData(p => ({ ...p, image_url: e.target.value || null }))}
                                      placeholder="https://…"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => commitEditItem(cat.id, item)}><Check className="h-3.5 w-3.5" /> Save</Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingItemId(null)}>Cancel</Button>
                                  </div>
                                </div>
                              ) : (
                                /* ── Item row ── */
                                <div className="flex items-center gap-3">
                                  {item.image_url && (
                                    <img src={item.image_url} alt={item.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                    {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                                    <p className="text-sm font-semibold text-primary mt-0.5">
                                      {item.price > 0 ? `₦${(item.price / 100).toLocaleString()}` : 'Free'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => handleToggleAvailable(cat.id, item)}
                                      title={item.is_available ? 'Mark unavailable' : 'Mark available'}
                                      className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    >
                                      {item.is_available
                                        ? <ToggleRight className="h-4 w-4 text-green-600" />
                                        : <ToggleLeft className="h-4 w-4" />}
                                    </button>
                                    <button onClick={() => startEditItem(item)} className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteItem(cat.id, item)} className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Add item form / button */}
                    <div className="px-4 py-3 bg-muted/20">
                      {form?.open ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Name *</label>
                              <Input
                                value={form.name ?? ''}
                                onChange={e => updateItemForm(cat.id, { name: e.target.value })}
                                placeholder="e.g. Whisky Sour"
                                autoFocus
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Price (₦)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                                <NumericInput
                                  min={0}
                                  value={Math.round((form.price ?? 0) / 100)}
                                  onChange={v => updateItemForm(cat.id, { price: v * 100 })}
                                  className="pl-7"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Description</label>
                            <Input
                              value={form.description ?? ''}
                              onChange={e => updateItemForm(cat.id, { description: e.target.value || null })}
                              placeholder="Optional — shown to guests"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Image URL</label>
                            <Input
                              value={form.image_url ?? ''}
                              onChange={e => updateItemForm(cat.id, { image_url: e.target.value || null })}
                              placeholder="https://…  (optional)"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAddItem(cat)} disabled={!form.name?.trim()}>
                              <Plus className="h-3.5 w-3.5" /> Add Item
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => closeItemForm(cat.id)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => openItemForm(cat.id)}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add item to {cat.name}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
