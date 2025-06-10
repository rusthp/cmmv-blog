<template>
    <li class="rounded-md overflow-hidden">
        <div class="flex items-center justify-between p-1.5 sm:p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800/50 transition-colors group">
            <a :href="`/category/${category.slug}`" class="text-neutral-700 dark:text-neutral-300 group-hover:text-red-600 dark:group-hover:text-red-500 flex items-center flex-grow truncate" :aria-label="category.name">
                <span class="truncate mr-1.5 sm:mr-2 text-sm sm:text-base">{{ category.name }}</span>
                <span class="text-xs text-neutral-500 dark:text-neutral-400">({{ category.postCount }})</span>
            </a>
            <button v-if="hasChildren" @click.stop="toggle" class="ml-1 sm:ml-2 p-0.5 sm:p-1 rounded-md focus:outline-none text-neutral-500 group-hover:text-red-500" aria-label="Expand category">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 sm:h-4 sm:w-4 transform transition-transform duration-200" :class="{ 'rotate-90': isOpen }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
        <transition 
            name="slide"
            @enter="startTransition"
            @leave="endTransition"
        >
            <ul v-if="hasChildren && isOpen" class="pl-3 sm:pl-4 border-l-2 border-neutral-200 dark:border-neutral-700 ml-2 sm:ml-3 mt-1 mb-1 space-y-0.5 sm:space-y-1 overflow-hidden">
                <component 
                    :is="$options.name" 
                    v-for="child in category.children" 
                    :key="child.id" 
                    :category="child" 
                />
            </ul>
        </transition>
    </li>
</template>

<script>
import { ref, computed } from 'vue';

export default {
    name: 'CategoryItem',
    props: {
        category: {
            type: Object,
            required: true
        }
    },
    setup(props) {
        const isOpen = ref(false);

        const hasChildren = computed(() => {
            return props.category.children && props.category.children.length > 0;
        });

        const toggle = (event) => {
            event.preventDefault();
            isOpen.value = !isOpen.value;
        };

        // Smooth transition animations
        const startTransition = (el) => {
            el.style.height = '0';
            el.style.overflow = 'hidden';
            el.style.transition = 'height 0.2s ease-out';
            
            // Force a reflow
            void el.offsetHeight;
            
            // Set the height to the target height
            el.style.height = el.scrollHeight + 'px';
        };

        const endTransition = (el) => {
            el.style.height = el.scrollHeight + 'px';
            el.style.overflow = 'hidden';
            el.style.transition = 'height 0.2s ease-out';
            
            // Force a reflow
            void el.offsetHeight;
            
            // Set the height to 0
            el.style.height = '0';
        };

        return {
            isOpen,
            hasChildren,
            toggle,
            startTransition,
            endTransition
        };
    }
};
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease-out;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style> 