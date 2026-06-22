require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Sequelize, Op } = require("sequelize");

const app = express();
const PORT = process.env.PORT || 3000;

/** ngrok / reverse proxy-ийн ард зөв протокол, IP ашиглах */
app.set("trust proxy", 1);

/** MySQL холболт баталгаажсан — нэвтрэх/бүртгэл sync-ээс өмнө ажиллана */
let dbAuthOk = false;
/** Sync + seed дууссан — бүх API */
let dbReady = false;

// Database Configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || "hospital",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false, // Set to console.log to see SQL queries
  }
);

// Import Models
const UserModel = require("./models/User");
const EmergencyCallModel = require("./models/EmergencyCall");
const HospitalModel = require("./models/Hospital");
const AmbulanceModel = require("./models/Ambulance");
const CallAssignmentModel = require("./models/CallAssignment");
const NotificationModel = require("./models/Notification");

const User = UserModel(sequelize);
const EmergencyCall = EmergencyCallModel(sequelize);
const Hospital = HospitalModel(sequelize);
const Ambulance = AmbulanceModel(sequelize);
const CallAssignment = CallAssignmentModel(sequelize);
const Notification = NotificationModel(sequelize);

User.hasMany(EmergencyCall, { foreignKey: "user_id" });
EmergencyCall.belongsTo(User, { foreignKey: "user_id", as: "user" });
EmergencyCall.belongsTo(Hospital, {
  foreignKey: "nearest_hospital_id",
  as: "NearestHospital",
});
Hospital.hasMany(EmergencyCall, {
  foreignKey: "nearest_hospital_id",
  as: "nearestEmergencyCalls",
});
Hospital.hasMany(Ambulance, { foreignKey: "hospital_id" });
Ambulance.belongsTo(Hospital, { foreignKey: "hospital_id" });
EmergencyCall.hasMany(CallAssignment, { foreignKey: "call_id" });
CallAssignment.belongsTo(EmergencyCall, { foreignKey: "call_id" });
Ambulance.hasMany(CallAssignment, { foreignKey: "ambulance_id" });
CallAssignment.belongsTo(Ambulance, { foreignKey: "ambulance_id" });

// Middleware
app.use(cors());
app.use(express.json());

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

const HOSPITAL_SEEDS = [
  { name: "Улсын Нэгдүгээр Төв Эмнэлэг", latitude: 47.9185, longitude: 106.9176, phone: "11322111", address: "Сүхбаатар дүүрэг", available_units: 2 },
  { name: "Гэмтэл Согог Судлалын Үндэсний Төв", latitude: 47.9232, longitude: 106.9769, phone: "11454567", address: "Баянзүрх дүүрэг", available_units: 2 },
  { name: "Эх Хүүхдийн Эрүүл Мэндийн Үндэсний Төв", latitude: 47.8918, longitude: 106.9059, phone: "11362111", address: "Баянгол дүүрэг", available_units: 1 },
  { name: "Хөдөө Аж Ахуйн Их Сургуулийн Эмнэлэг", latitude: 47.9055, longitude: 106.9288, phone: "11330101", address: "Сүхбаатар дүүрэг", available_units: 1 },
  { name: "Онцлог Сургалтын Эмнэлэг", latitude: 47.9128, longitude: 106.9512, phone: "11350102", address: "Баянзүрх дүүрэг", available_units: 1 },
  { name: "Улсын Хоёрдугаар Төв Эмнэлэг", latitude: 47.8862, longitude: 106.9421, phone: "11322112", address: "Хан-Уул дүүрэг", available_units: 2 },
  { name: "Улсын Гуравдугаар Төв Эмнэлэг", latitude: 47.9341, longitude: 106.9012, phone: "11322113", address: "Баянгол дүүрэг", available_units: 1 },
  { name: "Сентрал Эмнэлэг", latitude: 47.9201, longitude: 106.8895, phone: "11338888", address: "Сүхбаатар дүүрэг", available_units: 2 },
  { name: "Интермед Эмнэлэг", latitude: 47.8976, longitude: 106.9688, phone: "11335555", address: "Баянзүрх дүүрэг", available_units: 1 },
  { name: "Мөнгөн Гүүр Эмнэлэг", latitude: 47.9288, longitude: 106.9345, phone: "11336666", address: "Баянзүрх дүүрэг", available_units: 1 },
  { name: "Шүдний Эмнэлэг", latitude: 47.9098, longitude: 106.9123, phone: "11337777", address: "Сүхбаатар дүүрэг", available_units: 1 },
  { name: "Нийслэлийн Оношлогоо Засварын Төв", latitude: 47.9155, longitude: 106.9655, phone: "11339999", address: "Баянзүрх дүүрэг", available_units: 1 },
  { name: "Алтан Булгийн Эмнэлэг", latitude: 47.8825, longitude: 106.9155, phone: "11334444", address: "Хан-Уул дүүрэг", available_units: 1 },
  { name: "Хүн Амын Эрүүл Мэндийн Төв", latitude: 47.9265, longitude: 106.9588, phone: "11332222", address: "Баянзүрх дүүрэг", available_units: 1 },
  { name: "Яаралтай Тусламжийн Үндэсний Төв", latitude: 47.9012, longitude: 106.9365, phone: "11331111", address: "Сүхбаатар дүүрэг", available_units: 2 },
];

