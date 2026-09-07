const User = require("./model");

const searchUsers = async (query, currentUserId) => {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return User.find({
    _id: { $ne: currentUserId },
    $or: [
      {
        fullName: {
          $regex: escaped,
          $options: "i",
        },
      },
      {
        username: {
          $regex: escaped,
          $options: "i",
        },
      },
      {
        email: {
          $regex: escaped,
          $options: "i",
        },
      },
    ],
  })
    .select("_id fullName username email avatar")
    .limit(20);
};

module.exports = {
  // existing exports...
  searchUsers,
};