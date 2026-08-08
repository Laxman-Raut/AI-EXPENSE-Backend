const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./src/config/db");
const Group = require("./src/modules/groups/model");
const User = require("./src/modules/auth/model");

async function inspectGroups() {
  await connectDB();
  
  // Find all groups in the database
  const groups = await Group.find().lean();
  console.log(`Total groups in DB: ${groups.length}`);

  for (const g of groups) {
    console.log(`\n--- Group: "${g.name}" (${g._id}) ---`);
    console.log(`CreatedBy: ${g.createdBy} (Type: ${typeof g.createdBy})`);
    console.log(`IsActive: ${g.isActive}`);
    console.log(`Members count: ${g.members ? g.members.length : 0}`);
    
    if (g.members) {
      g.members.forEach((m, idx) => {
        console.log(`  Member ${idx + 1}: ${m} (Type: ${typeof m})`);
      });
    }
  }

  await mongoose.disconnect();
}

inspectGroups().catch(err => console.error(err));
