import type { AnchorHTMLAttributes } from "react";
export function SiteLink({children, ...props}: AnchorHTMLAttributes<HTMLAnchorElement>){return <a {...props}>{children}</a>}