const DRIVER_NAMES = [
  "Б.Эрдэнэ", "С.Тэмүүлэн", "Д.Отгон", "Г.Болор", "Н.Саран",
  "О.Мөнх", "П.Анх", "Р.Бат", "Т.Оюун", "У.Наран",
  "Х.Төгс", "Ц.Амар", "Э.Баяр", "Ж.Сүх", "З.Хишиг",
];

// Disease type to triage mapping
const DISEASE_TRIAGE_MAP = {
  // Light calls
  "Толгой өвдөх": "light",
  "Хэвүүлэх": "light",
  "Ходоо сүнслэх": "light",
  "Халуун": "light",
  "Хүнд амьсгал": "light",
  "Гадуурын гэмтэл": "light",
  "Илүү халдвар": "light",
  "Сором": "light",
  "Инфекц": "light",
  // Heavy calls
  "Ухаан алдах": "heavy",
  "Осол": "heavy",
  "Амьсгал боогдох": "heavy",
  "Цус алдах": "heavy",
  "Сэтгэл зүрхний өвдөлт": "heavy",
  "Ноцтой гэмтэл": "heavy",
  "Stroke": "heavy",
  "Heart Attack": "heavy",
  "Severe Trauma": "heavy",
  "Fire": "heavy",
};

function mapDiseaseToTriage(diseaseType) {
  if (!diseaseType) return "light";
  const mapped = DISEASE_TRIAGE_MAP[diseaseType];
  return mapped || "light";
}

function mapTriageToPriority(triage) {
  return triage === "heavy" ? "Critical" : "Low";
}

async function processQueuedLightCalls() {
  try {
    const availableAmbulances = await Ambulance.findAll({
      where: { status: "Available" },
      include: [Hospital],
    });

    if (availableAmbulances.length === 0) return;

    const queuedCall = await EmergencyCall.findOne({
      where: {
        triage: "light",
        queue_position: { [Op.not]: null },
        status: "Pending"
      },
      include: [{ model: Hospital, as: "NearestHospital" }],
      order: [["queue_position", "ASC"]],
    });

    if (!queuedCall) return;

    const loadByHospital = await countOnCallAmbulancesByHospital();
    const pick = pickBalancedAmbulance(
      availableAmbulances,
      queuedCall.latitude,
      queuedCall.longitude,
      loadByHospital
    );

    if (!pick) return;

    const { ambulance: chosenAmbulance, hospital: assignedHospital, dist: dispatchDistanceKm } = pick;

    await CallAssignment.create({
      call_id: queuedCall.id,
      ambulance_id: chosenAmbulance.id,
    });

    chosenAmbulance.status = "On Call";
    await chosenAmbulance.save();

    queuedCall.status = "On the Way";
    queuedCall.queue_assigned_at = new Date();
    queuedCall.queue_position = null;
    await queuedCall.save();

    const etaMin = Math.max(3, Math.round(dispatchDistanceKm * 2));
    const assignMsg = `Та дараалснаас сугалагдлаа! Түргэн тусламж явж байна. Ойролцоогоор ${etaMin} минутын дараа очно.`;

    await Notification.create({
      user_id: queuedCall.user_id,
      message: assignMsg,
      type: "AMBULANCE_ASSIGNED",
    });

    console.log(
      `✅ Queued call ${queuedCall.id} [LIGHT] assigned to ambulance ${chosenAmbulance.id} from ${assignedHospital.name}`
    );
    await syncHospitalAvailableUnits();

    // Process next queued call recursively
    await processQueuedLightCalls();
  } catch (error) {
    console.error("❌ Queue processing failed:", error.message);
  }
}

