import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

fs.mkdirSync('uploads', { recursive: true });

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

// Volontairement restreint à ce que lisent tous les navigateurs sans extension :
// .mov passe sur Safari mais pas sur Chrome, on l'écarte plutôt que de livrer
// une vidéo qui ne se lirait qu'à moitié.
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm']);

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 30 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

function makeUploader({ kind, extensions, maxBytes, label }) {
  return multer({
    storage,
    limits: { fileSize: maxBytes },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!file.mimetype.startsWith(`${kind}/`) || !extensions.has(ext)) {
        cb(new Error(`${label} : formats acceptés ${[...extensions].join(', ')}`));
      } else {
        cb(null, true);
      }
    },
  });
}

const uploadImage = makeUploader({
  kind: 'image', extensions: IMAGE_EXTENSIONS, maxBytes: IMAGE_MAX_BYTES,
  label: 'Image refusée',
});

const uploadVideo = makeUploader({
  kind: 'video', extensions: VIDEO_EXTENSIONS, maxBytes: VIDEO_MAX_BYTES,
  label: 'Vidéo refusée',
});

/**
 * Chaque route porte sa propre limite de taille et son propre message. Multer
 * est appelé à la main plutôt qu'en middleware : un gestionnaire d'erreurs
 * partagé aurait annoncé la limite des images sur la route vidéo.
 */
function uploadRoute(uploader, field, maxBytes) {
  return (req, res) => {
    uploader.single(field)(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        const mo = Math.round(maxBytes / (1024 * 1024));
        return res.status(413).json({ error: `Fichier trop lourd : ${mo} Mo maximum` });
      }
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
      res.json({ url: `/uploads/${req.file.filename}` });
    });
  };
}

router.post('/', requireAuth, uploadRoute(uploadImage, 'image', IMAGE_MAX_BYTES));
router.post('/video', requireAuth, uploadRoute(uploadVideo, 'video', VIDEO_MAX_BYTES));

export default router;
