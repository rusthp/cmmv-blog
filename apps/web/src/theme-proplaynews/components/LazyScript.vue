<template>
  <div ref="observerTarget"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  async: {
    type: Boolean,
    default: true
  },
  defer: {
    type: Boolean,
    default: false
  },
  crossorigin: {
    type: String,
    default: ''
  },
  integrity: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text/javascript'
  }
});

const loaded = ref(false);
const observerTarget = ref(null);
let observer = null;

const loadScript = () => {
  if (loaded.value || !document) return;
  
  // Verificar se o script já existe no DOM
  if (props.id && document.getElementById(props.id)) {
    loaded.value = true;
    return;
  }

  const script = document.createElement('script');
  script.src = props.src;
  script.async = props.async;
  script.defer = props.defer;
  script.type = props.type;
  
  if (props.id) script.id = props.id;
  if (props.crossorigin) script.crossOrigin = props.crossorigin;
  if (props.integrity) script.integrity = props.integrity;
  
  script.onload = () => {
    loaded.value = true;
  };
  
  document.head.appendChild(script);
};

onMounted(() => {
  if (window.IntersectionObserver) {
    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadScript();
        observer.disconnect();
      }
    }, {
      rootMargin: '200px 0px'
    });
    
    if (observerTarget.value) {
      observer.observe(observerTarget.value);
    }
  } else {
    // Fallback para navegadores que não suportam IntersectionObserver
    loadScript();
  }
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script> 