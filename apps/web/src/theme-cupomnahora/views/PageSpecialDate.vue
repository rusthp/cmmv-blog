<template>
    <div v-if="specialDate && Object.keys(specialDate).length > 0" class="w-full max-w-[1200px] mx-auto px-4">
        <!-- Banner Principal -->
        <section class="mb-8 mt-4">
            <div class="banner-hero" :style="specialDate.image ? `background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${specialDate.image})` : 'background-color: #4338ca'">
                <div class="banner-content">
                    <div class="banner-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                        </svg>
                    </div>
                    <h1>Cupons de Desconto {{ specialDate.name }}</h1>
                    <p class="banner-description">
                        {{ specialDate.description }}
                    </p>
                </div>
            </div>
        </section>

        <!-- Intro Ofertas -->
        <section class="offers-intro mb-8">
            <p>
                Economize nas compras com <strong>{{ campaigns.length || '0' }} lojas</strong> com cupons de desconto para {{ specialDate.name }}.
                Encontre os melhores cupons, promoções e ofertas exclusivas selecionados para esta data especial.
            </p>
        </section>

        <div class="container mx-auto md:px-0 px-2 pb-12">
            <!-- Lojas da Data Especial -->
            <section class="mb-12">
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-2xl font-bold text-gray-800">Lojas para {{ specialDate.name }}</h2>
                    <a href="/desconto" class="text-indigo-600 hover:text-indigo-800 font-medium" aria-label="Ver todas as lojas">Ver todas</a>
                </div>

                <div v-if="loading" class="flex justify-center items-center py-10">
                    <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600"></div>
                </div>

                <div v-else-if="campaigns.length === 0" class="no-offers">
                    <div class="no-offers-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <h3>Nenhuma oferta disponível</h3>
                    <p>Não há campanhas disponíveis para {{ specialDate.name }} no momento. Volte em breve para novas ofertas!</p>
                </div>

                <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <a
                        v-for="campaign in campaigns.slice(0, 18)"
                        :key="campaign.id"
                        :href="`/desconto/${campaign.slug}`"
                        :aria-label="campaign.name"
                        :title="campaign.name"
                        class="store-card bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center hover:shadow-lg transition-all"
                    >
                        <div class="text-center">
                            <div class="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                                <img v-if="campaign.logo"
                                     :src="campaign.logo"
                                     :data-src="campaign.logo"
                                     :alt="campaign.name"
                                     class="max-w-full max-h-full"
                                     loading="lazy" width="64" height="64"
                                     :aria-label="campaign.name">
                                <div v-else class="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 class="text-sm font-medium text-gray-800">{{ campaign.name }}</h3>
                            <p class="text-xs text-gray-500">{{ campaign.couponCount || 0 }} cupons</p>
                        </div>
                    </a>
                </div>
            </section>



            <!-- Todos os Cupons da Data Especial -->
            <section id="all-coupons" class="mb-12" v-if="allCoupons.length > 0">
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-2xl font-bold text-gray-800">Todos os cupons para {{ specialDate.name }}</h2>
                </div>

                <div v-if="loading" class="flex justify-center items-center py-10">
                    <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-green-600"></div>
                </div>
                <div v-else-if="error" class="text-center py-10 text-red-500">
                    Ocorreu um erro ao carregar os cupons. Tente novamente mais tarde.
                </div>
                <div v-else-if="allCoupons.length === 0" class="text-center py-10 text-gray-500">
                    Nenhum cupom encontrado para esta data especial.
                </div>
                <div v-else class="space-y-4">
                    <div v-for="coupon in allCoupons" :key="coupon.id"
                         class="bg-white border border-gray-200 rounded-lg p-4 md:p-6 flex flex-col md:flex-row items-center hover:shadow-lg transition-shadow duration-300">

                        <div class="w-24 h-16 md:w-32 md:h-20 flex-shrink-0 mb-4 md:mb-0 md:mr-6 flex items-center justify-center">
                            <a :href="coupon.campaignSlug ? `/desconto/${coupon.campaignSlug}` : '#'" class="block" :aria-label="coupon.campaignName">
                                <img v-if="coupon.campaignLogo"
                                     :src="coupon.campaignLogo"
                                     :data-src="coupon.campaignLogo"
                                     :alt="coupon.campaignName"
                                     class="max-w-full max-h-full object-contain rounded"
                                     loading="lazy" width="102" height="80"
                                     :aria-label="coupon.campaignName">
                                <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center rounded-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                            </a>
                        </div>

                        <div class="flex-grow text-center md:text-left">
                            <h3 class="text-lg md:text-xl font-semibold text-gray-800 mb-1">{{ coupon.title }}</h3>
                            <p v-if="coupon.cashbackPercentage" class="text-sm text-green-600 font-medium mb-1">
                                + {{ coupon.cashbackPercentage }}% de cashback
                                <span v-if="coupon.oldCashbackPercentage" class="text-gray-500 line-through">(era {{coupon.oldCashbackPercentage}}%)</span>
                            </p>
                            <p class="text-gray-600 text-sm mb-2 line-clamp-2">{{ coupon.description }}</p>
                            <p class="text-xs text-gray-500">
                                <span v-if="coupon.verifiedToday">Verificado hoje</span>
                                <span v-if="coupon.verifiedToday && coupon.views" class="mx-1">•</span>
                                <span v-if="coupon.views">{{ coupon.views || 0 }} total de visualizações</span>
                            </p>
                        </div>

                        <div class="mt-4 md:mt-0 md:ml-6 flex-shrink-0 w-full md:w-48">
                            <button v-if="coupon.code"
                                @click="openScratchModal(coupon)"
                                class="coupon-button group relative w-full h-12 overflow-visible bg-white border border-gray-300 rounded-lg transition-all duration-200 hover:shadow-lg"
                                :aria-label="coupon.title"
                                :class="[
                                    new Date(coupon.expiration) < new Date() ?
                                        'border-gray-400 bg-gray-100 expired' :
                                        'border-green-400 hover:border-green-500'
                                ]"
                                :title="coupon.title"
                            >
                                <div class="absolute inset-0 flex items-center justify-end px-4 z-5"
                                    :class="[new Date(coupon.expiration) < new Date() ?
                                        'bg-gray-100' :
                                        'bg-gradient-to-r from-green-50 to-emerald-50']">
                                    <div class="font-mono text-sm font-bold px-3 py-2"
                                        :class="[new Date(coupon.expiration) < new Date() ?
                                            'border-gray-400 text-gray-600' :
                                            'border-green-400 text-green-800']">
                                        ...{{ coupon.code.slice(-4) }}
                                    </div>
                                </div>

                                <div class="coupon-cover absolute inset-0 flex items-center px-4 transition-all duration-200 ease-in-out z-10"
                                    :class="[new Date(coupon.expiration) < new Date() ?
                                        'bg-gray-400' :
                                        'bg-green-600']">

                                    <div class="flex items-center text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        <span class="text-sm font-medium">Ver Cupom</span>
                                    </div>
                                </div>
                            </button>
                            <a v-else
                               :href="coupon.linkRef || (coupon.campaignSlug ? `/desconto/${coupon.campaignSlug}/${coupon.id}` : '#')"
                               target="_blank"
                               class="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 text-center w-full">
                                Ver Desconto
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
    <div v-else class="loading">
        <div class="loading-spinner"></div>
        <p>Carregando ofertas especiais...</p>
    </div>

    <CouponScratchModal
        :visible="isScratchModalOpen"
        :coupon="selectedCouponForScratch"
        @close="closeScratchModal" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onServerPrefetch } from 'vue';
