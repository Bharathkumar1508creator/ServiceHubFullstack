import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import apiRequest, {
  getBookings,
  getServiceProviders,
  getServices,
} from '../../services/api'
import styles from './ProviderDashboard.module.css'

const MONTHLY_REVENUE_TARGET = 50000

function AnimatedMetric({
  value,
  currency = false,
}) {
  const [animatedValue, setAnimatedValue] =
    useState(0)
  const currentValueRef = useRef(0)

  useEffect(() => {
    const from = currentValueRef.current
    const duration = 900
    let startTime = null
    let frameId

    const animate = (time) => {
      if (startTime === null) {
        startTime = time
      }

      const progress = Math.min(
        (time - startTime) / duration,
        1
      )
      const easedProgress =
        1 - Math.pow(1 - progress, 3)
      const nextValue = Math.round(
        from + (value - from) * easedProgress
      )

      currentValueRef.current = nextValue
      setAnimatedValue(nextValue)

      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      }
    }

    frameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [value])

  return currency
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(animatedValue)
    : animatedValue.toLocaleString('en-IN')
}

function ProviderDashboard() {
  const fileInputRef = useRef(null)
  const dashboardRef = useRef(null)

  const [services, setServices] = useState([])
  const [bookings, setBookings] = useState([])

  const [loading, setLoading] = useState(true)
  const [savingService, setSavingService] =
    useState(false)
  const [providerProfile, setProviderProfile] =
    useState(null)
  const [showProfileModal, setShowProfileModal] =
    useState(false)
  const [savingProfile, setSavingProfile] =
    useState(false)
  const [profileError, setProfileError] =
    useState('')
  const [profileForm, setProfileForm] =
    useState({
      business_name: '',
      description: '',
      phone_number: '',
      address: '',
      experience: '',
    })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeSection, setActiveSection] =
    useState('overview')

  const [showServiceModal, setShowServiceModal] =
    useState(false)

  const [editingService, setEditingService] =
    useState(null)

  const [deletingServiceId, setDeletingServiceId] =
    useState(null)

  const [updatingServiceId, setUpdatingServiceId] =
    useState(null)
  const [updatingBookingId, setUpdatingBookingId] =
    useState(null)
  const [decliningBooking, setDecliningBooking] =
    useState(null)
  const [reviewingCancellation, setReviewingCancellation] =
    useState(null)
  const [cancellationReview, setCancellationReview] =
    useState(null)
  const [cancellationReviewLoading, setCancellationReviewLoading] =
    useState(false)
  const [cancellationReviewError, setCancellationReviewError] =
    useState('')
  const [cancellationProviderResponse, setCancellationProviderResponse] =
    useState('')
  const [cancellationReason, setCancellationReason] =
    useState('')
  const [declineError, setDeclineError] =
    useState('')

  const [serviceForm, setServiceForm] =
    useState({
      name: '',
      description: '',
      price: '',
      is_available: true,
      image: null,
    })

  const [imagePreview, setImagePreview] =
    useState('')

  const [imageError, setImageError] =
    useState('')

  const fetchDashboardData = async () => {
    const [
      servicesData,
      bookingsData,
      providersData,
    ] = await Promise.all([
      getServices(),
      getBookings(),
      getServiceProviders(),
    ])

    const servicesList =
      Array.isArray(servicesData)
        ? servicesData
        : servicesData?.results || []

    const bookingsList =
      Array.isArray(bookingsData)
        ? bookingsData
        : bookingsData?.results || []

    const providersList =
      Array.isArray(providersData)
        ? providersData
        : providersData?.results || []

    return {
      servicesList,
      bookingsList,
      currentProviderProfile:
        providersList[0] || null,
    }
  }

  const applyDashboardData = ({
    servicesList,
    bookingsList,
    currentProviderProfile,
  }) => {
    setServices(servicesList)
    setBookings(bookingsList)
    setProviderProfile(currentProviderProfile)

    if (!currentProviderProfile) {
      setShowProfileModal(true)
    }
  }

  useEffect(() => {
    let isActive = true

    const loadInitialDashboardData = async () => {
      try {
        const dashboardData =
          await fetchDashboardData()

        if (isActive) {
          applyDashboardData(dashboardData)
        }
      } catch (err) {
        if (isActive) {
          console.error(
            'Provider dashboard error:',
            err
          )
          setError(
            err.message ||
              'Unable to load dashboard data.'
          )
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadInitialDashboardData()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    const dashboard = dashboardRef.current

    if (!dashboard) {
      return undefined
    }

    const revealTargets =
      dashboard.querySelectorAll(
        `.${styles.dashboardContent} > *, .${styles.dashboardContent} section .card`
      )

    if (!('IntersectionObserver' in window)) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              styles.revealed
            )
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -35px 0px',
      }
    )

    revealTargets.forEach((target, index) => {
      target.classList.add(styles.revealPending)
      target.style.setProperty(
        '--reveal-delay',
        `${Math.min(index % 5, 4) * 70}ms`
      )
      observer.observe(target)
    })

    const updateParallax = () => {
      dashboard.style.setProperty(
        '--scroll-offset',
        `${Math.min(window.scrollY * 0.08, 100)}px`
      )
    }

    updateParallax()
    window.addEventListener(
      'scroll',
      updateParallax,
      { passive: true }
    )

    return () => {
      observer.disconnect()
      window.removeEventListener(
        'scroll',
        updateParallax
      )
      revealTargets.forEach((target) => {
        target.classList.remove(
          styles.revealPending,
          styles.revealed
        )
        target.style.removeProperty('--reveal-delay')
      })
    }
  }, [loading])

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  const handleBookingResponse = async (
    booking,
    status,
    reason = ''
  ) => {
    clearMessages()
    setUpdatingBookingId(booking.id)

    try {
      if (status === 'cancelled' && !reason.trim()) {
        setDeclineError(
          'Please explain why you are declining this booking.'
        )
        return
      }

      const updatedBooking = await apiRequest(
        `/bookings/${booking.id}/respond/`,
        {
          method: 'POST',
          body: JSON.stringify({
            status,
            ...(status === 'cancelled'
              ? { cancellation_reason: reason.trim() }
              : {}),
          }),
        }
      )

      setBookings((previous) =>
        previous.map((item) =>
          item.id === updatedBooking.id
            ? updatedBooking
            : item
        )
      )
      setSuccess(
        status === 'confirmed'
          ? 'Booking accepted.'
          : 'Booking declined.'
      )
      if (status === 'cancelled') {
        setDecliningBooking(null)
        setCancellationReason('')
        setDeclineError('')
      }
    } catch (requestError) {
      if (status === 'cancelled') {
        setDeclineError(
          requestError.message ||
            'Unable to decline this booking.'
        )
      }
      setError(
        requestError.message ||
          'Unable to update this booking.'
      )
    } finally {
      setUpdatingBookingId(null)
    }
  }

  const openCancellationReview = async (booking) => {
    setReviewingCancellation(booking)
    setCancellationReview(null)
    setCancellationReviewError('')
    setCancellationProviderResponse('')
    setCancellationReviewLoading(true)

    try {
      const request = await apiRequest(
        `/bookings/${booking.id}/cancellation-request/`
      )
      setCancellationReview(request)
    } catch (requestError) {
      setCancellationReviewError(
        requestError.message ||
          'Unable to load this cancellation request.'
      )
    } finally {
      setCancellationReviewLoading(false)
    }
  }

  const decideCancellationRequest = async (decision) => {
    if (!reviewingCancellation) {
      return
    }

    setUpdatingBookingId(reviewingCancellation.id)
    setCancellationReviewError('')

    try {
      const updatedBooking = await apiRequest(
        `/bookings/${reviewingCancellation.id}/cancellation-request/`,
        {
          method: 'POST',
          body: JSON.stringify({
            decision,
            provider_response:
              cancellationProviderResponse.trim(),
          }),
        }
      )
      setBookings((previous) =>
        previous.map((item) =>
          item.id === updatedBooking.id
            ? updatedBooking
            : item
        )
      )
      setSuccess(
        decision === 'approved'
          ? 'Cancellation approved. The booking is now cancelled.'
          : 'Cancellation request declined. The booking remains confirmed.'
      )
      setReviewingCancellation(null)
      setCancellationReview(null)
      setCancellationProviderResponse('')
    } catch (requestError) {
      setCancellationReviewError(
        requestError.message ||
          'Unable to decide this cancellation request.'
      )
    } finally {
      setUpdatingBookingId(null)
    }
  }

  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      price: '',
      is_available: true,
      image: null,
    })

    setImagePreview('')
    setImageError('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openAddServiceModal = () => {
    clearMessages()

    if (!providerProfile) {
      setShowProfileModal(true)
      return
    }

    setEditingService(null)

    resetServiceForm()

    setShowServiceModal(true)
  }

  const handleProfileChange = (event) => {
    const { name, value } = event.target

    setProfileForm((previous) => ({
      ...previous,
      [name]: value,
    }))
    setProfileError('')
  }

  const handleProviderProfileSubmit = async (event) => {
    event.preventDefault()
    setProfileError('')

    try {
      setSavingProfile(true)

      const createdProfile =
        await apiRequest(
          '/service-providers/',
          {
            method: 'POST',
            body: JSON.stringify({
              ...profileForm,
              business_name:
                profileForm.business_name.trim(),
              description:
                profileForm.description.trim(),
              phone_number:
                profileForm.phone_number.trim(),
              address:
                profileForm.address.trim(),
              experience:
                Number(profileForm.experience),
            }),
          }
        )

      setProviderProfile(createdProfile)
      setShowProfileModal(false)
      setSuccess(
        'Provider profile created. You can now add services.'
      )
    } catch (requestError) {
      setProfileError(
        requestError.message ||
          'Unable to save your provider profile.'
      )
    } finally {
      setSavingProfile(false)
    }
  }

  const openEditServiceModal = (
    service
  ) => {
    clearMessages()

    setEditingService(service)

    setServiceForm({
      name: service.name || '',
      description:
        service.description || '',
      price: service.price || '',
      is_available:
        service.is_available !== false,
      image: null,
    })

    setImagePreview(
      getImageUrl(service.image)
    )

    setImageError('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setShowServiceModal(true)
  }

  const closeServiceModal = () => {
    if (savingService) {
      return
    }

    setShowServiceModal(false)
    setEditingService(null)

    resetServiceForm()
  }

  const handleServiceChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setServiceForm(
      (previous) => ({
        ...previous,
        [name]:
          type === 'checkbox'
            ? checked
            : value,
      })
    )
  }

  const handleImageChange = (
    event
  ) => {
    const file =
      event.target.files?.[0]

    setImageError('')

    if (!file) {
      setServiceForm(
        (previous) => ({
          ...previous,
          image: null,
        })
      )

      if (editingService) {
        setImagePreview(
          getImageUrl(
            editingService.image
          )
        )
      } else {
        setImagePreview('')
      }

      return
    }

    if (!file.type.startsWith('image/')) {
      setImageError(
        'Please select a valid image file.'
      )

      event.target.value = ''

      setServiceForm(
        (previous) => ({
          ...previous,
          image: null,
        })
      )

      return
    }

    const maxSize =
      5 * 1024 * 1024

    if (file.size > maxSize) {
      setImageError(
        'Image size must be 5 MB or less.'
      )

      event.target.value = ''

      setServiceForm(
        (previous) => ({
          ...previous,
          image: null,
        })
      )

      return
    }

    setServiceForm(
      (previous) => ({
        ...previous,
        image: file,
      })
    )

    const previewUrl =
      URL.createObjectURL(file)

    setImagePreview(previewUrl)
  }

  const handleServiceSubmit = async (
    event
  ) => {
    event.preventDefault()

    clearMessages()

    const name =
      serviceForm.name.trim()

    const description =
      serviceForm.description.trim()

    const price =
      String(
        serviceForm.price
      ).trim()

    if (!name) {
      setError(
        'Service name is required.'
      )
      return
    }

    if (!description) {
      setError(
        'Service description is required.'
      )
      return
    }

    if (!price) {
      setError(
        'Service price is required.'
      )
      return
    }

    if (
      Number.isNaN(Number(price)) ||
      Number(price) < 0
    ) {
      setError(
        'Please enter a valid service price.'
      )
      return
    }

    try {
      setSavingService(true)

      const formData = new FormData()

      formData.append(
        'name',
        name
      )

      formData.append(
        'description',
        description
      )

      formData.append(
        'price',
        price
      )

      formData.append(
        'is_available',
        serviceForm.is_available
          ? 'true'
          : 'false'
      )

      if (serviceForm.image) {
        formData.append(
          'image',
          serviceForm.image
        )
      }

      if (editingService) {
        const updatedService =
          await apiRequest(
            `/services/${editingService.id}/`,
            {
              method: 'PATCH',
              body: formData,
            }
          )

        setServices(
          (previous) =>
            previous.map(
              (service) =>
                service.id ===
                editingService.id
                  ? updatedService
                  : service
            )
        )

        setSuccess(
          'Service updated successfully.'
        )
      } else {
        const createdService =
          await apiRequest(
            '/services/',
            {
              method: 'POST',
              body: formData,
            }
          )

        setServices(
          (previous) => [
            ...previous,
            createdService,
          ]
        )

        setSuccess(
          'Service created successfully.'
        )
      }

      setShowServiceModal(false)
      setEditingService(null)
      resetServiceForm()
    } catch (err) {
      console.error(
        'Service save error:',
        err
      )

      setError(
        err.message ||
          'Unable to save service.'
      )
    } finally {
      setSavingService(false)
    }
  }

  const handleDeleteService = async (
    serviceId
  ) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this service?'
      )

    if (!confirmed) {
      return
    }

    clearMessages()

    try {
      setDeletingServiceId(
        serviceId
      )

      await apiRequest(
        `/services/${serviceId}/`,
        {
          method: 'DELETE',
        }
      )

      setServices(
        (previous) =>
          previous.map(
            (service) =>
              service.id !== serviceId
                ? service
                : {
                    ...service,
                    is_available: false,
                    is_deleted: true,
                    deleted_at:
                      new Date().toISOString(),
                  }
          )
      )

      setSuccess(
        'Service deleted successfully.'
      )
    } catch (err) {
      console.error(
        'Service delete error:',
        err
      )

      setError(
        err.message ||
          'Unable to delete service.'
      )
    } finally {
      setDeletingServiceId(null)
    }
  }

  const handleToggleAvailability =
    async (service) => {
      clearMessages()

      try {
        setUpdatingServiceId(
          service.id
        )

        const formData =
          new FormData()

        formData.append(
          'is_available',
          service.is_available
            ? 'false'
            : 'true'
        )

        const updatedService =
          await apiRequest(
            `/services/${service.id}/`,
            {
              method: 'PATCH',
              body: formData,
            }
          )

        setServices(
          (previous) =>
            previous.map(
              (item) =>
                item.id === service.id
                  ? updatedService
                  : item
            )
        )

        setSuccess(
          updatedService.is_available
            ? 'Service is now available.'
            : 'Service is now unavailable.'
        )
      } catch (err) {
        console.error(
          'Availability update error:',
          err
        )

        setError(
          err.message ||
            'Unable to update service availability.'
        )
      } finally {
        setUpdatingServiceId(null)
      }
    }

  const formatPrice = (
    price
  ) => {
    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }
    ).format(
      Number(price || 0)
    )
  }

  function getImageUrl(image) {
    if (!image) {
      return ''
    }

    if (
      image.startsWith(
        'http://'
      ) ||
      image.startsWith(
        'https://'
      )
    ) {
      return image
    }

    return `http://127.0.0.1:8000${image}`
  }

  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case 'confirmed':
        return 'text-bg-success'

      case 'completed':
        return 'text-bg-primary'

      case 'cancelled':
        return 'text-bg-danger'

      default:
        return 'text-bg-warning'
    }
  }

  const stats = useMemo(() => {
    const activeServices = services.filter(
      (service) => !service.is_deleted
    )
    const deletedServices = services.filter(
      (service) => service.is_deleted
    ).length
    const totalServices = activeServices.length

    const availableServices =
      activeServices.filter(
        (service) =>
          service.is_available
      ).length

    const totalBookings =
      bookings.length

    const pendingBookings =
      bookings.filter(
        (booking) =>
          booking.status ===
          'pending'
      ).length

    const confirmedBookings =
      bookings.filter(
        (booking) =>
          booking.status ===
          'confirmed'
      ).length

    const completedBookings =
      bookings.filter(
        (booking) =>
          booking.status ===
          'completed'
      ).length

    const servicePrices = new Map(
      services.map((service) => [
        String(service.id),
        Number(service.price || 0),
      ])
    )
    const getBookingRevenue = (booking) =>
      Number(
        booking.completed_price ??
          servicePrices.get(
            String(
              booking.service?.id ??
                booking.service
            )
          ) ??
          0
      )

    const completedBookingList =
      bookings.filter(
        (booking) =>
          booking.status === 'completed'
      )

    const lifetimeRevenue =
      completedBookingList.reduce(
        (total, booking) =>
          total + getBookingRevenue(booking),
        0
      )

    const currentDate = new Date()
    const currentYear = currentDate.getUTCFullYear()
    const currentMonth =
      `${currentYear}-${String(
        currentDate.getUTCMonth() + 1
      ).padStart(2, '0')}`

    const thisMonthCompletedBookings =
      completedBookingList.filter(
        (booking) =>
          booking.completed_at?.slice(0, 7) ===
          currentMonth
      )

    const monthlyRevenue =
      thisMonthCompletedBookings.reduce(
        (total, booking) =>
          total + getBookingRevenue(booking),
        0
      )
    const yearlyRevenue =
      completedBookingList.reduce(
        (total, booking) =>
          booking.completed_at?.slice(0, 4) ===
          String(currentYear)
            ? total + getBookingRevenue(booking)
            : total,
        0
      )

    const monthlyTargetProgress =
      Math.min(
        (monthlyRevenue / MONTHLY_REVENUE_TARGET) *
          100,
        100
      )

    const recentCompletedBookings =
      [...completedBookingList]
        .sort(
          (first, second) =>
            new Date(second.completed_at || 0) -
            new Date(first.completed_at || 0)
        )
        .slice(0, 4)

    const monthlyRevenueHistory =
      Array.from({ length: 12 }, (_, index) => {
        const monthDate = new Date(
          Date.UTC(currentYear, index, 1)
        )
        const monthKey =
          `${currentYear}-${String(index + 1).padStart(2, '0')}`
        const monthLabel =
          new Intl.DateTimeFormat('en', {
            month: 'short',
            timeZone: 'UTC',
          }).format(monthDate)
        const revenue =
          completedBookingList.reduce(
            (total, booking) => {
              if (
                booking.completed_at?.slice(0, 7) !==
                monthKey
              ) {
                return total
              }

              return total + getBookingRevenue(booking)
            },
            0
          )

        return {
          label: monthLabel,
          revenue,
        }
      })

    const monthlyRevenuePeak =
      Math.max(
        ...monthlyRevenueHistory.map(
          (month) => month.revenue
        ),
        1
      )

    return {
      totalServices,
      deletedServices,
      availableServices,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      lifetimeRevenue,
      yearlyRevenue,
      monthlyRevenue,
      monthlyTargetProgress,
      monthlyTargetRemaining: Math.max(
        MONTHLY_REVENUE_TARGET - monthlyRevenue,
        0
      ),
      thisMonthCompletedBookings:
        thisMonthCompletedBookings.length,
      earningsYear: currentYear,
      recentCompletedBookings,
      monthlyRevenueHistory,
      monthlyRevenuePeak,
    }
  }, [
    services,
    bookings,
  ])

  if (loading) {
    return (
      <main
        ref={dashboardRef}
        className={styles.dashboard}
      >
        <div className={`container ${styles.dashboardContent}`}>
          <div className={styles.loadingState}>
            <span
              className={styles.loadingOrb}
              role="status"
            >
              <span className="visually-hidden">
                Loading...
              </span>
            </span>
            <p>Preparing your workspace</p>
            <span>Loading provider dashboard</span>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main
      ref={dashboardRef}
      className={styles.dashboard}
    >
      <div className={`container ${styles.dashboardContent}`}>

        {/* HEADER */}

        <div className={`${styles.pageHeader} d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4`}>

          <div>
            <span className={styles.headerEyebrow}>
              <i className="bi bi-stars"></i>
              YOUR BUSINESS AT A GLANCE
            </span>

            <h1 className={`${styles.pageTitle} fw-bold mb-1`}>
              Provider Dashboard
            </h1>

            <p className={`${styles.pageDescription} mb-0`}>
              Manage your services, bookings, and business from one place.
            </p>
          </div>

          <button
            type="button"
            className={`btn ${styles.addServiceButton}`}
            onClick={
              openAddServiceModal
            }
          >
            <i className="bi bi-plus-lg me-2"></i>
            Add New Service
          </button>

        </div>

        {/* ALERTS */}

        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() =>
                setError('')
              }
            ></button>
          </div>
        )}

        {success && (
          <div
            className="alert alert-success alert-dismissible fade show"
            role="alert"
          >
            <i className="bi bi-check-circle me-2"></i>
            {success}

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() =>
                setSuccess('')
              }
            ></button>
          </div>
        )}

        {/* NAVIGATION */}

        <div className={`${styles.sectionTabs} d-flex flex-wrap gap-2 mb-4`}>

          <button
            type="button"
            className={`btn ${styles.sectionTab} ${
              activeSection ===
              'overview'
                ? styles.sectionTabActive
                : ''
            }`}
            onClick={() =>
              setActiveSection(
                'overview'
              )
            }
          >
            <i className="bi bi-grid me-2"></i>
            Overview
          </button>

          <button
            type="button"
            className={`btn ${styles.sectionTab} ${
              activeSection ===
              'services'
                ? styles.sectionTabActive
                : ''
            }`}
            onClick={() =>
              setActiveSection(
                'services'
              )
            }
          >
            <i className="bi bi-tools me-2"></i>
            My Services
          </button>

          <button
            type="button"
            className={`btn ${styles.sectionTab} ${
              activeSection ===
              'bookings'
                ? styles.sectionTabActive
                : ''
            }`}
            onClick={() =>
              setActiveSection(
                'bookings'
              )
            }
          >
            <i className="bi bi-calendar-check me-2"></i>
            Bookings
          </button>

        </div>

        {/* OVERVIEW */}

        {activeSection ===
          'overview' && (
          <section className={styles.dashboardSection}>

            <div className="row g-4 mb-4">

              <div className="col-12 col-sm-6 col-xl-3">

                <div className="card border-0 shadow-sm h-100">

                  <div className="card-body">

                    <div className="d-flex justify-content-between">

                      <div>
                        <p className="text-secondary mb-1">
                          Total Services
                        </p>

                        <h2 className="fw-bold mb-0">
                          {
                            stats.totalServices
                          }
                        </h2>
                      </div>

                      <i className="bi bi-tools fs-2 text-primary"></i>

                    </div>

                  </div>

                </div>

              </div>

              <div className="col-12 col-sm-6 col-xl-3">

                <div className="card border-0 shadow-sm h-100">

                  <div className="card-body">

                    <div className="d-flex justify-content-between">

                      <div>
                        <p className="text-secondary mb-1">
                          Deleted Services
                        </p>

                        <h2 className="fw-bold mb-0">
                          {stats.deletedServices}
                        </h2>
                      </div>

                      <i className="bi bi-archive fs-2 text-danger"></i>

                    </div>

                  </div>

                </div>

              </div>

              <div className="col-12 col-sm-6 col-xl-3">

                <div className="card border-0 shadow-sm h-100">

                  <div className="card-body">

                    <div className="d-flex justify-content-between">

                      <div>
                        <p className="text-secondary mb-1">
                          Available
                        </p>

                        <h2 className="fw-bold mb-0">
                          {
                            stats.availableServices
                          }
                        </h2>
                      </div>

                      <i className="bi bi-check-circle fs-2 text-success"></i>

                    </div>

                  </div>

                </div>

              </div>

              <div className="col-12 col-sm-6 col-xl-3">

                <div className="card border-0 shadow-sm h-100">

                  <div className="card-body">

                    <div className="d-flex justify-content-between">

                      <div>
                        <p className="text-secondary mb-1">
                          Total Bookings
                        </p>

                        <h2 className="fw-bold mb-0">
                          {
                            stats.totalBookings
                          }
                        </h2>
                      </div>

                      <i className="bi bi-calendar-check fs-2 text-info"></i>

                    </div>

                  </div>

                </div>

              </div>

              <div className="col-12 col-sm-6 col-xl-3">

                <div className="card border-0 shadow-sm h-100">

                  <div className="card-body">

                    <div className="d-flex justify-content-between">

                      <div>
                        <p className="text-secondary mb-1">
                          Pending
                        </p>

                        <h2 className="fw-bold mb-0">
                          {
                            stats.pendingBookings
                          }
                        </h2>
                      </div>

                      <i className="bi bi-hourglass-split fs-2 text-warning"></i>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <section
              className={styles.earningsAnalytics}
              aria-labelledby="earningsAnalyticsTitle"
            >
              <div className={styles.analyticsMain}>
                <div className={styles.analyticsHeader}>
                  <div>
                    <span className={styles.analyticsEyebrow}>
                      <i className="bi bi-activity"></i>
                      BUSINESS ANALYTICS
                    </span>
                    <h2 id="earningsAnalyticsTitle">
                      Earnings overview
                    </h2>
                    <p>
                      Completed services update your earnings automatically.
                    </p>
                  </div>

                  <span className={styles.analyticsPeriod}>
                    <i className="bi bi-calendar3"></i>
                    {new Intl.DateTimeFormat('en-IN', {
                      month: 'long',
                      year: 'numeric',
                    }).format(new Date())}
                  </span>
                </div>

                <div className={styles.earningsTotal}>
                  <span>Lifetime earnings</span>
                  <strong>
                    <AnimatedMetric
                      value={stats.lifetimeRevenue}
                      currency
                    />
                  </strong>
                  <small>
                    <i className="bi bi-check-circle-fill"></i>
                    {stats.completedBookings} completed services
                  </small>
                </div>

                <div className={styles.yearlyEarnings}>
                  <span>{stats.earningsYear} earnings</span>
                  <strong>
                    <AnimatedMetric
                      value={stats.yearlyRevenue}
                      currency
                    />
                  </strong>
                </div>

                <div
                  className={styles.earningsChart}
                  aria-label={`Monthly earnings from January to December ${stats.earningsYear}`}
                >
                  {stats.monthlyRevenueHistory.map(
                    (month) => (
                      <div
                        className={styles.earningsChartColumn}
                        key={month.label}
                        title={`${month.label}: ${formatPrice(month.revenue)}`}
                      >
                        <span className={styles.chartValue}>
                          {month.revenue > 0
                            ? formatPrice(month.revenue)
                            : ''}
                        </span>
                        <div className={styles.chartBarTrack}>
                          <span
                            className={styles.chartBar}
                            style={{
                              height: `${
                                month.revenue
                                  ? Math.max(
                                      (month.revenue /
                                        stats.monthlyRevenuePeak) *
                                        100,
                                      8
                                    )
                                  : 0
                              }%`,
                            }}
                          ></span>
                        </div>
                        <small>{month.label}</small>
                      </div>
                    )
                  )}
                </div>
              </div>

              <aside className={styles.monthlyTargetPanel}>
                <div className={styles.targetTopline}>
                  <span>MONTHLY TARGET</span>
                  <i className="bi bi-bullseye"></i>
                </div>

                <div className={styles.targetRing}>
                  <svg
                    viewBox="0 0 120 120"
                    role="img"
                    aria-label={`${Math.round(stats.monthlyTargetProgress)} percent of monthly earnings target reached`}
                  >
                    <circle
                      className={styles.targetRingTrack}
                      cx="60"
                      cy="60"
                      r="48"
                      pathLength="100"
                    />
                    <circle
                      className={styles.targetRingProgress}
                      cx="60"
                      cy="60"
                      r="48"
                      pathLength="100"
                      style={{
                        strokeDashoffset:
                          100 -
                          stats.monthlyTargetProgress,
                      }}
                    />
                  </svg>
                  <div className={styles.targetRingLabel}>
                    <strong>
                      <AnimatedMetric
                        value={Math.round(
                          stats.monthlyTargetProgress
                        )}
                      />
                      %
                    </strong>
                    <span>reached</span>
                  </div>
                </div>

                <div className={styles.targetAmounts}>
                  <div>
                    <span>Earned this month</span>
                    <strong>
                      <AnimatedMetric
                        value={stats.monthlyRevenue}
                        currency
                      />
                    </strong>
                  </div>
                  <div className={styles.targetRemaining}>
                    <span>Still to target</span>
                    <strong>
                      <AnimatedMetric
                        value={stats.monthlyTargetRemaining}
                        currency
                      />
                    </strong>
                  </div>
                </div>

                <div
                  className={styles.targetProgressTrack}
                  role="progressbar"
                  aria-label="Monthly earnings target"
                  aria-valuenow={Math.round(
                    stats.monthlyTargetProgress
                  )}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <span
                    style={{
                      width: `${stats.monthlyTargetProgress}%`,
                    }}
                  ></span>
                </div>

                <p className={styles.targetNote}>
                  {stats.monthlyTargetRemaining === 0
                    ? 'Monthly target reached — great work!'
                    : `${stats.thisMonthCompletedBookings} completed ${
                        stats.thisMonthCompletedBookings === 1
                          ? 'service'
                          : 'services'
                      } this month`}
                </p>
              </aside>

              <div className={styles.recentEarnings}>
                <div className={styles.recentEarningsHeading}>
                  <div>
                    <span>RECENT ACTIVITY</span>
                    <h3>Completed services</h3>
                  </div>
                  <i className="bi bi-clock-history"></i>
                </div>

                {stats.recentCompletedBookings.length === 0 ? (
                  <p className={styles.noEarnings}>
                    Complete your first service to start tracking earnings.
                  </p>
                ) : (
                  <ul>
                    {stats.recentCompletedBookings.map(
                      (booking) => {
                        const completedService =
                          services.find(
                            (service) =>
                              String(service.id) ===
                              String(
                                booking.service?.id ??
                                  booking.service
                              )
                          )

                        return (
                          <li key={booking.id}>
                            <span className={styles.earningCheck}>
                              <i className="bi bi-check-lg"></i>
                            </span>
                            <span className={styles.earningServiceName}>
                              {completedService?.name ||
                                `Service #${booking.service}`}
                              <small>
                                {booking.completed_at
                                  ? new Date(
                                      booking.completed_at
                                    ).toLocaleDateString(
                                      'en-IN',
                                      {
                                        day: 'numeric',
                                        month: 'short',
                                      }
                                    )
                                  : 'Completed'}
                              </small>
                            </span>
                            <strong>
                              +{formatPrice(
                                booking.completed_price ??
                                  completedService?.price
                              )}
                            </strong>
                          </li>
                        )
                      }
                    )}
                  </ul>
                )}
              </div>
            </section>

            <div className="card border-0 shadow-sm">

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <div>
                    <h3 className="h5 fw-bold mb-1">
                      Recent Bookings
                    </h3>

                    <p className="text-secondary mb-0">
                      Latest booking activity for your services.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() =>
                      setActiveSection(
                        'bookings'
                      )
                    }
                  >
                    View All
                  </button>

                </div>

                {bookings.length ===
                0 ? (
                  <div className="text-center py-5">

                    <i className="bi bi-calendar-x fs-1 text-secondary"></i>

                    <p className="text-secondary mt-3 mb-0">
                      No bookings yet.
                    </p>

                  </div>
                ) : (
                  <div className="table-responsive">

                    <table className="table align-middle">

                      <thead>
                        <tr>
                          <th>
                            Service
                          </th>

                          <th>
                            Date
                          </th>

                          <th>
                            Time
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>

                        {bookings
                          .slice(
                            0,
                            5
                          )
                          .map(
                            (
                              booking
                            ) => (
                              <tr
                                key={
                                  booking.id
                                }
                              >
                                <td>
                                  <strong>
                                    {booking.service_name ||
                                      booking.service?.name ||
                                      `Service #${booking.service}`}
                                  </strong>
                                </td>

                                <td>
                                  {
                                    booking.booking_date
                                  }
                                </td>

                                <td>
                                  {
                                    booking.booking_time
                                  }
                                </td>

                                <td>
                                  <span
                                    className={`badge ${getStatusClass(
                                      booking.status
                                    )}`}
                                  >
                                    {
                                      booking.status
                                    }
                                  </span>
                                </td>

                                <td>
                                  <div className="d-flex flex-wrap gap-2">
                                    <Link
                                      to={`/booking-chat/${booking.id}`}
                                      className="btn btn-sm btn-outline-primary"
                                    >
                                      <i className="bi bi-chat-dots me-1"></i>
                                      Chat
                                    </Link>
                                    {booking.cancellation_request?.status ===
                                      'pending' && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-warning"
                                        onClick={() =>
                                          openCancellationReview(booking)
                                        }
                                      >
                                        <i className="bi bi-calendar2-x me-1"></i>
                                        Review cancellation
                                      </button>
                                    )}
                                    {booking.status === 'pending' && (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-success"
                                        onClick={() =>
                                          handleBookingResponse(
                                            booking,
                                            'confirmed'
                                          )
                                        }
                                        disabled={
                                          updatingBookingId ===
                                          booking.id
                                        }
                                      >
                                        {updatingBookingId ===
                                        booking.id ? (
                                          <span
                                            className="spinner-border spinner-border-sm"
                                            aria-label="Updating booking"
                                          ></span>
                                        ) : (
                                          <>
                                            <i className="bi bi-check-lg me-1"></i>
                                            Accept
                                          </>
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => {
                                          setDecliningBooking(booking)
                                          setCancellationReason('')
                                          setDeclineError('')
                                          clearMessages()
                                        }}
                                        disabled={
                                          updatingBookingId ===
                                          booking.id
                                        }
                                      >
                                        Decline
                                      </button>
                                    </>
                                    )}

                                  {booking.status === 'confirmed' && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-primary"
                                      onClick={() =>
                                        handleBookingResponse(
                                          booking,
                                          'completed'
                                        )
                                      }
                                      disabled={
                                        updatingBookingId ===
                                        booking.id
                                      }
                                    >
                                      Mark complete
                                    </button>
                                  )}
                                  </div>
                                </td>
                              </tr>
                            )
                          )}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>

            </div>

          </section>
        )}

        {/* SERVICES */}

        {activeSection ===
          'services' && (
          <section className={styles.dashboardSection}>

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

              <div>
                <h2 className="fw-bold mb-1">
                  My Services
                </h2>

                <p className="text-secondary mb-0">
                  Manage your services.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  openAddServiceModal
                }
              >
                <i className="bi bi-plus-lg me-2"></i>
                Add Service
              </button>

            </div>

            {services.length ===
            0 ? (
              <div className="card border-0 shadow-sm">

                <div className="card-body text-center py-5">

                  <i className="bi bi-tools fs-1 text-secondary"></i>

                  <h3 className="h5 fw-bold mt-3">
                    No services added
                  </h3>

                  <p className="text-secondary">
                    Add your first service.
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={
                      openAddServiceModal
                    }
                  >
                    <i className="bi bi-plus-lg me-2"></i>
                    Add Service
                  </button>

                </div>

              </div>
            ) : (
              <div className="row g-4">

                {services.map(
                  (service) => {
                    const imageUrl =
                      getImageUrl(
                        service.image
                      )

                    return (
                      <div
                        key={
                          service.id
                        }
                        className="col-12 col-md-6 col-xl-4"
                      >

                        <div className="card border-0 shadow-sm h-100 overflow-hidden">

                          {imageUrl ? (
                            <img
                              src={
                                imageUrl
                              }
                              alt={
                                service.name
                              }
                              className="w-100"
                              style={{
                                height:
                                  '220px',
                                objectFit:
                                  'cover',
                              }}
                            />
                          ) : (
                            <div
                              className="bg-light d-flex justify-content-center align-items-center"
                              style={{
                                height:
                                  '220px',
                              }}
                            >
                              <i className="bi bi-image fs-1 text-secondary"></i>
                            </div>
                          )}

                          <div className="card-body">

                            <div className="d-flex justify-content-between gap-2 mb-2">

                              <h3 className="h5 fw-bold mb-0">
                                {
                                  service.name
                                }
                              </h3>

                              <span
                                className={`badge ${
                                  service.is_deleted
                                    ? 'text-bg-danger'
                                    : service.is_available
                                      ? 'text-bg-success'
                                      : 'text-bg-secondary'
                                }`}
                              >
                                {service.is_deleted
                                  ? 'Deleted'
                                  : service.is_available
                                    ? 'Available'
                                    : 'Unavailable'}
                              </span>

                            </div>

                            <p className="text-secondary small">
                              {
                                service.description
                              }
                            </p>

                            <h4 className="h5 fw-bold text-primary">
                              {
                                formatPrice(
                                  service.price
                                )
                              }
                            </h4>

                            {service.is_deleted &&
                              service.deleted_at && (
                                <p className="text-secondary small">
                                  Archived{' '}
                                  {new Date(
                                    service.deleted_at
                                  ).toLocaleDateString('en-IN')}
                                </p>
                              )}

                            {!service.is_deleted && (
                            <div className="d-flex flex-wrap gap-2 mt-3">

                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() =>
                                  openEditServiceModal(
                                    service
                                  )
                                }
                              >
                                <i className="bi bi-pencil me-1"></i>
                                Edit
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline-warning btn-sm"
                                disabled={
                                  updatingServiceId ===
                                  service.id
                                }
                                onClick={() =>
                                  handleToggleAvailability(
                                    service
                                  )
                                }
                              >
                                {updatingServiceId ===
                                service.id ? (
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>
                                ) : (
                                  <>
                                    <i
                                      className={`bi ${
                                        service.is_available
                                          ? 'bi-eye-slash'
                                          : 'bi-eye'
                                      } me-1`}
                                    ></i>

                                    {service.is_available
                                      ? 'Disable'
                                      : 'Enable'}
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                disabled={
                                  deletingServiceId ===
                                  service.id
                                }
                                onClick={() =>
                                  handleDeleteService(
                                    service.id
                                  )
                                }
                              >
                                {deletingServiceId ===
                                service.id ? (
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>
                                ) : (
                                  <>
                                    <i className="bi bi-trash me-1"></i>
                                    Delete
                                  </>
                                )}
                              </button>

                            </div>
                            )}

                          </div>

                        </div>

                      </div>
                    )
                  }
                )}

              </div>
            )}

          </section>
        )}

        {/* BOOKINGS */}

        {activeSection ===
          'bookings' && (
          <section className={styles.dashboardSection}>

            <div className="mb-4">

              <h2 className="fw-bold mb-1">
                Bookings
              </h2>

              <p className="text-secondary mb-0">
                View bookings received for your services.
              </p>

            </div>

            <div className="row g-3 mb-4">

              <div className="col-12 col-sm-6 col-lg-3">

                <div className="card border-0 shadow-sm">

                  <div className="card-body">

                    <p className="text-secondary mb-1">
                      Total
                    </p>

                    <h3 className="fw-bold mb-0">
                      {
                        stats.totalBookings
                      }
                    </h3>

                  </div>

                </div>

              </div>

              <div className="col-12 col-sm-6 col-lg-3">

                <div className="card border-0 shadow-sm">

                  <div className="card-body">

                    <p className="text-secondary mb-1">
                      Pending
                    </p>

                    <h3 className="fw-bold mb-0">
                      {
                        stats.pendingBookings
                      }
                    </h3>

                  </div>

                </div>

              </div>

              <div className="col-12 col-sm-6 col-lg-3">

                <div className="card border-0 shadow-sm">

                  <div className="card-body">

                    <p className="text-secondary mb-1">
                      Confirmed
                    </p>

                    <h3 className="fw-bold mb-0">
                      {
                        stats.confirmedBookings
                      }
                    </h3>

                  </div>

                </div>

              </div>

              <div className="col-12 col-sm-6 col-lg-3">

                <div className="card border-0 shadow-sm">

                  <div className="card-body">

                    <p className="text-secondary mb-1">
                      Completed
                    </p>

                    <h3 className="fw-bold mb-0">
                      {
                        stats.completedBookings
                      }
                    </h3>

                  </div>

                </div>

              </div>

            </div>

            <div className="card border-0 shadow-sm">

              <div className="card-body">

                {bookings.length ===
                0 ? (
                  <div className="text-center py-5">

                    <i className="bi bi-calendar-x fs-1 text-secondary"></i>

                    <p className="text-secondary mt-3 mb-0">
                      No bookings found.
                    </p>

                  </div>
                ) : (
                  <div className="table-responsive">

                    <table className="table align-middle">

                      <thead>
                        <tr>
                          <th>
                            #
                          </th>

                          <th>
                            Service
                          </th>

                          <th>
                            Date
                          </th>

                          <th>
                            Time
                          </th>

                          <th>
                            Address
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            Chat
                          </th>
                        </tr>
                      </thead>

                      <tbody>

                        {bookings.map(
                          (
                            booking,
                            index
                          ) => (
                            <tr
                              key={
                                booking.id
                              }
                            >
                              <td>
                                {
                                  index +
                                    1
                                }
                              </td>

                              <td>
                                <strong>
                                  {booking.service_name ||
                                    booking.service?.name ||
                                    `Service #${booking.service}`}
                                </strong>
                              </td>

                              <td>
                                {
                                  booking.booking_date
                                }
                              </td>

                              <td>
                                {
                                  booking.booking_time
                                }
                              </td>

                              <td>
                                {
                                  booking.address
                                }
                              </td>

                              <td>
                                <span
                                  className={`badge ${getStatusClass(
                                    booking.status
                                  )}`}
                                >
                                  {
                                    booking.status
                                  }
                                </span>
                              </td>

                              <td>
                                <div className="d-flex flex-wrap gap-2">
                                  <Link
                                    to={`/booking-chat/${booking.id}`}
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="bi bi-chat-dots me-1"></i>
                                    Chat
                                  </Link>
                                  {booking.cancellation_request?.status ===
                                    'pending' && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-warning"
                                      onClick={() =>
                                        openCancellationReview(booking)
                                      }
                                    >
                                      <i className="bi bi-calendar2-x me-1"></i>
                                      Review cancellation
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>

            </div>

          </section>
        )}

      </div>

      {/* SERVICE MODAL */}

      {showProfileModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="providerProfileTitle"
          style={{
            backgroundColor:
              'rgba(0, 0, 0, 0.55)',
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <span className="badge text-bg-primary mb-2">
                    PROVIDER SETUP
                  </span>
                  <h2
                    id="providerProfileTitle"
                    className="modal-title h5 fw-bold mb-0"
                  >
                    Complete your provider profile
                  </h2>
                  <p className="text-secondary small mb-0 mt-1">
                    Your profile is needed before you can publish services.
                  </p>
                </div>
              </div>

              <form onSubmit={handleProviderProfileSubmit}>
                <div
                  className="modal-body"
                  style={{
                    maxHeight: '65vh',
                  }}
                >
                  {profileError && (
                    <div className="alert alert-danger" role="alert">
                      {profileError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label
                      htmlFor="providerBusinessName"
                      className="form-label fw-semibold"
                    >
                      Business name
                    </label>
                    <input
                      id="providerBusinessName"
                      name="business_name"
                      className="form-control"
                      value={profileForm.business_name}
                      onChange={handleProfileChange}
                      maxLength="150"
                      required
                      disabled={savingProfile}
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="providerDescription"
                      className="form-label fw-semibold"
                    >
                      Business description
                    </label>
                    <textarea
                      id="providerDescription"
                      name="description"
                      className="form-control"
                      rows="3"
                      value={profileForm.description}
                      onChange={handleProfileChange}
                      disabled={savingProfile}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="providerPhone"
                      className="form-label fw-semibold"
                    >
                      Phone number
                    </label>
                    <input
                      id="providerPhone"
                      name="phone_number"
                      type="tel"
                      className="form-control"
                      value={profileForm.phone_number}
                      onChange={handleProfileChange}
                      maxLength="20"
                      required
                      disabled={savingProfile}
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="providerAddress"
                      className="form-label fw-semibold"
                    >
                      Business address
                    </label>
                    <textarea
                      id="providerAddress"
                      name="address"
                      className="form-control"
                      rows="2"
                      value={profileForm.address}
                      onChange={handleProfileChange}
                      required
                      disabled={savingProfile}
                    ></textarea>
                  </div>

                  <div className="mb-1">
                    <label
                      htmlFor="providerExperience"
                      className="form-label fw-semibold"
                    >
                      Years of experience
                    </label>
                    <input
                      id="providerExperience"
                      name="experience"
                      type="number"
                      className="form-control"
                      value={profileForm.experience}
                      onChange={handleProfileChange}
                      min="0"
                      step="1"
                      required
                      disabled={savingProfile}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        ></span>
                        Saving profile...
                      </>
                    ) : (
                      'Save profile'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {decliningBooking && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="declineBookingTitle"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  handleBookingResponse(
                    decliningBooking,
                    'cancelled',
                    cancellationReason
                  )
                }}
              >
                <div className="modal-header">
                  <div>
                    <span className="badge text-bg-warning mb-2">
                      BOOKING UPDATE
                    </span>
                    <h2
                      id="declineBookingTitle"
                      className="modal-title h5 fw-bold mb-0"
                    >
                      Decline this booking?
                    </h2>
                    <p className="text-secondary small mb-0 mt-1">
                      The customer will see your reason in their booking tracker.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setDecliningBooking(null)
                      setDeclineError('')
                    }}
                    aria-label="Close"
                    disabled={
                      updatingBookingId === decliningBooking.id
                    }
                  ></button>
                </div>

                <div className="modal-body">
                  {declineError && (
                    <div className="alert alert-danger" role="alert">
                      {declineError}
                    </div>
                  )}
                  <label
                    htmlFor="bookingDeclineReason"
                    className="form-label fw-semibold"
                  >
                    Reason for declining
                  </label>
                  <textarea
                    id="bookingDeclineReason"
                    className="form-control"
                    rows="4"
                    value={cancellationReason}
                    onChange={(event) => {
                      setCancellationReason(event.target.value)
                      setDeclineError('')
                    }}
                    placeholder="Let the customer know why you cannot accept this booking..."
                    minLength={5}
                    maxLength={500}
                    required
                    disabled={
                      updatingBookingId === decliningBooking.id
                    }
                  ></textarea>
                  <small className="text-secondary">
                    {cancellationReason.length}/500 characters
                  </small>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setDecliningBooking(null)
                      setDeclineError('')
                    }}
                    disabled={
                      updatingBookingId === decliningBooking.id
                    }
                  >
                    Keep booking
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={
                      updatingBookingId === decliningBooking.id ||
                      cancellationReason.trim().length < 5
                    }
                  >
                    {updatingBookingId === decliningBooking.id ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        ></span>
                        Sending update...
                      </>
                    ) : (
                      'Decline and notify customer'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {reviewingCancellation && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="customerCancellationTitle"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${styles.cancellationReviewModal}`}>
              <div className="modal-header">
                <div>
                  <span className="badge text-bg-warning mb-2">
                    CUSTOMER REQUEST
                  </span>
                  <h2
                    id="customerCancellationTitle"
                    className="modal-title h5 fw-bold mb-0"
                  >
                    Review cancellation
                  </h2>
                  <p className={`${styles.cancellationReviewMuted} small mb-0 mt-1`}>
                    {reviewingCancellation.service_name ||
                      reviewingCancellation.service?.name ||
                      'Booked service'}
                    {' · '}
                    {reviewingCancellation.customer_name || 'Customer'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    if (!cancellationReviewLoading) {
                      setReviewingCancellation(null)
                      setCancellationReviewError('')
                    }
                  }}
                  aria-label="Close"
                  disabled={cancellationReviewLoading}
                ></button>
              </div>

              <div className="modal-body">
                {cancellationReviewLoading ? (
                  <div className="text-center py-4" role="status">
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Opening the customer’s request…
                  </div>
                ) : cancellationReviewError && !cancellationReview ? (
                  <div className="alert alert-danger" role="alert">
                    {cancellationReviewError}
                  </div>
                ) : cancellationReview ? (
                  <>
                    <div className={`${styles.cancellationReasonCard} rounded-3 border p-3`}>
                      <span className={`${styles.cancellationReasonLabel} small fw-bold`}>
                        CUSTOMER’S REASON
                      </span>
                      <p className={`${styles.cancellationReasonText} mb-0 mt-2 text-break`}>
                        {cancellationReview.reason}
                      </p>
                    </div>
                    <p className={`${styles.cancellationReviewMuted} small mt-3 mb-2`}>
                      Read the reason and choose whether to approve. The service
                      is cancelled only if you approve.
                    </p>
                    <Link
                      to={`/booking-chat/${reviewingCancellation.id}`}
                      className="small text-decoration-none"
                      onClick={() => setReviewingCancellation(null)}
                    >
                      <i className="bi bi-chat-dots me-1"></i>
                      Open the booking chat
                    </Link>
                    <label
                      htmlFor="providerCancellationResponse"
                      className="form-label fw-semibold small mt-3"
                    >
                      Optional message to customer
                    </label>
                    <textarea
                      id="providerCancellationResponse"
                      className="form-control"
                      rows="2"
                      maxLength={500}
                      value={cancellationProviderResponse}
                      onChange={(event) =>
                        setCancellationProviderResponse(
                          event.target.value
                        )
                      }
                      placeholder="Add a short note for the customer..."
                      disabled={
                        updatingBookingId === reviewingCancellation.id
                      }
                    ></textarea>
                    {cancellationReviewError && (
                      <div className="alert alert-danger mt-3 mb-0" role="alert">
                        {cancellationReviewError}
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {cancellationReview && (
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() =>
                      decideCancellationRequest('rejected')
                    }
                    disabled={
                      !cancellationReview.provider_read_at ||
                      updatingBookingId === reviewingCancellation.id
                    }
                  >
                    Keep booking
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() =>
                      decideCancellationRequest('approved')
                    }
                    disabled={
                      !cancellationReview.provider_read_at ||
                      updatingBookingId === reviewingCancellation.id
                    }
                  >
                    {updatingBookingId === reviewingCancellation.id ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        ></span>
                        Updating…
                      </>
                    ) : (
                      'Approve cancellation'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showServiceModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          style={{
            backgroundColor:
              'rgba(0, 0, 0, 0.55)',
          }}
        >

          <div
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
            style={{
              maxWidth:
                '560px',
            }}
          >

            <div className="modal-content">

              {/* MODAL HEADER */}

              <div className="modal-header">

                <div>

                  <span className="badge text-bg-primary mb-2">
                    SERVICE MANAGEMENT
                  </span>

                  <h2 className="modal-title h5 fw-bold mb-0">
                    {editingService
                      ? 'Edit service'
                      : 'Add new service'}
                  </h2>

                  <p className="text-secondary small mb-0 mt-1">
                    {editingService
                      ? 'Update your service details.'
                      : 'Create a new service for your business.'}
                  </p>

                </div>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={
                    closeServiceModal
                  }
                  disabled={
                    savingService
                  }
                ></button>

              </div>

              {/* FORM */}

              <form
                onSubmit={
                  handleServiceSubmit
                }
              >

                <div
                  className="modal-body"
                  style={{
                    maxHeight:
                      '65vh',
                  }}
                >

                  {/* NAME */}

                  <div className="mb-3">

                    <label
                      htmlFor="serviceName"
                      className="form-label fw-semibold"
                    >
                      Service name
                    </label>

                    <input
                      id="serviceName"
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Enter service name"
                      value={
                        serviceForm.name
                      }
                      onChange={
                        handleServiceChange
                      }
                      disabled={
                        savingService
                      }
                    />

                  </div>

                  {/* DESCRIPTION */}

                  <div className="mb-3">

                    <label
                      htmlFor="serviceDescription"
                      className="form-label fw-semibold"
                    >
                      Description
                    </label>

                    <textarea
                      id="serviceDescription"
                      name="description"
                      className="form-control"
                      rows="3"
                      placeholder="Describe your service"
                      value={
                        serviceForm.description
                      }
                      onChange={
                        handleServiceChange
                      }
                      disabled={
                        savingService
                      }
                    ></textarea>

                  </div>

                  {/* PRICE */}

                  <div className="mb-3">

                    <label
                      htmlFor="servicePrice"
                      className="form-label fw-semibold"
                    >
                      Price
                    </label>

                    <div className="input-group">

                      <span className="input-group-text">
                        ₹
                      </span>

                      <input
                        id="servicePrice"
                        type="number"
                        name="price"
                        className="form-control"
                        placeholder="Enter price"
                        min="0"
                        step="0.01"
                        value={
                          serviceForm.price
                        }
                        onChange={
                          handleServiceChange
                        }
                        disabled={
                          savingService
                        }
                      />

                    </div>

                  </div>

                  {/* IMAGE */}

                  <div className="mb-3">

                    <label
                      htmlFor="serviceImage"
                      className="form-label fw-semibold"
                    >
                      Service image
                    </label>

                    <input
                      ref={
                        fileInputRef
                      }
                      id="serviceImage"
                      type="file"
                      name="image"
                      className="form-control"
                      accept="image/*"
                      onChange={
                        handleImageChange
                      }
                      disabled={
                        savingService
                      }
                    />

                    <div className="form-text">
                      JPG, PNG or WEBP. Maximum 5 MB.
                    </div>

                    {imageError && (
                      <div className="alert alert-danger py-2 mt-2 mb-0 small">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {imageError}
                      </div>
                    )}

                    {/* IMAGE PREVIEW */}

                    {imagePreview && (
                      <div className="mt-3">

                        <div
                          className="position-relative overflow-hidden rounded border bg-light"
                          style={{
                            height:
                              '180px',
                          }}
                        >

                          <img
                            src={
                              imagePreview
                            }
                            alt="Service preview"
                            className="w-100 h-100"
                            style={{
                              objectFit:
                                'cover',
                            }}
                          />

                        </div>

                      </div>
                    )}

                  </div>

                  {/* AVAILABLE */}

                  <div className="form-check form-switch">

                    <input
                      id="serviceAvailable"
                      type="checkbox"
                      name="is_available"
                      className="form-check-input"
                      checked={
                        serviceForm.is_available
                      }
                      onChange={
                        handleServiceChange
                      }
                      disabled={
                        savingService
                      }
                    />

                    <label
                      htmlFor="serviceAvailable"
                      className="form-check-label"
                    >
                      Service is available
                    </label>

                  </div>

                </div>

                {/* MODAL FOOTER */}

                <div className="modal-footer">

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={
                      closeServiceModal
                    }
                    disabled={
                      savingService
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      savingService
                    }
                  >

                    {savingService ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        ></span>

                        {editingService
                          ? 'Updating...'
                          : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>

                        {editingService
                          ? 'Update Service'
                          : 'Create Service'}
                      </>
                    )}

                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>
      )}

    </main>
  )
}

export default ProviderDashboard