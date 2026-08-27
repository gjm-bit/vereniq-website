import type { Article, Lead, Module, Page } from "@/src/types/content";
export interface PageRepository { listPublished():Promise<Page[]>; list():Promise<Page[]>; getPublished(slug:string):Promise<Page|undefined>; publish(id:string):Promise<void> }
export interface ModuleRepository { listPublished():Promise<Module[]>; getPublished(slug:string):Promise<Module|undefined> }
export interface ArticleRepository { listPublished():Promise<Article[]>; getPublished(slug:string):Promise<Article|undefined> }
export interface LeadRepository { create(lead:Omit<Lead,"id"|"createdAt"|"status">):Promise<Lead>; list():Promise<Lead[]> }
