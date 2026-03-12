import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { cn } from '@/lib/utils'

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
      await supabase.from('weddings').insert({
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
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Form side - login-02 style */}
      <div className="flex flex-col justify-center p-6 lg:p-8">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-bold">Set up your wedding</h1>
              <p className="text-sm text-balance text-muted-foreground">
                Step {step + 1} of {STEPS.length} · {currentStep.title}
              </p>
            </div>

            <FieldGroup>
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {currentStep.fields.includes('weddingName') && (
                <Field>
                  <FieldLabel htmlFor="weddingName">Wedding name</FieldLabel>
                  <Input
                    id="weddingName"
                    placeholder="Our Wedding"
                    value={form.weddingName}
                    onChange={(e) => updateForm('weddingName', e.target.value)}
                  />
                </Field>
              )}
              {currentStep.fields.includes('partnerName') && (
                <Field>
                  <FieldLabel htmlFor="partnerName">Partner&apos;s name</FieldLabel>
                  <Input
                    id="partnerName"
                    placeholder="Alex"
                    value={form.partnerName}
                    onChange={(e) => updateForm('partnerName', e.target.value)}
                  />
                </Field>
              )}
              {currentStep.fields.includes('weddingDate') && (
                <Field>
                  <FieldLabel htmlFor="weddingDate">Wedding date</FieldLabel>
                  <Input
                    id="weddingDate"
                    type="date"
                    value={form.weddingDate}
                    onChange={(e) => updateForm('weddingDate', e.target.value)}
                  />
                </Field>
              )}
              {currentStep.fields.includes('locationCity') && (
                <Field>
                  <FieldLabel htmlFor="locationCity">City / location</FieldLabel>
                  <Input
                    id="locationCity"
                    placeholder="San Francisco"
                    value={form.locationCity}
                    onChange={(e) => updateForm('locationCity', e.target.value)}
                  />
                </Field>
              )}
              {currentStep.fields.includes('estimatedGuestCount') && (
                <Field>
                  <FieldLabel htmlFor="estimatedGuestCount">Estimated guest count</FieldLabel>
                  <Input
                    id="estimatedGuestCount"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={form.estimatedGuestCount}
                    onChange={(e) => updateForm('estimatedGuestCount', e.target.value)}
                  />
                </Field>
              )}

              <div className="flex justify-between gap-4 pt-2">
                <Button variant="outline" onClick={handleBack} disabled={step === 0}>
                  Back
                </Button>
                <Button onClick={handleNext} disabled={loading}>
                  {loading ? 'Creating...' : isLastStep ? 'Create wedding' : 'Next'}
                </Button>
              </div>
            </FieldGroup>
          </div>
        </div>
      </div>

      {/* Image side - login-02 split layout */}
      <div
        className={cn(
          'hidden lg:block bg-muted',
          'bg-[linear-gradient(to_bottom_right,var(--muted),color-mix(in_oklch,var(--muted-foreground)_10%,transparent))]'
        )}
      >
        <div className="flex h-full items-center justify-center p-8">
          <div className="aspect-[4/3] w-full max-w-md rounded-lg bg-muted-foreground/10 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Your wedding journey starts here</span>
          </div>
        </div>
      </div>
    </div>
  )
}
