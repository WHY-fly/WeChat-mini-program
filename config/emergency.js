const emergencyContacts = [
  {
    key: "manager",
    label: "汶川县健康管家服务中心",
    phone: "待录入健康管家热线",
    description: "首接主线路，优先响应高山峡谷、独居老人和突发不适等求助。"
  },
  {
    key: "community",
    label: "汶川县社区协同服务点",
    phone: "待录入社区协同热线",
    description: "当主线路繁忙或需要网格协同时，由社区服务点补位联络。"
  },
  {
    key: "emergency120",
    label: "120急救电话",
    phone: "120",
    description: "主线路未确认接通时的急救兜底线路。"
  }
];

module.exports = {
  appTitle: "汶川县健康管家无人机医疗救援",
  appSubtitle: "面向山地乡镇、独居老人和突发不适场景的快速救援入口",
  autoCallDelaySeconds: 10,
  autoCallContactKey: "manager",
  emergencyContacts
};
