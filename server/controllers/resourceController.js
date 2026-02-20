const Resource = require('../models/Resource');

const createResource = async (req, res) => {
  try {
    console.log("📥 Received request body:", JSON.stringify(req.body, null, 2));
    console.log("📋 systemTags:", req.body.systemTags, "Type:", typeof req.body.systemTags, "isArray:", Array.isArray(req.body.systemTags));
    
    const { title, description, type, subject, subjectName, topic, topicName, url, publicId, externalLink, systemTags, userTags } = req.body;
    
    // Build content object based on type
    const content = {};
    if (url) content.url = url;
    if (publicId) content.publicId = publicId;
    if (externalLink) content.externalLink = externalLink;
    
    const resource = await Resource.create({
      title, 
      description, 
      type, 
      subject, 
      subjectName,
      topic, 
      topicName,
      content,
      systemTags: systemTags || [],
      userTags: userTags || [],
      exam: req.examContext, 
      createdBy: req.userId
    });
    await resource.populate('subject topic createdBy');
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllResources = async (req, res) => {
  try {
    console.log('📋 Fetching resources with query params:', req.query);
    const { subject, topic, type, createdBy, sortBy = 'recent' } = req.query;
    const query = { exam: req.examContext };
    if (subject && subject !== 'all') query.subject = subject;
    if (topic && topic !== 'all') query.topic = topic;
    if (type && type !== 'all') query.type = type;
    if (createdBy) query.createdBy = createdBy;

    console.log('🔍 MongoDB query:', query);
    const sort = sortBy === 'popular' ? { 'rating.average': -1, downloadCount: -1, viewCount: -1 } : { createdAt: -1 };
    const resources = await Resource.find(query).populate('subject topic createdBy').sort(sort);
    console.log('✅ Found resources:', resources.length);
    res.json({ success: true, data: resources });
  } catch (error) {
    console.error('❌ Error in getAllResources:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findOneAndUpdate(
      { _id: req.params.id, exam: req.examContext },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('subject topic createdBy');
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateResource = async (req, res) => {
  try {
    const { title, description, systemTags, userTags } = req.body;
    const resource = await Resource.findOneAndUpdate(
      { _id: req.params.id, exam: req.examContext, createdBy: req.userId },
      { title, description, systemTags, userTags },
      { new: true, runValidators: true }
    ).populate('subject topic createdBy');
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found or unauthorized' });
    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findOneAndDelete({ _id: req.params.id, exam: req.examContext, createdBy: req.userId });
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found or unauthorized' });
    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const incrementDownload = async (req, res) => {
  try {
    const resource = await Resource.findOneAndUpdate(
      { _id: req.params.id, exam: req.examContext },
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTopRatedResources = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const resources = await Resource.find({ exam: req.examContext })
      .populate('subject topic createdBy')
      .sort({ 'rating.average': -1, viewCount: -1, downloadCount: -1 })
      .limit(limit);
    res.json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createResource, getAllResources, getResourceById, updateResource, deleteResource, incrementDownload, getTopRatedResources };
