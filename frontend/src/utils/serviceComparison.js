export const getServiceGroupKey = (name) =>
  (name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase()

export const getProviderScore = (service, services) => {
  const prices = services.map((item) =>
    Number(item.price || 0)
  )
  const experienceYears = services.map((item) =>
    Number(item.provider_experience || 0)
  )
  const lowestPrice = Math.min(...prices)
  const highestExperience = Math.max(...experienceYears)
  const price = Number(service.price || 0)
  const experience = Number(
    service.provider_experience || 0
  )

  const availabilityScore = service.is_available ? 35 : 0
  const verificationScore = service.provider_verified ? 25 : 0
  const experienceScore = highestExperience
    ? (experience / highestExperience) * 25
    : 0
  const priceScore = price === 0
    ? 15
    : lowestPrice === 0
      ? 0
      : (lowestPrice / price) * 15

  return Math.round(
    availabilityScore +
      verificationScore +
      experienceScore +
      priceScore
  )
}

export const rankProviders = (services) =>
  services
    .map((service) => ({
      ...service,
      comparisonScore: getProviderScore(service, services),
    }))
    .sort(
      (first, second) =>
        second.comparisonScore - first.comparisonScore ||
        Number(first.price || 0) -
          Number(second.price || 0) ||
        Number(second.provider_experience || 0) -
          Number(first.provider_experience || 0)
    )
