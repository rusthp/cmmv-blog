<template>
  <div style="display: none;"></div>
</template>

<script setup>
import { onMounted } from 'vue';

// Props para configurações opcionais
const props = defineProps({
  enableLazyLoad: {
    type: Boolean,
    default: true
  },
  enablePreloading: {
    type: Boolean,
    default: false
  }
});

// Otimizar imagens com carregamento lazy loading nativo
const setupLazyLoading = () => {
  if (!props.enableLazyLoad) return;
  
  // Usar lazy loading nativo do navegador
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('loading') && !img.hasAttribute('fetchpriority')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  }
};

// Preload apenas links críticos
const preloadCriticalPages = () => {
  if (!props.enablePreloading) return;
  
  // Preload apenas a página inicial e categorias principais
  const mainNavLinks = document.querySelectorAll('nav a[href^="/"]');
  let preloadCount = 0;
  
  mainNavLinks.forEach(link => {
    if (preloadCount < 3 && link.hostname === window.location.hostname) {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'prefetch';
      preloadLink.href = link.href;
      document.head.appendChild(preloadLink);
      preloadCount++;
    }
  });
};

onMounted(() => {
  // Aguardar um pouco para o DOM estar totalmente carregado
  setTimeout(() => {
    setupLazyLoading();
    
    // Usar requestIdleCallback para operações não críticas
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        preloadCriticalPages();
      }, { timeout: 1000 });
    } else {
      setTimeout(preloadCriticalPages, 500);
    }
  }, 100);
});
</script> 