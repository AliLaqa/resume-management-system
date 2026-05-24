export const AdminLogAction = {
  FormCreated: "form.created",
  FormUpdated: "form.updated",
  FormPublished: "form.published",
  ExportCsv: "export.csv",
  ExportXlsx: "export.xlsx",
  AdminAdded: "admin.added",
  AdminRemoved: "admin.removed",
  ApplicationViewed: "application.viewed",
  CvDownloaded: "cv.downloaded",
  ApplicationDeleted: "application.deleted",
} as const;

export type AdminLogActionType =
  (typeof AdminLogAction)[keyof typeof AdminLogAction];

