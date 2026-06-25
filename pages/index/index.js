const { appTitle, appSubtitle, autoCallDelaySeconds } = require("../../config/emergency");
const { loadEmergencyState } = require("../../utils/emergency-store");
const {
  loadSession,
  loadRelations,
  getSupplyOverview,
  getIdentityByCode
} = require("../../utils/service-store");

function sanitizePhoneNumber(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function isConfiguredPhone(phone) {
  return /^\d{3,20}$/.test(sanitizePhoneNumber(phone));
}

function buildActionText(contact) {
  return contact.key === "emergency120" ? "立即拨打" : "了解线路";
}

function buildSessionCard(session, relations, supplyOverview) {
  if (!session) {
    return {
      title: "未完成身份登录",
      subtitle: "先扫码识别居民、健康管家或医院医生身份，后续投送任务和联系人关系会自动关联。",
      tags: ["二维码识别", "多角色工作台", "物资投送联动"]
    };
  }

  if (session.roleKey === "resident") {
    const relation = relations.find((item) => item.residentCode === session.identityCode);
    const manager = relation ? getIdentityByCode(relation.managerCode) : null;
    const doctor = relation && relation.doctorCode ? getIdentityByCode(relation.doctorCode) : null;
    const currentTask = supplyOverview.tasks[0];

    return {
      title: `${session.name} · ${session.roleLabel}`,
      subtitle: session.community || session.organization || session.address,
      tags: [
        manager ? `健康管家 ${manager.name}` : "待绑定健康管家",
        doctor ? `协同医生 ${doctor.name}` : "待绑定协同医生",
        currentTask ? `${currentTask.packageName} ${currentTask.status}` : "就近投送点已匹配"
      ]
    };
  }

  if (session.roleKey === "manager") {
    const residentCount = relations.filter(
      (item) => item.managerCode === session.identityCode
    ).length;

    return {
      title: `${session.name} · ${session.roleLabel}`,
      subtitle: session.organization || session.community,
      tags: [
        `服务居民 ${residentCount} 人`,
        supplyOverview.tasks.length ? `当前投送 ${supplyOverview.tasks.length} 单` : "当前无待核验物资",
        session.identityCode
      ]
    };
  }

  if (session.roleKey === "doctor") {
    const residentCount = relations.filter(
      (item) => item.doctorCode === session.identityCode
    ).length;

    return {
      title: `${session.name} · ${session.roleLabel}`,
      subtitle: session.organization || session.community,
      tags: [
        `协同居民 ${residentCount} 人`,
        supplyOverview.tasks.length ? `待复核物资 ${supplyOverview.tasks.length} 单` : "当前无待复核任务",
        session.identityCode
      ]
    };
  }

  return {
    title: `${session.name} · ${session.roleLabel}`,
    subtitle: session.organization || session.community || "无人机医疗救援调度",
    tags: [
      "多角色协同",
      supplyOverview.tasks.length ? `全局投送 ${supplyOverview.tasks.length} 单` : "当前无投送任务",
      session.identityCode
    ]
  };
}

const rescueStages = [
  {
    title: "紧急呼救优先发起",
    description: "进入首页即启动 10 秒倒计时，可暂停防误触，也可直接手动拨打。"
  },
  {
    title: "健康管家首接研判",
    description: "首接线路优先联系健康管家，必要时同步带出居民身份、社区与既往服务信息。"
  },
  {
    title: "无人机物资联动",
    description: "系统根据身份与社区匹配就近投送点，安排物资起飞、落点核验和后续指导。"
  },
  {
    title: "120 兜底处置",
    description: "主线路失败或返回页面后确认未接通时，继续联动 120 保持救援不中断。"
  }
];

const sourceLabelMap = {
  auto: "自动呼救",
  manual: "手动呼救",
  fallback: "120 联动"
};

Page({
  data: {
    appTitle,
    appSubtitle,
    missionBadge: "汶川山区空地协同救援",
    missionSummary:
      "以紧急救援为第一页，继续串联身份识别、健康管家联系和无人机物资投送，形成完整居民服务流程。",
    sceneTags: ["急救首页", "身份二维码", "物资投送", "社区协同"],
    rescueStages,
    contacts: [],
    countdown: autoCallDelaySeconds,
    autoCallDelaySeconds,
    autoCallEnabled: true,
    autoCallTriggered: false,
    autoCallTarget: "",
    autoCallPhoneDisplay: "",
    fallbackTarget: "120急救电话",
    countdownDisplay: `${autoCallDelaySeconds}s`,
    countdownProgress: 100,
    statusText: "",
    statusTone: "warning",
    statusBadgeText: "自动呼救待命",
    actionButtonText: "暂停自动呼救",
    currentSession: null,
    sessionCard: {
      title: "",
      subtitle: "",
      tags: []
    },
    supplyPreview: {
      stationName: "",
      eta: "",
      dropPoint: "",
      taskLabel: ""
    }
  },

  onLoad() {
    this.refreshContacts();
    this.refreshDashboard();
    this.enableKeepScreenOn(true);
    this.startCountdown(autoCallDelaySeconds);
  },

  onShow() {
    this.refreshContacts({ preserveStatus: true });
    this.refreshDashboard();

    if (this.pendingConnectionConfirm) {
      this.pendingConnectionConfirm = false;
      this.promptConnectionResult();
      return;
    }

    if (
      this.data.autoCallEnabled &&
      !this.data.autoCallTriggered &&
      !this.countdownTimer
    ) {
      this.startCountdown(this.data.countdown || autoCallDelaySeconds);
    }
  },

  onHide() {
    this.clearCountdown();
  },

  onUnload() {
    this.clearCountdown();
    this.pendingConnectionConfirm = false;
    this.lastPrimaryCallContext = null;
    this.enableKeepScreenOn(false);
  },

  refreshDashboard() {
    const currentSession = loadSession();
    const relations = loadRelations();
    const supplyOverview = getSupplyOverview(currentSession);

    this.setData({
      currentSession,
      sessionCard: buildSessionCard(currentSession, relations, supplyOverview),
      supplyPreview: {
        stationName: supplyOverview.station.name,
        eta: supplyOverview.station.eta,
        dropPoint: supplyOverview.station.dropPoint,
        taskLabel: supplyOverview.tasks.length
          ? `${supplyOverview.tasks[0].packageName} · ${supplyOverview.tasks[0].status}`
          : "当前没有匹配到居民物资任务"
      }
    });
  },

  refreshContacts(options = {}) {
    const { contacts } = loadEmergencyState();
    const normalizedContacts = contacts.map((contact) => ({
      ...contact,
      configured: isConfiguredPhone(contact.phone),
      actionText: buildActionText(contact)
    }));

    this.primaryContact =
      normalizedContacts.find((contact) => contact.isPrimary) ||
      normalizedContacts.find((contact) => contact.key !== "emergency120") ||
      null;

    this.fallbackContact =
      normalizedContacts.find((contact) => contact.key === "emergency120") || null;

    const nextData = {
      contacts: normalizedContacts,
      autoCallTarget: this.primaryContact ? this.primaryContact.label : "健康管家首接主线",
      autoCallPhoneDisplay: this.primaryContact ? this.primaryContact.phone : "待确认",
      fallbackTarget: this.fallbackContact ? this.fallbackContact.label : "120急救电话"
    };

    const shouldResetStatus =
      !options.preserveStatus || (this.data.autoCallEnabled && this.data.statusTone === "warning");

    if (shouldResetStatus) {
      nextData.statusText = this.primaryContact
        ? `若 ${autoCallDelaySeconds} 秒内没有操作，系统将自动联系 ${this.primaryContact.label}。`
        : `若 ${autoCallDelaySeconds} 秒内没有操作，系统将自动发起求助。`;
      nextData.statusTone = "warning";
      nextData.statusBadgeText = "自动呼救待命";
    }

    this.setData(nextData);
  },

  enableKeepScreenOn(keepScreenOn) {
    if (!wx.setKeepScreenOn) {
      return;
    }

    wx.setKeepScreenOn({
      keepScreenOn,
      fail: () => {}
    });
  },

  syncCountdown(countdown, displayText) {
    const safeCountdown = Math.max(0, countdown);
    const progress = Math.max(
      0,
      Math.min(100, Math.round((safeCountdown / autoCallDelaySeconds) * 100))
    );

    this.setData({
      countdown: safeCountdown,
      countdownDisplay: displayText || `${safeCountdown}s`,
      countdownProgress: progress
    });
  },

  startCountdown(nextCountdown) {
    if (!this.data.autoCallEnabled || this.data.autoCallTriggered) {
      return;
    }

    const safeCountdown = nextCountdown > 0 ? nextCountdown : autoCallDelaySeconds;

    this.clearCountdown();
    this.syncCountdown(safeCountdown);
    this.setData({ actionButtonText: "暂停自动呼救" });

    this.countdownTimer = setInterval(() => {
      const remaining = this.data.countdown - 1;

      if (remaining <= 0) {
        this.clearCountdown();
        this.syncCountdown(0, "已触发");
        this.triggerAutoCall();
        return;
      }

      this.syncCountdown(remaining);
    }, 1000);
  },

  clearCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  },

  updateStatus(statusText, statusTone, statusBadgeText) {
    this.setData({
      statusText,
      statusTone,
      statusBadgeText:
        statusBadgeText || {
          warning: "自动呼救待命",
          success: "已建立联络",
          danger: "正在紧急联动",
          neutral: "等待人工操作"
        }[statusTone]
    });
  },

  getContactByKey(contactKey) {
    return this.data.contacts.find((contact) => contact.key === contactKey) || null;
  },

  switchTabPage(event) {
    const { url } = event.currentTarget.dataset;

    if (!url) {
      return;
    }

    wx.switchTab({ url });
  },

  openRouteEditor(contactKey) {
    wx.navigateTo({
      url: `/pages/route-editor/index?key=${contactKey}`
    });
  },

  handlePrimaryCall() {
    this.placeCall(this.primaryContact, "manual");
  },

  handleContactAction(event) {
    const { key } = event.currentTarget.dataset;
    const contact = this.getContactByKey(key);

    if (!contact) {
      wx.showToast({
        title: "未找到对应线路",
        icon: "none"
      });
      return;
    }

    if (contact.key === "emergency120") {
      this.handleQuickCall(event);
      return;
    }

    this.openRouteEditor(contact.key);
  },

  handleQuickCall(event) {
    const { key } = event.currentTarget.dataset;
    const contact = this.getContactByKey(key);

    if (!contact) {
      wx.showToast({
        title: "未找到对应线路",
        icon: "none"
      });
      return;
    }

    if (contact.key === "emergency120") {
      wx.showModal({
        title: "确认联动 120",
        content: "120 为急救电话，如存在明显不适或紧急情况，请立即拨打。",
        confirmText: "立即拨打",
        cancelText: "再想想",
        success: ({ confirm }) => {
          if (confirm) {
            this.placeCall(contact, "fallback", {
              skipAssessment: true,
              skipFallback: true
            });
          }
        }
      });
      return;
    }

    this.placeCall(contact, "manual", {
      skipAssessment: true,
      skipFallback: true
    });
  },

  toggleAutoCall() {
    if (this.data.autoCallEnabled) {
      this.clearCountdown();
      this.syncCountdown(this.data.countdown, "已暂停");
      this.setData({
        autoCallEnabled: false,
        actionButtonText: "恢复倒计时"
      });
      this.updateStatus(
        "自动呼救已暂停，可确认环境后再恢复倒计时或立即拨打。",
        "neutral",
        "已暂停待命"
      );
      return;
    }

    const nextCountdown = this.data.countdown > 0 ? this.data.countdown : autoCallDelaySeconds;

    this.setData({
      autoCallEnabled: true,
      autoCallTriggered: false,
      actionButtonText: "暂停自动呼救"
    });

    this.updateStatus(
      `自动呼救已恢复，若 ${nextCountdown} 秒内没有新的操作，将自动发起联络。`,
      "warning",
      "自动呼救待命"
    );
    this.startCountdown(nextCountdown);
  },

  triggerAutoCall() {
    this.updateStatus(
      "倒计时结束，系统正在为你联系健康管家主线路。",
      "danger",
      "自动呼救发起"
    );
    this.placeCall(this.primaryContact, "auto");
  },

  placeCall(contact, source, options = {}) {
    const settings = Object.assign(
      {
        skipAssessment: false,
        skipFallback: false
      },
      options
    );
    const sourceLabel = sourceLabelMap[source] || "呼救";
    const phoneNumber = sanitizePhoneNumber(contact && contact.phone);

    if (!contact) {
      wx.showToast({
        title: "线路信息暂不可用",
        icon: "none"
      });
      return;
    }

    this.clearCountdown();
    this.setData({
      autoCallEnabled: false,
      autoCallTriggered: source === "auto",
      actionButtonText: "恢复倒计时"
    });
    this.syncCountdown(this.data.countdown, source === "auto" ? "已触发" : "拨号中");

    if (!isConfiguredPhone(contact.phone)) {
      if (contact.key === this.primaryContact?.key && !settings.skipFallback) {
        this.forwardToEmergency(`${contact.label} 当前暂未录入有效电话主线。`, source === "auto");
        return;
      }

      this.updateStatus(
        `${contact.label} 当前暂未录入有效电话，请先进入线路设置完成更新。`,
        "danger",
        "线路待完善"
      );
      wx.showModal({
        title: "线路信息待完善",
        content: `${contact.label} 当前暂未录入有效电话，请先进入“了解线路”完成设置。`,
        showCancel: false
      });
      return;
    }

    this.updateStatus(
      `${sourceLabel}已发起，正在拨打 ${contact.label}。`,
      source === "fallback" || source === "auto" ? "danger" : "success",
      source === "fallback" ? "120 联动中" : "正在拨号"
    );

    wx.makePhoneCall({
      phoneNumber,
      success: () => {
        this.handleCallSuccess(contact, source, settings);
      },
      fail: () => {
        this.handleCallFailure(contact, source, settings);
      }
    });
  },

  handleCallSuccess(contact, source, options) {
    const sourceLabel = sourceLabelMap[source] || "呼救";

    if (contact.key === this.primaryContact?.key && !options.skipAssessment) {
      this.pendingConnectionConfirm = true;
      this.lastPrimaryCallContext = {
        source,
        label: contact.label
      };

      this.updateStatus(
        `${sourceLabel}已发起。返回页面后请确认 ${contact.label} 是否接通，必要时会继续联动 120。`,
        source === "auto" ? "danger" : "success",
        "等待接通确认"
      );
      return;
    }

    this.updateStatus(
      contact.key === "emergency120"
        ? "120 呼救已发起，请说明症状、人数、当前位置和周边地标。"
        : `${sourceLabel}已拨出，请保持电话畅通。`,
      contact.key === "emergency120" ? "danger" : "success",
      contact.key === "emergency120" ? "120 已联动" : "已建立联络"
    );
  },

  handleCallFailure(contact, source, options) {
    if (contact.key === this.primaryContact?.key && !options.skipFallback) {
      this.forwardToEmergency(`${contact.label} 未能成功发起呼叫。`, source === "auto");
      return;
    }

    this.setData({ autoCallTriggered: false });
    this.updateStatus("拨号未成功，请稍后重试或改拨 120。", "danger", "呼叫失败");
    wx.showToast({
      title: "拨号未成功，请稍后重试",
      icon: "none"
    });
  },

  promptConnectionResult() {
    if (!this.lastPrimaryCallContext) {
      return;
    }

    this.lastPrimaryCallContext = null;

    wx.showModal({
      title: "健康管家是否已接通？",
      content: "若主线路未接通，可立即联动 120，确保救援不中断。",
      confirmText: "已接通",
      cancelText: "联动120",
      success: ({ confirm, cancel }) => {
        if (confirm) {
          this.updateStatus(
            "已确认健康管家接通，请保持电话畅通并等待后续调度。",
            "success",
            "已建立联络"
          );
          return;
        }

        if (cancel) {
          this.forwardToEmergency("健康管家暂未接通，正在继续联动 120。", true);
        }
      }
    });
  },

  forwardToEmergency(reason, shouldAutoDial) {
    this.updateStatus(reason, "danger", "准备联动 120");

    if (shouldAutoDial) {
      this.placeCall(this.fallbackContact, "fallback", {
        skipAssessment: true,
        skipFallback: true
      });
      return;
    }

    wx.showModal({
      title: "联动 120",
      content: `${reason} 是否立即拨打 120？`,
      confirmText: "立即拨打",
      cancelText: "稍后处理",
      success: ({ confirm }) => {
        if (confirm) {
          this.placeCall(this.fallbackContact, "fallback", {
            skipAssessment: true,
            skipFallback: true
          });
          return;
        }

        this.updateStatus(
          "已取消 120 联动，如仍有不适，请尽快再次呼救。",
          "neutral",
          "等待人工操作"
        );
      }
    });
  }
});
