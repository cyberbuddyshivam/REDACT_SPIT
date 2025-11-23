import mongoose,{ Schema } from "mongoose";

const parameterSchema = new Schema({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'Patient',
        default: null,
    },
    parameters: {
        type: Map,
        of: Number,
        required: true,
        default: {},
    },
    timestamp: {
        type: Date,
        default: Date.now,
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
parameterSchema.index({ patientId: 1 });
parameterSchema.index({ timestamp: -1 });
parameterSchema.index({ createdAt: -1 });

parameterSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

const Parameter = mongoose.model("Parameter", parameterSchema);

export default Parameter;