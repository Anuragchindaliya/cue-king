"use client"
import { CallToAction } from "@/components/CallToAction";
import { SoundCloudPlayer } from "@/components/SoundCloudPlayer";
import { VolumeControl } from "@/components/VolumeControl";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { usePathname } from "next/navigation"
const allowedRoutes = ["/", "/experience"]
const FABs = () => {
    const pathname = usePathname();
    if (!allowedRoutes.includes(pathname)) return null
    return (
        <>
            <VolumeControl />
            <SoundCloudPlayer />
            <WhatsAppFloat />
            <CallToAction />
        </>
    )
}

export default FABs