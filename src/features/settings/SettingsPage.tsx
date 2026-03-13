import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { useWedding } from '@/features/wedding/WeddingContext'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ShareWeddingDialog } from '@/features/sharing/ShareWeddingDialog'
import {
  UsersIcon,
  Share2Icon,
  Trash2Icon,
  Link2Icon,
  Link2OffIcon,
} from 'lucide-react'

type Collaborator = {
  id: string
  user_id: string
  role: string
  email: string | null
  full_name: string | null
  is_owner: boolean
  is_you: boolean
}

type PendingInvite = {
  id: string
  email: string
  role: string
  expires_at: string
}

type ShareLink = {
  token: string
  expires_at: string
  revoked_at: string | null
}

export function SettingsPage() {
  const { user } = useAuth()
  const { wedding } = useWedding()
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [shareLink, setShareLink] = useState<ShareLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    if (!wedding) return

    const load = async () => {
      setLoading(true)

      const [weddingRes, collabRes, invitesRes, linkRes] = await Promise.all([
        supabase.from('weddings').select('owner_user_id').eq('id', wedding.id).single(),
        supabase.from('wedding_collaborators').select('id, user_id, role').eq('wedding_id', wedding.id),
        supabase
          .from('wedding_invites')
          .select('id, email, role, expires_at')
          .eq('wedding_id', wedding.id)
          .eq('status', 'pending'),
        supabase
          .from('wedding_share_links')
          .select('token, expires_at, revoked_at')
          .eq('wedding_id', wedding.id)
          .single(),
      ])

      const ownerId = weddingRes.data?.owner_user_id
      setIsOwner(ownerId === user?.id)

      const collabs = collabRes.data ?? []
      const userIds = [ownerId, ...collabs.map((c) => c.user_id)].filter(Boolean) as string[]
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, email, full_name').in('id', userIds)
        : { data: [] }

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

      const ownerProfile = ownerId ? profileMap.get(ownerId) : null
      const ownerEntry: Collaborator = {
        id: 'owner',
        user_id: ownerId!,
        role: 'owner',
        email: ownerProfile?.email ?? null,
        full_name: ownerProfile?.full_name ?? null,
        is_owner: true,
        is_you: ownerId === user?.id,
      }

      const collabEntries: Collaborator[] = collabs.map((c) => {
        const p = profileMap.get(c.user_id)
        return {
          id: c.id,
          user_id: c.user_id,
          role: c.role,
          email: p?.email ?? null,
          full_name: p?.full_name ?? null,
          is_owner: false,
          is_you: c.user_id === user?.id,
        }
      })

      setCollaborators([ownerEntry, ...collabEntries])
      setPendingInvites(invitesRes.data ?? [])
      setShareLink(linkRes.data)
      setLoading(false)
    }

    load()
  }, [wedding?.id, user?.id])

  const handleRemove = async (collaboratorId: string) => {
    if (!wedding || !isOwner || collaboratorId === 'owner') return
    await supabase.from('wedding_collaborators').delete().eq('id', collaboratorId)
    setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId))
  }

  const handleRevokeLink = async () => {
    if (!wedding || !isOwner) return
    setRevoking(true)
    await supabase
      .from('wedding_share_links')
      .update({ revoked_at: new Date().toISOString() })
      .eq('wedding_id', wedding.id)
    setShareLink((prev) => (prev ? { ...prev, revoked_at: new Date().toISOString() } : null))
    setRevoking(false)
  }

  const shareUrl =
    shareLink?.token && !shareLink.revoked_at && new Date(shareLink.expires_at) > new Date()
      ? `${window.location.origin}/invite/link/${shareLink.token}`
      : null

  if (!wedding) {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your wedding plan settings.</p>
      </div>

      <Tabs defaultValue="collaborators" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="collaborators" className="gap-2">
            <UsersIcon className="size-4" />
            Collaborators
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <p className="text-muted-foreground text-sm">General settings coming soon.</p>
        </TabsContent>

        <TabsContent value="collaborators" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Collaborators</h2>
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="gap-2">
              <Share2Icon className="size-4" />
              Invite
            </Button>
          </div>

          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Who has access</h3>
                <div className="space-y-2">
                  {collaborators.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <Avatar className="size-9">
                        <AvatarImage src={undefined} />
                        <AvatarFallback className="text-xs">
                          {c.full_name?.slice(0, 2).toUpperCase() ??
                            c.email?.slice(0, 2).toUpperCase() ??
                            '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {c.full_name || c.email || 'Unknown'}
                          {c.is_you && (
                            <span className="text-muted-foreground font-normal ml-1">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize shrink-0">
                        {c.role}
                      </Badge>
                      {isOwner && !c.is_owner && !c.is_you && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemove(c.id)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Pending invites</h3>
                  <div className="space-y-2">
                    {pendingInvites.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center gap-3 rounded-lg border border-dashed p-3 opacity-75"
                      >
                        <div className="size-9 rounded-full bg-muted flex items-center justify-center text-sm">
                          ?
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{inv.email}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <Badge variant="outline" className="capitalize shrink-0">
                          {inv.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isOwner && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Share link</h3>
                  <div className="rounded-lg border p-4 space-y-3">
                    {shareUrl ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Link2Icon className="size-4 text-muted-foreground" />
                          <code className="text-sm bg-muted px-2 py-1 rounded truncate flex-1">
                            {shareUrl}
                          </code>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Expires in 7 days. Anyone with this link can join as a collaborator.
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRevokeLink}
                          disabled={revoking}
                          className="gap-2"
                        >
                          <Link2OffIcon className="size-4" />
                          Revoke link
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No active share link. Create one from the Share button in the header.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <ShareWeddingDialog open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  )
}
