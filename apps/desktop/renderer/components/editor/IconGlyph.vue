<script setup lang="ts">
import type { EditorIconName } from '../../types/editor-screen';

const iconPaths: Record<EditorIconName, string> = {
    'arrow-down': 'M12 5v14m0 0 6-6m-6 6-6-6',
    'arrow-up': 'M12 19V5m0 0-7 7m7-7 7 7',
    'audio-lines': 'M2 10v3m4-7v11m4-14v18m4-13v7m4-10v13m4-8v3',
    captions: 'M4 6h16v12H4V6Zm4 5h4m2 0h2M8 14h2m3 0h3',
    'chevron-down': 'm6 9 6 6 6-6',
    'chevron-up': 'm18 15-6-6-6 6',
    check: 'M20 6 9 17l-5-5',
    download: 'M12 4v12m0 0 5-5m-5 5-5-5M5 20h14',
    ellipsis: 'M5 12h.01M12 12h.01M19 12h.01',
    folder: 'M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z',
    gauge: 'M12 21a9 9 0 1 0-9-9m9 9a9 9 0 0 0 9-9m-9 9v-4m5.7-7.7-2.8 2.8M21 12h-4M7.1 15.9l2.8-2.8',
    house: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3v-10.5Z',
    image: 'M4 5h16v14H4V5Zm3 10 4-4 3 3 2-2 3 3M8 9h.01',
    link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
    'list-video':
        'M3 6.5A1.5 1.5 0 0 1 4.5 5H15a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 15 19H4.5A1.5 1.5 0 0 1 3 17.5v-11Zm16 2.25 2.5-1.75v9L19 14.25V8.75ZM6 9h7M6 12h5M6 15h6',
    magnet: 'M6 4h4v8a2 2 0 0 0 4 0V4h4v8a6 6 0 0 1-12 0V4Zm0 0v4m12-4v4',
    maximize: 'M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4',
    'maximize-2': 'M8 4H4v4m12-4h4v4M4 20h4v-4m12 4v-4h-4',
    mic: 'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-7 8a7 7 0 0 0 14 0M12 18v3',
    minus: 'M5 12h14',
    music: 'M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z',
    pause: 'M8 5v14M16 5v14',
    play: 'M8 5v14l11-7-11-7Z',
    plus: 'M5 12h14M12 5v14',
    'redo-2': 'm15 14 5-5-5-5m5 5H9.5a5.5 5.5 0 0 0 0 11H13',
    scissors:
        'M4 7a3 3 0 1 0 3-3 3 3 0 0 0-3 3Zm0 10a3 3 0 1 0 3-3 3 3 0 0 0-3 3Zm6-5 9-7M10 12l9 7',
    send: 'M4 12 20 4l-6 16-3-7-7-1Z',
    sparkles:
        'M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 16l-1.7-5L6 9.3l4.3-1.7L12 3Zm6.5 10 .9 2.2 2.1.8-2.1.8-.9 2.2-.9-2.2-2.1-.8 2.1-.8.9-2.2ZM5.5 13l.8 2 1.9.7-1.9.7-.8 2-.8-2-1.9-.7 1.9-.7.8-2Z',
    'trash-2': 'M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v5m4-5v5',
    upload: 'M12 16V4m0 0 5 5m-5-5-5 5M5 20h14',
    'undo-2': 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
    'volume-2': 'M11 5 6 9H3v6h3l5 4V5Zm6 3a4 4 0 0 1 0 8',
    x: 'M18 6 6 18M6 6l12 12',
    volume: 'M5 10v4h4l5 4V6L9 10H5Zm12-1a4 4 0 0 1 0 6'
};

withDefaults(
    defineProps<{
        name: EditorIconName;
        className?: string;
    }>(),
    {
        className: 'h-4 w-4'
    }
);
</script>

<template>
    <svg
        :class="className"
        :data-icon-name="name"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <path :d="iconPaths[name]" />
    </svg>
</template>
