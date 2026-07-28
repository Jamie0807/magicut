<script setup lang="ts">
import type { WorkspaceBrand, WorkspaceNavItem } from '../../types/workspace';

import WorkspaceSidebarNavItem from './WorkspaceSidebarNavItem.vue';

defineProps<{
    brand: WorkspaceBrand;
    navItems: WorkspaceNavItem[];
}>();
</script>

<template>
    <aside
        class="relative h-full w-[260px] overflow-hidden bg-[#080911]/70 bg-[radial-gradient(ellipse_at_55%_30%,#582CFF30_0%,#BF40FF18_42%,transparent_72%),linear-gradient(180deg,#11131D_0%,#080911_48%,#05060A_100%)] backdrop-blur-[28px]"
    >
        <div
            aria-hidden="true"
            class="workspace-sidebar-aurora-layer pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-75 mix-blend-screen"
        >
            <div
                class="workspace-sidebar-aurora-horizontal h-full w-full bg-[linear-gradient(90deg,#582CFF00_0%,#582CFF55_24%,#BF40FF55_48%,#00F2FF33_72%,#582CFF00_100%)] blur-[44px]"
            />
        </div>
        <div
            class="pointer-events-none absolute inset-0 border-r border-white/5 bg-black/10"
        />
        <div
            class="pointer-events-none absolute top-[318px] left-[20px] h-[444px] w-[220px] rounded-[110px] bg-[radial-gradient(circle_at_center,#BF40FF42_0%,#582CFF24_38%,#00F2FF10_72%,#08091100_100%)] opacity-[0.72] blur-[38px]"
        />
        <div
            class="pointer-events-none absolute top-[542px] left-[33px] h-1 w-[196px] -rotate-[7deg] rounded-full bg-[linear-gradient(90deg,transparent_0%,#BF40FFCC_38%,#FF4DA6D9_62%,transparent_100%)] opacity-80 blur-[18px]"
        />

        <div
            class="absolute top-[30px] left-[20px] flex w-[230px] items-center gap-3"
        >
            <div
                class="grid h-12 w-12 place-items-center overflow-hidden rounded-[8px] bg-[linear-gradient(135deg,#F05F73_0%,#582CFF_100%)] text-[20px] font-black text-white shadow-[0_8px_24px_rgba(88,44,255,0.22)]"
                :aria-label="brand.name"
            >
                M
            </div>
            <div class="grid gap-0.5">
                <h1 class="text-[24px] leading-none font-[700] text-[#F5F7FA]">
                    {{ brand.name }}
                </h1>
                <p
                    class="font-['Geist'] text-[11px] leading-none font-normal text-[#6F7784]"
                >
                    {{ brand.description }}
                </p>
            </div>
        </div>

        <nav
            class="absolute top-[342px] left-0 ml-[26px] h-[428px] w-[120px] rounded-[60px] bg-[linear-gradient(180deg,#FFFFFF38_0%,#BF40FF66_48%,#582CFF44_100%)] p-px shadow-[0_18px_46px_rgba(0,0,0,0.5),0_0_38px_rgba(191,64,255,0.26),0_0_68px_rgba(88,44,255,0.14)]"
            aria-label="工作台导航"
        >
            <div
                class="flex h-full w-full flex-col items-center gap-[18px] rounded-[59px] bg-[#0D0F17E8] bg-[radial-gradient(ellipse_at_50%_42%,#BF40FF20_0%,#582CFF10_50%,#0D0F1700_100%),linear-gradient(180deg,#191B27F0_0%,#0D0F17F0_52%,#080910F0_100%)] px-[10px] py-[49px] backdrop-blur-[18px]"
            >
                <WorkspaceSidebarNavItem
                    v-for="item in navItems"
                    :key="item.label"
                    :item="item"
                />
            </div>
        </nav>
    </aside>
</template>
