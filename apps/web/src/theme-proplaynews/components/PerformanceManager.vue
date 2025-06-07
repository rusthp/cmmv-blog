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
  
  // Adicionar suporte para srcset responsivo em imagens normais
  document.querySelectorAll('img:not([srcset])').forEach(img => {
    if (img.src && !img.srcset && !img.closest('.progressive-img-container')) {
      const src = img.src;
      if (src.match(/\.(jpg|jpeg|png|webp)$/i)) {
        // Apenas aplicar em imagens que não são SVG ou ícones
        if (img.naturalWidth > 200) {
          const width = img.naturalWidth || 1000;
          img.setAttribute('decoding', 'async');
        }
      }
    }
  });
};

// Preload apenas links críticos
const preloadCriticalPages = () => {
  if (!props.enablePreloading) return;
  
  // Preload apenas a página inicial e categorias principais
  const mainNavLinks = document.querySelectorAll('nav a[href^="/"]');
  let preloadCount = 0;
  
  mainNavLinks.forEach(link => {
    if (preloadCount < 3 && link.hostname === window.location.hostname && link.href && link.href.trim() !== '') {
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