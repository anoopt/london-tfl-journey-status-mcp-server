import { extractJourneySummary, formatDisambiguation } from './helper-functions.js';

/**
 * Function to plan a journey between two locations using the TfL Journey Planner.
 *
 * @param {Object} args - Arguments for the API request.
 * @param {string} args.fromLocation - The origin location (station, place, or UK postcode).
 * @param {string} args.toLocation - The destination location (station, place, or UK postcode).
 * @param {string} [args.app_key] - Optional application key for authentication.
 * @returns {Promise<Object>} - The response from the API.
 */
const executeFunction = async (args = {}) => {
  const { fromLocation, toLocation, app_key, ...queryParams } = args;

  if (!fromLocation) {
    throw new Error('fromLocation is required');
  }

  if (!toLocation) {
    throw new Error('toLocation is required');
  }

  const params = new URLSearchParams();
  if (app_key) {
    params.append('app_key', app_key);
  }

  for (const [key, value] of Object.entries(queryParams)) {
    if (value === undefined || value === null || value === '') continue;
    params.append(key, value);
  }

  const query = params.toString();
  const url = `https://api.tfl.gov.uk/journey/journeyresults/${encodeURIComponent(
    fromLocation
  )}/to/${encodeURIComponent(toLocation)}${query ? `?${query}` : ''}`;

  try {
    const response = await fetch(url, { method: 'GET' });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (response.status === 300 && data) {
      const fromOptions = formatDisambiguation(data.fromLocationDisambiguation);
      const toOptions = formatDisambiguation(data.toLocationDisambiguation);
      
      let message = 'Multiple location matches found. Please specify which locations you meant:\n\n';
      
      if (fromOptions.length > 0) {
        message += `**From "${fromLocation}" - choose one:**\n`;
        fromOptions.forEach((option, index) => {
          message += `${index + 1}. ${option.name} (${option.placeType || 'Station'})\n`;
        });
        message += '\n';
      }
      
      if (toOptions.length > 0) {
        message += `**To "${toLocation}" - choose one:**\n`;
        toOptions.forEach((option, index) => {
          message += `${index + 1}. ${option.name} (${option.placeType || 'Station'})\n`;
        });
        message += '\n';
      }
      
      message += '**Alternative:** You can also use UK postcodes for more precise locations (e.g., "SW19 7NE" for Wimbledon area).\n\n';
      message += 'Please tell me which specific stations you want to use, or provide postcodes for your origin and destination.';
      
      return {
        message,
        requiresUserChoice: true,
        fromOptions,
        toOptions,
      };
    }

    if (!response.ok) {
      throw new Error(
        data
          ? JSON.stringify(data)
          : `Unexpected response with status ${response.status}`
      );
    }

    // Extract simplified journey data for successful responses
    if (data?.journeys) {
      return {
        journeys: data.journeys.map(extractJourneySummary),
        searchCriteria: data.searchCriteria
      };
    }

    return (
      data ?? {
        message: 'Journey planned successfully, but no response body was returned.',
      }
    );
  } catch (error) {
    console.error('Error fetching journey plan:', error);
    return {
      error: `An error occurred while fetching the journey plan: ${
        error instanceof Error ? error.message : JSON.stringify(error)
      }`,
    };
  }
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'plan_journey',
      description: 'Plan journeys between two locations using the TfL Journey Planner.',
      parameters: {
        type: 'object',
        properties: {
          fromLocation: {
            type: 'string',
            description: 'Origin location (station name, place name, or UK postcode).',
          },
          toLocation: {
            type: 'string',
            description: 'Destination location (station name, place name, or UK postcode).',
          },
          app_key: {
            type: 'string',
            description: 'Optional application key for the API.',
          },
        },
        required: ['fromLocation', 'toLocation'],
        additionalProperties: true,
      },
    },
  },
};

export { apiTool };
