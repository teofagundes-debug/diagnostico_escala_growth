"use client";

import Link from "next/link";
import type {ReactNode} from "react";
import {useEffect,useState} from "react";
import {authorizedTrackingSearch,resolveBrowserAttribution} from "@/lib/campaignAttribution";
import {trackPageView} from "@/lib/metaPixel";

export function CampaignAttributionCapture(){useEffect(()=>{resolveBrowserAttribution();trackPageView()},[]);return null}

export function AttributionDiagnosticLink({children,className,ariaLabel}:{children:ReactNode;className?:string;ariaLabel?:string}){
 const [href,setHref]=useState('/diagnostico');
 useEffect(()=>setHref('/diagnostico'+authorizedTrackingSearch(location.search)),[]);
 return <Link href={href} className={className} aria-label={ariaLabel}>{children}</Link>;
}
