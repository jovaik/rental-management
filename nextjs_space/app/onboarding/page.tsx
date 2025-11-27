'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BusinessType } from '@prisma/client';

// Validation schema for each step
const step1Schema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminName: z.string().min(2, 'Name must be at least 2 characters'),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must be less than 63 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Only lowercase letters, numbers, and hyphens allowed'
    ),
});

const step2Schema = z.object({
  location: z.string().min(2, 'Location is required'),
  businessType: z.nativeEnum(BusinessType),
});

const step3Schema = z.object({
  logo: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  publishToMarbella4Rent: z.boolean().optional(),
});

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type OnboardingFormData = z.infer<typeof fullSchema>;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    setValue,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(fullSchema),
    mode: 'onChange',
  });

  const subdomain = watch('subdomain');
  const location = watch('location');

  // Check subdomain availability
  useEffect(() => {
    const checkSubdomain = async () => {
      if (!subdomain || subdomain.length < 3) {
        setSubdomainAvailable(null);
        return;
      }

      setSubdomainChecking(true);
      try {
        const response = await fetch(
          `/api/tenants/check-subdomain?subdomain=${subdomain}`
        );
        const data = await response.json();
        setSubdomainAvailable(data.available);
      } catch (error) {
        console.error('Error checking subdomain:', error);
      } finally {
        setSubdomainChecking(false);
      }
    };

    const timer = setTimeout(checkSubdomain, 500);
    return () => clearTimeout(timer);
  }, [subdomain]);

  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/tenants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create tenant');
      }

      // Redirect to login with success message
      router.push(
        `/login?message=Account created successfully! Please login with your credentials.&subdomain=${result.data.subdomain}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await trigger([
        'companyName',
        'adminEmail',
        'adminPassword',
        'adminName',
        'subdomain',
      ]);
      if (isValid && !subdomainAvailable) {
        setError('Please choose an available subdomain');
        return;
      }
    } else if (currentStep === 2) {
      isValid = await trigger(['location', 'businessType']);
    }

    if (isValid) {
      setError('');
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const businessTypeOptions = [
    { value: BusinessType.VEHICLE_RENTAL, label: 'Vehicle Rental', icon: '🚗' },
    { value: BusinessType.SCOOTER_RENTAL, label: 'Scooter Rental', icon: '🛵' },
    { value: BusinessType.PROPERTY_RENTAL, label: 'Property Rental', icon: '🏠' },
    { value: BusinessType.BOAT_RENTAL, label: 'Boat Rental', icon: '⛵' },
    { value: BusinessType.EXPERIENCE_RENTAL, label: 'Experience Rental', icon: '🎭' },
    { value: BusinessType.EQUIPMENT_RENTAL, label: 'Equipment Rental', icon: '🛠️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Rental Management
          </h1>
          <p className="text-gray-600">
            Let's set up your business in just a few steps
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center ${
                  step < 3 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step === currentStep
                      ? 'bg-blue-600 text-white'
                      : step < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 px-2">
            <span>Basic Info</span>
            <span>Business</span>
            <span>Customize</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Basic Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  {...register('companyName')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Acme Rentals"
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  {...register('adminName')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
                {errors.adminName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.adminName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  {...register('adminEmail')}
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@acme.com"
                />
                {errors.adminEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.adminEmail.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  {...register('adminPassword')}
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min. 8 characters"
                />
                {errors.adminPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.adminPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subdomain
                </label>
                <div className="flex items-center">
                  <input
                    {...register('subdomain')}
                    type="text"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your-company"
                  />
                  <span className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                    .rental.com
                  </span>
                </div>
                {subdomainChecking && (
                  <p className="mt-1 text-sm text-gray-500">Checking...</p>
                )}
                {subdomain && subdomain.length >= 3 && !subdomainChecking && (
                  <p
                    className={`mt-1 text-sm ${
                      subdomainAvailable ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {subdomainAvailable
                      ? '✓ Subdomain is available'
                      : '✗ Subdomain is taken'}
                  </p>
                )}
                {errors.subdomain && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.subdomain.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Business Configuration */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Business Configuration
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Location
                </label>
                <input
                  {...register('location')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Madrid, Barcelona, Marbella"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.location.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Business Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {businessTypeOptions.map((option) => (
                    <label
                      key={option.value}
                      className="relative flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
                    >
                      <input
                        {...register('businessType')}
                        type="radio"
                        value={option.value}
                        className="sr-only"
                      />
                      <span className="text-2xl mr-3">{option.icon}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {option.label}
                      </span>
                      <div className="absolute inset-0 border-2 border-blue-600 rounded-lg opacity-0 peer-checked:opacity-100" />
                    </label>
                  ))}
                </div>
                {errors.businessType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.businessType.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Customization */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Customize Your Brand
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL (Optional)
                </label>
                <input
                  {...register('logo')}
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://i.pinimg.com/736x/19/63/c8/1963c80b8983da5f3be640ca7473b098.jpg"
                />
                <p className="mt-1 text-xs text-gray-500">
                  You can upload your logo later in settings
                </p>
                {errors.logo && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.logo.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <input
                    {...register('primaryColor')}
                    type="color"
                    className="w-full h-12 px-2 border border-gray-300 rounded-lg cursor-pointer"
                    defaultValue="#3b82f6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Color
                  </label>
                  <input
                    {...register('secondaryColor')}
                    type="color"
                    className="w-full h-12 px-2 border border-gray-300 rounded-lg cursor-pointer"
                    defaultValue="#8b5cf6"
                  />
                </div>
              </div>

              {location && location.toLowerCase().includes('marbella') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-start">
                    <input
                      {...register('publishToMarbella4Rent')}
                      type="checkbox"
                      className="mt-1 mr-3"
                    />
                    <div>
                      <span className="block font-medium text-gray-800">
                        Publish to Marbella4Rent
                      </span>
                      <span className="text-sm text-gray-600">
                        Make your rentals visible on the Marbella4Rent marketplace
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You can customize all these settings
                  later in your dashboard.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
