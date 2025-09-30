/**
 * Function to get the status of a TfL line from the Transport for London Unified API.
 *
 * @param {Object} args - Arguments for the status request.
 * @param {string} args.lineId - The identifier of the line to query.
 * @param {string} [args.app_key] - Optional application key for the API.
 * @returns {Promise<Object>} - The result of the status request.
 */
const executeFunction = async ({ lineId, app_key }) => {
  if (!lineId) {
    throw new Error('lineId is required');
  }

  const params = new URLSearchParams();
  if (app_key) {
    params.append('app_key', app_key);
  }

  const query = params.toString();
  const url = `https://api.tfl.gov.uk/Line/${encodeURIComponent(lineId)}/Status${query ? `?${query}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching the status:', error);
    return {
      error: `An error occurred while fetching the status: ${error instanceof Error ? error.message : JSON.stringify(error)}`
    };
  }
};

/**
 * Tool configuration for getting the status of a TfL line from the Transport for London Unified API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_line_status',
      description: 'Get the status of a TfL line from the Transport for London Unified API.',
      parameters: {
        type: 'object',
        properties: {
          lineId: {
            type: 'string',
            description: 'The identifier of the line to query (e.g., victoria, central).'
          },
          app_key: {
            type: 'string',
            description: 'Optional application key for the API.'
          }
        },
        required: ['lineId']
      }
    }
  }
};

export { apiTool };