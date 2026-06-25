const {
  loadSession,
  getIdentityByCode,
  loadRelations,
  saveServiceRelation,
  normalizeIdentityCode
} = require("../../utils/service-store");

Page({
  data: {
    residentProfile: null,
    managerProfile: null,
    doctorProfile: null,
    residentCodeInput: "",
    managerCodeInput: "",
    doctorCodeInput: "",
    serviceScope: "",
    notes: "",
    relationCards: []
  },

  onLoad() {
    this.prefillBySession();
    this.refreshRelationCards();
  },

  onShow() {
    this.refreshRelationCards();
  },

  prefillBySession() {
    const session = loadSession();

    if (!session) {
      return;
    }

    const profile = getIdentityByCode(session.identityCode);

    if (!profile) {
      return;
    }

    if (session.roleKey === "resident") {
      this.setData({ residentProfile: profile, residentCodeInput: profile.code });
      return;
    }

    if (session.roleKey === "manager") {
      this.setData({ managerProfile: profile, managerCodeInput: profile.code });
      return;
    }

    if (session.roleKey === "doctor") {
      this.setData({ doctorProfile: profile, doctorCodeInput: profile.code });
    }
  },

  refreshRelationCards() {
    const relationCards = loadRelations().map((relation) => {
      const resident = getIdentityByCode(relation.residentCode);
      const manager = getIdentityByCode(relation.managerCode);
      const doctor = relation.doctorCode ? getIdentityByCode(relation.doctorCode) : null;

      return {
        ...relation,
        residentName: resident ? resident.name : relation.residentCode,
        managerName: manager ? manager.name : relation.managerCode,
        doctorName: doctor ? doctor.name : "待补充",
        residentMeta: resident ? resident.community || resident.address : "",
        managerMeta: manager ? manager.organization || manager.community : ""
      };
    });

    this.setData({ relationCards });
  },

  handleScopeInput(event) {
    this.setData({
      serviceScope: event.detail.value
    });
  },

  handleNotesInput(event) {
    this.setData({
      notes: event.detail.value
    });
  },

  handleScanIdentity(event) {
    const target = event.currentTarget.dataset.target;

    wx.scanCode({
      onlyFromCamera: false,
      scanType: ["qrCode", "barCode"],
      success: ({ result }) => {
        this.applyIdentity(target, result);
      },
      fail: () => {
        wx.showToast({ title: "扫码取消或失败", icon: "none" });
      }
    });
  },

  handleCodeInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [field]: event.detail.value
    });
  },

  handleResolveIdentity(event) {
    const target = event.currentTarget.dataset.target;
    const field = event.currentTarget.dataset.field;
    this.applyIdentity(target, this.data[field]);
  },

  applyIdentity(target, rawValue) {
    const profile = getIdentityByCode(normalizeIdentityCode(rawValue));

    if (!profile) {
      wx.showToast({
        title: "未识别到身份码",
        icon: "none"
      });
      return;
    }

    const roleMap = {
      resident: "resident",
      manager: "manager",
      doctor: "doctor"
    };

    if (profile.roleKey !== roleMap[target]) {
      wx.showToast({
        title: "身份类型与当前登记栏位不匹配",
        icon: "none"
      });
      return;
    }

    this.setData({
      [`${target}Profile`]: profile,
      [`${target}CodeInput`]: profile.code
    });
  },

  handleSaveRelation() {
    if (!this.data.residentProfile || !this.data.managerProfile) {
      wx.showToast({
        title: "请先识别居民和健康管家身份",
        icon: "none"
      });
      return;
    }

    saveServiceRelation({
      residentCode: this.data.residentProfile.code,
      managerCode: this.data.managerProfile.code,
      doctorCode: this.data.doctorProfile ? this.data.doctorProfile.code : "",
      serviceScope: this.data.serviceScope.trim() || "社区健康巡护",
      notes: this.data.notes.trim() || "建立基础健康管家服务关系。"
    });

    this.setData({
      serviceScope: "",
      notes: ""
    });
    this.refreshRelationCards();

    wx.showToast({
      title: "联系人关系已保存",
      icon: "success"
    });
  }
});
