import { useEffect, useState } from 'react'
import { UserPlus, Trash2, ShieldCheck } from 'lucide-react'
import { fetchTeamMembers, inviteTeamMember, updateMemberRole, updateMemberPermissions, removeMember } from '@/services/teamService'
import type { TeamMember } from '@/services/teamService'
import type { AdminRole } from '@/context/AdminContext'
import type { Permission } from '@/lib/permissions'
import { PERMISSION_GROUPS, PERMISSION_META, ROLE_DEFAULT_PERMISSIONS } from '@/lib/permissions'
import { useAdmin } from '@/context/AdminContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/Table'

const ENABLE_MODE_TOGGLE = false

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin:   'Super Admin',
  admin:         'Admin',
  event_manager: 'Event Manager',
  events_viewer: 'Events Viewer',
  scanner:       'Scanner',
}

export default function TeamPage() {
  const { role: myRole } = useAdmin()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<AdminRole>('event_manager')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteMode, setInviteMode] = useState<'invite' | 'create'>('create')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  // Permissions editor
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editPerms, setEditPerms] = useState<Permission[]>([])
  const [savingPerms, setSavingPerms] = useState(false)
  const [permsError, setPermsError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user.id ?? null)
    })
    loadMembers()
  }, [])

  async function loadMembers() {
    try {
      setMembers(await fetchTeamMembers())
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(false)
    try {
      await inviteTeamMember(inviteEmail, inviteRole, inviteMode === 'create' ? invitePassword : undefined)
      setInviteSuccess(true)
      setInviteEmail('')
      setInvitePassword('')
      await loadMembers()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setInviting(false)
    }
  }

  async function handleRoleChange(userId: string, newRole: AdminRole) {
    await updateMemberRole(userId, newRole)
    setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m))
  }

  async function handleRemove(userId: string) {
    if (!confirm('Remove this team member?')) return
    await removeMember(userId)
    setMembers(prev => prev.filter(m => m.user_id !== userId))
    if (editingUserId === userId) setEditingUserId(null)
  }

  function openPermEditor(member: TeamMember) {
    setEditingUserId(member.user_id)
    setEditPerms(member.permissions ?? [])
    setPermsError(null)
  }

  function togglePerm(perm: Permission) {
    setEditPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    )
  }

  function toggleGroup(groupPerms: Permission[]) {
    const allOn = groupPerms.every(p => editPerms.includes(p))
    if (allOn) {
      setEditPerms(prev => prev.filter(p => !groupPerms.includes(p)))
    } else {
      setEditPerms(prev => [...new Set([...prev, ...groupPerms])])
    }
  }

  async function savePermissions() {
    if (!editingUserId) return
    setSavingPerms(true)
    setPermsError(null)
    try {
      await updateMemberPermissions(editingUserId, editPerms)
      setMembers(prev => prev.map(m =>
        m.user_id === editingUserId ? { ...m, permissions: editPerms } : m
      ))
      setEditingUserId(null)
    } catch (err) {
      setPermsError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingPerms(false)
    }
  }

  const editingMember = members.find(m => m.user_id === editingUserId)

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-6">

      {/* Invite form — super_admin only */}
      {myRole === 'super_admin' && <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode toggle — hidden until both modes are ready */}
          {ENABLE_MODE_TOGGLE && (
            <div className="flex gap-1 rounded-lg border border-input p-1 w-fit text-sm">
              <button
                type="button"
                onClick={() => { setInviteMode('invite'); setInviteError(null); setInviteSuccess(false) }}
                className={`px-3 py-1 rounded-md transition-colors ${inviteMode === 'invite' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Send Invite
              </button>
              <button
                type="button"
                onClick={() => { setInviteMode('create'); setInviteError(null); setInviteSuccess(false) }}
                className={`px-3 py-1 rounded-md transition-colors ${inviteMode === 'create' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Set Password
              </button>
            </div>
          )}

          <form onSubmit={handleInvite} className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-48 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                required
              />
            </div>
            {inviteMode === 'create' && (
              <div className="flex-1 min-w-48 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={invitePassword}
                  onChange={e => setInvitePassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as AdminRole)}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="event_manager">Event Manager</option>
                <option value="events_viewer">Events Viewer</option>
                <option value="scanner">Scanner</option>
              </select>
            </div>
            <Button type="submit" disabled={inviting}>
              {inviting ? 'Saving…' : inviteMode === 'create' ? 'Create Account' : 'Send Invite'}
            </Button>
          </form>
          {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
          {inviteSuccess && (
            <p className="text-sm text-[#0F6E56]">
              {inviteMode === 'create' ? 'Account created successfully.' : 'Invite sent successfully.'}
            </p>
          )}
        </CardContent>
      </Card>}

      {/* Members table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(member => (
                  <TableRow key={member.id} className={editingUserId === member.user_id ? 'bg-accent/40' : ''}>
                    <TableCell className="font-medium">{member.name ?? '—'}</TableCell>
                    <TableCell>
                      {member.user_id === currentUserId ? (
                        <Badge variant={member.role === 'super_admin' ? 'default' : 'outline'}>
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      ) : (
                        <select
                          value={member.role}
                          onChange={e => handleRoleChange(member.user_id, e.target.value as AdminRole)}
                          className="text-xs rounded border border-input bg-background px-2 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          disabled={myRole !== 'super_admin'}
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="admin">Admin</option>
                          <option value="event_manager">Event Manager</option>
                          <option value="events_viewer">Events Viewer</option>
                          <option value="scanner">Scanner</option>
                        </select>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {member.user_id !== currentUserId && member.role !== 'super_admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editingUserId === member.user_id ? setEditingUserId(null) : openPermEditor(member)}
                            className="text-muted-foreground hover:text-foreground gap-1.5"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-xs hidden sm:inline">Permissions</span>
                          </Button>
                        )}
                        {member.user_id !== currentUserId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(member.user_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permissions editor */}
      {editingMember && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Permissions — {editingMember.name ?? editingMember.user_id}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {PERMISSION_GROUPS.map(({ label, permissions: groupPerms }) => {
              const allOn = groupPerms.every(p => editPerms.includes(p))
              const someOn = groupPerms.some(p => editPerms.includes(p))
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                    <button
                      type="button"
                      onClick={() => toggleGroup(groupPerms)}
                      className="text-xs text-primary hover:underline"
                    >
                      {allOn ? 'Deselect all' : someOn ? 'Select all' : 'Select all'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {groupPerms.map(perm => {
                      const { label: permLabel, description } = PERMISSION_META[perm]
                      const checked = editPerms.includes(perm)
                      return (
                        <label
                          key={perm}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            checked ? 'border-primary/40 bg-primary/5' : 'border-input hover:bg-secondary/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePerm(perm)}
                            className="mt-0.5 accent-primary"
                          />
                          <div>
                            <p className="text-sm font-medium leading-none">{permLabel}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {permsError && <p className="text-sm text-destructive">{permsError}</p>}

            <div className="flex gap-2 pt-1">
              <Button onClick={savePermissions} disabled={savingPerms}>
                {savingPerms ? 'Saving…' : 'Save permissions'}
              </Button>
              <Button variant="outline" onClick={() => setEditingUserId(null)}>
                Cancel
              </Button>
              <Button
                variant="ghost"
                className="ml-auto text-xs text-muted-foreground"
                onClick={() => setEditPerms(ROLE_DEFAULT_PERMISSIONS[editingMember.role] ?? [])}
              >
                Reset to role defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
