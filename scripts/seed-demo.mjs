import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const cleaned = line.trim();
    if (!cleaned || cleaned.startsWith("#")) continue;
    const idx = cleaned.indexOf("=");
    if (idx < 0) continue;
    const key = cleaned.slice(0, idx).trim();
    const value = cleaned.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function nowWithOffset(min) {
  return new Date(Date.now() + min * 60 * 1000);
}

async function main() {
  loadEnvLocal();
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "rescue-bird";
  if (!uri) throw new Error("Missing MONGODB_URI");

  await mongoose.connect(uri, { dbName });
  const db = mongoose.connection.db;
  const users = db.collection("users");
  const teams = db.collection("rescueteams");
  const alerts = db.collection("alerts");
  const messages = db.collection("messages");

  const credentials = [
    { name: "System Admin", email: "admin@rescuebird.local", role: "admin", password: "Admin@123" },
    { name: "Dhaka Central Lead", email: "lead.central@rescuebird.local", role: "rescue_team", password: "Team@123" },
    { name: "North Zone Lead", email: "lead.north@rescuebird.local", role: "rescue_team", password: "Team@123" },
    { name: "East Zone Lead", email: "lead.east@rescuebird.local", role: "rescue_team", password: "Team@123" },
    { name: "Central Staff 1", email: "staff.central1@rescuebird.local", role: "team_staff", password: "Staff@123" },
    { name: "Central Staff 2", email: "staff.central2@rescuebird.local", role: "team_staff", password: "Staff@123" },
    { name: "North Staff 1", email: "staff.north1@rescuebird.local", role: "team_staff", password: "Staff@123" },
    { name: "East Staff 1", email: "staff.east1@rescuebird.local", role: "team_staff", password: "Staff@123" },
    { name: "Citizen One", email: "user.one@rescuebird.local", role: "user", password: "User@123" },
    { name: "Citizen Two", email: "user.two@rescuebird.local", role: "user", password: "User@123" },
    { name: "Citizen Three", email: "user.three@rescuebird.local", role: "user", password: "User@123" }
  ];

  const existing = await users.find({ email: { $in: credentials.map((c) => c.email) } }).toArray();
  const existingByEmail = new Map(existing.map((u) => [u.email, u]));

  const userDocs = {};
  for (const cred of credentials) {
    const passwordHash = await bcrypt.hash(cred.password, 10);
    const locationByRole =
      cred.role === "admin"
        ? { lat: 23.7855, lng: 90.4043 }
        : cred.role === "rescue_team"
          ? { lat: 23.8103, lng: 90.4125 }
          : cred.role === "team_staff"
            ? { lat: 23.7955, lng: 90.4102 }
            : { lat: 23.7809, lng: 90.4021 };
    const base = {
      name: cred.name,
      email: cred.email.toLowerCase(),
      phone: "+8801700000000",
      passwordHash,
      role: cred.role,
      verifiedAt: new Date(),
      currentLocation: locationByRole,
      lastLocationAt: new Date()
    };

    if (existingByEmail.has(cred.email)) {
      await users.updateOne({ _id: existingByEmail.get(cred.email)._id }, { $set: base });
      userDocs[cred.email] = { ...existingByEmail.get(cred.email), ...base };
    } else {
      const insertRes = await users.insertOne({ ...base, createdAt: new Date(), updatedAt: new Date(), teamId: null });
      userDocs[cred.email] = { _id: insertRes.insertedId, ...base };
    }
  }

  const teamSeeds = [
    {
      name: "Dhaka Central Rescue Squad",
      description: "City center multi-hazard response team",
      phone: "+8801901111111",
      ownerEmail: "lead.central@rescuebird.local",
      areaNames: ["Dhanmondi", "New Market", "Shahbag", "Ramna"],
      location: { lat: 23.7286, lng: 90.3854 },
      coverageRadiusKm: 7
    },
    {
      name: "Dhaka North Rescue Squad",
      description: "Northern sector rapid rescue squad",
      phone: "+8801902222222",
      ownerEmail: "lead.north@rescuebird.local",
      areaNames: ["Uttara", "Airport", "Khilkhet", "Tongi Border"],
      location: { lat: 23.8759, lng: 90.3795 },
      coverageRadiusKm: 10
    },
    {
      name: "Dhaka East River & Relief Squad",
      description: "Flood and east corridor relief response",
      phone: "+8801903333333",
      ownerEmail: "lead.east@rescuebird.local",
      areaNames: ["Badda", "Rampura", "Demra", "Khilgaon"],
      location: { lat: 23.7806, lng: 90.4275 },
      coverageRadiusKm: 8
    }
  ];

  const teamDocs = {};
  for (const teamSeed of teamSeeds) {
    const ownerId = userDocs[teamSeed.ownerEmail]._id;
    const existingTeam = await teams.findOne({ name: teamSeed.name });
    const baseTeam = {
      name: teamSeed.name,
      description: teamSeed.description,
      phone: teamSeed.phone,
      ownerUserId: ownerId,
      areaNames: teamSeed.areaNames,
      location: teamSeed.location,
      coverageRadiusKm: teamSeed.coverageRadiusKm,
      updatedAt: new Date()
    };
    if (existingTeam) {
      await teams.updateOne({ _id: existingTeam._id }, { $set: baseTeam });
      teamDocs[teamSeed.name] = { ...existingTeam, ...baseTeam };
    } else {
      const insertRes = await teams.insertOne({ ...baseTeam, createdAt: new Date() });
      teamDocs[teamSeed.name] = { _id: insertRes.insertedId, ...baseTeam };
    }
  }

  const staffTeamMap = {
    "staff.central1@rescuebird.local": "Dhaka Central Rescue Squad",
    "staff.central2@rescuebird.local": "Dhaka Central Rescue Squad",
    "staff.north1@rescuebird.local": "Dhaka North Rescue Squad",
    "staff.east1@rescuebird.local": "Dhaka East River & Relief Squad",
    "lead.central@rescuebird.local": "Dhaka Central Rescue Squad",
    "lead.north@rescuebird.local": "Dhaka North Rescue Squad",
    "lead.east@rescuebird.local": "Dhaka East River & Relief Squad"
  };

  for (const [email, teamName] of Object.entries(staffTeamMap)) {
    const teamId = teamDocs[teamName]._id;
    await users.updateOne({ email }, { $set: { teamId, updatedAt: new Date() } });
  }

  await users.updateOne({ email: "user.one@rescuebird.local" }, { $set: { currentLocation: { lat: 23.742, lng: 90.386 } } });
  await users.updateOne({ email: "user.two@rescuebird.local" }, { $set: { currentLocation: { lat: 23.866, lng: 90.391 } } });
  await users.updateOne({ email: "user.three@rescuebird.local" }, { $set: { currentLocation: { lat: 23.789, lng: 90.432 } } });

  const centralTeamId = teamDocs["Dhaka Central Rescue Squad"]._id;
  const northTeamId = teamDocs["Dhaka North Rescue Squad"]._id;
  const eastTeamId = teamDocs["Dhaka East River & Relief Squad"]._id;

  const userOne = await users.findOne({ email: "user.one@rescuebird.local" });
  const userTwo = await users.findOne({ email: "user.two@rescuebird.local" });
  const userThree = await users.findOne({ email: "user.three@rescuebird.local" });
  const centralStaff = await users.findOne({ email: "staff.central1@rescuebird.local" });

  await alerts.deleteMany({ note: { $regex: "^DEMO:" } });
  await alerts.insertMany([
    {
      userId: userOne._id,
      assignedTeamId: centralTeamId,
      area: "Dhanmondi",
      location: { lat: 23.7424, lng: 90.3826 },
      note: "DEMO: Building fire smoke reported near main road.",
      voiceNoteUrl: "",
      status: "open",
      acceptedByUserId: null,
      createdAt: nowWithOffset(-40),
      updatedAt: nowWithOffset(-40)
    },
    {
      userId: userTwo._id,
      assignedTeamId: northTeamId,
      area: "Uttara Sector 11",
      location: { lat: 23.8735, lng: 90.3982 },
      note: "DEMO: Road accident with multiple injured persons.",
      voiceNoteUrl: "",
      status: "accepted",
      acceptedByUserId: centralStaff?._id || null,
      createdAt: nowWithOffset(-60),
      updatedAt: nowWithOffset(-30)
    },
    {
      userId: userThree._id,
      assignedTeamId: eastTeamId,
      area: "Rampura",
      location: { lat: 23.7638, lng: 90.4222 },
      note: "DEMO: Flood water rising and urgent evacuation needed.",
      voiceNoteUrl: "",
      status: "resolved",
      acceptedByUserId: centralStaff?._id || null,
      createdAt: nowWithOffset(-180),
      updatedAt: nowWithOffset(-110)
    }
  ]);

  await messages.deleteMany({ body: { $regex: "^DEMO:" } });
  await messages.insertMany([
    {
      teamId: centralTeamId,
      senderId: userOne._id,
      receiverId: null,
      body: "DEMO: Fire is getting bigger, please hurry.",
      senderNameSnapshot: "Citizen One",
      senderRoleSnapshot: "user",
      createdAt: nowWithOffset(-35),
      updatedAt: nowWithOffset(-35)
    },
    {
      teamId: centralTeamId,
      senderId: centralStaff?._id || userOne._id,
      receiverId: userOne._id,
      body: "DEMO: Team dispatched, keep safe distance from the building.",
      senderNameSnapshot: "Central Staff 1",
      senderRoleSnapshot: "team_staff",
      createdAt: nowWithOffset(-33),
      updatedAt: nowWithOffset(-33)
    }
  ]);

  console.log("Demo data seeded successfully.\n");
  console.log("Login credentials:");
  credentials.forEach((cred) => {
    console.log(`- ${cred.role.padEnd(11)} | ${cred.email.padEnd(32)} | ${cred.password}`);
  });

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
