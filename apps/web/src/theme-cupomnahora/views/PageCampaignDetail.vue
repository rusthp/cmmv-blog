<template>
    <div class="w-full relative">
        <div class="w-full max-w-[1200px] mx-auto px-4 py-8">
            <div v-if="loading" class="flex justify-center items-center py-10">
                <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600"></div>
                <span class="ml-3 text-gray-500">Carregando cupons...</span>
            </div>

            <div v-else-if="error" class="text-center py-10 bg-white rounded-lg p-6">
                <p class="text-lg text-red-500">{{ error }}</p>
                <p class="text-gray-500 mt-2">Não foi possível carregar os cupons. Tente novamente mais tarde.</p>
            </div>

            <div v-else-if="!campaign" class="text-center py-10 bg-white rounded-lg p-6">
                <p class="text-lg text-gray-600">Campanha não encontrada</p>
                <p class="text-gray-500 mt-2">A loja ou campanha que você está procurando não existe.</p>
                <a href="/desconto" class="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors">
                    Ver todas as lojas
                </a>
            </div>

            <div v-else class="bg-white rounded-lg p-6">
                <div class="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                    <div class="w-[160px] h-[125px] flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                        <img v-if="campaign.logo" :src="campaign.logo" :alt="campaign.name" width="160" height="125">
                        <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="flex flex-col text-center md:text-left">
                            <h1 v-if="campaign.seoTitle" class="text-3xl font-bold text-gray-800 mb-2">{{ campaign.seoTitle }}</h1>
                            <h1 v-else class="text-3xl font-bold text-gray-800 mb-2">Cupons de desconto {{ campaign.name }}</h1>
                            <p class="text-gray-500 mb-2 text-sm">Atualizado em {{ formatDate(new Date()) }}</p>
                            <h2 v-if="campaign.seoSubtitle" class="text-md text-gray-800 mb-2">{{ campaign.seoSubtitle }}</h2>

                            <p v-if="campaign.seoSmallText" class="text-gray-600 mt-2 text-sm">{{ campaign.seoSmallText }}</p>
                            <p v-else-if="campaign.description" class="text-gray-600 mt-2 text-sm">{{ campaign.description }}</p>
                            <p class="text-gray-700 mt-4">Encontramos {{ coupons.length }} cupons de desconto para {{ campaign.name }} →</p>
                        </div>
                    </div>
                </div>

                <!-- Filtro -->
                <div class="border-t border-b border-gray-200 py-4 mb-8">
                    <div class="flex flex-wrap gap-2">
                        <div class="text-gray-700 font-medium mr-2 flex items-center">Filtrar por:</div>
                        <button
                            @click="setFilter('all')"
                            class="px-3 py-1.5 rounded-md text-sm font-medium"
                            :class="activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                        >
                            Todos ({{ coupons.length }})
                        </button>
                        <button
                            @click="setFilter('codes')"
                            :disabled="codesCount === 0"
                            class="px-3 py-1.5 rounded-md text-sm font-medium"
                            :class="[
                                activeFilter === 'codes' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                                codesCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
                            ]"
                        >
                            Códigos ({{ codesCount }})
                        </button>
                        <button
                            @click="setFilter('offers')"
                            :disabled="offersCount === 0"
                            class="px-3 py-1.5 rounded-md text-sm font-medium"
                            :class="[
                                activeFilter === 'offers' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                                offersCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
                            ]"
                        >
                            Ofertas ({{ offersCount }})
                        </button>
                        <button
                            @click="setFilter('expired')"
                            :disabled="expiredCount === 0"
                            class="px-3 py-1.5 rounded-md text-sm font-medium"
                            :class="[
                                activeFilter === 'expired' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                                expiredCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
                            ]"
                        >
                            Expirados ({{ expiredCount }})
                        </button>
                    </div>
                </div>

                <!-- Lista de Cupons -->
                <div v-if="filteredCoupons.length === 0" class="text-center py-10">
                    <p class="text-lg text-gray-600">Nenhum cupom encontrado para este filtro.</p>
                    <p class="text-gray-500 mt-2">Tente outro filtro ou volte mais tarde.</p>
                </div>

                <div v-else class="space-y-6">
                    <div v-for="coupon in filteredCoupons" :key="coupon.id"
                        class="border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow duration-300 bg-white relative"
                        :class="{'expired-coupon': new Date(coupon.expiration) < new Date()}">

                        <!-- Etiqueta de desconto ou etiqueta de expirado -->
                        <div v-if="new Date(coupon.expiration) < new Date()"
                            class="absolute top-0 left-0 bg-gray-500 text-white px-4 py-2 rounded-tr-lg rounded-bl-lg font-bold">
                            Expirado
                        </div>
                        <div v-else
                            class="absolute top-0 left-0 bg-indigo-600 text-white px-4 py-2 rounded-tr-lg rounded-bl-lg font-bold">
                            <template v-if="isCurrencyDiscount(coupon.title)">
                                {{ extractDiscountValue(coupon.title) + ' OFF' }}
                            </template>
                            <template v-else-if="extractDiscountPercentage(coupon.title)">
                                {{ extractDiscountPercentage(coupon.title) }} OFF
                            </template>
                            <template v-else>
                                Produto
                            </template>
                        </div>

                        <div class="mt-6 md:ml-6">
                            <div class="flex flex-col md:flex-row">
                                <div class="flex-grow md:pr-6">
                                    <h3 class="text-lg md:text-xl font-semibold text-gray-800 mb-2">{{ coupon.title }}</h3>

                                    <!-- Cashback info -->
                                    <div v-if="coupon.cashbackPercentage" class="text-sm text-indigo-600 font-medium mb-2 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        + {{ coupon.cashbackPercentage }}% de cashback
                                        <span v-if="coupon.oldCashbackPercentage" class="text-gray-500 line-through ml-1">(era {{coupon.oldCashbackPercentage}}%)</span>
                                    </div>

                                    <p class="text-gray-600 text-sm mb-3">{{ coupon.description }}</p>

                                    <!-- Validade e verificação -->
                                    <div class="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 mb-4">
                                        <div class="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Verificado hoje</span>
                                        </div>
                                        <div class="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span v-if="new Date(coupon.expiration) < new Date()" class="text-red-500 font-medium">Expirado em {{ formatDate(coupon.expiration) }}</span>
                                            <span v-else>Válido até {{ formatDate(coupon.expiration) }}</span>
                                        </div>
                                        <div class="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span>{{ (coupon.views || 0) }} total de visualizações</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="md:w-48 flex-shrink-0 flex justify-center mt-4 md:mt-0">
                                    <button v-if="coupon.code"
                                        @click="openCouponModal(coupon)"
                                        class="coupon-button group relative w-full h-12 overflow-visible bg-white rounded-lg transition-all duration-200 hover:shadow-lg cursor-pointer"
                                        :class="[
                                            new Date(coupon.expiration) < new Date() ?
                                                'border-gray-400 bg-gray-100 expired' :
                                                'border-green-400 hover:border-green-500'
                                        ]">

                                        <!-- Para cupons expirados - mostrar código completo diretamente -->
                                        <div v-if="new Date(coupon.expiration) < new Date()"
                                            class="absolute inset-0 flex items-center justify-center px-4 bg-gray-700 text-white rounded-lg">
                                            <div class="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                <span class="font-mono text-sm font-bold">{{ coupon.code }}</span>
                                            </div>
                                        </div>

                                        <!-- Para cupons válidos - manter efeito de abinha -->
                                        <template v-else>
                                            <!-- Área do código completo (sempre visível por baixo) -->
                                            <div class="absolute inset-0 flex items-center justify-end px-4 z-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-400">
                                                <div class="font-mono text-sm font-bold px-3 py-2 border-green-400 text-green-800">
                                                    ...{{ coupon.code.slice(-4) }}
                                                </div>
                                            </div>

                                            <!-- Parte verde "Ver Cupom" que funciona como tampa -->
                                            <div class="coupon-cover absolute inset-0 flex items-center px-4 transition-all duration-200 ease-in-out z-10 bg-green-600 rounded-lg border border-green-400">
                                                <!-- Texto VER CUPOM -->
                                                <div class="flex items-center text-white">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                    </svg>
                                                    <span class="text-sm font-medium">Ver Cupom</span>
                                                </div>
                                            </div>
                                        </template>
                                    </button>

                                    <a v-else
                                        :href="coupon.link || coupon.linkRef || '#'"
                                        target="_blank"
                                        class="group relative w-full h-12 overflow-hidden bg-orange-500 to-red-600 border border-orange-400 rounded-lg transition-all duration-300 hover:shadow-lg hover:from-orange-600 hover:to-red-700 flex items-center justify-center">

                                        <div class="flex items-center text-white font-medium">
                                            <span class="text-sm text-white font-medium">VER OFERTA</span>
                                        </div>

                                        <!-- Efeito de brilho -->
                                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 transform -skew-x-12 translate-x-full group-hover:translate-x-full"></div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="campaign.seoLongText" class="mt-8 longText-content">
                    <div v-html="campaign.seoLongText" class="text-gray-600 text-md"></div>
                </div>
            </div>
        </div>
    </div>

    <CouponScratchModal
        :visible="isScratchModalOpen"
        :coupon="selectedCouponForScratch"
        @close="closeCouponModal" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onServerPrefetch } from 'vue';
