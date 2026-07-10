const { z } = require("zod");

// Date string schema (YYYY-MM-DD)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD");

// Year string schema (YYYY)
const yearSchema = z.string().regex(/^\d{4}$/, "Invalid year format. Use YYYY");

// Month string schema (MM or M, values 1-12)
const monthSchema = z.string().regex(/^(0?[1-9]|1[0-2])$/, "Invalid month. Must be between 01 and 12");

// Middleware to validate GET /api/calendar/date/:date and GET /api/calendar/summary/:date
const validateDateParam = (req, res, next) => {
  try {
    dateSchema.parse(req.params.date);
    
    // Check if it's a valid calendar date (e.g. not 2026-02-31)
    const dateObj = new Date(req.params.date);
    if (isNaN(dateObj.getTime())) {
      throw new Error("Invalid calendar date");
    }

    next();
  } catch (error) {
    const errorMsg = error.issues ? error.issues.map(i => i.message).join(", ") : error.message;
    return res.status(400).json({
      success: false,
      message: errorMsg,
    });
  }
};

// Middleware to validate GET /api/calendar/month/:year/:month, /stats/:year/:month, /heatmap/:year/:month
const validateMonthYearParams = (req, res, next) => {
  try {
    yearSchema.parse(req.params.year);
    monthSchema.parse(req.params.month);
    next();
  } catch (error) {
    const errorMsg = error.issues ? error.issues.map(i => i.message).join(", ") : error.message;
    return res.status(400).json({
      success: false,
      message: errorMsg,
    });
  }
};

// Middleware to validate GET /api/calendar/timeline?startDate=...&endDate=...
const validateTimelineQuery = (req, res, next) => {
  try {
    if (!req.query.startDate || !req.query.endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameters: startDate and endDate",
      });
    }

    dateSchema.parse(req.query.startDate);
    dateSchema.parse(req.query.endDate);

    const start = new Date(req.query.startDate);
    const end = new Date(req.query.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid calendar dates");
    }

    if (start > end) {
      throw new Error("startDate must be before or equal to endDate");
    }

    next();
  } catch (error) {
    const errorMsg = error.issues ? error.issues.map(i => i.message).join(", ") : error.message;
    return res.status(400).json({
      success: false,
      message: errorMsg,
    });
  }
};

module.exports = {
  validateDateParam,
  validateMonthYearParams,
  validateTimelineQuery,
};