async function syncHospitalAvailableUnits() {
  const hospitals = await Hospital.findAll({ include: [Ambulance] });
  for (const hospital of hospitals) {
    const available = (hospital.Ambulances || []).filter(
      (a) => a.status === "Available"
    ).length;
    if (hospital.available_units !== available) {
      hospital.available_units = available;
      await hospital.save();
    }
  }
}

function hospitalWithLiveUnits(hospital) {
  const json = hospital.toJSON();
  const ambulances = json.Ambulances || [];
  json.available_units = ambulances.filter((a) => a.status === "Available").length;
  return json;
}

async function seedInitialData() {
  const TARGET = HOSPITAL_SEEDS.length;
  const hospitalCount = await Hospital.count();
  if (hospitalCount >= TARGET) {
    await syncHospitalAvailableUnits();
    return;
  }

  const existing = await Hospital.findAll({ attributes: ["name"] });
  const existingNames = new Set(existing.map((h) => h.name));
  const toCreate = HOSPITAL_SEEDS.filter((s) => !existingNames.has(s.name));

  if (toCreate.length === 0) {
    await syncHospitalAvailableUnits();
    return;
  }

  const hospitals = await Hospital.bulkCreate(toCreate);
  const ambulanceRows = hospitals.map((hospital, index) => ({
    hospital_id: hospital.id,
    status: "Available",
    latitude: hospital.latitude,
    longitude: hospital.longitude,
    driver_name: DRIVER_NAMES[index % DRIVER_NAMES.length],
    plate_number: `УБ ${1000 + hospital.id}`,
  }));

  await Ambulance.bulkCreate(ambulanceRows);
  await syncHospitalAvailableUnits();
  console.log(`✅ ${hospitals.length} эмнэлэг, ${ambulanceRows.length} түргэн тусламж нэмэгдлээ (нийт зорилт: ${TARGET})`);
}

async function clearAllEmergencyRecords() {
  await Ambulance.update({ status: "Available" }, { where: {} });
  await CallAssignment.destroy({ where: {} });
  await EmergencyCall.destroy({ where: {} });
  await Notification.destroy({ where: {} });
  await syncHospitalAvailableUnits();
  console.log("🧹 Бүх SOS дуудлага, хуваарилалт, мэдэгдэл цэвэрлэгдлээ (сервер эхлүүлэх үед)");
}

function findNearestHospital(latitude, longitude, hospitals) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const hospital of hospitals) {
    const distance = haversineDistance(
      latitude,
      longitude,
      hospital.latitude,
      hospital.longitude
    );
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = hospital;
    }
  }
  return { hospital: nearest, distanceKm: nearestDistance };
}

async function countOnCallAmbulancesByHospital() {
  const onCall = await Ambulance.findAll({ where: { status: "On Call" } });
  const counts = {};
  for (const a of onCall) {
    counts[a.hospital_id] = (counts[a.hospital_id] || 0) + 1;
  }
  return counts;
}

function pickBalancedAmbulance(availableAmbulances, latitude, longitude, loadByHospital) {
  if (!availableAmbulances.length) return null;

  const scored = availableAmbulances.map((ambulance) => {
    const hospital = ambulance.Hospital;
    const load = loadByHospital[ambulance.hospital_id] || 0;
    const dist = haversineDistance(
      latitude,
      longitude,
      hospital.latitude,
      hospital.longitude
    );
    return { ambulance, hospital, load, dist };
  });

  scored.sort((a, b) => {
    if (a.load !== b.load) return a.load - b.load;
    return a.dist - b.dist;
  });

  return scored[0];
}

