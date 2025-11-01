<template>
    <div class="min-h-screen bg-gradient-to-b from-transparent to-black/20">
        <div class="container mx-auto px-4 py-12">
            <div class="max-w-4xl mx-auto">
                <!-- Header -->
                <div class="text-center mb-12">
                    <h1 class="text-4xl font-bold text-white mb-4 text-shadow">
                        Entre em Contato
                    </h1>
                    <p class="text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
                        Tem alguma dúvida, sugestão ou quer colaborar conosco? 
                        Envie sua mensagem que responderemos o mais breve possível!
                    </p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <!-- Contact Form -->
                    <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
                        <h2 class="text-2xl font-bold text-white mb-6 border-b-2 border-[#ffcc00] pb-2">
                            Envie sua Mensagem
                        </h2>
                        
                        <form @submit.prevent="submitForm" class="space-y-6">
                            <div>
                                <label for="name" class="block text-sm font-medium text-gray-200 mb-2">
                                    Nome *
                                </label>
                                <input
                                    v-model="form.name"
                                    type="text"
                                    id="name"
                                    required
                                    class="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffcc00] focus:border-transparent transition-all"
                                    placeholder="Seu nome completo"
                                />
                            </div>

                            <div>
                                <label for="email" class="block text-sm font-medium text-gray-200 mb-2">
                                    E-mail *
                                </label>
                                <input
                                    v-model="form.email"
                                    type="email"
                                    id="email"
                                    required
                                    class="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffcc00] focus:border-transparent transition-all"
                                    placeholder="seu@email.com"
                                />
                            </div>

                            <div>
                                <label for="subject" class="block text-sm font-medium text-gray-200 mb-2">
                                    Assunto *
                                </label>
                                <select
                                    v-model="form.subject"
                                    id="subject"
                                    required
                                    class="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffcc00] focus:border-transparent transition-all"
                                >
                                    <option value="">Selecione o assunto</option>
                                    <option value="Sugestão de Matéria">Sugestão de Matéria</option>
                                    <option value="Parceria">Parceria</option>
                                    <option value="Colaboração">Colaboração</option>
                                    <option value="Crítica/Feedback">Crítica/Feedback</option>
                                    <option value="Publicidade">Publicidade</option>
                                    <option value="Problema Técnico">Problema Técnico</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>

                            <div>
                                <label for="message" class="block text-sm font-medium text-gray-200 mb-2">
                                    Mensagem *
                                </label>
                                <textarea
                                    v-model="form.message"
                                    id="message"
                                    rows="6"
                                    required
                                    class="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffcc00] focus:border-transparent transition-all resize-vertical"
                                    placeholder="Escreva sua mensagem aqui..."
                                ></textarea>
                            </div>

                            <!-- Success/Error Messages -->
                            <div v-if="showMessage" class="p-4 rounded-lg" :class="messageType === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-200' : 'bg-red-500/20 border border-red-500/30 text-red-200'">
                                <p class="flex items-center">
                                    <svg v-if="messageType === 'success'" class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                    </svg>
                                    <svg v-else class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                    </svg>
                                    {{ message }}
                                </p>
                            </div>

                            <button
                                type="submit"
                                :disabled="isSubmitting"
                                class="w-full bg-gradient-to-r from-[#ffcc00] to-[#ffa500] text-[#333333] font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <span v-if="!isSubmitting" class="flex items-center justify-center">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                    </svg>
                                    Enviar Mensagem
                                </span>
                                <span v-else class="flex items-center justify-center">
                                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Enviando...
                                </span>
                            </button>
                        </form>
                    </div>

                    <!-- Contact Information -->
                    <div class="space-y-8">
                        <!-- Info Cards -->
                        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
                            <h2 class="text-2xl font-bold text-white mb-6 border-b-2 border-[#ffcc00] pb-2">
                                Informações de Contato
                            </h2>
                            
                            <div class="space-y-6">
                                <div class="flex items-start space-x-4">
                                    <div class="flex-shrink-0 w-10 h-10 bg-[#ffcc00] rounded-full flex items-center justify-center">
                                        <svg class="w-5 h-5 text-[#333333]" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-white">E-mail</h3>
                                        <p class="text-gray-300">proplaynews@gmail.com</p>
                                        <p class="text-sm text-gray-400">Respondemos em até 24 horas</p>
                                    </div>
                                </div>

                                <div class="flex items-start space-x-4">
                                    <div class="flex-shrink-0 w-10 h-10 bg-[#ffcc00] rounded-full flex items-center justify-center">
                                        <svg class="w-5 h-5 text-[#333333]" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clip-rule="evenodd"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-white">Sobre Nós</h3>
                                        <p class="text-gray-300">Portal de notícias gamer</p>
                                        <p class="text-sm text-gray-400">Cobertura completa do mundo dos games</p>
                                    </div>
                                </div>

                                <div class="flex items-start space-x-4">
                                    <div class="flex-shrink-0 w-10 h-10 bg-[#ffcc00] rounded-full flex items-center justify-center">
                                        <svg class="w-5 h-5 text-[#333333]" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-white">Horário de Atendimento</h3>
                                        <p class="text-gray-300">Segunda a Sexta</p>
                                        <p class="text-sm text-gray-400">9h às 18h (horário de Brasília)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- FAQ -->
                        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
                            <h2 class="text-2xl font-bold text-white mb-6 border-b-2 border-[#ffcc00] pb-2">
                                Perguntas Frequentes
                            </h2>
                            
                            <div class="space-y-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-white mb-2">Como posso sugerir uma matéria?</h3>
                                    <p class="text-gray-300 text-sm">Use o formulário ao lado selecionando "Sugestão de Matéria" no assunto e descreva sua ideia detalhadamente.</p>
                                </div>
                                
                                <div>
                                    <h3 class="text-lg font-semibold text-white mb-2">Vocês aceitam colaboradores?</h3>
                                    <p class="text-gray-300 text-sm">Sim! Envie uma mensagem com "Colaboração" no assunto e nos conte sobre sua experiência no mundo gamer.</p>
                                </div>
                                
                                <div>
                                    <h3 class="text-lg font-semibold text-white mb-2">Como fazer parcerias?</h3>
                                    <p class="text-gray-300 text-sm">Para parcerias comerciais, selecione "Parceria" no assunto e descreva sua proposta.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useHead } from '@unhead/vue';

