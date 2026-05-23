import { useEffect, useState } from 'react'
import { UserPlus, Trash2 } from 'lucide-react'
import { fetchTeamMembers, inviteTeamMember, updateMemberRole, removeMember } from '@/services/teamService'
import type { TeamMember } from '@/services/teamService'
import type { AdminRole } from '@/context/AdminContext'
import { useAdmin } from '@/context/AdminContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/Table'

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  events_viewer: 'Events Viewer',
}

export default function TeamPage() {
  const { role: myRole } = useAdmin()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<AdminRole>('events_viewer')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

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
      await inviteTeamMember(inviteEmail, inviteRole)
      setInviteSuccess(true)
      setInviteEmail('')
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
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as AdminRole)}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="events_viewer">Events Viewer</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <Button type="submit" disabled={inviting}>
              {inviting ? 'Sending…' : 'Send Invite'}
            </Button>
          </form>
          {inviteError && <p className="mt-2 text-sm text-destructive">{inviteError}</p>}
          {inviteSuccess && <p className="mt-2 text-sm text-[#0F6E56]">Invite sent successfully.</p>}
        </CardContent>
      </Card>

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
                  <TableRow key={member.id}>
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
                          <option value="events_viewer">Events Viewer</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