async function createEmergencyCall(payload) {
  const {
    latitude,
    longitude,
    userId,
    type,
    priority,
    emergency_service_number,
    patient_id,
    patient_name,
    patient_phone,
    patient_info,
  } = payload;

  // Determine triage from disease type
  const triage = mapDiseaseToTriage(type);
  const calculatedPriority = priority || mapTriageToPriority(triage);

  const hospitals = await Hospital.findAll();
  const { hospital: nearestHospital, distanceKm: nearestKm } = findNearestHospital(
    latitude,
    longitude,
    hospitals
  );

  // Calculate queue position for light calls
  let queuePosition = null;
  if (triage === "light") {
    const queuedLightCalls = await EmergencyCall.count({
      where: {
        triage: "light",
        queue_position: { [Op.not]: null }
      },
    });
    queuePosition = queuedLightCalls + 1;
  }

  const saved = await EmergencyCall.create({
    user_id: userId || null,
    latitude,
    longitude,
    type: type || "SOS",
    priority: calculatedPriority,
    status: triage === "light" ? "Pending" : "Pending",
    triage,
    queue_position: queuePosition,
    nearest_hospital_id: nearestHospital ? nearestHospital.id : null,
    emergency_service_number: emergency_service_number || null,
    patient_id: patient_id || null,
    patient_name: patient_name || null,
    patient_phone: patient_phone || null,
    patient_info: patient_info || null,
  });

  // Send notification based on triage
  if (triage === "light") {
    await Notification.create({
      user_id: userId || null,
      message: `Таны илгээсэн дуудлага хөнгөн ангилалд бүртгэгдлээ. Одоогоор түргэн тусламжийн машинууд бусад дуудлагад ажиллаж байна. Хэрэв таны биеийн байдал хүндэрвэл 103 дугаарт холбогдоно уу.`,
      type: "SOS_QUEUED",
    });
  } else {
    await Notification.create({
      user_id: userId || null,
      message: `Таны ${calculatedPriority} түвшний ${type || "SOS"} дуудлага хүлээн авлаа.${emergency_service_number ? ` Утас: ${emergency_service_number}` : ""}`,
      type: "SOS_RECEIVED",
    });
  }

  if (nearestHospital) {
    await Notification.create({
      user_id: userId || null,
      message: `Таны байршил болон SOS мэдээлэл хамгийн ойр эмнэлэг — ${nearestHospital.name} (ойролцоогоор ${nearestKm.toFixed(1)} км)-д дамжуулагдлаа.`,
      type: "NEAREST_HOSPITAL_ALERT",
    });
  }

  // Only auto-assign ambulance for heavy calls
  if (triage === "heavy") {
    try {
      const availableAmbulances = await Ambulance.findAll({
        where: { status: "Available" },
        include: [Hospital],
      });

      if (availableAmbulances.length === 0) {
        console.log(`⚠️ No available ambulances for heavy call ${saved.id}`);
        return saved;
      }

      const loadByHospital = await countOnCallAmbulancesByHospital();
      const pick = pickBalancedAmbulance(availableAmbulances, latitude, longitude, loadByHospital);

      if (!pick) {
        return saved;
      }

      const { ambulance: chosenAmbulance, hospital: assignedHospital, dist: dispatchDistanceKm } = pick;

      await CallAssignment.create({
        call_id: saved.id,
        ambulance_id: chosenAmbulance.id,
      });

      chosenAmbulance.status = "On Call";
      await chosenAmbulance.save();

      saved.status = "On the Way";
      await saved.save();

      const etaMin = Math.max(3, Math.round(dispatchDistanceKm * 2));
      let assignMsg = `Таны дуудлагад ${assignedHospital.name}-ийн түргэн тусламж хуваарилагдлаа. Ойролцоогоор ${etaMin} минутын дараа очно.`;
      if (nearestHospital && nearestHospital.id !== assignedHospital.id) {
        assignMsg = `Хамгийн ойр ${nearestHospital.name} таны мэдээллийг хүлээн авсан. Түргэн тусламж ${assignedHospital.name}-аас (төвүүдийн ачааллыг тэнцвэрлэсэн) ирж байна. Ойролцоогоор ${etaMin} минут.`;
      }

      await Notification.create({
        user_id: userId || null,
        message: assignMsg,
        type: "AMBULANCE_ASSIGNED",
      });

      console.log(
        `✅ SOS ${saved.id} [HEAVY]: nearest=${nearestHospital?.name}, assigned ambulance ${chosenAmbulance.id} from ${assignedHospital.name}`
      );
      await syncHospitalAvailableUnits();
    } catch (error) {
      console.error("❌ Auto-assignment for heavy call failed:", error.message);
    }
  }

  return saved;
}

