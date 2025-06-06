<template>
    <router-view />
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({
    link: [
        {
            rel: 'stylesheet',
            href: '/src/theme-centralotaku2/style.css'
        },
        {
            rel: 'icon',
            type: 'image/ico',
            href: '/src/theme-centralotaku2/favicon.ico'
        }
    ],
    script: []
})
</script>