import { useHead } from '@unhead/vue';
import { useRoute } from 'vue-router';
import { vue3 as affiliateVue3 } from '@cmmv/affiliate/client';
import { useSettingsStore } from '../../store/settings';
import { useCampaignsStore } from '../../store/campaigns';
import { useCouponsStore } from '../../store/coupons';
import CouponScratchModal from '../components/CouponScratchModal.vue';

// @ts-ignore
const isSSR = import.meta.env.SSR;
const route = useRoute();
const affiliateAPI = affiliateVue3.useAffiliate();
const settingsStore = useSettingsStore();
const campaignsStore = useCampaignsStore();
const couponsStore = useCouponsStore();

const settings = ref<any>(settingsStore.getSettings);
const campaign = ref<any>(null);
const coupons = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

if(!isSSR)
    campaign.value = window.__CMMV_DATA__["campaign"]

const activeFilter = ref('all');
const isScratchModalOpen = ref(false);
const selectedCouponForScratch = ref<any | null>(null);

const codesCount = computed(() => coupons.value.filter(coupon => coupon.code).length);
const offersCount = computed(() => coupons.value.filter(coupon => !coupon.code).length);
const expiredCount = computed(() => coupons.value.filter(coupon => new Date(coupon.expiration) < new Date()).length);

const totalViews = computed(() => coupons.value.reduce((acc, coupon) => acc + coupon.views, 0));

