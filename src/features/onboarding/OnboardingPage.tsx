import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const STEPS: { id: string; title: string; fields: string[] }[] = [
  { id: 'basics', title: 'Wedding basics', fields: ['weddingName', 'partnerName', 'weddingDate'] },
  { id: 'details', title: 'Details', fields: ['locationCity', 'estimatedGuestCount'] },
]

export function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    weddingName: '',
    partnerName: '',
    weddingDate: '',
    locationCity: '',
    estimatedGuestCount: '',
  })

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('weddings')
        .insert({
          owner_user_id: user.id,
          wedding_name: form.weddingName || null,
          partner_name: form.partnerName || null,
          wedding_date: form.weddingDate || null,
          location_city: form.locationCity || null,
          estimated_guest_count: form.estimatedGuestCount
            ? parseInt(form.estimatedGuestCount, 10)
            : null,
          planning_status: 'draft',
        })

      if (insertError) throw insertError

      navigate('/app/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wedding')
    } finally {
      setLoading(false)
    }
  }

  const currentStep = STEPS[step]
  const isLastStep = step === STEPS.length - 1

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{currentStep.title}</CardTitle>
          <CardDescription>
            Step {step + 1} of {STEPS.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {currentStep.fields.includes('weddingName') && (
            <div className="space-y-2">
              <Label htmlFor="weddingName">Wedding name</Label>
              <Input
                id="weddingName"
                placeholder="Our Wedding"
                value={form.weddingName}
                onChange={(e) => updateForm('weddingName', e.target.value)}
              />
            </div>
          )}
          {currentStep.fields.includes('partnerName') && (
            <div className="space-y-2">
              <Label htmlFor="partnerName">Partner's name</Label>
              <Input
                id="partnerName"
                placeholder="Alex"
                value={form.partnerName}
                onChange={(e) => updateForm('partnerName', e.target.value)}
              />
            </div>
          )}
          {currentStep.fields.includes('weddingDate') && (
            <div className="space-y-2">
              <Label htmlFor="weddingDate">Wedding date</Label>
              <Input
                id="weddingDate"
                type="date"
                value={form.weddingDate}
                onChange={(e) => updateForm('weddingDate', e.target.value)}
              />
            </div>
          )}
          {currentStep.fields.includes('locationCity') && (
            <div className="space-y-2">
              <Label htmlFor="locationCity">City / location</Label>
              <Input
                id="locationCity"
                placeholder="San Francisco"
                value={form.locationCity}
                onChange={(e) => updateForm('locationCity', e.target.value)}
              />
            </div>
          )}
          {currentStep.fields.includes('estimatedGuestCount') && (
            <div className="space-y-2">
              <Label htmlFor="estimatedGuestCount">Estimated guest count</Label>
              <Input
                id="estimatedGuestCount"
                type="number"
                min="1"
                placeholder="100"
                value={form.estimatedGuestCount}
                onChange={(e) => updateForm('estimatedGuestCount', e.target.value)}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 0}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={loading}>
            {loading ? 'Creating...' : isLastStep ? 'Create wedding' : 'Next'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
