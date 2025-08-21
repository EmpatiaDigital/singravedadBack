const mongoose = require("mongoose");

const imagenSchema = new mongoose.Schema({
  url: { type: String, required: true },
  nombre: { type: String },
  fechaSubida: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Imagen", imagenSchema);
