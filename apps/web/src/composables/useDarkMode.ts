import { ref, onMounted, watch } from 'vue';

export function useDarkMode() {
  const isDarkMode = ref(false);

  const updateTheme = (darkMode: boolean) => {
    isDarkMode.value = darkMode;
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleTheme = () => {
    updateTheme(!isDarkMode.value);
  };

  onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      updateTheme(savedTheme === 'dark');
    } else {
      // Opcional: detectar preferência do sistema
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      updateTheme(prefersDark);
    }
  });

  // Opcional: observar mudanças na preferência do sistema
  // Isso garante que se o usuário mudar a preferência do OS enquanto a página está aberta,
  // e não tiver uma preferência salva no localStorage, o tema da página se adapte.
  if (typeof window !== 'undefined' && window.matchMedia) {
    watch(() => window.matchMedia('(prefers-color-scheme: dark)').matches, (matches) => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) { // Apenas atualiza se não houver preferência salva
            updateTheme(matches);
      }
    });
  }

  return {
    isDarkMode,
    toggleTheme,
  };
} 