import mongoose, { Schema } from 'mongoose';

const patientSchema = new Schema({
  fullname: {
    type: String,
    required: true,
    trim: true,
    },
    age: {
    type: Number,
    required: true,
    min: 0,
    },
    gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
    },
    bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true,
    },
    mobile: {
    type: String,
    required: true,
    trim: true, 
    match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid mobile number'],
    },
    clinicalData: { 
    type: Map,
    of: Number,
    default: {},    
    },
    predictions: {
    type: [{
      name: String,
      probability: Number,
      confidence: Number,
      severity: String,
      contributingFactors: [String],
      parameterEvidence: [String]
    }],
    default: []
    },
    createdAt: {
    type: Date, 
    default: Date.now,
    },
    updatedAt: {
    type: Date, 
    default: Date.now,
    },
});

// Indexes for optimized queries
patientSchema.index({ fullname: 1, mobile: 1 }); // Compound index for patient lookup
patientSchema.index({ createdAt: -1 }); // Index for sorting by creation date
patientSchema.index({ mobile: 1 }); // Index for mobile number searches
patientSchema.index({ updatedAt: -1 }); // Index for recent updates

patientSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;