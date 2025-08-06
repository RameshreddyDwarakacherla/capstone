// Middleware to parse JSON fields from FormData
const parseFormDataJSON = (req, res, next) => {
  try {
    // Parse location field if it exists and is a string
    if (req.body.location && typeof req.body.location === 'string') {
      try {
        req.body.location = JSON.parse(req.body.location);
      } catch (error) {
        console.error('Error parsing location JSON:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid location format. Must be valid JSON.'
        });
      }
    }

    // Parse address field if it exists and is a string
    if (req.body.address && typeof req.body.address === 'string') {
      try {
        req.body.address = JSON.parse(req.body.address);
      } catch (error) {
        console.error('Error parsing address JSON:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid address format. Must be valid JSON.'
        });
      }
    }

    // Parse any other JSON fields that might be sent as strings
    const jsonFields = ['metadata', 'tags', 'customData'];
    jsonFields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (error) {
          console.error(`Error parsing ${field} JSON:`, error);
          // Non-critical fields, just log the error
        }
      }
    });

    next();
  } catch (error) {
    console.error('Error in parseFormDataJSON middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing form data'
    });
  }
};

module.exports = {
  parseFormDataJSON
};