/** "On the Way" түргэн тусламжийг SOS руу ~2 сек тутамд ойртуулна */
async function advanceAmbulancesTowardCalls() {
  const assignments = await CallAssignment.findAll({
    include: [
      { model: Ambulance, required: true, where: { status: "On Call" } },
      { model: EmergencyCall, required: true, where: { status: "On the Way" } },
    ],
  });

  const ARRIVAL_THRESHOLD = 0.0004;
  const STEP = 0.0012;

  let callsCompleted = false;

  for (const assignment of assignments) {
    const ambulance = assignment.Ambulance;
    const call = assignment.EmergencyCall;
    if (!ambulance || !call) continue;

    let lat = Number(ambulance.latitude);
    let lng = Number(ambulance.longitude);
    const targetLat = Number(call.latitude);
    const targetLng = Number(call.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      lat = targetLat;
      lng = targetLng;
    }

    const dLat = targetLat - lat;
    const dLng = targetLng - lng;
    const dist = Math.hypot(dLat, dLng);

    if (dist <= ARRIVAL_THRESHOLD) {
      ambulance.latitude = targetLat;
      ambulance.longitude = targetLng;
      await ambulance.save();

      // Call completed
      ambulance.status = "Available";
      await ambulance.save();

      call.status = "Completed";
      await call.save();

      callsCompleted = true;
      console.log(`✅ Call ${call.id} completed, ambulance ${ambulance.id} is now available`);
      continue;
    }

    const ratio = Math.min(STEP / dist, 1);
    ambulance.latitude = lat + dLat * ratio;
    ambulance.longitude = lng + dLng * ratio;
    await ambulance.save();
  }

  // Process queued light calls if any ambulances became available
  if (callsCompleted) {
    await processQueuedLightCalls();
  }
}

// Routes
app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    dbAuthOk,
    dbReady,
    database: "MySQL",
    tables: ["users", "emergency_calls", "hospitals", "ambulances", "call_assignments", "notifications"],
    hint: dbReady
      ? "Бүх API бэлэн."
      : dbAuthOk
        ? "Нэвтрэх/бүртгэл ажиллана. Бусад API өгөгдөл ачаалж байна — түр хүлээнэ."
        : "Өгөгдлийн сантай холбогдож байна — хэдэн секунд хүлээгээд /health дахин шалгана уу.",
  });
});

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  const isAuthRoute = req.path.startsWith("/auth");
  if (isAuthRoute) {
    if (!dbAuthOk) {
      return res.status(503).json({
        message: "Өгөгдлийн сантай холбогдож байна. Түр хүлээнэ үү.",
        dbAuthOk: false,
      });
    }
    return next();
  }
  if (!dbReady) {
    return res.status(503).json({
      message:
        "Сервер өгөгдлийн сантай синк хийж байна. Хэдэн секундын дараа дахин оролдоно уу. (ngrok ERR_NGROK_3004-ийн шалтгаан ихэвчлэн энэ)",
      dbReady: false,
    });
  }
  next();
});

