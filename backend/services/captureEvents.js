const EventEmitter = require('events');
class CaptureEmitter extends EventEmitter {}
// Singleton para gerenciar eventos de captura globalmente
module.exports = new CaptureEmitter();