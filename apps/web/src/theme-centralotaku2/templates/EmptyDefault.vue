<template>
    <router-view />
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({
    link: [
        {
            rel: 'stylesheet',
            href: '/src/theme-default/style.css'
        },
        {
            rel: 'icon',
            type: 'image/ico',
            href: '/src/theme-default/favicon.ico'
        }
    ],
    script: []
})
</script>