app.post("/api/emergency", async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      userId,
      type,
      priority,
      emergency_service_number,
      patient_id,
      patient_name,
      patient_phone,
      patient_info,
    } = req.body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({
        message: "latitude/longitude must be numbers",
      });
    }

    const saved = await createEmergencyCall({
      latitude,
      longitude,
      userId,
      type,
      priority,
      emergency_service_number,
      patient_id,
      patient_name,
      patient_phone,
      patient_info,
    });

    return res.status(201).json({
      message: "Emergency call created",
      data: saved,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create emergency call",
      error: error.message,
    });
  }
});

app.get("/api/emergency/active", async (_req, res) => {
  try {
    const items = await EmergencyCall.findAll({
      where: {
        status: {
          [Op.in]: ["Pending", "On the Way"],
        },
      },
      include: [
        { model: Hospital, as: "NearestHospital" },
        {
          model: CallAssignment,
          include: [{ model: Ambulance, include: [Hospital] }],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get active emergency calls",
      error: error.message,
    });
  }
});

app.delete("/api/emergency/active", async (_req, res) => {
  try {
    const activeCalls = await EmergencyCall.findAll({
      where: {
        status: {
          [Op.in]: ["Pending", "On the Way"],
        },
      },
    });

    const activeCallIds = activeCalls.map((call) => call.id);

    if (activeCallIds.length > 0) {
      const assignments = await CallAssignment.findAll({
        where: { call_id: activeCallIds },
      });

      const ambulanceIds = assignments.map((assignment) => assignment.ambulance_id);
      if (ambulanceIds.length > 0) {
        await Ambulance.update(
          { status: "Available" },
          {
            where: {
              id: ambulanceIds,
            },
          }
        );
      }

      await CallAssignment.destroy({
        where: { call_id: activeCallIds },
      });

      await EmergencyCall.destroy({
        where: { id: activeCallIds },
      });
    }

    return res.json({
      message: "Active emergency calls cleared and assigned ambulances reset.",
      deletedCount: activeCallIds.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to clear active emergency calls",
      error: error.message,
    });
  }
});

app.get("/api/emergency", async (_req, res) => {
  try {
    const items = await EmergencyCall.findAll({
      include: [
        { model: User, as: 'user' },
        { model: CallAssignment, include: [Ambulance] }
      ],
      order: [["created_at", "DESC"]],
      limit: 100,
    });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get emergency history",
      error: error.message,
    });
  }
});

app.get("/api/emergency/:id", async (req, res) => {
  try {
    const item = await EmergencyCall.findByPk(req.params.id, {
      include: [
        { model: User, as: "user" },
        { model: Hospital, as: "NearestHospital" },
        {
          model: CallAssignment,
          include: [{ model: Ambulance, include: [Hospital] }],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({ message: "Emergency call not found" });
    }

    return res.json(item);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get emergency call",
      error: error.message,
    });
  }
});

app.delete("/api/emergency/:id", async (req, res) => {
  try {
    const call = await EmergencyCall.findByPk(req.params.id, {
      include: [{ model: CallAssignment, include: [Ambulance] }],
    });

    if (!call) {
      return res.status(404).json({ message: "Emergency call not found" });
    }

    const assignments = call.CallAssignments || [];
    const ambulanceIds = assignments.map((assignment) => assignment.ambulance_id);

    if (ambulanceIds.length > 0) {
      await Ambulance.update(
        { status: "Available" },
        {
          where: {
            id: ambulanceIds,
          },
        }
      );
    }

    await CallAssignment.destroy({
      where: { call_id: call.id },
    });
    await call.destroy();

    return res.json({ message: "Emergency call deleted and ambulance reset" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete emergency call",
      error: error.message,
    });
  }
});

app.delete("/api/emergency/clear-all", async (_req, res) => {
  try {
    // Reset all ambulances to Available
    await Ambulance.update(
      { status: "Available" },
      { where: {} }
    );

    // Delete all call assignments
    await CallAssignment.destroy({
      where: {},
      truncate: true
    });

    // Delete all emergency calls
    await EmergencyCall.destroy({
      where: {},
      truncate: true
    });

    // Delete all notifications
    await Notification.destroy({
      where: {},
      truncate: true
    });

    console.log("✅ All emergency data cleared");
    return res.json({
      message: "All emergency calls, assignments, and notifications cleared. Ambulances reset to Available.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to clear emergency data",
      error: error.message,
    });
  }
});

// Queue management endpoints
app.get("/api/emergency/queue", async (_req, res) => {
  try {
    const queuedCalls = await EmergencyCall.findAll({
      where: {
        triage: "light",
        queue_position: { [Op.not]: null }
      },
      include: [
        { model: User, as: 'user' },
        { model: Hospital, as: "NearestHospital" }
      ],
      order: [["queue_position", "ASC"]],
    });
    return res.json(queuedCalls);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get queue",
      error: error.message,
    });
  }
});

