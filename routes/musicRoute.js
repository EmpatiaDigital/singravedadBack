const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const Music = require("../models/Music");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB, ajusta según necesidad
});

cloudinary.config({
  //   cloud_name: process.env.CLOUD_NAME,
  cloud_name: "ddvnk4ki5",
  //   api_key: process.env.CLOUD_KEY,
  api_key: "143165765674465",
  //   api_secret: process.env.CLOUD_SECRET
  api_secret: "V1OWGNZRqc5L0ELstiKH7MKUABo",
  timeout: 120000,
});
// ---------- CREATE: Subir nueva canción ----------
router.post("/", upload.fields([{ name: "audio" }, { name: "cover" }]), async (req, res) => {
  try {
    const { title, artist, album, duration } = req.body;
    if (!req.files.audio) return res.status(400).json({ message: "Audio es obligatorio" });

    // Subir audio a Cloudinary
    const uploadAudio = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "music_app/audios", resource_type: "video" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      streamifier.createReadStream(req.files.audio[0].buffer).pipe(stream);
    });

    // Subir cover (opcional)
    let coverUrl = null;
    if (req.files.cover) {
      coverUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "music_app/covers" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(req.files.cover[0].buffer).pipe(stream);
      });
    }

    const audioUrl = await uploadAudio;

    const newSong = new Music({ title, artist, album, duration, audioUrl, coverUrl });
    await newSong.save(); // <--- Aquí debería guardarlo en MongoDB

    res.json(newSong);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al subir canción" });
  }
});


// ---------- READ: Obtener todas las canciones ----------
router.get("/", async (req, res) => {
  try {
    const songs = await Music.find();
    res.json(songs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener canciones" });
  }
});

// ---------- READ: Obtener canción por ID ----------
router.get("/:id", async (req, res) => {
  try {
    const song = await Music.findById(req.params.id);
    if (!song)
      return res.status(404).json({ message: "Canción no encontrada" });
    res.json(song);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener canción" });
  }
});

// ---------- UPDATE: Editar canción ----------
router.put(
  "/:id",
  upload.fields([{ name: "audio" }, { name: "cover" }]),
  async (req, res) => {
    try {
      const { title, artist, album, duration } = req.body;
      const song = await Music.findById(req.params.id);
      if (!song)
        return res.status(404).json({ message: "Canción no encontrada" });

      // Actualizar audio si hay uno nuevo
      if (req.files.audio) {
        const audioUrl = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "music_app/audios", resource_type: "video" },
            (error, result) =>
              error ? reject(error) : resolve(result.secure_url)
          );
          streamifier.createReadStream(req.files.audio[0].buffer).pipe(stream);
        });
        song.audioUrl = audioUrl;
      }

      // Actualizar cover si hay uno nuevo
      if (req.files.cover) {
        const coverUrl = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "music_app/covers" },
            (error, result) =>
              error ? reject(error) : resolve(result.secure_url)
          );
          streamifier.createReadStream(req.files.cover[0].buffer).pipe(stream);
        });
        song.coverUrl = coverUrl;
      }

      // Actualizar datos
      song.title = title || song.title;
      song.artist = artist || song.artist;
      song.album = album || song.album;
      song.duration = duration || song.duration;

      await song.save();
      res.json(song);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al actualizar canción" });
    }
  }
);

// ---------- DELETE: Eliminar canción ----------
router.delete("/:id", async (req, res) => {
  try {
    const song = await Music.findByIdAndDelete(req.params.id);
    if (!song)
      return res.status(404).json({ message: "Canción no encontrada" });
    res.json({ message: "Canción eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar canción" });
  }
});

module.exports = router;
