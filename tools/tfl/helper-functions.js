/**
 * Extracts clean journey summary from TfL journey data
 * @param {Object} journey - Raw journey object from TfL API
 * @returns {Object} - Simplified journey summary
 */
export const extractJourneySummary = (journey) => {
  return {
    startDateTime: journey.startDateTime,
    arrivalDateTime: journey.arrivalDateTime,
    duration: journey.duration,
    legs: journey.legs?.map(extractLegSummary) || [],
    alternativeRoute: journey.alternativeRoute
  };
};

/**
 * Extracts clean leg summary from TfL leg data
 * @param {Object} leg - Raw leg object from TfL API
 * @returns {Object} - Simplified leg summary
 */
export const extractLegSummary = (leg) => {
  const summary = {
    mode: leg.mode?.name || 'unknown',
    duration: leg.duration,
    departureTime: leg.departureTime,
    arrivalTime: leg.arrivalTime,
    from: leg.departurePoint?.commonName || 'Unknown',
    to: leg.arrivalPoint?.commonName || 'Unknown',
    instruction: leg.instruction?.summary || '',
    isDisrupted: leg.isDisrupted || false
  };

  // Add distance for walking legs
  if (leg.mode?.name === 'walking' && leg.distance) {
    summary.distance = Math.round(leg.distance);
    summary.distanceUnit = 'metres';
  }

  // Add route info for transit legs
  if (leg.routeOptions?.[0]) {
    const route = leg.routeOptions[0];
    if (route.name) summary.routeName = route.name;
    if (route.direction) summary.direction = route.direction;
  }

  // Add platform info if available
  if (leg.departurePoint?.platformName) {
    summary.departurePlatform = leg.departurePoint.platformName;
  }
  if (leg.arrivalPoint?.platformName) {
    summary.arrivalPlatform = leg.arrivalPoint.platformName;
  }

  return summary;
};

/**
 * Formats disambiguation data from TfL API response
 * @param {Object} disambiguation - Disambiguation object from TfL API
 * @returns {Array} - Array of top 3 normalized location options
 */
export const formatDisambiguation = (disambiguation) => {
  if (!disambiguation) return [];

  const options = disambiguation.matches || disambiguation.disambiguationOptions || [];

  const normalized = options.map((option) => {
    if (option.name) {
      const {
        id,
        name,
        lat,
        lon,
        matchQuality,
        modes,
        routeType,
        placeType,
        parameterStatus,
      } = option;
      return {
        parameterValue: id,
        name,
        matchQuality,
        modes,
        routeType,
        placeType,
        parameterStatus,
        lat,
        lon,
      };
    }

    const {
      parameterValue,
      uri,
      place = {},
      matchQuality,
    } = option;
    const {
      commonName,
      placeType,
      lat,
      lon,
      modes,
      naptanId,
      icsCode,
    } = place;

    return {
      parameterValue,
      uri,
      name: commonName,
      matchQuality,
      modes,
      placeType,
      lat,
      lon,
      naptanId,
      icsCode,
    };
  });

  return normalized
    .sort((a, b) => (b.matchQuality ?? 0) - (a.matchQuality ?? 0))
    .slice(0, 3);
};