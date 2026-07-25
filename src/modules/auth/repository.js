const User = require("./model");

const searchUsers = async (query, currentUserId) => {
  return User.find({
    _id: { $ne: currentUserId },
    $or: [
      {
        fullName: {
          $regex: query,
          $options: "i",
        },
      },
      {
        username: {
          $regex: query,
          $options: "i",
        },
      },
      {
        email: {
          $regex: query,
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