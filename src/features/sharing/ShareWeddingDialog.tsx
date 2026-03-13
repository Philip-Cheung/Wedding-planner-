import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { useWedding } from '@/features/wedding/WeddingContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Link2Icon, CheckIcon } from 'lucide-react'

type Collaborator = {
  id: string
  user_id: string
  role: string
  email: string | null
  full_name: string | null
  is_you: boolean
}

type PendingInvite = {
  id: string
  email: string
  role: string
  status: string
  expires_at: string
}

type ShareLink = {
  token: string
  expires_at: string
  revoked_at: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareWeddingDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth()
  const { wedding } = useWedding()
  const [emailInput, setEmailInput] = useState('')
  const [roleInput, setRoleInput] = useState<'partner' | 'collaborator'>('collaborator')
  const [inviting, setInviting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [shareLink, setShareLink] = useState<ShareLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [canInvite, setCanInvite] = useState(false)

  useEffect(() => {
    if (!open || !wedding) return

    const load = async () => {
      setLoading(true)

      const [ownerRes, collabRes, invitesRes, linkRes] = await Promise.all([
        supabase
          .from('weddings')
          .select('owner_user_id')
          .eq('id', wedding.id)
          .single(),
        supabase
          .from('wedding_collaborators')
          .select('id, user_id, role')
          .eq('wedding_id', wedding.id),
        supabase
          .from('wedding_invites')
          .select('id, email, role, status, expires_at')
          .eq('wedding_id', wedding.id)
          .eq('status', 'pending'),
        supabase
          .from('wedding_share_links')
          .select('token, expires_at, revoked_at')
          .eq('wedding_id', wedding.id)
          .single(),
      ])

      const ownerId = ownerRes.data?.owner_user_id
      const isOwner = ownerId === user?.id

      const collabs = collabRes.data ?? []
      const userIds = [ownerId, ...collabs.map((c) => c.user_id)].filter(Boolean) as string[]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds)

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

      const ownerProfile = ownerId ? profileMap.get(ownerId) : null
      const ownerEntry: Collaborator = {
        id: 'owner',
        user_id: ownerId!,
        role: 'owner',
        email: ownerProfile?.email ?? null,
        full_name: ownerProfile?.full_name ?? null,
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
          is_you: c.user_id === user?.id,
        }
      })

      setCollaborators([ownerEntry, ...collabEntries])
      setPendingInvites(invitesRes.data ?? [])
      setShareLink(linkRes.data)

      const { data: myCollab } = await supabase
        .from('wedding_collaborators')
        .select('role')
        .eq('wedding_id', wedding.id)
        .eq('user_id', user?.id)
        .single()

      setCanInvite(isOwner || myCollab?.role === 'partner')
      setLoading(false)
    }

    load()
  }, [open, wedding?.id, user?.id])

  const getShareUrl = () => {
    if (!shareLink?.token || shareLink.revoked_at) return null
    const exp = new Date(shareLink.expires_at).getTime()
    if (exp < Date.now()) return null
    return `${window.location.origin}/invite/link/${shareLink.token}`
  }

  const handleCopyLink = async () => {
    let url = getShareUrl()
    if (!url && wedding && canInvite) {
      const { data } = await supabase
        .from('wedding_share_links')
        .upsert(
          {
            wedding_id: wedding.id,
            token: crypto.randomUUID(),
            created_by: user?.id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            revoked_at: null,
          },
          { onConflict: 'wedding_id' }
        )
        .select('token, expires_at, revoked_at')
        .single()
      if (data) {
        setShareLink(data)
        url = `${window.location.origin}/invite/link/${data.token}`
      }
    }
    if (url) {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleInvite = async () => {
    if (!wedding || !canInvite) return
    const emails = emailInput
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes('@'))
    if (emails.length === 0) return

    setInviting(true)
    for (const email of emails) {
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      await supabase.from('wedding_invites').insert({
        wedding_id: wedding.id,
        email,
        role: roleInput,
        token,
        invited_by: user?.id,
        status: 'pending',
        expires_at: expiresAt,
      })

      const redirectUrl = `${window.location.origin}/invite/accept?token=${token}`
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl },
      })
    }
    setEmailInput('')
    setPendingInvites((prev) => [
      ...prev,
      ...emails.map((email) => ({
        id: crypto.randomUUID(),
        email,
        role: roleInput,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })),
    ])
    setInviting(false)
  }

  const shareUrl = getShareUrl()
  const hasValidLink = !!shareUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle>Share this wedding</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              disabled={!canInvite && !hasValidLink}
              className="gap-2"
            >
              {copied ? (
                <CheckIcon className="size-4" />
              ) : (
                <Link2Icon className="size-4" />
              )}
              {copied ? 'Copied!' : 'Copy link'}
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            {canInvite && (
              <div className="grid gap-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Emails, comma separated"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    className="flex-1"
                  />
                  <Select value={roleInput} onValueChange={(v) => setRoleInput(v as 'partner' | 'collaborator')}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="collaborator">Collaborator</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInvite} disabled={inviting || !emailInput.trim()}>
                    Invite
                  </Button>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-2">Who has access</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {collaborators.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg border p-2"
                  >
                    <Avatar className="size-8">
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="text-xs">
                        {c.full_name?.slice(0, 2).toUpperCase() ?? c.email?.slice(0, 2).toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
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
                  </div>
                ))}
                {pendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3 rounded-lg border border-dashed p-2 opacity-75"
                  >
                    <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs">
                      ?
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">Pending invite</p>
                    </div>
                    <Badge variant="outline" className="capitalize shrink-0">
                      {inv.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
