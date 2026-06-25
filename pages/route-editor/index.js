const { loadEmergencyState, saveContactSettings } = require("../../utils/emergency-store");

function sanitizePhoneNumber(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

Page({
  data: {
    routeKey: "",
    label: "",
    phone: "",
    description: "",
    isPrimary: false,
    canSetPrimary: true,
    saveButtonText: "保存线路设置"
  },

  onLoad(options) {
    this.routeKey = options.key || "";
    this.loadRoute();
  },

  loadRoute() {
    const { contacts } = loadEmergencyState();
    const contact = contacts.find((item) => item.key === this.routeKey);

    if (!contact) {
      wx.showToast({
        title: "未找到线路信息",
        icon: "none"
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 500);
      return;
    }

    const canSetPrimary = contact.key !== "emergency120";

    this.setData({
      routeKey: contact.key,
      label: contact.label,
      phone: contact.phone,
      description: contact.description,
      isPrimary: canSetPrimary ? !!contact.isPrimary : false,
      canSetPrimary,
      saveButtonText: canSetPrimary ? "保存线路设置" : "返回上一页"
    });
  },

  handleLabelInput(event) {
    this.setData({ label: event.detail.value });
  },

  handlePhoneInput(event) {
    this.setData({ phone: event.detail.value });
  },

  handleDescriptionInput(event) {
    this.setData({ description: event.detail.value });
  },

  handlePrimaryChange(event) {
    this.setData({ isPrimary: event.detail.value });
  },

  handleSave() {
    if (!this.data.canSetPrimary) {
      wx.navigateBack();
      return;
    }

    const label = this.data.label.trim();
    const phone = sanitizePhoneNumber(this.data.phone);
    const description = this.data.description.trim();

    if (!label) {
      wx.showToast({
        title: "请输入线路名称",
        icon: "none"
      });
      return;
    }

    if (!phone || phone.length < 3 || phone.length > 20) {
      wx.showToast({
        title: "请输入有效电话",
        icon: "none"
      });
      return;
    }

    if (!description) {
      wx.showToast({
        title: "请输入线路说明",
        icon: "none"
      });
      return;
    }

    saveContactSettings(
      this.data.routeKey,
      {
        label,
        phone,
        description
      },
      this.data.isPrimary
    );

    wx.showToast({
      title: "线路已保存",
      icon: "success"
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 600);
  }
});
