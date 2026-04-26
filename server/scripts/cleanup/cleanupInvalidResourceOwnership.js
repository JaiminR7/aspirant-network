require('dotenv').config();
const mongoose = require('mongoose');
const Resource = require('../../models/Resource');
const User = require('../../models/User');

const parseDays = () => {
  const raw = process.env.RESOURCE_CLEANUP_MAX_AGE_DAYS;
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
};

const isTestLike = (resource) => {
  const values = [
    resource?.title,
    resource?.description,
    ...(Array.isArray(resource?.userTags) ? resource.userTags : []),
    ...(Array.isArray(resource?.systemTags) ? resource.systemTags : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return /(faker|dummy|test|sample|lorem ipsum|mock)/i.test(values);
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const maxAgeDays = parseDays();
  const cutoffDate = maxAgeDays ? new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000) : null;

  const resources = await Resource.find({}, '_id user createdBy title description userTags systemTags createdAt').lean();
  const users = await User.find({}, '_id').lean();
  const userIdSet = new Set(users.map((u) => String(u._id)));

  const invalidIds = [];
  const optionalTestIds = [];

  for (const resource of resources) {
    const owner = resource.user || resource.createdBy;
    const ownerAsString = owner ? String(owner) : null;
    const invalidOwner = !ownerAsString || !mongoose.Types.ObjectId.isValid(ownerAsString) || !userIdSet.has(ownerAsString);

    if (invalidOwner) {
      invalidIds.push(resource._id);
      continue;
    }

    if (cutoffDate && resource.createdAt && new Date(resource.createdAt) < cutoffDate && isTestLike(resource)) {
      optionalTestIds.push(resource._id);
    }
  }

  let deletedInvalid = 0;
  let deletedOptional = 0;

  if (invalidIds.length > 0) {
    const res = await Resource.deleteMany({ _id: { $in: invalidIds } });
    deletedInvalid = res.deletedCount || 0;
  }

  if (optionalTestIds.length > 0) {
    const res = await Resource.deleteMany({ _id: { $in: optionalTestIds } });
    deletedOptional = res.deletedCount || 0;
  }

  console.log('Cleanup complete');
  console.log(`Invalid-owner resources removed: ${deletedInvalid}`);
  console.log(`Optional old test-like resources removed: ${deletedOptional}`);
  console.log(`Scanned resources: ${resources.length}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
};

run().catch(async (error) => {
  console.error('Cleanup failed:', error);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore disconnect errors
  }
  process.exit(1);
});
