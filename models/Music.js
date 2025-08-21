const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String },
  duration: { type: String },
  audioUrl: { type: String, required: true },
  coverUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Music', musicSchema);
