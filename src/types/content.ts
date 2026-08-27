export type ContentStatus = "draft" | "published" | "archived";
export type Module = { id:string; slug:string; name:string; shortDescription:string; longDescription:string; status:ContentStatus; icon:string; features:string[]; benefits:string[]; targetGroups:string[]; sortOrder:number; seoTitle:string; seoDescription:string; published:boolean; createdAt:string; updatedAt:string };
export type Article = { id:string; slug:string; title:string; excerpt:string; content:string; author:string; category:string; tags:string[]; status:ContentStatus; publishedAt:string; updatedAt:string; seoTitle:string; seoDescription:string };
export type Page = { id:string; siteId:string; title:string; slug:string; status:ContentStatus; seoTitle:string; seoDescription:string; updatedAt:string };
export type Lead = { id:string; kind:"contact"|"demo"; name:string; organization:string; email:string; subject?:string; message?:string; createdAt:string; status:"new"|"reviewed" };
