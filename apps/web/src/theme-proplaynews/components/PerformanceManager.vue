<template>
  <div style="display: none;"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';

// Props para configurações opcionais
const props = defineProps({
  enableLazyLoad: {
    type: Boolean,
    default: true
  },
  enablePreloading: {
    type: Boolean,
    default: true
  },
  preloadLinks: {
    type: Boolean,
    default: true
  },
  optimizeThirdParty: {
    type: Boolean,
    default: true
  }
});

// Atraso para elementos não críticos
const delayNonCritical = () => {
  setTimeout(() => {
    document.querySelectorAll('.critical-hidden').forEach(element => {
      element.classList.add('critical-visible');
    });
  }, 1500);
};

// Função para carregar links previamente
const preloadImportantPages = () => {
  if (!props.preloadLinks) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const links = entry.target.querySelectorAll('a');
        
        links.forEach(link => {
          if (link.hostname === window.location.hostname && !link.hasAttribute('data-no-preload')) {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.href = link.href;
            preloadLink.as = 'document';
            document.head.appendChild(preloadLink);
          }
        });
        
        observer.disconnect();
      }
    });
  });
  
  const navbar = document.querySelector('nav');
  if (navbar) {
    observer.observe(navbar);
  }
};

// Otimizar imagens com carregamento progressivo
const setupLazyLoading = () => {
  if (!props.enableLazyLoad) return;
  
  if ('loading' in HTMLImageElement.prototype) {
    // Navegador suporta lazy loading nativo
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('loading') && !img.hasAttribute('fetchpriority')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  } else {
    // Usar fallback para navegadores antigos
    if (window.IntersectionObserver) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
              }
            }
            img.classList.add('lazyloaded');
            imageObserver.unobserve(img);
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
};

// Otimizar scripts de terceiros
const delayThirdPartyScripts = () => {
  if (!props.optimizeThirdParty) return;
  
  const thirdPartyScripts = document.querySelectorAll('script[data-delay]');
  thirdPartyScripts.forEach(script => {
    const src = script.getAttribute('data-src');
    if (src) {
      setTimeout(() => {
        script.setAttribute('src', src);
      }, parseInt(script.getAttribute('data-delay') || '2000'));
    }
  });
};

// Gerenciar prioridade de recursos
const prioritizeResources = () => {
  // Carregar recursos essenciais de alto nível primeiro
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        // LCP identificado, podemos carregar outros recursos
        delayNonCritical();
        observer.disconnect();
      }
    }
  });
  
  if (window.PerformanceObserver) {
    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // Fallback se não suportar
      delayNonCritical();
    }
  } else {
    // Fallback para navegadores sem PerformanceObserver
    delayNonCritical();
  }
};

onMounted(() => {
  // Inicializar otimizações quando o componente for montado
  setupLazyLoading();
  prioritizeResources();
  
  // Usar requestIdleCallback para operações não urgentes quando o navegador estiver ocioso
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      preloadImportantPages();
      delayThirdPartyScripts();
    }, { timeout: 2000 });
  } else {
    // Fallback para navegadores sem requestIdleCallback
    setTimeout(() => {
      preloadImportantPages();
      delayThirdPartyScripts();
    }, 1000);
  }
});

onBeforeUnmount(() => {
  // Limpar observadores e temporizadores se necessário
});
</script> 