import { useRoute } from 'vue-router';
import { vue3 as affiliateVue3 } from '@cmmv/affiliate/client';
import { useCampaignsStore } from '../../store/campaigns';
import { useCouponsStore } from '../../store/coupons';
import { useSpecialDatesStore } from '../../store/specialdates';
import CouponScratchModal from '../components/CouponScratchModal.vue';

const route = useRoute();
const slug = route.params.slug as string;

const campaignsStore = useCampaignsStore();
const couponsStore = useCouponsStore();
const specialDatesStore = useSpecialDatesStore();
const affiliateAPI = affiliateVue3.useAffiliate();

const specialDate = computed(() => specialDatesStore.getSpecialDateBySlug(slug));
const campaigns = computed(() => campaignsStore.getCampaignsBySpecialDateSlug(slug));
const allCoupons = computed(() => (couponsStore.getCouponsBySpecialDateSlug(slug) || { all: [] }).all);
const featuredCoupons = computed(() => (couponsStore.getCouponsBySpecialDateSlug(slug) || { featured: [] }).featured);

const loading = ref(true);
const error = ref<any>(null);
const isScratchModalOpen = ref(false);
const selectedCouponForScratch = ref<any | null>(null);

const loadData = async () => {
    try {
        if (!slug) return;
        loading.value = true;
        error.value = null;

        const dateData = await affiliateAPI.dates.getBySlug(slug);

        if (!dateData || !dateData.id) {
            error.value = 'Data especial não encontrada.';
            specialDatesStore.setSpecialDateForSlug(slug, {});
            campaignsStore.setCampaignsForSpecialDate(slug, []);
            couponsStore.setCouponsForSpecialDate(slug, { featured: [], all: [] });
            return;
        }

        specialDatesStore.setSpecialDateForSlug(slug, dateData);

        const campaignsData = await affiliateAPI.campaigns.getBySpecialDate(dateData.id);
        const campaignsList = (campaignsData && typeof campaignsData === 'object' && !Array.isArray(campaignsData))
            ? Object.values(campaignsData)
            : (campaignsData || []);

        if (campaignsList.length > 0) {
            const campaignsWithCounts = await Promise.all(
                campaignsList.map(async (campaign: any) => {
                    try {
                        const couponCount = await affiliateAPI.coupons.getCountByCampaignId(campaign.id);
                        return { ...campaign, couponCount: couponCount?.count || 0 };
                    } catch {
                        return { ...campaign, couponCount: 0 };
                    }
                })
            );

            campaignsStore.setCampaignsForSpecialDate(slug, campaignsWithCounts);

            const couponPromises = campaignsWithCounts.map(async (campaign: any) => {
                if (campaign.couponCount > 0) {
                    const campaignCoupons = await affiliateAPI.coupons.getByCampaignId(campaign.id);
                    return (campaignCoupons || []).map((coupon: any) => ({
                        ...coupon,
                        campaignName: campaign.name,
                        campaignLogo: campaign.logo,
                        campaignSlug: campaign.slug,
                        views: parseInt(String(coupon.views), 10) || 0
                    }));
                }
                return [];
            });

            const couponResults = await Promise.all(couponPromises);
            const flatCoupons = couponResults.flat();

            const sortedCoupons = flatCoupons.sort((a, b) => (b.views || 0) - (a.views || 0));
            couponsStore.setCouponsForSpecialDate(slug, {
                featured: sortedCoupons.slice(0, 10),
                all: sortedCoupons
            });
        } else {
            campaignsStore.setCampaignsForSpecialDate(slug, []);
            couponsStore.setCouponsForSpecialDate(slug, { featured: [], all: [] });
        }
    } catch (err: any) {
        error.value = err;
        console.error("Erro geral ao carregar dados:", err);
    } finally {
        loading.value = false;
    }
};

