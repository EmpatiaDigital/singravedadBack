const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Imagen = require("../models/Imagen");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// cloudinary.config({
//   //   cloud_name: process.env.CLOUD_NAME,
//   cloud_name: "ddvnk4ki5",
//   //   api_key: process.env.CLOUD_KEY,
//   api_key: "143165765674465",
//   //   api_secret: process.env.CLOUD_SECRET
//   api_secret: "V1OWGNZRqc5L0ELstiKH7MKUABo",
//   timeout: 120000,
// });


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});

// Subir imagen
router.post("/upload", upload.single("imagen"), async (req, res) => {
  try {
    const resultado = await cloudinary.uploader.upload_stream(
      { folder: "proyecto" },
      async (error, result) => {
        if (error) return res.status(500).json({ mensaje: "Error al subir imagen" });

        const nuevaImagen = new Imagen({ url: result.secure_url, nombre: req.file.originalname });
        await nuevaImagen.save();

        res.json({ url: result.secure_url });
      }
    );

    resultado.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

// Consultar imágenes
router.get("/imagenes", async (req, res) => {
  const imagenes = await Imagen.find();
  res.json(imagenes);
});

module.exports = router;