app.get("/api/emergency/priority", async (_req, res) => {
  try {
    const priorityCalls = await EmergencyCall.findAll({
      where: {
        triage: "heavy",
        status: { [Op.in]: ["Pending", "On the Way"] }
      },
      include: [
        { model: User, as: 'user' },
        { model: Hospital, as: "NearestHospital" },
        {
          model: CallAssignment,
          include: [{ model: Ambulance, include: [Hospital] }],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    return res.json(priorityCalls);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get priority calls",
      error: error.message,
    });
  }
});

app.patch("/api/emergency/:id/triage", async (req, res) => {
  try {
    const { id } = req.params;
    const { triage } = req.body;

    if (!["light", "heavy"].includes(triage)) {
      return res.status(400).json({ message: "Invalid triage value" });
    }

    const call = await EmergencyCall.findByPk(id);
    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }

    call.triage = triage;
    await call.save();

    return res.json({
      message: "Triage updated",
      data: call
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update triage",
      error: error.message,
    });
  }
});

app.get("/api/hospitals/nearby", async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({
        message: "latitude and longitude query parameters are required",
      });
    }

    const hospitals = await Hospital.findAll();
    const nearby = hospitals
      .map((hospital) => {
        const distance = haversineDistance(
          latitude,
          longitude,
          hospital.latitude,
          hospital.longitude
        );

        return {
          ...hospital.toJSON(),
          distance_km: Number(distance.toFixed(2)),
        };
      })
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 3);

    return res.json(nearby);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get nearby hospitals",
      error: error.message,
    });
  }
});

app.get("/api/ambulances/available", async (_req, res) => {
  try {
    const ambulances = await Ambulance.findAll({
      where: { status: "Available" },
      include: [Hospital],
      order: [["id", "ASC"]],
    });

    return res.json(ambulances);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get available ambulances",
      error: error.message,
    });
  }
});

app.post("/api/ambulances/assign", async (req, res) => {
  try {
    const { callId, ambulanceId } = req.body;

    const emergencyCall = await EmergencyCall.findByPk(callId);
    const ambulance = await Ambulance.findByPk(ambulanceId);

    if (!emergencyCall || !ambulance) {
      return res.status(404).json({
        message: "Emergency call or ambulance not found",
      });
    }

    const assignment = await CallAssignment.create({
      call_id: callId,
      ambulance_id: ambulanceId,
    });

    ambulance.status = "On Call";
    await ambulance.save();

    emergencyCall.status = "On the Way";
    await emergencyCall.save();

    await Notification.create({
      user_id: emergencyCall.user_id,
      message: "Таны дуудлагад түргэн тусламжийн баг хуваарилагдлаа.",
      type: "AMBULANCE_ASSIGNED",
    });

    return res.status(201).json({
      message: "Ambulance assigned successfully",
      data: assignment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to assign ambulance",
      error: error.message,
    });
  }
});

app.get("/api/notifications", async (req, res) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const where = userId ? { user_id: userId } : {};
    const notifications = await Notification.findAll({
      where,
      order: [["created_at", "DESC"]],
      limit: 100,
    });

    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get notifications",
      error: error.message,
    });
  }
});

// Legacy routes kept for current mobile screens
app.post("/sos", async (req, res) => {
  try {
    const { latitude, longitude, userId, type } = req.body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({
        message: "latitude/longitude must be numbers",
      });
    }

    const saved = await createEmergencyCall({
      latitude,
      longitude,
      userId,
      type: type || "SOS",
    });

    return res.status(201).json({ message: "SOS saved", data: saved });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to save SOS",
      error: error.message,
    });
  }
});