const openScratchModal = (coupon: any) => {
    if (!coupon.campaignName || !coupon.campaignLogo) {
        const relatedCampaign = campaigns.value.find(c => c.id === coupon.campaignId);
        selectedCouponForScratch.value = {
            ...coupon,
            campaignName: relatedCampaign?.name || coupon.campaignName || 'Loja',
            campaignLogo: relatedCampaign?.logo || coupon.campaignLogo || null
        };
    } else {
        selectedCouponForScratch.value = coupon;
    }
    isScratchModalOpen.value = true;
    if (coupon && (coupon.id || coupon.code)) {
        incrementCouponView(coupon.id || coupon.code, coupon);
    }
    if (coupon && coupon.code) window.open(window.location.href + `?display=${coupon.code}`, '_blank');
    if (coupon && coupon.deeplink) window.location.href = coupon.deeplink;
};

const incrementCouponView = async (couponId: string, coupon: any) => {
    try {
        const result = await affiliateAPI.coupons.incrementView(couponId);
        if (result && result.success && result.views !== undefined) {
            const updatedCoupon = { ...coupon, views: parseInt(String(result.views), 10) || 0 };

            const currentCoupons = couponsStore.getCouponsBySpecialDateSlug(slug);
            if (currentCoupons) {
                const updateList = (list: any[]) => list.map(c => (c.id === couponId ? updatedCoupon : c));
                couponsStore.setCouponsForSpecialDate(slug, {
                    featured: updateList([...currentCoupons.featured]),
                    all: updateList([...currentCoupons.all]),
                });
            }
        }
    } catch (err) {
        console.error('Erro ao incrementar visualizações do cupom:', err);
    }
};

const closeScratchModal = () => {
    isScratchModalOpen.value = false;
    selectedCouponForScratch.value = null;
};

onServerPrefetch(async () => {
    await loadData();
});

onMounted(async () => {
    if (!specialDate.value) {
        await loadData();
    } else {
        loading.value = false;
    }
});
</script>

<style scoped>
.banner-hero {
    position: relative;
    width: 100%;
    height: 300px;
    background-size: cover;
    background-position: center;
    border-radius: 16px;
    margin-bottom: 2rem;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: hidden;
}

.banner-content {
    max-width: 800px;
    padding: 2rem;
    z-index: 2;
}

.banner-icon {
    background-color: rgba(255, 255, 255, 0.2);
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
}

.banner-hero h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.banner-description {
    font-size: 1.2rem;
    opacity: 0.9;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.5;
}

.offers-intro {
    background-color: #f7f9fc;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    font-size: 1.1rem;
    color: #4a5568;
    line-height: 1.6;
}

.offers-intro strong {
    color: #4338ca;
    font-weight: 600;
}

.no-offers {
    background-color: #f7f9fc;
    border-radius: 12px;
    padding: 3rem 2rem;
    text-align: center;
    margin-bottom: 2rem;
}

.no-offers-icon {
    width: 60px;
    height: 60px;
    background-color: #edf2f7;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    color: #718096;
}

.no-offers h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 0.5rem;
}

.no-offers p {
    color: #718096;
    max-width: 500px;
    margin: 0 auto;
}

.loading {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #718096;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #edf2f7;
    border-radius: 50%;
    border-top-color: #6366f1;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.store-card:hover {
    transform: translateY(-2px);
}

@media (max-width: 768px) {
    .banner-hero {
        height: auto;
        padding: 3rem 1rem;
    }

    .banner-hero h1 {
        font-size: 1.8rem;
    }
}
</style>