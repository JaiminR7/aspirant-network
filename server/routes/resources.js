const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateExamContext } = require('../middleware/examContext');
const { uploadResource } = require('../middleware/upload');
const { createResource, getAllResources, getResourceById, updateResource, deleteResource, incrementDownload, getTopRatedResources } = require('../controllers/resourceController');

router.post('/upload', auth, uploadResource.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, data: { url: req.file.path, publicId: req.file.filename } });
});
router.get('/top-rated', auth, validateExamContext, getTopRatedResources);
router.post('/', auth, validateExamContext, createResource);
router.get('/', auth, validateExamContext, getAllResources);
router.get('/:id', auth, validateExamContext, getResourceById);
router.patch('/:id', auth, validateExamContext, updateResource);
router.delete('/:id', auth, validateExamContext, deleteResource);
router.post('/:id/download', auth, validateExamContext, incrementDownload);

module.exports = router;
