const {
  getRoleOptions,
  getRoleByKey,
  normalizeIdentityCode,
  getIdentityByCode,
  loadSession,
  saveSession,
  clearSession
} = require("../../utils/service-store");

Page({
  data: {
    roleOptions: [],
    selectedRoleKey: "",
    identityCodeInput: "",
    identityProfile: null,
    name: "",
    phone: "",
    organization: "",
    agreementChecked: true,
    sessionReady: false,
    currentSession: null
  },

  onLoad() {
    this.setData({
      roleOptions: getRoleOptions()
    });
    this.refreshPageState();
  },

  onShow() {
    this.refreshPageState();
  },

  refreshPageState() {
    const currentSession = loadSession();

    this.setData({
      sessionReady: !!currentSession,
      currentSession
    });

    if (!currentSession) {
      this.setData({
        selectedRoleKey: "",
        identityCodeInput: "",
        identityProfile: null,
        name: "",
        phone: "",
        organization: ""
      });
      return;
    }

    this.setData({
      selectedRoleKey: currentSession.roleKey,
      identityCodeInput: currentSession.identityCode,
      identityProfile: getIdentityByCode(currentSession.identityCode),
      name: currentSession.name,
      phone: currentSession.phone,
      organization: currentSession.organization || currentSession.community || ""
    });
  },

  handleRoleSelect(event) {
    this.setData({
      selectedRoleKey: event.currentTarget.dataset.key
    });
  },

  handleIdentityInput(event) {
    this.setData({
      identityCodeInput: event.detail.value
    });
  },

  handleNameInput(event) {
    this.setData({
      name: event.detail.value
    });
  },

  handlePhoneInput(event) {
    this.setData({
      phone: event.detail.value
    });
  },

  handleOrganizationInput(event) {
    this.setData({
      organization: event.detail.value
    });
  },

  handleAgreementChange(event) {
    this.setData({
      agreementChecked: !!event.detail.value.length
    });
  },

  handleScanIdentity() {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ["qrCode", "barCode"],
      success: ({ result }) => {
        this.applyIdentityCode(result);
      },
      fail: () => {
        wx.showToast({ title: "扫码取消或失败", icon: "none" });
      }
    });
  },

  handleResolveIdentity() {
    this.applyIdentityCode(this.data.identityCodeInput);
  },

  handleEmergency120() {
    wx.makePhoneCall({
      phoneNumber: "120"
    });
  },

  applyIdentityCode(rawValue) {
    const normalizedCode = normalizeIdentityCode(rawValue);
    const identityProfile = getIdentityByCode(normalizedCode);

    if (!identityProfile) {
      wx.showToast({
        title: "未识别到有效身份码",
        icon: "none"
      });
      return;
    }

    this.setData({
      identityCodeInput: identityProfile.code,
      identityProfile,
      selectedRoleKey: identityProfile.roleKey,
      name: identityProfile.name || "",
      phone: identityProfile.phone || "",
      organization:
        identityProfile.organization || identityProfile.community || identityProfile.address || ""
    });
  },

  handleLogin() {
    const roleKey = this.data.selectedRoleKey;
    const role = getRoleByKey(roleKey);
    const identityCode = normalizeIdentityCode(this.data.identityCodeInput);
    const identityProfile = this.data.identityProfile || getIdentityByCode(identityCode);
    const name = this.data.name.trim();
    const phone = this.data.phone.trim();
    const organization = this.data.organization.trim();

    if (!roleKey) {
      wx.showToast({
        title: "请先选择身份",
        icon: "none"
      });
      return;
    }

    if (!identityProfile) {
      wx.showToast({
        title: "请先扫码识别身份码",
        icon: "none"
      });
      return;
    }

    if (roleKey !== identityProfile.roleKey) {
      wx.showToast({
        title: "所选身份与二维码角色不一致",
        icon: "none"
      });
      return;
    }

    if (!name || !phone || !organization) {
      wx.showToast({
        title: "请完善登录信息",
        icon: "none"
      });
      return;
    }

    if (!this.data.agreementChecked) {
      wx.showToast({
        title: "请先同意服务说明",
        icon: "none"
      });
      return;
    }

    const session = saveSession({
      roleKey,
      roleLabel: role.label,
      identityCode: identityProfile.code,
      qrValue: identityProfile.qrValue,
      name,
      phone,
      organization,
      community: identityProfile.community || "",
      address: identityProfile.address || "",
      title: identityProfile.title || role.label,
      serviceNote: identityProfile.serviceNote || "",
      stationKey: identityProfile.stationKey || ""
    });

    this.setData({
      sessionReady: true,
      currentSession: session
    });

    wx.showToast({
      title: "登录成功",
      icon: "success"
    });

    setTimeout(() => {
      wx.switchTab({
        url: "/pages/index/index"
      });
    }, 600);
  },

  handleLogout() {
    clearSession();
    this.setData({
      sessionReady: false,
      currentSession: null,
      selectedRoleKey: "",
      identityCodeInput: "",
      identityProfile: null,
      name: "",
      phone: "",
      organization: ""
    });

    wx.showToast({
      title: "已退出当前身份",
      icon: "success"
    });

    wx.switchTab({
      url: "/pages/index/index"
    });
  }
});
