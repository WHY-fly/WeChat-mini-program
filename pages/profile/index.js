const {
  loadSession,
  clearSession,
  loadRelations,
  getSupplyOverview
} = require("../../utils/service-store");

Page({
  data: {
    currentSession: null,
    residentCount: 0,
    supplyCount: 0
  },

  onLoad() {
    this.refreshPage();
  },

  onShow() {
    this.refreshPage();
  },

  refreshPage() {
    const currentSession = loadSession();
    const relations = loadRelations();
    const supplyOverview = getSupplyOverview(currentSession);
    let residentCount = 0;

    if (currentSession) {
      if (currentSession.roleKey === "resident") {
        residentCount = 1;
      } else if (currentSession.roleKey === "manager") {
        residentCount = relations.filter(
          (item) => item.managerCode === currentSession.identityCode
        ).length;
      } else if (currentSession.roleKey === "doctor") {
        residentCount = relations.filter(
          (item) => item.doctorCode === currentSession.identityCode
        ).length;
      } else {
        residentCount = relations.length;
      }
    }

    this.setData({
      currentSession,
      residentCount,
      supplyCount: supplyOverview.tasks.length
    });
  },

  openRouteEditor() {
    wx.navigateTo({
      url: "/pages/route-editor/index?key=manager"
    });
  },

  goLogin() {
    wx.switchTab({
      url: "/pages/login/index"
    });
  },

  callEmergency120() {
    wx.makePhoneCall({
      phoneNumber: "120"
    });
  },

  logout() {
    clearSession();
    this.refreshPage();
    wx.showToast({
      title: "已退出登录",
      icon: "success"
    });

    wx.switchTab({
      url: "/pages/index/index"
    });
  }
});