const filteredCoupons = computed(() => {
    if (activeFilter.value === 'all') return coupons.value;
    if (activeFilter.value === 'codes') return coupons.value.filter(coupon => coupon.code);
    if (activeFilter.value === 'offers') return coupons.value.filter(coupon => !coupon.code);
    if (activeFilter.value === 'expired') return coupons.value.filter(coupon => new Date(coupon.expiration) < new Date());
    if (activeFilter.value === 'views') return coupons.value.filter(coupon => coupon.views > 0);
    return coupons.value;
});

const headData = computed(() => ({
    title: `Cupons de Desconto ${campaign.value?.name || ''} | ${settings.value?.['blog.title'] || 'Site de Cupons'}`,
    meta: [
        {
            name: 'description',
            content: `Economize com ${coupons.value.length} cupons de desconto ${campaign.value?.name || ''} válidos. Códigos verificados e funcionando.`
        },
        {
            property: 'og:title',
            content: `Cupons de Desconto ${campaign.value?.name || ''} | ${settings.value?.['blog.title'] || 'Site de Cupons'}`
        },
        {
            property: 'og:description',
            content: `Economize com ${coupons.value.length} cupons de desconto ${campaign.value?.name || ''} válidos. Códigos verificados e funcionando.`
        },
        { property: 'og:type', content: 'website' },
        {
            property: 'og:url',
            content: `${settings.value?.['blog.url'] || 'https://cupomnahora.com.br'}/desconto/${route.params.slug}`
        },
        {
            name: 'views',
            content: `Total de visualizações: ${totalViews.value}`
        }
    ]
}));

useHead(headData);

