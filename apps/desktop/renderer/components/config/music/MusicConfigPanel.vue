<script setup lang="ts">
import { musicConfigPanel } from '../../../constants/config';

import ConfigHeader from '../shared/ConfigHeader.vue';
import ConfigPanelShell from '../shared/ConfigPanelShell.vue';
import ConfigSectionShell from '../shared/ConfigSectionShell.vue';
</script>

<template>
    <ConfigPanelShell class-name="w-[320px]" content-class-name="p-[16px]">
        <ConfigHeader
            :title="musicConfigPanel.header.title"
            :subtitle="musicConfigPanel.header.subtitle"
            title-class-name="text-[20px] leading-none font-[800]"
            subtitle-class-name="text-[11px] leading-none font-semibold text-[#6F7784]"
            class-name="text-left"
        />
        <ConfigSectionShell class-name="mt-[14px]">
            <ConfigHeader
                :title="musicConfigPanel.section.title"
                :subtitle="musicConfigPanel.section.subtitle"
                class-name="text-left"
                subtitle-class-name="text-[11px] leading-none font-semibold text-[#6F7784]"
            />
        </ConfigSectionShell>
    </ConfigPanelShell>
</template>
