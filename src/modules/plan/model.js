const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        currency: {
            type: String,
            enum: ["INR", "USD", "EUR"],
            default: "INR",
        },

        billingCycle: {
            type: String,
            enum: ["monthly", "yearly", "lifetime"],
            required: true,
        },

        durationDays: {
            type: Number,
            required: true,
            min: 1,
        },
        parentPlanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plan",
            default: null,
        },

        effectiveFrom: {
            type: Date,
            default: Date.now,
        },
        replacedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plan",
            default: null,
        },
        isCurrent: {
            type: Boolean,
            default: true,
        },

        features: [
            {
                type: String,
                trim: true,
            },
        ],

        version: {
            type: Number,
            default: 1,
        },

        status: {
            type: String,
            enum: ["active", "inactive", "draft"],
            default: "draft",
        },

        visibility: {
            type: String,
            enum: ["public", "hidden"],
            default: "public",
        },

        isPopular: {
            type: Boolean,
            default: false,
        },

        displayOrder: {
            type: Number,
            default: 0,
        },

        color: {
            type: String,
            default: "#2563EB",
        },

        icon: {
            type: String,
            default: "crown",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

planSchema.index(
    { slug: 1, version: 1 },
    { unique: true }
);

module.exports = mongoose.model("Plan", planSchema);