const loadData = async () => {
    try {
        loading.value = true;
        error.value = null;
        const slug = route.params.slug;

        if (!slug) {
            error.value = 'Loja não encontrada';
            loading.value = false;
            return;
        }

        if(isSSR)
            campaign.value = await affiliateAPI.campaigns.getBySlug(slug as string);

        if (!campaign.value) {
            error.value = 'Loja não encontrada';
            loading.value = false;
            return;
        }

        let campaignCoupons = campaign.value.coupons;

        if (campaignCoupons && campaignCoupons.length > 0) {
            
            coupons.value = campaignCoupons.map((c: any) => {                
                // Converter views para número, independentemente do tipo
                const viewsAsNumber = parseInt(String(c.views), 10) || 0;
                
                return {
                    ...c,
                    campaignName: campaign.value.name,
                    campaignLogo: c.campaignLogo || campaign.value.logo,
                    views: viewsAsNumber
                };
            });
        }

        loading.value = false;
    } catch (err: any) {
        error.value = err.message || 'Erro ao carregar a loja e seus cupons';
        loading.value = false;
    }
};

onServerPrefetch(async () => {
    await loadData();
});

onMounted(() => {
    loadData();
});

const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const setFilter = (filter: string) => {
    activeFilter.value = filter;
};

const openCouponModal = (coupon: any) => {
    if (!coupon.campaignName || !coupon.campaignLogo) {
        if (campaign.value) {
            selectedCouponForScratch.value = {
                ...coupon,
                campaignName: campaign.value.name || 'Loja',
                campaignLogo: campaign.value.logo || null
            };
        } else {
            const relatedCampaign = campaignsStore.getCampaigns?.find(c => c.id === coupon.campaignId);

            selectedCouponForScratch.value = {
                ...coupon,
                campaignName: relatedCampaign?.name || coupon.campaignName || 'Loja',
                campaignLogo: relatedCampaign?.logo || coupon.campaignLogo || null
            };
        }
    } else {
        selectedCouponForScratch.value = { ...coupon };
    }

    isScratchModalOpen.value = true;

    // Incrementar a contagem de visualizações
    
    // Verificar se temos um ID disponível ou usar outra propriedade única
    if (coupon) {
        // Se não tiver ID, vamos usar o código como identificador único
        const identifier = coupon.id || coupon.code;
        if (identifier) {
            incrementCouponView(identifier, coupon);
        } else {
            console.error('Não foi possível identificar o cupom para incrementar visualizações:', coupon);
        }
    }

    if (coupon && coupon.code)
        window.open(window.location.href + `?display=${coupon.code}`, '_blank');

    if (coupon && coupon.deeplink)
        window.location.href = coupon.deeplink;
};

const closeCouponModal = () => {
    isScratchModalOpen.value = false;
    selectedCouponForScratch.value = null;
};

// Função para incrementar as visualizações do cupom
const incrementCouponView = async (couponId: string, coupon: any) => {
    try {
        if (!isSSR) {
            const result = await affiliateAPI.coupons.incrementView(couponId);

            if (result && result.success && result.views !== undefined) {
                // Atualizar o valor local para refletir imediatamente na UI
                // Garantir que views seja um número
                coupon.views = parseInt(String(result.views), 10) || 0;
                
                // Forçar atualização da UI - como estamos modificando um objeto dentro de um array
                const updatedCoupons = [...coupons.value];
                coupons.value = updatedCoupons;
            }
        }
    } catch (err) {
        console.error('Erro ao incrementar visualizações do cupom:', err);
    }
};

const extractDiscountPercentage = (title: string) => {
    if (!title) return null;

    const percentRegex = /(\d+)(\s*)(%|\spor\scento|\sporcento)/i;
    const match = title.match(percentRegex);

    if (match && match[1])
        return match[1] + '%';

    const discountRegex = /(\d+)(\s*)(de\sdesconto|desconto)/i;
    const discountMatch = title.match(discountRegex);

    if (discountMatch && discountMatch[1])
        return discountMatch[1] + '%';

    return null;
};

const isCurrencyDiscount = (title: string) => {
    if (!title) return false;
    const currencyRegex = /R\$\s*\d+[\.,]?\d*/i;
    return currencyRegex.test(title);
};

const extractDiscountValue = (title: string) => {
    if (!title) return 'Oferta';
    const currencyRegex = /(R\$\s*\d+[\.,]?\d*)/i;
    const match = title.match(currencyRegex);

    if (match && match[1])
        return match[1];

    return 'Oferta';
};
</script>