// Form data
const form = ref({
    name: '',
    email: '',
    subject: '',
    message: ''
});

// UI states
const isSubmitting = ref(false);
const showMessage = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

// SEO
const headData = ref({
    title: 'Contato - ProPlayNews',
    meta: [
        { name: 'description', content: 'Entre em contato conosco. Sugestões, parcerias, colaborações e mais. Responderemos o mais breve possível!' },
        { name: 'keywords', content: 'contato, proplaynews, sugestões, parcerias, colaboração, games' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Contato - ProPlayNews' },
        { property: 'og:description', content: 'Entre em contato conosco. Sugestões, parcerias, colaborações e mais.' },
    ],
});

useHead(headData);

// Form submission
const submitForm = async () => {
    if (isSubmitting.value) return;
    
    isSubmitting.value = true;
    showMessage.value = false;
    
    try {
        // Create mailto link with form data
        const subject = encodeURIComponent(`[ProPlayNews] ${form.value.subject} - ${form.value.name}`);
        const body = encodeURIComponent(`
Nome: ${form.value.name}
E-mail: ${form.value.email}
Assunto: ${form.value.subject}

Mensagem:
${form.value.message}

---
Mensagem enviada através do formulário de contato do ProPlayNews
        `);
        
        const mailtoLink = `mailto:proplaynews@gmail.com?subject=${subject}&body=${body}`;
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Show success message
        messageType.value = 'success';
        message.value = 'Seu cliente de e-mail foi aberto! Complete o envio da mensagem.';
        showMessage.value = true;
        
        // Reset form
        form.value = {
            name: '',
            email: '',
            subject: '',
            message: ''
        };
        
        // Hide message after 5 seconds
        setTimeout(() => {
            showMessage.value = false;
        }, 5000);
        
    } catch (error) {
        console.error('Error:', error);
        messageType.value = 'error';
        message.value = 'Ocorreu um erro. Tente enviar diretamente para proplaynews@gmail.com';
        showMessage.value = true;
        
        setTimeout(() => {
            showMessage.value = false;
        }, 5000);
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(() => {
    // Any initialization code
});
</script>

<style scoped>
.text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

/* Custom select styling */
select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
}

select option {
    background-color: #1f2937;
    color: white;
}

/* Smooth animations */
.transition-all {
    transition: all 0.3s ease;
}

/* Form focus states */
input:focus, textarea:focus, select:focus {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 204, 0, 0.3);
}

/* Button hover effects */
button:hover:not(:disabled) {
    box-shadow: 0 8px 25px rgba(255, 204, 0, 0.4);
}
</style> 