app.get("/sos", async (_req, res) => {
  try {
    const items = await EmergencyCall.findAll({
      order: [["created_at", "DESC"]],
      limit: 100,
    });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get SOS history",
      error: error.message,
    });
  }
});

app.get("/sos/:id", async (req, res) => {
  try {
    const item = await EmergencyCall.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "SOS not found" });
    }
    return res.json(item);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get SOS",
      error: error.message,
    });
  }
});

// Register User
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "name, email, and password are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("email")),
        normalizedEmail
      ),
    });
    if (existingUser) {
      return res.status(409).json({
        message: "Энэ и-мэйлээр аль хэдийн бүртгэгдсэн байна.",
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone: phone || null,
      passwordHash: password,
    });

    return res.status(201).json({
      message: "User registered successfully",
      data: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to register user",
      error: error.message,
    });
  }
});

// Login User
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "И-мэйл болон нууц үгээ оруулна уу.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("email")),
        normalizedEmail
      ),
    });
    if (!user) {
      return res.status(401).json({
        message: "И-мэйл эсвэл нууц үг буруу байна.",
      });
    }

    if (user.passwordHash !== password) {
      return res.status(401).json({
        message: "И-мэйл эсвэл нууц үг буруу байна.",
      });
    }

    return res.json({
      message: "Login successful",
      data: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to login",
      error: error.message,
    });
  }
});

// Get all users (Admin only)
app.get("/users", async (_req, res) => {
  try {
    const users = await User.findAll();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get users",
      error: error.message,
    });
  }
});

// Get all hospitals (for web dashboard)
app.get("/hospitals", async (_req, res) => {
  try {
    const hospitals = await Hospital.findAll({
      include: [Ambulance],
      order: [["id", "ASC"]],
    });
    return res.json(hospitals.map(hospitalWithLiveUnits));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get hospitals",
      error: error.message,
    });
  }
});

// Get hospital by ID
app.get("/hospitals/:id", async (req, res) => {
  try {
    const hospital = await Hospital.findByPk(req.params.id, {
      include: [Ambulance],
    });
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }
    return res.json(hospital);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get hospital",
      error: error.message,
    });
  }
});

// Get all ambulances (for web dashboard)
app.get("/ambulances", async (_req, res) => {
  try {
    const ambulances = await Ambulance.findAll({
      include: [Hospital],
      order: [["id", "ASC"]],
    });
    return res.json(ambulances);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get ambulances",
      error: error.message,
    });
  }
});

// HTTP эхлүүлэх — DB бэлэн болохоос өмнө (ngrok нь шууд валид HTTP хүлээн авна)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ HTTP сонсож байна: http://0.0.0.0:${PORT} (LAN болон ngrok: ngrok http ${PORT})`);
  console.log(`   DB бэлэн болоход хүлээнэ — түр /health шалгана уу.`);
});

// Database Connection (дараа нь API нээгдэнэ)
(async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL Database connected successfully");

    await sequelize.sync({ alter: true });
    dbAuthOk = true;
    console.log("   /auth/login, /auth/register идэвхтэй (хүснэгт бэлэн)");

    await seedInitialData();
    if (process.env.CLEAR_SOS_ON_START !== "0") {
      await clearAllEmergencyRecords();
    }
    dbReady = true;
    console.log("✅ Models synchronized — бүх API замууд идэвхтэй");
    console.log(`   Database: ${process.env.DB_NAME || "hospital"}`);
    console.log(`   DB Host: ${process.env.DB_HOST || "localhost"}`);

    setInterval(() => {
      advanceAmbulancesTowardCalls().catch((err) => {
        console.error("Ambulance position tick failed:", err.message);
      });
    }, 2000);
    console.log("   🚑 Түргэн тусламжийн байршил 2 сек тутам шинэчлэгдэнэ");
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    console.error("   /health ажиллана (dbReady: false). MySQL тохиргоо, firewall шалгана уу.");
  }
})();