<style>
.longText-content :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1rem 0;
}

.longText-content :deep(iframe) {
    max-width: 100%;
    border-radius: 4px;
    margin: 1rem 0;
}

.longText-content :deep(table) {
    max-width: 100%;
    overflow-x: auto;
    display: block;
    border-collapse: collapse;
    margin: 1rem 0;
}

.longText-content :deep(table td),
.longText-content :deep(table th) {
    border: 1px solid #e5e5e5;
    padding: 0.5rem;
}

.longText-content :deep(pre) {
    max-width: 100%;
    overflow-x: auto;
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
}

.longText-content :deep(code) {
    white-space: pre-wrap;
    word-break: break-word;
    background-color: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.9em;
}

.longText-content :deep(blockquote) {
    border-left: 4px solid #0a5d28;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #666;
}

.longText-content :deep(h2),
.longText-content :deep(h3),
.longText-content :deep(h4),
.longText-content :deep(h5),
.longText-content :deep(h6) {
    margin-top: 2rem;
    margin-bottom: 1rem;
}

.longText-content :deep(p) {
    margin-bottom: 1rem;
    line-height: 1.7;
}

.longText-content :deep(ul),
.longText-content :deep(ol) {
    margin: 1rem 0;
    padding-left: 2rem;
}

.longText-content :deep(li) {
    margin-bottom: 0.5rem;
}

.longText-content :deep(a) {
    color: #0a5d28;
    text-decoration: underline;
}

.longText-content :deep(a:hover) {
    color: #064019;
}

/* Twitter/X embed styles */
.longText-content :deep(.twitter-embed) {
    margin: 1.5rem auto;
    max-width: 550px;
    position: relative;
    min-height: 200px;
}

.longText-content :deep(.twitter-embed)::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231da1f2'%3E%3Cpath d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.2;
}

.longText-content :deep(.twitter-embed iframe) {
    border: none !important;
    margin: 0 auto !important;
}

.featured-img {
    width: 100%;
    max-height: 500px;
    object-fit: cover;
    border-radius: 8px;
}

.post-title {
    word-wrap: break-word;
    hyphens: auto;
}

.tags-list {
    overflow-x: auto;
    padding-bottom: 4px;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.ad-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #ccc;
    border-radius: 4px;
}

/* Only hide the left sidebar on screens smaller than 1280px */
@media (max-width: 1280px) {
    .ad-sidebar-left {
        display: none;
    }
}

.coupon-button {
    position: relative;
    z-index: 1;

    border-radius: 6px 6px 3px 3px;
}

.coupon-button .coupon-cover {
    transition: all 0.3s ease-in-out;
    z-index: 10;
    right: 0;
    width: 70%;
}

.coupon-button .coupon-cover::after {
    display: none;
}

.coupon-button .coupon-cover::before {
    content: "";
    position: absolute;
    top: -5px;
    right: -28px;
    width: 40px;
    height: 55px;
    background: linear-gradient(36deg, #b1cea8, #c6e8b8 38%, #c9e0be 47%, #c0e1b3 51%, rgba(255,255,255,0) 54%);
    transform: rotate(35deg);
    transform-origin: center center;
    border-radius: 6px 6px 3px 3px;
    z-index: 12;
    transition: all 0.3s ease-in-out;
    display: block;
}

.coupon-button:hover .coupon-cover {
    width: 60%;
    box-shadow: 2px 0 8px rgba(0,0,0,0.15);
}

.coupon-button:hover .coupon-cover::before {
    top: 0px;
    right: -32px;
    transform: rotate(30deg);
    width: 44px;
    height: 55px;
}

.coupon-button.expired .coupon-cover {
    display: none !important;
}

.coupon-button.expired:hover .coupon-cover {
    display: none !important;
}

/* Estilos adicionais para cupons expirados */
.expired-coupon {
    background-color: #f3f4f6;
    opacity: 0.9;
    border-color: #ddd;
}

.expired-coupon h3,
.expired-coupon p {
    color: #374151;
}

.expired-coupon button,
.expired-coupon a {
    opacity: 0.9;
}
</style>
