import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type Guest = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  household_name: string | null
  invite_status: string
  rsvp_status: string
}

export function GuestsPage() {
  const { user } = useAuth()
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    householdName: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const { data: weddings } = await supabase
        .from('weddings')
        .select('id')
        .or(`owner_user_id.eq.${user.id},co_planner_user_id.eq.${user.id}`)
        .limit(1)

      const w = weddings?.[0]
      if (!w) {
        setLoading(false)
        return
      }

      setWeddingId(w.id)

      const { data } = await supabase
        .from('guests')
        .select('*')
        .eq('wedding_id', w.id)
        .order('created_at', { ascending: false })

      setGuests(data ?? [])
      setLoading(false)
    }

    load()
  }, [user])

  const addGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weddingId) return
    setSaving(true)
    const { data } = await supabase
      .from('guests')
      .insert({
        wedding_id: weddingId,
        first_name: form.firstName || null,
        last_name: form.lastName || null,
        email: form.email || null,
        household_name: form.householdName || null,
      })
      .select()
      .single()
    if (data) {
      setGuests((prev) => [data, ...prev])
      setForm({ firstName: '', lastName: '', email: '', householdName: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  const deleteGuest = async (id: string) => {
    await supabase.from('guests').delete().eq('id', id)
    setGuests((prev) => prev.filter((g) => g.id !== id))
  }

  const displayName = (g: Guest) => {
    const parts = [g.first_name, g.last_name].filter(Boolean)
    return parts.length ? parts.join(' ') : g.household_name || g.email || 'Unknown'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!weddingId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No wedding found. Complete onboarding first.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Guests</h2>
          <p className="text-muted-foreground">{guests.length} guests</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add guest'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New guest</CardTitle>
            <CardDescription>Add a guest to your list</CardDescription>
          </CardHeader>
          <form onSubmit={addGuest}>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="householdName">Household / group</Label>
                <Input
                  id="householdName"
                  placeholder="e.g. Smith family"
                  value={form.householdName}
                  onChange={(e) => setForm((p) => ({ ...p, householdName: e.target.value }))}
                />
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Button type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add guest'}
              </Button>
            </CardContent>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Guest list</CardTitle>
          <CardDescription>
            {guests.length === 0
              ? 'No guests yet. Add your first guest above.'
              : 'Manage your guest list'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {guests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No guests yet</p>
          ) : (
            <ul className="divide-y">
              {guests.map((guest) => (
                <li
                  key={guest.id}
                  className="flex items-center justify-between py-3 first:pt-0"
                >
                  <div>
                    <p className="font-medium">{displayName(guest)}</p>
                    {guest.email && (
                      <p className="text-sm text-muted-foreground">{guest.email}</p>
                    )}
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-muted">
                        {guest.invite_status.replace('_', ' ')}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted">
                        {guest.rsvp_status}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteGuest(guest.id)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
