// models/Restaurant.js

import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
    restaurantId: {
        type: String,
        unique: true,
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true
    },

    location: {
        type: String,
        default: ""
    },

    description: {
        type: String,
        default: ""
    },
    phone: {
        type: String,
        default: ""
    },
    logo: {
        type: String,
        default: "",
    },
    logoPublicId: {
        type: String,
        default: "",
    },
    address: {
        type: String,
        default: "",
    },
    city: {
        type: String,
        default: "",
    },
    state: {
        type: String,
        default: "",
    },
    postalCode: {
        type: String,
        default: "",
    },
    gstNumber: {
        type: String,
        default: "",
    },
    fssaiNumber: {
        type: String,
        default: "",
    },
    timings: {
        type: String,
        default: ""
    },

    slogan: {
        type: String,
        default: ""
    },

    isActive: {
        type: Boolean,
        default: true
    },

    isEmailVerified: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

export default mongoose.model("Restaurant", restaurantSchema, "restaurant");