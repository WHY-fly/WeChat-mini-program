const SESSION_STORAGE_KEY = "wenchuan-user-session";
const RELATION_STORAGE_KEY = "wenchuan-service-relations";
const SUPPLY_STORAGE_KEY = "wenchuan-supply-tasks";

const roleOptions = [
  {
    key: "resident",
    label: "居民",
    description: "扫码登录后可急救和查物资。"
  },
  {
    key: "manager",
    label: "健康管家",
    description: "维护居民关系，接收投送任务。"
  },
  {
    key: "doctor",
    label: "医院医生",
    description: "远程指导与药品复核。"
  },
  {
    key: "dispatcher",
    label: "应急调度",
    description: "统筹热线、投送和联动。"
  }
];

const identityDirectory = [
  {
    code: "RESIDENT-001",
    qrValue: "WCHG-ID:RESIDENT-001",
    roleKey: "resident",
    name: "李淑芬",
    phone: "13800138001",
    community: "汶川县阳光社区",
    address: "漩口镇阳光社区 1 组 12 号",
    title: "重点关怀居民",
    serviceNote: "独居老人，高血压与糖尿病长期随访。",
    stationKey: "STATION-YANGGUANG"
  },
  {
    code: "RESIDENT-002",
    qrValue: "WCHG-ID:RESIDENT-002",
    roleKey: "resident",
    name: "罗明成",
    phone: "13800138002",
    community: "汶川县岷江社区",
    address: "映秀镇岷江社区 3 组 7 号",
    title: "慢病巡护居民",
    serviceNote: "心衰复诊期，需要药品持续配送。",
    stationKey: "STATION-MINJIANG"
  },
  {
    code: "MANAGER-101",
    qrValue: "WCHG-ID:MANAGER-101",
    roleKey: "manager",
    name: "赵宁",
    phone: "13800138101",
    community: "汶川县阳光社区",
    organization: "汶川县阳光社区健康管家中心",
    title: "健康管家",
    serviceNote: "负责阳光社区独居老人巡护与急救联动。",
    stationKey: "STATION-YANGGUANG"
  },
  {
    code: "MANAGER-102",
    qrValue: "WCHG-ID:MANAGER-102",
    roleKey: "manager",
    name: "唐雪",
    phone: "13800138102",
    community: "汶川县岷江社区",
    organization: "汶川县岷江社区健康管家中心",
    title: "健康管家",
    serviceNote: "负责岷江社区慢病居民巡访与物资核验。",
    stationKey: "STATION-MINJIANG"
  },
  {
    code: "DOCTOR-201",
    qrValue: "WCHG-ID:DOCTOR-201",
    roleKey: "doctor",
    name: "陈远航",
    phone: "13800138201",
    organization: "汶川县人民医院全科医学科",
    title: "主治医生",
    serviceNote: "负责急救处置建议、药品复核与复诊计划。"
  },
  {
    code: "DOCTOR-202",
    qrValue: "WCHG-ID:DOCTOR-202",
    roleKey: "doctor",
    name: "何佳颖",
    phone: "13800138202",
    organization: "汶川县人民医院急诊医学科",
    title: "值班医生",
    serviceNote: "负责夜间应急处置与 120 协同指导。"
  },
  {
    code: "DISPATCH-301",
    qrValue: "WCHG-ID:DISPATCH-301",
    roleKey: "dispatcher",
    name: "肖松",
    phone: "13800138301",
    organization: "汶川县无人机医疗救援调度台",
    title: "应急调度员",
    serviceNote: "负责航线放飞、物资调度与落点协调。"
  }
];

const supplyStations = [
  {
    key: "STATION-YANGGUANG",
    name: "阳光社区无人机投送点",
    address: "汶川县漩口镇阳光社区卫生站屋顶",
    range: "覆盖阳光社区、银杏片区与周边山地居民点",
    eta: "预计 8 分钟可达",
    dropPoint: "阳光社区活动广场南侧降落点",
    verifyMethod: "居民身份码 + 物资包二维码双重核验"
  },
  {
    key: "STATION-MINJIANG",
    name: "岷江社区无人机投送点",
    address: "汶川县映秀镇岷江社区卫生服务站",
    range: "覆盖岷江社区、映秀镇主通道沿线居民",
    eta: "预计 12 分钟可达",
    dropPoint: "岷江社区便民服务中心前坪",
    verifyMethod: "居民身份码 + 4 位备用核验码"
  }
];

