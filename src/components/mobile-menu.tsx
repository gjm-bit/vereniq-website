"use client";
import { useEffect, useState } from "react";
import { SiteLink as Link } from "@/src/components/site-link";
import { site } from "@/src/config/site";
import type { WebsiteHeaderAction } from "@/src/lib/public-cms";
// `actions` komt van Header() (server component) - dezelfde resolved lijst
// (generiek model of de hardcoded terugval) als de desktop-header, zodat
// het mobiele menu nooit uit de pas loopt met wat de beheerder heeft
// ingesteld (zichtbaarheid/label/link).
export function MobileMenu({ actions }: { actions: readonly WebsiteHeaderAction[] }){const [open,setOpen]=useState(false);useEffect(()=>{const close=(event:KeyboardEvent)=>event.key==="Escape"&&setOpen(false);addEventListener("keydown",close);return()=>removeEventListener("keydown",close)},[]);return <div className="mobile-menu"><button type="button" className="mobile-menu-button" aria-expanded={open} aria-controls="mobile-main-nav" onClick={()=>setOpen(value=>!value)}>{open?"Sluit menu":"Menu"}</button>{open&&<button className="mobile-menu-backdrop" aria-label="Sluit menu" onClick={()=>setOpen(false)}/>}<nav id="mobile-main-nav" className="nav-mobile mobile-menu-links" aria-label="Mobiele hoofdnavigatie" hidden={!open}>{site.nav.map(([name,href])=><Link key={href} href={href} onClick={()=>setOpen(false)}>{name}</Link>)}{actions.map((action)=>action.url.startsWith("/")?<Link key={action.actionKey} href={action.url} onClick={()=>setOpen(false)}>{action.label}</Link>:<a key={action.actionKey} href={action.url} onClick={()=>setOpen(false)}>{action.label}</a>)}</nav></div>}
