const { loadSession, getSupplyOverview, verifySupplyPackage } = require("../../utils/service-store");

const deliverySteps = [
  {
    title: "就近投送点匹配",
    description: "根据居民身份、社区位置和任务紧急度，自动推荐最近无人机投送点。"
  },
  {
    title: "无人机物资起飞",
    description: "由社区健康管家或调度台确认任务，完成药品与急救物资装载。"
  },
  {
    title: "到点核验签收",
    description: "居民出示身份码，并扫描物资包二维码或输入备用核验码完成签收。"
  },
  {
    title: "药品使用指导",
    description: "签收后按健康管家或医生建议服药，并继续保持首页联络。"
  }
];

Page({
  data: {
    currentSession: null,
    station: {
      name: "",
      address: "",
      range: "",
      eta: "",
      dropPoint: "",
      verifyMethod: ""
    },
    tasks: [],
    deliverySteps,
    verifyCodeInput: ""
  },

  onLoad() {
    this.refreshPage();
  },

  onShow() {
    this.refreshPage();
  },

  refreshPage() {
    const currentSession = loadSession();
    const supplyOverview = getSupplyOverview(currentSession);

    this.setData({
      currentSession,
      station: supplyOverview.station,
      tasks: supplyOverview.tasks.map((item) => ({
        ...item,
        statusClass: item.status === "已核验" ? "done" : "active"
      }))
    });
  },

  handleVerifyInput(event) {
    this.setData({
      verifyCodeInput: event.detail.value
    });
  },

  handleScanVerify() {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ["qrCode", "barCode"],
      success: ({ result }) => {
        this.confirmVerification(result);
      },
      fail: () => {
        wx.showToast({ title: "扫码取消或失败", icon: "none" });
      }
    });
  },

  handleVerifyByInput() {
    this.confirmVerification(this.data.verifyCodeInput);
  },

  confirmVerification(rawValue) {
    const verificationResult = verifySupplyPackage(rawValue);

    if (!verificationResult.success) {
      wx.showToast({
        title: verificationResult.message,
        icon: "none"
      });
      return;
    }

    this.setData({
      verifyCodeInput: ""
    });
    this.refreshPage();

    wx.showModal({
      title: "核验成功",
      content: `${verificationResult.task.packageName} 已完成签收核验，请继续查看药品使用指导。`,
      showCancel: false
    });
  }
});