const defaultRelationRecords = [
  {
    residentCode: "RESIDENT-001",
    managerCode: "MANAGER-101",
    doctorCode: "DOCTOR-201",
    serviceScope: "独居老人慢病巡护",
    notes: "每周一次入户巡护，紧急情况由赵宁优先首接。",
    updatedAt: "2026-04-16 09:20"
  },
  {
    residentCode: "RESIDENT-002",
    managerCode: "MANAGER-102",
    doctorCode: "DOCTOR-202",
    serviceScope: "心衰复诊协同",
    notes: "药品投送后由急诊科医生远程复核。",
    updatedAt: "2026-04-16 09:35"
  }
];

const defaultSupplyTasks = [
  {
    packageCode: "PKG-8601",
    qrValue: "WCHG-SUPPLY:PKG-8601",
    residentCode: "RESIDENT-001",
    stationKey: "STATION-YANGGUANG",
    packageName: "高原急救包",
    status: "待投送",
    eta: "8 分钟",
    dropPoint: "阳光社区活动广场南侧降落点",
    verifyMethod: "扫码核验物资包二维码，并出示居民身份码。",
    backupCode: "8601",
    items: ["应急降压药", "口服补液盐", "指夹血氧仪", "血糖试纸"],
    guidance: [
      "先核对姓名、身份码与物资包编号是否一致。",
      "降压药按健康管家或医生确认后的剂量服用。",
      "完成服药后 15 分钟内复测血压与血氧，并在首页继续保持联络。"
    ]
  },
  {
    packageCode: "PKG-8602",
    qrValue: "WCHG-SUPPLY:PKG-8602",
    residentCode: "RESIDENT-002",
    stationKey: "STATION-MINJIANG",
    packageName: "慢病续方包",
    status: "飞行准备中",
    eta: "12 分钟",
    dropPoint: "岷江社区便民服务中心前坪",
    verifyMethod: "出示居民身份码，并输入 4 位备用核验码。",
    backupCode: "8602",
    items: ["利尿剂", "口服补液盐", "一次性口罩", "电子用药提醒卡"],
    guidance: [
      "先由健康管家核对备份码，再确认本人身份。",
      "按电子用药提醒卡所示时间服药，不要自行加量。",
      "若仍有胸闷气短，请返回首页立即发起紧急联络。"
    ]
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatTime(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function getRoleOptions() {
  return clone(roleOptions);
}

function getRoleByKey(roleKey) {
  return roleOptions.find((item) => item.key === roleKey) || roleOptions[0];
}

function normalizeIdentityCode(rawValue) {
  let value = String(rawValue || "").trim();

  if (!value) {
    return "";
  }

  const match = value.match(/code=([^&]+)/i);
  if (match && match[1]) {
    value = decodeURIComponent(match[1]);
  }

  value = value.replace(/^WCHG-ID:/i, "").replace(/^ID:/i, "").trim();
  return value.toUpperCase();
}

function normalizeSupplyCode(rawValue) {
  let value = String(rawValue || "").trim();

  if (!value) {
    return "";
  }

  const match = value.match(/code=([^&]+)/i);
  if (match && match[1]) {
    value = decodeURIComponent(match[1]);
  }

  value = value.replace(/^WCHG-SUPPLY:/i, "").replace(/^SUPPLY:/i, "").trim();
  return value.toUpperCase();
}

function getIdentityByCode(rawValue) {
  const code = normalizeIdentityCode(rawValue);
  const profile = identityDirectory.find((item) => item.code === code);
  return profile ? clone(profile) : null;
}

function getStationByKey(stationKey) {
  const station = supplyStations.find((item) => item.key === stationKey);
  return station ? clone(station) : clone(supplyStations[0]);
}

function loadSession() {
  try {
    const session = wx.getStorageSync(SESSION_STORAGE_KEY);
    return session ? clone(session) : null;
  } catch (error) {
    return null;
  }
}

function saveSession(session) {
  const nextSession = clone(session);
  wx.setStorageSync(SESSION_STORAGE_KEY, nextSession);
  return nextSession;
}

function clearSession() {
  wx.removeStorageSync(SESSION_STORAGE_KEY);
}

function loadRelations() {
  try {
    const stored = wx.getStorageSync(RELATION_STORAGE_KEY);
    if (Array.isArray(stored) && stored.length) {
      return clone(stored);
    }
  } catch (error) {}

  return clone(defaultRelationRecords);
}

function saveRelations(relations) {
  const nextRelations = clone(relations);
  wx.setStorageSync(RELATION_STORAGE_KEY, nextRelations);
  return nextRelations;
}

function saveServiceRelation(record) {
  const currentRelations = loadRelations();
  const nextRecord = {
    ...record,
    updatedAt: formatTime(new Date())
  };
  const existingIndex = currentRelations.findIndex(
    (item) => item.residentCode === nextRecord.residentCode
  );

  if (existingIndex >= 0) {
    currentRelations[existingIndex] = nextRecord;
  } else {
    currentRelations.unshift(nextRecord);
  }

  return saveRelations(currentRelations);
}

function loadSupplyTasks() {
  try {
    const stored = wx.getStorageSync(SUPPLY_STORAGE_KEY);
    if (Array.isArray(stored) && stored.length) {
      return clone(stored);
    }
  } catch (error) {}

  return clone(defaultSupplyTasks);
}

function saveSupplyTasks(tasks) {
  const nextTasks = clone(tasks);
  wx.setStorageSync(SUPPLY_STORAGE_KEY, nextTasks);
  return nextTasks;
}

function buildResidentCodesForRole(session, relations) {
  if (!session) {
    return [];
  }

  if (session.roleKey === "resident") {
    return [session.identityCode];
  }

  if (session.roleKey === "manager") {
    return relations
      .filter((item) => item.managerCode === session.identityCode)
      .map((item) => item.residentCode);
  }

  if (session.roleKey === "doctor") {
    return relations
      .filter((item) => item.doctorCode === session.identityCode)
      .map((item) => item.residentCode);
  }

  return [];
}

function getSupplyOverview(session) {
  const relations = loadRelations();
  const tasks = loadSupplyTasks();
  const residentCodes = buildResidentCodesForRole(session, relations);

  const filteredTasks =
    residentCodes.length > 0
      ? tasks.filter((item) => residentCodes.includes(item.residentCode))
      : session && session.roleKey === "dispatcher"
        ? tasks
        : tasks.slice(0, 1);

  const enrichedTasks = filteredTasks.map((task) => {
    const resident = getIdentityByCode(task.residentCode);
    return {
      ...task,
      resident,
      station: getStationByKey(task.stationKey)
    };
  });

  const primaryTask = enrichedTasks[0] || null;
  const station = primaryTask
    ? primaryTask.station
    : getStationByKey((session && session.stationKey) || supplyStations[0].key);

  return {
    station,
    tasks: enrichedTasks
  };
}

function verifySupplyPackage(rawValue) {
  const packageCode = normalizeSupplyCode(rawValue);
  const currentTasks = loadSupplyTasks();
  const taskIndex = currentTasks.findIndex(
    (item) => item.packageCode === packageCode || item.backupCode === packageCode
  );

  if (taskIndex < 0) {
    return {
      success: false,
      message: "未识别到对应的物资包编号。"
    };
  }

  currentTasks[taskIndex] = {
    ...currentTasks[taskIndex],
    status: "已核验",
    verifiedAt: formatTime(new Date())
  };

  saveSupplyTasks(currentTasks);

  return {
    success: true,
    task: {
      ...currentTasks[taskIndex],
      resident: getIdentityByCode(currentTasks[taskIndex].residentCode),
      station: getStationByKey(currentTasks[taskIndex].stationKey)
    }
  };
}

module.exports = {
  getRoleOptions,
  getRoleByKey,
  normalizeIdentityCode,
  normalizeSupplyCode,
  getIdentityByCode,
  getStationByKey,
  loadSession,
  saveSession,
  clearSession,
  loadRelations,
  saveServiceRelation,
  getSupplyOverview,
  verifySupplyPackage
};
