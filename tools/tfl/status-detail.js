/**
 * Function to get the status and details of a TfL line from the Transport for London Unified API.
 *
 * @param {Object} args - Arguments for the API request.
 * @param {string} args.lineId - The identifier of the line to query.
 * @param {string} [args.app_key] - Optional application key for authentication.
 * @returns {Promise<Object>} - The response from the API containing the status and details.
 */
const executeFunction = async ({ lineId, app_key }) => {
  if (!lineId) {
    throw new Error('lineId is required');
  }

  const params = new URLSearchParams([['detail', 'true']]);
  if (app_key) {
    params.append('app_key', app_key);
  }

  const url = `https://api.tfl.gov.uk/Line/${encodeURIComponent(lineId)}/Status?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching status and details:', error);
    return {
      error: `An error occurred while fetching status and details: ${error instanceof Error ? error.message : JSON.stringify(error)}`
    };
  }
};

/**
 * Tool configuration for getting the status and details of a TfL line from the Transport for London Unified API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_line_status_detail',
      description: 'Get the status and details of a TfL line.',
      parameters: {
        type: 'object',
        properties: {
          lineId: {
            type: 'string',
            description: 'The identifier of the line to query (e.g., victoria, central).'
          },
          app_key: {
            type: 'string',
            description: 'Optional application key for authentication.'
          }
        },
        required: ['lineId']
      }
    }
  }
};

export { apiTool };