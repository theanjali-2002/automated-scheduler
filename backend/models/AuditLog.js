const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actionType: { type: String, required: true },    
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  affectedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  details: { type: Object },                          
  timestamp: { type: Date, default: Date.now }
});

// auto-delete logs after 180 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 }); 

module.exports = mongoose.model('AuditLog', auditLogSchema);
