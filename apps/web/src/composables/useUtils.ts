import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

export function formatDate(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

export function stripHtml(html: string) {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
}

// Função para gerenciar o tema escuro/claro
export function useDarkMode() {
    const isDarkMode = ref(false);

    const toggleTheme = () => {
        isDarkMode.value = !isDarkMode.value;
        localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
        applyTheme();
    };

    const applyTheme = () => {
        if (isDarkMode.value) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const detectSystemTheme = () => {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    onMounted(() => {
        // Detectar tema do sistema ou usar o valor salvo no localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            isDarkMode.value = savedTheme === 'dark';
        } else {
            // Se não tiver um tema salvo, use a preferência do sistema
            isDarkMode.value = detectSystemTheme();
            localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
        }
        applyTheme();
        
        // Adicionar detector de mudanças de preferência do sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            if (!localStorage.getItem('theme')) {
                // Só atualiza automaticamente se o usuário não tiver escolhido um tema manualmente
                isDarkMode.value = event.matches;
                localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
                applyTheme();
            }
        });
    });

    onBeforeUnmount(() => {
        // Remover o detector de mudanças de tema para evitar memory leaks
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeMediaQuery.removeEventListener('change', () => {});
    });

    watch(isDarkMode, () => {
        applyTheme();
    });

    return {
        isDarkMode,
        toggleTheme
    };
}